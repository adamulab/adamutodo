import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdSenseProvider } from "./context/AdsenseContext";
import { useData } from "./hooks/useData";
import {
  useNotifications,
  NotificationContainer,
} from "./components/useNotifications";
import { useSearch } from "./hooks/useSearch";
import MainView from "./components/MainView";
import Sidebar from "./components/SideBar";
import SearchOverlay from "./components/SearchOverlay";
import Footer from "./components/Footer";
import LoginScreen from "./components/LoginScreen";
import UserMenu from "./components/UserMenu";
import ThemeToggle from "./components/ThemeToggle";
import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { useDeadlineNotifier } from "./hooks/useDedlineNotifier";

const ADSENSE_ID = import.meta.env.VITE_ADSENSE_ID || "ca-pub-7316645635680327";

function AppContent() {
  const { user, loading: authLoading, authChecked } = useAuth();
  const [activeListId, setActiveListId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { notifications, dismiss, success, error, info, warning } =
    useNotifications();

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

  useDeadlineNotifier(lists, warning);

  const { searchQuery, setSearchQuery, searchResults, clearSearch } =
    useSearch(lists);

  if (!authChecked || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const activeList = lists.find((l) => l.id === activeListId);

  const handleCreateList = async (data) => {
    const result = await saveList(data);
    if (result?.error) error(result.error);
    else success(`"${data.title}" created`);
    return result;
  };

  const handleUpdateList = async (data) => {
    const result = await saveList(data);
    if (result?.error) error(result.error);
    else success("List renamed");
    return result;
  };

  const handleDeleteList = async (listId) => {
    const list = lists.find((l) => l.id === listId);
    await deleteList(listId);
    if (activeListId === listId) setActiveListId(null);
    info(`"${list?.title ?? "List"}" deleted`);
  };

  const handleCreateTodo = async (listId, todoData) => {
    await saveTodo(listId, todoData);
    success("Task added");
  };

  const handleUpdateTodo = async (listId, todoId, updates) => {
    await updateTodo(listId, todoId, updates);
    if ("done" in updates) {
      if (updates.done) {
        const list = lists.find((l) => l.id === listId);
        const todo = list?.todos?.find((t) => t.id === todoId);
        const hasRecurrence = todo?.recurrence && todo.recurrence !== "none";
        success(
          hasRecurrence
            ? `✅ Done! Next ${todo.recurrence} task created`
            : "Task completed! 🎉",
        );
      } else {
        info("Task reopened");
      }
    } else {
      success("Task updated");
    }
  };

  const handleDeleteTodo = async (listId, todoId) => {
    await deleteTodo(listId, todoId);
    info("Task deleted");
  };

  const handleSelectList = (listId) => {
    setActiveListId(listId);
    setIsSearchOpen(false);
    clearSearch();
  };

  const showSyncBadge =
    !isOnline || syncStatus === "syncing" || syncStatus === "error";

  // These are passed into MainView so they render inside the header flow
  const headerControls = (
    <div className="flex items-center gap-2 shrink-0">
      <ThemeToggle />
      <UserMenu />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--text)]">
      {/* Sync badge — centered top, only when needed */}
      {showSyncBadge && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border pointer-events-none ${
            syncStatus === "error"
              ? "bg-red-500/20 text-red-400 border-red-500/30"
              : !isOnline
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
          }`}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline — changes saved locally</span>
            </>
          ) : syncStatus === "syncing" ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing…</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Sync error</span>
            </>
          )}
        </div>
      )}

      <Sidebar
        lists={lists}
        activeListId={activeListId}
        onSelectList={handleSelectList}
        onCreateList={handleCreateList}
        onUpdateList={handleUpdateList}
        onDeleteList={handleDeleteList}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        <MainView
          list={activeList}
          lists={lists}
          activeListId={activeListId}
          onBack={() => setActiveListId(null)}
          onSelectList={handleSelectList}
          onCreateList={handleCreateList}
          onUpdateList={handleUpdateList}
          onDeleteList={handleDeleteList}
          onCreateTodo={handleCreateTodo}
          onUpdateTodo={handleUpdateTodo}
          onDeleteTodo={handleDeleteTodo}
          onReorderTodos={reorderTodos}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          headerControls={headerControls}
          isLoading={dataLoading}
        />
        <Footer />
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          clearSearch();
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onSelectList={handleSelectList}
      />

      <NotificationContainer
        notifications={notifications}
        onDismiss={dismiss}
      />
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
