import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdSenseProvider } from "./context/AdsenseContext";
import { useData } from "./hooks/useData";
import MainView from "./components/MainView";
import Sidebar from "./components/SideBar";
import Footer from "./components/Footer";
import LoginScreen from "./components/LoginScreen";
import UserMenu from "./components/UserMenu";
import ThemeToggle from "./components/ThemeToggle";
import { Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";

const ADSENSE_ID = import.meta.env.VITE_ADSENSE_ID || "ca-pub-7316645635680327";

function AppContent() {
  const { user, loading: authLoading, authChecked } = useAuth();
  const [activeListId, setActiveListId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    lists,
    loading: dataLoading,
    isOnline,
    syncStatus,
    saveList,
    deleteList,
    saveTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
  } = useData(user?.uid);

  // Show loading while checking auth
  if (!authChecked || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  const activeList = lists.find((l) => l.id === activeListId);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--text)]">
      {/* Sync Status Indicator */}
      <div
        className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
          syncStatus === "error"
            ? "bg-red-500/20 text-red-500"
            : !isOnline
              ? "bg-amber-500/20 text-amber-500"
              : syncStatus === "syncing"
                ? "bg-blue-500/20 text-blue-500"
                : "bg-emerald-500/20 text-emerald-500"
        }`}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline</span>
          </>
        ) : syncStatus === "syncing" ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : syncStatus === "error" ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>Error</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>Synced</span>
          </>
        )}
      </div>

      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>

      <Sidebar
        lists={lists}
        activeListId={activeListId}
        onSelectList={setActiveListId}
        onCreateList={saveList}
        onDeleteList={deleteList}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <MainView
          list={activeList}
          lists={lists}
          activeListId={activeListId}
          onBack={() => setActiveListId(null)}
          onCreateTodo={saveTodo}
          onUpdateTodo={updateTodo}
          onDeleteTodo={deleteTodo}
          onReorderTodos={reorderTodos}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isLoading={dataLoading}
        />
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdSenseProvider publisherId={ADSENSE_ID}>
          <AppContent />
        </AdSenseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
