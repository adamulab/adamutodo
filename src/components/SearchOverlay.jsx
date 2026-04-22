import { useEffect, useRef } from "react";
import {
  Search,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  ArrowRight,
} from "lucide-react";

const PRIORITY_BADGE = {
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectList,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      // Global shortcut: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (listId) => {
    onSelectList(listId);
    onClose();
  };

  // Group results by list
  const grouped = searchResults.reduce((acc, r) => {
    const key = r.list.id;
    if (!acc[key]) acc[key] = { list: r.list, todos: [] };
    acc[key].todos.push(r.todo);
    return acc;
  }, {});

  const fmtDeadline = (s) =>
    s
      ? new Date(s).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const isOverdue = (todo) =>
    !todo.done && todo.deadline && new Date(todo.deadline) < new Date();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <Search
            className="w-5 h-5 shrink-0"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks and lists…"
            className="flex-1 bg-transparent text-base outline-none"
            style={{ color: "var(--text)" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd
            className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {!searchQuery && (
            <div className="py-12 text-center">
              <Search
                className="w-8 h-8 mx-auto mb-3"
                style={{ color: "var(--text-muted)", opacity: 0.4 }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Type to search across all your tasks
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)", opacity: 0.6 }}
              >
                Searches task names, lists, and priority
              </p>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <div className="py-12 text-center">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                No results for "{searchQuery}"
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)", opacity: 0.6 }}
              >
                Try a different keyword
              </p>
            </div>
          )}

          {Object.values(grouped).map(({ list, todos }) => (
            <div
              key={list.id}
              className="border-b last:border-b-0"
              style={{ borderColor: "var(--border)" }}
            >
              {/* List header */}
              <button
                onClick={() => handleSelect(list.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-[var(--surface-hover)] group"
              >
                <div className="flex items-center gap-2">
                  <ListTodo
                    className="w-4 h-4"
                    style={{ color: "var(--primary)" }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--primary)" }}
                  >
                    {list.title}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "var(--surface-elevated)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {todos.length} match{todos.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <ArrowRight
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--primary)" }}
                />
              </button>

              {/* Matched todos */}
              {todos.map((todo) => {
                const overdue = isOverdue(todo);
                return (
                  <button
                    key={todo.id}
                    onClick={() => handleSelect(list.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 pl-10 transition-colors hover:bg-[var(--surface-hover)] text-left"
                  >
                    {/* Done / overdue indicator */}
                    {todo.done ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : overdue ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    ) : (
                      <div
                        className="w-4 h-4 shrink-0 rounded-full border-2"
                        style={{ borderColor: "var(--text-muted)" }}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${todo.done ? "line-through" : ""}`}
                        style={{
                          color: todo.done
                            ? "var(--text-muted)"
                            : overdue
                              ? "#f87171"
                              : "var(--text)",
                        }}
                      >
                        {todo.text}
                      </p>
                      {todo.deadline && (
                        <p
                          className="text-xs flex items-center gap-1 mt-0.5"
                          style={{
                            color: overdue ? "#f87171" : "var(--text-muted)",
                          }}
                        >
                          <Clock className="w-3 h-3" />
                          {overdue ? "Overdue · " : "Due "}
                          {fmtDeadline(todo.deadline)}
                        </p>
                      )}
                    </div>

                    {todo.priority && todo.priority !== "low" && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg border shrink-0 ${PRIORITY_BADGE[todo.priority]}`}
                      >
                        {todo.priority}
                      </span>
                    )}
                    {todo.recurrence && todo.recurrence !== "none" && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-lg shrink-0"
                        style={{
                          backgroundColor: "var(--surface-elevated)",
                          color: "var(--text-muted)",
                        }}
                      >
                        🔁 {todo.recurrence}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="px-4 py-2.5 border-t flex items-center justify-between"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-elevated)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {searchResults.length > 0
              ? `${searchResults.length} task${searchResults.length !== 1 ? "s" : ""} found`
              : "Search your tasks"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Click a list to open it
          </p>
        </div>
      </div>
    </div>
  );
}
