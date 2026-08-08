import { AnimatePresence } from "framer-motion";
import { Sunrise, Sun, Sunset, Moon } from "lucide-react";
import TaskRow from "./TaskRow";

export const TIME_BLOCK_META = {
  morning: { label: "Morning", icon: Sunrise },
  afternoon: { label: "Afternoon", icon: Sun },
  evening: { label: "Evening", icon: Sunset },
  anytime: { label: "Anytime", icon: Moon },
};

export default function TimeBlockSection({ blockId, tasks, onToggle, onEdit, onDelete, onFocus, isCurrent, getReorderHandlers }) {
  const meta = TIME_BLOCK_META[blockId];
  const Icon = meta.icon;
  if (tasks.length === 0) return null;

  return (
    <section className="mb-2">
      <div className="flex items-center gap-2 px-3 mb-1">
        <Icon size={14} style={{ color: isCurrent ? "var(--accent)" : "var(--ink-faint)" }} />
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: isCurrent ? "var(--accent)" : "var(--ink-faint)" }}>
          {meta.label}
        </h3>
        <span className="text-xs text-ink-faint">{tasks.length}</span>
        {isCurrent && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />}
      </div>
      <div>
        <AnimatePresence initial={false}>
          {tasks.map((task) => {
            const handlers = getReorderHandlers ? getReorderHandlers(task, tasks) : {};
            return (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onFocus={onFocus}
                {...handlers}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
