"use client";

import { photonSphereKm, schwarzschildKm, stellarSnapshot, timeDilation } from "@/lab/models";
import { useExplorer } from "@/simulation/store";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function StellarScene() {
  const mass = useExplorer((s) => s.starMassSolar);
  const age = useExplorer((s) => s.starAgeMyr);
  const running = useExplorer((s) => s.starRunning);
  const snap = stellarSnapshot(mass, age);
  const group = useRef<THREE.Group>(null);

  const acc = useRef(0);
  useFrame((_, dt) => {
    if (running) {
      acc.current += dt;
      if (acc.current > 0.08) {
        const step = acc.current * (mass >= 8 ? 80 : 400);
        acc.current = 0;
        useExplorer.setState({ starAgeMyr: age + step });
      }
    }
    if (group.current) group.current.rotation.y += dt * 0.15;
  });

  const r = Math.max(0.25, Math.min(3.8, Math.log10(snap.radiusSolar + 1) * 1.3));
  return (
    <group>
      {snap.stage === "gas-cloud" || snap.stage === "planetary-nebula" ? (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cloud(1800, snap.stage === "planetary-nebula" ? 3.2 : 2.2), 3]} />
          </bufferGeometry>
          <pointsMaterial color={snap.color} size={0.04} transparent opacity={0.55} />
        </points>
      ) : null}
      <group ref={group}>
        {snap.stage !== "black-hole" && (
          <mesh>
            <sphereGeometry args={[r, 48, 48]} />
            <meshBasicMaterial color={snap.color} />
          </mesh>
        )}
        {snap.stage === "black-hole" && (
          <>
            <mesh>
              <sphereGeometry args={[0.45, 32, 32]} />
              <meshBasicMaterial color="#000" />
            </mesh>
            <mesh rotation={[1.2, 0.2, 0]}>
              <ringGeometry args={[0.7, 2.1, 64]} />
              <meshBasicMaterial color="#ffb15a" side={THREE.DoubleSide} transparent opacity={0.8} />
            </mesh>
          </>
        )}
        {snap.stage === "supernova" && (
          <mesh>
            <sphereGeometry args={[r * 1.8, 24, 24]} />
            <meshBasicMaterial color="#fff4c2" transparent opacity={0.25} />
          </mesh>
        )}
      </group>
      <Html position={[0, r + 1.1, 0]} center>
        <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] text-amber-50">{snap.label}</div>
      </Html>
    </group>
  );
}

export function BlackHoleScene() {
  const mass = useExplorer((s) => s.bhMassSolar);
  const spin = useExplorer((s) => s.bhSpin);
  const inc = useExplorer((s) => s.bhInclination);
  const observer = useExplorer((s) => s.bhObserverKm);
  const layers = useExplorer((s) => s.layers);
  const disk = useRef<THREE.Group>(null);
  const rs = schwarzschildKm(mass);
  const photon = photonSphereKm(mass);
  const dilation = timeDilation(mass, observer);

  useFrame((_, dt) => {
    if (disk.current) disk.current.rotation.z += dt * (0.25 + spin);
  });

  const tilt = (inc * Math.PI) / 180;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.55, 48, 48]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      {layers.orbits !== false && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.86, 64]} />
          <meshBasicMaterial color="#8cf4ff" side={THREE.DoubleSide} />
        </mesh>
      )}
      <group ref={disk} rotation={[tilt, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.05, 3.4, 80]} />
          <meshBasicMaterial color="#ffb15a" transparent opacity={0.78} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.8, 2.05, 64]} />
          <meshBasicMaterial color="#fff1c8" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {layers.lensing && <LensingShell />}
      {layers.geodesics && <GeodesicRays />}
      <Html position={[0, 2.6, 0]} center>
        <div className="rounded-xl bg-black/55 px-3 py-2 text-center text-[11px] text-amber-50">
          rₛ = {rs.toFixed(1)} km · photon sphere {photon.toFixed(1)} km
          <div className="text-white/50">Time dilation at observer: {dilation.toFixed(3)}</div>
        </div>
      </Html>
    </group>
  );
}

function LensingShell() {
  const pts = useMemo(() => {
    const a = new Float32Array(2400);
    for (let i = 0; i < 800; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      a[i * 3] = 6.5 * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = 6.5 * Math.sin(ph) * Math.sin(th);
      a[i * 3 + 2] = 6.5 * Math.cos(ph);
    }
    return a;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#dfefff" size={0.03} />
    </points>
  );
}

function GeodesicRays() {
  const paths = useMemo(() => {
    return Array.from({ length: 8 }, (_, k) => {
      const y = -1.6 + k * 0.45;
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = -6 + t * 12;
        const bend = (1.2 * y) / (1 + x * x * 0.35);
        pts.push([x, y * 0.15 + bend, 0]);
      }
      return pts;
    });
  }, []);
  return (
    <>
      {paths.map((p, i) => (
        <Line key={i} points={p} color="#9ad7ff" transparent opacity={0.55} />
      ))}
    </>
  );
}

export function NeutronStarScene() {
  const period = useExplorer((s) => s.nsPeriodS);
  const field = useExplorer((s) => s.nsFieldT);
  const wavelength = useExplorer((s) => s.wavelength);
  const star = useRef<THREE.Group>(null);
  const pulse = useRef(0);

  useFrame((_, dt) => {
    const omega = (Math.PI * 2) / Math.max(0.005, period);
    if (star.current) star.current.rotation.y += omega * dt * 0.15;
    pulse.current = Math.pow(Math.max(0, Math.cos(star.current?.rotation.y ?? 0)), 8);
  });

  const beamColor = wavelength === "radio" ? "#5cffb4" : wavelength === "xray" ? "#9ad8ff" : "#7ecbff";
  return (
    <group ref={star}>
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#cfe6ff" emissive="#6aa7ff" emissiveIntensity={0.6} />
      </mesh>
      <mesh rotation={[0.6, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.18, 4.2, 10]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.35 + pulse.current * 0.5} />
      </mesh>
      <mesh rotation={[0.6, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.18, 4.2, 10]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.25} />
      </mesh>
      <FieldLines strength={field} />
      <Html position={[0, 2.2, 0]} center>
        <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] text-amber-50">
          P = {period.toFixed(3)} s · B ≈ {field.toExponential(1)} T
          {pulse.current > 0.55 ? " · PULSE" : ""}
        </div>
      </Html>
    </group>
  );
}

function FieldLines({ strength }: { strength: number }) {
  const lines = useMemo(() => {
    const n = 10;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const pts: [number, number, number][] = [];
      for (let t = 0; t <= 24; t++) {
        const u = t / 24;
        const r = 0.6 + u * 2.2;
        pts.push([r * Math.cos(a) * Math.sin(u * Math.PI), 2.2 * Math.cos(u * Math.PI), r * Math.sin(a) * Math.sin(u * Math.PI)]);
      }
      return pts;
    });
  }, []);
  const opacity = Math.min(0.7, 0.2 + Math.log10(strength) / 20);
  return (
    <>
      {lines.map((p, i) => (
        <Line key={i} points={p} color="#7dffb2" transparent opacity={opacity} />
      ))}
    </>
  );
}

export function NebulaScene() {
  const density = useExplorer((s) => s.nebulaDensity);
  const collapsed = useExplorer((s) => s.nebulaCollapsed);
  const pts = useMemo(() => cloud(3200, 3.4), []);
  const group = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.03;
    const s = collapsed ? 0.35 + Math.sin(Date.now() * 0.002) * 0.02 : 0.8 + density * 1.4;
    group.current.scale.setScalar(s);
  });

  return (
    <group>
      <points ref={group}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pts, 3]} />
        </bufferGeometry>
        <pointsMaterial color={collapsed ? "#ffb56b" : "#7ecbff"} size={0.035} transparent opacity={0.45 + density * 0.35} />
      </points>
      {collapsed && (
        <mesh>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshBasicMaterial color="#ffe6b0" />
        </mesh>
      )}
      <Html position={[0, 2.6, 0]} center>
        <div className="rounded-full bg-black/55 px-3 py-1 text-[11px] text-amber-50">
          {collapsed ? "Protostar formed" : `Molecular cloud · density ${(density * 100).toFixed(0)}%`}
        </div>
      </Html>
    </group>
  );
}

export function LightScene() {
  const z = useExplorer((s) => s.redshiftZ);
  const lensMass = useExplorer((s) => s.lensMass);
  const wavelength = useExplorer((s) => s.wavelength);
  const layers = useExplorer((s) => s.layers);
  const path = useMemo(() => {
    const bend = Math.min(1.6, Math.log10(lensMass) / 8);
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const x = -6 + t * 12;
      const y = 1.4 * (1 - t) + bend * Math.sin(t * Math.PI);
      pts.push([x, y, 0]);
    }
    return pts;
  }, [lensMass]);

  const color =
    wavelength === "ir" ? "#ff8a4a" : wavelength === "radio" ? "#5cffb4" : wavelength === "xray" ? "#9ad8ff" : "#fff4c2";

  return (
    <group>
      <mesh position={[-6, 0, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial color="#ffe6b0" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color="#6aa7ff" transparent opacity={0.35} />
      </mesh>
      <mesh position={[6, -0.2, 1.2]}>
        <boxGeometry args={[0.3, 0.3, 0.5]} />
        <meshBasicMaterial color="#dfefff" />
      </mesh>
      <Line points={path} color={color} />
      {layers.redshift && (
        <Line
          points={path.map(([x, y, zed]) => [x, y - 0.35, zed] as [number, number, number])}
          color="#ff8a4a"
        />
      )}
      <Html position={[0, 2.4, 0]} center>
        <div className="rounded-xl bg-black/55 px-3 py-2 text-center text-[11px] text-amber-50">
          Gravitational lensing · 1+z = {(1 + z).toFixed(2)}
          <div className="text-white/45">Null geodesic, not a Newtonian force</div>
        </div>
      </Html>
    </group>
  );
}

export function SpacetimeScene() {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(16, 16, 60, 60), []);
  const layers = useExplorer((s) => s.layers);

  useFrame(() => {
    if (!mesh.current) return;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.hypot(x, y) + 0.35;
      pos.setZ(i, -1.8 / r);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <group>
      <mesh ref={mesh} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <meshStandardMaterial color="#6aa7ff" wireframe transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial color="#ffce6b" />
      </mesh>
      {layers.lightCones && <LightCone />}
      {layers.geodesics && <GeodesicRays />}
      <Html position={[0, 2.3, 0]} center>
        <div className="rounded-xl bg-black/55 px-3 py-2 text-[11px] text-amber-50">
          Rubber-sheet analogy — not literal 3D spacetime
        </div>
      </Html>
    </group>
  );
}

function LightCone() {
  return (
    <group position={[2.2, 0.6, 0]}>
      <mesh rotation={[0, 0, 0]}>
        <coneGeometry args={[0.7, 1.4, 20, 1, true]} />
        <meshBasicMaterial color="#9ad7ff" wireframe transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[Math.PI, 0, 0]} position={[0, -1.4, 0]}>
        <coneGeometry args={[0.7, 1.4, 20, 1, true]} />
        <meshBasicMaterial color="#ffb56b" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function cloud(count: number, radius: number) {
  const a = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.pow(Math.random(), 0.55);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    a[i * 3] = r * Math.sin(ph) * Math.cos(th);
    a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.55;
    a[i * 3 + 2] = r * Math.cos(ph);
  }
  return a;
}
