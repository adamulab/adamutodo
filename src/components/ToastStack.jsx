import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

const ICONS = { success: CheckCircle2, error: AlertTriangle, default: Info };

export default function ToastStack() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || ICONS.default;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel rounded-xl shadow-raised px-4 py-3 flex items-center gap-2.5"
            >
              <Icon
                size={17}
                className="shrink-0"
                style={{ color: t.type === "error" ? "var(--rose)" : "var(--accent)" }}
              />
              <p className="text-sm flex-1">{t.message}</p>
              {t.action && (
                <button className="text-xs font-semibold shrink-0" style={{ color: "var(--accent)" }} onClick={t.action.onClick}>
                  {t.action.label}
                </button>
              )}
              <button
                aria-label="Dismiss"
                className="text-ink-faint hover:text-ink shrink-0"
                onClick={() => dismiss(t.id)}
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
