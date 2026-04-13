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

  const getOverdueCount = (list) => {
    const now = new Date().getTime();
    return list.todos.filter(
      (t) => !t.done && t.deadline && new Date(t.deadline).getTime() < now,
    ).length;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300 md:hidden"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed md:relative z-50 md:z-auto h-full w-80 transition-all duration-500 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{
          backgroundColor: "var(--surface-80)",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid var(--border)",
          boxShadow: "0 10px 15px -3px var(--shadow)",
        }}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <img src={Logo} alt="Logo" className="w-[200px]" />
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--surface-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-6 group">
            <input
              value={newList}
              onChange={(e) => setNewList(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input-field pr-12"
              placeholder="Create new list..."
            />
            <button
              onClick={addList}
              disabled={!newList.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200 shadow-lg disabled:cursor-not-allowed"
              style={{
                backgroundColor: newList.trim()
                  ? "var(--primary)"
                  : "var(--surface-elevated)",
                boxShadow: newList.trim()
                  ? "0 10px 15px -3px var(--primary-20)"
                  : "none",
              }}
            >
              <Plus
                className="w-4 h-4"
                style={{ color: "var(--text-inverse)" }}
              />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {lists.length === 0 && (
              <div
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
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
                  className="group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300"
                  style={{
                    backgroundColor: isActive
                      ? "var(--primary-muted)"
                      : "transparent",
                    border: `1px solid ${isActive ? "var(--primary)" : "transparent"}`,
                    borderOpacity: isActive ? 0.2 : 0,
                  }}
                >
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-300"
                    style={{
                      backgroundColor: "var(--primary)",
                      opacity: isActive ? 1 : 0,
                    }}
                  />

                  <div className="flex-1 min-w-0 pl-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium text-sm truncate transition-colors"
                        style={{
                          color: isActive ? "var(--primary)" : "var(--text)",
                        }}
                      >
                        {list.title}
                      </span>
                      {overdueCount > 0 && (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            borderColor: "rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {overdueCount}
                        </span>
                      )}
                      {overdueCount === 0 && todoCount > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isActive
                              ? "var(--primary-muted)"
                              : "var(--surface-elevated)",
                            color: isActive
                              ? "var(--primary)"
                              : "var(--text-muted)",
                          }}
                        >
                          {completedCount}/{todoCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar
                        className="w-3 h-3"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(list.createdAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => deleteList(list.id, e)}
                    className="p-2 rounded-lg transition-all duration-200"
                    style={{
                      color: "var(--text-muted)",
                      opacity: isHovered === list.id || isActive ? 1 : 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.backgroundColor =
                        "rgba(239, 68, 68, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div
            className="mt-6 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div
              className="flex justify-between text-xs"
              style={{ color: "var(--text-muted)" }}
            >
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
