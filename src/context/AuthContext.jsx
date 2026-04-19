import { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  signInWithGoogle,
  logoutUser,
  onAuthChange,
  db,
} from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        // Set user immediately — don't wait for Firestore
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });

        // Firestore profile write happens in the background
        const userRef = doc(db, "users", firebaseUser.uid);
        getDoc(userRef)
          .then((snap) => {
            if (!snap.exists()) {
              return setDoc(userRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
              });
            } else {
              return setDoc(
                userRef,
                { lastLogin: new Date().toISOString() },
                { merge: true },
              );
            }
          })
          .catch((err) => console.warn("Firestore profile sync error:", err));
      } else {
        setUser(null);
      }

      // Mark auth as resolved right away
      setLoading(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithGoogle();
      return result.user;
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/configuration-not-found") {
        throw new Error(
          "Google Sign-In not configured. Please enable it in Firebase Console.",
        );
      } else if (error.code === "auth/popup-blocked") {
        throw new Error("Popup blocked. Please allow popups for this site.");
      } else {
        throw new Error(`Sign-in failed: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        authChecked,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
