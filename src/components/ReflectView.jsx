import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { todayKey, addDays, formatFullDate } from "../utils/date";
import { computeProductivityScore, scoreLabel } from "../utils/productivity";

const MOODS = [
  { id: "great", emoji: "😄", label: "Great" },
  { id: "good", emoji: "🙂", label: "Good" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "low", emoji: "😔", label: "Low" },
  { id: "rough", emoji: "😣", label: "Rough" },
];

export default function ReflectView({ tasks, habits, habitLogs, reflection, onSaveReflection, onCarryForward, onDone }) {
  const today = todayKey();
  const tomorrow = addDays(today, 1);

  const todayTasks = useMemo(() => tasks.filter((t) => t.date === today), [tasks, today]);
  const accomplished = todayTasks.filter((t) => t.done);
  const notCompleted = todayTasks.filter((t) => !t.done);

  const [mood, setMood] = useState(reflection?.mood || null);
  const [energy, setEnergy] = useState(reflection?.energy || 3);
  const [selectedCarry, setSelectedCarry] = useState(() => new Set(notCompleted.map((t) => t.id)));
  const [resolved, setResolved] = useState(Boolean(reflection?.carriedForward));

  const habitsToday = habits.filter((h) => habitLogs[h.id]?.[today]);
  const score = computeProductivityScore({
    tasksForDay: todayTasks,
    habitsCompletedToday: habitsToday.length,
    totalHabits: habits.length,
  });

  const toggleCarry = (id) => {
    setSelectedCarry((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const finish = (mode) => {
    onSaveReflection(today, { mood, energy, score, carriedForward: true });
    if (notCompleted.length > 0) {
      const ids = mode === "selected" ? Array.from(selectedCarry) : [];
      onCarryForward(today, tomorrow, mode, ids);
    }
    setResolved(true);
  };

  if (resolved) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-16 pb-28 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <div
            className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
            style={{ backgroundColor: "var(--accent-soft)" }}
          >
            <Sparkles size={26} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="font-display text-2xl font-semibold mb-2">Today's wrapped up.</h1>
          <p className="text-sm text-ink-muted mb-8">
            {scoreLabel(score)} — {score}/100. Anything left over is already waiting for you in Tomorrow.
          </p>
          <button onClick={onDone} className="btn-accent">
            Go to Tomorrow's plan <ArrowRight size={15} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <header className="mb-7">
        <p className="text-sm text-ink-muted mb-1">{formatFullDate(today)}</p>
        <h1 className="font-display text-3xl font-semibold">How did today go?</h1>
      </header>

      <section className="card rounded-2xl p-5 mb-4">
        <p className="text-sm font-semibold mb-3">Mood</p>
        <div className="flex justify-between">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              aria-pressed={mood === m.id}
              aria-label={m.label}
              className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all"
              style={{
                backgroundColor: mood === m.id ? "var(--accent-soft)" : "transparent",
                transform: mood === m.id ? "scale(1.08)" : "scale(1)",
              }}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-ink-faint">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Energy level</p>
          <span className="text-sm text-ink-muted">{energy}/5</span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-label="Energy level"
        />
      </section>

      <section className="card rounded-2xl p-5 mb-4">
        <p className="text-sm font-semibold mb-1">Productivity score</p>
        <p className="text-xs text-ink-muted mb-3">
          Based on {accomplished.length}/{todayTasks.length || 0} tasks done{habits.length ? ` and ${habitsToday.length}/${habits.length} habits logged` : ""}.
        </p>
        <div className="flex items-end gap-3">
          <span className="font-display text-4xl font-semibold" style={{ color: "var(--accent)" }}>
            {score}
          </span>
          <span className="text-sm text-ink-muted mb-1.5">{scoreLabel(score)}</span>
        </div>
      </section>

      {notCompleted.length > 0 && (
        <section className="card rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold mb-1">What wasn't completed</p>
          <p className="text-xs text-ink-muted mb-3">Pick what should carry into tomorrow — the rest stays here, unfinished.</p>
          <div className="space-y-1">
            {notCompleted.map((t) => (
              <label key={t.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface-hover cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCarry.has(t.id)}
                  onChange={() => toggleCarry(t.id)}
                  className="accent-[var(--accent)] w-4 h-4"
                />
                <span className="text-sm">{t.title}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn-accent flex-1" onClick={() => finish("all")}>
              Move all to tomorrow
            </button>
            <button className="btn-ghost flex-1" onClick={() => finish("selected")}>
              Move selected only
            </button>
          </div>
          <button className="text-xs text-ink-faint hover:text-ink-muted mt-2 w-full text-center" onClick={() => finish("none")}>
            Don't carry anything forward
          </button>
        </section>
      )}

      {notCompleted.length === 0 && (
        <button className="btn-accent w-full mb-6" onClick={() => finish("none")}>
          Save reflection
        </button>
      )}
    </div>
  );
}
