import { Sunrise, Moon, ListChecks, StickyNote, BarChart3 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const NAV = [
  { id: "today", label: "Today", icon: Sunrise },
  { id: "tomorrow", label: "Tomorrow", icon: Moon },
  { id: "habits", label: "Habits", icon: ListChecks },
  { id: "notes", label: "Notes & Shopping", icon: StickyNote },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

export default function Sidebar({ view, onNavigate, syncStatus }) {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-line px-4 py-5">
      <div className="flex items-center gap-2 px-2 mb-7">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(155deg, var(--rose), var(--accent) 55%, var(--gold))" }}
        >
          <Moon size={15} color="#fff" strokeWidth={2.25} />
        </div>
        <span className="font-display text-lg font-semibold">Dawn</span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={view === id ? "page" : undefined}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === id ? "var(--accent-soft)" : "transparent",
              color: view === id ? "var(--accent-hover)" : "var(--ink-muted)",
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-line">
        <UserMenu syncStatus={syncStatus} />
        <ThemeToggle />
      </div>
    </aside>
  );
}
