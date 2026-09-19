"use client";

import { SOLAR_MASS } from "@/engine/constants";
import type { IntegratorName, LabMode, ScenarioId } from "@/engine/types";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";

const SCENARIOS: { id: ScenarioId; label: string; hint: string; mode?: LabMode }[] = [
  { id: "reset", label: "Reset solar system", hint: "Restore real catalog state", mode: "solar-system" },
  { id: "double-sun", label: "Sun becomes 2 M☉", hint: "Recalculate trajectories", mode: "solar-system" },
  { id: "no-jupiter", label: "Jupiter disappears", hint: "What happens to the rest?", mode: "solar-system" },
  { id: "no-moon", label: "Earth without Moon", hint: "Remove the Moon", mode: "solar-system" },
  { id: "earth-to-venus", label: "Earth → Venus orbit", hint: "Move Earth inward", mode: "solar-system" },
  { id: "remove-sun", label: "Remove the Sun", hint: "Planets become unbound", mode: "solar-system" },
  { id: "rogue-star", label: "Add another star", hint: "Binary-ish encounter", mode: "solar-system" },
  { id: "red-giant", label: "Sun becomes red giant", hint: "Stellar life cycle", mode: "stellar" },
  { id: "binary-star", label: "Binary star system", hint: "Companion star", mode: "solar-system" },
  { id: "supernova", label: "Supernova explosion", hint: "15 M☉ life cycle", mode: "stellar" },
  { id: "ns-merger", label: "Neutron-star merger", hint: "Pulsar laboratory", mode: "neutron-star" },
  { id: "star-around-bh", label: "Star orbiting black hole", hint: "Add BH to the system", mode: "solar-system" },
  { id: "bh-lensing", label: "Black-hole lensing", hint: "Photon sphere + disk", mode: "black-hole" },
  { id: "andromeda", label: "Milky Way–Andromeda", hint: "Accelerated encounter", mode: "local-group" },
  { id: "expansion", label: "Universe expansion", hint: "Scale factor animation", mode: "big-bang" },
  { id: "cmb", label: "CMB formation", hint: "Recombination epoch", mode: "big-bang" },
  { id: "first-stars", label: "First stars", hint: "100–200 Myr", mode: "big-bang" },
  { id: "galaxy-formation", label: "Galaxy formation", hint: "Early galaxies", mode: "galaxies" },
];

const CREATE = ["planet", "star", "binary", "asteroid", "black-hole", "neutron-star", "nebula", "galaxy"] as const;

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
              onClick={() => runScenario(s.id, s.mode)}
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

function runScenario(id: ScenarioId, mode?: LabMode) {
  if (mode) useExplorer.getState().setLabMode(mode);
  if (id === "red-giant") useExplorer.setState({ starMassSolar: 1, starAgeMyr: 11000, starRunning: true, labMode: "stellar" });
  if (id === "supernova") useExplorer.setState({ starMassSolar: 15, starAgeMyr: 10, starRunning: true, labMode: "stellar" });
  if (id === "cmb") useExplorer.setState({ cosmologyT: 0.5, labMode: "big-bang" });
  if (id === "first-stars") useExplorer.setState({ cosmologyT: 0.65, labMode: "big-bang" });
  if (id === "expansion") useExplorer.setState({ cosmologyT: 0.2, labMode: "big-bang" });
  if (id === "andromeda") useExplorer.setState({ andromedaT: 0, labMode: "local-group" });
  if (id === "bh-lensing") {
    useExplorer.setState({ labMode: "black-hole" });
    useExplorer.getState().setLayer("lensing", true);
    useExplorer.getState().setLayer("geodesics", true);
  }
  simulation.applyScenario(id);
  useExplorer.getState().pulse();
}

function spawn(type: (typeof CREATE)[number], selectedId: string | null) {
  if (type === "asteroid") {
    const id = simulation.launchAsteroid(selectedId ?? "earth");
    if (id) useExplorer.getState().select(id);
    useExplorer.getState().setLabMode("solar-system");
  } else if (type === "black-hole") {
    useExplorer.getState().setLabMode("black-hole");
  } else if (type === "star" || type === "binary") {
    simulation.addStarCompanion(type === "binary" ? 0.9 : 1.1);
    useExplorer.getState().setLabMode("solar-system");
  } else if (type === "neutron-star") {
    useExplorer.getState().setLabMode("neutron-star");
  } else if (type === "nebula") {
    useExplorer.getState().setLabMode("nebula");
  } else if (type === "galaxy") {
    useExplorer.getState().setLabMode("galaxies");
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
