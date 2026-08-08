// A small curated category set — kept limited so the UI stays coherent.
export const CATEGORIES = ["work", "personal", "health", "family", "learning", "other"];

export const CATEGORY_META = {
  work: { label: "Work", var: "--accent", soft: "--accent-soft" },
  personal: { label: "Personal", var: "--gold", soft: "--gold-soft" },
  health: { label: "Health", var: "--teal", soft: "--teal-soft" },
  family: { label: "Family", var: "--rose", soft: "--rose-soft" },
  learning: { label: "Learning", var: "--accent", soft: "--accent-soft" },
  other: { label: "Other", var: "--ink-faint", soft: "--line" },
};

export function categoryStyle(cat) {
  const meta = CATEGORY_META[cat] || CATEGORY_META.other;
  return { color: `var(${meta.var})`, backgroundColor: `var(${meta.soft})` };
}

export function categoryDotStyle(cat) {
  const meta = CATEGORY_META[cat] || CATEGORY_META.other;
  return { backgroundColor: `var(${meta.var})` };
}
