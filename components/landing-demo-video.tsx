"use client";

import { useRef, useState } from "react";
import { Play, Volume2 } from "lucide-react";

export function LandingDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  async function watchWithSound() {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;

    try {
      await video.play();
      setSoundEnabled(true);
    } catch {
      video.muted = true;
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl lg:mx-0">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_45%,rgba(245,158,11,0.24),transparent_58%)] blur-2xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-amber-300/25 bg-[#11161E]/95 shadow-[0_30px_90px_rgba(0,0,0,0.62),0_0_55px_rgba(245,158,11,0.10)]">
        <div className="flex h-11 items-center border-b border-white/10 bg-[#161B23] px-4">
          <div aria-hidden="true" className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-300/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <p className="mx-auto font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            30-second product tour
          </p>
          <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
            HD
          </span>
        </div>

        <div className="group relative aspect-video overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="size-full object-cover"
            autoPlay
            muted={!soundEnabled}
            loop
            playsInline
            controls={soundEnabled}
            preload="metadata"
            poster="/media/figure-my-money-demo-poster.png"
          >
            <source src="/media/figure-my-money-demo.mp4" type="video/mp4" />
            <track
              kind="captions"
              src="/media/figure-my-money-demo-captions.vtt"
              srcLang="en"
              label="English"
            />
            Your browser does not support embedded video.
          </video>

          {!soundEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/10 to-black/15 transition-colors group-hover:from-black/60">
              <button
                type="button"
                onClick={watchWithSound}
                className="group/button flex items-center gap-3 rounded-full border border-white/20 bg-black/65 py-3 pl-3 pr-5 text-left text-white shadow-2xl backdrop-blur-md transition hover:scale-[1.03] hover:border-amber-300/60 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Restart the 30-second product demo with sound"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-amber-300 text-slate-950 shadow-[0_0_28px_rgba(252,211,77,0.42)]">
                  <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold">Watch the demo</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
                    <Volume2 className="size-3.5" aria-hidden="true" />
                    Turn on sound
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        {["Ranked ideas", "Verified outcomes", "Paper portfolio"].map((label) => (
          <p
            key={label}
            className="rounded-md border border-white/10 bg-black/25 px-2 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-sm sm:text-[10px]"
          >
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}
