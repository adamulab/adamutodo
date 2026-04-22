export const LIST_SUGGESTIONS = [
  "Inbox",
  "Daily Tasks",
  "Projects",
  "Goals",
  "Work",
  "Personal",
  "Family",
  "Health & Fitness",
  "Spiritual",
  "Learning",
  "Finance",
  "Home & Errands",
  "Shopping",
  "Events & Plans",
  "Content & Ideas",
  "Routines",
  "Waiting / Follow-ups",
  "Completed / Archive",
];

export const SUGGESTION_ICONS = {
  Inbox: "📥",
  "Daily Tasks": "📋",
  Projects: "🗂️",
  Goals: "🎯",
  Work: "💼",
  Personal: "👤",
  Family: "🏠",
  "Health & Fitness": "💪",
  Spiritual: "🕊️",
  Learning: "📚",
  Finance: "💰",
  "Home & Errands": "🛒",
  Shopping: "🛍️",
  "Events & Plans": "📅",
  "Content & Ideas": "💡",
  Routines: "🔁",
  "Waiting / Follow-ups": "⏳",
  "Completed / Archive": "✅",
};

/**
 * Filter suggestions by query, excluding already-existing list titles.
 * Returns up to `limit` results.
 */
export function filterSuggestions(query, existingTitles = [], limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const existing = new Set(existingTitles.map((t) => t.toLowerCase()));
  return LIST_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(q) && !existing.has(s.toLowerCase()),
  ).slice(0, limit);
}
