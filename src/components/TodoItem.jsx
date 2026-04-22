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
  RefreshCw,
} from "lucide-react";

const PRIORITY = {
  urgent: {
    label: "Urgent",
    style: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  medium: {
    label: "Medium",
    style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  low: {
    label: "Low",
    style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

const RECURRENCE_LABELS = {
  none: "No repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function TodoItem({ todo, listId, onUpdate, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editPriority, setEditPriority] = useState(todo.priority || "medium");
  const [editDeadline, setEditDeadline] = useState(
    todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : "",
  );
  const [editRecurrence, setEditRecurrence] = useState(
    todo.recurrence || "none",
  );
  const textRef = useRef(null);

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
    if (isEditing) textRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (!todo.deadline || todo.done) {
      setTimeLeft("");
      setIsOverdue(false);
      return;
    }
    const calc = () => {
      const diff = new Date(todo.deadline).getTime() - Date.now();
      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft("Overdue");
        return;
      }
      setIsOverdue(false);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(
        d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`,
      );
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [todo.deadline, todo.done]);

  const openEdit = (e) => {
    e.stopPropagation();
    setEditText(todo.text);
    setEditPriority(todo.priority || "medium");
    setEditDeadline(
      todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : "",
    );
    setEditRecurrence(todo.recurrence || "none");
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    if (!editText.trim()) return;
    await onUpdate(listId, todo.id, {
      text: editText.trim(),
      priority: editPriority,
      deadline: editDeadline || null,
      recurrence: editRecurrence,
    });
    setIsEditing(false);
  };

  const fmtDate = (s) =>
    s
      ? new Date(s).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;
  const fmtDeadline = (s) =>
    s
      ? new Date(s).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const p = PRIORITY[todo.priority] || PRIORITY.low;
  const hasRecurrence = todo.recurrence && todo.recurrence !== "none";

  // ── EDIT MODE ─────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--primary)",
          boxShadow: "0 0 0 3px var(--primary-muted)",
        }}
        className="rounded-2xl p-4 space-y-3 shadow-lg"
      >
        <textarea
          ref={textRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              saveEdit();
            }
            if (e.key === "Escape") cancelEdit();
          }}
          rows={2}
          className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          placeholder="Task description…"
        />

        {/* Deadline */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
          }}
        >
          <Calendar
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="datetime-local"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            className="flex-1 text-xs outline-none bg-transparent"
            style={{ color: "var(--text)" }}
          />
        </div>

        {/* Priority + Recurrence */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none cursor-pointer ${PRIORITY[editPriority]?.style}`}
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={editRecurrence}
            onChange={(e) => setEditRecurrence(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none cursor-pointer"
            style={{
              backgroundColor: "var(--surface-elevated)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            <option value="none">No repeat</option>
            <option value="daily">Repeat daily</option>
            <option value="weekly">Repeat weekly</option>
            <option value="monthly">Repeat monthly</option>
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={saveEdit}
            disabled={!editText.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--text-inverse)",
            }}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW MODE ─────────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 ${
          isDragging
            ? "opacity-50 scale-[1.02] shadow-2xl"
            : isOverdue && !todo.done
              ? "border-red-500/30 bg-red-500/5"
              : todo.done
                ? "opacity-60"
                : ""
        }`}
        style={
          !isDragging
            ? {
                backgroundColor: "var(--surface)",
                borderColor:
                  isOverdue && !todo.done ? undefined : "var(--border)",
              }
            : {}
        }
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={`hidden sm:flex cursor-grab active:cursor-grabbing p-1 rounded-lg transition-all ${isHovered || isDragging ? "opacity-100" : "opacity-0"}`}
        >
          <GripVertical
            className="w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onUpdate(listId, todo.id, { done: !todo.done })}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
            todo.done
              ? "border-[var(--primary)] bg-[var(--primary)]"
              : isOverdue
                ? "border-red-400"
                : "border-[var(--text-muted)] hover:border-[var(--primary)]"
          }`}
        >
          {todo.done && (
            <Check
              className="w-3 h-3"
              style={{ color: "var(--text-inverse)" }}
            />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-sm font-medium truncate transition-all duration-200 ${todo.done ? "line-through" : ""}`}
              style={{
                color: todo.done
                  ? "var(--text-muted)"
                  : isOverdue
                    ? "#f87171"
                    : "var(--text)",
              }}
            >
              {todo.text}
            </p>
            {/* Recurrence badge */}
            {hasRecurrence && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: "var(--surface-elevated)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                <RefreshCw className="w-2.5 h-2.5" />
                {RECURRENCE_LABELS[todo.recurrence]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {todo.createdAt && (
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {fmtDate(todo.createdAt)}
              </span>
            )}
            {todo.deadline && (
              <span
                className={`flex items-center gap-1 text-[11px] ${isOverdue && !todo.done ? "text-red-400" : ""}`}
                style={
                  !isOverdue || todo.done ? { color: "var(--text-muted)" } : {}
                }
              >
                <Clock className="w-3 h-3" />
                Due {fmtDeadline(todo.deadline)}
              </span>
            )}
            {todo.deadline && !todo.done && timeLeft && (
              <span
                className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? "text-red-400" : "text-amber-400"}`}
              >
                <Hourglass className="w-3 h-3" />
                {timeLeft}
              </span>
            )}
            {isOverdue && !todo.done && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(239,68,68,0.15)",
                  color: "#f87171",
                }}
              >
                <AlertCircle className="w-3 h-3" />
                OVERDUE
              </span>
            )}
          </div>
        </div>

        {/* Priority badge */}
        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border shrink-0 ${p.style}`}
        >
          {p.label}
        </span>

        {/* Actions */}
        <div
          className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-150 opacity-100 md:opacity-0 group-hover:opacity-100`}
        >
          <button
            onClick={openEdit}
            className="p-1.5 rounded-xl transition-colors hover:bg-[var(--primary)]/10"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDelete(true);
            }}
            className="p-1.5 rounded-xl transition-colors hover:bg-red-500/10"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="rounded-2xl border p-6 max-w-sm w-full shadow-2xl mx-4"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                Delete task?
              </h3>
            </div>
            <p
              className="text-sm mb-5 leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              "<span style={{ color: "var(--text)" }}>{todo.text}</span>" will
              be permanently removed.
              {hasRecurrence && " The recurring schedule will also be removed."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--surface-elevated)",
                  color: "var(--text)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--surface-elevated)")
                }
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDelete(listId, todo.id);
                  setShowDelete(false);
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#ef4444" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#dc2626")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ef4444")
                }
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
