"use client";

import { useExplorer } from "@/simulation/store";

const ROWS = [
  ["Space", "Pause or play time"],
  ["1–8", "Time presets"],
  ["F", "Focus selected body"],
  ["P", "Emit a photon"],
  ["[ / ]", "Catalog / inspector"],
  ["?", "This guide"],
  ["T", "Start or end the tour"],
  ["← →", "Tour steps"],
  ["Esc", "Close panels"],
];

export function HelpOverlay() {
  const open = useExplorer((s) => s.helpOpen);
  if (!open) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-black/55 p-4">
      <div className="lab-panel w-[min(28rem,100%)] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Guide</div>
            <h2 className="font-serif text-2xl text-white">How to use the laboratory</h2>
          </div>
          <button
            type="button"
            onClick={() => useExplorer.setState({ helpOpen: false })}
            className="rounded-md px-2 py-1 text-white/50 hover:text-white"
          >
            Close
          </button>
        </div>
        <p className="mb-3 text-[13px] leading-relaxed text-white/65">
          This is a set of scale-specific labs, not one simulation of the whole universe. Change
          mass or run a scenario to switch the Solar System from Kepler orbits to N-body gravity.
          Life is an artificial-life dish: energy, genome, and selection — not Fibonacci-as-biology.
        </p>
        <div className="space-y-1.5">
          {ROWS.map(([key, action]) => (
            <div key={key} className="flex items-center justify-between gap-3 text-[13px]">
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-amber-50">{key}</kbd>
              <span className="text-white/70">{action}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-white/45">
          Deep link a lab with <code className="text-amber-100/80">?lab=black-hole</code>, a world with{" "}
          <code className="text-amber-100/80">?focus=jupiter</code>, a sandbox run with{" "}
          <code className="text-amber-100/80">?scenario=no-jupiter</code>, or the tour with{" "}
          <code className="text-amber-100/80">?tour=1</code>.
        </p>
      </div>
    </div>
  );
}
