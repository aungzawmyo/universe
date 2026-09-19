"use client";

import { AU } from "@/engine/constants";
import { MAX_CAMERA_DISTANCE_M, MIN_CAMERA_DISTANCE_M, renderUnitMeters, scaleFromDistance } from "@/engine/scale";
import { visualRadiusM } from "@/rendering/visual";
import { simulation } from "@/simulation/engine";
import { useExplorer } from "@/simulation/store";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Vec3 } from "@/engine/vec3";
import { copy } from "@/engine/vec3";

export function CameraRig() {
  const { camera, gl } = useThree();
  const focusId = useExplorer((s) => s.focusId);
  const cameraMode = useExplorer((s) => s.cameraMode);
  const enhancePlanetSize = useExplorer((s) => s.enhancePlanetSize);
  const enhanceStarSize = useExplorer((s) => s.enhanceStarSize);
  const labMode = useExplorer((s) => s.labMode);
  const local = labMode !== "solar-system";
  const spherical = useRef({
    theta: 0.55,
    phi: 1.12,
    logR: Math.log(7.5 * AU),
    localLogR: Math.log(8),
  });
  const targetM = useRef<Vec3>([0, 0, 0]);
  const dragging = useRef<null | { x: number; y: number }>(null);
  const lastScale = useRef(scaleFromDistance(16 * AU));

  useEffect(() => {
    if (local) {
      spherical.current.localLogR = Math.log(labMode === "observable-universe" || labMode === "cosmic-web" ? 9 : 8);
      return;
    }
    const body = simulation.body(focusId);
    if (!body) return;
    const visual = visualRadiusM(body, enhancePlanetSize, enhanceStarSize);
      const desired = Math.min(
      MAX_CAMERA_DISTANCE_M,
      Math.max(MIN_CAMERA_DISTANCE_M, visual * (body.type === "star" ? 18 : 12)),
    );
    const current = Math.exp(spherical.current.logR);
    if (current > desired * 8 || current < desired * 0.05) {
      spherical.current.logR = Math.log(desired);
    }
  }, [focusId, enhancePlanetSize, enhanceStarSize, local, labMode]);

  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 2) return;
      dragging.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.x;
      const dy = e.clientY - dragging.current.y;
      dragging.current = { x: e.clientX, y: e.clientY };
      spherical.current.theta -= dx * 0.005;
      spherical.current.phi = Math.min(Math.PI - 0.05, Math.max(0.08, spherical.current.phi - dy * 0.005));
    };
    const onPointerUp = () => {
      dragging.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const key = local ? "localLogR" : "logR";
      const next = spherical.current[key] + Math.sign(e.deltaY) * Math.min(0.35, Math.abs(e.deltaY) * 0.0018);
      if (local) {
        spherical.current.localLogR = Math.min(Math.log(28), Math.max(Math.log(3.2), next));
      } else {
        spherical.current.logR = Math.min(Math.log(MAX_CAMERA_DISTANCE_M), Math.max(Math.log(MIN_CAMERA_DISTANCE_M), next));
      }
    };
    const onContext = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("contextmenu", onContext);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("contextmenu", onContext);
    };
  }, [gl, local]);

  useFrame((_, dt) => {
    if (local) {
      const dist = Math.exp(spherical.current.localLogR);
      const { theta, phi } = spherical.current;
      camera.position.set(dist * Math.sin(phi) * Math.sin(theta), dist * Math.cos(phi), dist * Math.sin(phi) * Math.cos(theta));
      camera.lookAt(0, 0, 0);
      camera.near = 0.05;
      camera.far = 400;
      camera.updateProjectionMatrix();
      return;
    }
    const body = simulation.body(focusId) ?? simulation.body("sun");
    if (body) {
      const k = cameraMode === "follow" ? Math.min(1, dt * 8) : Math.min(1, dt * 3.5);
      targetM.current[0] += (body.positionM[0] - targetM.current[0]) * k;
      targetM.current[1] += (body.positionM[1] - targetM.current[1]) * k;
      targetM.current[2] += (body.positionM[2] - targetM.current[2]) * k;
    }

    if (cameraMode === "surface" && body) {
      const visual = visualRadiusM(body, enhancePlanetSize, enhanceStarSize);
      spherical.current.logR += (Math.log(visual * 2.4) - spherical.current.logR) * Math.min(1, dt * 2);
    }

    if (cameraMode === "photon" && simulation.photons[0]) {
      copy(simulation.photons[0].positionM, targetM.current);
    }

    const distM = Math.exp(spherical.current.logR);
    const unit = renderUnitMeters(distM);
    const { theta, phi } = spherical.current;
    const x = distM * Math.sin(phi) * Math.sin(theta);
    const y = distM * Math.cos(phi);
    const z = distM * Math.sin(phi) * Math.cos(theta);

    camera.position.set(x / unit, y / unit, z / unit);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.near = 0.00008;
    camera.far = 80_000;
    camera.updateProjectionMatrix();

    const scale = scaleFromDistance(distM);
    if (scale !== lastScale.current) {
      lastScale.current = scale;
      useExplorer.setState({ cameraDistanceM: distM });
    } else if (Math.random() < 0.05) {
      useExplorer.setState({ cameraDistanceM: distM });
    }
  });

  return (
    <group>
      <ambientLight intensity={0.035} />
    </group>
  );
}

export function useFocusOrigin(): Vec3 {
  const focusId = useExplorer((s) => s.focusId);
  const body = simulation.body(focusId);
  return body?.positionM ?? [0, 0, 0];
}
