"use client";

import { COSMIC_EPOCHS, interpolateEpoch } from "@/lab/models";
import { formatTimeScale } from "@/engine/units";
import { simulation } from "@/simulation/engine";
import { TIME_PRESETS, useExplorer } from "@/simulation/store";

export function TimeControls() {
  const labMode = useExplorer((s) => s.labMode);
  const timeScale = useExplorer((s) => s.timeScale);
  const paused = useExplorer((s) => s.paused);
  const setTimeScale = useExplorer((s) => s.setTimeScale);
  const togglePaused = useExplorer((s) => s.togglePaused);
  const cosmologyT = useExplorer((s) => s.cosmologyT);
  const starAge = useExplorer((s) => s.starAgeMyr);
  const tick = useExplorer((s) => s.tick);
  void tick;

  if (labMode === "big-bang") {
    const epoch = interpolateEpoch(cosmologyT);
    return (
      <footer className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 px-3 pb-3">
        <div className="lab-rail mx-auto w-[min(820px,100%)] rounded-md px-3 py-2">
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-white/50">
            <span>Big Bang</span>
            <span className="text-amber-100/80">
              {epoch.name} · {epoch.timeLabel}
            </span>
            <span>Today</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={cosmologyT}
            onChange={(e) => useExplorer.setState({ cosmologyT: Number(e.target.value) })}
            className="w-full accent-amber-300"
          />
          <div className="mt-1 hidden justify-between text-[9px] text-white/40 sm:flex">
            {COSMIC_EPOCHS.filter((_, i) => i % 2 === 0).map((e) => (
              <span key={e.id}>{e.timeLabel}</span>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 px-3 pb-3">
      <div className="lab-rail mx-auto flex w-[min(920px,100%)] flex-wrap items-center justify-center gap-1.5 rounded-md px-2 py-1.5">
        <button
          onClick={() => {
            simulation.reset();
            useExplorer.setState({ andromedaT: 0, starAgeMyr: 4600, nebulaCollapsed: false, cosmologyT: 1 });
          }}
          className="rounded-md px-2 py-1 text-[11px] uppercase tracking-wider text-white/50 hover:text-white"
        >
          Reset
        </button>
        <div className="flex max-w-full flex-wrap items-center justify-center gap-0.5">
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setTimeScale(preset.value)}
              className={`rounded-md px-2 py-1 text-[11px] ${
                timeScale === preset.value && !paused
                  ? "bg-amber-200 text-black"
                  : "text-white/55 hover:bg-white/8 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button
          onClick={togglePaused}
          aria-label={paused ? "Play" : "Pause"}
          className="rounded-md bg-white/10 px-2.5 py-1 text-[13px] text-white"
        >
          {paused ? "Play" : "Pause"}
        </button>
        <div className="min-w-20 px-1 font-mono text-[11px] text-amber-100/80">
          {labMode === "stellar" ? `${starAge.toFixed(0)} Myr` : paused ? "paused" : formatTimeScale(timeScale)}
        </div>
        <div className="hidden px-1 text-[11px] text-white/45 sm:block">
          {labMode === "solar-system" ? (simulation.physicsMode === "nbody" ? "N-body" : "Kepler") : labMode.replaceAll("-", " ")}
        </div>
      </div>
    </footer>
  );
}
