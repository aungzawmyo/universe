"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { HelpOverlay } from "./HelpOverlay";
import { Inspector } from "./Inspector";
import { LeftDock } from "./LeftDock";
import { ScaleRibbon } from "./ScaleRibbon";
import { TimeControls } from "./TimeControls";
import { TopBar } from "./TopBar";
import { TourOverlay } from "./TourOverlay";
import { applyTourStop, endTour, startTour, stepTour } from "./tour";
import { simulation } from "@/simulation/engine";
import { applyExplorerScenario, SCENARIO_IDS } from "@/simulation/scenarios";
import { TIME_PRESETS, useExplorer } from "@/simulation/store";
import { LAB_MODES } from "@/engine/types";
import type { LabMode, ScenarioId } from "@/engine/types";
import { WAVELENGTH_LOOK } from "@/rendering/visual";

const UniverseCanvas = dynamic(
  () => import("@/rendering/UniverseCanvas").then((m) => m.UniverseCanvas),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#05060d]" /> },
);

export function ExplorerShell() {
  const togglePaused = useExplorer((s) => s.togglePaused);
  const setTimeScale = useExplorer((s) => s.setTimeScale);
  const selectedId = useExplorer((s) => s.selectedId);
  const wavelength = useExplorer((s) => s.wavelength);
  const labMode = useExplorer((s) => s.labMode);
  const focusId = useExplorer((s) => s.focusId);
  const scenarioId = useExplorer((s) => s.scenarioId);
  const tourOpen = useExplorer((s) => s.tourOpen);
  const tourStep = useExplorer((s) => s.tourStep);
  const tint = WAVELENGTH_LOOK[wavelength].tint;
  const skipUrlWrite = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)");
    const apply = () => {
      useExplorer.setState({
        dockOpen: !mq.matches,
        inspectorOpen: !mq.matches,
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lab = params.get("lab");
    if (lab && LAB_MODES.some((m) => m.id === lab)) {
      useExplorer.getState().setLabMode(lab as LabMode);
    }
    const scenario = params.get("scenario");
    if (scenario && SCENARIO_IDS.includes(scenario as ScenarioId)) {
      applyExplorerScenario(scenario as ScenarioId);
    }
    const focus = params.get("focus");
    if (focus && simulation.body(focus)) useExplorer.getState().focus(focus);
    const tour = params.get("tour");
    if (tour) {
      const index = Math.max(0, Number(tour) - 1);
      if (Number.isFinite(index)) applyTourStop(index);
    }
  }, []);

  useEffect(() => {
    if (skipUrlWrite.current) {
      skipUrlWrite.current = false;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("lab", labMode);
    if (labMode === "solar-system" && focusId) params.set("focus", focusId);
    else params.delete("focus");
    if (scenarioId) params.set("scenario", scenarioId);
    else params.delete("scenario");
    if (tourOpen) params.set("tour", String(tourStep + 1));
    else params.delete("tour");
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", next);
  }, [labMode, focusId, scenarioId, tourOpen, tourStep]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePaused();
      }
      if (e.key === "f" && selectedId) useExplorer.getState().focus(selectedId);
      if (e.key === "p") simulation.emitPhoton(selectedId);
      if (e.key === "?" || e.key === "/") useExplorer.setState((s) => ({ helpOpen: !s.helpOpen }));
      if (e.key === "t") {
        if (useExplorer.getState().tourOpen) endTour();
        else startTour();
      }
      if (e.key === "ArrowRight" && useExplorer.getState().tourOpen) stepTour(1);
      if (e.key === "ArrowLeft" && useExplorer.getState().tourOpen) stepTour(-1);
      if (e.key === "[") useExplorer.setState((s) => ({ dockOpen: !s.dockOpen }));
      if (e.key === "]") useExplorer.setState((s) => ({ inspectorOpen: !s.inspectorOpen }));
      if (e.key >= "1" && e.key <= "8") {
        const preset = TIME_PRESETS[Number(e.key) - 1];
        if (preset) setTimeScale(preset.value);
      }
      if (e.key === "Escape") {
        const s = useExplorer.getState();
        if (s.tourOpen) endTour();
        else if (s.helpOpen) useExplorer.setState({ helpOpen: false });
        else if (s.inspectorOpen) useExplorer.setState({ inspectorOpen: false });
        else s.select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePaused, setTimeScale, selectedId]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#05060d] text-[#ece8df]">
      <div className="absolute inset-0">
        <UniverseCanvas />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.28)_100%)]" />
      {tint !== "#ffffff" && (
        <div className="pointer-events-none absolute inset-0 mix-blend-screen" style={{ background: tint, opacity: 0.06 }} />
      )}
      <TopBar />
      <LeftDock />
      <Inspector />
      <ScaleRibbon />
      <TimeControls />
      <TourOverlay />
      <HelpOverlay />
    </div>
  );
}
