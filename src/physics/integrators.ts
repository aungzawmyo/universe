import type { Vec3 } from "@/engine/vec3";
import { addScaled } from "@/engine/vec3";

export type AccelFn = (positions: Vec3[], accelerations: Vec3[]) => void;

/**
 * Velocity Verlet — symplectic, good long-term energy behavior for orbits.
 * Later: leapfrog, RK4, Barnes-Hut, GPU N-body.
 */
export function velocityVerlet(
  positions: Vec3[],
  velocities: Vec3[],
  accelerations: Vec3[],
  dt: number,
  accelerate: AccelFn,
): void {
  const half = dt * 0.5;
  for (let i = 0; i < positions.length; i++) {
    addScaled(velocities[i], accelerations[i], half, velocities[i]);
    addScaled(positions[i], velocities[i], dt, positions[i]);
  }
  accelerate(positions, accelerations);
  for (let i = 0; i < velocities.length; i++) {
    addScaled(velocities[i], accelerations[i], half, velocities[i]);
  }
}

export function leapfrog(
  positions: Vec3[],
  velocities: Vec3[],
  accelerations: Vec3[],
  dt: number,
  accelerate: AccelFn,
): void {
  for (let i = 0; i < positions.length; i++) {
    addScaled(positions[i], velocities[i], dt * 0.5, positions[i]);
  }
  accelerate(positions, accelerations);
  for (let i = 0; i < velocities.length; i++) {
    addScaled(velocities[i], accelerations[i], dt, velocities[i]);
    addScaled(positions[i], velocities[i], dt * 0.5, positions[i]);
  }
}

export function rk4(
  positions: Vec3[],
  velocities: Vec3[],
  accelerations: Vec3[],
  dt: number,
  accelerate: AccelFn,
): void {
  const n = positions.length;
  const p0 = positions.map((p) => [p[0], p[1], p[2]] as Vec3);
  const v0 = velocities.map((v) => [v[0], v[1], v[2]] as Vec3);
  const a1 = accelerations.map((a) => [a[0], a[1], a[2]] as Vec3);

  const kick = (frac: number, acc: Vec3[]) => {
    for (let i = 0; i < n; i++) {
      positions[i][0] = p0[i][0] + v0[i][0] * dt * frac;
      positions[i][1] = p0[i][1] + v0[i][1] * dt * frac;
      positions[i][2] = p0[i][2] + v0[i][2] * dt * frac;
      velocities[i][0] = v0[i][0] + acc[i][0] * dt * frac;
      velocities[i][1] = v0[i][1] + acc[i][1] * dt * frac;
      velocities[i][2] = v0[i][2] + acc[i][2] * dt * frac;
    }
  };

  kick(0.5, a1);
  const a2 = accelerations.map(() => [0, 0, 0] as Vec3);
  accelerate(positions, a2);
  kick(0.5, a2);
  const a3 = accelerations.map(() => [0, 0, 0] as Vec3);
  accelerate(positions, a3);
  kick(1, a3);
  const a4 = accelerations.map(() => [0, 0, 0] as Vec3);
  accelerate(positions, a4);

  for (let i = 0; i < n; i++) {
    const ax = (a1[i][0] + 2 * a2[i][0] + 2 * a3[i][0] + a4[i][0]) / 6;
    const ay = (a1[i][1] + 2 * a2[i][1] + 2 * a3[i][1] + a4[i][1]) / 6;
    const az = (a1[i][2] + 2 * a2[i][2] + 2 * a3[i][2] + a4[i][2]) / 6;
    velocities[i][0] = v0[i][0] + ax * dt;
    velocities[i][1] = v0[i][1] + ay * dt;
    velocities[i][2] = v0[i][2] + az * dt;
    positions[i][0] = p0[i][0] + ((v0[i][0] + velocities[i][0]) * 0.5) * dt;
    positions[i][1] = p0[i][1] + ((v0[i][1] + velocities[i][1]) * 0.5) * dt;
    positions[i][2] = p0[i][2] + ((v0[i][2] + velocities[i][2]) * 0.5) * dt;
    accelerations[i][0] = ax;
    accelerations[i][1] = ay;
    accelerations[i][2] = az;
  }
}
