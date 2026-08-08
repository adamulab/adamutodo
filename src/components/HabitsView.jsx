import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Flame, Sparkles, Trash2 } from "lucide-react";
import EmptyState from "./EmptyState";
import ConfirmDialog from "./ConfirmDialog";
import { lastNDays, shortWeekday, todayKey, isToday } from "../utils/date";

function computeStreak(log, anchor) {
  let streak = 0;
  let cursor = anchor;
  while (log[cursor]) {
    streak += 1;
    const [y, m, d] = cursor.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    cursor = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  return streak;
}

export default function HabitsView({ habits, habitLogs, onAddHabit, onDeleteHabit, onToggleDay }) {
  const [newHabit, setNewHabit] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const days = useMemo(() => lastNDays(7), []);
  const today = todayKey();

  const submit = (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    onAddHabit({ name: newHabit.trim() });
    setNewHabit("");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <header className="mb-6">
        <p className="text-sm text-ink-muted mb-1">Small things, done daily</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Habits</h1>
      </header>

      <form onSubmit={submit} className="flex gap-2 mb-6">
        <div className="flex-1 card rounded-xl px-3.5 py-2.5">
          <input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="e.g. Drink water, Read, Sleep before 10pm"
            className="input-quiet text-sm"
            aria-label="New habit name"
          />
        </div>
        <button type="submit" className="btn-accent shrink-0" disabled={!newHabit.trim()}>
          <Plus size={16} />
        </button>
      </form>

      {habits.length === 0 ? (
        <EmptyState icon={Sparkles} title="No habits yet" subtitle="Track the small daily wins — hydration, prayer, reading, exercise, anything." />
      ) : (
        <div className="space-y-3">
          {habits.map((habit, i) => {
            const log = habitLogs[habit.id] || {};
            const streak = computeStreak(log, today);
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: i * 0.03 }}
                className="card rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-sm">{habit.name}</p>
                  <div className="flex items-center gap-3">
                    {streak > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--gold)" }}>
                        <Flame size={13} /> {streak}
                      </span>
                    )}
                    <button
                      aria-label={`Delete ${habit.name}`}
                      onClick={() => setConfirmDeleteId(habit.id)}
                      className="text-ink-faint hover:text-rose p-1 -m-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {days.map((day) => {
                    const done = Boolean(log[day]);
                    return (
                      <button
                        key={day}
                        onClick={() => onToggleDay(habit.id, day)}
                        aria-pressed={done}
                        aria-label={`${habit.name} on ${day}`}
                        className="flex flex-col items-center gap-1 rounded-lg py-2 transition-all active:scale-95"
                        style={{
                          backgroundColor: done ? "var(--accent)" : "var(--surface-hover)",
                          outline: isToday(day) ? "1.5px solid var(--accent)" : "none",
                          outlineOffset: "1px",
                        }}
                      >
                        <span className="text-[10px] font-medium" style={{ color: done ? "#fff" : "var(--ink-faint)" }}>
                          {shortWeekday(day)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete this habit?"
        message="This removes its full history too."
        onConfirm={() => {
          onDeleteHabit(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
