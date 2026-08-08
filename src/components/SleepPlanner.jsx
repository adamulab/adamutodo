import { useState } from "react";
import { BedDouble, Sunrise, Minus, Plus } from "lucide-react";
import { suggestSleepPlan } from "../utils/sleep";

export default function SleepPlanner({ tomorrowTasks }) {
  const [hours, setHours] = useState(7.5);
  const plan = suggestSleepPlan(tomorrowTasks, hours);

  return (
    <section className="card rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BedDouble size={15} style={{ color: "var(--teal)" }} />
        <h3 className="text-sm font-semibold">Sleep planner</h3>
      </div>

      {!plan.hasCommitment ? (
        <p className="text-xs text-ink-muted">
          Add a morning, afternoon, or evening task to tomorrow and Dawn will suggest a bedtime.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[11px] text-ink-faint uppercase tracking-wide mb-0.5">Bedtime</p>
              <p className="font-display text-xl font-semibold" style={{ color: "var(--teal)" }}>
                {plan.bedtime}
              </p>
            </div>
            <div className="text-ink-faint text-lg">→</div>
            <div>
              <p className="text-[11px] text-ink-faint uppercase tracking-wide mb-0.5 flex items-center gap-1">
                <Sunrise size={11} /> Wake by
              </p>
              <p className="font-display text-xl font-semibold">{plan.wakeTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              aria-label="Decrease sleep target"
              onClick={() => setHours((h) => Math.max(5, h - 0.5))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-hover"
            >
              <Minus size={13} />
            </button>
            <span className="text-xs text-ink-muted w-14 text-center">{hours}h target</span>
            <button
              aria-label="Increase sleep target"
              onClick={() => setHours((h) => Math.min(10, h + 0.5))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-hover"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
