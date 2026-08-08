import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, Sunrise, Sun, Sunset, Moon, Calendar, Mic } from "lucide-react";
import { CATEGORIES, CATEGORY_META } from "../utils/categories";
import { CategoryDot } from "./CategoryBadge";
import { formatFullDate } from "../utils/date";
import { useVoiceInput } from "../hooks/useVoiceInput";

const TIME_BLOCKS = [
  { id: "morning", label: "Morning", icon: Sunrise },
  { id: "afternoon", label: "Afternoon", icon: Sun },
  { id: "evening", label: "Evening", icon: Sunset },
  { id: "anytime", label: "Anytime", icon: Moon },
];

const PRIORITIES = [
  { id: "low", label: "Low", var: "--teal" },
  { id: "medium", label: "Medium", var: "--gold" },
  { id: "high", label: "High", var: "--rose" },
];

export default function TaskComposer({ open, onClose, onSave, onDelete, initial, defaultDate }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [timeBlock, setTimeBlock] = useState("anytime");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("other");
  const titleRef = useRef(null);
  const voice = useVoiceInput({
    onResult: (transcript) => setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript)),
  });

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || "");
    setNotes(initial?.notes || "");
    setDate(initial?.date || defaultDate);
    setTimeBlock(initial?.timeBlock || "anytime");
    setPriority(initial?.priority || "medium");
    setCategory(initial?.category || "other");
    const t = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, initial, defaultDate]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ ...(initial || {}), title: title.trim(), notes, date, timeBlock, priority, category });
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={initial ? "Edit task" : "New task"}
            onKeyDown={handleKeyDown}
            className="relative card w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-5 sm:p-6 max-h-[88vh] overflow-y-auto custom-scrollbar shadow-raised"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">{initial ? "Edit task" : "New task"}</h2>
              <button aria-label="Close" onClick={onClose} className="p-1 -m-1 text-ink-faint hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line">
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to happen?"
                className="input-quiet text-lg font-medium flex-1"
                aria-label="Task title"
              />
              {voice.supported && (
                <button
                  type="button"
                  onClick={voice.listening ? voice.stop : voice.start}
                  aria-label={voice.listening ? "Stop voice input" : "Add task by voice"}
                  aria-pressed={voice.listening}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: voice.listening ? "var(--accent)" : "var(--surface-hover)",
                    color: voice.listening ? "#fff" : "var(--ink-muted)",
                  }}
                >
                  <Mic size={14} className={voice.listening ? "animate-pulse" : ""} />
                </button>
              )}
            </div>
            {voice.error && <p className="text-xs -mt-3 mb-3" style={{ color: "var(--rose)" }}>{voice.error}</p>}

            <div className="mb-4">
              <label className="text-xs font-semibold text-ink-muted mb-2 block">When</label>
              <div className="flex items-center gap-2 mb-2.5">
                <Calendar size={14} className="text-ink-faint shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-quiet text-sm"
                  aria-label="Task date"
                />
                <span className="text-xs text-ink-faint hidden sm:inline">{formatFullDate(date)}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {TIME_BLOCKS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTimeBlock(id)}
                    aria-pressed={timeBlock === id}
                    className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-all"
                    style={{
                      backgroundColor: timeBlock === id ? "var(--accent-soft)" : "var(--surface-hover)",
                      color: timeBlock === id ? "var(--accent-hover)" : "var(--ink-muted)",
                    }}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-ink-muted mb-2 block">Priority</label>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    aria-pressed={priority === p.id}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all border"
                    style={{
                      borderColor: priority === p.id ? `var(${p.var})` : "var(--line)",
                      color: priority === p.id ? `var(${p.var})` : "var(--ink-muted)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `var(${p.var})` }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-ink-muted mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className="chip text-xs border transition-all"
                    style={{
                      borderColor: category === c ? "var(--ink-faint)" : "var(--line)",
                      backgroundColor: category === c ? "var(--surface-hover)" : "transparent",
                    }}
                  >
                    <CategoryDot category={c} />
                    {CATEGORY_META[c].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-ink-muted mb-2 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details, links, anything you'll want later…"
                rows={2}
                className="input-quiet text-sm rounded-xl bg-surface-hover px-3 py-2 resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              {initial ? (
                <button
                  onClick={() => {
                    onDelete(initial.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-full text-ink-faint hover:text-rose hover:bg-rose-soft transition-colors"
                  aria-label="Delete task"
                >
                  <Trash2 size={17} />
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn-accent" onClick={handleSave} disabled={!title.trim()}>
                  {initial ? "Save changes" : "Add task"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
