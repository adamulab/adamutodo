import { useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const timerRefs = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timerRefs.current[id]);
    delete timerRefs.current[id];
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, exiting: true } : n)),
    );
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      320,
    );
  }, []);

  const notify = useCallback(
    (type, message, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setNotifications((prev) => [
        ...prev.slice(-4),
        { id, type, message, exiting: false },
      ]);
      if (duration > 0)
        timerRefs.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (msg, dur) => notify("success", msg, dur),
    [notify],
  );
  const error = useCallback(
    (msg, dur) => notify("error", msg, dur ?? 6000),
    [notify],
  );
  const warning = useCallback(
    (msg, dur) => notify("warning", msg, dur),
    [notify],
  );
  const info = useCallback((msg, dur) => notify("info", msg, dur), [notify]);

  useEffect(() => {
    const t = timerRefs.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  return { notifications, notify, success, error, warning, info, dismiss };
}

const CFG = {
  success: {
    Icon: CheckCircle2,
    bar: "bg-emerald-500",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  error: {
    Icon: XCircle,
    bar: "bg-red-500",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  warning: {
    Icon: AlertTriangle,
    bar: "bg-amber-500",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  info: {
    Icon: Info,
    bar: "bg-blue-500",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
};

export function NotificationContainer({ notifications, onDismiss }) {
  if (!notifications.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-3rem)]">
      {notifications.map((n) => {
        const { Icon, bar, color, bg } = CFG[n.type] || CFG.info;
        return (
          <div
            key={n.id}
            style={{
              animation: n.exiting
                ? "notif-out 0.3s ease forwards"
                : "notif-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
            className={`relative flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl overflow-hidden ${bg}`}
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${bar}`}
            />
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} />
            <p
              className="flex-1 text-sm font-medium leading-snug pr-1"
              style={{ color: "var(--text)" }}
            >
              {n.message}
            </p>
            <button
              onClick={() => onDismiss(n.id)}
              className="shrink-0 p-0.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes notif-in  { from{opacity:0;transform:translateX(110%) scale(.92)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes notif-out { from{opacity:1;transform:translateX(0) scale(1);max-height:80px} to{opacity:0;transform:translateX(110%) scale(.92);max-height:0} }
      `}</style>
    </div>
  );
}
