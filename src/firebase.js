console.log("API Key:", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("Auth Domain:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate config before initializing
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing! Check your .env file");
  console.error("Available env vars:", import.meta.env);
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Only enable persistence if not in private browsing
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn(
      "Multiple tabs open, persistence can only be enabled in one tab at a time.",
    );
  } else if (err.code === "unimplemented") {
    console.warn("Browser doesn't support persistence");
  }
});

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInUser = signInWithGoogle;
export const logoutUser = () => signOut(auth);
export const signOutUser = logoutUser;
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// Firestore helpers
export const getUserRef = (userId) => doc(db, "users", userId);
export const getListsRef = (userId) => collection(db, "users", userId, "lists");
export const getListRef = (userId, listId) =>
  doc(db, "users", userId, "lists", listId);
