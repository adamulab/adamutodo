import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { usePlannerData } from "./hooks/usePlannerData";
import { todayKey } from "./utils/date";
import Sidebar from "./components/Sidebar";
import { MobileTopBar, MobileBottomNav } from "./components/MobileChrome";
import TodayView from "./components/TodayView";
import TomorrowView from "./components/TomorrowView";
import ReflectView from "./components/ReflectView";
import HabitsView from "./components/HabitsView";
import NotesShoppingView from "./components/NotesShoppingView";
import InsightsView from "./components/InsightsView";
import TaskComposer from "./components/TaskComposer";
import FocusTimer from "./components/FocusTimer";
import ToastStack from "./components/ToastStack";

function getInitialView() {
  if (typeof window === "undefined") return "today";
  const params = new URLSearchParams(window.location.search);
  const v = params.get("view");
  return ["today", "tomorrow", "habits", "notes", "insights"].includes(v) ? v : "today";
}

function AppShell() {
  const { user, authChecked } = useAuth();
  const { notify } = useToast();
  const data = usePlannerData(user?.uid);

  const [view, setView] = useState(getInitialView());
  const [taskModal, setTaskModal] = useState({ open: false, initial: null, defaults: {} });
  const [focusTask, setFocusTask] = useState(null);

  const openNewTask = (defaults = {}) => setTaskModal({ open: true, initial: null, defaults });
  const openEditTask = (task) => setTaskModal({ open: true, initial: task, defaults: {} });
  const closeTaskModal = () => setTaskModal((m) => ({ ...m, open: false }));

  const handleSaveTask = (payload) => {
    if (payload.id) {
      data.updateTask(payload.id, payload);
      notify("Task updated.", { type: "success" });
    } else {
      data.addTask(payload);
      notify(payload.date === todayKey() ? "Task added to today." : "Added to tomorrow's plan.", { type: "success" });
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

  const handleReorder = (id, direction, siblingIds) => data.reorder(id, direction, siblingIds);

  const hasReflectedToday = Boolean(data.reflections[todayKey()]?.carriedForward);

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

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar view={view} onNavigate={setView} syncStatus={data.syncStatus} />

      <div className="flex-1 min-w-0">
        <MobileTopBar syncStatus={data.syncStatus} />

        <AnimatePresence mode="wait">
          <motion.main
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {view === "today" && (
              <TodayView
                tasks={data.tasks}
                onToggle={handleToggleTask}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                onAdd={openNewTask}
                onFocusTask={setFocusTask}
                onGoReflect={() => setView("reflect")}
                hasReflectedToday={hasReflectedToday}
              />
            )}
            {view === "tomorrow" && (
              <TomorrowView
                tasks={data.tasks}
                onToggle={handleToggleTask}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                onAdd={openNewTask}
                onReorder={handleReorder}
              />
            )}
            {view === "reflect" && (
              <ReflectView
                tasks={data.tasks}
                habits={data.habits}
                habitLogs={data.habitLogs}
                reflection={data.reflections[todayKey()]}
                onSaveReflection={data.saveReflection}
                onCarryForward={data.carryForward}
                onDone={() => setView("tomorrow")}
              />
            )}
            {view === "habits" && (
              <HabitsView
                habits={data.habits}
                habitLogs={data.habitLogs}
                onAddHabit={data.addHabit}
                onDeleteHabit={data.deleteHabit}
                onToggleDay={data.toggleHabitDay}
              />
            )}
            {view === "notes" && (
              <NotesShoppingView
                notes={data.notes}
                shoppingItems={data.shoppingItems}
                onAddNote={data.addNote}
                onDeleteNote={data.deleteNote}
                onAddItem={data.addShoppingItem}
                onToggleItem={data.toggleShoppingItem}
                onDeleteItem={data.deleteShoppingItem}
                onClearChecked={data.clearCheckedShopping}
              />
            )}
            {view === "insights" && (
              <InsightsView
                tasks={data.tasks}
                habits={data.habits}
                habitLogs={data.habitLogs}
                reflections={data.reflections}
                focusSessions={data.focusSessions}
              />
            )}
          </motion.main>
        </AnimatePresence>

        <div className="h-16 md:hidden" />
      </div>

      <MobileBottomNav view={view} onNavigate={setView} />

      <TaskComposer
        open={taskModal.open}
        onClose={closeTaskModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initial={taskModal.initial}
        defaultDate={taskModal.defaults.date || todayKey()}
      />

      <FocusTimer
        open={Boolean(focusTask)}
        task={focusTask}
        onClose={() => setFocusTask(null)}
        onSessionComplete={(session) => {
          data.logFocusSession(session);
          notify("Focus session complete — nice work.", { type: "success" });
        }}
      />

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
