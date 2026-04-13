import { useEffect, useRef } from "react";

export default function AdSenseSlot({ slot = "auto", format = "auto", className = "" }) {
  const adRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {}
  }, []);

  return (
    <div className={`overflow-hidden ${className}`} data-testid="adsense-slot">
      <div className="text-center">
        <p className="text-xs text-slate-600 mb-1 uppercase tracking-widest font-mono">Advertisement</p>
        <ins
          ref={adRef}
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4184048622285488"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

// Horizontal banner variant
export function AdBanner({ className = "" }) {
  return (
    <div className={`bg-[#0D1117] border border-white/5 rounded-xl p-4 ${className}`}>
      <AdSenseSlot slot="1234567890" format="horizontal" />
    </div>
  );
}
