import { useEffect, useState } from "react";
import { db, signInUser, signOutUser, onAuthChange } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export function useSync() {
  const [userId, setUserId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle, syncing, error

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

  // Auth setup
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInUser();
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to lists from cloud
  const subscribeToLists = (callback) => {
    if (!userId) return () => {};

    const listsRef = collection(db, "users", userId, "lists");

    return onSnapshot(
      listsRef,
      (snapshot) => {
        const lists = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(lists);
      },
      (error) => {
        console.error("Sync error:", error);
        setSyncStatus("error");
      },
    );
  };

  // Save list to cloud
  const saveList = async (list) => {
    if (!userId || !isOnline) {
      // Queue for later sync
      queueOfflineChange("save", list);
      return;
    }

    setSyncStatus("syncing");
    try {
      const listRef = doc(db, "users", userId, "lists", list.id.toString());
      await setDoc(listRef, {
        ...list,
        updatedAt: new Date().toISOString(),
      });
      setSyncStatus("idle");
    } catch (error) {
      console.error("Save error:", error);
      setSyncStatus("error");
      queueOfflineChange("save", list);
    }
  };

  // Delete list from cloud
  const deleteList = async (listId) => {
    if (!userId || !isOnline) {
      queueOfflineChange("delete", { id: listId });
      return;
    }

    try {
      await deleteDoc(doc(db, "users", userId, "lists", listId.toString()));
    } catch (error) {
      queueOfflineChange("delete", { id: listId });
    }
  };

  // Batch sync for offline changes
  const syncOfflineChanges = async () => {
    const queue = JSON.parse(localStorage.getItem("sync-queue") || "[]");
    if (!queue.length || !userId || !isOnline) return;

    setSyncStatus("syncing");
    const batch = writeBatch(db);

    queue.forEach(({ type, data }) => {
      const ref = doc(db, "users", userId, "lists", data.id.toString());
      if (type === "save") {
        batch.set(ref, { ...data, updatedAt: new Date().toISOString() });
      } else if (type === "delete") {
        batch.delete(ref);
      }
    });

    try {
      await batch.commit();
      localStorage.removeItem("sync-queue");
      setSyncStatus("idle");
    } catch (error) {
      setSyncStatus("error");
    }
  };

  // Queue changes when offline
  const queueOfflineChange = (type, data) => {
    const queue = JSON.parse(localStorage.getItem("sync-queue") || "[]");
    queue.push({ type, data, timestamp: Date.now() });
    localStorage.setItem("sync-queue", JSON.stringify(queue));
  };

  // Attempt sync when coming back online
  useEffect(() => {
    if (isOnline && userId) {
      syncOfflineChanges();
    }
  }, [isOnline, userId]);

  return {
    userId,
    isOnline,
    syncStatus,
    subscribeToLists,
    saveList,
    deleteList,
    syncOfflineChanges,
  };
}
