import { G } from "./constants";
import type { KeplerElements } from "./types";
import type { Vec3 } from "./vec3";
import { set } from "./vec3";

export function wrapAngle(a: number): number {
  const tau = Math.PI * 2;
  return ((a % tau) + tau) % tau;
}

export function eccentricAnomaly(meanAnomaly: number, e: number): number {
  const M = wrapAngle(meanAnomaly + Math.PI) - Math.PI;
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 16; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-14) break;
  }
  return E;
}

export function meanMotion(mu: number, a: number): number {
  return Math.sqrt(mu / (a * a * a));
}

function rotateOrbital(
  x: number,
  y: number,
  elements: KeplerElements,
  out: Vec3,
): Vec3 {
  const { inclination: i, longitudeAscending: O, argPeriapsis: w } = elements;
  const cosO = Math.cos(O);
  const sinO = Math.sin(O);
  const cosw = Math.cos(w);
  const sinw = Math.sin(w);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);

  const x1 = x * cosw - y * sinw;
  const y1 = x * sinw + y * cosw;

  const x2 = x1;
  const y2 = y1 * cosi;
  const z2 = y1 * sini;

  return set(out, x2 * cosO - y2 * sinO, z2, x2 * sinO + y2 * cosO);
}

export function keplerState(
  elements: KeplerElements,
  mu: number,
  secondsSinceJ2000: number,
  position: Vec3,
  velocity: Vec3,
): void {
  const { a, eccentricity: e, meanAnomalyJ2000 } = elements;
  const n = meanMotion(mu, a);
  const M = meanAnomalyJ2000 + n * secondsSinceJ2000;
  const E = eccentricAnomaly(M, e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const sqrtOneE = Math.sqrt(Math.max(0, 1 - e * e));

  const xOrb = a * (cosE - e);
  const yOrb = a * sqrtOneE * sinE;
  rotateOrbital(xOrb, yOrb, elements, position);

  const edot = n / (1 - e * cosE);
  const vxOrb = -a * sinE * edot;
  const vyOrb = a * sqrtOneE * cosE * edot;
  rotateOrbital(vxOrb, vyOrb, elements, velocity);
}

export function orbitalPeriod(mu: number, a: number): number {
  return (2 * Math.PI) * Math.sqrt((a * a * a) / mu);
}

export function gravitationalParameter(parentMassKg: number, bodyMassKg = 0): number {
  return G * (parentMassKg + bodyMassKg);
}

export function schwarzschildRadius(massKg: number): number {
  return (2 * G * massKg) / (299_792_458 * 299_792_458);
}
