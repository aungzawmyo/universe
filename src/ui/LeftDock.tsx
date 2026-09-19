"use client";

import { TREE_ORDER } from "@/data/solar-system";
import { LAB_MODES } from "@/engine/types";
import type { LabMode, LayerFlags } from "@/engine/types";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { SandboxPanel } from "./SandboxPanel";

const TABS = [
  { id: "objects", label: "Catalog" },
  { id: "layers", label: "Layers" },
  { id: "sandbox", label: "Sandbox" },
] as const;

export function LeftDock() {
  const leftTab = useExplorer((s) => s.leftTab);
  const dockOpen = useExplorer((s) => s.dockOpen);
  const labMode = useExplorer((s) => s.labMode);
  const tick = useExplorer((s) => s.tick);
  void tick;
  if (!dockOpen) return null;

  return (
    <aside className="lab-panel pointer-events-auto absolute top-16 left-3 z-20 flex max-h-[min(34rem,calc(100vh-10.5rem))] w-[min(17.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden">
      <div className="border-b border-white/10 px-2 py-2">
        <div className="mb-1.5 px-1 text-[10px] uppercase tracking-[0.16em] text-white/50">Laboratory</div>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {LAB_MODES.map((mode) => (
            <button
              key={mode.id}
              title={mode.hint}
              onClick={() => useExplorer.getState().setLabMode(mode.id as LabMode)}
              className={`shrink-0 rounded-md px-2 py-1 text-[11px] ${
                labMode === mode.id ? "bg-amber-200 text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => useExplorer.setState({ leftTab: tab.id })}
            className={`flex-1 py-2 text-[11px] uppercase tracking-[0.14em] ${
              leftTab === tab.id ? "text-amber-100" : "text-white/45 hover:text-white/75"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {leftTab === "objects" && <ObjectTree />}
        {leftTab === "layers" && <LayersPanel />}
        {leftTab === "sandbox" && <SandboxPanel />}
      </div>
    </aside>
  );
}

function ObjectTree() {
  const selectedId = useExplorer((s) => s.selectedId);
  const labMode = useExplorer((s) => s.labMode);
  const bodies = TREE_ORDER.map((id) => simulation.body(id)).filter(Boolean);

  if (labMode !== "solar-system") {
    const current = LAB_MODES.find((m) => m.id === labMode);
    return (
      <p className="px-1 text-[13px] leading-relaxed text-white/55">
        {current?.hint}. Use the laboratory chips above to change scale.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {bodies.map((body) => {
        if (!body) return null;
        const indent = body.type === "moon" ? "pl-5" : "pl-1.5";
        return (
          <button
            key={body.id}
            onClick={() => useExplorer.getState().focus(body.id)}
            className={`flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[13px] ${indent} ${
              selectedId === body.id ? "bg-amber-200/15 text-amber-50" : "text-white/75 hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: body.color }} />
              {body.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/35">{body.type}</span>
          </button>
        );
      })}
      {simulation
        .activeBodies()
        .filter((b) => !TREE_ORDER.includes(b.id))
        .map((body) => (
          <button
            key={body.id}
            onClick={() => useExplorer.getState().focus(body.id)}
            className="flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-[13px] text-lime-200/80 hover:bg-white/5"
          >
            <span>{body.name}</span>
            <span className="text-[10px] uppercase text-white/35">{body.dataSource}</span>
          </button>
        ))}
    </div>
  );
}

const LAYER_GROUPS: { title: string; keys: (keyof LayerFlags)[] }[] = [
  { title: "Visual", keys: ["stars", "planets", "atmospheres", "nebulae", "asteroidBelt", "kuiperBelt", "trails"] },
  { title: "Physics", keys: ["orbits", "gravity", "velocity", "orbitalPlane", "centerOfMass", "lagrange"] },
  { title: "Relativity", keys: ["spacetime", "geodesics", "lensing", "lightCones"] },
  { title: "Cosmology", keys: ["redshift", "cmb", "darkMatter", "cosmicWeb", "lookback"] },
  { title: "Information", keys: ["labels", "distances", "masses", "temperatures"] },
];

function LayersPanel() {
  const layers = useExplorer((s) => s.layers);
  const toggleLayer = useExplorer((s) => s.toggleLayer);
  return (
    <div className="space-y-3">
      {LAYER_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="mb-1 px-1 text-[10px] uppercase tracking-[0.16em] text-white/50">{group.title}</div>
          <div className="space-y-0.5">
            {group.keys.map((key) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-md px-1.5 py-1.5 text-[13px] text-white/75 hover:bg-white/5"
              >
                <span className="capitalize">{key.replace(/[A-Z]/g, (c) => " " + c.toLowerCase())}</span>
                <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} className="accent-amber-300" />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
