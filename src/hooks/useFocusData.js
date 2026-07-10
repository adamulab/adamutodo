import { useCallback, useEffect, useRef, useState } from "react";
import { generateId } from "../utils/id";
import { todayKey } from "../utils/date";
import { firebaseEnabled, getUserDocRef } from "../firebase";

const STORAGE_KEY = "arc-data";

const DEFAULT_AREAS = [
  { id: "area-work", name: "Work", color: "accent", notes: "", createdAt: new Date().toISOString(), archived: false },
  { id: "area-health", name: "Health", color: "teal", notes: "", createdAt: new Date().toISOString(), archived: false },
  { id: "area-personal", name: "Personal", color: "gold", notes: "", createdAt: new Date().toISOString(), archived: false },
];

function seedTasks() {
  const today = todayKey();
  return [
    {
      id: generateId(),
      title: "Take a look around Arc",
      notes: "Try checking this off — then add your own plan for today.",
      areaId: "area-personal",
      date: today,
      timeBlock: "morning",
      priority: "medium",
      done: false,
      order: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
  ];
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { areas: DEFAULT_AREAS, tasks: seedTasks(), updatedAt: 0 };
    const parsed = JSON.parse(raw);
    return {
      areas: parsed.areas ?? DEFAULT_AREAS,
      tasks: parsed.tasks ?? [],
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch {
    return { areas: DEFAULT_AREAS, tasks: seedTasks(), updatedAt: 0 };
  }
}

function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useFocusData(userId) {
  const [areas, setAreas] = useState(() => loadLocal().areas);
  const [tasks, setTasks] = useState(() => loadLocal().tasks);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error | offline
  const stateRef = useRef({ areas, tasks });
  const writeTimer = useRef(null);
  const applyingRemote = useRef(false);

  useEffect(() => {
    stateRef.current = { areas, tasks };
  }, [areas, tasks]);

  // Persist locally on every change (debounced write to Firestore separately).
  useEffect(() => {
    if (applyingRemote.current) return;
    const payload = { areas, tasks, updatedAt: Date.now() };
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
          console.warn("Arc: cloud sync failed, staying local-only for now.", err);
          setSyncStatus("error");
        }
      }, 600);
    }
  }, [areas, tasks, userId]);

  // Subscribe to remote state when signed in.
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
          const local = stateRef.current;
          const localUpdatedAt = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").updatedAt ?? 0;
          if ((remote.updatedAt ?? 0) > localUpdatedAt) {
            applyingRemote.current = true;
            setAreas(remote.areas ?? local.areas);
            setTasks(remote.tasks ?? local.tasks);
            saveLocal(remote);
            setTimeout(() => (applyingRemote.current = false), 0);
          }
          setSyncStatus("synced");
        },
        () => setSyncStatus("error"),
      );
    })();
    return () => unsub();
  }, [userId]);

  // ── Focus areas ────────────────────────────────────────────────────────
  const addArea = useCallback((data) => {
    const area = {
      id: generateId(),
      name: data.name?.trim() || "Untitled",
      color: data.color || "accent",
      notes: "",
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setAreas((prev) => [...prev, area]);
    return area;
  }, []);

  const updateArea = useCallback((id, updates) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteArea = useCallback((id) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
    setTasks((prev) => prev.map((t) => (t.areaId === id ? { ...t, areaId: null } : t)));
  }, []);

  // ── Tasks ──────────────────────────────────────────────────────────────
  const addTask = useCallback((data) => {
    const task = {
      id: generateId(),
      title: data.title?.trim() || "Untitled task",
      notes: data.notes || "",
      areaId: data.areaId ?? null,
      date: data.date ?? todayKey(),
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

  const moveTask = useCallback((id, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const reorderWithin = useCallback((orderedIds) => {
    setTasks((prev) => {
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
      return prev.map((t) => (orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) } : t));
    });
  }, []);

  return {
    areas,
    tasks,
    syncStatus,
    addArea,
    updateArea,
    deleteArea,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    moveTask,
    reorderWithin,
  };
}
