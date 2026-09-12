"use client";

import { useRef, useState } from "react";
import { Play, Volume2 } from "lucide-react";

export function LandingDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  async function watchWithSound() {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;

    try {
      await video.play();
      setStarted(true);
    } catch {
      video.muted = true;
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl lg:mx-0">
      <div
        aria-hidden="true"
        className="absolute -inset-10 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.15),transparent_62%)] opacity-70 blur-3xl"
      />

      <div className="group relative aspect-video overflow-hidden rounded-2xl bg-black/30 shadow-[0_24px_70px_rgba(0,0,0,0.42)] ring-1 ring-white/10">
        <video
          ref={videoRef}
          className="size-full object-cover"
          playsInline
          controls={started}
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

        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 via-transparent to-black/5 transition-colors group-hover:from-black/40">
            <button
              type="button"
              onClick={watchWithSound}
              className="group/button flex flex-col items-center gap-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
              aria-label="Play the 30-second product demo once with sound"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-amber-300 text-slate-950 shadow-[0_0_36px_rgba(252,211,77,0.38)] transition group-hover/button:scale-105">
                <Play className="ml-1 size-7 fill-current" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-semibold backdrop-blur-md">
                <Volume2 className="size-4 text-amber-300" aria-hidden="true" />
                Watch with sound
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
        {["Ranked ideas", "Verified outcomes", "Paper portfolio"].map((label) => (
          <p
            key={label}
            className="flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[10px]"
          >
            <span aria-hidden="true" className="size-1 rounded-full bg-amber-300/80" />
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}
