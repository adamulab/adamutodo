import { useState, useEffect } from "react";
import MainView from "./components/MainView";
import Footer from "./components/Footer";
import Sidebar from "./components/SideBar";
import Logo from "./assets/taskflow.png";
import { Download, X } from "lucide-react";

export default function App() {
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Load data
    try {
      const stored = JSON.parse(localStorage.getItem("todo-lists")) || [];
      const migrated = stored.map((list) => ({
        ...list,
        todos: list.todos.map((todo) => ({
          ...todo,
          deadline: todo.deadline || null,
        })),
      }));
      setLists(migrated);
      setActiveListId(null);
    } catch (e) {
      console.error("Storage error", e);
      setLists([]);
    }

    setTimeout(() => setLoading(false), 1000);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

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
            className="w-24 h-24 object-contain animate-pulse"
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
      {/* Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-lg animate-slide-down">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="TaskFlow" className="w-8 h-8 rounded-lg" />
            <div>
              <p className="font-semibold text-sm">Install TaskFlow</p>
              <p className="text-xs text-blue-100">
                Add to home screen for quick access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

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
          list={activeListId ? activeList : null}
          lists={lists}
          setLists={setLists}
          setIsOpen={setIsOpen}
          setActiveListId={setActiveListId}
        />
        <Footer />
      </div>
    </div>
  );
}
