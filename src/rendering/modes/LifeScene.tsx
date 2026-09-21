"use client";

import { hexColor, hueColor } from "@/life/math";
import { GRID, WORLD_SIZE } from "@/life/types";
import { lifeWorld } from "@/life/engine";
import { useExplorer } from "@/simulation/store";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function LifeScene() {
  const paused = useExplorer((s) => s.paused);
  const timeScale = useExplorer((s) => s.timeScale);
  const nutrient = useExplorer((s) => s.lifeNutrient);
  const mutation = useExplorer((s) => s.lifeMutation);
  const temperature = useExplorer((s) => s.lifeTemperature);
  const field = useExplorer((s) => s.lifeField);
  const tick = useExplorer((s) => s.tick);
  const selectedId = useExplorer((s) => s.lifeSelectedId);
  const colors = useMemo(() => new Float32Array(GRID * GRID * 3), []);
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, GRID - 1, GRID - 1);
    g.rotateX(-Math.PI / 2);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [colors]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const core = useRef<THREE.InstancedMesh>(null);
  const line = useRef<THREE.LineSegments>(null);
  const acc = useRef(0);

  useFrame((_, dt) => {
    if (!paused) {
      const speed = Math.min(4, Math.max(0.15, Math.abs(timeScale) / 86400));
      lifeWorld.step(dt * speed, nutrient, mutation, temperature);
      acc.current += dt;
      if (acc.current > 0.12) {
        acc.current = 0;
        if (lifeWorld.selectedId !== useExplorer.getState().lifeSelectedId) {
          useExplorer.setState({ lifeSelectedId: lifeWorld.selectedId });
        }
        useExplorer.getState().pulse();
      }
    }
    paintField(colors, field);
    const attr = geom.getAttribute("color") as THREE.BufferAttribute;
    attr.needsUpdate = true;

    const live = lifeWorld.organisms.filter((o) => o.state !== "dead");
    if (core.current) {
      let i = 0;
      for (const org of live) {
        dummy.position.set(org.position[0], 0.08 + org.nodes[0].radius, org.position[2]);
        const s = 0.16 + org.nodes[0].radius * 1.4;
        dummy.scale.setScalar(s * (org.id === selectedId ? 1.35 : 1));
        dummy.updateMatrix();
        core.current.setMatrixAt(i, dummy.matrix);
        const c = new THREE.Color(hexColor(hueColor(org.genome.colorHue, 0.5, org.health * 0.45 + 0.2)));
        core.current.setColorAt(i, c);
        i++;
      }
      core.current.count = i;
      core.current.instanceMatrix.needsUpdate = true;
      if (core.current.instanceColor) core.current.instanceColor.needsUpdate = true;
    }

    if (line.current) {
      const pos = line.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const col = line.current.geometry.getAttribute("color") as THREE.BufferAttribute;
      let p = 0;
      for (const org of live) {
        const rgb = new THREE.Color(hexColor(hueColor(org.genome.colorHue, 0.45, 0.62)));
        for (const node of org.nodes) {
          if (!node.parentId) continue;
          const parent = org.nodes.find((n) => n.id === node.parentId);
          if (!parent) continue;
          pos.setXYZ(p, org.position[0] + parent.position[0], parent.position[1], org.position[2] + parent.position[2]);
          pos.setXYZ(p + 1, org.position[0] + node.position[0], node.position[1], org.position[2] + node.position[2]);
          col.setXYZ(p, rgb.r, rgb.g, rgb.b);
          col.setXYZ(p + 1, rgb.r, rgb.g, rgb.b);
          p += 2;
        }
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      line.current.geometry.setDrawRange(0, p);
    }
  });

  const selected = lifeWorld.organisms.find((o) => o.id === selectedId);
  void tick;

  return (
    <group>
      <mesh
        geometry={geom}
        onClick={(e) => {
          e.stopPropagation();
          const p = e.point;
          let best: string | null = null;
          let d = 0.55;
          for (const org of lifeWorld.organisms) {
            if (org.state === "dead") continue;
            const dx = org.position[0] - p.x;
            const dz = org.position[2] - p.z;
            const dist = Math.hypot(dx, dz);
            if (dist < d) {
              d = dist;
              best = org.id;
            }
          }
          if (best) {
            lifeWorld.selectedId = best;
            useExplorer.setState({ lifeSelectedId: best });
          }
        }}
      >
        <meshBasicMaterial vertexColors transparent opacity={0.92} />
      </mesh>
      <gridHelper args={[WORLD_SIZE, 18, "#1c2438", "#121826"]} position={[0, 0.01, 0]} />
      <instancedMesh
        ref={core}
        args={[undefined, undefined, 48]}
        onUpdate={(mesh) => {
          if (!mesh.instanceColor) {
            mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(48 * 3), 3);
          }
        }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial roughness={0.45} metalness={0.05} />
      </instancedMesh>
      <lineSegments ref={line}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(2400 * 3), 3]} />
          <bufferAttribute attach="attributes-color" args={[new Float32Array(2400 * 3), 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.85} />
      </lineSegments>
      {selected && selected.state !== "dead" ? (
        <Html position={[selected.position[0], 1.15, selected.position[2]]} center>
          <div className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-amber-50">
            gen {selected.generation} · {selected.nodes.length} nodes
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function paintField(colors: Float32Array, mode: "resource" | "morphogen" | "none") {
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const k = j * GRID + i;
      const o = k * 3;
      if (mode === "none") {
        colors[o] = 0.05;
        colors[o + 1] = 0.06;
        colors[o + 2] = 0.08;
        continue;
      }
      if (mode === "resource") {
        const r = lifeWorld.resource[k];
        colors[o] = 0.05 + r * 0.15;
        colors[o + 1] = 0.08 + r * 0.55;
        colors[o + 2] = 0.07 + r * 0.18;
      } else {
        const a = lifeWorld.morphA[k];
        const b = lifeWorld.morphB[k];
        colors[o] = 0.08 + b * 0.7;
        colors[o + 1] = 0.06 + a * 0.25;
        colors[o + 2] = 0.12 + a * 0.55;
      }
    }
  }
}
