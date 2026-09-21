import type { LabMode } from "@/engine/types";
import { applyExplorerScenario } from "@/simulation/scenarios";
import { useExplorer } from "@/simulation/store";

export interface TourStop {
  title: string;
  fact: string;
  lab: LabMode;
  focus?: string;
  scenario?: Parameters<typeof applyExplorerScenario>[0];
}

export const TOUR_STOPS: TourStop[] = [
  {
    title: "Earth from the Sun",
    fact: "A photon takes about 8 minutes 19 seconds to reach Earth. That light-travel time is the first honest measurement in this lab.",
    lab: "solar-system",
    focus: "earth",
    scenario: "reset",
  },
  {
    title: "Jupiter’s mass",
    fact: "Jupiter holds most of the planetary mass. Later you can remove it and watch the engine switch from Kepler orbits to N-body.",
    lab: "solar-system",
    focus: "jupiter",
  },
  {
    title: "Small worlds",
    fact: "Ceres, Vesta, and Enceladus use the same Kepler path as Earth. The catalog is a teaching set, not Celestia’s add-on universe.",
    lab: "solar-system",
    focus: "ceres",
  },
  {
    title: "A star’s life table",
    fact: "The Stars lab is an evolutionary table, not live hydrodynamics. Mass and age pick a snapshot on the HR plane.",
    lab: "stellar",
  },
  {
    title: "Horizon, not a hole in space",
    fact: "The black-hole lab shows Schwarzschild radius and the photon sphere. Spin is visual. This is not a Kerr solver.",
    lab: "black-hole",
  },
  {
    title: "Expansion of space",
    fact: "The Big Bang lab is a timeline of temperature and scale factor. It is not an explosion into empty space.",
    lab: "big-bang",
  },
  {
    title: "Life as a program",
    fact: "The Life lab is an artificial-life model. Fibonacci, fractals, automata, and reaction–diffusion are mechanisms under energy, genome, and selection — not a discovered law of biology.",
    lab: "life",
  },
];

export function applyTourStop(index: number) {
  const stop = TOUR_STOPS[index];
  if (!stop) return;
  useExplorer.setState({
    tourOpen: true,
    tourStep: index,
    helpOpen: false,
    inspectorOpen: true,
    paused: true,
  });
  useExplorer.getState().setLabMode(stop.lab);
  if (stop.scenario) applyExplorerScenario(stop.scenario, stop.lab);
  if (stop.focus) useExplorer.getState().focus(stop.focus);
}

export function startTour() {
  applyTourStop(0);
}

export function stepTour(delta: number) {
  const next = useExplorer.getState().tourStep + delta;
  if (next < 0 || next >= TOUR_STOPS.length) return;
  applyTourStop(next);
}

export function endTour() {
  useExplorer.setState({ tourOpen: false });
}
