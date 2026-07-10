// Firebase is optional. If no VITE_FIREBASE_* variables are present,
// the app runs entirely in local-only mode.

import { initializeApp } from "firebase/app";

import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
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

export const firebaseEnabled = Boolean(firebaseConfig.apiKey);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

let signInWithGoogle = async () => {
  throw new Error(
    "Sign-in isn't configured. Arc is running in local-only mode.",
  );
};

let logoutUser = async () => {};

let onAuthChange = (cb) => {
  cb(null);
  return () => {};
};

let getUserDocRef = () => null;

if (firebaseEnabled) {
  app = initializeApp(firebaseConfig);

  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (error) {
    console.warn(
      "Firestore persistence could not be enabled. Falling back:",
      error,
    );

    db = getFirestore(app);
  }

  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  signInWithGoogle = () => signInWithPopup(auth, googleProvider);

  logoutUser = () => signOut(auth);

  onAuthChange = (cb) => onAuthStateChanged(auth, cb);

  getUserDocRef = (userId) => doc(db, "users", userId, "appData", "state");
}

export {
  app,
  auth,
  db,
  googleProvider,
  signInWithGoogle,
  logoutUser,
  onAuthChange,
  getUserDocRef,
};
