"use client";

import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BodyMesh } from "./BodyMesh";
import { AsteroidBelt, KuiperBelt, MilkyWay, NearbyStars, Starfield } from "./Backdrop";
import { CameraRig } from "./CameraRig";
import { Labels } from "./Labels";
import { Orbits } from "./Orbits";
import { GravityField, MeasurementLine, Photons, SpacetimeGrid } from "./Overlays";
import {
  BlackHoleScene,
  LightScene,
  NebulaScene,
  NeutronStarScene,
  SpacetimeScene,
  StellarScene,
} from "./modes/SpecializedScenes";
import { LifeScene } from "./modes/LifeScene";
import {
  BigBangScene,
  CosmicWebScene,
  GalaxiesScene,
  LocalGroupScene,
  MilkyWayScene,
  ObservableUniverseScene,
} from "./modes/CosmosScenes";

export function Scene() {
  const timeScale = useExplorer((s) => s.timeScale);
  const paused = useExplorer((s) => s.paused);
  const accuracyMode = useExplorer((s) => s.accuracyMode);
  const tick = useExplorer((s) => s.tick);
  const labMode = useExplorer((s) => s.labMode);
  const integrator = useExplorer((s) => s.integrator);
  const lastRev = useRef(simulation.revision);
  const uiAcc = useRef(0);

  useEffect(() => {
    if (accuracyMode === "simulation" && simulation.physicsMode !== "nbody") {
      simulation.enableNBody();
    }
  }, [accuracyMode]);

  useEffect(() => {
    simulation.integrator = integrator;
  }, [integrator]);

  useFrame((_, dt) => {
    const clamped = Math.min(dt, 0.05);
    if (labMode === "solar-system") {
      simulation.step(clamped, timeScale, paused);
    }
    uiAcc.current += dt;
    if (uiAcc.current > 0.12 || simulation.revision !== lastRev.current) {
      uiAcc.current = 0;
      lastRev.current = simulation.revision;
      useExplorer.getState().pulse();
    }
  });

  const bodies = useMemo(() => simulation.activeBodies(), [tick]);

  return (
    <>
      <color attach="background" args={["#05060f"]} />
      <hemisphereLight args={["#c5d4ff", "#1a1020", 0.55]} />
      <ambientLight intensity={0.22} />
      <CameraRig />
      <Starfield />
      {labMode === "solar-system" && (
        <>
          <MilkyWay />
          <NearbyStars />
          <AsteroidBelt />
          <KuiperBelt />
          <Orbits />
          <GravityField />
          <SpacetimeGrid />
          <Photons />
          <MeasurementLine />
          {bodies.map((body) => (
            <BodyMesh key={body.id} body={body} />
          ))}
          <Labels />
        </>
      )}
      {labMode === "stellar" && <StellarScene />}
      {labMode === "black-hole" && <BlackHoleScene />}
      {labMode === "neutron-star" && <NeutronStarScene />}
      {labMode === "nebula" && <NebulaScene />}
      {labMode === "light" && <LightScene />}
      {labMode === "spacetime" && <SpacetimeScene />}
      {labMode === "milky-way" && <MilkyWayScene />}
      {labMode === "galaxies" && <GalaxiesScene />}
      {labMode === "local-group" && <LocalGroupScene />}
      {labMode === "cosmic-web" && <CosmicWebScene />}
      {labMode === "observable-universe" && <ObservableUniverseScene />}
      {labMode === "big-bang" && <BigBangScene />}
      {labMode === "life" && <LifeScene />}
    </>
  );
}
