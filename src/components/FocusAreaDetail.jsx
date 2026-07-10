import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, ListChecks } from "lucide-react";
import { AreaDot } from "./AreaBadge";
import { areaColorStyle } from "../utils/areaColors";
import TaskRow from "./TaskRow";
import EmptyState from "./EmptyState";
import ConfirmDialog from "./ConfirmDialog";

export default function FocusAreaDetail({ area, tasks, onBack, onToggle, onEdit, onDelete, onAdd, onEditArea, onSaveNotes, onDeleteArea }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState(area.notes || "");
  const [filter, setFilter] = useState("open");

  const areaTasks = useMemo(
    () => tasks.filter((t) => t.areaId === area.id).sort((a, b) => Number(a.done) - Number(b.done) || b.order - a.order),
    [tasks, area.id],
  );
  const shown = filter === "open" ? areaTasks.filter((t) => !t.done) : areaTasks;
  const done = areaTasks.filter((t) => t.done).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-5 transition-colors">
        <ArrowLeft size={15} /> Focus areas
      </button>

      <header className="flex items-start justify-between mb-6 gap-3">
        <div>
          <span className="chip mb-2" style={areaColorStyle(area.color)}>
            <AreaDot color={area.color} />
            Focus area
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">{area.name}</h1>
          <p className="text-sm text-ink-muted mt-1">
            {areaTasks.length === 0 ? "No tasks yet" : `${done} of ${areaTasks.length} tasks done`}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEditArea(area)} aria-label="Edit area" className="p-2 rounded-full text-ink-faint hover:text-ink hover:bg-surface-hover">
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete area"
            className="p-2 rounded-full text-ink-faint hover:text-rose hover:bg-rose-soft"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <button onClick={() => onAdd({ areaId: area.id })} className="btn-accent w-full mb-4 py-3">
        <Plus size={17} /> Add task to {area.name}
      </button>

      <div className="flex gap-1.5 mb-3 px-1">
        {["open", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: filter === f ? "var(--surface-hover)" : "transparent",
              color: filter === f ? "var(--ink)" : "var(--ink-faint)",
            }}
          >
            {f === "open" ? "Open" : "All"}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nothing here" subtitle="Add a task to get this area moving." />
      ) : (
        <AnimatePresence initial={false}>
          {shown.map((task) => (
            <TaskRow key={task.id} task={task} area={null} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </AnimatePresence>
      )}

      <div className="mt-8">
        <label className="text-xs font-semibold text-ink-muted mb-2 block">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onSaveNotes({ ...area, notes })}
          placeholder="Context, links, goals for this area…"
          rows={4}
          className="input-quiet text-sm rounded-xl bg-surface-hover px-3 py-2.5 resize-none w-full"
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${area.name}"?`}
        message="Tasks in this area won't be deleted — they'll just be unassigned."
        onConfirm={() => {
          onDeleteArea(area.id);
          setConfirmDelete(false);
          onBack();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
