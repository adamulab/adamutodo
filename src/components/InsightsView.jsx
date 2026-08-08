import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, ListChecks, TrendingUp, Download, Timer } from "lucide-react";
import { lastNDays, shortWeekday, todayKey } from "../utils/date";
import { toCsv, downloadCsv } from "../utils/csv";

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

export default function InsightsView({ tasks, habits, habitLogs, reflections, focusSessions = [] }) {
  const days = useMemo(() => lastNDays(7), []);
  const today = todayKey();

  const dayStats = days.map((day) => {
    const dayTasks = tasks.filter((t) => t.date === day);
    const done = dayTasks.filter((t) => t.done).length;
    const rate = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0;
    return { day, total: dayTasks.length, done, rate };
  });

  const totalDone = dayStats.reduce((s, d) => s + d.done, 0);
  const totalTasks = dayStats.reduce((s, d) => s + d.total, 0);
  const overallRate = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

  const scoresThisWeek = days.map((d) => reflections[d]?.score).filter((s) => typeof s === "number");
  const avgScore = scoresThisWeek.length ? Math.round(scoresThisWeek.reduce((a, b) => a + b, 0) / scoresThisWeek.length) : null;

  const habitStreaks = habits.map((h) => ({ habit: h, streak: computeStreak(habitLogs[h.id] || {}, today) }));
  const habitConsistency = habits.length
    ? Math.round(
        (days.reduce((sum, d) => sum + habits.filter((h) => habitLogs[h.id]?.[d]).length, 0) / (days.length * habits.length)) * 100,
      )
    : null;

  const maxRate = Math.max(10, ...dayStats.map((d) => d.rate));

  const focusMinutesThisWeek = focusSessions
    .filter((s) => days.includes(s.date))
    .reduce((sum, s) => sum + (s.minutes || 0), 0);

  const exportTasksCsv = () => {
    const csv = toCsv(tasks, [
      { label: "Title", value: (t) => t.title },
      { label: "Date", value: (t) => t.date },
      { label: "Time block", value: (t) => t.timeBlock },
      { label: "Category", value: (t) => t.category },
      { label: "Priority", value: (t) => t.priority },
      { label: "Done", value: (t) => (t.done ? "yes" : "no") },
      { label: "Completed at", value: (t) => t.completedAt || "" },
      { label: "Notes", value: (t) => t.notes || "" },
    ]);
    downloadCsv(`dawn-tasks-${today}.csv`, csv);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <header className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-ink-muted mb-1">Last 7 days</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Insights</h1>
        </div>
        <button onClick={exportTasksCsv} className="btn-ghost text-xs" aria-label="Export all tasks as CSV">
          <Download size={14} /> Export CSV
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={ListChecks} label="Tasks done" value={totalDone} sub={`of ${totalTasks} planned`} />
        <StatCard icon={TrendingUp} label="Completion rate" value={`${overallRate}%`} sub="this week" />
        <StatCard icon={Flame} label="Avg. productivity" value={avgScore ?? "—"} sub={avgScore ? "out of 100" : "reflect to see this"} />
        <StatCard icon={Flame} label="Habit consistency" value={habitConsistency !== null ? `${habitConsistency}%` : "—"} sub="of habits logged" />
        <StatCard icon={Timer} label="Focus time" value={`${Math.round(focusMinutesThisWeek)}m`} sub="this week" />
      </div>

      <section className="card rounded-2xl p-5 mb-4">
        <p className="text-sm font-semibold mb-4">Daily completion rate</p>
        <div className="flex items-end justify-between gap-2 h-32">
          {dayStats.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.rate / maxRate) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="w-full rounded-t-md min-h-[3px]"
                style={{ backgroundColor: d.total ? "var(--accent)" : "var(--line)" }}
                title={`${d.rate}% (${d.done}/${d.total})`}
              />
              <span className="text-[10px] text-ink-faint font-mono">{shortWeekday(d.day)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card rounded-2xl p-5">
        <p className="text-sm font-semibold mb-3">Habit streaks</p>
        {habits.length === 0 ? (
          <p className="text-xs text-ink-faint">Add habits to see streaks here.</p>
        ) : (
          <div className="space-y-2">
            {habitStreaks.map(({ habit, streak }) => (
              <div key={habit.id} className="flex items-center justify-between">
                <span className="text-sm">{habit.name}</span>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: streak > 0 ? "var(--gold)" : "var(--ink-faint)" }}>
                  <Flame size={12} /> {streak} day{streak === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card rounded-2xl p-4">
      <Icon size={16} style={{ color: "var(--accent)" }} className="mb-2" />
      <p className="font-display text-2xl font-semibold leading-none mb-1">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-[11px] text-ink-faint">{sub}</p>
    </div>
  );
}
