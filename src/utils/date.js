// ── date helpers — all dates are stored/compared as local YYYY-MM-DD strings ──

export function toDateKey(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(dateKey, n) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return toDateKey(date);
}

export function isBefore(a, b) {
  return a < b;
}

export function isToday(dateKey) {
  return dateKey === todayKey();
}

export function startOfWeek(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

export function getWeekDays(anchorKey) {
  const start = startOfWeek(anchorKey);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatDayLabel(dateKey, { withWeekday = true } = {}) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  return withWeekday ? `${weekday}, ${month} ${d}` : `${month} ${d}`;
}

export function formatFullDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function greeting(hour = new Date().getHours()) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

// Which time block "now" falls into — used to highlight the current block.
export function currentTimeBlock(hour = new Date().getHours()) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 22) return "evening";
  return "anytime";
}
