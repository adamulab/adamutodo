import { useEffect, useRef } from "react";
import { useAdSense } from "../context/AdSenseContext";

export default function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  style = {},
  className = "",
  minContentHeight = 0, // Only show if content area has enough height
}) {
  const adRef = useRef(null);
  const { pushAd, adsLoaded, publisherId } = useAdSense();
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!adsLoaded || pushedRef.current) return;

    // Check minimum content height if specified
    if (minContentHeight > 0 && adRef.current) {
      const parentHeight = adRef.current.parentElement?.offsetHeight || 0;
      if (parentHeight < minContentHeight) return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (adRef.current && !pushedRef.current) {
        pushedRef.current = true;
        pushAd(slot);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [adsLoaded, slot, pushAd, minContentHeight]);

  if (!publisherId || publisherId === "ca-pub-XXXXXXXXXXXXXXXX") {
    return (
      <div
        className={`bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center ${className}`}
        style={{ minHeight: style.height || 100, ...style }}
      >
        <span className="text-xs text-[var(--text-muted)]">
          Ad Placeholder - {format}
        </span>
      </div>
    );
  }

  return (
    <div className={`ad-container overflow-hidden ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
