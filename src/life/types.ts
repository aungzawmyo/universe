export type LifeState = "alive" | "dormant" | "dying" | "dead";

export type CellRole = "generic" | "structural" | "sensory" | "appendage";

export type BodyPlan = "plant" | "vessel" | "mycelium" | "dendrite" | "bronchus";

/** Genome is a program: growth, metabolism, morphogenesis — not a phenotype list. */
export interface Genome {
  fibonacciWeight: number;
  branchAngle: number;
  lengthRatio: number;
  radiusRatio: number;
  metabolism: number;
  absorbRate: number;
  reproductionThreshold: number;
  mutationRate: number;
  diffusionA: number;
  diffusionB: number;
  reactF: number;
  reactK: number;
  chaosR: number;
  motility: number;
  bodyPlan: number;
  colorHue: number;
}

export interface LifeNode {
  id: string;
  parentId: string | null;
  age: number;
  energy: number;
  matter: number;
  health: number;
  position: [number, number, number];
  children: string[];
  connections: string[];
  state: LifeState;
  length: number;
  radius: number;
  role: CellRole;
}

export interface LifeCell {
  energy: number;
  role: CellRole;
}

export interface Organism {
  id: string;
  generation: number;
  age: number;
  energy: number;
  matter: number;
  health: number;
  genome: Genome;
  position: [number, number, number];
  nodes: LifeNode[];
  cells: LifeCell[];
  logisticX: number;
  stage: number;
  state: LifeState;
  parentId: string | null;
}

export interface LifeStats {
  population: number;
  births: number;
  deaths: number;
  generation: number;
  meanEnergy: number;
  meanHealth: number;
  meanNodes: number;
  tick: number;
}

export const GRID = 36;
export const MAX_ORGANISMS = 40;
export const MAX_NODES = 21;
export const CELL_COUNT = 8;
export const WORLD_SIZE = 10;
