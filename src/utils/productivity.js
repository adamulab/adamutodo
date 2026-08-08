// A simple, transparent productivity score — no ML, just an honest formula
// so it's easy to explain and trust: completion rate weighted most heavily,
// with a small bonus for logging habits that day.
export function computeProductivityScore({ tasksForDay, habitsCompletedToday, totalHabits }) {
  const total = tasksForDay.length;
  const done = tasksForDay.filter((t) => t.done).length;
  const completionRate = total ? done / total : total === 0 ? 1 : 0;
  const habitRate = totalHabits ? habitsCompletedToday / totalHabits : 0;
  const score = Math.round(completionRate * 85 + habitRate * 15);
  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score) {
  if (score >= 85) return "Excellent day";
  if (score >= 65) return "Solid day";
  if (score >= 40) return "Mixed day";
  if (score >= 1) return "Rough day";
  return "No data yet";
}
