import { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  signInWithGoogle,
  logoutUser,
  onAuthChange,
  db,
} from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp
              lastLogin: new Date().toISOString(),
            });
          } else {
            await setDoc(
              userRef,
              { lastLogin: new Date().toISOString() },
              { merge: true },
            );
          }
        } catch (error) {
          console.error("Firestore error:", error);
          // Continue even if Firestore fails - user is still authenticated
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
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
