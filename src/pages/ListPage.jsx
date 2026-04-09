import { useState } from "react";
import { Plus } from "lucide-react";
import TodoList from "../components/TodoList";
import { motion } from "framer-motion";

export default function ListPage({ lists, setLists }) {
  const [newList, setNewList] = useState("");

  const addList = () => {
    if (!newList) return;
    setLists([...lists, { id: Date.now(), title: newList, todos: [] }]);
    setNewList("");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Todo By AdamuCreates</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
          placeholder="Create new list..."
          className="flex-1 p-3 rounded bg-slate-800"
        />
        <button onClick={addList} className="bg-blue-500 p-3 rounded">
          <Plus />
        </button>
      </div>

      {lists.map((list) => (
        <motion.div
          key={list.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <TodoList list={list} lists={lists} setLists={setLists} />
        </motion.div>
      ))}
    </div>
  );
}
