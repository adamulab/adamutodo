import { useEffect, useState, useCallback, useRef } from "react";
import { db, getListsRef, getListRef } from "../firebase";
import {
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getCachedLists(userId) {
  try {
    return JSON.parse(localStorage.getItem(`lists-${userId}`) || "[]");
  } catch {
    return [];
  }
}

function setCachedLists(userId, lists) {
  localStorage.setItem(`lists-${userId}`, JSON.stringify(lists));
}

function getQueue(userId) {
  try {
    return JSON.parse(localStorage.getItem(`sync-queue-${userId}`) || "[]");
  } catch {
    return [];
  }
}

function setQueue(userId, queue) {
  localStorage.setItem(`sync-queue-${userId}`, JSON.stringify(queue));
}

function enqueue(userId, type, data) {
  const queue = getQueue(userId);
  const filtered = queue.filter(
    (item) => !(item.type === type && item.data?.id === data?.id),
  );
  filtered.push({ type, data, timestamp: Date.now() });
  setQueue(userId, filtered);
}

export function useData(userId) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("idle");

  const listsRef = useRef(lists);
  const pendingDeletes = useRef(new Set());
  // KEY FIX: track IDs with in-flight writes so snapshot doesn't overwrite them
  const pendingWrites = useRef(new Set());

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  // ── drain offline queue ───────────────────────────────────────────────────
  const drainQueue = useCallback(async (uid) => {
    if (!uid) return;
    const queue = getQueue(uid);
    if (!queue.length) return;

    setSyncStatus("syncing");
    const failed = [];

    for (const item of queue) {
      try {
        if (item.type === "save") {
          await setDoc(getListRef(uid, item.data.id), {
            ...item.data,
            updatedAt: new Date().toISOString(),
            syncedAt: serverTimestamp(),
          });
          pendingWrites.current.delete(item.data.id);
        } else if (item.type === "delete") {
          await deleteDoc(getListRef(uid, item.data.id));
          pendingDeletes.current.delete(item.data.id);
        }
      } catch (err) {
        console.warn("Queue drain failed:", item, err);
        failed.push(item);
      }
    }

    setQueue(uid, failed);
    setSyncStatus(failed.length === 0 ? "synced" : "error");
  }, []);

  // ── online / offline ──────────────────────────────────────────────────────
  useEffect(() => {
    const up = () => {
      setIsOnline(true);
      drainQueue(userId);
    };
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [userId, drainQueue]);

  // ── Firestore subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setLists([]);
      setLoading(false);
      return;
    }

    const cached = getCachedLists(userId);
    if (cached.length)
      setLists(cached.filter((l) => !pendingDeletes.current.has(l.id)));
    setLoading(false);

    const q = query(getListsRef(userId), orderBy("updatedAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const fetched = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((l) => !pendingDeletes.current.has(l.id));

        // Don't overwrite lists that have an in-flight optimistic write
        setLists((prev) => {
          const merged = fetched.map((remote) =>
            pendingWrites.current.has(remote.id)
              ? (prev.find((p) => p.id === remote.id) ?? remote)
              : remote,
          );
          setCachedLists(userId, merged);
          return merged;
        });

        setSyncStatus("synced");
        drainQueue(userId);
      },
      (err) => {
        console.error("Snapshot error:", err);
        setSyncStatus("error");
        const fb = getCachedLists(userId);
        setLists(fb.filter((l) => !pendingDeletes.current.has(l.id)));
      },
    );

    return () => unsub();
  }, [userId, drainQueue]);

  // ── write helper ──────────────────────────────────────────────────────────
  const persistList = useCallback(
    async (list) => {
      if (!userId) return;

      const fullList = { ...list, updatedAt: new Date().toISOString() };

      // Mark as in-flight BEFORE optimistic update
      pendingWrites.current.add(fullList.id);

      setLists((prev) => {
        const exists = prev.some((l) => l.id === fullList.id);
        const next = exists
          ? prev.map((l) => (l.id === fullList.id ? fullList : l))
          : [fullList, ...prev];
        next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setCachedLists(userId, next);
        return next;
      });

      setSyncStatus("syncing");
      try {
        await setDoc(getListRef(userId, fullList.id), {
          ...fullList,
          syncedAt: serverTimestamp(),
        });
        // Write confirmed — safe to let snapshots overwrite again
        pendingWrites.current.delete(fullList.id);
        setSyncStatus("synced");
      } catch (err) {
        console.warn("Write failed, queuing:", err.message);
        enqueue(userId, "save", fullList);
        // Keep in pendingWrites so offline cache stays authoritative
        setSyncStatus(navigator.onLine ? "error" : "synced");
      }
    },
    [userId],
  );

  // ── public API ────────────────────────────────────────────────────────────

  /** Returns null on success, { error } on validation failure */
  const saveList = useCallback(
    async (listData) => {
      const trimmedTitle = listData.title?.trim();
      if (!trimmedTitle) return { error: "Title is required" };

      const isDuplicate = listsRef.current.some(
        (l) =>
          l.title.trim().toLowerCase() === trimmedTitle.toLowerCase() &&
          l.id !== listData.id,
      );
      if (isDuplicate) return { error: "A list with that name already exists" };

      const isNew = !listData.id;
      const list = isNew
        ? {
            ...listData,
            title: trimmedTitle,
            id: generateId(),
            todos: [],
            createdAt: new Date().toISOString(),
          }
        : { ...listData, title: trimmedTitle };

      await persistList(list);
      return null;
    },
    [persistList],
  );

  const deleteList = useCallback(
    async (listId) => {
      if (!userId) return;
      pendingDeletes.current.add(listId);
      setLists((prev) => {
        const next = prev.filter((l) => l.id !== listId);
        setCachedLists(userId, next);
        return next;
      });
      try {
        await deleteDoc(getListRef(userId, listId));
        pendingDeletes.current.delete(listId);
      } catch (err) {
        console.warn("Delete failed, queuing:", err.message);
        enqueue(userId, "delete", { id: listId });
      }
    },
    [userId],
  );

  const saveTodo = useCallback(
    async (listId, todoData) => {
      const list = listsRef.current.find((l) => l.id === listId);
      if (!list) return;
      const todo = {
        ...todoData,
        id: todoData.id ?? generateId(),
        createdAt: todoData.createdAt ?? new Date().toISOString(),
      };
      await persistList({ ...list, todos: [...(list.todos || []), todo] });
    },
    [persistList],
  );

  const updateTodo = useCallback(
    async (listId, todoId, updates) => {
      const list = listsRef.current.find((l) => l.id === listId);
      if (!list) return;
      const updatedTodos = (list.todos || []).map((t) =>
        t.id === todoId ? { ...t, ...updates } : t,
      );
      await persistList({ ...list, todos: updatedTodos });
    },
    [persistList],
  );

  const deleteTodo = useCallback(
    async (listId, todoId) => {
      const list = listsRef.current.find((l) => l.id === listId);
      if (!list) return;
      await persistList({
        ...list,
        todos: (list.todos || []).filter((t) => t.id !== todoId),
      });
    },
    [persistList],
  );

  const reorderTodos = useCallback(
    async (listId, reorderedTodos) => {
      const list = listsRef.current.find((l) => l.id === listId);
      if (!list) return;
      await persistList({ ...list, todos: reorderedTodos });
    },
    [persistList],
  );

  return {
    lists,
    loading,
    isOnline,
    syncStatus,
    saveList,
    deleteList,
    saveTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
  };
}
