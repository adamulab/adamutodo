import { useCallback, useEffect, useRef, useState } from "react";
import { generateId } from "../utils/id";
import { todayKey, addDays } from "../utils/date";
import { firebaseEnabled, getUserDocRef } from "../firebase";

const STORAGE_KEY = "dawn-data";

function seedTasks() {
  const tomorrow = addDays(todayKey(), 1);
  return [
    {
      id: generateId(),
      title: "Plan tonight, live tomorrow",
      notes: "This is how it works: plan tonight, then tomorrow becomes Today automatically.",
      category: "personal",
      date: tomorrow,
      timeBlock: "morning",
      priority: "medium",
      done: false,
      order: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
  ];
}

function emptyState() {
  return {
    tasks: seedTasks(),
    habits: [],
    habitLogs: {}, // { [habitId]: { [dateKey]: true } }
    notes: [],
    shoppingItems: [],
    reflections: {}, // { [dateKey]: { mood, energy, notWon, carriedForward } }
    focusSessions: [], // { id, taskId, taskTitle, date, minutes, completedAt }
    updatedAt: 0,
  };
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function usePlannerData(userId) {
  const initial = loadLocal();
  const [tasks, setTasks] = useState(initial.tasks);
  const [habits, setHabits] = useState(initial.habits);
  const [habitLogs, setHabitLogs] = useState(initial.habitLogs);
  const [notes, setNotes] = useState(initial.notes);
  const [shoppingItems, setShoppingItems] = useState(initial.shoppingItems);
  const [reflections, setReflections] = useState(initial.reflections);
  const [focusSessions, setFocusSessions] = useState(initial.focusSessions || []);
  const [syncStatus, setSyncStatus] = useState("idle");

  const stateRef = useRef({ tasks, habits, habitLogs, notes, shoppingItems, reflections, focusSessions });
  const writeTimer = useRef(null);
  const applyingRemote = useRef(false);

  useEffect(() => {
    stateRef.current = { tasks, habits, habitLogs, notes, shoppingItems, reflections, focusSessions };
  }, [tasks, habits, habitLogs, notes, shoppingItems, reflections, focusSessions]);

  useEffect(() => {
    if (applyingRemote.current) return;
    const payload = { ...stateRef.current, updatedAt: Date.now() };
    saveLocal(payload);

    if (firebaseEnabled && userId) {
      setSyncStatus("syncing");
      clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(async () => {
        try {
          const { setDoc } = await import("firebase/firestore");
          await setDoc(getUserDocRef(userId), payload);
          setSyncStatus("synced");
        } catch (err) {
          console.warn("Dawn: cloud sync failed, staying local-only for now.", err);
          setSyncStatus("error");
        }
      }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, habits, habitLogs, notes, shoppingItems, reflections, focusSessions, userId]);

  useEffect(() => {
    if (!firebaseEnabled || !userId) return;
    let unsub = () => {};
    (async () => {
      const { onSnapshot } = await import("firebase/firestore");
      unsub = onSnapshot(
        getUserDocRef(userId),
        (snap) => {
          if (!snap.exists()) return;
          const remote = snap.data();
          const localUpdatedAt = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").updatedAt ?? 0;
          if ((remote.updatedAt ?? 0) > localUpdatedAt) {
            applyingRemote.current = true;
            const merged = { ...emptyState(), ...remote };
            setTasks(merged.tasks);
            setHabits(merged.habits);
            setHabitLogs(merged.habitLogs);
            setNotes(merged.notes);
            setShoppingItems(merged.shoppingItems);
            setReflections(merged.reflections);
            setFocusSessions(merged.focusSessions);
            saveLocal(merged);
            setTimeout(() => (applyingRemote.current = false), 0);
          }
          setSyncStatus("synced");
        },
        () => setSyncStatus("error"),
      );
    })();
    return () => unsub();
  }, [userId]);

  // ── Tasks ──────────────────────────────────────────────────────────────
  const addTask = useCallback((data) => {
    const task = {
      id: generateId(),
      title: data.title?.trim() || "Untitled task",
      notes: data.notes || "",
      category: data.category || "other",
      date: data.date || todayKey(),
      timeBlock: data.timeBlock || "anytime",
      priority: data.priority || "medium",
      done: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: Date.now(),
    };
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback((id, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : null }
          : t,
      ),
    );
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reorder = useCallback((id, direction, siblingIds) => {
    // siblingIds: ordered array of ids in the same list this task lives in
    setTasks((prev) => {
      const idx = siblingIds.indexOf(id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= siblingIds.length) return prev;
      const a = siblingIds[idx];
      const b = siblingIds[swapIdx];
      const taskA = prev.find((t) => t.id === a);
      const taskB = prev.find((t) => t.id === b);
      if (!taskA || !taskB) return prev;
      const orderA = taskA.order;
      const orderB = taskB.order;
      return prev.map((t) => {
        if (t.id === a) return { ...t, order: orderB };
        if (t.id === b) return { ...t, order: orderA };
        return t;
      });
    });
  }, []);

  // Smart carry-forward: move unfinished tasks from `fromDate` to `toDate`.
  const carryForward = useCallback((fromDate, toDate, mode, selectedIds = []) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.date !== fromDate || t.done) return t;
        if (mode === "all") return { ...t, date: toDate };
        if (mode === "selected" && selectedIds.includes(t.id)) return { ...t, date: toDate };
        return t;
      }),
    );
  }, []);

  // ── Habits ─────────────────────────────────────────────────────────────
  const addHabit = useCallback((data) => {
    const habit = {
      id: generateId(),
      name: data.name?.trim() || "Untitled habit",
      icon: data.icon || "sparkle",
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setHabits((prev) => [...prev, habit]);
    return habit;
  }, []);

  const deleteHabit = useCallback((id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setHabitLogs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const toggleHabitDay = useCallback((habitId, dateKey) => {
    setHabitLogs((prev) => {
      const habitLog = { ...(prev[habitId] || {}) };
      if (habitLog[dateKey]) delete habitLog[dateKey];
      else habitLog[dateKey] = true;
      return { ...prev, [habitId]: habitLog };
    });
  }, []);

  // ── Notes ──────────────────────────────────────────────────────────────
  const addNote = useCallback((data) => {
    const note = {
      id: generateId(),
      text: data.text?.trim() || "",
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback((id, updates) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const deleteNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ── Shopping list ──────────────────────────────────────────────────────
  const addShoppingItem = useCallback((data) => {
    const item = {
      id: generateId(),
      text: data.text?.trim() || "",
      category: data.category || "groceries",
      done: false,
      createdAt: new Date().toISOString(),
    };
    setShoppingItems((prev) => [...prev, item]);
    return item;
  }, []);

  const toggleShoppingItem = useCallback((id) => {
    setShoppingItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }, []);

  const deleteShoppingItem = useCallback((id) => {
    setShoppingItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCheckedShopping = useCallback(() => {
    setShoppingItems((prev) => prev.filter((i) => !i.done));
  }, []);

  // ── Reflections ────────────────────────────────────────────────────────
  const saveReflection = useCallback((dateKey, data) => {
    setReflections((prev) => ({ ...prev, [dateKey]: { ...(prev[dateKey] || {}), ...data } }));
  }, []);

  // ── Focus sessions ─────────────────────────────────────────────────────
  const logFocusSession = useCallback((data) => {
    const session = {
      id: generateId(),
      taskId: data.taskId || null,
      taskTitle: data.taskTitle || "",
      date: todayKey(),
      minutes: data.minutes,
      completedAt: new Date().toISOString(),
    };
    setFocusSessions((prev) => [...prev, session]);
    return session;
  }, []);

  return {
    tasks,
    habits,
    habitLogs,
    notes,
    shoppingItems,
    reflections,
    focusSessions,
    syncStatus,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reorder,
    carryForward,
    addHabit,
    deleteHabit,
    toggleHabitDay,
    addNote,
    updateNote,
    deleteNote,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedShopping,
    saveReflection,
    logFocusSession,
  };
}
