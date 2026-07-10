import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Target, ChevronRight } from "lucide-react";
import { AreaDot } from "./AreaBadge";
import { areaColorStyle } from "../utils/areaColors";
import EmptyState from "./EmptyState";

export default function FocusAreasView({ areas, tasks, onSelectArea, onNewArea }) {
  const stats = useMemo(() => {
    const map = {};
    for (const a of areas) {
      const areaTasks = tasks.filter((t) => t.areaId === a.id);
      const done = areaTasks.filter((t) => t.done).length;
      map[a.id] = { total: areaTasks.length, done };
    }
    return map;
  }, [areas, tasks]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-ink-muted mb-1">Where your time goes</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Focus areas</h1>
        </div>
        <button onClick={onNewArea} className="btn-accent" aria-label="New focus area">
          <Plus size={16} />
          <span className="hidden sm:inline">New area</span>
        </button>
      </header>

      {areas.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No focus areas yet"
          subtitle="Group tasks by the projects and parts of life you care about — Work, Health, a side project, anything."
          action={
            <button onClick={onNewArea} className="btn-accent">
              <Plus size={16} /> Create your first area
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {areas.map((area, i) => {
            const { total, done } = stats[area.id] || { total: 0, done: 0 };
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <motion.button
                key={area.id}
                onClick={() => onSelectArea(area.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                className="card rounded-2xl p-4 text-left hover:shadow-raised hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="chip" style={areaColorStyle(area.color)}>
                    <AreaDot color={area.color} />
                    {area.name}
                  </span>
                  <ChevronRight size={16} className="text-ink-faint" />
                </div>
                <p className="text-sm text-ink-muted mb-3">
                  {total === 0 ? "No tasks yet" : `${done} of ${total} tasks done`}
                </p>
                <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: `var(--${area.color})` }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
