import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User, LogOut, Cloud, CloudOff, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function UserMenu({ syncStatus }) {
  const { user, login, logout, syncAvailable } = useAuth();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogin = async () => {
    try {
      await login();
      notify("Signed in — your plan will now sync across devices.", { type: "success" });
    } catch (err) {
      notify(err.message || "Couldn't sign in.", { type: "error" });
    }
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    notify("Signed out. You're back to local-only mode.");
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 hover:bg-surface-hover transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <User size={14} />
          </span>
        )}
        <span className="text-xs font-medium text-ink-muted hidden sm:inline max-w-[100px] truncate">
          {user ? user.displayName?.split(" ")[0] : "Guest"}
        </span>
        <ChevronDown size={13} className="text-ink-faint hidden sm:inline" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 card rounded-xl shadow-raised p-3 z-40"
          >
            <div className="flex items-center gap-2 px-1 pb-2 mb-2 border-b border-line text-xs">
              {syncStatus === "synced" && user ? (
                <Cloud size={13} style={{ color: "var(--teal)" }} />
              ) : (
                <CloudOff size={13} className="text-ink-faint" />
              )}
              <span className="text-ink-muted">
                {user ? "Synced to your account" : "Local-only — nothing leaves this device"}
              </span>
            </div>

            {user ? (
              <>
                <p className="text-sm font-medium px-1 mb-0.5 truncate">{user.displayName}</p>
                <p className="text-xs text-ink-faint px-1 mb-3 truncate">{user.email}</p>
                <button onClick={handleLogout} className="btn-ghost w-full justify-start !px-2 text-sm">
                  <LogOut size={15} /> Sign out
                </button>
              </>
            ) : syncAvailable ? (
              <button onClick={handleLogin} className="btn-accent w-full !py-2 text-sm">
                Sign in to sync
              </button>
            ) : (
              <p className="text-xs text-ink-faint px-1 leading-relaxed">
                Cloud sync isn't configured for this deployment. Your plan is saved on this device only.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
