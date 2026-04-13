import { useState } from "react";
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
} from "lucide-react";
import TodoItem from "./TodoItem";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

export default function MainView({
  list,
  lists,
  setLists,
  setIsOpen,
  setActiveListId,
}) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const safeLists = Array.isArray(lists) ? lists : [];

  const getListStats = (l) => {
    if (!l || !Array.isArray(l.todos)) {
      return { total: 0, completed: 0, overdue: 0, progress: 0 };
    }
    const total = l.todos.length;
    const completed = l.todos.filter((t) => t.done).length;
    const overdue = l.todos.filter((t) => {
      if (t.done || !t.deadline) return false;
      return new Date(t.deadline).getTime() < new Date().getTime();
    }).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, overdue, progress };
  };

  const addList = () => {
    if (!newListTitle.trim()) return;
    const item = {
      id: Date.now(),
      title: newListTitle,
      todos: [],
      createdAt: new Date().toISOString(),
    };
    setLists([...safeLists, item]);
    setActiveListId(item.id);
    setNewListTitle("");
    setIsCreatingList(false);
  };

  const handleListKeyPress = (e) => {
    if (e.key === "Enter") addList();
    if (e.key === "Escape") {
      setIsCreatingList(false);
      setNewListTitle("");
    }
  };

  const addTodo = () => {
    if (!text.trim() || !list) return;
    const updated = safeLists.map((l) =>
      l.id === list.id
        ? {
            ...l,
            todos: [
              ...(l.todos || []),
              {
                id: Date.now(),
                text,
                done: false,
                priority,
                deadline: deadline || null,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : l,
    );
    setLists(updated);
    setText("");
    setDeadline("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTodo();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !list) return;

    const oldIndex = list.todos?.findIndex((t) => t.id === active.id);
    const newIndex = list.todos?.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(list.todos, oldIndex, newIndex);
    setLists(
      safeLists.map((l) => (l.id === list.id ? { ...l, todos: reordered } : l)),
    );
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

  const selectList = (listId) => {
    setActiveListId(listId);
  };

  const backToGrid = () => {
    setActiveListId(null);
  };

  if (!list) {
    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
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

        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
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
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create List
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {safeLists.map((l) => {
                const stats = getListStats(l);
                return (
                  <div
                    key={l.id}
                    onClick={() => selectList(l.id)}
                    className="group relative p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] card-hover"
                  >
                    {stats.overdue > 0 && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        {stats.overdue}
                      </div>
                    )}

                    <div className="w-12 h-12 mb-4 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center border border-[var(--primary)]/20 group-hover:scale-110 transition-transform duration-300">
                      <ListTodo className="w-6 h-6 text-[var(--primary)]" />
                    </div>

                    <h3 className="font-semibold text-lg text-[var(--text)] mb-1 truncate">
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
              })}

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
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={handleListKeyPress}
                    placeholder="List name..."
                    className="input-field mb-3"
                  />

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
      </div>
    );
  }

  const todos = list.todos || [];
  const completedCount = todos.filter((t) => t.done).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const overdueCount = todos.filter((t) => {
    if (t.done || !t.deadline) return false;
    return new Date(t.deadline).getTime() < new Date().getTime();
  }).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <header className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 -ml-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-[var(--text-muted)]" />
          </button>

          <button
            onClick={backToGrid}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lists
          </button>

          <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
                {list.title}
              </h2>
              {overdueCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  {overdueCount} overdue
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={backToGrid}
            className="sm:hidden p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
          <div className="hidden sm:flex items-center gap-3">
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
        </div>
      </header>

      <div className="px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)]/30">
        <div
          className={`flex flex-col gap-3 p-2 rounded-2xl bg-[var(--surface)] border transition-all duration-300 ${isInputFocused ? "border-[var(--primary)]/30 ring-4 ring-[var(--primary)]/5" : "border-[var(--border)]"}`}
        >
          <div className="flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className="flex-1 px-4 py-3 bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none text-sm"
              placeholder="What needs to be done?"
            />
          </div>
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
                <option
                  value="low"
                  className="bg-[var(--surface)] text-emerald-500"
                >
                  Low Priority
                </option>
                <option
                  value="medium"
                  className="bg-[var(--surface)] text-amber-500"
                >
                  Medium Priority
                </option>
                <option
                  value="urgent"
                  className="bg-[var(--surface)] text-red-500"
                >
                  Urgent
                </option>
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
                    list={list}
                    lists={lists}
                    setLists={setLists}
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
