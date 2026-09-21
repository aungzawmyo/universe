import type { LabMode, ScenarioId } from "@/engine/types";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";

export const SCENARIOS: { id: ScenarioId; label: string; hint: string; mode?: LabMode }[] = [
  { id: "reset", label: "Reset solar system", hint: "Restore real catalog state", mode: "solar-system" },
  { id: "double-sun", label: "Sun becomes 2 M☉", hint: "Recalculate trajectories", mode: "solar-system" },
  { id: "no-jupiter", label: "Jupiter disappears", hint: "What happens to the rest?", mode: "solar-system" },
  { id: "no-moon", label: "Earth without Moon", hint: "Remove the Moon", mode: "solar-system" },
  { id: "earth-to-venus", label: "Earth → Venus orbit", hint: "Move Earth inward", mode: "solar-system" },
  { id: "remove-sun", label: "Remove the Sun", hint: "Planets become unbound", mode: "solar-system" },
  { id: "rogue-star", label: "Add another star", hint: "Binary-ish encounter", mode: "solar-system" },
  { id: "red-giant", label: "Sun becomes red giant", hint: "Stellar life cycle", mode: "stellar" },
  { id: "binary-star", label: "Binary star system", hint: "Companion star", mode: "solar-system" },
  { id: "supernova", label: "Supernova explosion", hint: "15 M☉ life cycle", mode: "stellar" },
  { id: "ns-merger", label: "Neutron-star merger", hint: "Pulsar laboratory", mode: "neutron-star" },
  { id: "star-around-bh", label: "Star orbiting black hole", hint: "Add BH to the system", mode: "solar-system" },
  { id: "bh-lensing", label: "Black-hole lensing", hint: "Photon sphere + disk", mode: "black-hole" },
  { id: "andromeda", label: "Milky Way–Andromeda", hint: "Accelerated encounter", mode: "local-group" },
  { id: "expansion", label: "Universe expansion", hint: "Scale factor animation", mode: "big-bang" },
  { id: "cmb", label: "CMB formation", hint: "Recombination epoch", mode: "big-bang" },
  { id: "first-stars", label: "First stars", hint: "100–200 Myr", mode: "big-bang" },
  { id: "galaxy-formation", label: "Galaxy formation", hint: "Early galaxies", mode: "galaxies" },
];

export const SCENARIO_IDS = SCENARIOS.map((s) => s.id);

export function applyExplorerScenario(id: ScenarioId, mode?: LabMode) {
  const meta = SCENARIOS.find((s) => s.id === id);
  if (mode ?? meta?.mode) useExplorer.getState().setLabMode((mode ?? meta?.mode)!);
  if (id === "red-giant") useExplorer.setState({ starMassSolar: 1, starAgeMyr: 11000, starRunning: true, labMode: "stellar" });
  if (id === "supernova") useExplorer.setState({ starMassSolar: 15, starAgeMyr: 10, starRunning: true, labMode: "stellar" });
  if (id === "cmb") useExplorer.setState({ cosmologyT: 0.5, labMode: "big-bang" });
  if (id === "first-stars") useExplorer.setState({ cosmologyT: 0.65, labMode: "big-bang" });
  if (id === "expansion") useExplorer.setState({ cosmologyT: 0.2, labMode: "big-bang" });
  if (id === "andromeda") useExplorer.setState({ andromedaT: 0, labMode: "local-group" });
  if (id === "bh-lensing") {
    useExplorer.setState({ labMode: "black-hole" });
    useExplorer.getState().setLayer("lensing", true);
    useExplorer.getState().setLayer("geodesics", true);
  }
  simulation.applyScenario(id);
  useExplorer.setState({ scenarioId: id === "reset" ? null : id });
  useExplorer.getState().pulse();
}
