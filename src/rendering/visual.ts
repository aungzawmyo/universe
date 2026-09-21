import { AU } from "@/engine/constants";
import type { CosmicScale, SimBody, Wavelength } from "@/engine/types";
import type { Vec3 } from "@/engine/vec3";
import { renderUnitMeters } from "@/engine/scale";

export function visualRadiusM(
  body: SimBody,
  enhancePlanets: boolean,
  enhanceStars: boolean,
): number {
  const star = body.type === "star";
  if (star && !enhanceStars) return body.radiusM;
  if (!star && !enhancePlanets) return Math.max(body.radiusM, 1);
  if (star) return Math.max(body.radiusM * 12, 0.22 * AU);
  if (body.type === "black-hole") return Math.max(body.radiusM * 80, 0.04 * AU);
  if (body.type === "neutron-star") return Math.max(body.radiusM * 8e5, 0.02 * AU);
  if (body.type === "comet") return Math.max(body.radiusM * 900, 0.018 * AU);
  if (body.type === "planet" && body.massKg > 1e26) return Math.max(body.radiusM * 28, 0.09 * AU);
  if (body.type === "planet") return Math.max(body.radiusM * 420, 0.045 * AU);
  if (body.type === "dwarf-planet") return Math.max(body.radiusM * 500, 0.028 * AU);
  if (body.type === "moon") return Math.max(body.radiusM * 380, 0.016 * AU);
  return Math.max(body.radiusM * 200, 0.012 * AU);
}

export function toRender(pos: Vec3, origin: Vec3, unitM: number): [number, number, number] {
  return [(pos[0] - origin[0]) / unitM, (pos[1] - origin[1]) / unitM, (pos[2] - origin[2]) / unitM];
}

export function sceneUnit(cameraDistanceM: number): number {
  return renderUnitMeters(cameraDistanceM);
}

export function shouldShowBody(body: SimBody, scale: CosmicScale): boolean {
  if (body.removed) return false;
  if (scale === "stellar" || scale === "galactic") {
    return body.type === "star" || body.type === "black-hole" || body.type === "neutron-star";
  }
  if (scale === "local-group" || scale === "cluster" || scale === "cosmic-web" || scale === "observable-universe") {
    return false;
  }
  return true;
}

export const WAVELENGTH_LOOK: Record<
  Wavelength,
  { tint: string; exposure: number; starGain: number; label: string }
> = {
  gamma: { tint: "#d7fff2", exposure: 1.4, starGain: 1.6, label: "Gamma" },
  xray: { tint: "#9ad8ff", exposure: 1.25, starGain: 1.5, label: "X-ray" },
  uv: { tint: "#b8a0ff", exposure: 1.1, starGain: 1.3, label: "Ultraviolet" },
  visible: { tint: "#ffffff", exposure: 1, starGain: 1, label: "Visible" },
  ir: { tint: "#ff8a4a", exposure: 0.95, starGain: 1.15, label: "Infrared" },
  microwave: { tint: "#ffc56e", exposure: 0.75, starGain: 0.55, label: "Microwave" },
  radio: { tint: "#5cffb4", exposure: 0.6, starGain: 0.35, label: "Radio" },
};
