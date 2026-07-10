import { Sunrise, CalendarDays, Target, Plus } from "lucide-react";
import { AreaDot } from "./AreaBadge";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const NAV = [
  { id: "today", label: "Today", icon: Sunrise },
  { id: "week", label: "Week", icon: CalendarDays },
  { id: "areas", label: "Focus areas", icon: Target },
];

export default function Sidebar({
  view,
  onNavigate,
  areas,
  activeAreaId,
  onSelectArea,
  onNewArea,
  syncStatus,
}) {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-line px-4 py-5">
      <div className="flex items-center gap-2 px-2 mb-7">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(155deg, var(--rose), var(--accent) 55%, var(--gold))",
          }}
        >
          <Sunrise size={16} color="#fff" strokeWidth={2.25} />
        </div>
        <span className="font-display text-lg font-semibold">Taskflow</span>
      </div>

      <nav className="flex flex-col gap-0.5 mb-6">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={view === id ? "page" : undefined}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor:
                view === id ? "var(--accent-soft)" : "transparent",
              color: view === id ? "var(--accent-hover)" : "var(--ink-muted)",
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between px-3 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Areas
        </span>
        <button
          onClick={onNewArea}
          aria-label="New focus area"
          className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-surface-hover"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
        {areas.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelectArea(a.id)}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors"
            style={{
              backgroundColor:
                activeAreaId === a.id ? "var(--surface-hover)" : "transparent",
              color: activeAreaId === a.id ? "var(--ink)" : "var(--ink-muted)",
            }}
          >
            <AreaDot color={a.color} />
            <span className="truncate">{a.name}</span>
          </button>
        ))}
        {areas.length === 0 && (
          <p className="text-xs text-ink-faint px-3 py-1">None yet</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-line">
        <UserMenu syncStatus={syncStatus} />
        <ThemeToggle />
      </div>
    </aside>
  );
}
