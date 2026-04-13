import { createContext, useContext, useEffect, useState } from "react";

const AdSenseContext = createContext();

export function AdSenseProvider({
  children,
  publisherId = "ca-pub-XXXXXXXXXXXXXXXX",
}) {
  const [adsLoaded, setAdsLoaded] = useState(false);

  useEffect(() => {
    // Load AdSense script
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => setAdsLoaded(true);

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [publisherId]);

  const pushAd = (slotId) => {
    if (window.adsbygoogle && adsLoaded) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  };

  return (
    <AdSenseContext.Provider value={{ pushAd, adsLoaded, publisherId }}>
      {children}
    </AdSenseContext.Provider>
  );
}

export const useAdSense = () => {
  const context = useContext(AdSenseContext);
  if (!context)
    throw new Error("useAdSense must be used within AdSenseProvider");
  return context;
};
