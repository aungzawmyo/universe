"use client";

import { formatSimDate } from "@/engine/units";
import { WAVELENGTH_LOOK } from "@/rendering/visual";
import { NEARBY_STARS } from "@/data/nearby-stars";
import { GALAXIES } from "@/lab/models";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { startTour, endTour } from "./tour";
import { useState } from "react";
import type { AccuracyMode, LabMode, Wavelength } from "@/engine/types";
import { LAB_MODES } from "@/engine/types";

const MODES: AccuracyMode[] = ["education", "realistic", "simulation"];

const WAVE_SHORT: Record<Wavelength, string> = {
  gamma: "γ",
  xray: "X",
  uv: "UV",
  visible: "Vis",
  ir: "IR",
  microwave: "µ",
  radio: "R",
};

const GALAXY_MODE: Record<string, LabMode> = {
  "milky-way": "milky-way",
  andromeda: "local-group",
};

export function TopBar() {
  const searchQuery = useExplorer((s) => s.searchQuery);
  const setSearch = useExplorer((s) => s.setSearch);
  const accuracyMode = useExplorer((s) => s.accuracyMode);
  const setAccuracy = useExplorer((s) => s.setAccuracy);
  const wavelength = useExplorer((s) => s.wavelength);
  const setWavelength = useExplorer((s) => s.setWavelength);
  const labMode = useExplorer((s) => s.labMode);
  const dockOpen = useExplorer((s) => s.dockOpen);
  const inspectorOpen = useExplorer((s) => s.inspectorOpen);
  const helpOpen = useExplorer((s) => s.helpOpen);
  const tourOpen = useExplorer((s) => s.tourOpen);
  const [copied, setCopied] = useState(false);
  const tick = useExplorer((s) => s.tick);
  const date = tick === 0 ? "2026-09-20 00:00 UTC" : formatSimDate(simulation.timeS).replace(":00 UTC", " UTC").slice(0, 20);
  const lab = LAB_MODES.find((m) => m.id === labMode);

  const q = searchQuery.toLowerCase().trim();
  const bodyMatches = simulation
    .activeBodies()
    .filter((b) => q && b.name.toLowerCase().includes(q))
    .slice(0, 5);
  const modeMatches = LAB_MODES.filter((m) => q && (m.label.toLowerCase().includes(q) || m.id.includes(q))).slice(0, 4);
  const starMatches = NEARBY_STARS.filter((s) => q && s.name.toLowerCase().includes(q)).slice(0, 3);
  const galaxyMatches = GALAXIES.filter((g) => q && g.name.toLowerCase().includes(q)).slice(0, 3);
  const hasResults = bodyMatches.length + modeMatches.length + starMatches.length + galaxyMatches.length > 0;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="lab-rail pointer-events-auto flex h-12 items-center gap-3 border-x-0 border-t-0 px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-md border border-amber-200/25 bg-amber-200/10 font-serif text-[13px] text-amber-100">
            U
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-medium tracking-tight text-white">Universe Explorer</div>
            <div className="hidden truncate text-[10px] uppercase tracking-[0.16em] text-white/50 sm:block">
              {lab?.label ?? "Laboratory"}
            </div>
          </div>
        </div>

        <div className="relative mx-auto hidden min-w-0 max-w-sm flex-1 md:block">
          <input
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Earth, Proxima, Andromeda…"
            className="h-8 w-full rounded-md border border-white/10 bg-black/40 px-3 text-[13px] text-white placeholder:text-white/35"
          />
          {q.length > 0 && (
            <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-white/10 bg-[#080a12]/96">
              {!hasResults && <div className="px-3 py-2 text-[13px] text-white/50">No matches</div>}
              {modeMatches.map((mode) => (
                <SearchRow
                  key={mode.id}
                  label={mode.label}
                  meta="mode"
                  onClick={() => {
                    useExplorer.getState().setLabMode(mode.id);
                    setSearch("");
                  }}
                />
              ))}
              {bodyMatches.map((body) => (
                <SearchRow
                  key={body.id}
                  label={body.name}
                  meta={body.type}
                  onClick={() => {
                    useExplorer.getState().setLabMode("solar-system");
                    useExplorer.getState().focus(body.id);
                    setSearch("");
                  }}
                />
              ))}
              {starMatches.map((star) => (
                <SearchRow
                  key={star.id}
                  label={star.name}
                  meta="nearby star"
                  onClick={() => {
                    useExplorer.getState().setLabMode("stellar");
                    setSearch("");
                  }}
                />
              ))}
              {galaxyMatches.map((galaxy) => (
                <SearchRow
                  key={galaxy.id}
                  label={galaxy.name}
                  meta={galaxy.type}
                  onClick={() => {
                    useExplorer.getState().setLabMode(GALAXY_MODE[galaxy.id] ?? "galaxies");
                    setSearch("");
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden items-center rounded-md border border-white/10 p-0.5 lg:flex">
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setAccuracy(mode)}
                className={`rounded px-2 py-1 text-[10px] uppercase tracking-wider ${
                  accuracyMode === mode ? "bg-amber-200 text-black" : "text-white/55 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="hidden items-center rounded-md border border-white/10 p-0.5 xl:flex">
            {(Object.keys(WAVELENGTH_LOOK) as Wavelength[]).map((w) => (
              <button
                key={w}
                title={WAVELENGTH_LOOK[w].label}
                onClick={() => setWavelength(w)}
                className={`min-w-7 rounded px-1.5 py-1 text-[10px] ${
                  wavelength === w ? "bg-white text-black" : "text-white/50 hover:text-white"
                }`}
              >
                {WAVE_SHORT[w]}
              </button>
            ))}
          </div>
          <div className="hidden font-mono text-[11px] text-amber-50/80 lg:block">{date}</div>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(window.location.href).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              }).catch(() => undefined);
            }}
            className="hidden rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/70 sm:block"
          >
            {copied ? "Copied" : "Share"}
          </button>
          <button
            type="button"
            onClick={() => (tourOpen ? endTour() : startTour())}
            className={`rounded-md border px-2 py-1 text-[11px] ${
              tourOpen ? "border-amber-200/30 bg-amber-200/10 text-amber-50" : "border-white/10 text-white/70"
            }`}
          >
            Tour
          </button>
          <button
            type="button"
            onClick={() => useExplorer.setState({ helpOpen: !helpOpen })}
            className={`rounded-md border px-2 py-1 text-[11px] ${
              helpOpen ? "border-amber-200/30 bg-amber-200/10 text-amber-50" : "border-white/10 text-white/70"
            }`}
          >
            Help
          </button>
          <button
            type="button"
            onClick={() => useExplorer.setState({ dockOpen: !dockOpen })}
            className={`rounded-md border px-2 py-1 text-[11px] ${
              dockOpen ? "border-amber-200/30 bg-amber-200/10 text-amber-50" : "border-white/10 text-white/70"
            }`}
          >
            Catalog
          </button>
          <button
            type="button"
            onClick={() => useExplorer.setState({ inspectorOpen: !inspectorOpen })}
            className={`rounded-md border px-2 py-1 text-[11px] ${
              inspectorOpen ? "border-amber-200/30 bg-amber-200/10 text-amber-50" : "border-white/10 text-white/70"
            }`}
          >
            Data
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchRow({ label, meta, onClick }: { label: string; meta: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-white/5"
    >
      <span>{label}</span>
      <span className="text-[10px] uppercase tracking-wider text-white/45">{meta}</span>
    </button>
  );
}
