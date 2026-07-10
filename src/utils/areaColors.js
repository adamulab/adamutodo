// A small, curated set of focus-area colors — kept deliberately limited
// so the UI stays coherent rather than turning into a rainbow.
export const AREA_COLORS = ["accent", "teal", "gold", "rose"];

export const AREA_COLOR_META = {
  accent: { label: "Dawn", var: "--accent", soft: "--accent-soft" },
  teal: { label: "Horizon", var: "--teal", soft: "--teal-soft" },
  gold: { label: "Amber", var: "--gold", soft: "--gold-soft" },
  rose: { label: "Bloom", var: "--rose", soft: "--rose-soft" },
};

export function areaColorStyle(color) {
  const meta = AREA_COLOR_META[color] || AREA_COLOR_META.accent;
  return {
    color: `var(${meta.var})`,
    backgroundColor: `var(${meta.soft})`,
  };
}

export function areaDotStyle(color) {
  const meta = AREA_COLOR_META[color] || AREA_COLOR_META.accent;
  return { backgroundColor: `var(${meta.var})` };
}
