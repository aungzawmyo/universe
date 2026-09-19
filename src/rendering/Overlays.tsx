"use client";

import { AU } from "@/engine/constants";
import { renderUnitMeters } from "@/engine/scale";
import { gravityAt, gravitationalPotential } from "@/physics/nbody";
import { toRender } from "@/rendering/visual";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function GravityField() {
  const enabled = useExplorer((s) => s.layers.gravity);
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const group = useRef<THREE.Group>(null);

  const samples = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = -5; i <= 5; i++) {
      for (let j = -5; j <= 5; j++) {
        if (i === 0 && j === 0) continue;
        pts.push([i * 0.8, j * 0.8]);
      }
    }
    return pts;
  }, []);

  useFrame(() => {
    if (!enabled || !group.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const bodies = simulation.activeBodies();
    const positions = bodies.map((b) => b.positionM);
    const masses = bodies.map((b) => b.massKg);
    group.current.children.forEach((child, idx) => {
      const s = samples[idx];
      if (!s) return;
      const at: [number, number, number] = [origin[0] + s[0] * AU, origin[1], origin[2] + s[1] * AU];
      const g = gravityAt(positions, masses, simulation.G, at);
      const [x, y, z] = toRender(at, origin, unit);
      child.position.set(x, y, z);
      const dir = new THREE.Vector3(g[0], g[1], g[2]);
      if (dir.lengthSq() > 0) {
        dir.normalize();
        child.lookAt(x + dir.x, y + dir.y, z + dir.z);
      }
    });
  });

  if (!enabled) return null;
  return (
    <group ref={group}>
      {samples.map((s, i) => (
        <mesh key={`${s[0]}-${s[1]}-${i}`}>
          <coneGeometry args={[0.02, 0.08, 6]} />
          <meshBasicMaterial color="#7ecbff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export function SpacetimeGrid() {
  const enabled = useExplorer((s) => s.layers.spacetime);
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(40, 40, 70, 70), []);

  useFrame(() => {
    if (!enabled || !mesh.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const bodies = simulation.activeBodies();
    const positions = bodies.map((b) => b.positionM);
    const masses = bodies.map((b) => b.massKg);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      const world: [number, number, number] = [origin[0] + lx * unit, origin[1], origin[2] + ly * unit];
      const phi = gravitationalPotential(positions, masses, simulation.G, world);
      const height = THREE.MathUtils.clamp(phi * 4e-12, -6, 0.4);
      pos.setZ(i, height);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    mesh.current.position.set(0, -0.4, 0);
  });

  if (!enabled) return null;
  return (
    <group>
      <mesh ref={mesh} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#6aa7ff"
          wireframe
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Html position={[0, 1.2, 0]} center>
        <div className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] tracking-wide text-sky-100/80">
          Rubber-sheet analogy — not literal 3D spacetime
        </div>
      </Html>
    </group>
  );
}

export function Photons() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);

  useFrame(() => {
    if (!mesh.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const photons = simulation.photons;
    const n = Math.min(photons.length, 32);
    for (let i = 0; i < n; i++) {
      const [x, y, z] = toRender(photons[i].positionM, origin, unit);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.04);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.count = n;
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  const trail = simulation.photons[0];
  const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
  const unit = renderUnitMeters(cameraDistanceM);
  const linePts = trail
    ? [toRender(trail.positionM, origin, unit), toRender(origin, origin, unit)]
    : null;

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, 32]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#fff4c2" />
      </instancedMesh>
      {linePts && <Line points={linePts} color="#fff1a8" transparent opacity={0.4} />}
    </>
  );
}

export function MeasurementLine() {
  const enabled = useExplorer((s) => s.layers.distances);
  const selectedId = useExplorer((s) => s.selectedId);
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  if (!enabled || !selectedId) return null;
  const a = simulation.body(selectedId);
  const b = simulation.body("sun");
  if (!a || !b) return null;
  const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
  const unit = renderUnitMeters(cameraDistanceM);
  return <Line points={[toRender(a.positionM, origin, unit), toRender(b.positionM, origin, unit)]} color="#f0d48a" dashed dashSize={0.08} gapSize={0.05} />;
}
