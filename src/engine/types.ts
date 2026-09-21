import type { Vec3 } from "./vec3";

export type BodyType =
  | "star"
  | "planet"
  | "dwarf-planet"
  | "moon"
  | "asteroid"
  | "comet"
  | "black-hole"
  | "neutron-star"
  | "nebula"
  | "galaxy";

export type DataSource = "real" | "procedural" | "simulated";

export type PhysicsMode = "kepler" | "nbody";

export type AccuracyMode = "education" | "realistic" | "simulation";

export type CameraMode =
  | "orbit"
  | "follow"
  | "free"
  | "surface"
  | "telescope"
  | "photon";

export type CosmicScale =
  | "planet-surface"
  | "planetary"
  | "solar-system"
  | "stellar"
  | "galactic"
  | "local-group"
  | "cluster"
  | "cosmic-web"
  | "observable-universe";

export type Wavelength =
  | "gamma"
  | "xray"
  | "uv"
  | "visible"
  | "ir"
  | "microwave"
  | "radio";

export interface KeplerElements {
  /** Semi-major axis in meters. */
  a: number;
  eccentricity: number;
  /** Inclination, radians. */
  inclination: number;
  /** Longitude of ascending node, radians. */
  longitudeAscending: number;
  /** Argument of periapsis, radians. */
  argPeriapsis: number;
  /** Mean anomaly at J2000, radians. */
  meanAnomalyJ2000: number;
}

export interface CatalogBody {
  id: string;
  name: string;
  type: BodyType;
  parentId: string | null;
  massKg: number;
  radiusM: number;
  color: string;
  atmosphereColor?: string;
  emissive?: string;
  hasRings?: boolean;
  ringInner?: number;
  ringOuter?: number;
  orbit?: KeplerElements;
  rotationPeriodS: number;
  axialTiltDeg: number;
  temperatureK?: number;
  luminosityW?: number;
  spectralClass?: string;
  albedo?: number;
  dataSource: DataSource;
  /** Hierarchical moons stay Keplerian around their parent during N-body. */
  hierarchical?: boolean;
}

export interface SimBody extends CatalogBody {
  positionM: Vec3;
  velocityMS: Vec3;
  accelerationMS2: Vec3;
  rotationRad: number;
  modified: boolean;
  removed: boolean;
}

export interface LayerFlags {
  stars: boolean;
  planets: boolean;
  atmospheres: boolean;
  nebulae: boolean;
  orbits: boolean;
  labels: boolean;
  gravity: boolean;
  velocity: boolean;
  orbitalPlane: boolean;
  centerOfMass: boolean;
  lagrange: boolean;
  spacetime: boolean;
  lightCones: boolean;
  geodesics: boolean;
  lensing: boolean;
  redshift: boolean;
  cmb: boolean;
  darkMatter: boolean;
  cosmicWeb: boolean;
  lookback: boolean;
  distances: boolean;
  masses: boolean;
  temperatures: boolean;
  trails: boolean;
  asteroidBelt: boolean;
  kuiperBelt: boolean;
}

export interface CosmicPosition {
  scale: CosmicScale;
  parentId: string | null;
  localPosition: Vec3;
}

export type LabMode =
  | "solar-system"
  | "stellar"
  | "black-hole"
  | "neutron-star"
  | "nebula"
  | "light"
  | "spacetime"
  | "milky-way"
  | "galaxies"
  | "local-group"
  | "cosmic-web"
  | "observable-universe"
  | "big-bang"
  | "life";

export type IntegratorName = "verlet" | "leapfrog" | "rk4";

export type ScenarioId =
  | "reset"
  | "no-moon"
  | "no-jupiter"
  | "double-sun"
  | "earth-to-venus"
  | "remove-sun"
  | "rogue-star"
  | "red-giant"
  | "binary-star"
  | "supernova"
  | "ns-merger"
  | "star-around-bh"
  | "bh-lensing"
  | "andromeda"
  | "expansion"
  | "cmb"
  | "first-stars"
  | "galaxy-formation";

export const LAB_MODES: { id: LabMode; label: string; hint: string }[] = [
  { id: "solar-system", label: "Solar System", hint: "Planets, moons, N-body" },
  { id: "stellar", label: "Stars", hint: "HR diagram & life cycle" },
  { id: "black-hole", label: "Black Hole", hint: "Horizon, disk, lensing" },
  { id: "neutron-star", label: "Neutron Star", hint: "Pulsar beams" },
  { id: "nebula", label: "Nebula", hint: "Gas, dust, collapse" },
  { id: "light", label: "Light", hint: "Photons, redshift, lensing" },
  { id: "spacetime", label: "Spacetime", hint: "Geodesics & cones" },
  { id: "milky-way", label: "Milky Way", hint: "Arms, bulge, halo" },
  { id: "galaxies", label: "Galaxies", hint: "Hubble types" },
  { id: "local-group", label: "Local Group", hint: "MW + Andromeda" },
  { id: "cosmic-web", label: "Cosmic Web", hint: "Filaments & voids" },
  { id: "observable-universe", label: "Observable Universe", hint: "Lookback time" },
  { id: "big-bang", label: "Big Bang", hint: "Expansion of space" },
  { id: "life", label: "Life", hint: "Energy, genome, morphogenesis" },
];
