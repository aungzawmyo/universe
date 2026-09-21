import { clamp, fibonacci, GOLDEN_ANGLE, laplacian, logistic, mutateScalar } from "./math";
import type { BodyPlan, CellRole, Genome, LifeCell, LifeNode, LifeStats, Organism } from "./types";
import { CELL_COUNT, GRID, MAX_NODES, MAX_ORGANISMS, WORLD_SIZE } from "./types";

const SIZE = WORLD_SIZE;
const HALF = SIZE / 2;

function rand() {
  return Math.random();
}

function bodyPlan(g: Genome): BodyPlan {
  const t = g.bodyPlan;
  if (t < 0.2) return "plant";
  if (t < 0.4) return "vessel";
  if (t < 0.6) return "mycelium";
  if (t < 0.8) return "dendrite";
  return "bronchus";
}

export function seedGenome(bias = rand()): Genome {
  return {
    fibonacciWeight: 0.45 + bias * 0.4,
    branchAngle: 0.35 + bias * 0.55,
    lengthRatio: 0.58 + bias * 0.18,
    radiusRatio: 0.62 + bias * 0.16,
    metabolism: 0.55 + bias * 0.35,
    absorbRate: 0.08 + bias * 0.1,
    reproductionThreshold: 90 + bias * 70,
    mutationRate: 0.012 + bias * 0.02,
    diffusionA: 0.12 + bias * 0.08,
    diffusionB: 0.06 + bias * 0.05,
    reactF: 0.03 + bias * 0.04,
    reactK: 0.05 + bias * 0.03,
    chaosR: 3.4 + bias * 0.55,
    motility: 0.01 + bias * 0.04,
    bodyPlan: bias,
    colorHue: (0.22 + bias * 0.55) % 1,
  };
}

function crossover(a: Genome, b: Genome): Genome {
  const pick = <K extends keyof Genome>(key: K): Genome[K] => (rand() < 0.5 ? a[key] : b[key]);
  return {
    fibonacciWeight: pick("fibonacciWeight"),
    branchAngle: pick("branchAngle"),
    lengthRatio: pick("lengthRatio"),
    radiusRatio: pick("radiusRatio"),
    metabolism: pick("metabolism"),
    absorbRate: pick("absorbRate"),
    reproductionThreshold: pick("reproductionThreshold"),
    mutationRate: pick("mutationRate"),
    diffusionA: pick("diffusionA"),
    diffusionB: pick("diffusionB"),
    reactF: pick("reactF"),
    reactK: pick("reactK"),
    chaosR: pick("chaosR"),
    motility: pick("motility"),
    bodyPlan: pick("bodyPlan"),
    colorHue: pick("colorHue"),
  };
}

function mutateGenome(g: Genome): Genome {
  const r = g.mutationRate;
  return {
    fibonacciWeight: mutateScalar(g.fibonacciWeight, r, 0.06, 0.05, 1, rand),
    branchAngle: mutateScalar(g.branchAngle, r, 0.08, 0.12, 1.2, rand),
    lengthRatio: mutateScalar(g.lengthRatio, r, 0.04, 0.4, 0.92, rand),
    radiusRatio: mutateScalar(g.radiusRatio, r, 0.04, 0.4, 0.92, rand),
    metabolism: mutateScalar(g.metabolism, r, 0.05, 0.25, 1, rand),
    absorbRate: mutateScalar(g.absorbRate, r, 0.02, 0.02, 0.28, rand),
    reproductionThreshold: mutateScalar(g.reproductionThreshold, r, 12, 50, 220, rand),
    mutationRate: mutateScalar(g.mutationRate, r, 0.004, 0.002, 0.08, rand),
    diffusionA: mutateScalar(g.diffusionA, r, 0.015, 0.04, 0.28, rand),
    diffusionB: mutateScalar(g.diffusionB, r, 0.01, 0.02, 0.16, rand),
    reactF: mutateScalar(g.reactF, r, 0.008, 0.01, 0.08, rand),
    reactK: mutateScalar(g.reactK, r, 0.006, 0.02, 0.1, rand),
    chaosR: mutateScalar(g.chaosR, r, 0.06, 3.1, 3.99, rand),
    motility: mutateScalar(g.motility, r, 0.008, 0, 0.08, rand),
    bodyPlan: mutateScalar(g.bodyPlan, r, 0.08, 0, 1, rand),
    colorHue: mutateScalar(g.colorHue, r, 0.04, 0, 1, rand),
  };
}

function makeCells(): LifeCell[] {
  return Array.from({ length: CELL_COUNT }, () => ({ energy: 0.4 + rand() * 0.3, role: "generic" as CellRole }));
}

function rootNode(id: string): LifeNode {
  return {
    id,
    parentId: null,
    age: 0,
    energy: 20,
    matter: 8,
    health: 1,
    position: [0, 0.12, 0],
    children: [],
    connections: [],
    state: "alive",
    length: 0.22,
    radius: 0.09,
    role: "generic",
  };
}

function spawnOrganism(genome: Genome, x: number, z: number, generation: number, parentId: string | null, energy: number): Organism {
  const id = `org-${Math.floor(rand() * 1e9).toString(36)}`;
  return {
    id,
    generation,
    age: 0,
    energy,
    matter: energy * 0.4,
    health: 1,
    genome,
    position: [x, 0, z],
    nodes: [rootNode(`${id}-n0`)],
    cells: makeCells(),
    logisticX: 0.2 + rand() * 0.6,
    stage: 1,
    state: "alive",
    parentId,
  };
}

function worldToGrid(x: number, z: number) {
  const i = Math.floor(((x + HALF) / SIZE) * GRID);
  const j = Math.floor(((z + HALF) / SIZE) * GRID);
  return [clamp(i, 0, GRID - 1), clamp(j, 0, GRID - 1)] as const;
}

function fieldIndex(i: number, j: number) {
  return j * GRID + i;
}

export class LifeEngine {
  resource = new Float32Array(GRID * GRID);
  morphA = new Float32Array(GRID * GRID);
  morphB = new Float32Array(GRID * GRID);
  organisms: Organism[] = [];
  tick = 0;
  births = 0;
  deaths = 0;
  maxGeneration = 0;
  nutrient = 0.55;
  mutationScale = 1;
  temperature = 0.5;
  selectedId: string | null = null;
  private seq = 1;

  constructor() {
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.births = 0;
    this.deaths = 0;
    this.maxGeneration = 0;
    this.seq = 1;
    this.organisms = [];
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const k = fieldIndex(i, j);
        const cx = i / GRID - 0.5;
        const cz = j / GRID - 0.5;
        this.resource[k] = 0.35 + 0.45 * Math.exp(-18 * (cx * cx + cz * cz)) + rand() * 0.12;
        this.morphA[k] = 0.85 + rand() * 0.1;
        this.morphB[k] = rand() < 0.04 ? 0.4 : 0.02;
      }
    }
    for (let n = 0; n < 8; n++) {
      const g = seedGenome(n / 8);
      this.organisms.push(
        spawnOrganism(g, (rand() - 0.5) * 6.2, (rand() - 0.5) * 6.2, 0, null, 70 + rand() * 40),
      );
    }
    this.selectedId = this.organisms[0]?.id ?? null;
  }

  selected() {
    return this.organisms.find((o) => o.id === this.selectedId && o.state !== "dead");
  }

  stats(): LifeStats {
    const live = this.organisms.filter((o) => o.state !== "dead");
    const n = live.length || 1;
    return {
      population: live.length,
      births: this.births,
      deaths: this.deaths,
      generation: this.maxGeneration,
      meanEnergy: live.reduce((s, o) => s + o.energy, 0) / n,
      meanHealth: live.reduce((s, o) => s + o.health, 0) / n,
      meanNodes: live.reduce((s, o) => s + o.nodes.length, 0) / n,
      tick: this.tick,
    };
  }

  step(dt: number, nutrient = this.nutrient, mutationScale = this.mutationScale, temperature = this.temperature) {
    this.nutrient = nutrient;
    this.mutationScale = mutationScale;
    this.temperature = temperature;
    const steps = Math.max(1, Math.min(4, Math.round(dt * 18)));
    for (let s = 0; s < steps; s++) this.tickOnce();
  }

  private tickOnce() {
    this.tick++;
    this.replenishAndDiffuse();
    const live = this.organisms.filter((o) => o.state !== "dead");
    const born: Organism[] = [];

    for (const org of live) {
      org.logisticX = logistic(org.logisticX, org.genome.chaosR);
      this.absorb(org);
      this.metabolize(org);
      this.updateCells(org);
      this.morphogenesis(org);
      this.grow(org);
      this.move(org, live);
      if (this.canReproduce(org) && live.length + born.length < MAX_ORGANISMS) {
        const child = this.reproduce(org);
        if (child) born.push(child);
      }
      this.age(org);
      if (!this.homeostasis(org)) this.die(org);
    }

    this.organisms.push(...born);
    this.organisms = this.organisms.filter((o) => o.state !== "dead" || o.age < 8);
  }

  private replenishAndDiffuse() {
    const nextR = new Float32Array(this.resource);
    const nextA = new Float32Array(this.morphA);
    const nextB = new Float32Array(this.morphB);
    const rain = 0.002 + this.nutrient * 0.01;
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const k = fieldIndex(i, j);
        const r = this.resource[k];
        const a = this.morphA[k];
        const b = this.morphB[k];
        const lapR = laplacian(this.resource, i, j, GRID);
        const lapA = laplacian(this.morphA, i, j, GRID);
        const lapB = laplacian(this.morphB, i, j, GRID);
        const abb = a * b * b;
        nextR[k] = clamp(r + 0.08 * lapR + rain * (1 - r) - 0.0015, 0, 1);
        nextA[k] = clamp(a + 0.14 * lapA - abb + 0.034 * (1 - a), 0, 1);
        nextB[k] = clamp(b + 0.07 * lapB + abb - 0.092 * b, 0, 1);
      }
    }
    this.resource = nextR;
    this.morphA = nextA;
    this.morphB = nextB;
  }

  private absorb(org: Organism) {
    const [i, j] = worldToGrid(org.position[0], org.position[2]);
    const k = fieldIndex(i, j);
    const appetite = 0.45 + 0.55 * org.logisticX;
    const take = Math.min(this.resource[k], org.genome.absorbRate * appetite * (0.6 + this.nutrient));
    this.resource[k] -= take;
    org.energy += take * 110;
    org.matter += take * 40;
    this.morphB[k] = clamp(this.morphB[k] + take * 0.15, 0, 1);
  }

  private metabolize(org: Organism) {
    const temp = 0.7 + this.temperature * 0.8;
    const cost = ((0.35 + 0.12 * org.nodes.length) * temp) / Math.max(0.2, org.genome.metabolism);
    org.energy -= cost;
    const cap = org.genome.reproductionThreshold * 1.8;
    if (org.energy > cap) org.energy -= (org.energy - cap) * 0.12;
    org.nodes.forEach((n) => {
      n.age += 1;
      n.energy = clamp(n.energy - 0.02, 0, 40);
    });
    if (org.energy < 8) org.health -= 0.012;
    else org.health = clamp(org.health + 0.004, 0, 1);
  }

  private updateCells(org: Organism) {
    const next = org.cells.map((cell, i) => {
      const left = org.cells[(i + CELL_COUNT - 1) % CELL_COUNT];
      const right = org.cells[(i + 1) % CELL_COUNT];
      const neighbor = 0.5 * (left.energy + right.energy);
      let energy = cell.energy + 0.08 * neighbor - 0.035;
      if (org.energy < 6) energy -= 0.05;
      else energy += 0.02;
      let role = cell.role;
      if (energy < 0.08) role = "generic";
      return { energy: clamp(energy, 0, 1.4), role };
    });
    org.cells = next;
    if (next.every((c) => c.energy < 0.07)) org.state = org.state === "dead" ? "dead" : "dormant";
    else if (org.state === "dormant") org.state = "alive";
  }

  private morphogenesis(org: Organism) {
    const [i, j] = worldToGrid(org.position[0], org.position[2]);
    const k = fieldIndex(i, j);
    const a = this.morphA[k] * (0.6 + org.genome.diffusionA);
    const b = this.morphB[k] * (0.6 + org.genome.diffusionB * 4);
    const ratio = a / Math.max(1e-3, b);
    org.cells.forEach((cell) => {
      if (a > 0.82) cell.role = "structural";
      else if (b > 0.55) cell.role = "sensory";
      else if (ratio > 0.9 && ratio < 1.4) cell.role = "appendage";
    });
    org.nodes.forEach((node, idx) => {
      if (idx === 0) return;
      if (a > 0.8) node.role = "structural";
      else if (b > 0.5) node.role = "sensory";
      else if (ratio > 0.85 && ratio < 1.5) node.role = "appendage";
    });
  }

  private grow(org: Organism) {
    if (org.state !== "alive" || org.nodes.length >= MAX_NODES) return;
    const target = Math.max(1, Math.round(lerpFib(org.stage, org.genome.fibonacciWeight)));
    const cost = 9 + org.nodes.length * 1.6;
    if (org.nodes.length >= target || org.energy < cost) return;
    const parent = org.nodes[org.nodes.length - 1] ?? org.nodes[0];
    const plan = bodyPlan(org.genome);
    const depth = org.nodes.length;
    const node = this.makeBranch(org, parent, depth, plan);
    parent.children.push(node.id);
    parent.connections.push(node.id);
    org.nodes.push(node);
    org.energy -= cost;
    org.matter -= cost * 0.25;
    org.stage += 1;
  }

  private makeBranch(org: Organism, parent: LifeNode, depth: number, plan: BodyPlan): LifeNode {
    const g = org.genome;
    const length = parent.length * g.lengthRatio;
    const radius = parent.radius * g.radiusRatio;
    const n = depth;
    let dx = 0;
    let dy = length;
    let dz = 0;
    if (plan === "plant") {
      const theta = n * GOLDEN_ANGLE;
      const spread = 0.22 + 0.08 * n;
      dx = Math.cos(theta) * spread;
      dz = Math.sin(theta) * spread;
      dy = length * (1.05 - 0.04 * n);
    } else if (plan === "mycelium") {
      const theta = n * g.branchAngle + rand() * 0.8;
      dx = Math.cos(theta) * length;
      dz = Math.sin(theta) * length;
      dy = (rand() - 0.35) * 0.12;
    } else if (plan === "vessel" || plan === "bronchus") {
      const fork = n % 2 === 0 ? 1 : -1;
      dx = Math.cos(g.branchAngle * n) * length * 0.7 * fork;
      dz = Math.sin(g.branchAngle * n * 0.7) * length * 0.55;
      dy = length * 0.85;
    } else {
      const theta = n * 0.7 + g.branchAngle;
      dx = Math.cos(theta) * length * 0.9;
      dy = length * 0.35;
      dz = Math.sin(theta * 1.3) * length * 0.9;
    }
    const pos: [number, number, number] = [
      parent.position[0] + dx,
      parent.position[1] + dy,
      parent.position[2] + dz,
    ];
    return {
      id: `${org.id}-n${this.seq++}`,
      parentId: parent.id,
      age: 0,
      energy: 6,
      matter: 3,
      health: 1,
      position: pos,
      children: [],
      connections: [parent.id],
      state: "alive",
      length,
      radius: Math.max(0.02, radius),
      role: "generic",
    };
  }

  private move(org: Organism, others: Organism[]) {
    if (org.genome.motility <= 0.002 || org.state !== "alive") return;
    const [i, j] = worldToGrid(org.position[0], org.position[2]);
    let best = this.resource[fieldIndex(i, j)];
    let ti = i;
    let tj = j;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const ni = clamp(i + di, 0, GRID - 1);
        const nj = clamp(j + dj, 0, GRID - 1);
        const v = this.resource[fieldIndex(ni, nj)];
        if (v > best) {
          best = v;
          ti = ni;
          tj = nj;
        }
      }
    }
    const tx = (ti / GRID) * SIZE - HALF;
    const tz = (tj / GRID) * SIZE - HALF;
    const crowded = others.some(
      (o) => o.id !== org.id && o.state !== "dead" && dist2(org.position, o.position) < 0.18,
    );
    const step = org.genome.motility * (crowded ? 1.6 : 1) * (0.6 + org.logisticX);
    org.position[0] = clamp(org.position[0] + (tx - org.position[0]) * step, -HALF + 0.2, HALF - 0.2);
    org.position[2] = clamp(org.position[2] + (tz - org.position[2]) * step, -HALF + 0.2, HALF - 0.2);
    org.energy -= step * 4;
  }

  private canReproduce(org: Organism) {
    return (
      org.state === "alive" &&
      org.energy > org.genome.reproductionThreshold &&
      org.nodes.length >= 3 &&
      org.age > 12
    );
  }

  private reproduce(org: Organism): Organism | null {
    const mate = this.organisms.find(
      (o) =>
        o.id !== org.id &&
        o.state === "alive" &&
        o.generation === org.generation &&
        dist2(org.position, o.position) < 2.4,
    );
    const raw = mate && rand() < 0.35 ? crossover(org.genome, mate.genome) : { ...org.genome };
    raw.mutationRate *= this.mutationScale;
    const genome = mutateGenome(raw);
    const angle = rand() * Math.PI * 2;
    const child = spawnOrganism(
      genome,
      clamp(org.position[0] + Math.cos(angle) * 0.55, -HALF + 0.3, HALF - 0.3),
      clamp(org.position[2] + Math.sin(angle) * 0.55, -HALF + 0.3, HALF - 0.3),
      org.generation + 1,
      org.id,
      org.energy * 0.32,
    );
    org.energy *= 0.52;
    org.health = clamp(org.health - 0.04, 0, 1);
    this.births++;
    this.maxGeneration = Math.max(this.maxGeneration, child.generation);
    if (!this.selectedId) this.selectedId = child.id;
    return child;
  }

  private age(org: Organism) {
    org.age += 1;
    const risk = 1 - Math.exp(-org.age / 420) * org.health;
    if (rand() < risk * 0.004) org.health -= 0.08;
  }

  private homeostasis(org: Organism) {
    if (org.energy <= 0 || org.health <= 0) return false;
    return true;
  }

  private die(org: Organism) {
    if (org.state === "dead") return;
    org.state = "dead";
    this.deaths++;
    const [i, j] = worldToGrid(org.position[0], org.position[2]);
    const k = fieldIndex(i, j);
    this.resource[k] = clamp(this.resource[k] + 0.18 + org.matter * 0.002, 0, 1);
    if (this.selectedId === org.id) {
      this.selectedId = this.organisms.find((o) => o.state !== "dead" && o.id !== org.id)?.id ?? null;
    }
  }
}

function lerpFib(stage: number, weight: number) {
  const exact = fibonacci(stage);
  return exact * weight + (stage + 1) * (1 - weight);
}

function dist2(a: [number, number, number], b: [number, number, number]) {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return dx * dx + dz * dz;
}

export const lifeWorld = new LifeEngine();

export { bodyPlan };
