import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

/**
 * Shows a small banner at the top of the screen when a new version of the
 * app is available. User can choose to update immediately or dismiss.
 *
 * Uses vite-plugin-pwa's useRegisterSW hook which works with registerType: "prompt".
 */
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Poll for updates every 60 s so long-running PWA sessions catch new deploys
      if (r) {
        setInterval(() => r.update(), 60_000);
      }
    },
  });

  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[200] flex items-center justify-between gap-3 px-4 py-2.5 text-sm shadow-lg"
      style={{
        backgroundColor: "var(--primary)",
        color: "var(--text-inverse)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <RefreshCw className="w-4 h-4 shrink-0" />
        <span className="truncate">A new version of TaskFlow is ready.</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.35)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"}
        >
          Update now
        </button>
        <button
          onClick={() => { setNeedRefresh(false); setDismissed(true); }}
          className="p-1 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.7)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "white"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
