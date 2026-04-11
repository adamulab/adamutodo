import { useState, useEffect } from "react";
import MainView from "./components/MainView";
import Footer from "./components/Footer";
import Sidebar from "./components/SideBar";
import Logo from "./assets/taskflow.png";

export default function App() {
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("todo-lists")) || [];
      // Migration: add deadline field to old todos if missing
      const migrated = stored.map((list) => ({
        ...list,
        todos: list.todos.map((todo) => ({
          ...todo,
          deadline: todo.deadline || null,
        })),
      }));
      setLists(migrated);
      setActiveListId(migrated[0]?.id || null);
    } catch (e) {
      console.error("Storage error", e);
      setLists([]);
    }

    setTimeout(() => setLoading(false), 2000);
  }, []);

  useEffect(() => {
    if (!loading) localStorage.setItem("todo-lists", JSON.stringify(lists));
  }, [lists, loading]);

  const activeList = lists.find((l) => l.id === activeListId);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <img
            src={Logo}
            alt="Logo"
            className="w-64 h-64 object-contain animate-pulse"
          />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="mt-6 flex gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      <Sidebar
        lists={lists}
        setLists={setLists}
        activeListId={activeListId}
        setActiveListId={setActiveListId}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <MainView
          list={activeList}
          lists={lists}
          setLists={setLists}
          setIsOpen={setIsOpen}
        />
        <Footer />
      </div>
    </div>
  );
}
