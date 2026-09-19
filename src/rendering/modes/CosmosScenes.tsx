"use client";

import { GALAXIES, interpolateEpoch, LOOKBACK_SHELLS } from "@/lab/models";
import { useExplorer } from "@/simulation/store";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function MilkyWayScene() {
  const { positions, colors } = useMemo(() => makeGalaxy(18000, 0), []);
  const points = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (points.current) points.current.rotation.y += dt * 0.02;
  });
  return (
    <group>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={0.035} sizeAttenuation transparent opacity={0.9} />
      </points>
      <Html position={[0, 0, 0]} center>
        <div className="rounded-full bg-black/50 px-2 py-1 text-[10px] text-amber-100">Sgr A*</div>
      </Html>
      <Html position={[2.6, 0.2, 0]} center>
        <div className="text-[10px] text-white/50">Orion Arm · Sun</div>
      </Html>
    </group>
  );
}

export function GalaxiesScene() {
  return (
    <group>
      {GALAXIES.map((g, i) => {
        const a = (i / GALAXIES.length) * Math.PI * 2;
        const r = 1.2 + (i % 3) * 1.6;
        return (
          <group key={g.id} position={[Math.cos(a) * r, (i % 2) * 0.4, Math.sin(a) * r]}>
            <GalaxySprite type={g.type} color={g.color} />
            <Html center distanceFactor={10}>
              <div className="whitespace-nowrap text-[10px] text-amber-50/80">{g.name}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function LocalGroupScene() {
  const t = useExplorer((s) => s.andromedaT);
  const paused = useExplorer((s) => s.paused);
  const acc = useRef(0);
  useFrame((_, dt) => {
    if (paused) return;
    acc.current += dt;
    if (acc.current > 0.08) {
      const step = acc.current * 0.03;
      acc.current = 0;
      useExplorer.setState({ andromedaT: Math.min(1, t + step) });
    }
  });
  const andX = 4.6 - t * 3.4;
  return (
    <group>
      <GalaxySprite type="Barred Spiral" color="#ffe6b0" />
      <Html position={[0, 1.1, 0]} center>
        <div className="text-[10px] text-amber-50">Milky Way</div>
      </Html>
      <group position={[andX, 0.3, -0.4]}>
        <GalaxySprite type="Spiral" color="#cfe6ff" />
        <Html position={[0, 1.1, 0]} center>
          <div className="text-[10px] text-sky-100">Andromeda</div>
        </Html>
      </group>
      <group position={[1.4, -0.5, 1.8]}>
        <GalaxySprite type="Spiral" color="#ffd9a0" scale={0.45} />
        <Html center>
          <div className="text-[10px] text-white/50">Triangulum</div>
        </Html>
      </group>
      <group position={[0.7, -0.2, 0.55]}>
        <GalaxySprite type="Irregular" color="#ffb56b" scale={0.28} />
      </group>
      <Html position={[0, 2.4, 0]} center>
        <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] text-amber-50">
          MW–Andromeda encounter · t = {(t * 4.5).toFixed(2)} Gyr
        </div>
      </Html>
    </group>
  );
}

export function CosmicWebScene() {
  const nodes = useMemo(() => {
    return Array.from({ length: 18 }, () => [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 10,
    ] as [number, number, number]);
  }, []);
  const edges = useMemo(() => {
    const e: [[number, number, number], [number, number, number]][] = [];
    for (let i = 0; i < nodes.length; i++) {
      const others = nodes
        .map((n, j) => ({ n, j, d: Math.hypot(n[0] - nodes[i][0], n[1] - nodes[i][1], n[2] - nodes[i][2]) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const o of others) e.push([nodes[i], o.n]);
    }
    return e;
  }, [nodes]);

  return (
    <group>
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#f0d48a" />
        </mesh>
      ))}
      {edges.map((seg, i) => (
        <Line key={i} points={seg} color="#6aa7ff" transparent opacity={0.45} />
      ))}
      <Html position={[0, 2.6, 0]} center>
        <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] text-amber-50">
          Clusters · filaments · voids
        </div>
      </Html>
    </group>
  );
}

export function ObservableUniverseScene() {
  const lookback = useExplorer((s) => s.layers.lookback);
  const cmb = useExplorer((s) => s.layers.cmb);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#7ecbff" />
      </mesh>
      {LOOKBACK_SHELLS.map((shell, i) => (
        <mesh key={shell.name}>
          <sphereGeometry args={[1.1 + i * 0.85, 32, 16]} />
          <meshBasicMaterial color={shell.color} transparent opacity={0.06 + i * 0.02} wireframe={lookback} side={THREE.BackSide} />
        </mesh>
      ))}
      {cmb && (
        <mesh>
          <sphereGeometry args={[4.6, 32, 24]} />
          <meshBasicMaterial color="#ff8a4a" transparent opacity={0.12} side={THREE.BackSide} />
        </mesh>
      )}
      <Html position={[0, 3.2, 0]} center>
        <div className="rounded-xl bg-black/55 px-3 py-2 text-center text-[11px] text-amber-50">
          Observer-centered · distance = lookback time
          <div className="text-white/40">Not a sphere seen from outside</div>
        </div>
      </Html>
    </group>
  );
}

export function BigBangScene() {
  const t = useExplorer((s) => s.cosmologyT);
  const epoch = interpolateEpoch(t);
  const pts = useMemo(() => {
    const a = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      a[i * 3] = (Math.random() - 0.5) * 2;
      a[i * 3 + 1] = (Math.random() - 0.5) * 2;
      a[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return a;
  }, []);
  const points = useRef<THREE.Points>(null);
  useFrame(() => {
    if (!points.current) return;
    const s = 0.4 + epoch.scaleFactor * 4.2;
    points.current.scale.setScalar(s);
  });
  const temp = epoch.temperatureK;
  const color = temp > 1e6 ? "#fff4c2" : temp > 100 ? "#ff8a4a" : "#7ecbff";
  return (
    <group>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pts, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.04} />
      </points>
      <Html position={[0, 2.8, 0]} center>
        <div className="rounded-xl bg-black/55 px-3 py-2 text-center text-[11px] text-amber-50">
          {epoch.name} · {epoch.timeLabel}
          <div className="text-white/45">Expansion of space, not an explosion in space</div>
        </div>
      </Html>
    </group>
  );
}

function GalaxySprite({ type, color, scale = 1 }: { type: string; color: string; scale?: number }) {
  const { positions, colors } = useMemo(() => makeGalaxy(type.includes("Elliptical") ? 1800 : 2800, type.includes("Irregular") ? 1 : 0, color), [type, color]);
  return (
    <points scale={scale}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial vertexColors size={0.03} transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

function makeGalaxy(count: number, irregular = 0, hex = "#ffe6b0") {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color(hex);
  for (let i = 0; i < count; i++) {
    const arm = i % 4;
    const r = Math.pow(Math.random(), 0.65) * (irregular ? 1.4 : 3.2);
    const spiral = r * 0.85 + arm * (Math.PI / 2);
    const theta = spiral + (Math.random() - 0.5) * (0.35 + irregular);
    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = (Math.random() - 0.5) * (0.18 + r * 0.02);
    positions[i * 3 + 2] = r * Math.sin(theta) * (irregular ? 0.7 : 1);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g * (r < 0.5 ? 0.8 : 1);
    colors[i * 3 + 2] = c.b;
  }
  return { positions, colors };
}
