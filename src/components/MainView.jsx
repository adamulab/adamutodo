import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Menu,
  Sparkles,
  Calendar,
  ArrowLeft,
  ListTodo,
  AlertCircle,
  CheckCircle2,
  Circle,
  X,
  Trash2,
  Loader2,
  Pencil,
  Check,
  LayoutGrid,
} from "lucide-react";
import TodoItem from "./TodoItem";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import AdUnit from "./AdUnit";

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="rounded-2xl border p-6 max-w-sm w-full shadow-2xl"
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
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="font-semibold" style={{ color: "var(--text)" }}>
            {title}
          </h3>
        </div>
        <p
          className="text-sm mb-5 leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {message}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--surface-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--surface-elevated)")
            }
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
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
  );
}

// ── List card ─────────────────────────────────────────────────────────────────
function ListCard({ l, stats, onSelect, onDelete, onUpdate }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(l.title);
  const [renameErr, setRenameErr] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const startRename = (e) => {
    e.stopPropagation();
    setTitle(l.title);
    setRenameErr("");
    setRenaming(true);
  };
  const cancelRename = (e) => {
    e?.stopPropagation();
    setRenaming(false);
    setRenameErr("");
  };
  const saveRename = async (e) => {
    e?.stopPropagation();
    if (!title.trim()) return;
    const result = await onUpdate({ ...l, title: title.trim() });
    if (result?.error) {
      setRenameErr(result.error);
    } else {
      setRenaming(false);
      setRenameErr("");
    }
  };

  const progressColor = stats.overdue > 0 ? "#f87171" : "var(--primary)";

  return (
    <div
      onClick={() => !renaming && onSelect(l.id)}
      className="group relative flex flex-col p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
        e.currentTarget.style.borderOpacity = "0.4";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* Top row: icon + actions */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: "var(--primary-muted)" }}
        >
          <ListTodo className="w-5 h-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={startRename}
            className="p-1.5 rounded-xl transition-colors hover:bg-[var(--primary)]/10"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
            title="Rename"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onDelete(l.id, e)}
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

      {/* Title / rename */}
      {renaming ? (
        <div onClick={(e) => e.stopPropagation()} className="mb-2 space-y-1.5">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (renameErr) setRenameErr("");
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") cancelRename();
            }}
            className="w-full px-3 py-1.5 rounded-xl text-sm font-semibold outline-none"
            style={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--primary)",
              color: "var(--text)",
            }}
          />
          {renameErr && (
            <p className="text-xs flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {renameErr}
            </p>
          )}
          <div className="flex gap-1.5">
            <button
              onClick={saveRename}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--text-inverse)",
              }}
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={cancelRename}
              className="px-2 py-1 rounded-lg text-xs transition-colors"
              style={{
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-muted)",
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3
            className="font-semibold text-base mb-0.5 truncate pr-2"
            style={{ color: "var(--text)" }}
          >
            {l.title}
          </h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Created{" "}
            {new Date(l.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </>
      )}

      {/* Progress */}
      <div className="mt-auto">
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: "var(--text-muted)" }}>
            {stats.completed}/{stats.total} done
          </span>
          <span
            className="font-medium"
            style={{ color: stats.overdue > 0 ? "#f87171" : "var(--primary)" }}
          >
            {stats.overdue > 0
              ? `${stats.overdue} overdue`
              : `${Math.round(stats.progress)}%`}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--border)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${stats.progress}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>

        <div
          className="flex items-center gap-3 mt-3 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {stats.completed}
          </span>
          <span className="flex items-center gap-1">
            <Circle className="w-3.5 h-3.5" />
            {stats.total - stats.completed}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MainView({
  list,
  lists,
  activeListId,
  onBack,
  onSelectList,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  onReorderTodos,
  onOpenSidebar,
  isLoading,
}) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTitleErr, setNewTitleErr] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });

  // Header rename
  const [renamingHeader, setRenamingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerRenameErr, setHeaderRenameErr] = useState("");
  const headerInputRef = useRef(null);

  useEffect(() => {
    if (renamingHeader) {
      headerInputRef.current?.focus();
      headerInputRef.current?.select();
    }
  }, [renamingHeader]);

  const safeLists = Array.isArray(lists) ? lists : [];

  const getStats = (l) => {
    if (!l?.todos) return { total: 0, completed: 0, overdue: 0, progress: 0 };
    const total = l.todos.length;
    const completed = l.todos.filter((t) => t.done).length;
    const overdue = l.todos.filter(
      (t) => !t.done && t.deadline && new Date(t.deadline) < new Date(),
    ).length;
    return {
      total,
      completed,
      overdue,
      progress: total ? (completed / total) * 100 : 0,
    };
  };

  // Create list
  const addList = async () => {
    const t = newTitle.trim();
    if (!t) return;
    setNewTitleErr("");
    const result = await onCreateList({ title: t });
    if (result?.error) {
      setNewTitleErr(result.error);
    } else {
      setNewTitle("");
      setNewTitleErr("");
      setCreatingList(false);
    }
  };

  // Rename header
  const startHeaderRename = () => {
    setHeaderTitle(list.title);
    setHeaderRenameErr("");
    setRenamingHeader(true);
  };
  const cancelHeaderRename = () => {
    setRenamingHeader(false);
    setHeaderRenameErr("");
  };
  const saveHeaderRename = async () => {
    const t = headerTitle.trim();
    if (!t) return;
    const result = await onUpdateList({ ...list, title: t });
    if (result?.error) {
      setHeaderRenameErr(result.error);
    } else {
      setRenamingHeader(false);
      setHeaderRenameErr("");
    }
  };

  const handleHeaderKey = (e) => {
    if (e.key === "Enter") saveHeaderRename();
    if (e.key === "Escape") cancelHeaderRename();
  };

  const confirmDeleteList = (listId, e) => {
    e.stopPropagation();
    setDeleteModal({
      open: true,
      item: safeLists.find((l) => l.id === listId),
    });
  };

  const executeDelete = async () => {
    await onDeleteList(deleteModal.item.id);
    setDeleteModal({ open: false, item: null });
  };

  const addTodo = async () => {
    if (!text.trim() || !list) return;
    await onCreateTodo(list.id, {
      text: text.trim(),
      done: false,
      priority,
      deadline: deadline || null,
    });
    setText("");
    setDeadline("");
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id || !list) return;
    const oi = list.todos.findIndex((t) => t.id === active.id);
    const ni = list.todos.findIndex((t) => t.id === over.id);
    if (oi < 0 || ni < 0) return;
    await onReorderTodos(list.id, arrayMove(list.todos, oi, ni));
  };

  const priorityBtnClass = (p) => {
    if (p === "urgent") return "text-red-400 bg-red-500/10 border-red-500/20";
    if (p === "medium")
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  };

  if (isLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center h-full"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "var(--primary)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading your lists…
          </p>
        </div>
      </div>
    );
  }

  // ── GRID VIEW ───────────────────────────────────────────────────────────────
  if (!list) {
    const totalTasks = safeLists.reduce(
      (a, l) => a + (l.todos?.length || 0),
      0,
    );
    const doneTasks = safeLists.reduce(
      (a, l) => a + (l.todos || []).filter((t) => t.done).length,
      0,
    );

    return (
      <div
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{ backgroundColor: "var(--background)" }}
      >
        {/* Header */}
        <header
          className="shrink-0 flex items-center justify-between px-6 sm:px-8 py-5 border-b"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSidebar}
              className="md:hidden p-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Menu
                className="w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
            </button>
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: "var(--text)" }}
              >
                My Lists
              </h1>
              {totalTasks > 0 && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {doneTasks}/{totalTasks} tasks complete · {safeLists.length}{" "}
                  list{safeLists.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Ad */}
        <div className="px-6 sm:px-8 pt-4 shrink-0">
          <AdUnit
            slot="1234567890"
            format="horizontal"
            responsive={true}
            className="w-full"
            style={{ minHeight: "90px", maxHeight: "90px" }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
          {safeLists.length === 0 && !creatingList ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div
                className="w-20 h-20 mb-5 rounded-2xl flex items-center justify-center border-2 border-dashed"
                style={{ borderColor: "var(--border)" }}
              >
                <LayoutGrid
                  className="w-9 h-9"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text)" }}
              >
                No lists yet
              </h2>
              <p
                className="text-sm mb-6 max-w-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Create your first list to start organising your tasks and
                staying on top of everything.
              </p>
              <button
                onClick={() => setCreatingList(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 shadow-lg"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--text-inverse)",
                  boxShadow: "0 4px 14px var(--primary-20)",
                }}
              >
                <Plus className="w-4 h-4" />
                Create your first list
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {safeLists.slice(0, 2).map((l) => (
                <ListCard
                  key={l.id}
                  l={l}
                  stats={getStats(l)}
                  onSelect={onSelectList}
                  onDelete={confirmDeleteList}
                  onUpdate={onUpdateList}
                />
              ))}

              {safeLists.length >= 2 && (
                <div
                  className="rounded-2xl border flex items-center justify-center min-h-[180px]"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <AdUnit
                    slot="2345678901"
                    format="fluid"
                    responsive={true}
                    className="w-full h-full"
                    style={{ minHeight: "160px" }}
                  />
                </div>
              )}

              {safeLists.slice(2).map((l) => (
                <ListCard
                  key={l.id}
                  l={l}
                  stats={getStats(l)}
                  onSelect={onSelectList}
                  onDelete={confirmDeleteList}
                  onUpdate={onUpdateList}
                />
              ))}

              {/* Create card */}
              {creatingList ? (
                <div
                  className="p-5 rounded-2xl border shadow-lg"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--primary)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--primary-muted)" }}
                    >
                      <Plus
                        className="w-4 h-4"
                        style={{ color: "var(--primary)" }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      New list
                    </span>
                  </div>
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (newTitleErr) setNewTitleErr("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addList();
                      if (e.key === "Escape") {
                        setCreatingList(false);
                        setNewTitle("");
                        setNewTitleErr("");
                      }
                    }}
                    placeholder="List name…"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-1"
                    style={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                  {newTitleErr && (
                    <p className="text-xs flex items-center gap-1 text-red-400 mb-2">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {newTitleErr}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={addList}
                      disabled={!newTitle.trim()}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "var(--text-inverse)",
                      }}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setCreatingList(false);
                        setNewTitle("");
                        setNewTitleErr("");
                      }}
                      className="px-3 py-2 rounded-xl text-xs transition-colors"
                      style={{
                        backgroundColor: "var(--surface-elevated)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setCreatingList(true)}
                  className="group flex flex-col items-center justify-center min-h-[180px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 hover:border-[var(--primary)] hover:bg-[var(--surface)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors"
                    style={{ backgroundColor: "var(--surface-elevated)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.parentElement.querySelector(
                        "svg",
                      ).style.color = "var(--primary)")
                    }
                  >
                    <Plus
                      className="w-5 h-5 transition-colors group-hover:text-[var(--primary)]"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium transition-colors group-hover:text-[var(--primary)]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    New list
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, item: null })}
          onConfirm={executeDelete}
          title="Delete list?"
          message={`"${deleteModal.item?.title}" and its ${deleteModal.item?.todos?.length || 0} task${deleteModal.item?.todos?.length !== 1 ? "s" : ""} will be permanently deleted.`}
        />
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  const todos = list.todos || [];
  const completedCount = todos.filter((t) => t.done).length;
  const progress = todos.length ? (completedCount / todos.length) * 100 : 0;
  const overdueCount = todos.filter(
    (t) => !t.done && t.deadline && new Date(t.deadline) < new Date(),
  ).length;

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header */}
      <header
        className="shrink-0 px-6 sm:px-8 py-5 border-b"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenSidebar}
              className="md:hidden p-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors shrink-0"
            >
              <Menu
                className="w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all hover:bg-[var(--surface-hover)] shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Lists</span>
            </button>
            <div
              className="w-px h-5 shrink-0 hidden sm:block"
              style={{ backgroundColor: "var(--border)" }}
            />

            {/* Title or rename input */}
            {renamingHeader ? (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  ref={headerInputRef}
                  value={headerTitle}
                  onChange={(e) => {
                    setHeaderTitle(e.target.value);
                    if (headerRenameErr) setHeaderRenameErr("");
                  }}
                  onKeyDown={handleHeaderKey}
                  className="px-3 py-1.5 rounded-xl text-lg font-bold outline-none min-w-0 w-48 sm:w-64"
                  style={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--primary)",
                    color: "var(--text)",
                  }}
                />
                <button
                  onClick={saveHeaderRename}
                  className="p-1.5 rounded-xl transition-colors hover:bg-[var(--primary)]/10 shrink-0"
                  style={{ color: "var(--primary)" }}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelHeaderRename}
                  className="p-1.5 rounded-xl transition-colors hover:bg-[var(--surface-hover)] shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h1
                  className="text-xl font-bold truncate"
                  style={{ color: "var(--text)" }}
                >
                  {list.title}
                </h1>
                <button
                  onClick={startHeaderRename}
                  className="p-1.5 rounded-xl transition-colors hover:bg-[var(--primary)]/10 shrink-0"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--primary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {overdueCount > 0 && (
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  color: "#f87171",
                }}
              >
                {overdueCount} overdue
              </span>
            )}
            <div
              className="w-28 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "var(--primary)",
                }}
              />
            </div>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: "var(--text-muted)" }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        {headerRenameErr && (
          <p className="mt-2 text-xs flex items-center gap-1 text-red-400 pl-2">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {headerRenameErr}
          </p>
        )}
        <p
          className="text-xs mt-1.5 pl-2 sm:pl-0"
          style={{ color: "var(--text-muted)" }}
        >
          {completedCount} of {todos.length} tasks completed
        </p>
      </header>

      {/* Add todo */}
      <div
        className="shrink-0 px-6 sm:px-8 py-4 border-b"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-80)",
        }}
      >
        <div
          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
            inputFocused ? "shadow-lg" : ""
          }`}
          style={{
            backgroundColor: "var(--surface)",
            borderColor: inputFocused ? "var(--primary)" : "var(--border)",
            boxShadow: inputFocused
              ? "0 0 0 3px var(--primary-muted)"
              : undefined,
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTodo();
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Add a task…"
            className="w-full px-4 py-3.5 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
          <div className="flex items-center gap-2 px-3 pb-3">
            <div
              className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-xl text-xs"
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
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "var(--text)" }}
              />
            </div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border outline-none cursor-pointer ${priorityBtnClass(priority)}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="urgent">Urgent</option>
            </select>
            <button
              onClick={addTodo}
              disabled={!text.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 active:scale-95"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--text-inverse)",
                boxShadow: text.trim()
                  ? "0 2px 8px var(--primary-20)"
                  : undefined,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Todos */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 custom-scrollbar">
        {todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div
              className="w-16 h-16 mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <Sparkles
                className="w-7 h-7"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
              No tasks yet
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Type a task above and hit Enter
            </p>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={todos.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    listId={list.id}
                    onUpdate={onUpdateTodo}
                    onDelete={onDeleteTodo}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
