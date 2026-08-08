import { categoryStyle, categoryDotStyle, CATEGORY_META } from "../utils/categories";

export function CategoryDot({ category, className = "" }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${className}`} style={categoryDotStyle(category)} />;
}

export default function CategoryBadge({ category, size = "sm" }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`chip ${pad}`} style={categoryStyle(category)}>
      <CategoryDot category={category} />
      {meta.label}
    </span>
  );
}
