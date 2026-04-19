import { useEffect, useState, useCallback, useRef } from "react";
import { db, getListsRef, getListRef } from "../firebase";
import {
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// ─── helpers ────────────────────────────────────────────────────────────────

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
  // Deduplicate: replace existing entry for same list id + type
  const filtered = queue.filter(
    (item) => !(item.type === type && item.data?.id === data?.id),
  );
  filtered.push({ type, data, timestamp: Date.now() });
  setQueue(userId, filtered);
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useData(userId) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("idle");

  // Keep a ref so callbacks always see the latest lists without re-creating
  const listsRef = useRef(lists);
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  // ── online / offline events ────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      drainQueue(userId);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userId]);

  // ── drain queue when we come back online ──────────────────────────────────
  const drainQueue = useCallback(async (uid) => {
    if (!uid) return;
    const queue = getQueue(uid);
    if (queue.length === 0) return;

    setSyncStatus("syncing");
    const failed = [];

    for (const item of queue) {
      try {
        if (item.type === "save") {
          const ref = getListRef(uid, item.data.id);
          await setDoc(ref, {
            ...item.data,
            updatedAt: new Date().toISOString(),
            syncedAt: serverTimestamp(),
          });
        } else if (item.type === "delete") {
          await deleteDoc(getListRef(uid, item.data.id));
        }
      } catch (err) {
        console.warn("Queue drain failed for item:", item, err);
        failed.push(item);
      }
    }

    setQueue(uid, failed);
    setSyncStatus(failed.length === 0 ? "synced" : "error");
  }, []);

  // ── Firestore real-time subscription ──────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setLists([]);
      setLoading(false);
      return;
    }

    // Show cached data immediately
    const cached = getCachedLists(userId);
    if (cached.length > 0) {
      setLists(cached);
      setLoading(false);
    }

    const ref = getListsRef(userId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const fetched = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        setLists(fetched);
        setCachedLists(userId, fetched);
        setLoading(false);
        setSyncStatus("synced");

        // Drain any queued offline writes now that we have a connection
        drainQueue(userId);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        setSyncStatus("error");
        // Fall back to cache
        const fallback = getCachedLists(userId);
        setLists(fallback);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId, drainQueue]);

  // ── write helper (offline-first) ──────────────────────────────────────────
  const persistList = useCallback(
    async (list) => {
      if (!userId) return;

      const now = new Date().toISOString();
      const fullList = { ...list, updatedAt: now };

      // 1. Update local state immediately
      setLists((prev) => {
        const exists = prev.some((l) => l.id === fullList.id);
        const next = exists
          ? prev.map((l) => (l.id === fullList.id ? fullList : l))
          : [fullList, ...prev];
        setCachedLists(userId, next);
        return next;
      });

      // 2. Try Firestore — queue if offline or failed
      setSyncStatus("syncing");
      try {
        const ref = getListRef(userId, fullList.id);
        await setDoc(ref, {
          ...fullList,
          syncedAt: serverTimestamp(),
        });
        setSyncStatus("synced");
      } catch (error) {
        console.warn("Firestore write failed, queuing:", error);
        setSyncStatus(navigator.onLine ? "error" : "synced"); // show synced when offline (queued)
        enqueue(userId, "save", fullList);
      }
    },
    [userId],
  );

  // ── public API ─────────────────────────────────────────────────────────────

  /** Create or update a list. Pass { title } for a new list; pass the full list object to update. */
  const saveList = useCallback(
    async (listData) => {
      const isNew = !listData.id;
      const list = isNew
        ? {
            ...listData,
            id: generateId(),
            todos: listData.todos ?? [],
            createdAt: new Date().toISOString(),
          }
        : listData;

      await persistList(list);
      return list; // return so callers can get the id if needed
    },
    [persistList],
  );

  const deleteList = useCallback(
    async (listId) => {
      if (!userId) return;

      // Optimistic local removal
      setLists((prev) => {
        const next = prev.filter((l) => l.id !== listId);
        setCachedLists(userId, next);
        return next;
      });

      try {
        await deleteDoc(getListRef(userId, listId));
      } catch (error) {
        console.warn("Delete failed, queuing:", error);
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

      const updatedTodos = (list.todos || []).filter((t) => t.id !== todoId);
      await persistList({ ...list, todos: updatedTodos });
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
