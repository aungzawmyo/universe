export type StellarStage =
  | "gas-cloud"
  | "protostar"
  | "main-sequence"
  | "red-giant"
  | "red-supergiant"
  | "planetary-nebula"
  | "white-dwarf"
  | "supernova"
  | "neutron-star"
  | "black-hole";

export interface StellarSnapshot {
  stage: StellarStage;
  label: string;
  temperatureK: number;
  luminositySolar: number;
  radiusSolar: number;
  color: string;
  remnant: "none" | "white-dwarf" | "neutron-star" | "black-hole";
  branch: "low-mass" | "massive";
}

export function msLifetimeMyr(massSolar: number): number {
  return 10000 * Math.pow(Math.max(0.08, massSolar), -2.5);
}

export function stellarSnapshot(massSolar: number, ageMyr: number): StellarSnapshot {
  const m = Math.max(0.08, massSolar);
  const tau = msLifetimeMyr(m);
  const massive = m >= 8;
  const branch = massive ? "massive" : "low-mass";

  if (ageMyr < tau * 0.02) {
    return {
      stage: ageMyr < tau * 0.008 ? "gas-cloud" : "protostar",
      label: ageMyr < tau * 0.008 ? "Molecular cloud" : "Protostar",
      temperatureK: 800 + ageMyr * 40,
      luminositySolar: 0.2 * m,
      radiusSolar: 8 * m,
      color: "#7ecbff",
      remnant: "none",
      branch,
    };
  }
  if (ageMyr < tau) {
    const t = 5800 * Math.pow(m, 0.5);
    return {
      stage: "main-sequence",
      label: "Main sequence",
      temperatureK: t,
      luminositySolar: Math.pow(m, 3.5),
      radiusSolar: Math.pow(m, 0.8),
      color: tempColor(t),
      remnant: "none",
      branch,
    };
  }
  if (!massive) {
    if (ageMyr < tau * 1.15) {
      return {
        stage: "red-giant",
        label: "Red giant",
        temperatureK: 3500,
        luminositySolar: 400 * m,
        radiusSolar: 80 * m,
        color: "#ff6a2c",
        remnant: "none",
        branch,
      };
    }
    if (ageMyr < tau * 1.22) {
      return {
        stage: "planetary-nebula",
        label: "Planetary nebula",
        temperatureK: 90000,
        luminositySolar: 20,
        radiusSolar: 0.4,
        color: "#6cf0c8",
        remnant: "none",
        branch,
      };
    }
    return {
      stage: "white-dwarf",
      label: "White dwarf",
      temperatureK: 12000,
      luminositySolar: 0.01,
      radiusSolar: 0.01,
      color: "#dfefff",
      remnant: "white-dwarf",
      branch,
    };
  }
  if (ageMyr < tau * 1.08) {
    return {
      stage: "red-supergiant",
      label: "Red supergiant",
      temperatureK: 3200,
      luminositySolar: 1e5 * Math.min(m, 30),
      radiusSolar: 400,
      color: "#ff4d18",
      remnant: "none",
      branch,
    };
  }
  if (ageMyr < tau * 1.081) {
    return {
      stage: "supernova",
      label: "Supernova",
      temperatureK: 1e6,
      luminositySolar: 1e9,
      radiusSolar: 2000,
      color: "#fff4c2",
      remnant: "none",
      branch,
    };
  }
  if (m < 20) {
    return {
      stage: "neutron-star",
      label: "Neutron star",
      temperatureK: 1e6,
      luminositySolar: 0.001,
      radiusSolar: 1.4e-5,
      color: "#b8e0ff",
      remnant: "neutron-star",
      branch,
    };
  }
  return {
    stage: "black-hole",
    label: "Stellar-mass black hole",
    temperatureK: 0,
    luminositySolar: 0,
    radiusSolar: 4e-6 * m,
    color: "#0b0b12",
    remnant: "black-hole",
    branch,
  };
}

export function tempColor(t: number): string {
  if (t > 25000) return "#9bbcff";
  if (t > 10000) return "#cfe6ff";
  if (t > 7500) return "#fff4d2";
  if (t > 6000) return "#ffe6b0";
  if (t > 5000) return "#ffb56b";
  return "#ff7d3a";
}

export function schwarzschildKm(massSolar: number): number {
  return (2.95 * massSolar);
}

export function photonSphereKm(massSolar: number): number {
  return 1.5 * schwarzschildKm(massSolar);
}

export function timeDilation(massSolar: number, rKm: number): number {
  const rs = schwarzschildKm(massSolar);
  if (rKm <= rs) return 0;
  return Math.sqrt(Math.max(0, 1 - rs / rKm));
}

export interface CosmicEpoch {
  id: string;
  name: string;
  timeLabel: string;
  logSeconds: number;
  temperatureK: number;
  scaleFactor: number;
  description: string;
}

export const COSMIC_EPOCHS: CosmicEpoch[] = [
  { id: "planck", name: "Planck epoch", timeLabel: "10⁻⁴³ s", logSeconds: -43, temperatureK: 1e32, scaleFactor: 1e-32, description: "Quantum gravity. Not an explosion in empty space." },
  { id: "inflation", name: "Inflation", timeLabel: "10⁻³⁶ s", logSeconds: -36, temperatureK: 1e27, scaleFactor: 1e-28, description: "Space itself expands exponentially." },
  { id: "quark", name: "Quark / Hadron era", timeLabel: "10⁻⁶ s", logSeconds: -6, temperatureK: 1e13, scaleFactor: 1e-13, description: "Quarks confine into protons and neutrons." },
  { id: "bbn", name: "Nucleosynthesis", timeLabel: "~3 min", logSeconds: 2.25, temperatureK: 1e9, scaleFactor: 1e-9, description: "Hydrogen, helium, and a trace of lithium form." },
  { id: "cmb", name: "Recombination / CMB", timeLabel: "380,000 yr", logSeconds: 13.08, temperatureK: 3000, scaleFactor: 9e-4, description: "The universe becomes transparent. We still see this as the CMB." },
  { id: "first-stars", name: "First stars", timeLabel: "100–200 Myr", logSeconds: 15.7, temperatureK: 60, scaleFactor: 0.05, description: "Population III stars ignite." },
  { id: "early-galaxies", name: "Early galaxies", timeLabel: "~1 Gyr", logSeconds: 16.5, temperatureK: 19, scaleFactor: 0.2, description: "First galaxies assemble in dark-matter halos." },
  { id: "solar", name: "Solar System forms", timeLabel: "9.2 Gyr", logSeconds: 17.46, temperatureK: 4, scaleFactor: 0.7, description: "The Sun and planets condense." },
  { id: "now", name: "Present", timeLabel: "13.8 Gyr", logSeconds: 17.64, temperatureK: 2.725, scaleFactor: 1, description: "Observer-centered now. Farther out is farther back in time." },
];

export function epochFromSlider(t: number): CosmicEpoch {
  const u = Math.min(1, Math.max(0, t));
  const idx = Math.round(u * (COSMIC_EPOCHS.length - 1));
  return COSMIC_EPOCHS[idx];
}

export function interpolateEpoch(t: number): CosmicEpoch & { mix: number } {
  const u = Math.min(0.999, Math.max(0, t)) * (COSMIC_EPOCHS.length - 1);
  const i = Math.floor(u);
  const f = u - i;
  const a = COSMIC_EPOCHS[i];
  const b = COSMIC_EPOCHS[i + 1];
  return {
    ...a,
    name: f < 0.5 ? a.name : b.name,
    timeLabel: f < 0.5 ? a.timeLabel : b.timeLabel,
    description: f < 0.5 ? a.description : b.description,
    temperatureK: a.temperatureK * Math.pow(b.temperatureK / a.temperatureK, f),
    scaleFactor: a.scaleFactor * Math.pow(b.scaleFactor / a.scaleFactor, f),
    mix: f,
  };
}

export const GALAXIES = [
  { id: "milky-way", name: "Milky Way", type: "Barred Spiral", massSolar: 1.5e12, distanceLy: 0, color: "#ffe6b0" },
  { id: "andromeda", name: "Andromeda", type: "Spiral", massSolar: 1.2e12, distanceLy: 2.537e6, color: "#cfe6ff" },
  { id: "triangulum", name: "Triangulum", type: "Spiral", massSolar: 5e10, distanceLy: 2.73e6, color: "#ffd9a0" },
  { id: "lmc", name: "Large Magellanic Cloud", type: "Irregular", massSolar: 1e10, distanceLy: 1.63e5, color: "#ffb56b" },
  { id: "smc", name: "Small Magellanic Cloud", type: "Dwarf", massSolar: 7e9, distanceLy: 2.0e5, color: "#ff8a4a" },
  { id: "m87", name: "M87", type: "Elliptical", massSolar: 2.4e12, distanceLy: 5.3e7, color: "#f0d48a" },
  { id: "whirlpool", name: "Whirlpool Galaxy", type: "Spiral", massSolar: 1.6e11, distanceLy: 2.3e7, color: "#b8e0ff" },
  { id: "sombrero", name: "Sombrero Galaxy", type: "Lenticular", massSolar: 8e11, distanceLy: 2.9e7, color: "#e6d3a0" },
] as const;

export const LOOKBACK_SHELLS = [
  { name: "Nearby galaxies", z: 0.01, lookbackGyr: 0.14, color: "#dfefff" },
  { name: "Distant galaxies", z: 1, lookbackGyr: 7.7, color: "#8cf4ff" },
  { name: "Early galaxies", z: 6, lookbackGyr: 12.8, color: "#6aa7ff" },
  { name: "Recombination", z: 1100, lookbackGyr: 13.8, color: "#ffb56b" },
  { name: "CMB", z: 1100, lookbackGyr: 13.8, color: "#ff7a3a" },
];
