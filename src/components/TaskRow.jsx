import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, GripVertical } from "lucide-react";
import PriorityDot from "./PriorityDot";
import AreaBadge from "./AreaBadge";

export default function TaskRow({ task, area, onToggle, onEdit, onDelete, dragHandleProps }) {
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
      {dragHandleProps && (
        <span
          {...dragHandleProps}
          className="mt-1 cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity hidden sm:block"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </span>
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
        {(area || task.priority) && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {!task.done && <PriorityDot priority={task.priority} />}
            {area && <AreaBadge area={area} />}
          </div>
        )}
      </div>

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
