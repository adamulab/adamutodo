import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, ChevronUp, ChevronDown, Timer } from "lucide-react";
import PriorityDot from "./PriorityDot";
import CategoryBadge from "./CategoryBadge";

export default function TaskRow({ task, onToggle, onEdit, onDelete, onMoveUp, onMoveDown, onFocus, showCategory = true }) {
  const [justCompleted, setJustCompleted] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!task.done) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 500);
    }
    onToggle(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-surface-hover transition-colors"
      onClick={() => onEdit(task)}
    >
      {(onMoveUp || onMoveDown) && (
        <div className="hidden sm:flex flex-col mt-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity">
          <button
            aria-label="Move task up"
            disabled={!onMoveUp}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.();
            }}
            className="text-ink-faint hover:text-ink disabled:opacity-0"
          >
            <ChevronUp size={13} />
          </button>
          <button
            aria-label="Move task down"
            disabled={!onMoveDown}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.();
            }}
            className="text-ink-faint hover:text-ink disabled:opacity-0"
          >
            <ChevronDown size={13} />
          </button>
        </div>
      )}

      <button
        aria-label={task.done ? "Mark task not done" : "Mark task done"}
        aria-pressed={task.done}
        onClick={handleToggle}
        className="relative mt-0.5 shrink-0 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-200 active:scale-90"
        style={{
          borderColor: task.done ? "var(--accent)" : "var(--ink-faint)",
          backgroundColor: task.done ? "var(--accent)" : "transparent",
        }}
      >
        <AnimatePresence>
          {task.done && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Check size={12} strokeWidth={3} color="#fff" />
            </motion.span>
          )}
        </AnimatePresence>
        {justCompleted && (
          <span
            className="absolute inset-0 rounded-full animate-check-burst pointer-events-none"
            style={{ backgroundColor: "var(--accent)" }}
          />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-[15px] leading-snug transition-all duration-200 truncate"
          style={{
            color: task.done ? "var(--ink-faint)" : "var(--ink)",
            textDecoration: task.done ? "line-through" : "none",
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {!task.done && <PriorityDot priority={task.priority} />}
          {showCategory && <CategoryBadge category={task.category} />}
        </div>
      </div>

      {onFocus && !task.done && (
        <button
          aria-label="Start focus timer for this task"
          onClick={(e) => {
            e.stopPropagation();
            onFocus(task);
          }}
          className="shrink-0 mt-0.5 p-1 rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-ink-faint hover:text-accent transition-opacity"
        >
          <Timer size={14} />
        </button>
      )}

      <button
        aria-label="Delete task"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="shrink-0 mt-0.5 p-1 rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-ink-faint hover:text-rose transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
