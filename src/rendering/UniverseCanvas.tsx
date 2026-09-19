"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Scene } from "./Scene";
import { useExplorer } from "@/simulation/store";

export function UniverseCanvas() {
  return (
    <Canvas
      camera={{ fov: 48, near: 0.0001, far: 80000, position: [0, 4, 16] }}
      dpr={[1, 1.75]}
      className="h-full w-full"
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      onPointerMissed={() => useExplorer.getState().select(null)}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
