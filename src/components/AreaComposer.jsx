import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AREA_COLORS, AREA_COLOR_META } from "../utils/areaColors";

export default function AreaComposer({ open, onClose, onSave, initial }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("accent");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setColor(initial?.color || "accent");
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, initial]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ ...(initial || {}), name: name.trim(), color });
    onClose();
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
            aria-label={initial ? "Edit focus area" : "New focus area"}
            className="relative card w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl p-5 sm:p-6 shadow-raised"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") onClose();
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">{initial ? "Edit focus area" : "New focus area"}</h2>
              <button aria-label="Close" onClick={onClose} className="p-1 -m-1 text-ink-faint hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Launch prep, Fitness, Side project"
              className="input-quiet text-lg font-medium mb-5 pb-3 border-b border-line"
              aria-label="Focus area name"
            />
            <label className="text-xs font-semibold text-ink-muted mb-2 block">Color</label>
            <div className="flex gap-2 mb-6">
              {AREA_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={AREA_COLOR_META[c].label}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{
                    backgroundColor: `var(${AREA_COLOR_META[c].var})`,
                    outline: color === c ? "2.5px solid var(--ink)" : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-accent" onClick={handleSave} disabled={!name.trim()}>
                {initial ? "Save changes" : "Create area"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
