"use client";

import { renderUnitMeters } from "@/engine/scale";
import { toRender } from "@/rendering/visual";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const SAMPLES = 160;
const TRAIL_LEN = 180;

export function Orbits() {
  const layers = useExplorer((s) => s.layers);
  const selectedId = useExplorer((s) => s.selectedId);
  const tick = useExplorer((s) => s.tick);
  const bodies = useMemo(
    () => simulation.activeBodies().filter((b) => b.orbit || b.type === "asteroid"),
    [tick],
  );

  return (
    <group>
      {layers.orbits &&
        bodies
          .filter((b) => b.orbit)
          .map((body) => <OrbitLine key={body.id} bodyId={body.id} highlight={selectedId === body.id} />)}
      {layers.trails && simulation.physicsMode === "nbody" && (
        <NBodyTrails bodyIds={bodies.map((b) => b.id)} />
      )}
      {layers.velocity && <VelocityArrows />}
      {layers.orbitalPlane && <gridHelper args={[80, 40, "#2a3344", "#1a2230"]} />}
      {layers.centerOfMass && <CenterOfMassMark />}
      {layers.lagrange && selectedId && <LagrangeMarks planetId={selectedId} />}
    </group>
  );
}

function OrbitLine({ bodyId, highlight }: { bodyId: string; highlight: boolean }) {
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((SAMPLES + 1) * 3), 3));
    return g;
  }, []);

  useFrame(() => {
    const body = simulation.body(bodyId);
    if (!body?.orbit) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const pts = simulation.orbitPoints(body, SAMPLES);
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pts.length; i++) {
      const [x, y, z] = toRender(pts[i], origin, unit);
      attr.setXYZ(i, x, y, z);
    }
    if (pts[0]) {
      const [x, y, z] = toRender(pts[0], origin, unit);
      attr.setXYZ(pts.length, x, y, z);
    }
    attr.needsUpdate = true;
  });

  const line = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: highlight ? "#f6de9a" : "#9aa8c4",
      transparent: true,
      opacity: highlight ? 0.95 : 0.55,
    });
    return new THREE.Line(geometry, material);
  }, [geometry, highlight]);

  return <primitive object={line} />;
}

function NBodyTrails({ bodyIds }: { bodyIds: string[] }) {
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const buffers = useRef(new Map<string, Float32Array>());
  const lengths = useRef(new Map<string, number>());
  const acc = useRef(0);
  const geoms = useMemo(() => {
    const map = new Map<string, THREE.BufferGeometry>();
    for (const id of bodyIds) {
      const g = new THREE.BufferGeometry();
      const arr = new Float32Array(TRAIL_LEN * 3);
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      g.setDrawRange(0, 0);
      map.set(id, g);
      buffers.current.set(id, arr);
      lengths.current.set(id, 0);
    }
    return map;
  }, [bodyIds.join(",")]);

  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.08) return;
    acc.current = 0;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    for (const id of bodyIds) {
      const body = simulation.body(id);
      const arr = buffers.current.get(id);
      const geom = geoms.get(id);
      if (!body || !arr || !geom) continue;
      let n = lengths.current.get(id) ?? 0;
      const [x, y, z] = toRender(body.positionM, origin, unit);
      if (n < TRAIL_LEN) {
        arr[n * 3] = x;
        arr[n * 3 + 1] = y;
        arr[n * 3 + 2] = z;
        n += 1;
      } else {
        arr.copyWithin(0, 3);
        arr[(TRAIL_LEN - 1) * 3] = x;
        arr[(TRAIL_LEN - 1) * 3 + 1] = y;
        arr[(TRAIL_LEN - 1) * 3 + 2] = z;
      }
      lengths.current.set(id, n);
      (geom.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      geom.setDrawRange(0, n);
    }
  });

  const lines = useMemo(() => {
    return bodyIds.map((id) => {
      const geometry = geoms.get(id) ?? new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({ color: "#9ad7ff", transparent: true, opacity: 0.45 });
      return { id, line: new THREE.Line(geometry, material) };
    });
  }, [bodyIds, geoms]);

  return (
    <>
      {lines.map(({ id, line }) => (
        <primitive key={id} object={line} />
      ))}
    </>
  );
}

function VelocityArrows() {
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const group = useRef<THREE.Group>(null);
  const tick = useExplorer((s) => s.tick);
  const bodies = useMemo(() => simulation.activeBodies(), [tick]);

  useFrame(() => {
    if (!group.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    group.current.children.forEach((mesh, i) => {
      const body = bodies[i];
      if (!body) return;
      const live = simulation.body(body.id);
      if (!live) return;
      const [x, y, z] = toRender(live.positionM, origin, unit);
      mesh.position.set(x, y, z);
      const dir = new THREE.Vector3(live.velocityMS[0], live.velocityMS[1], live.velocityMS[2]);
      if (dir.lengthSq() > 0) {
        dir.normalize();
        mesh.lookAt(x + dir.x, y + dir.y, z + dir.z);
      }
    });
  });

  return (
    <group ref={group}>
      {bodies.map((b) => (
        <mesh key={b.id}>
          <coneGeometry args={[0.012, 0.05, 8]} />
          <meshBasicMaterial color="#7dffb2" />
        </mesh>
      ))}
    </group>
  );
}

function CenterOfMassMark() {
  const mesh = useRef<THREE.Mesh>(null);
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  useFrame(() => {
    if (!mesh.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const [x, y, z] = toRender(simulation.centerOfMass(), origin, unit);
    mesh.current.position.set(x, y, z);
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.03, 12, 12]} />
      <meshBasicMaterial color="#ff4d6d" />
    </mesh>
  );
}

function LagrangeMarks({ planetId }: { planetId: string }) {
  const focusId = useExplorer((s) => s.focusId);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const pts = simulation.lagrangePoints(planetId);
    group.current.children.forEach((child, i) => {
      const p = pts[i];
      if (!p) return;
      const [x, y, z] = toRender(p.positionM, origin, unit);
      child.position.set(x, y, z);
    });
  });
  return (
    <group ref={group}>
      {["L1", "L2", "L3", "L4", "L5"].map((label) => (
        <mesh key={label}>
          <octahedronGeometry args={[0.025, 0]} />
          <meshBasicMaterial color="#f0c36a" />
        </mesh>
      ))}
    </group>
  );
}
