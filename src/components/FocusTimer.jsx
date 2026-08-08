import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Play, Pause, RotateCcw, Coffee, Zap } from "lucide-react";

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export default function FocusTimer({ open, onClose, task, onSessionComplete }) {
  const [mode, setMode] = useState("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setMode("work");
      setSecondsLeft(WORK_SECONDS);
    }
  }, [open]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (mode === "work") {
              onSessionComplete?.({ taskId: task?.id, taskTitle: task?.title, minutes: WORK_SECONDS / 60 });
            }
            const nextMode = mode === "work" ? "break" : "work";
            setMode(nextMode);
            setRunning(false);
            return nextMode === "work" ? WORK_SECONDS : BREAK_SECONDS;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(mode === "work" ? WORK_SECONDS : BREAK_SECONDS);
  };

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSecondsLeft(m === "work" ? WORK_SECONDS : BREAK_SECONDS);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const total = mode === "work" ? WORK_SECONDS : BREAK_SECONDS;
  const progress = ((total - secondsLeft) / total) * 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Focus timer"
            className="relative card rounded-3xl p-7 w-full max-w-xs text-center shadow-raised"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <button aria-label="Close" onClick={onClose} className="absolute top-4 right-4 text-ink-faint hover:text-ink">
              <X size={18} />
            </button>

            <div className="flex justify-center gap-1.5 mb-5 p-1 rounded-full w-fit mx-auto" style={{ backgroundColor: "var(--surface-hover)" }}>
              <button
                onClick={() => switchMode("work")}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{ backgroundColor: mode === "work" ? "var(--surface)" : "transparent", color: mode === "work" ? "var(--ink)" : "var(--ink-faint)" }}
              >
                <Zap size={12} /> Focus
              </button>
              <button
                onClick={() => switchMode("break")}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{ backgroundColor: mode === "break" ? "var(--surface)" : "transparent", color: mode === "break" ? "var(--ink)" : "var(--ink-faint)" }}
              >
                <Coffee size={12} /> Break
              </button>
            </div>

            {task?.title && <p className="text-xs text-ink-muted mb-3 truncate px-2">{task.title}</p>}

            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={mode === "work" ? "var(--accent)" : "var(--teal)"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-3xl font-semibold tabular-nums">
                  {mins}:{secs}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={reset}
                aria-label="Reset timer"
                className="w-11 h-11 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
              >
                <RotateCcw size={17} />
              </button>
              <button
                onClick={() => setRunning((r) => !r)}
                aria-label={running ? "Pause timer" : "Start timer"}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform active:scale-95"
                style={{ backgroundColor: mode === "work" ? "var(--accent)" : "var(--teal)" }}
              >
                {running ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
