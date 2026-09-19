import { create } from "zustand";
import type {
  AccuracyMode,
  CameraMode,
  IntegratorName,
  LabMode,
  LayerFlags,
  Wavelength,
} from "@/engine/types";
import { DAY, YEAR } from "@/engine/constants";

export const TIME_PRESETS = [
  { label: "−1000×", value: -1000 },
  { label: "−10×", value: -10 },
  { label: "1×", value: 1 },
  { label: "10×", value: 10 },
  { label: "1 000×", value: 1000 },
  { label: "1 day/s", value: DAY },
  { label: "1 yr/s", value: YEAR },
  { label: "100 yr/s", value: 100 * YEAR },
] as const;

const defaultLayers = (): LayerFlags => ({
  stars: true,
  planets: true,
  atmospheres: true,
  nebulae: true,
  orbits: true,
  labels: true,
  gravity: false,
  velocity: false,
  orbitalPlane: false,
  centerOfMass: false,
  lagrange: false,
  spacetime: false,
  lightCones: false,
  geodesics: false,
  lensing: false,
  redshift: false,
  cmb: false,
  darkMatter: false,
  cosmicWeb: false,
  lookback: false,
  distances: false,
  masses: false,
  temperatures: false,
  trails: true,
  asteroidBelt: true,
  kuiperBelt: true,
});

export interface ExplorerState {
  selectedId: string | null;
  focusId: string;
  cameraMode: CameraMode;
  layers: LayerFlags;
  accuracyMode: AccuracyMode;
  enhancePlanetSize: boolean;
  enhanceStarSize: boolean;
  trueDistance: boolean;
  timeScale: number;
  paused: boolean;
  searchQuery: string;
  wavelength: Wavelength;
  inspectorOpen: boolean;
  dockOpen: boolean;
  leftTab: "objects" | "layers" | "sandbox";
  cameraDistanceM: number;
  labMode: LabMode;
  starMassSolar: number;
  starAgeMyr: number;
  starRunning: boolean;
  bhMassSolar: number;
  bhSpin: number;
  bhInclination: number;
  bhObserverKm: number;
  nsPeriodS: number;
  nsFieldT: number;
  nebulaDensity: number;
  nebulaCollapsed: boolean;
  lensMass: number;
  redshiftZ: number;
  cosmologyT: number;
  andromedaT: number;
  integrator: IntegratorName;
  measureA: string | null;
  measureB: string | null;
  createType: "planet" | "star" | "binary" | "asteroid" | "black-hole" | "neutron-star" | "nebula" | "galaxy";
  tick: number;
  select: (id: string | null) => void;
  focus: (id: string) => void;
  setLabMode: (mode: LabMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleLayer: (key: keyof LayerFlags) => void;
  setLayer: (key: keyof LayerFlags, value: boolean) => void;
  setAccuracy: (mode: AccuracyMode) => void;
  setTimeScale: (value: number) => void;
  togglePaused: () => void;
  setSearch: (q: string) => void;
  setWavelength: (w: Wavelength) => void;
  setCameraDistanceM: (d: number) => void;
  pulse: () => void;
}

export const useExplorer = create<ExplorerState>((set) => ({
  selectedId: "earth",
  focusId: "sun",
  cameraMode: "orbit",
  layers: defaultLayers(),
  accuracyMode: "education",
  enhancePlanetSize: true,
  enhanceStarSize: true,
  trueDistance: true,
  timeScale: DAY,
  paused: false,
  searchQuery: "",
  wavelength: "visible",
  inspectorOpen: true,
  dockOpen: true,
  leftTab: "objects",
  cameraDistanceM: 12 * 149_597_870_700,
  labMode: "solar-system",
  starMassSolar: 1,
  starAgeMyr: 4600,
  starRunning: false,
  bhMassSolar: 10,
  bhSpin: 0.92,
  bhInclination: 70,
  bhObserverKm: 1000,
  nsPeriodS: 0.033,
  nsFieldT: 1e8,
  nebulaDensity: 0.35,
  nebulaCollapsed: false,
  lensMass: 1e12,
  redshiftZ: 0.5,
  cosmologyT: 1,
  andromedaT: 0,
  integrator: "verlet",
  measureA: "earth",
  measureB: "sun",
  createType: "planet",
  tick: 0,
  select: (id) =>
    set((s) => ({
      selectedId: id,
      focusId: id ?? s.focusId,
      inspectorOpen: id ? true : s.inspectorOpen,
    })),
  focus: (id) => set({ focusId: id, selectedId: id, cameraMode: "orbit" }),
  setLabMode: (labMode) =>
    set((s) => ({
      labMode,
      layers: {
        ...s.layers,
        spacetime: labMode === "spacetime" ? true : s.layers.spacetime,
        geodesics: labMode === "spacetime" || labMode === "light" || labMode === "black-hole" ? true : s.layers.geodesics,
        lensing: labMode === "black-hole" || labMode === "light" ? true : s.layers.lensing,
        lightCones: labMode === "spacetime" ? true : s.layers.lightCones,
        lookback: labMode === "observable-universe" ? true : s.layers.lookback,
        cmb: labMode === "observable-universe" || labMode === "big-bang" ? true : s.layers.cmb,
        redshift: labMode === "light" ? true : s.layers.redshift,
        cosmicWeb: labMode === "cosmic-web" ? true : s.layers.cosmicWeb,
      },
    })),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  toggleLayer: (key) =>
    set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setLayer: (key, value) =>
    set((s) => ({ layers: { ...s.layers, [key]: value } })),
  setAccuracy: (accuracyMode) =>
    set({
      accuracyMode,
      enhancePlanetSize: accuracyMode !== "realistic",
      enhanceStarSize: accuracyMode !== "realistic",
      trueDistance: true,
    }),
  setTimeScale: (timeScale) => set({ timeScale, paused: timeScale === 0 }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSearch: (searchQuery) => set({ searchQuery }),
  setWavelength: (wavelength) => set({ wavelength }),
  setCameraDistanceM: (cameraDistanceM) => set({ cameraDistanceM }),
  pulse: () => set((s) => ({ tick: s.tick + 1 })),
}));
