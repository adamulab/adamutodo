import { AnimatePresence, motion } from "framer-motion";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel, danger = true }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative card rounded-2xl p-5 w-full max-w-sm shadow-raised"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 id="confirm-title" className="font-display text-lg font-semibold mb-1.5">
              {title}
            </h2>
            <p className="text-sm text-ink-muted mb-5">{message}</p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]"
                style={{ backgroundColor: danger ? "var(--rose)" : "var(--accent)" }}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
