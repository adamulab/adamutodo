import { useState } from "react";
import { Plus, Menu, Sparkles, Calendar, Clock } from "lucide-react";
import TodoItem from "./TodoItem";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

export default function MainView({ list, lists, setLists, setIsOpen }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const addTodo = () => {
    if (!text.trim() || !list) return;
    const updated = lists.map((l) =>
      l.id === list.id
        ? {
            ...l,
            todos: [
              ...l.todos,
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

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id || !list) return;
    const oldIndex = list.todos.findIndex((t) => t.id === active.id);
    const newIndex = list.todos.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(list.todos, oldIndex, newIndex);
    setLists(
      lists.map((l) => (l.id === list.id ? { ...l, todos: reordered } : l)),
    );
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case "urgent":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  const completedCount = list?.todos.filter((t) => t.done).length || 0;
  const totalCount = list?.todos.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Count overdue tasks
  const overdueCount =
    list?.todos.filter((t) => {
      if (t.done || !t.deadline) return false;
      return new Date(t.deadline).getTime() < new Date().getTime();
    }).length || 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-400" />
          </button>

          {list ? (
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {list.title}
                  </h2>
                  {overdueCount > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-pulse">
                      <AlertCircle className="w-4 h-4" />
                      {overdueCount} overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {completedCount} of {totalCount} tasks completed
                </p>
              </div>
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-slate-500">
              Select a list to begin
            </h2>
          )}
        </div>

        {list && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-400">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </header>

      {list ? (
        <>
          {/* Input Area */}
          <div className="px-8 py-6 border-b border-white/5 bg-slate-900/30">
            <div
              className={`flex flex-col gap-3 p-2 rounded-2xl bg-slate-800/50 border transition-all duration-300 ${isInputFocused ? "border-blue-500/30 ring-4 ring-blue-500/5" : "border-white/5"}`}
            >
              <div className="flex gap-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className="flex-1 px-4 py-3 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm"
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 px-2 pb-2">
                <div className="flex items-center gap-2 flex-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900/50 border border-white/5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
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
                      className="bg-slate-800 text-emerald-400"
                    >
                      Low Priority
                    </option>
                    <option
                      value="medium"
                      className="bg-slate-800 text-amber-400"
                    >
                      Medium Priority
                    </option>
                    <option
                      value="urgent"
                      className="bg-slate-800 text-red-400"
                    >
                      Urgent
                    </option>
                  </select>
                  <button
                    onClick={addTodo}
                    disabled={!text.trim()}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Todo List */}
          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            {list.todos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-lg font-medium text-slate-400">
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
                  items={list.todos.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {list.todos.map((todo) => (
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
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
              <Sparkles className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              Welcome to TaskFlow
            </h3>
            <p className="text-slate-500 max-w-sm">
              Select a list from the sidebar or create a new one to start
              organizing your tasks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
