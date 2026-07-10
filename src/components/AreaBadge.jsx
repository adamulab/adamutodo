import { areaColorStyle, areaDotStyle } from "../utils/areaColors";

export function AreaDot({ color, className = "" }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${className}`} style={areaDotStyle(color)} />;
}

export default function AreaBadge({ area, size = "sm" }) {
  if (!area) return null;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`chip ${pad}`} style={areaColorStyle(area.color)}>
      <AreaDot color={area.color} />
      {area.name}
    </span>
  );
}
