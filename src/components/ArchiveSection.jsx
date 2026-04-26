import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ArchiveSection({
  archivedTodos = [],
  listId,
  onUnarchive,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  if (!archivedTodos.length) return null;

  return (
    <div
      className="mt-6 border-t pt-4"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          Completed
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-muted)",
          }}
        >
          {archivedTodos.length}
        </span>
        <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
          {open ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-2">
          {archivedTodos.map((todo) => (
            <div
              key={todo.id}
              onMouseEnter={() => setHoveredId(todo.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="flex items-start gap-3 px-4 py-3 rounded-2xl border transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                opacity: 0.75,
              }}
            >
              {/* Done checkmark */}
              <div
                className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "var(--primary)",
                  border: "2px solid var(--primary)",
                }}
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="var(--text-inverse)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm line-through leading-snug"
                  style={{ color: "var(--text-muted)" }}
                >
                  {todo.text}
                </p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {todo.archivedAt && (
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Clock className="w-3 h-3" />
                      Completed {fmtDate(todo.archivedAt)}
                    </span>
                  )}
                  {todo.deadline && (
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Was due {fmtDate(todo.deadline)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions — visible on hover */}
              <div
                className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-150 ${
                  hoveredId === todo.id ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={() => onUnarchive(listId, todo.id)}
                  className="p-1.5 rounded-xl transition-colors hover:bg-[var(--primary)]/10"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--primary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                  title="Restore task"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(listId, todo.id)}
                  className="p-1.5 rounded-xl transition-colors hover:bg-red-500/10"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#f87171")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                  title="Delete permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
