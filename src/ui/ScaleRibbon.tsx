"use client";

import type { LabMode } from "@/engine/types";
import { formatDistance } from "@/engine/units";
import { SCALE_BANDS, renderUnitLabel, renderUnitMeters, scaleFromDistance } from "@/engine/scale";
import { useExplorer } from "@/simulation/store";

const BAND_TO_MODE: Record<string, LabMode> = {
  "planet-surface": "solar-system",
  planetary: "solar-system",
  "solar-system": "solar-system",
  stellar: "stellar",
  galactic: "milky-way",
  "local-group": "local-group",
  cluster: "cosmic-web",
  "cosmic-web": "cosmic-web",
  "observable-universe": "observable-universe",
};

const SHORT: Record<string, string> = {
  "planet-surface": "Gnd",
  planetary: "Plnt",
  "solar-system": "Sol",
  stellar: "Star",
  galactic: "MW",
  "local-group": "Grp",
  cluster: "Clus",
  "cosmic-web": "Web",
  "observable-universe": "Obs",
};

export function ScaleRibbon() {
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const labMode = useExplorer((s) => s.labMode);
  const scale = scaleFromDistance(cameraDistanceM);
  const unit = renderUnitMeters(cameraDistanceM);
  const activeLabel =
    labMode === "solar-system" ? SCALE_BANDS.find((b) => b.id === scale)?.label : labMode.replaceAll("-", " ");

  return (
    <div className="pointer-events-none absolute bottom-[4.75rem] left-1/2 z-20 w-[min(640px,calc(100vw-1.5rem))] -translate-x-1/2">
      <div className="lab-panel px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-white/50">
          <span>{activeLabel}</span>
          <span className="font-mono text-amber-100/75">
            {labMode === "solar-system"
              ? `${formatDistance(cameraDistanceM)} · ${renderUnitLabel(unit)}`
              : "local frame"}
          </span>
        </div>
        <div className="relative mx-1 h-7">
          <div className="absolute top-[11px] right-0 left-0 h-px bg-white/15" />
          {SCALE_BANDS.map((band, i) => {
            const left = (i / (SCALE_BANDS.length - 1)) * 100;
            const active = BAND_TO_MODE[band.id] === labMode;
            return (
              <button
                key={band.id}
                type="button"
                className="pointer-events-auto absolute top-0 flex h-7 w-7 -translate-x-1/2 flex-col items-center justify-center"
                style={{ left: `${left}%` }}
                title={band.label}
                onClick={() => useExplorer.getState().setLabMode(BAND_TO_MODE[band.id])}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-amber-200" : "bg-white/35"}`} />
              </button>
            );
          })}
          {labMode === "solar-system" && (
            <div
              className="pointer-events-none absolute top-[8px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white"
              style={{ left: `${Math.min(100, Math.max(0, marker(cameraDistanceM)))}%` }}
            />
          )}
        </div>
        <div className="mt-0.5 hidden justify-between px-0.5 text-[9px] tracking-wide text-white/40 sm:flex">
          {SCALE_BANDS.map((band) => (
            <span key={band.id} className="w-7 text-center">
              {SHORT[band.id]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function marker(distanceM: number) {
  const logMin = Math.log10(1e6);
  const logMax = Math.log10(8e21);
  return ((Math.log10(distanceM) - logMin) / (logMax - logMin)) * 100;
}
