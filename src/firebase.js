// Firebase is entirely optional. Arc works fully offline out of the box
// (local storage only). If you want cross-device sync, add a .env with
// VITE_FIREBASE_* values (see .env.example) — everything below will then
// light up automatically. No config? No problem: firebaseEnabled is false
// and the app quietly stays in local-only "guest" mode.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey);

let app, auth, db, googleProvider;
let signInWithGoogle = async () => {
  throw new Error("Sign-in isn't configured. Arc is running in local-only mode.");
};
let logoutUser = async () => {};
let onAuthChange = (cb) => {
  cb(null);
  return () => {};
};
let getUserDocRef = () => null;

if (firebaseEnabled) {
  // Dynamic-friendly static imports are fine here since this whole module
  // only runs its side effects when a config is actually present.
  const { initializeApp } = await import("firebase/app");
  const {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    doc,
  } = await import("firebase/firestore");
  const {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
  } = await import("firebase/auth");

  app = initializeApp(firebaseConfig);

  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    const { getFirestore } = await import("firebase/firestore");
    db = getFirestore(app);
  }

  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  signInWithGoogle = () => signInWithPopup(auth, googleProvider);
  logoutUser = () => signOut(auth);
  onAuthChange = (cb) => onAuthStateChanged(auth, cb);
  getUserDocRef = (userId) => doc(db, "users", userId, "appData", "state");
}

export { auth, db, googleProvider, signInWithGoogle, logoutUser, onAuthChange, getUserDocRef };
