"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Inspector } from "./Inspector";
import { LeftDock } from "./LeftDock";
import { ScaleRibbon } from "./ScaleRibbon";
import { TimeControls } from "./TimeControls";
import { TopBar } from "./TopBar";
import { simulation } from "@/simulation/engine";
import { TIME_PRESETS, useExplorer } from "@/simulation/store";
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
  const tint = WAVELENGTH_LOOK[wavelength].tint;

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
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePaused();
      }
      if (e.key === "f" && selectedId) useExplorer.getState().focus(selectedId);
      if (e.key === "p") simulation.emitPhoton(selectedId);
      if (e.key === "[") useExplorer.setState((s) => ({ dockOpen: !s.dockOpen }));
      if (e.key === "]") useExplorer.setState((s) => ({ inspectorOpen: !s.inspectorOpen }));
      if (e.key >= "1" && e.key <= "8") {
        const preset = TIME_PRESETS[Number(e.key) - 1];
        if (preset) setTimeScale(preset.value);
      }
      if (e.key === "Escape") {
        const s = useExplorer.getState();
        if (s.inspectorOpen) useExplorer.setState({ inspectorOpen: false });
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
    </div>
  );
}
