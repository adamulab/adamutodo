import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import TaskRow from "./TaskRow";
import EmptyState from "./EmptyState";
import { AreaDot } from "./AreaBadge";
import { getWeekDays, addDays, formatDayLabel, todayKey, isToday } from "../utils/date";

export default function WeekView({ tasks, areas, onToggle, onEdit, onDelete, onAdd }) {
  const [anchor, setAnchor] = useState(todayKey());
  const areasById = useMemo(() => Object.fromEntries(areas.map((a) => [a.id, a])), [areas]);
  const days = useMemo(() => getWeekDays(anchor), [anchor]);

  const tasksByDay = useMemo(() => {
    const map = {};
    for (const day of days) {
      map[day] = tasks
        .filter((t) => t.date === day)
        .sort((a, b) => Number(a.done) - Number(b.done) || a.order - b.order);
    }
    return map;
  }, [days, tasks]);

  const weekLabel = `${formatDayLabel(days[0], { withWeekday: false })} – ${formatDayLabel(days[6], { withWeekday: false })}`;
  const totalThisWeek = days.reduce((sum, d) => sum + tasksByDay[d].length, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <header className="flex items-center justify-between mb-6 gap-3">
        <div>
          <p className="text-sm text-ink-muted mb-1">Week planner</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">{weekLabel}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost !px-2.5" onClick={() => setAnchor((a) => addDays(a, -7))} aria-label="Previous week">
            <ChevronLeft size={17} />
          </button>
          <button className="btn-ghost text-xs" onClick={() => setAnchor(todayKey())}>
            Today
          </button>
          <button className="btn-ghost !px-2.5" onClick={() => setAnchor((a) => addDays(a, 7))} aria-label="Next week">
            <ChevronRight size={17} />
          </button>
        </div>
      </header>

      {totalThisWeek === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="A clean slate this week"
          subtitle="Plan ahead by adding tasks to any day below."
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {days.map((day) => (
          <div
            key={day}
            className="card rounded-2xl p-3 flex flex-col min-h-[140px]"
            style={isToday(day) ? { boxShadow: "0 0 0 1.5px var(--accent)" } : undefined}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                  {formatDayLabel(day).split(",")[0]}
                </p>
                <p className="text-sm font-semibold" style={isToday(day) ? { color: "var(--accent)" } : undefined}>
                  {formatDayLabel(day, { withWeekday: false })}
                </p>
              </div>
              <button
                onClick={() => onAdd({ date: day })}
                className="p-1.5 rounded-full text-ink-faint hover:text-accent hover:bg-accent-soft transition-colors"
                aria-label={`Add task on ${formatDayLabel(day)}`}
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="flex-1">
              <AnimatePresence initial={false}>
                {tasksByDay[day].length === 0 ? (
                  <p className="text-xs text-ink-faint px-1 py-3">No tasks yet</p>
                ) : (
                  tasksByDay[day].map((task) => (
                    <div key={task.id} className="scale-[0.96] origin-left">
                      <TaskRow
                        task={task}
                        area={task.areaId ? areasById[task.areaId] : null}
                        onToggle={onToggle}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {tasksByDay[day].length > 0 && (
              <div className="flex gap-1 flex-wrap px-1 pt-1 mt-1 border-t border-line">
                {[...new Set(tasksByDay[day].filter((t) => t.areaId).map((t) => t.areaId))].map((id) => (
                  <AreaDot key={id} color={areasById[id]?.color} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
