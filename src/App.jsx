import { useState, useEffect } from "react";
import MainView from "./components/MainView";
import Footer from "./components/Footer";
import Sidebar from "./components/SideBar";
import Logo from "./assets/tba-logo.png";

export default function App() {
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("todo-lists")) || [];
      setLists(stored);
      setActiveListId(stored[0]?.id || null);
    } catch (e) {
      console.error("Storage error", e);
      setLists([]);
    }

    setTimeout(() => setTimeout(() => setLoading(false), 3000), 500);
  }, []);

  useEffect(() => {
    if (!loading) localStorage.setItem("todo-lists", JSON.stringify(lists));
  }, [lists, loading]);

  const activeList = lists.find((l) => l.id === activeListId);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white text-xl">
        <img src={Logo} alt="Logo" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-white">
      <Sidebar
        lists={lists}
        setLists={setLists}
        activeListId={activeListId}
        setActiveListId={setActiveListId}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
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
