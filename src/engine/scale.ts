import { AU, LY } from "./constants";
import type { CosmicScale } from "./types";

export interface ScaleBand {
  id: CosmicScale;
  label: string;
  minM: number;
  typicalM: number;
}

export const SCALE_BANDS: ScaleBand[] = [
  { id: "planet-surface", label: "Ground", minM: 1, typicalM: 1e4 },
  { id: "planetary", label: "Planetary", minM: 1e6, typicalM: 1e8 },
  { id: "solar-system", label: "Solar System", minM: 1e10, typicalM: 1e12 },
  { id: "stellar", label: "Stars", minM: 1e15, typicalM: 1e17 },
  { id: "galactic", label: "Milky Way", minM: 1e18, typicalM: 5e20 },
  { id: "local-group", label: "Local Group", minM: 3e21, typicalM: 3e22 },
  { id: "cluster", label: "Clusters", minM: 1e23, typicalM: 5e23 },
  { id: "cosmic-web", label: "Cosmic Web", minM: 3e24, typicalM: 1e25 },
  { id: "observable-universe", label: "Observable Universe", minM: 3e25, typicalM: 4.4e26 },
];

export function scaleFromDistance(distanceM: number): CosmicScale {
  let current: CosmicScale = SCALE_BANDS[0].id;
  for (const band of SCALE_BANDS) {
    if (distanceM >= band.minM) current = band.id;
  }
  return current;
}

/**
 * Scene unit in meters. Hierarchical coordinates: never store the whole
 * universe in one Vector3. The renderer only sees positions relative to the
 * focus, divided by this unit.
 */
export function renderUnitMeters(distanceM: number): number {
  if (distanceM < 3e9) return 1e6;
  if (distanceM < 1e14) return AU;
  if (distanceM < 1e18) return LY * 0.01;
  if (distanceM < 1e21) return LY;
  if (distanceM < 1e23) return 1000 * LY;
  return 1e6 * LY;
}

export function renderUnitLabel(unitM: number): string {
  if (Math.abs(unitM - 1e6) < 1) return "1000 km";
  if (Math.abs(unitM - AU) / AU < 0.05) return "1 AU";
  if (unitM < LY) return `${(unitM / AU).toFixed(0)} AU`;
  if (unitM < 100 * LY) return `${(unitM / LY).toFixed(2)} ly`;
  return `${(unitM / LY).toFixed(0)} ly`;
}

export const MIN_CAMERA_DISTANCE_M = 8e5;
export const MAX_CAMERA_DISTANCE_M = 8e21;
