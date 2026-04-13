import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import MainView from "./components/MainView";
import Footer from "./components/Footer";
import Sidebar from "./components/SideBar";
import ThemeToggle from "./components/ThemeToggle";
import Logo from "./assets/tba-logo.png";
import { Download, X } from "lucide-react";
import { AdSenseProvider } from "./context/AdsenseContext";

// Replace with your actual AdSense ID
const ADSENSE_ID = "ca-pub-7316645635680327";

function AppContent() {
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

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
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <div className="relative">
          <img
            src={Logo}
            alt="Logo"
            className="w-24 h-24 object-contain animate-pulse"
          />
          <div className="absolute inset-0 bg-[var(--primary)]/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="mt-6 flex gap-1">
          <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--text)] font-sans selection:bg-[var(--primary)]/30">
      {showInstallBanner && !isInstalled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--primary)] text-[var(--text-inverse)] px-4 py-3 flex items-center justify-between shadow-lg animate-slide-down">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="TaskFlow" className="w-8 h-8 rounded-lg" />
            <div>
              <p className="font-semibold text-sm">Install TaskFlow</p>
              <p className="text-xs opacity-90">
                Add to home screen for quick access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-[var(--text-inverse)] text-[var(--primary)] rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-2 hover:bg-[var(--text-inverse)]/10 rounded-lg transition-colors"
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--primary)]/5 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

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

export default function App() {
  return (
    <ThemeProvider>
      <AdSenseProvider publisherId={ADSENSE_ID}>
        <AppContent />
      </AdSenseProvider>
    </ThemeProvider>
  );
}
