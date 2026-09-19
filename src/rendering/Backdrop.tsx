"use client";

import { LY } from "@/engine/constants";
import { NEARBY_STARS, nearbyStarPositionM } from "@/data/nearby-stars";
import { renderUnitMeters, scaleFromDistance } from "@/engine/scale";
import { toRender } from "@/rendering/visual";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { Html, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function Starfield() {
  const gain = useExplorer((s) => (s.wavelength === "visible" ? 1 : 0.7));
  return (
    <Stars radius={180} depth={60} count={12000} factor={3.2 * gain} saturation={0.2} fade speed={0} />
  );
}

export function NearbyStars() {
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const focusId = useExplorer((s) => s.focusId);
  const scale = scaleFromDistance(cameraDistanceM);
  const group = useRef<THREE.Group>(null);
  const show = scale === "stellar" || scale === "galactic" || cameraDistanceM > 800 * 149_597_870_700;

  useFrame(() => {
    if (!group.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    group.current.children.forEach((child, i) => {
      const star = NEARBY_STARS[i];
      if (!star) return;
      const [x, y, z] = toRender(nearbyStarPositionM(star), origin, unit);
      child.position.set(x, y, z);
    });
  });

  if (!show) return null;
  return (
    <group ref={group}>
      {NEARBY_STARS.map((star) => (
        <group key={star.id}>
          <mesh>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color={star.color} />
          </mesh>
          <Html center distanceFactor={8}>
            <div className="whitespace-nowrap rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-amber-50/80">
              {star.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

export function AsteroidBelt() {
  const enabled = useExplorer((s) => s.layers.asteroidBelt);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const focusId = useExplorer((s) => s.focusId);
  const points = useMemo(() => makeBelt(2.2, 3.3, 2200, 0.08), []);
  return enabled ? <BeltPoints points={points} color="#8d8070" cameraDistanceM={cameraDistanceM} focusId={focusId} /> : null;
}

export function KuiperBelt() {
  const enabled = useExplorer((s) => s.layers.kuiperBelt);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const focusId = useExplorer((s) => s.focusId);
  const points = useMemo(() => makeBelt(30, 49, 2800, 0.25), []);
  return enabled ? <BeltPoints points={points} color="#6d7e93" cameraDistanceM={cameraDistanceM} focusId={focusId} /> : null;
}

function makeBelt(innerAU: number, outerAU: number, count: number, thickness: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = innerAU + Math.random() * (outerAU - innerAU);
    const th = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * thickness;
    positions[i * 3] = a * Math.cos(th);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = a * Math.sin(th);
  }
  return positions;
}

function BeltPoints({
  points,
  color,
  cameraDistanceM,
  focusId,
}: {
  points: Float32Array;
  color: string;
  cameraDistanceM: number;
  focusId: string;
}) {
  const obj = useRef<THREE.Points>(null);
  useFrame(() => {
    if (!obj.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const AU = 149_597_870_700;
    obj.current.position.set(-origin[0] / unit, -origin[1] / unit, -origin[2] / unit);
    obj.current.scale.setScalar(AU / unit);
  });
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(points, 3));
    return g;
  }, [points]);
  return (
    <points ref={obj} geometry={geom}>
      <pointsMaterial color={color} size={0.015} sizeAttenuation transparent opacity={0.55} />
    </points>
  );
}

export function MilkyWay() {
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const scale = scaleFromDistance(cameraDistanceM);
  const showParticles = scale === "galactic" || scale === "local-group" || scale === "stellar";
  const { positions, colors } = useMemo(() => makeGalaxy(24000), []);
  const points = useRef<THREE.Points>(null);

  useFrame(() => {
    if (!points.current) return;
    const unit = renderUnitMeters(cameraDistanceM);
    points.current.scale.setScalar(LY / unit);
    points.current.visible = showParticles;
  });

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <points ref={points} geometry={geom}>
      <pointsMaterial vertexColors size={0.012} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

function makeGalaxy(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sunOffset = 26800;
  for (let i = 0; i < count; i++) {
    const arm = i % 4;
    const r = Math.pow(Math.random(), 0.7) * 52000;
    const spiral = r * 0.00022 + arm * (Math.PI / 2);
    const theta = spiral + (Math.random() - 0.5) * 0.45;
    const x = r * Math.cos(theta) - sunOffset;
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * (900 + r * 0.012);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    const bulge = r < 6000;
    colors[i * 3] = bulge ? 1 : 0.72 + Math.random() * 0.25;
    colors[i * 3 + 1] = bulge ? 0.82 : 0.78 + Math.random() * 0.15;
    colors[i * 3 + 2] = bulge ? 0.55 : 0.95;
  }
  return { positions, colors };
}
