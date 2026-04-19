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

// ─── local storage helpers ───────────────────────────────────────────────────

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

// Only store plain JSON in the queue — never Firestore sentinels
function enqueue(userId, type, data) {
  const queue = getQueue(userId);
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

  // Ref so callbacks always read latest lists without stale closure
  const listsRef = useRef(lists);
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  // Track IDs deleted locally but not yet confirmed by Firestore,
  // so onSnapshot doesn't resurrect them from IndexedDB cache
  const pendingDeletes = useRef(new Set());

  // ── drain offline queue ───────────────────────────────────────────────────
  const drainQueue = useCallback(async (uid) => {
    if (!uid) return;
    const queue = getQueue(uid);
    if (queue.length === 0) return;

    setSyncStatus("syncing");
    const failed = [];

    for (const item of queue) {
      try {
        if (item.type === "save") {
          await setDoc(getListRef(uid, item.data.id), {
            ...item.data,
            updatedAt: new Date().toISOString(),
            syncedAt: serverTimestamp(), // added here, not stored in queue
          });
          pendingDeletes.current.delete(item.data.id);
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

  // ── online / offline listeners ────────────────────────────────────────────
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
  }, [userId, drainQueue]);

  // ── Firestore real-time subscription ─────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setLists([]);
      setLoading(false);
      return;
    }

    // Hydrate from cache instantly so UI isn't blank while Firestore connects
    const cached = getCachedLists(userId);
    if (cached.length > 0) {
      setLists(cached.filter((l) => !pendingDeletes.current.has(l.id)));
    }
    setLoading(false);

    // orderBy on server ensures consistent sort across all devices
    const listsQuery = query(getListsRef(userId), orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(
      listsQuery,
      (snapshot) => {
        const fetched = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // Filter ghost-resurrected items
          .filter((l) => !pendingDeletes.current.has(l.id));

        setLists(fetched);
        setCachedLists(userId, fetched);
        setSyncStatus("synced");

        // Drain any queued writes now we have a live connection
        drainQueue(userId);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        setSyncStatus("error");
        const fallback = getCachedLists(userId);
        setLists(fallback.filter((l) => !pendingDeletes.current.has(l.id)));
      },
    );

    return () => unsubscribe();
  }, [userId, drainQueue]);

  // ── write helper (offline-first) ──────────────────────────────────────────
  const persistList = useCallback(
    async (list) => {
      if (!userId) return;

      const fullList = { ...list, updatedAt: new Date().toISOString() };

      // 1. Optimistic local update — UI responds immediately
      setLists((prev) => {
        const exists = prev.some((l) => l.id === fullList.id);
        const next = exists
          ? prev.map((l) => (l.id === fullList.id ? fullList : l))
          : [fullList, ...prev];
        next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setCachedLists(userId, next);
        return next;
      });

      // 2. Attempt Firestore write; queue if offline or failed
      setSyncStatus("syncing");
      try {
        await setDoc(getListRef(userId, fullList.id), {
          ...fullList,
          syncedAt: serverTimestamp(),
        });
        setSyncStatus("synced");
      } catch (error) {
        console.warn("Firestore write failed, queuing:", error.message);
        // fullList has no Firestore sentinels — safe to JSON-serialize
        enqueue(userId, "save", fullList);
        setSyncStatus(navigator.onLine ? "error" : "synced");
      }
    },
    [userId],
  );

  // ── public API ────────────────────────────────────────────────────────────

  /**
   * Create or update a list.
   * - Pass { title } to create a new list.
   * - Pass a full list object (with id) to update.
   * Returns { error: string } on validation failure, null on success.
   */
  const saveList = useCallback(
    async (listData) => {
      const trimmedTitle = listData.title?.trim();
      if (!trimmedTitle) return { error: "Title is required" };

      // Case-insensitive duplicate check, excluding the list being updated
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
      return null; // null = success
    },
    [persistList],
  );

  const deleteList = useCallback(
    async (listId) => {
      if (!userId) return;

      // Mark pending so snapshot doesn't bring it back before delete confirms
      pendingDeletes.current.add(listId);

      setLists((prev) => {
        const next = prev.filter((l) => l.id !== listId);
        setCachedLists(userId, next);
        return next;
      });

      try {
        await deleteDoc(getListRef(userId, listId));
        pendingDeletes.current.delete(listId);
      } catch (error) {
        console.warn("Delete failed, queuing:", error.message);
        enqueue(userId, "delete", { id: listId });
        // Keep in pendingDeletes until drainQueue confirms the delete
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
