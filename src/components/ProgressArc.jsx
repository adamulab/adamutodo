import { useEffect, useState } from "react";

// Arc's signature element: a sunrise-style arc that fills as the day's
// tasks get done, with a small sun marker travelling along it.
export default function ProgressArc({ percent = 0, size = 168, label, sublabel }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(percent));
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumferenceHalf = Math.PI * r; // length of the semicircle path
  const dash = (animated / 100) * circumferenceHalf;

  const angle = Math.PI - (animated / 100) * Math.PI; // 180deg -> 0deg
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy - r * Math.sin(angle);

  return (
    <div className="relative" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 200 118" className="w-full h-full overflow-visible">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--line)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#arc-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumferenceHalf}`}
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
        <defs>
          <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--rose)" />
            <stop offset="55%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <circle
          cx={dotX}
          cy={dotY}
          r="9"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="3"
          style={{ transition: "cx 0.9s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-display text-3xl font-semibold leading-none">{Math.round(percent)}%</span>
        {label && <span className="text-xs text-ink-muted mt-1">{label}</span>}
        {sublabel && <span className="text-[11px] text-ink-faint">{sublabel}</span>}
      </div>
    </div>
  );
}
