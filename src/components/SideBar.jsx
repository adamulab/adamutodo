import { useState } from "react";
import { Plus, X, Trash2, ListTodo, Calendar, AlertCircle } from "lucide-react";
import Logo from "../assets/taskflow.png";

export default function Sidebar({
  lists,
  setLists,
  activeListId,
  setActiveListId,
  isOpen,
  setIsOpen,
}) {
  const [newList, setNewList] = useState("");
  const [isHovered, setIsHovered] = useState(null);

  const addList = () => {
    if (!newList.trim()) return;
    const item = {
      id: Date.now(),
      title: newList,
      todos: [],
      createdAt: new Date().toISOString(),
    };
    setLists([...lists, item]);
    setActiveListId(item.id);
    setNewList("");
  };

  const deleteList = (id, e) => {
    e.stopPropagation();
    const updated = lists.filter((list) => list.id !== id);
    setLists(updated);
    if (activeListId === id) {
      setActiveListId(updated[0]?.id || null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addList();
  };

  // Count overdue tasks in a list
  const getOverdueCount = (list) => {
    const now = new Date().getTime();
    return list.todos.filter(
      (t) => !t.done && t.deadline && new Date(t.deadline).getTime() < now,
    ).length;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed md:relative z-50 md:z-auto h-full w-80 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 shadow-2xl shadow-black/20 transition-all duration-500 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2  rounded-xl ">
                <img src={Logo} alt="" className="w-[200px]" />
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Add List Input */}
          <div className="relative mb-6 group">
            <input
              value={newList}
              onChange={(e) => setNewList(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-4 pr-12 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              placeholder="Create new list..."
            />
            <button
              onClick={addList}
              disabled={!newList.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {lists.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No lists yet. Create one above.
              </div>
            )}

            {lists.map((list) => {
              const isActive = activeListId === list.id;
              const todoCount = list.todos.length;
              const completedCount = list.todos.filter((t) => t.done).length;
              const overdueCount = getOverdueCount(list);

              return (
                <div
                  key={list.id}
                  onMouseEnter={() => setIsHovered(list.id)}
                  onMouseLeave={() => setIsHovered(null)}
                  onClick={() => {
                    setActiveListId(list.id);
                    setIsOpen(false);
                  }}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 ${isActive ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-white/5 border border-transparent"}`}
                >
                  {/* Active Indicator */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
                  />

                  <div className="flex-1 min-w-0 pl-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium text-sm truncate transition-colors ${isActive ? "text-blue-400" : "text-slate-200"}`}
                      >
                        {list.title}
                      </span>
                      {overdueCount > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                          <AlertCircle className="w-3 h-3" />
                          {overdueCount}
                        </span>
                      )}
                      {overdueCount === 0 && todoCount > 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-700 text-slate-400"}`}
                        >
                          {completedCount}/{todoCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-500">
                        {new Date(list.createdAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteList(list.id, e)}
                    className={`p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 ${isHovered === list.id || isActive ? "opacity-100" : "opacity-0"}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Stats */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{lists.length} lists</span>
              <span>
                {lists.reduce((acc, l) => acc + l.todos.length, 0)} tasks
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
