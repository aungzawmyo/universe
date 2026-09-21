"use client";

import { renderUnitMeters, scaleFromDistance } from "@/engine/scale";
import { formatDistance, formatMass, formatTemperature } from "@/engine/units";
import { toRender, visualRadiusM } from "@/rendering/visual";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function Labels() {
  const layers = useExplorer((s) => s.layers);
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const enhancePlanetSize = useExplorer((s) => s.enhancePlanetSize);
  const enhanceStarSize = useExplorer((s) => s.enhanceStarSize);
  const tick = useExplorer((s) => s.tick);
  const scale = scaleFromDistance(cameraDistanceM);
  void tick;
  if (!layers.labels) return null;

  const bodies = simulation
    .activeBodies()
    .filter((b) => {
      if (scale === "stellar" || scale === "galactic") return b.type === "star";
      if (b.type === "moon") return cameraDistanceM < 0.4 * 149_597_870_700;
      return b.type === "planet" || b.type === "star" || b.type === "dwarf-planet" || b.type === "black-hole" || b.type === "asteroid" || b.type === "comet" || b.type === "neutron-star";
    });

  return (
    <group>
      {bodies.map((body) => (
        <BodyLabel
          key={body.id}
          bodyId={body.id}
          focusId={focusId}
          cameraDistanceM={cameraDistanceM}
          enhancePlanetSize={enhancePlanetSize}
          enhanceStarSize={enhanceStarSize}
          showMass={layers.masses}
          showTemp={layers.temperatures}
          showDist={layers.distances}
        />
      ))}
    </group>
  );
}

function BodyLabel({
  bodyId,
  focusId,
  cameraDistanceM,
  enhancePlanetSize,
  enhanceStarSize,
  showMass,
  showTemp,
  showDist,
}: {
  bodyId: string;
  focusId: string;
  cameraDistanceM: number;
  enhancePlanetSize: boolean;
  enhanceStarSize: boolean;
  showMass: boolean;
  showTemp: boolean;
  showDist: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const body = simulation.body(bodyId);
    if (!body || !group.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const [x, y, z] = toRender(body.positionM, origin, unit);
    const r = visualRadiusM(body, enhancePlanetSize, enhanceStarSize) / unit;
    group.current.position.set(x, y + r * 1.4, z);
  });

  const body = simulation.body(bodyId);
  if (!body) return null;
  const sun = simulation.body("sun");
  const extra = [
    showMass ? formatMass(body.massKg) : null,
    showTemp && body.temperatureK ? formatTemperature(body.temperatureK) : null,
    showDist && sun ? formatDistance(simulation.distance(body.id, "sun")) : null,
  ].filter(Boolean);

  return (
    <group ref={group}>
      <Html center sprite>
        <div className="pointer-events-none whitespace-nowrap text-center">
          <div className="text-[11px] font-medium tracking-wide text-white/90 drop-shadow">{body.name}</div>
          {extra.length > 0 && <div className="text-[9px] text-amber-100/70">{extra.join(" · ")}</div>}
        </div>
      </Html>
    </group>
  );
}
