/** Golden angle in radians — phyllotaxis, not a biological law. */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function fibonacci(n: number) {
  if (n <= 1) return 1;
  let a = 1;
  let b = 1;
  for (let i = 2; i <= n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return b;
}

/** Logistic map — sensitivity to initial conditions, not a life equation. */
export function logistic(x: number, r: number) {
  return clamp(r * x * (1 - x), 1e-6, 1 - 1e-6);
}

export function hueColor(hue: number, sat = 0.55, lit = 0.58) {
  const h = ((hue % 1) + 1) % 1;
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = sat * Math.min(lit, 1 - lit);
    const c = lit - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(clamp(c, 0, 1) * 255);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

export function hexColor(n: number) {
  return `#${n.toString(16).padStart(6, "0")}`;
}

export function mutateScalar(value: number, rate: number, scale: number, lo: number, hi: number, rand: () => number) {
  if (rand() > rate) return value;
  const kick = (rand() - 0.5) * 2 * scale;
  return clamp(value + kick, lo, hi);
}

export function laplacian(field: Float32Array, i: number, j: number, n: number) {
  const at = (x: number, y: number) => field[((y + n) % n) * n + ((x + n) % n)];
  return at(i + 1, j) + at(i - 1, j) + at(i, j + 1) + at(i, j - 1) - 4 * at(i, j);
}
