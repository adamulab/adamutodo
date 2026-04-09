import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

export default function Sidebar({
  lists,
  setLists,
  activeListId,
  setActiveListId,
  isOpen,
  setIsOpen,
}) {
  const [newList, setNewList] = useState("");

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

  const deleteList = (id) => {
    const updated = lists.filter((list) => list.id !== id);
    setLists(updated);
    if (activeListId === id) {
      setActiveListId(updated[0]?.id || null);
    }
  };

  return (
    <div
      className={`fixed md:relative z-40 md:z-auto h-full w-72 bg-slate-800 border-r border-white/10 p-4 transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold text-lg">Todo By AdamuCreates</h1>
        <button className="md:hidden" onClick={() => setIsOpen(false)}>
          <X />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
          className="flex-1 p-2 rounded bg-white/5"
          placeholder="New list"
        />
        <button onClick={addList} className="bg-blue-500 p-2 rounded">
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`flex items-center justify-between p-3 rounded-xl ${activeListId === list.id ? "bg-blue-500" : "bg-white/5 hover:bg-white/10"}`}
          >
            <button
              onClick={() => {
                setActiveListId(list.id);
                setIsOpen(false);
              }}
              className="flex-1 text-left"
            >
              <div>{list.title}</div>
              <div className="text-xs text-gray-400">
                {new Date(list.createdAt).toLocaleDateString()}
              </div>
            </button>
            <button
              onClick={() => deleteList(list.id)}
              className="ml-2 text-red-400 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
