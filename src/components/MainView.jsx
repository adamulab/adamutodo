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
} from "lucide-react";
import TodoItem from "./TodoItem";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import AdUnit from "./AdUnit";

function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <div className="p-2 bg-red-500/10 rounded-full">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text)] rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListError, setNewListError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null,
    item: null,
  });

  // Rename active list state (list view header)
  const [isRenamingHeader, setIsRenamingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerRenameError, setHeaderRenameError] = useState("");
  const headerInputRef = useRef(null);

  useEffect(() => {
    if (isRenamingHeader && headerInputRef.current) {
      headerInputRef.current.focus();
      headerInputRef.current.select();
    }
  }, [isRenamingHeader]);

  const safeLists = Array.isArray(lists) ? lists : [];

  const getListStats = (l) => {
    if (!l || !Array.isArray(l.todos))
      return { total: 0, completed: 0, overdue: 0, progress: 0 };
    const total = l.todos.length;
    const completed = l.todos.filter((t) => t.done).length;
    const overdue = l.todos.filter(
      (t) => !t.done && t.deadline && new Date(t.deadline) < new Date(),
    ).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, overdue, progress };
  };

  // ── Create list ─────────────────────────────────────────────────────────────
  const addList = async () => {
    if (!newListTitle.trim()) return;
    setNewListError("");
    const result = await onCreateList({ title: newListTitle.trim() });
    if (result?.error) {
      setNewListError(result.error);
    } else {
      setNewListTitle("");
      setNewListError("");
      setIsCreatingList(false);
    }
  };

  const handleListKeyDown = (e) => {
    if (e.key === "Enter") addList();
    if (e.key === "Escape") {
      setIsCreatingList(false);
      setNewListTitle("");
      setNewListError("");
    }
  };

  // ── Rename active list (header) ─────────────────────────────────────────────
  const startHeaderRename = () => {
    setHeaderTitle(list.title);
    setHeaderRenameError("");
    setIsRenamingHeader(true);
  };

  const cancelHeaderRename = () => {
    setIsRenamingHeader(false);
    setHeaderRenameError("");
  };

  const saveHeaderRename = async () => {
    if (!headerTitle.trim()) return;
    const result = await onUpdateList({ ...list, title: headerTitle.trim() });
    if (result?.error) {
      setHeaderRenameError(result.error);
    } else {
      setIsRenamingHeader(false);
      setHeaderRenameError("");
    }
  };

  const handleHeaderRenameKeyDown = (e) => {
    if (e.key === "Enter") saveHeaderRename();
    if (e.key === "Escape") cancelHeaderRename();
  };

  // ── Delete list ─────────────────────────────────────────────────────────────
  const confirmDeleteList = (listId, e) => {
    e.stopPropagation();
    const listToDelete = safeLists.find((l) => l.id === listId);
    setDeleteModal({ isOpen: true, type: "list", item: listToDelete });
  };

  const executeDeleteList = async () => {
    await onDeleteList(deleteModal.item.id);
    setDeleteModal({ isOpen: false, type: null, item: null });
  };

  // ── Add todo ────────────────────────────────────────────────────────────────
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTodo();
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !list) return;
    const oldIndex = list.todos.findIndex((t) => t.id === active.id);
    const newIndex = list.todos.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(list.todos, oldIndex, newIndex);
    await onReorderTodos(list.id, reordered);
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case "urgent":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  // ── GRID VIEW ───────────────────────────────────────────────────────────────
  if (!list) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--background)]">
        <header className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSidebar}
              className="md:hidden p-2 -ml-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
                My Lists
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {safeLists.length} lists ·{" "}
                {safeLists.reduce((acc, l) => acc + (l.todos?.length || 0), 0)}{" "}
                total tasks
              </p>
            </div>
          </div>
        </header>

        <div className="px-8 pt-4 shrink-0">
          <AdUnit
            slot="1234567890"
            format="horizontal"
            responsive={true}
            className="w-full max-h-[90px]"
            style={{ minHeight: "90px", maxHeight: "90px" }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          {safeLists.length === 0 && !isCreatingList ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-[var(--surface)] flex items-center justify-center border border-[var(--border)]">
                <ListTodo className="w-10 h-10 text-[var(--text-muted)]" />
              </div>
              <p className="text-xl font-semibold text-[var(--text)] mb-2">
                No lists yet
              </p>
              <p className="text-sm mb-6">
                Create your first list to get started
              </p>
              <button
                onClick={() => setIsCreatingList(true)}
                className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl text-[var(--text-inverse)] font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create List
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {safeLists.slice(0, 2).map((l) => (
                <ListCard
                  key={l.id}
                  l={l}
                  stats={getListStats(l)}
                  onSelect={onSelectList}
                  onDelete={confirmDeleteList}
                  onUpdate={onUpdateList}
                />
              ))}

              {safeLists.length >= 2 && (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center min-h-[200px]">
                  <AdUnit
                    slot="2345678901"
                    format="fluid"
                    responsive={true}
                    className="w-full h-full"
                    style={{ minHeight: "180px" }}
                  />
                </div>
              )}

              {safeLists.slice(2).map((l) => (
                <ListCard
                  key={l.id}
                  l={l}
                  stats={getListStats(l)}
                  onSelect={onSelectList}
                  onDelete={confirmDeleteList}
                  onUpdate={onUpdateList}
                />
              ))}

              {isCreatingList ? (
                <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--primary)]/30 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center">
                      <Plus className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <span className="font-medium text-[var(--text)]">
                      New List
                    </span>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={newListTitle}
                    onChange={(e) => {
                      setNewListTitle(e.target.value);
                      if (newListError) setNewListError("");
                    }}
                    onKeyDown={handleListKeyDown}
                    placeholder="List name..."
                    className="input-field mb-1"
                  />
                  {newListError && (
                    <p className="mb-2 text-xs flex items-center gap-1 text-red-500">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {newListError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={addList}
                      disabled={!newListTitle.trim()}
                      className="flex-1 px-3 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-[var(--surface-elevated)] disabled:cursor-not-allowed rounded-lg text-xs font-medium text-[var(--text-inverse)] transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingList(false);
                        setNewListTitle("");
                        setNewListError("");
                      }}
                      className="px-3 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] rounded-lg text-xs font-medium text-[var(--text)] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsCreatingList(true)}
                  className="group p-6 rounded-2xl border border-dashed border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface)] cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center group-hover:bg-[var(--primary-muted)] transition-colors">
                    <Plus className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                    Create New List
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DeleteConfirmModal
          isOpen={deleteModal.isOpen && deleteModal.type === "list"}
          onClose={() =>
            setDeleteModal({ isOpen: false, type: null, item: null })
          }
          onConfirm={executeDeleteList}
          title="Delete List"
          message={`Are you sure you want to delete "${deleteModal.item?.title}"? This will also delete all ${deleteModal.item?.todos?.length || 0} tasks. This action cannot be undone.`}
        />
      </div>
    );
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  const todos = list.todos || [];
  const completedCount = todos.filter((t) => t.done).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const overdueCount = todos.filter(
    (t) => !t.done && t.deadline && new Date(t.deadline) < new Date(),
  ).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--background)]">
      <header className="shrink-0 flex items-center justify-between px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 -ml-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors shrink-0"
          >
            <Menu className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-lg transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-6 w-px bg-[var(--border)] hidden sm:block shrink-0" />

          <div className="min-w-0">
            {isRenamingHeader ? (
              /* Inline rename */
              <div className="flex items-center gap-2">
                <input
                  ref={headerInputRef}
                  value={headerTitle}
                  onChange={(e) => {
                    setHeaderTitle(e.target.value);
                    if (headerRenameError) setHeaderRenameError("");
                  }}
                  onKeyDown={handleHeaderRenameKeyDown}
                  className="px-3 py-1.5 bg-[var(--background)] border border-[var(--primary)]/40 rounded-lg text-xl font-bold text-[var(--text)] focus:outline-none w-48 sm:w-64"
                />
                <button
                  onClick={saveHeaderRename}
                  className="p-1.5 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] transition-colors"
                  title="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelHeaderRename}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight truncate">
                  {list.title}
                </h2>
                <button
                  onClick={startHeaderRename}
                  className="p-1.5 rounded-lg hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors shrink-0"
                  title="Rename list"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {overdueCount > 0 && (
                  <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-pulse shrink-0">
                    <AlertCircle className="w-4 h-4" />
                    {overdueCount} overdue
                  </span>
                )}
              </div>
            )}
            {headerRenameError && (
              <p className="mt-1 text-xs flex items-center gap-1 text-red-500">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {headerRenameError}
              </p>
            )}
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="w-32 h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-[var(--text-muted)]">
            {Math.round(progress)}%
          </span>
        </div>
      </header>

      {/* Add todo input */}
      <div className="shrink-0 px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)]/30">
        <div
          className={`flex flex-col gap-3 p-2 rounded-2xl bg-[var(--surface)] border transition-all duration-300 ${
            isInputFocused
              ? "border-[var(--primary)]/30 ring-4 ring-[var(--primary)]/5"
              : "border-[var(--border)]"
          }`}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            className="flex-1 px-4 py-3 bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none text-sm"
            placeholder="What needs to be done?"
          />
          <div className="flex flex-col sm:flex-row gap-2 px-2 pb-2">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]/50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`px-4 py-2 rounded-lg text-xs font-medium border focus:outline-none cursor-pointer transition-colors ${getPriorityColor(priority)}`}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                onClick={addTodo}
                disabled={!text.trim()}
                className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-[var(--surface-elevated)] disabled:cursor-not-allowed rounded-lg text-[var(--text-inverse)] font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        {todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
            <div className="w-16 h-16 mb-4 rounded-full bg-[var(--surface)] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-lg font-medium text-[var(--text)]">
              No tasks yet
            </p>
            <p className="text-sm mt-1">
              Add your first task above to get started
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

// ── List Card with inline rename ─────────────────────────────────────────────
function ListCard({ l, stats, onSelect, onDelete, onUpdate }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState(l.title);
  const [renameError, setRenameError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const startRename = (e) => {
    e.stopPropagation();
    setRenameTitle(l.title);
    setRenameError("");
    setIsRenaming(true);
  };

  const cancelRename = (e) => {
    e?.stopPropagation();
    setIsRenaming(false);
    setRenameError("");
  };

  const saveRename = async (e) => {
    e?.stopPropagation();
    if (!renameTitle.trim()) return;
    const result = await onUpdate({ ...l, title: renameTitle.trim() });
    if (result?.error) {
      setRenameError(result.error);
    } else {
      setIsRenaming(false);
      setRenameError("");
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") saveRename();
    if (e.key === "Escape") cancelRename();
  };

  return (
    <div
      onClick={() => !isRenaming && onSelect(l.id)}
      className="group relative p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface-hover)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
    >
      {/* Top-right actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10 md:opacity-0 md:group-hover:opacity-100 opacity-100">
        <button
          onClick={startRename}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
          style={{ color: "var(--text-muted)" }}
          title="Rename list"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => onDelete(l.id, e)}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
          style={{ color: "var(--text-muted)" }}
          title="Delete list"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {stats.overdue > 0 && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          {stats.overdue}
        </div>
      )}

      <div className="w-12 h-12 mb-4 mt-2 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center border border-[var(--primary)]/20 group-hover:scale-110 transition-transform duration-300">
        <ListTodo className="w-6 h-6 text-[var(--primary)]" />
      </div>

      {isRenaming ? (
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            value={renameTitle}
            onChange={(e) => {
              setRenameTitle(e.target.value);
              if (renameError) setRenameError("");
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1.5 mb-1 bg-[var(--background)] border border-[var(--primary)]/40 rounded-lg text-sm font-semibold text-[var(--text)] focus:outline-none"
          />
          {renameError && (
            <p className="mb-1 text-xs flex items-center gap-1 text-red-500">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {renameError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={saveRename}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] rounded-lg text-xs font-medium transition-colors"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={cancelRename}
              className="px-2 py-1 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text)] rounded-lg text-xs transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="font-semibold text-lg text-[var(--text)] mb-1 truncate pr-16">
            {l.title}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Created{" "}
            {new Date(l.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[var(--text-muted)]">
            {stats.completed}/{stats.total} done
          </span>
          <span className="text-[var(--text-muted)]">
            {Math.round(stats.progress)}%
          </span>
        </div>
        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {stats.completed}
        </span>
        <span className="flex items-center gap-1">
          <Circle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          {stats.total - stats.completed}
        </span>
      </div>
    </div>
  );
}
