export type Vec3 = [number, number, number];

export const zero = (): Vec3 => [0, 0, 0];

export function vec(x = 0, y = 0, z = 0): Vec3 {
  return [x, y, z];
}

export function copy(a: Vec3, out?: Vec3): Vec3 {
  if (!out) return [a[0], a[1], a[2]];
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

export function set(out: Vec3, x: number, y: number, z: number): Vec3 {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

export function add(a: Vec3, b: Vec3, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

export function sub(a: Vec3, b: Vec3, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

export function scale(a: Vec3, s: number, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] * s;
  out[1] = a[1] * s;
  out[2] = a[2] * s;
  return out;
}

export function addScaled(a: Vec3, b: Vec3, s: number, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] + b[0] * s;
  out[1] = a[1] + b[1] * s;
  out[2] = a[2] + b[2] * s;
  return out;
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function length(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function lengthSq(a: Vec3): number {
  return a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
}

export function normalize(a: Vec3, out: Vec3 = [0, 0, 0]): Vec3 {
  const len = length(a) || 1;
  out[0] = a[0] / len;
  out[1] = a[1] / len;
  out[2] = a[2] / len;
  return out;
}

export function dist(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function lerp(a: Vec3, b: Vec3, t: number, out: Vec3 = [0, 0, 0]): Vec3 {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
  return out;
}

export function toThree(a: Vec3): { x: number; y: number; z: number } {
  return { x: a[0], y: a[1], z: a[2] };
}
