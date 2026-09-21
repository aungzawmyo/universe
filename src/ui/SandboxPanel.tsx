"use client";

import { SOLAR_MASS } from "@/engine/constants";
import type { IntegratorName } from "@/engine/types";
import { simulation } from "@/simulation/engine";
import { applyExplorerScenario, SCENARIOS } from "@/simulation/scenarios";
import { useExplorer } from "@/simulation/store";

const CREATE = ["planet", "star", "binary", "asteroid", "black-hole", "neutron-star", "nebula", "galaxy", "life"] as const;

export function SandboxPanel() {
  const selectedId = useExplorer((s) => s.selectedId);
  const selected = selectedId ? simulation.body(selectedId) : undefined;
  const sun = simulation.body("sun");
  const gMul = simulation.G / 6.6743e-11;
  const labMode = useExplorer((s) => s.labMode);
  const integrator = useExplorer((s) => s.integrator);
  const createType = useExplorer((s) => s.createType);
  const measureA = useExplorer((s) => s.measureA);
  const measureB = useExplorer((s) => s.measureB);

  return (
    <div className="space-y-4 text-sm">
      <p className="text-[11px] leading-relaxed text-white/45">
        Explore → Measure → Modify → Simulate → Understand. Visual exaggeration never writes into the physics model.
      </p>

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">Create</div>
        <div className="grid grid-cols-2 gap-1">
          {CREATE.map((type) => (
            <button
              key={type}
              onClick={() => {
                useExplorer.setState({ createType: type });
                spawn(type, selectedId);
              }}
              className={`rounded-lg px-2 py-1.5 text-[11px] capitalize ${
                createType === type ? "bg-amber-200/20 text-amber-50" : "bg-white/6 text-white/70"
              }`}
            >
              {type.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">Scenarios</div>
        <div className="space-y-1">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => applyExplorerScenario(s.id, s.mode)}
              className="flex w-full flex-col rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-left hover:bg-white/8"
            >
              <span>{s.label}</span>
              <span className="text-[10px] text-white/35">{s.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {labMode === "solar-system" && sun && (
        <>
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
              Sun mass · {(sun.massKg / SOLAR_MASS).toFixed(2)} M☉
            </div>
            <input
              type="range"
              min={0.1}
              max={4}
              step={0.05}
              value={sun.massKg / SOLAR_MASS}
              onChange={(e) => {
                simulation.setMass("sun", Number(e.target.value) * SOLAR_MASS);
                useExplorer.getState().pulse();
              }}
              className="w-full accent-amber-300"
            />
          </label>
          {selected && selected.id !== "sun" && (
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                {selected.name} mass ×
                {(selected.massKg / (simulation.catalogMass(selected.id) || selected.massKg)).toFixed(2)}
              </div>
              <input
                type="range"
                min={0.1}
                max={8}
                step={0.1}
                defaultValue={1}
                onChange={(e) => {
                  const base = simulation.catalogMass(selected.id) || selected.massKg;
                  simulation.setMass(selected.id, Number(e.target.value) * base);
                  useExplorer.getState().pulse();
                }}
                className="w-full accent-amber-300"
              />
            </label>
          )}
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
              Gravitational constant · {gMul.toFixed(2)} G
            </div>
            <input
              type="range"
              min={0.2}
              max={3}
              step={0.05}
              value={gMul}
              onChange={(e) => {
                simulation.setG(Number(e.target.value));
                useExplorer.getState().pulse();
              }}
              className="w-full accent-amber-300"
            />
          </label>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">Integrator</div>
            <div className="flex gap-1">
              {(["verlet", "leapfrog", "rk4"] as IntegratorName[]).map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    simulation.integrator = name;
                    useExplorer.setState({ integrator: name });
                    simulation.enableNBody();
                  }}
                  className={`flex-1 rounded-lg py-1 text-[11px] uppercase ${
                    integrator === name ? "bg-amber-200 text-black" : "bg-white/8 text-white/60"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">Measure</div>
            <div className="grid grid-cols-2 gap-1">
              <select
                value={measureA ?? ""}
                onChange={(e) => useExplorer.setState({ measureA: e.target.value })}
                className="rounded-lg bg-black/40 px-2 py-1 text-[11px]"
              >
                {simulation.activeBodies().map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                value={measureB ?? ""}
                onChange={(e) => useExplorer.setState({ measureB: e.target.value })}
                className="rounded-lg bg-black/40 px-2 py-1 text-[11px]"
              >
                {simulation.activeBodies().map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function spawn(type: (typeof CREATE)[number], selectedId: string | null) {
  if (type === "asteroid") {
    const id = simulation.launchAsteroid(selectedId ?? "earth");
    if (id) useExplorer.getState().select(id);
    useExplorer.getState().setLabMode("solar-system");
  } else if (type === "black-hole") {
    const id = simulation.createBlackHole(10);
    if (id) useExplorer.getState().select(id);
    useExplorer.getState().setLabMode("solar-system");
  } else if (type === "star" || type === "binary") {
    simulation.addStarCompanion(type === "binary" ? 0.9 : 1.1);
    useExplorer.getState().setLabMode("solar-system");
  } else if (type === "neutron-star") {
    const id = simulation.createNeutronStar();
    if (id) useExplorer.getState().select(id);
    useExplorer.getState().setLabMode("solar-system");
  } else if (type === "nebula") {
    useExplorer.getState().setLabMode("nebula");
  } else if (type === "galaxy") {
    useExplorer.getState().setLabMode("galaxies");
  } else if (type === "life") {
    useExplorer.getState().setLabMode("life");
  } else if (type === "planet") {
    const id = simulation.launchAsteroid("earth");
    if (id) {
      const body = simulation.body(id);
      if (body) {
        body.type = "planet";
        body.name = "Sandbox planet";
        body.massKg = 5e24;
        body.radiusM = 6e6;
        body.color = "#6ecbff";
      }
      useExplorer.getState().select(id);
    }
    useExplorer.getState().setLabMode("solar-system");
  }
  useExplorer.getState().pulse();
}
