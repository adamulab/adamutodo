import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Hourglass,
} from "lucide-react";

export default function TodoItem({ todo, list, lists, setLists }) {
  const [isHovered, setIsHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  useEffect(() => {
    if (!todo.deadline || todo.done) {
      setTimeLeft("");
      setIsOverdue(false);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadline = new Date(todo.deadline).getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setIsOverdue(true);
        setTimeLeft("Overdue");
        return;
      }

      setIsOverdue(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [todo.deadline, todo.done]);

  const toggleTodo = () => {
    const updated = lists.map((l) =>
      l.id === list.id
        ? {
            ...l,
            todos: l.todos.map((t) =>
              t.id === todo.id ? { ...t, done: !t.done } : t,
            ),
          }
        : l,
    );
    setLists(updated);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    const updated = lists.map((l) =>
      l.id === list.id
        ? { ...l, todos: l.todos.filter((t) => t.id !== todo.id) }
        : l,
    );
    setLists(updated);
    setShowDeleteConfirm(false);
  };

  const getPriorityStyles = (p) => {
    switch (p) {
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  const getPriorityLabel = (p) => {
    switch (p) {
      case "urgent":
        return "High";
      case "medium":
        return "Med";
      default:
        return "Low";
    }
  };

  const formatDeadline = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${isDragging ? "opacity-50 scale-105 shadow-2xl bg-[var(--surface-elevated)] border-[var(--primary)]/30" : ""} ${isOverdue && !todo.done ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50" : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]/20 hover:bg-[var(--surface-hover)]"}`}
      >
        {/* Drag Handle - hidden on mobile */}
        <div
          {...attributes}
          {...listeners}
          className={`hidden sm:flex cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--surface-hover)] transition-colors ${isHovered || isDragging ? "opacity-100" : "opacity-0"}`}
        >
          <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
        </div>

        {/* Checkbox */}
        <button
          onClick={toggleTodo}
          className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${todo.done ? "bg-[var(--primary)] border-[var(--primary)]" : isOverdue ? "border-red-500 hover:border-red-400" : "border-[var(--text-muted)] hover:border-[var(--primary)]/50"}`}
        >
          {todo.done && (
            <Check className="w-3.5 h-3.5 text-[var(--text-inverse)]" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-sm transition-all duration-300 truncate ${todo.done ? "text-[var(--text-muted)] line-through" : isOverdue ? "text-red-500" : "text-[var(--text)]"}`}
            >
              {todo.text}
            </span>
            {isOverdue && !todo.done && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20 animate-pulse">
                <AlertCircle className="w-3 h-3" />
                OVERDUE
              </span>
            )}
          </div>

          {todo.deadline && (
            <div className="flex items-center gap-3 mt-1.5">
              <div
                className={`flex items-center gap-1.5 text-xs ${isOverdue && !todo.done ? "text-red-500" : "text-[var(--text-muted)]"}`}
              >
                <Clock className="w-3 h-3" />
                <span>{formatDeadline(todo.deadline)}</span>
              </div>
              {!todo.done && timeLeft && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? "text-red-500" : "text-amber-500"}`}
                >
                  <Hourglass className="w-3 h-3" />
                  <span>{timeLeft}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Priority Badge */}
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityStyles(todo.priority)}`}
        >
          {getPriorityLabel(todo.priority)}
        </span>

        {/* Delete Button - Always visible on mobile, hover on desktop */}
        <button
          onClick={handleDeleteClick}
          className={`p-2 rounded-lg transition-all duration-200 md:opacity-0 md:group-hover:opacity-100 opacity-100 hover:bg-red-500/10 hover:text-red-500`}
          style={{ color: "var(--text-muted)" }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in mx-4">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="p-2 bg-red-500/10 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text)]">
                Delete Task
              </h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Are you sure you want to delete "{todo.text}"? This action cannot
              be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text)] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
