import { useState } from "react";
import { Plus, Menu } from "lucide-react";
import TodoItem from "./TodoItem";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

export default function MainView({ list, lists, setLists, setIsOpen }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("low");

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
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : l,
    );
    setLists(updated);
    setText("");
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = list.todos.findIndex((t) => t.id === active.id);
    const newIndex = list.todos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(list.todos, oldIndex, newIndex);
    setLists(
      lists.map((l) => (l.id === list.id ? { ...l, todos: reordered } : l)),
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button className="md:hidden" onClick={() => setIsOpen(true)}>
            <Menu />
          </button>
          <h2 className="font-semibold text-lg">
            {list?.title || "Select a list"}
          </h2>
        </div>
      </div>

      {list ? (
        <>
          <div className="p-4 flex flex-col sm:flex-row gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 p-3 rounded-xl bg-white/5"
              placeholder="Add todo..."
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="p-2 rounded-xl bg-white/5"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="urgent">Urgent</option>
            </select>
            <button onClick={addTodo} className="bg-green-500 p-3 rounded-xl">
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={list.todos.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {list.todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    list={list}
                    lists={lists}
                    setLists={setLists}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Create or select a list
        </div>
      )}
    </div>
  );
}
