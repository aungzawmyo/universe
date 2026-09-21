"use client";

import { applyTourStop, endTour, stepTour, TOUR_STOPS } from "./tour";
import { useExplorer } from "@/simulation/store";

export function TourOverlay() {
  const open = useExplorer((s) => s.tourOpen);
  const step = useExplorer((s) => s.tourStep);
  if (!open) return null;
  const stop = TOUR_STOPS[step];
  if (!stop) return null;
  const last = step >= TOUR_STOPS.length - 1;

  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-20 z-30 mx-auto w-[min(36rem,calc(100vw-1.5rem))]">
      <div className="lab-panel p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
            Tour {step + 1} / {TOUR_STOPS.length}
          </div>
          <button type="button" onClick={endTour} className="text-[11px] text-white/45 hover:text-white">
            End
          </button>
        </div>
        <h2 className="font-serif text-xl text-white">{stop.title}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-white/70">{stop.fact}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => stepTour(-1)}
            className="rounded-md border border-white/10 px-2.5 py-1 text-[12px] text-white/70 disabled:opacity-30"
          >
            Back
          </button>
          <div className="flex gap-1">
            {TOUR_STOPS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Tour stop ${i + 1}`}
                onClick={() => applyTourStop(i)}
                className={`h-1.5 w-3 rounded-full ${i === step ? "bg-amber-200" : "bg-white/20"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (last ? endTour() : stepTour(1))}
            className="rounded-md bg-amber-200 px-2.5 py-1 text-[12px] text-black"
          >
            {last ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

