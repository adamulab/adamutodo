import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ChevronDown, AlertCircle, Sparkles } from "lucide-react";
import ProgressArc from "./ProgressArc";
import TimeBlockSection from "./TimeBlockSection";
import TaskRow from "./TaskRow";
import EmptyState from "./EmptyState";
import { todayKey, greeting, currentTimeBlock, formatFullDate } from "../utils/date";

const BLOCK_ORDER = ["morning", "afternoon", "evening", "anytime"];

export default function TodayView({ tasks, areas, onToggle, onEdit, onDelete, onAdd }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const today = todayKey();
  const areasById = useMemo(() => Object.fromEntries(areas.map((a) => [a.id, a])), [areas]);
  const nowBlock = currentTimeBlock();

  const todayTasks = tasks.filter((t) => t.date === today);
  const overdue = tasks.filter((t) => t.date && t.date < today && !t.done);

  const incomplete = todayTasks.filter((t) => !t.done);
  const completed = todayTasks.filter((t) => t.done);
  const percent = todayTasks.length ? (completed.length / todayTasks.length) * 100 : 0;

  const byBlock = BLOCK_ORDER.reduce((acc, b) => {
    acc[b] = incomplete.filter((t) => t.timeBlock === b).sort((a, b2) => a.order - b2.order);
    return acc;
  }, {});

  const hasAnything = todayTasks.length > 0 || overdue.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <header className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 mb-8">
        <div className="flex-1">
          <p className="text-sm text-ink-muted mb-1">{formatFullDate(today)}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-balance">
            {greeting()}
            {todayTasks.length > 0 && (
              <span className="text-ink-muted">
                {" "}
                — {completed.length}/{todayTasks.length} done
              </span>
            )}
          </h1>
          {incomplete.length === 0 && todayTasks.length > 0 && (
            <p className="mt-2 text-sm flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
              <Sparkles size={15} /> Everything's done. Nicely played.
            </p>
          )}
        </div>
        <div className="self-center sm:self-auto">
          <ProgressArc percent={percent} label="today" />
        </div>
      </header>

      <button onClick={() => onAdd({ date: today })} className="btn-accent w-full mb-6 py-3" aria-label="Add a task for today">
        <Plus size={17} />
        Add a task
      </button>

      {overdue.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 px-3 mb-1">
            <AlertCircle size={14} style={{ color: "var(--rose)" }} />
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--rose)" }}>
              Overdue
            </h3>
            <span className="text-xs text-ink-faint">{overdue.length}</span>
          </div>
          <div className="rounded-xl" style={{ backgroundColor: "var(--rose-soft)" }}>
            <AnimatePresence initial={false}>
              {overdue.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  area={task.areaId ? areasById[task.areaId] : null}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {!hasAnything && (
        <EmptyState
          icon={Sparkles}
          title="Nothing on the books yet"
          subtitle="Add today's first task to start building momentum."
          action={
            <button onClick={() => onAdd({ date: today })} className="btn-accent">
              <Plus size={16} /> Add a task
            </button>
          }
        />
      )}

      {BLOCK_ORDER.map((block) => (
        <TimeBlockSection
          key={block}
          blockId={block}
          tasks={byBlock[block]}
          areasById={areasById}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          isCurrent={block === nowBlock}
        />
      ))}

      {completed.length > 0 && (
        <section className="mt-4">
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint hover:text-ink-muted transition-colors w-full"
            aria-expanded={showCompleted}
          >
            <motion.span animate={{ rotate: showCompleted ? 0 : -90 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} />
            </motion.span>
            Completed today
            <span>{completed.length}</span>
          </button>
          <AnimatePresence initial={false}>
            {showCompleted && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    area={task.areaId ? areasById[task.areaId] : null}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
