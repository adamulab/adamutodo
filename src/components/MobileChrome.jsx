import { Sunrise, Moon, ListChecks, StickyNote, BarChart3 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const NAV = [
  { id: "today", label: "Today", icon: Sunrise },
  { id: "tomorrow", label: "Tomorrow", icon: Moon },
  { id: "habits", label: "Habits", icon: ListChecks },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

export function MobileTopBar({ syncStatus }) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 glass-panel">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(155deg, var(--rose), var(--accent) 55%, var(--gold))" }}
        >
          <Moon size={13} color="#fff" strokeWidth={2.25} />
        </div>
        <span className="font-display text-base font-semibold">Dawn</span>
      </div>
      <div className="flex items-center gap-1">
        <UserMenu syncStatus={syncStatus} />
        <ThemeToggle />
      </div>
    </header>
  );
}

export function MobileBottomNav({ view, onNavigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-panel border-t border-line px-1 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-1.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--ink-faint)" }}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[9.5px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
