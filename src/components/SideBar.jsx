import { useState, useRef, useEffect } from "react";
import {
  X,
  Trash2,
  Pencil,
  Check,
  AlertCircle,
  LayoutGrid,
  ChevronRight,
  Calendar,
} from "lucide-react";
import Logo from "../assets/taskflow.png";
import ListNameInput from "./ListNameInput";
import { SUGGESTION_ICONS } from "../utils/listSuggestions";

export default function Sidebar({
  lists,
  activeListId,
  onSelectList,
  onSelectTimeline,
  onCreateList,
  onUpdateList,
  onDeleteList,
  isOpen,
  setIsOpen,
}) {
  const [newList, setNewList] = useState("");
  const [listError, setListError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editError, setEditError] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  const handleCreate = async (title) => {
    setListError("");
    const result = await onCreateList({ title });
    if (result?.error) {
      setListError(result.error);
    } else {
      setNewList("");
      setListError("");
    }
  };

  const startEdit = (list, e) => {
    e.stopPropagation();
    setEditingId(list.id);
    setEditTitle(list.title);
    setEditError("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditError("");
  };
  const saveEdit = async (list, e) => {
    e?.stopPropagation();
    const t = editTitle.trim();
    if (!t) return;
    const result = await onUpdateList({ ...list, title: t });
    if (result?.error) {
      setEditError(result.error);
    } else {
      setEditingId(null);
      setEditError("");
    }
  };
  const handleEditKey = (e, list) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      saveEdit(list);
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      cancelEdit();
    }
  };

  const getOverdue = (list) => {
    const now = Date.now();
    return (list.todos || []).filter(
      (t) => !t.done && t.deadline && new Date(t.deadline).getTime() < now,
    ).length;
  };

  const existingTitles = lists.map((l) => l.title);
  const totalTasks = lists.reduce((a, l) => a + (l.todos?.length || 0), 0);
  const completedTasks = lists.reduce(
    (a, l) => a + (l.archivedTodos?.length || 0),
    0,
  );
  const isTimeline = activeListId === "timeline";

  return (
    <>
      <div
        className="fixed inset-0 z-40 md:hidden transition-all duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(6px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed md:relative z-50 md:z-auto h-full flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          width: "17rem",
          backgroundColor: "var(--surface-80)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <img src={Logo} alt="TaskFlow" className="h-12 w-auto" />
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div
          className="mx-5 mb-4 px-3 py-2 rounded-xl flex items-center justify-between text-xs"
          style={{
            backgroundColor: "var(--surface-elevated)",
            color: "var(--text-muted)",
          }}
        >
          <span className="flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" />
            {lists.length} list{lists.length !== 1 ? "s" : ""}
          </span>
          <span>{completedTasks} completed</span>
        </div>

        {/* Timeline nav item */}
        <div className="px-3 mb-2">
          <button
            onClick={() => {
              onSelectTimeline();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: isTimeline
                ? "var(--primary-muted)"
                : "transparent",
              border: isTimeline
                ? "1px solid var(--primary)"
                : "1px solid transparent",
              color: isTimeline ? "var(--primary)" : "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              if (!isTimeline)
                e.currentTarget.style.backgroundColor = "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isTimeline)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {isTimeline && (
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                style={{ backgroundColor: "var(--primary)" }}
              />
            )}
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Timeline</span>
            {isTimeline && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </button>
        </div>

        {/* Divider */}
        <div
          className="mx-5 mb-3 border-t"
          style={{ borderColor: "var(--border)" }}
        />

        {/* New list input */}
        <div className="px-5 mb-3">
          <ListNameInput
            value={newList}
            onChange={(v) => {
              setNewList(v);
              if (listError) setListError("");
            }}
            onSubmit={handleCreate}
            existingTitles={existingTitles}
            error={listError}
            placeholder="New list…"
          />
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar space-y-0.5">
          {lists.length === 0 && (
            <p
              className="text-center text-xs py-8"
              style={{ color: "var(--text-muted)" }}
            >
              No lists yet — create one above
            </p>
          )}

          {lists.map((list) => {
            const isActive = activeListId === list.id;
            const isEditing = editingId === list.id;
            const overdue = getOverdue(list);
            const total = (list.todos || []).length;
            const done = (list.archivedTodos || []).length;
            const progress =
              total + done > 0 ? (done / (total + done)) * 100 : 0;
            const icon = SUGGESTION_ICONS[list.title];

            return (
              <div key={list.id}>
                <div
                  onMouseEnter={() => setHoveredId(list.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectList(list.id);
                      setIsOpen(false);
                    }
                  }}
                  className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive ? "shadow-sm" : "hover:bg-[var(--surface-hover)]"
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--primary-muted)",
                          border: "1px solid var(--primary)",
                        }
                      : { border: "1px solid transparent" }
                  }
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ backgroundColor: "var(--primary)" }}
                    />
                  )}

                  <div className="flex-1 min-w-0 pl-1">
                    {isEditing ? (
                      <input
                        ref={editRef}
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          if (editError) setEditError("");
                        }}
                        onKeyDown={(e) => handleEditKey(e, list)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-0.5 rounded-lg text-sm outline-none"
                        style={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--primary)",
                          color: "var(--text)",
                        }}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 mb-1">
                          {icon && (
                            <span className="text-sm leading-none shrink-0">
                              {icon}
                            </span>
                          )}
                          <span
                            className="text-sm font-medium truncate"
                            style={{
                              color: isActive
                                ? "var(--primary)"
                                : "var(--text)",
                            }}
                          >
                            {list.title}
                          </span>
                          {overdue > 0 && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                              style={{
                                backgroundColor: "rgba(239,68,68,0.15)",
                                color: "#f87171",
                              }}
                            >
                              {overdue}
                            </span>
                          )}
                        </div>
                        {total + done > 0 && (
                          <div className="flex items-center gap-2">
                            <div
                              className="flex-1 h-1 rounded-full overflow-hidden"
                              style={{ backgroundColor: "var(--border)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: "var(--primary)",
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                            <span
                              className="text-[10px] shrink-0"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {done}/{total + done}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div
                    className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-150 ${
                      hoveredId === list.id || isActive || isEditing
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => saveEdit(list, e)}
                          className="p-1.5 rounded-lg hover:bg-[var(--primary)]/20 transition-colors"
                          style={{ color: "var(--primary)" }}
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEdit();
                          }}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startEdit(list, e)}
                          className="p-1.5 rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteList(list.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#f87171")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "var(--text-muted)")
                          }
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {isActive && (
                          <ChevronRight
                            className="w-3.5 h-3.5 ml-0.5"
                            style={{ color: "var(--primary)" }}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isEditing && editError && (
                  <p className="ml-4 mt-1 text-xs flex items-center gap-1 text-red-400">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {editError}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-xs text-center"
            style={{ color: "var(--text-muted)" }}
          >
            TaskFlow · Your tasks, everywhere
          </p>
        </div>
      </aside>
    </>
  );
}
