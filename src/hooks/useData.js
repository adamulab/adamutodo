import { useEffect, useState, useCallback } from "react";
import { db, getListsRef, getListRef } from "../firebase";
import {
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export function useData(userId) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("idle");

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Subscribe to user's lists
  useEffect(() => {
    if (!userId) {
      setLists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const listsRef = getListsRef(userId);

    const unsubscribe = onSnapshot(
      listsRef,
      (snapshot) => {
        const userLists = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        setLists(userLists);
        setLoading(false);
        setSyncStatus("synced");

        // Cache for offline use
        localStorage.setItem(`lists-${userId}`, JSON.stringify(userLists));
      },
      (error) => {
        console.error("Sync error:", error);
        setSyncStatus("error");
        // Load from cache if available
        const cached = localStorage.getItem(`lists-${userId}`);
        if (cached) {
          setLists(JSON.parse(cached));
        }
        setLoading(false);
      },
    );

    // Load cached data immediately while waiting for network
    const cached = localStorage.getItem(`lists-${userId}`);
    if (cached && lists.length === 0) {
      setLists(JSON.parse(cached));
      setLoading(false);
    }

    return () => unsubscribe();
  }, [userId]);

  const saveList = useCallback(
    async (list) => {
      if (!userId) return;

      setSyncStatus("syncing");
      try {
        const listRef = getListRef(userId, list.id);
        await setDoc(listRef, {
          ...list,
          updatedAt: new Date().toISOString(),
          syncedAt: serverTimestamp(),
        });
        setSyncStatus("synced");
      } catch (error) {
        console.error("Save error:", error);
        setSyncStatus("error");
        // Queue for retry
        queueOfflineChange(userId, "save", list);
      }
    },
    [userId],
  );

  const deleteList = useCallback(
    async (listId) => {
      if (!userId) return;

      try {
        await deleteDoc(getListRef(userId, listId));
        // Update local cache
        const cached = JSON.parse(
          localStorage.getItem(`lists-${userId}`) || "[]",
        );
        const updated = cached.filter((l) => l.id !== listId);
        localStorage.setItem(`lists-${userId}`, JSON.stringify(updated));
      } catch (error) {
        queueOfflineChange(userId, "delete", { id: listId });
      }
    },
    [userId],
  );

  const saveTodo = useCallback(
    async (listId, todo) => {
      if (!userId) return;

      const list = lists.find((l) => l.id === listId);
      if (!list) return;

      const updatedTodos = [...list.todos, todo];
      await saveList({ ...list, todos: updatedTodos });
    },
    [lists, userId, saveList],
  );

  const updateTodo = useCallback(
    async (listId, todoId, updates) => {
      if (!userId) return;

      const list = lists.find((l) => l.id === listId);
      if (!list) return;

      const updatedTodos = list.todos.map((t) =>
        t.id === todoId ? { ...t, ...updates } : t,
      );
      await saveList({ ...list, todos: updatedTodos });
    },
    [lists, userId, saveList],
  );

  const deleteTodo = useCallback(
    async (listId, todoId) => {
      if (!userId) return;

      const list = lists.find((l) => l.id === listId);
      if (!list) return;

      const updatedTodos = list.todos.filter((t) => t.id !== todoId);
      await saveList({ ...list, todos: updatedTodos });
    },
    [lists, userId, saveList],
  );

  const reorderTodos = useCallback(
    async (listId, reorderedTodos) => {
      if (!userId) return;

      const list = lists.find((l) => l.id === listId);
      if (!list) return;

      await saveList({ ...list, todos: reorderedTodos });
    },
    [lists, userId, saveList],
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

// Offline queue helper
function queueOfflineChange(userId, type, data) {
  const key = `sync-queue-${userId}`;
  const queue = JSON.parse(localStorage.getItem(key) || "[]");
  queue.push({ type, data, timestamp: Date.now() });
  localStorage.setItem(key, JSON.stringify(queue));
}
