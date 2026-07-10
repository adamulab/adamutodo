import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { useFocusData } from "./hooks/useFocusData";
import Sidebar from "./components/Sidebar";
import { MobileTopBar, MobileBottomNav } from "./components/MobileChrome";
import TodayView from "./components/TodayView";
import WeekView from "./components/WeekView";
import FocusAreasView from "./components/FocusAreasView";
import FocusAreaDetail from "./components/FocusAreaDetail";
import TaskComposer from "./components/TaskComposer";
import AreaComposer from "./components/AreaComposer";
import ToastStack from "./components/ToastStack";

function getInitialView() {
  if (typeof window === "undefined") return "today";
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "today" ? "today" : "today";
}

function AppShell() {
  const { user, authChecked } = useAuth();
  const { notify } = useToast();
  const data = useFocusData(user?.uid);

  const [view, setView] = useState(getInitialView());
  const [activeAreaId, setActiveAreaId] = useState(null);

  const [taskModal, setTaskModal] = useState({ open: false, initial: null, defaults: {} });
  const [areaModal, setAreaModal] = useState({ open: false, initial: null });

  const navigate = (v) => {
    setActiveAreaId(null);
    setView(v);
  };

  const selectArea = (id) => {
    setActiveAreaId(id);
    setView("areas");
  };

  const openNewTask = (defaults = {}) => setTaskModal({ open: true, initial: null, defaults });
  const openEditTask = (task) => setTaskModal({ open: true, initial: task, defaults: {} });
  const closeTaskModal = () => setTaskModal((m) => ({ ...m, open: false }));

  const handleSaveTask = (payload) => {
    if (payload.id) {
      data.updateTask(payload.id, payload);
      notify("Task updated.", { type: "success" });
    } else {
      data.addTask(payload);
      notify("Task added to your plan.", { type: "success" });
    }
  };

  const handleDeleteTask = (id) => {
    data.deleteTask(id);
    notify("Task deleted.");
  };

  const handleToggleTask = (id) => {
    const task = data.tasks.find((t) => t.id === id);
    data.toggleTask(id);
    if (task && !task.done) notify("Nice — one more done.", { type: "success", duration: 1800 });
  };

  const openNewArea = () => setAreaModal({ open: true, initial: null });
  const openEditArea = (area) => setAreaModal({ open: true, initial: area });

  const handleSaveArea = (payload) => {
    if (payload.id) {
      data.updateArea(payload.id, payload);
    } else {
      data.addArea(payload);
      notify("Focus area created.", { type: "success" });
    }
  };

  // Notes-blur autosave calls onEditArea with full object including notes —
  // route that straight through without reopening the modal.
  const handleAreaNotesSave = (payload) => {
    if (payload.id) data.updateArea(payload.id, payload);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const activeArea = activeAreaId ? data.areas.find((a) => a.id === activeAreaId) : null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar
        view={view}
        onNavigate={navigate}
        areas={data.areas}
        activeAreaId={activeAreaId}
        onSelectArea={selectArea}
        onNewArea={openNewArea}
        syncStatus={data.syncStatus}
      />

      <div className="flex-1 min-w-0">
        <MobileTopBar syncStatus={data.syncStatus} />

        <AnimatePresence mode="wait">
          <motion.main
            key={view + (activeAreaId || "")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {view === "today" && (
              <TodayView
                tasks={data.tasks}
                areas={data.areas}
                onToggle={handleToggleTask}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                onAdd={openNewTask}
              />
            )}
            {view === "week" && (
              <WeekView
                tasks={data.tasks}
                areas={data.areas}
                onToggle={handleToggleTask}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                onAdd={openNewTask}
              />
            )}
            {view === "areas" && !activeArea && (
              <FocusAreasView areas={data.areas} tasks={data.tasks} onSelectArea={selectArea} onNewArea={openNewArea} />
            )}
            {view === "areas" && activeArea && (
              <FocusAreaDetail
                area={activeArea}
                tasks={data.tasks}
                onBack={() => setActiveAreaId(null)}
                onToggle={handleToggleTask}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                onAdd={openNewTask}
                onEditArea={openEditArea}
                onSaveNotes={handleAreaNotesSave}
                onDeleteArea={data.deleteArea}
              />
            )}
          </motion.main>
        </AnimatePresence>

        <div className="h-16 md:hidden" />
      </div>

      <MobileBottomNav view={view} onNavigate={navigate} />

      <TaskComposer
        open={taskModal.open}
        onClose={closeTaskModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initial={taskModal.initial}
        areas={data.areas}
        defaultDate={taskModal.defaults.date}
        defaultAreaId={taskModal.defaults.areaId}
      />

      <AreaComposer open={areaModal.open} onClose={() => setAreaModal((m) => ({ ...m, open: false }))} onSave={handleSaveArea} initial={areaModal.initial} />

      <ToastStack />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
