import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas");
  return [c, ctx];
}

function noise(ctx: CanvasRenderingContext2D, color: string, count: number, size: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.08 + Math.random() * 0.25;
    ctx.beginPath();
    ctx.ellipse(Math.random() * ctx.canvas.width, Math.random() * ctx.canvas.height, size * Math.random(), size * Math.random() * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function make(id: string, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const hit = cache.get(id);
  if (hit) return hit;
  const [c, ctx] = canvas(1024, 512);
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cache.set(id, tex);
  return tex;
}

export function bodyTexture(id: string): THREE.CanvasTexture | null {
  switch (id) {
    case "mercury":
      return make(id, (ctx) => {
        ctx.fillStyle = "#8d8680";
        ctx.fillRect(0, 0, 1024, 512);
        noise(ctx, "#6d6760", 400, 18);
        noise(ctx, "#b0aaa2", 200, 8);
      });
    case "venus":
      return make(id, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, "#f0d9a4");
        g.addColorStop(1, "#c9a56a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 512);
        noise(ctx, "#fff1c8", 120, 40);
      });
    case "earth":
      return make(id, (ctx) => {
        ctx.fillStyle = "#1b4f9c";
        ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = "#2f7d3a";
        const blobs = [
          [220, 200, 140, 80],
          [280, 260, 90, 50],
          [700, 180, 160, 70],
          [760, 250, 80, 40],
          [500, 380, 180, 40],
          [120, 360, 70, 30],
        ];
        for (const [x, y, rx, ry] of blobs) {
          ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        noise(ctx, "#3d8b4a", 80, 24);
        noise(ctx, "#d8e8ff", 60, 18);
        ctx.fillStyle = "#e8eef6";
        ctx.fillRect(0, 0, 1024, 28);
        ctx.fillRect(0, 484, 1024, 28);
      });
    case "moon":
      return make(id, (ctx) => {
        ctx.fillStyle = "#c4bbad";
        ctx.fillRect(0, 0, 1024, 512);
        noise(ctx, "#8f877c", 300, 16);
        ctx.fillStyle = "#9a9288";
        for (let i = 0; i < 40; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * 1024, Math.random() * 512, 4 + Math.random() * 16, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    case "mars":
      return make(id, (ctx) => {
        ctx.fillStyle = "#b33b12";
        ctx.fillRect(0, 0, 1024, 512);
        noise(ctx, "#6e2410", 180, 22);
        noise(ctx, "#e07a3a", 80, 16);
        ctx.fillStyle = "#efe7df";
        ctx.fillRect(0, 0, 1024, 36);
        ctx.fillRect(0, 476, 1024, 36);
      });
    case "jupiter":
      return make(id, (ctx) => {
        for (let y = 0; y < 512; y++) {
          const t = y / 512;
          const band = 0.5 + 0.5 * Math.sin(t * 34);
          ctx.fillStyle = band > 0.55 ? "#d8b48a" : "#b88858";
          ctx.fillRect(0, y, 1024, 1);
        }
        ctx.fillStyle = "#c45a32";
        ctx.beginPath();
        ctx.ellipse(700, 300, 70, 40, 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
    case "saturn":
      return make(id, (ctx) => {
        for (let y = 0; y < 512; y++) {
          const band = 0.5 + 0.5 * Math.sin((y / 512) * 22);
          ctx.fillStyle = band > 0.5 ? "#ead7a4" : "#c8b078";
          ctx.fillRect(0, y, 1024, 1);
        }
      });
    case "uranus":
      return make(id, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, "#baf6f4");
        g.addColorStop(1, "#5ecfcb");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 512);
      });
    case "neptune":
      return make(id, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        g.addColorStop(0, "#6f8cff");
        g.addColorStop(1, "#1e3ea8");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = "#9bb0ff";
        ctx.beginPath();
        ctx.ellipse(400, 260, 40, 24, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    case "sun":
      return make(id, (ctx) => {
        const g = ctx.createRadialGradient(512, 256, 40, 512, 256, 520);
        g.addColorStop(0, "#fff4c8");
        g.addColorStop(0.4, "#ffce6a");
        g.addColorStop(1, "#ff7a1e");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 512);
        noise(ctx, "#ff9a32", 80, 30);
      });
    default:
      return null;
  }
}

// Fix accidental typo in mars if I left one — write a clean mars instead via replacement if needed.
