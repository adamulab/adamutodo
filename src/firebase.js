import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager,
  collection,
  doc,
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

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing! Check your .env file");
}

const app = initializeApp(firebaseConfig);

// Try multi-tab persistence first (requires Blaze plan).
// Fall back to single-tab persistence on Spark plan or unsupported browsers.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager(),
      }),
    });
  } catch {
    // Last resort: no persistence (memory only)
    const { getFirestore } = await import("firebase/firestore");
    db = getFirestore(app);
  }
}

export { db };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInUser = signInWithGoogle;
export const logoutUser = () => signOut(auth);
export const signOutUser = logoutUser;
export const onAuthChange = (cb) => onAuthStateChanged(auth, cb);

// Firestore ref helpers
export const getUserRef = (userId) => doc(db, "users", userId);
export const getListsRef = (userId) => collection(db, "users", userId, "lists");
export const getListRef = (userId, listId) =>
  doc(db, "users", userId, "lists", listId);
