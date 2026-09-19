"use client";

import { schwarzschildRadius } from "@/engine/kepler";
import { renderUnitMeters, scaleFromDistance } from "@/engine/scale";
import type { SimBody } from "@/engine/types";
import { toRender, visualRadiusM } from "@/rendering/visual";
import { bodyTexture } from "@/rendering/textures";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Atmosphere({ color, scale }: { color: string; scale: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        uniforms: { color: { value: new THREE.Color(color) } },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float f = pow(1.0 - abs(dot(vNormal, vView)), 2.6);
            gl_FragColor = vec4(color, f * 0.9);
          }
        `,
      }),
    [color],
  );
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 48, 48]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

export function BodyMesh({ body }: { body: SimBody }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const selectedId = useExplorer((s) => s.selectedId);
  const focusId = useExplorer((s) => s.focusId);
  const enhancePlanetSize = useExplorer((s) => s.enhancePlanetSize);
  const enhanceStarSize = useExplorer((s) => s.enhanceStarSize);
  const atmospheres = useExplorer((s) => s.layers.atmospheres);
  const cameraDistanceM = useExplorer((s) => s.cameraDistanceM);
  const select = useExplorer((s) => s.select);
  const focus = useExplorer((s) => s.focus);

  const texture = useMemo(() => bodyTexture(body.id), [body.id]);
  const selected = selectedId === body.id;

  useFrame(() => {
    const live = simulation.body(body.id);
    if (!live || !group.current) return;
    const origin = simulation.body(focusId)?.positionM ?? [0, 0, 0];
    const unit = renderUnitMeters(cameraDistanceM);
    const [x, y, z] = toRender(live.positionM, origin, unit);
    group.current.position.set(x, y, z);
    const radiusM = visualRadiusM(live, enhancePlanetSize, enhanceStarSize);
    const r = radiusM / unit;
    group.current.scale.setScalar(Math.max(r, 1e-6));
    if (spin.current) {
      spin.current.rotation.y = live.rotationRad;
      spin.current.rotation.z = (live.axialTiltDeg * Math.PI) / 180;
    }
    const scale = scaleFromDistance(cameraDistanceM);
    const hide =
      (scale === "stellar" || scale === "galactic") && live.type !== "star" && live.type !== "black-hole";
    group.current.visible = !hide;
  });

  if (body.type === "star") {
    return (
      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          select(body.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          focus(body.id);
        }}
      >
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial map={texture} color={body.color} />
        </mesh>
        <mesh scale={1.35}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color={body.emissive ?? body.color} transparent opacity={0.18} />
        </mesh>
        <mesh scale={2.4}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#ffb25a" transparent opacity={0.06} />
        </mesh>
        <pointLight color="#ffd7a0" intensity={8} distance={120} decay={1.6} />
        {selected && <SelectionRing />}
      </group>
    );
  }

  if (body.type === "black-hole") {
    const rs = schwarzschildRadius(body.massKg);
    return (
      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          select(body.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          focus(body.id);
        }}
      >
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0.2, 0]}>
          <ringGeometry args={[1.6, 4.2, 80]} />
          <meshBasicMaterial color="#ffb15a" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0.2, 0]}>
          <ringGeometry args={[1.45, 1.55, 64]} />
          <meshBasicMaterial color="#8cf4ff" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        {selected && <SelectionRing />}
        <group visible={false} userData={{ schwarzschild: rs }} />
      </group>
    );
  }

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        select(body.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        focus(body.id);
      }}
    >
      <group ref={spin}>
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial
            map={texture ?? undefined}
            color={texture ? "#ffffff" : body.color}
            roughness={0.72}
            metalness={0.04}
          />
        </mesh>
        {body.hasRings && (
          <mesh rotation={[Math.PI / 2.15, 0, 0]}>
            <ringGeometry args={[body.ringInner ?? 1.2, body.ringOuter ?? 2.2, 96]} />
            <meshStandardMaterial
              color="#d8c79a"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
              roughness={0.6}
            />
          </mesh>
        )}
      </group>
      {atmospheres && body.atmosphereColor && <Atmosphere color={body.atmosphereColor} scale={1.08} />}
      {selected && <SelectionRing />}
    </group>
  );
}

function SelectionRing() {
  return (
    <mesh>
      <ringGeometry args={[1.35, 1.42, 64]} />
      <meshBasicMaterial color="#f4e3b0" transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

