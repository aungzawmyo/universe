import type { Vec3 } from "@/engine/vec3";
import { set } from "@/engine/vec3";

/**
 * Newtonian N-body accelerations:
 *   a_i = G Σ_j m_j (r_j - r_i) / |r_j - r_i|³
 * Softening avoids singularities during close encounters.
 */
export function nbodyAccelerations(
  positions: Vec3[],
  masses: number[],
  accelerations: Vec3[],
  G: number,
  softeningM = 1e6,
): void {
  const n = positions.length;
  const soft2 = softeningM * softeningM;

  for (let i = 0; i < n; i++) {
    set(accelerations[i], 0, 0, 0);
  }

  for (let i = 0; i < n; i++) {
    const pi = positions[i];
    const ai = accelerations[i];
    for (let j = i + 1; j < n; j++) {
      const pj = positions[j];
      const dx = pj[0] - pi[0];
      const dy = pj[1] - pi[1];
      const dz = pj[2] - pi[2];
      const r2 = dx * dx + dy * dy + dz * dz + soft2;
      const inv = 1 / Math.sqrt(r2);
      const inv3 = inv * inv * inv;
      const s = G * inv3;
      const fi = masses[j] * s;
      const fj = masses[i] * s;
      ai[0] += dx * fi;
      ai[1] += dy * fi;
      ai[2] += dz * fi;
      const aj = accelerations[j];
      aj[0] -= dx * fj;
      aj[1] -= dy * fj;
      aj[2] -= dz * fj;
    }
  }
}

export function gravitationalPotential(positions: Vec3[], masses: number[], G: number, at: Vec3): number {
  let phi = 0;
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const dx = at[0] - p[0];
    const dy = at[1] - p[1];
    const dz = at[2] - p[2];
    const r = Math.hypot(dx, dy, dz) + 1e5;
    phi -= (G * masses[i]) / r;
  }
  return phi;
}

export function gravityAt(positions: Vec3[], masses: number[], G: number, at: Vec3): Vec3 {
  const a: Vec3 = [0, 0, 0];
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const dx = p[0] - at[0];
    const dy = p[1] - at[1];
    const dz = p[2] - at[2];
    const r2 = dx * dx + dy * dy + dz * dz + 1e12;
    const inv3 = 1 / (Math.sqrt(r2) * r2);
    const s = G * masses[i] * inv3;
    a[0] += dx * s;
    a[1] += dy * s;
    a[2] += dz * s;
  }
  return a;
}
