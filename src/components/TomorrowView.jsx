import { AnimatePresence } from "framer-motion";
import { Plus, Moon, ChevronRight } from "lucide-react";
import TaskRow from "./TaskRow";
import EmptyState from "./EmptyState";
import SleepPlanner from "./SleepPlanner";
import { TIME_BLOCK_META } from "./TimeBlockSection";
import { todayKey, addDays, formatFullDate } from "../utils/date";

const BLOCK_ORDER = ["morning", "afternoon", "evening", "anytime"];

export default function TomorrowView({ tasks, onToggle, onEdit, onDelete, onAdd, onReorder }) {
  const tomorrow = addDays(todayKey(), 1);
  const tomorrowTasks = tasks.filter((t) => t.date === tomorrow);

  const byBlock = BLOCK_ORDER.reduce((acc, b) => {
    acc[b] = tomorrowTasks.filter((t) => t.timeBlock === b).sort((a, b2) => a.order - b2.order);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <header className="mb-6">
        <p className="text-sm text-ink-muted mb-1 flex items-center gap-1.5">
          <Moon size={13} /> Plan tonight, live tomorrow
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-balance">Tomorrow</h1>
        <p className="text-sm text-ink-muted mt-1">{formatFullDate(tomorrow)}</p>
      </header>

      <button onClick={() => onAdd({ date: tomorrow })} className="btn-accent w-full mb-6 py-3">
        <Plus size={17} />
        Add a task for tomorrow
      </button>

      <SleepPlanner tomorrowTasks={tomorrowTasks} />

      {tomorrowTasks.length === 0 ? (
        <EmptyState
          icon={Moon}
          title="Tomorrow is wide open"
          subtitle="Add a few tasks now so tomorrow starts with a plan instead of a blank page."
          action={
            <button onClick={() => onAdd({ date: tomorrow })} className="btn-accent">
              <Plus size={16} /> Add a task
            </button>
          }
        />
      ) : (
        BLOCK_ORDER.map((block) => {
          const blockTasks = byBlock[block];
          if (blockTasks.length === 0) return null;
          const meta = TIME_BLOCK_META[block];
          const Icon = meta.icon;
          const ids = blockTasks.map((t) => t.id);
          return (
            <section key={block} className="mb-2">
              <div className="flex items-center gap-2 px-3 mb-1">
                <Icon size={14} className="text-ink-faint" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{meta.label}</h3>
                <span className="text-xs text-ink-faint">{blockTasks.length}</span>
              </div>
              <AnimatePresence initial={false}>
                {blockTasks.map((task, i) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMoveUp={i > 0 ? () => onReorder(task.id, -1, ids) : null}
                    onMoveDown={i < ids.length - 1 ? () => onReorder(task.id, 1, ids) : null}
                  />
                ))}
              </AnimatePresence>
            </section>
          );
        })
      )}

      <div className="mt-8 rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: "var(--surface-hover)" }}>
        <ChevronRight size={16} className="text-ink-faint shrink-0" />
        <p className="text-xs text-ink-muted">
          Tomorrow's plan automatically becomes your Today view when the date rolls over — nothing to migrate manually.
        </p>
      </div>
    </div>
  );
}
