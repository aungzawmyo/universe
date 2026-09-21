"use client";

import { C, G } from "@/engine/constants";
import { gravitationalParameter, orbitalPeriod, schwarzschildRadius } from "@/engine/kepler";
import {
  formatDistance,
  formatMass,
  formatRadius,
  formatSpeed,
  formatTemperature,
  formatTime,
  lightTravelTime,
} from "@/engine/units";
import { GALAXIES, interpolateEpoch, photonSphereKm, schwarzschildKm, stellarSnapshot, timeDilation } from "@/lab/models";
import { bodyPlan, lifeWorld } from "@/life/engine";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import type { CameraMode, LabMode } from "@/engine/types";
import { length } from "@/engine/vec3";
import type { ReactNode } from "react";

const ACTIONS: { mode: CameraMode; label: string }[] = [
  { mode: "orbit", label: "Orbit" },
  { mode: "follow", label: "Follow" },
  { mode: "free", label: "Free fly" },
  { mode: "surface", label: "Surface view" },
  { mode: "telescope", label: "Telescope" },
  { mode: "photon", label: "Photon" },
];

export function Inspector() {
  const open = useExplorer((s) => s.inspectorOpen);
  const labMode = useExplorer((s) => s.labMode);
  if (!open) return null;
  if (labMode !== "solar-system") return <ModeInspector mode={labMode} />;
  return <BodyInspector />;
}

function BodyInspector() {
  const selectedId = useExplorer((s) => s.selectedId);
  const cameraMode = useExplorer((s) => s.cameraMode);
  const setCameraMode = useExplorer((s) => s.setCameraMode);
  const tick = useExplorer((s) => s.tick);
  const layers = useExplorer((s) => s.layers);
  const toggleLayer = useExplorer((s) => s.toggleLayer);
  const measureA = useExplorer((s) => s.measureA);
  const measureB = useExplorer((s) => s.measureB);
  void tick;

  const body = selectedId ? simulation.body(selectedId) : undefined;
  if (!body) {
    return (
      <aside className="lab-panel pointer-events-none absolute top-16 right-3 z-20 hidden w-64 p-3 text-[13px] text-white/55 lg:block">
        Select a world from the catalog to inspect mass, light time, and camera.
      </aside>
    );
  }

  const parent = simulation.parentOf(body);
  const sun = simulation.body("sun");
  const toSun = sun ? simulation.distance(body.id, "sun") : 0;
  const toParent = parent ? simulation.distance(body.id, parent.id) : 0;
  const speed = length(body.velocityMS);
  const eclipse = simulation.eclipseHint();
  const rs = body.type === "star" || body.type === "black-hole" ? schwarzschildRadius(body.massKg) : null;
  const measured =
    measureA && measureB && simulation.body(measureA) && simulation.body(measureB)
      ? simulation.distance(measureA, measureB)
      : 0;
  const vesc = Math.sqrt((2 * G * body.massKg) / Math.max(1, body.radiusM));
  const periodS =
    body.orbit && parent
      ? orbitalPeriod(gravitationalParameter(parent.massKg, body.massKg), body.orbit.a)
      : null;
  const energy = simulation.physicsMode === "nbody" ? simulation.mechanicalEnergy() : null;
  const peerA = measureA ? simulation.body(measureA) : undefined;
  const peerB = measureB ? simulation.body(measureB) : undefined;

  return (
    <Shell
      kicker={body.type}
      title={body.name}
      badge={body.dataSource}
    >
      <div className="flex flex-wrap gap-1">
        {ACTIONS.map((a) => (
          <button
            key={a.mode}
            onClick={() => {
              if (a.mode === "photon") simulation.emitPhoton(body.id);
              useExplorer.getState().focus(body.id);
              setCameraMode(a.mode);
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              cameraMode === a.mode ? "bg-amber-200 text-black" : "bg-white/6 text-white/70 hover:bg-white/10"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <Row label="Mass" value={formatMass(body.massKg)} />
      <Row label="Radius" value={formatRadius(body.radiusM)} />
      {body.temperatureK ? <Row label="Temperature" value={formatTemperature(body.temperatureK)} /> : null}
      {body.spectralClass ? <Row label="Spectral class" value={body.spectralClass} /> : null}
      {body.luminosityW ? <Row label="Luminosity" value={`${body.luminosityW.toExponential(3)} W`} /> : null}
      <Row label="Velocity" value={formatSpeed(speed)} />
      {sun && body.id !== "sun" && (
        <>
          <Row label="Distance to Sun" value={formatDistance(toSun)} />
          <Row label="Light travel" value={lightTravelTime(toSun)} />
        </>
      )}
      {parent && parent.id !== "sun" && <Row label={`Distance to ${parent.name}`} value={formatDistance(toParent)} />}
      {measured > 0 && (
        <>
          <Row label={`Measure ${measureA}→${measureB}`} value={formatDistance(measured)} />
          <Row label="Light time" value={lightTravelTime(measured)} />
        </>
      )}
      <Row label="Rotation" value={formatTime(Math.abs(body.rotationPeriodS))} />
      {periodS ? <Row label="Orbital period" value={formatTime(periodS)} /> : null}
      <Row label="Escape speed" value={formatSpeed(vesc)} />
      <Row label="Axial tilt" value={`${body.axialTiltDeg.toFixed(2)}°`} />
      {rs ? <Row label="Schwarzschild radius" value={formatDistance(rs)} /> : null}
      <Row label="Physics engine" value={simulation.physicsMode === "nbody" ? "N-body" : "Keplerian"} />
      {energy ? <EnergyPlot current={energy.total} /> : null}
      {peerA && peerB && peerA.id !== peerB.id ? (
        <div className="rounded-md border border-white/10 p-2">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-white/50">Compare</div>
          <Row label={`${peerA.name} mass`} value={formatMass(peerA.massKg)} />
          <Row label={`${peerB.name} mass`} value={formatMass(peerB.massKg)} />
          <Row label={`${peerA.name} radius`} value={formatRadius(peerA.radiusM)} />
          <Row label={`${peerB.name} radius`} value={formatRadius(peerB.radiusM)} />
        </div>
      ) : null}
      {eclipse && body.id === "earth" ? (
        <div className="rounded-xl border border-amber-200/20 bg-amber-200/8 px-3 py-2 text-[12px] text-amber-100">
          {eclipse}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-1 pt-2">
        {(
          [
            ["orbits", "Show orbit"],
            ["gravity", "Show gravity"],
            ["velocity", "Show velocity"],
            ["atmospheres", "Atmosphere"],
            ["labels", "Labels"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            className={`rounded-lg px-2 py-1.5 text-[11px] ${
              layers[key] ? "bg-white/12 text-white" : "bg-white/4 text-white/45"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-white/35">
        A photon from the Sun takes {formatTime((toSun || 1.496e11) / C)} to reach this object. Press{" "}
        <kbd className="rounded bg-white/10 px-1">P</kbd> to emit one.
      </p>
    </Shell>
  );
}

function ModeInspector({ mode }: { mode: LabMode }) {
  const tick = useExplorer((s) => s.tick);
  void tick;
  if (mode === "stellar") return <StellarInspector />;
  if (mode === "black-hole") return <BlackHoleInspector />;
  if (mode === "neutron-star") return <NeutronInspector />;
  if (mode === "nebula") return <NebulaInspector />;
  if (mode === "light") return <LightInspector />;
  if (mode === "spacetime") return <SpacetimeInspector />;
  if (mode === "milky-way") {
    return (
      <Shell kicker="galaxy" title="Milky Way" badge="statistical">
        <Row label="Type" value="SBbc barred spiral" />
        <Row label="Stars" value="~200 billion (LOD)" />
        <Row label="Center" value="Sagittarius A*" />
        <Row label="Sun" value="Orion–Cygnus arm" />
        <p className="text-[11px] text-white/40">Level 1 spiral-arm particles. Catalog stars appear at stellar scale.</p>
      </Shell>
    );
  }
  if (mode === "galaxies") {
    return (
      <Shell kicker="survey" title="Galaxy types" badge="real">
        {GALAXIES.map((g) => (
          <Row key={g.id} label={g.name} value={g.type} />
        ))}
      </Shell>
    );
  }
  if (mode === "local-group") {
    const t = useExplorer.getState().andromedaT;
    return (
      <Shell kicker="group" title="Local Group" badge="real">
        <Row label="Members" value="MW, Andromeda, satellites" />
        <Row label="Encounter" value={`${(t * 4.5).toFixed(2)} Gyr`} />
        <p className="text-[11px] text-white/40">Approximate N-body-style approach. Time is accelerated.</p>
      </Shell>
    );
  }
  if (mode === "cosmic-web") {
    return (
      <Shell kicker="lss" title="Cosmic web" badge="procedural">
        <Row label="Nodes" value="Galaxy clusters" />
        <Row label="Connections" value="Filaments" />
        <Row label="Empty volume" value="Voids" />
      </Shell>
    );
  }
  if (mode === "observable-universe") {
    return (
      <Shell kicker="cosmology" title="Observable universe" badge="educational">
        <Row label="Center" value="Observer / Earth" />
        <Row label="Outer shell" value="CMB · z ≈ 1100" />
        <p className="text-[11px] text-white/40">Farther out is younger. Distance = looking into the past.</p>
      </Shell>
    );
  }
  if (mode === "life") return <LifeInspector />;
  return <BigBangInspector />;
}

function StellarInspector() {
  const mass = useExplorer((s) => s.starMassSolar);
  const age = useExplorer((s) => s.starAgeMyr);
  const running = useExplorer((s) => s.starRunning);
  const snap = stellarSnapshot(mass, age);
  return (
    <Shell kicker={snap.branch} title={snap.label} badge="model">
      <Row label="Mass" value={`${mass.toFixed(2)} M☉`} />
      <Row label="Age" value={`${age.toFixed(0)} Myr`} />
      <Row label="T_eff" value={`${Math.round(snap.temperatureK).toLocaleString()} K`} />
      <Row label="Luminosity" value={`${snap.luminositySolar.toExponential(2)} L☉`} />
      <Row label="Radius" value={`${snap.radiusSolar.toExponential(2)} R☉`} />
      <Row label="Remnant" value={snap.remnant} />
      <HRDiagram mass={mass} age={age} />
      <button
        onClick={() => useExplorer.setState({ starRunning: !running })}
        className="w-full rounded-xl bg-amber-200 py-2 text-sm text-black"
      >
        {running ? "Pause life cycle" : "Run life cycle"}
      </button>
    </Shell>
  );
}

function HRDiagram({ mass, age }: { mass: number; age: number }) {
  const snap = stellarSnapshot(mass, age);
  const x = 100 - Math.min(100, Math.max(0, ((snap.temperatureK - 2500) / 30000) * 100));
  const y = 100 - Math.min(100, Math.max(0, (Math.log10(snap.luminositySolar + 0.001) + 3) * 14));
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/35">Hertzsprung–Russell</div>
      <svg viewBox="0 0 100 70" className="h-28 w-full rounded-xl bg-black/30">
        <text x="4" y="10" fill="#ffffff55" fontSize="4">L</text>
        <text x="80" y="68" fill="#ffffff55" fontSize="4">T → cool</text>
        <circle cx={x} cy={y} r="2.4" fill="#f2d48a" />
      </svg>
    </div>
  );
}

function BlackHoleInspector() {
  const mass = useExplorer((s) => s.bhMassSolar);
  const spin = useExplorer((s) => s.bhSpin);
  const inc = useExplorer((s) => s.bhInclination);
  const obs = useExplorer((s) => s.bhObserverKm);
  const set = (patch: object) => useExplorer.setState(patch);
  return (
    <Shell kicker="GR" title="Black hole" badge="simulation">
      <Row label="Mass" value={`${mass.toFixed(1)} M☉`} />
      <Row label="Spin a*" value={spin.toFixed(2)} />
      <Row label="rₛ" value={`${schwarzschildKm(mass).toFixed(1)} km`} />
      <Row label="Photon sphere" value={`${photonSphereKm(mass).toFixed(1)} km`} />
      <Row label="Time dilation" value={timeDilation(mass, obs).toFixed(3)} />
      <Slider label="Mass" min={2} max={40} step={0.5} value={mass} onChange={(v) => set({ bhMassSolar: v })} />
      <Slider label="Spin" min={0} max={0.998} step={0.01} value={spin} onChange={(v) => set({ bhSpin: v })} />
      <Slider label="Inclination" min={0} max={89} step={1} value={inc} onChange={(v) => set({ bhInclination: v })} />
      <Slider label="Observer km" min={200} max={8000} step={50} value={obs} onChange={(v) => set({ bhObserverKm: v })} />
    </Shell>
  );
}

function NeutronInspector() {
  const period = useExplorer((s) => s.nsPeriodS);
  const field = useExplorer((s) => s.nsFieldT);
  return (
    <Shell kicker="pulsar" title="Neutron star" badge="model">
      <Row label="Typical mass" value="1.4 M☉" />
      <Row label="Radius" value="~12 km" />
      <Row label="Period" value={`${period.toFixed(3)} s`} />
      <Row label="B-field" value={`${field.toExponential(2)} T`} />
      <Slider label="Spin period" min={0.001} max={2} step={0.001} value={period} onChange={(v) => useExplorer.setState({ nsPeriodS: v })} />
      <Slider label="log B" min={6} max={11} step={0.1} value={Math.log10(field)} onChange={(v) => useExplorer.setState({ nsFieldT: 10 ** v })} />
      <p className="text-[11px] text-white/40">Orbit the camera while it spins — that is why pulsars pulse.</p>
    </Shell>
  );
}

function NebulaInspector() {
  const density = useExplorer((s) => s.nebulaDensity);
  const collapsed = useExplorer((s) => s.nebulaCollapsed);
  return (
    <Shell kicker="ISM" title="Nebula" badge="visual">
      <Row label="Representation" value="GPU particles" />
      <Row label="Density" value={`${(density * 100).toFixed(0)}%`} />
      <Row label="State" value={collapsed ? "Protostar" : "Cloud"} />
      <Slider label="Density" min={0.05} max={1} step={0.01} value={density} onChange={(v) => useExplorer.setState({ nebulaDensity: v })} />
      <button
        onClick={() => useExplorer.setState({ nebulaCollapsed: !collapsed })}
        className="w-full rounded-xl bg-white/10 py-2 text-sm"
      >
        {collapsed ? "Reset cloud" : "Gravity collapse"}
      </button>
    </Shell>
  );
}

function LightInspector() {
  const z = useExplorer((s) => s.redshiftZ);
  const lens = useExplorer((s) => s.lensMass);
  return (
    <Shell kicker="photons" title="Light laboratory" badge="educational">
      <Row label="1 + z" value={(1 + z).toFixed(3)} />
      <Row label="Lens mass" value={`${lens.toExponential(2)} M☉`} />
      <Slider label="Redshift z" min={0} max={6} step={0.05} value={z} onChange={(v) => useExplorer.setState({ redshiftZ: v })} />
      <Slider label="log lens mass" min={8} max={13} step={0.1} value={Math.log10(lens)} onChange={(v) => useExplorer.setState({ lensMass: 10 ** v })} />
      <p className="text-[11px] text-white/40">λ_obs / λ_em = 1+z. Paths are null geodesics, not Newtonian rays.</p>
    </Shell>
  );
}

function SpacetimeInspector() {
  const layers = useExplorer((s) => s.layers);
  const toggle = useExplorer((s) => s.toggleLayer);
  return (
    <Shell kicker="GR" title="Spacetime" badge="analogy">
      <p className="text-[11px] text-white/45">The rubber sheet is an analogy. 3+1 spacetime is not a 2D well in space.</p>
      {(["spacetime", "geodesics", "lightCones"] as const).map((key) => (
        <label key={key} className="flex items-center justify-between text-sm">
          <span>{key}</span>
          <input type="checkbox" checked={layers[key]} onChange={() => toggle(key)} className="accent-amber-300" />
        </label>
      ))}
    </Shell>
  );
}

function BigBangInspector() {
  const t = useExplorer((s) => s.cosmologyT);
  const epoch = interpolateEpoch(t);
  return (
    <Shell kicker="timeline" title={epoch.name} badge="educational">
      <Row label="Time" value={epoch.timeLabel} />
      <Row label="Temperature" value={`${epoch.temperatureK.toExponential(2)} K`} />
      <Row label="Scale factor a" value={epoch.scaleFactor.toExponential(2)} />
      <p className="text-[11px] text-white/40">{epoch.description}</p>
    </Shell>
  );
}

function EnergyPlot({ current }: { current: number }) {
  const samples = simulation.energyHistory;
  const first = samples[0]?.total ?? current;
  const drift = (current - first) / Math.max(Math.abs(first), 1);
  const totals = samples.map((s) => s.total);
  const min = totals.length ? Math.min(...totals) : current;
  const max = totals.length ? Math.max(...totals) : current;
  const span = Math.max(max - min, Math.abs(first) * 1e-9, 1);
  const w = 220;
  const h = 36;
  const points =
    totals.length > 1
      ? totals
          .map((v, i) => {
            const x = (i / (totals.length - 1)) * w;
            const y = h - ((v - min) / span) * (h - 6) - 3;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ")
      : "";

  return (
    <div className="rounded-md border border-white/10 p-2">
      <Row label="N-body energy" value={`${current.toExponential(3)} J`} />
      {points ? (
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-9 w-full" aria-label="Mechanical energy over time">
          <polyline fill="none" stroke="#f0d48a" strokeWidth="1.4" points={points} />
        </svg>
      ) : null}
      <Row label="Relative drift" value={`${(drift * 100).toExponential(2)} %`} />
      <p className="pt-1 text-[11px] text-white/40">
        Verlet and leapfrog should hold this nearly flat. A climb or drop is integrator error, not new physics.
      </p>
    </div>
  );
}

function Shell({
  kicker,
  title,
  badge,
  children,
}: {
  kicker: string;
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <aside className="lab-panel pointer-events-auto absolute top-16 right-3 z-20 flex max-h-[min(34rem,calc(100vh-10.5rem))] w-[min(17.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden">
      <div className="border-b border-white/10 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">{kicker}</div>
            <h2 className="truncate font-serif text-xl text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/60">{badge}</span>
            <button
              type="button"
              aria-label="Close inspector"
              onClick={() => useExplorer.setState({ inspectorOpen: false })}
              className="rounded-md px-1.5 py-0.5 text-white/45 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 text-sm">{children}</div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/6 py-1.5">
      <span className="text-[11px] uppercase tracking-wider text-white/50">{label}</span>
      <span className="font-mono text-[12px] text-amber-50/90">{value}</span>
    </div>
  );
}

function LifeInspector() {
  const nutrient = useExplorer((s) => s.lifeNutrient);
  const mutation = useExplorer((s) => s.lifeMutation);
  const temperature = useExplorer((s) => s.lifeTemperature);
  const field = useExplorer((s) => s.lifeField);
  const selectedId = useExplorer((s) => s.lifeSelectedId);
  const stats = lifeWorld.stats();
  const org = lifeWorld.organisms.find((o) => o.id === selectedId && o.state !== "dead") ?? lifeWorld.selected();
  const genome = org?.genome;

  return (
    <Shell kicker="alife" title="Life laboratory" badge="model">
      <p className="text-[12px] leading-relaxed text-white/55">
        Information + energy + matter + self-organization. Fibonacci, fractals, automata, and
        reaction–diffusion are mechanisms — not a discovered law of life.
      </p>
      <Row label="Population" value={`${stats.population}`} />
      <Row label="Generation" value={`${stats.generation}`} />
      <Row label="Births / deaths" value={`${stats.births} / ${stats.deaths}`} />
      <Row label="Mean energy" value={stats.meanEnergy.toFixed(1)} />
      <Row label="Mean nodes" value={stats.meanNodes.toFixed(1)} />
      {org && genome ? (
        <>
          <div className="pt-1 text-[10px] uppercase tracking-wider text-white/50">Selected genome</div>
          <Row label="Body plan" value={bodyPlan(genome)} />
          <Row label="State" value={org.state} />
          <Row label="Stage / nodes" value={`${org.stage} / ${org.nodes.length}`} />
          <Row label="Energy" value={org.energy.toFixed(1)} />
          <Row label="Health" value={org.health.toFixed(2)} />
          <Row label="Fibonacci weight" value={genome.fibonacciWeight.toFixed(2)} />
          <Row label="Branch angle" value={`${((genome.branchAngle * 180) / Math.PI).toFixed(1)}°`} />
          <Row label="Length ratio α" value={genome.lengthRatio.toFixed(2)} />
          <Row label="Metabolism" value={genome.metabolism.toFixed(2)} />
          <Row label="Chaos r" value={genome.chaosR.toFixed(2)} />
          <Row label="Mutation" value={genome.mutationRate.toFixed(3)} />
        </>
      ) : (
        <p className="text-[12px] text-white/45">Click an organism on the dish to inspect its program.</p>
      )}
      <Slider
        label="Nutrient rain"
        min={0.05}
        max={1}
        step={0.01}
        value={nutrient}
        onChange={(v) => useExplorer.setState({ lifeNutrient: v })}
      />
      <Slider
        label="Mutation scale"
        min={0.2}
        max={4}
        step={0.1}
        value={mutation}
        onChange={(v) => useExplorer.setState({ lifeMutation: v })}
      />
      <Slider
        label="Temperature"
        min={0.1}
        max={1}
        step={0.01}
        value={temperature}
        onChange={(v) => useExplorer.setState({ lifeTemperature: v })}
      />
      <div className="flex gap-1">
        {(["resource", "morphogen", "none"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => useExplorer.setState({ lifeField: mode })}
            className={`flex-1 rounded-md py-1 text-[11px] ${
              field === mode ? "bg-amber-200 text-black" : "bg-white/8 text-white/60"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          lifeWorld.reset();
          useExplorer.setState({ lifeSelectedId: lifeWorld.selectedId });
          useExplorer.getState().pulse();
        }}
        className="w-full rounded-xl bg-amber-200 py-2 text-sm text-black"
      >
        Reseed dish
      </button>
    </Shell>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/35">{label}</div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-300" />
    </label>
  );
}
