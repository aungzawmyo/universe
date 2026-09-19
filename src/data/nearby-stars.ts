import { LY, SOLAR_MASS, SOLAR_RADIUS } from "@/engine/constants";
import type { Vec3 } from "@/engine/vec3";

export interface NearbyStar {
  id: string;
  name: string;
  distanceLy: number;
  /** Galactic-ish cartesian offset in light-years from the Sun. */
  offsetLy: Vec3;
  massSolar: number;
  radiusSolar: number;
  temperatureK: number;
  spectralClass: string;
  color: string;
  dataSource: "real";
}

export const NEARBY_STARS: NearbyStar[] = [
  {
    id: "proxima",
    name: "Proxima Centauri",
    distanceLy: 4.2465,
    offsetLy: [-1.64, -0.4, -3.88],
    massSolar: 0.122,
    radiusSolar: 0.154,
    temperatureK: 3042,
    spectralClass: "M5.5Ve",
    color: "#ff8a4a",
    dataSource: "real",
  },
  {
    id: "alpha-cen-a",
    name: "α Centauri A",
    distanceLy: 4.37,
    offsetLy: [-1.67, -0.35, -4.0],
    massSolar: 1.079,
    radiusSolar: 1.218,
    temperatureK: 5790,
    spectralClass: "G2V",
    color: "#ffe6b0",
    dataSource: "real",
  },
  {
    id: "barnard",
    name: "Barnard's Star",
    distanceLy: 5.96,
    offsetLy: [4.97, 1.1, 3.05],
    massSolar: 0.144,
    radiusSolar: 0.196,
    temperatureK: 3134,
    spectralClass: "M4.0V",
    color: "#ff7d3a",
    dataSource: "real",
  },
  {
    id: "wolf-359",
    name: "Wolf 359",
    distanceLy: 7.86,
    offsetLy: [-3.1, 2.2, 6.8],
    massSolar: 0.11,
    radiusSolar: 0.16,
    temperatureK: 2749,
    spectralClass: "M6V",
    color: "#ff6a2c",
    dataSource: "real",
  },
  {
    id: "sirius",
    name: "Sirius A",
    distanceLy: 8.6,
    offsetLy: [-5.76, -1.2, 6.22],
    massSolar: 2.063,
    radiusSolar: 1.711,
    temperatureK: 9940,
    spectralClass: "A1V",
    color: "#cfe6ff",
    dataSource: "real",
  },
  {
    id: "epsilon-eri",
    name: "ε Eridani",
    distanceLy: 10.5,
    offsetLy: [6.8, -2.1, -7.6],
    massSolar: 0.82,
    radiusSolar: 0.74,
    temperatureK: 5084,
    spectralClass: "K2V",
    color: "#ffb56b",
    dataSource: "real",
  },
  {
    id: "procyon",
    name: "Procyon A",
    distanceLy: 11.46,
    offsetLy: [-9.1, 2.4, 6.6],
    massSolar: 1.499,
    radiusSolar: 2.048,
    temperatureK: 6530,
    spectralClass: "F5IV-V",
    color: "#fff4d2",
    dataSource: "real",
  },
  {
    id: "altair",
    name: "Altair",
    distanceLy: 16.7,
    offsetLy: [14.2, 3.1, 8.1],
    massSolar: 1.86,
    radiusSolar: 1.79,
    temperatureK: 7550,
    spectralClass: "A7V",
    color: "#f4fbff",
    dataSource: "real",
  },
  {
    id: "vega",
    name: "Vega",
    distanceLy: 25.04,
    offsetLy: [8.2, 18.4, 14.1],
    massSolar: 2.135,
    radiusSolar: 2.362,
    temperatureK: 9602,
    spectralClass: "A0V",
    color: "#e8f2ff",
    dataSource: "real",
  },
];

export function nearbyStarPositionM(star: NearbyStar): Vec3 {
  return [star.offsetLy[0] * LY, star.offsetLy[1] * LY, star.offsetLy[2] * LY];
}

export function nearbyStarMassKg(star: NearbyStar): number {
  return star.massSolar * SOLAR_MASS;
}

export function nearbyStarRadiusM(star: NearbyStar): number {
  return star.radiusSolar * SOLAR_RADIUS;
}
