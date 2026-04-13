import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme, setLight, setDark, setSystem, isDark } =
    useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] 
                   hover:border-[var(--primary)]/30 transition-all duration-200
                   text-[var(--text)] hover:text-[var(--primary)]"
        aria-label="Toggle theme"
      >
        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* Dropdown for more options */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 py-2 rounded-xl bg-[var(--surface-elevated)] 
                        border border-[var(--border)] shadow-xl z-50"
        >
          <button
            onClick={() => {
              setLight();
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 
                       hover:bg-[var(--surface-hover)] transition-colors
                       ${theme === "light" ? "text-[var(--primary)]" : "text-[var(--text)]"}`}
          >
            <Sun className="w-4 h-4" />
            Light
          </button>
          <button
            onClick={() => {
              setDark();
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 
                       hover:bg-[var(--surface-hover)] transition-colors
                       ${theme === "dark" ? "text-[var(--primary)]" : "text-[var(--text)]"}`}
          >
            <Moon className="w-4 h-4" />
            Dark
          </button>
          <button
            onClick={() => {
              setSystem();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 
                      hover:bg-[var(--surface-hover)] transition-colors text-[var(--text)]"
          >
            <Monitor className="w-4 h-4" />
            System
          </button>
        </div>
      )}
    </div>
  );
}
