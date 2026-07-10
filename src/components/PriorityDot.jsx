const PRIORITY_META = {
  high: { label: "High priority", var: "--rose" },
  medium: { label: "Medium priority", var: "--gold" },
  low: { label: "Low priority", var: "--teal" },
};

export default function PriorityDot({ priority = "medium", className = "" }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${className}`}
      style={{ backgroundColor: `var(${meta.var})` }}
    />
  );
}

export { PRIORITY_META };
