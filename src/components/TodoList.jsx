import { useState } from "react";
import TodoItem from "./TodoItem";
import { Plus } from "lucide-react";

export default function TodoList({ list, lists, setLists }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("low");

  const addTodo = () => {
    if (!text) return;
    const updated = lists.map((l) =>
      l.id === list.id
        ? {
            ...l,
            todos: [
              ...l.todos,
              { id: Date.now(), text, done: false, priority },
            ],
          }
        : l,
    );
    setLists(updated);
    setText("");
  };

  return (
    <div className="bg-slate-800 p-4 rounded mb-4">
      <h2 className="text-xl mb-2">{list.title}</h2>

      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add todo..."
          className="flex-1 p-2 rounded bg-slate-700"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-slate-700 p-2 rounded"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="urgent">Urgent</option>
        </select>

        <button
          onClick={addTodo}
          className="bg-green-500 p-2 rounded text-center"
        >
          <Plus />
        </button>
      </div>

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
  );
}
