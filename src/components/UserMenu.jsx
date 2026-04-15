import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, ChevronDown } from "lucide-react";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
      >
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="w-8 h-8 rounded-full border-2 border-[var(--border)]"
        />
        <span className="hidden sm:block text-sm font-medium text-[var(--text)] max-w-[120px] truncate">
          {user.displayName}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-xl z-50 py-2">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--text)]">
              {user.displayName}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {user.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
