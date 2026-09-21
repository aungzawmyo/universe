import { SOLAR_SYSTEM_CATALOG } from "@/data/solar-system";
import { AU, C, DAY, G as G_CONST, J2000_MS } from "@/engine/constants";
import { gravitationalParameter, keplerState, schwarzschildRadius } from "@/engine/kepler";
import type { CatalogBody, IntegratorName, PhysicsMode, ScenarioId, SimBody } from "@/engine/types";
import type { Vec3 } from "@/engine/vec3";
import { add, copy, dist, length, scale, set, sub, zero } from "@/engine/vec3";
import { leapfrog, rk4, velocityVerlet } from "@/physics/integrators";
import { nbodyAccelerations } from "@/physics/nbody";

export interface Photon {
  id: number;
  positionM: Vec3;
  direction: Vec3;
  alive: boolean;
  bornS: number;
}

export interface LagrangePoint {
  id: string;
  label: string;
  positionM: Vec3;
}

function cloneCatalog(body: CatalogBody): SimBody {
  return {
    ...body,
    positionM: zero(),
    velocityMS: zero(),
    accelerationMS2: zero(),
    rotationRad: 0,
    modified: false,
    removed: false,
  };
}

const DEFAULT_EPOCH = new Date("2026-09-20T00:00:00.000Z");

function secondsSinceJ2000(date = DEFAULT_EPOCH): number {
  return (date.getTime() - J2000_MS) / 1000;
}

export class SimulationEngine {
  bodies: SimBody[] = [];
  G = G_CONST;
  timeS = secondsSinceJ2000();
  physicsMode: PhysicsMode = "kepler";
  photons: Photon[] = [];
  revision = 0;
  integrator: IntegratorName = "verlet";
  energyHistory: { timeS: number; kinetic: number; potential: number; total: number }[] = [];
  private catalog: CatalogBody[];
  private photonSeq = 1;
  private energySkip = 0;

  constructor(catalog: CatalogBody[] = SOLAR_SYSTEM_CATALOG) {
    this.catalog = catalog.map((b) => ({ ...b, orbit: b.orbit ? { ...b.orbit } : undefined }));
    this.reset();
  }

  reset(toNow = true) {
    this.G = G_CONST;
    this.physicsMode = "kepler";
    this.timeS = toNow ? secondsSinceJ2000() : 0;
    this.bodies = this.catalog.map(cloneCatalog);
    this.photons = [];
    this.energyHistory = [];
    this.energySkip = 0;
    this.evaluateKepler();
    this.revision++;
  }

  body(id: string): SimBody | undefined {
    return this.bodies.find((b) => b.id === id && !b.removed);
  }

  catalogMass(id: string): number | undefined {
    return this.catalog.find((b) => b.id === id)?.massKg;
  }

  activeBodies(): SimBody[] {
    return this.bodies.filter((b) => !b.removed);
  }

  parentOf(body: SimBody): SimBody | undefined {
    return body.parentId ? this.body(body.parentId) : undefined;
  }

  evaluateKepler(atTime = this.timeS) {
    const byId = new Map(this.bodies.map((b) => [b.id, b]));

    for (const body of this.bodies) {
      if (body.removed) continue;
      if (!body.orbit || !body.parentId) {
        set(body.positionM, 0, 0, 0);
        set(body.velocityMS, 0, 0, 0);
        continue;
      }
      const parent = byId.get(body.parentId);
      if (!parent) continue;
      const mu = gravitationalParameter(parent.massKg, body.massKg);
      keplerState(body.orbit, mu, atTime, body.positionM, body.velocityMS);
    }

    // Hierarchical positions: moons are relative to their parent.
    const resolved = new Set<string>();
    const resolve = (body: SimBody) => {
      if (resolved.has(body.id)) return;
      if (body.parentId) {
        const parent = byId.get(body.parentId);
        if (parent && !parent.removed) {
          resolve(parent);
          add(body.positionM, parent.positionM, body.positionM);
          add(body.velocityMS, parent.velocityMS, body.velocityMS);
        }
      }
      resolved.add(body.id);
    };
    for (const body of this.bodies) {
      if (!body.removed) resolve(body);
    }

    this.applyBarycenter();
    this.updateRotations(0);
  }

  private applyBarycenter() {
    const active = this.activeBodies();
    let mass = 0;
    const com: Vec3 = [0, 0, 0];
    const cov: Vec3 = [0, 0, 0];
    for (const b of active) {
      mass += b.massKg;
      com[0] += b.positionM[0] * b.massKg;
      com[1] += b.positionM[1] * b.massKg;
      com[2] += b.positionM[2] * b.massKg;
      cov[0] += b.velocityMS[0] * b.massKg;
      cov[1] += b.velocityMS[1] * b.massKg;
      cov[2] += b.velocityMS[2] * b.massKg;
    }
    if (mass <= 0) return;
    com[0] /= mass;
    com[1] /= mass;
    com[2] /= mass;
    cov[0] /= mass;
    cov[1] /= mass;
    cov[2] /= mass;
    for (const b of active) {
      sub(b.positionM, com, b.positionM);
      sub(b.velocityMS, cov, b.velocityMS);
    }
  }

  centerOfMass(): Vec3 {
    const active = this.activeBodies();
    let mass = 0;
    const com: Vec3 = [0, 0, 0];
    for (const b of active) {
      mass += b.massKg;
      com[0] += b.positionM[0] * b.massKg;
      com[1] += b.positionM[1] * b.massKg;
      com[2] += b.positionM[2] * b.massKg;
    }
    if (mass <= 0) return com;
    return scale(com, 1 / mass);
  }

  step(realDt: number, timeScale: number, paused: boolean) {
    if (paused || realDt <= 0) return;
    const simDt = Math.max(-1e9, Math.min(1e9, realDt * timeScale));
    if (simDt === 0) return;

    if (this.physicsMode === "kepler") {
      this.timeS += simDt;
      this.evaluateKepler();
    } else {
      this.integrateNBody(simDt);
      this.timeS += simDt;
      this.updateHierarchicalMoons();
      this.updateRotations(simDt);
    }

    this.stepPhotons(simDt);
    if (this.physicsMode === "nbody") {
      this.energySkip++;
      if (this.energySkip % 8 === 0) this.sampleEnergy();
    }
  }

  private integrateNBody(simDt: number) {
    const majors = this.activeBodies().filter((b) => !b.hierarchical || b.modified);
    if (majors.length === 0) return;

    const positions = majors.map((b) => b.positionM);
    const velocities = majors.map((b) => b.velocityMS);
    const accelerations = majors.map((b) => b.accelerationMS2);
    const masses = majors.map((b) => b.massKg);

    const accelerate = () => nbodyAccelerations(positions, masses, accelerations, this.G);
    accelerate();

    const absDt = Math.abs(simDt);
    const sign = Math.sign(simDt);
    // Moon-scale systems need minutes; planet-only can take hours.
    const hasCloseMoons = majors.some((b) => b.type === "moon");
    const target = hasCloseMoons ? 600 : 1800;
    const maxSteps = 240;
    const stepSize = Math.max(absDt / maxSteps, Math.min(target, absDt));
    let remaining = absDt;
    while (remaining > 1e-6) {
      const dt = Math.min(stepSize, remaining) * sign;
      const step =
        this.integrator === "leapfrog" ? leapfrog : this.integrator === "rk4" ? rk4 : velocityVerlet;
      step(positions, velocities, accelerations, dt, accelerate);
      remaining -= Math.abs(dt);
    }
  }

  private updateHierarchicalMoons() {
    const byId = new Map(this.bodies.map((b) => [b.id, b]));
    for (const body of this.bodies) {
      if (body.removed || !body.hierarchical || body.modified || !body.orbit || !body.parentId) {
        continue;
      }
      const parent = byId.get(body.parentId);
      if (!parent || parent.removed) continue;
      const mu = gravitationalParameter(parent.massKg, body.massKg);
      const relP = zero();
      const relV = zero();
      keplerState(body.orbit, mu, this.timeS, relP, relV);
      add(parent.positionM, relP, body.positionM);
      add(parent.velocityMS, relV, body.velocityMS);
    }
  }

  private updateRotations(dt: number) {
    for (const body of this.bodies) {
      if (body.removed || !body.rotationPeriodS) continue;
      const omega = (Math.PI * 2) / body.rotationPeriodS;
      body.rotationRad += omega * (dt || 0);
      if (this.physicsMode === "kepler") {
        body.rotationRad = omega * this.timeS;
      }
    }
  }

  private stepPhotons(simDt: number) {
    for (const photon of this.photons) {
      if (!photon.alive) continue;
      photon.positionM[0] += photon.direction[0] * C * simDt;
      photon.positionM[1] += photon.direction[1] * C * simDt;
      photon.positionM[2] += photon.direction[2] * C * simDt;
      if (length(photon.positionM) > 80 * AU) photon.alive = false;
    }
    this.photons = this.photons.filter((p) => p.alive);
  }

  enableNBody() {
    if (this.physicsMode === "nbody") return;
    this.evaluateKepler();
    this.physicsMode = "nbody";
    this.energyHistory = [];
    this.energySkip = 0;
    this.sampleEnergy();
    this.revision++;
  }

  setMass(id: string, massKg: number) {
    const body = this.body(id);
    if (!body) return;
    this.enableNBody();
    body.massKg = Math.max(1, massKg);
    body.modified = true;
    body.dataSource = "simulated";
    this.revision++;
  }

  setG(multiplier: number) {
    this.enableNBody();
    this.G = G_CONST * multiplier;
    this.revision++;
  }

  removeBody(id: string) {
    if (id === "sun") {
      const sun = this.body("sun");
      if (sun) {
        this.enableNBody();
        sun.massKg = 1;
        sun.removed = true;
        sun.modified = true;
        sun.dataSource = "simulated";
      }
    } else {
      const body = this.body(id);
      if (!body) return;
      this.enableNBody();
      body.removed = true;
      body.modified = true;
      for (const child of this.bodies.filter((b) => b.parentId === id && !b.removed)) {
        this.removeBody(child.id);
      }
    }
    this.revision++;
  }

  moveBodyToOrbit(id: string, targetId: string) {
    const body = this.body(id);
    const target = this.body(targetId);
    if (!body || !target || !target.orbit) return;
    this.enableNBody();
    body.orbit = { ...target.orbit, a: target.orbit.a, meanAnomalyJ2000: target.orbit.meanAnomalyJ2000 + 0.4 };
    body.modified = true;
    body.dataSource = "simulated";
    const parent = this.parentOf(body) ?? this.body("sun");
    if (parent && body.orbit) {
      const mu = gravitationalParameter(parent.massKg, body.massKg);
      const relP = zero();
      const relV = zero();
      keplerState(body.orbit, mu, this.timeS, relP, relV);
      add(parent.positionM, relP, body.positionM);
      add(parent.velocityMS, relV, body.velocityMS);
    }
    this.revision++;
  }

  launchAsteroid(fromId = "earth") {
    const origin = this.body(fromId) ?? this.body("earth") ?? this.activeBodies()[0];
    if (!origin) return;
    this.enableNBody();
    const dir = copy(origin.velocityMS);
    const speed = length(dir) || 3e4;
    const offset = scale(origin.positionM, 0);
    // Place ~0.02 AU sunward-offset from the origin along +z of its radius vector.
    const radial = copy(origin.positionM);
    const r = length(radial) || AU;
    offset[0] = origin.positionM[0] + (radial[0] / r) * 0.02 * AU;
    offset[1] = origin.positionM[1] + 0.002 * AU;
    offset[2] = origin.positionM[2] + (radial[2] / r) * 0.02 * AU;

    const asteroid: SimBody = {
      id: `asteroid-${this.photonSeq++}`,
      name: "Sandbox asteroid",
      type: "asteroid",
      parentId: "sun",
      massKg: 1e16,
      radiusM: 2e5,
      color: "#b9a089",
      rotationPeriodS: 8 * 3600,
      axialTiltDeg: 20,
      dataSource: "simulated",
      positionM: offset,
      velocityMS: [dir[0] * 0.92, dir[1] * 0.2, dir[2] * 0.92 + speed * 0.08],
      accelerationMS2: zero(),
      rotationRad: 0,
      modified: true,
      removed: false,
    };
    this.bodies.push(asteroid);
    this.revision++;
    return asteroid.id;
  }

  createBlackHole(massSolar = 10) {
    const sun = this.body("sun");
    if (!sun) return;
    this.enableNBody();
    const id = `black-hole-${this.photonSeq++}`;
    const massKg = massSolar * 1.98847e30;
    const rs = schwarzschildRadius(massKg);
    const body: SimBody = {
      id,
      name: `${massSolar} M☉ black hole`,
      type: "black-hole",
      parentId: null,
      massKg,
      radiusM: Math.max(rs, 1e6),
      color: "#0b0b12",
      emissive: "#6a3cff",
      rotationPeriodS: 1e12,
      axialTiltDeg: 0,
      dataSource: "simulated",
      positionM: [3.2 * AU, 0.15 * AU, 1.1 * AU],
      velocityMS: [0, 0, -8000],
      accelerationMS2: zero(),
      rotationRad: 0,
      modified: true,
      removed: false,
    };
    this.bodies.push(body);
    this.revision++;
    return id;
  }

  addStarCompanion(massSolar = 1) {
    const sun = this.body("sun");
    if (!sun) return;
    this.enableNBody();
    const id = `star-${this.photonSeq++}`;
    const massKg = massSolar * 1.98847e30;
    const body: SimBody = {
      id,
      name: "Companion star",
      type: "star",
      parentId: null,
      massKg,
      radiusM: 6.957e8 * Math.pow(massSolar, 0.8),
      color: "#ffd9a0",
      emissive: "#ffb347",
      temperatureK: 5600,
      luminosityW: 3.828e26 * Math.pow(massSolar, 3.5),
      spectralClass: "G",
      rotationPeriodS: 20 * DAY,
      axialTiltDeg: 4,
      dataSource: "simulated",
      positionM: [18 * AU, 1 * AU, 4 * AU],
      velocityMS: [0, 2000, -12000],
      accelerationMS2: zero(),
      rotationRad: 0,
      modified: true,
      removed: false,
    };
    this.bodies.push(body);
    this.revision++;
    return id;
  }

  createNeutronStar() {
    const sun = this.body("sun");
    if (!sun) return;
    this.enableNBody();
    const id = `neutron-star-${this.photonSeq++}`;
    const body: SimBody = {
      id,
      name: "Sandbox pulsar",
      type: "neutron-star",
      parentId: null,
      massKg: 1.4 * 1.98847e30,
      radiusM: 1.2e4,
      color: "#dfefff",
      emissive: "#8cf4ff",
      rotationPeriodS: 0.033,
      axialTiltDeg: 60,
      temperatureK: 6e5,
      dataSource: "simulated",
      positionM: [4.1 * AU, 0.2 * AU, -1.4 * AU],
      velocityMS: [0, 1500, -11000],
      accelerationMS2: zero(),
      rotationRad: 0,
      modified: true,
      removed: false,
    };
    this.bodies.push(body);
    this.revision++;
    return id;
  }

  emitPhoton(fromId?: string | null) {
    const origin = (fromId && this.body(fromId)) || this.body("sun");
    if (!origin) return;
    const target = this.body("earth") ?? this.activeBodies().find((b) => b.id !== origin.id);
    const direction: Vec3 = target
      ? sub(target.positionM, origin.positionM)
      : [1, 0, 0];
    const len = length(direction) || 1;
    scale(direction, 1 / len, direction);
    const start = copy(origin.positionM);
    add(start, scale(direction, origin.radiusM * 1.2), start);
    this.photons.push({
      id: this.photonSeq++,
      positionM: start,
      direction,
      alive: true,
      bornS: this.timeS,
    });
  }

  applyScenario(id: ScenarioId) {
    switch (id) {
      case "reset":
        this.reset();
        break;
      case "no-moon":
        this.reset();
        this.removeBody("moon");
        break;
      case "no-jupiter":
        this.reset();
        this.removeBody("jupiter");
        break;
      case "double-sun":
        this.reset();
        this.setMass("sun", (this.body("sun")?.massKg ?? 1.98847e30) * 2);
        break;
      case "earth-to-venus":
        this.reset();
        this.moveBodyToOrbit("earth", "venus");
        break;
      case "remove-sun":
        this.reset();
        this.removeBody("sun");
        break;
      case "rogue-star":
      case "binary-star":
        this.reset();
        this.addStarCompanion(0.9);
        break;
      case "star-around-bh":
        this.reset();
        this.createBlackHole(12);
        break;
      default:
        this.reset();
        break;
    }
  }

  orbitPoints(body: SimBody, samples = 128): Vec3[] {
    if (!body.orbit) return [];
    const parent = this.parentOf(body);
    const parentMass = parent?.massKg ?? 1.98847e30;
    const mu = gravitationalParameter(parentMass, body.massKg);
    const points: Vec3[] = [];
    const periodGuess = 2 * Math.PI * Math.sqrt(body.orbit.a ** 3 / mu);
    for (let i = 0; i < samples; i++) {
      const t = this.timeS + (periodGuess * i) / samples;
      const p = zero();
      const v = zero();
      keplerState(body.orbit, mu, t, p, v);
      if (parent) add(p, parent.positionM, p);
      points.push(copy(p));
    }
    return points;
  }

  trailSample(body: SimBody): Vec3 {
    return copy(body.positionM);
  }

  distance(aId: string, bId: string): number {
    const a = this.body(aId);
    const b = this.body(bId);
    if (!a || !b) return 0;
    return dist(a.positionM, b.positionM);
  }

  sampleEnergy() {
    const energy = this.mechanicalEnergy();
    this.energyHistory.push({ timeS: this.timeS, ...energy });
    if (this.energyHistory.length > 240) this.energyHistory.shift();
  }

  mechanicalEnergy(): { kinetic: number; potential: number; total: number } {
    const bodies = this.activeBodies();
    let kinetic = 0;
    let potential = 0;
    for (const body of bodies) {
      const v = length(body.velocityMS);
      kinetic += 0.5 * body.massKg * v * v;
    }
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const r = Math.max(1, dist(bodies[i].positionM, bodies[j].positionM));
        potential -= (this.G * bodies[i].massKg * bodies[j].massKg) / r;
      }
    }
    return { kinetic, potential, total: kinetic + potential };
  }

  lagrangePoints(planetId: string): LagrangePoint[] {
    const planet = this.body(planetId);
    const sun = this.body("sun");
    if (!planet || !sun || planet.id === "sun") return [];
    const r = sub(planet.positionM, sun.positionM);
    const d = length(r) || 1;
    const u = scale(r, 1 / d);
    const mu = planet.massKg / (sun.massKg + planet.massKg);
    const hill = d * Math.cbrt(mu / 3);
    const side: Vec3 = [-u[2], 0, u[0]];
    const sl = length(side) || 1;
    scale(side, 1 / sl, side);
    const l1 = add(sun.positionM, scale(u, d - hill));
    const l2 = add(sun.positionM, scale(u, d + hill));
    const l3 = add(sun.positionM, scale(u, -d));
    const l4 = add(planet.positionM, scale(side, d * Math.sin(Math.PI / 3)));
    const l5 = add(planet.positionM, scale(side, -d * Math.sin(Math.PI / 3)));
    return [
      { id: `${planetId}-l1`, label: "L1", positionM: l1 },
      { id: `${planetId}-l2`, label: "L2", positionM: l2 },
      { id: `${planetId}-l3`, label: "L3", positionM: l3 },
      { id: `${planetId}-l4`, label: "L4", positionM: l4 },
      { id: `${planetId}-l5`, label: "L5", positionM: l5 },
    ];
  }

  eclipseHint(): string | null {
    const sun = this.body("sun");
    const earth = this.body("earth");
    const moon = this.body("moon");
    if (!sun || !earth || !moon) return null;
    const se = sub(earth.positionM, sun.positionM);
    const em = sub(moon.positionM, earth.positionM);
    const seN = length(se) || 1;
    const emN = length(em) || 1;
    const align = (se[0] * em[0] + se[1] * em[1] + se[2] * em[2]) / (seN * emN);
    if (align > 0.9992) return "Solar eclipse geometry (Sun–Moon–Earth aligned)";
    if (align < -0.9992) return "Lunar eclipse geometry (Sun–Earth–Moon aligned)";
    return null;
  }
}

export const simulation = new SimulationEngine();
