import { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Hourglass,
  Pencil,
  X,
  Save,
  Calendar,
} from "lucide-react";

export default function TodoItem({ todo, listId, onUpdate, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editPriority, setEditPriority] = useState(todo.priority || "medium");
  const [editDeadline, setEditDeadline] = useState(
    todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : "",
  );
  const editInputRef = useRef(null);

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
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

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

      if (days > 0) setTimeLeft(`${days}d ${hours}h left`);
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m left`);
      else setTimeLeft(`${minutes}m left`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [todo.deadline, todo.done]);

  const toggleTodo = async () => {
    await onUpdate(listId, todo.id, { done: !todo.done });
  };

  const startEdit = (e) => {
    e.stopPropagation();
    setEditText(todo.text);
    setEditPriority(todo.priority || "medium");
    setEditDeadline(
      todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : "",
    );
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText(todo.text);
    setEditPriority(todo.priority || "medium");
    setEditDeadline(
      todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : "",
    );
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    await onUpdate(listId, todo.id, {
      text: editText.trim(),
      priority: editPriority,
      deadline: editDeadline || null,
    });
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const confirmDelete = async () => {
    await onDelete(listId, todo.id);
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

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCreatedAt = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border border-[var(--primary)]/30 bg-[var(--surface)] ring-4 ring-[var(--primary)]/5 p-4 space-y-3"
      >
        <input
          ref={editInputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleEditKeyDown}
          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]/50"
          placeholder="Task text..."
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <input
              type="datetime-local"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]/50"
            />
          </div>
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border focus:outline-none cursor-pointer ${getPriorityStyles(editPriority)}`}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={saveEdit}
            disabled={!editText.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-inverse)] transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
          isDragging
            ? "opacity-50 scale-105 shadow-2xl bg-[var(--surface-elevated)] border-[var(--primary)]/30"
            : isOverdue && !todo.done
              ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50"
              : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]/20 hover:bg-[var(--surface-hover)]"
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={`hidden sm:flex cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--surface-hover)] transition-colors ${
            isHovered || isDragging ? "opacity-100" : "opacity-0"
          }`}
        >
          <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
        </div>

        {/* Checkbox */}
        <button
          onClick={toggleTodo}
          className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
            todo.done
              ? "bg-[var(--primary)] border-[var(--primary)]"
              : isOverdue
                ? "border-red-500 hover:border-red-400"
                : "border-[var(--text-muted)] hover:border-[var(--primary)]/50"
          }`}
        >
          {todo.done && (
            <Check className="w-3.5 h-3.5 text-[var(--text-inverse)]" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-sm transition-all duration-300 truncate ${
                todo.done
                  ? "text-[var(--text-muted)] line-through"
                  : isOverdue
                    ? "text-red-500"
                    : "text-[var(--text)]"
              }`}
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

          {/* Dates row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {/* Always show created date */}
            {todo.createdAt && (
              <span className="text-xs text-[var(--text-muted)]">
                Created {formatCreatedAt(todo.createdAt)}
              </span>
            )}
            {/* Deadline if set */}
            {todo.deadline && (
              <div
                className={`flex items-center gap-1.5 text-xs ${
                  isOverdue && !todo.done
                    ? "text-red-500"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Due {formatDate(todo.deadline)}</span>
              </div>
            )}
            {/* Time remaining */}
            {todo.deadline && !todo.done && timeLeft && (
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  isOverdue ? "text-red-500" : "text-amber-500"
                }`}
              >
                <Hourglass className="w-3 h-3" />
                <span>{timeLeft}</span>
              </div>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 ${getPriorityStyles(todo.priority)}`}
        >
          {getPriorityLabel(todo.priority)}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
          <button
            onClick={startEdit}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
            style={{ color: "var(--text-muted)" }}
            title="Edit task"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
            style={{ color: "var(--text-muted)" }}
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl mx-4">
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
