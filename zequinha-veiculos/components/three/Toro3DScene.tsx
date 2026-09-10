"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { ToroTruck3D } from "./ToroTruck3D";

/**
 * Canvas WebGL isolado (client-only, sem SSR) contendo a picape 3D
 * estilizada, câmera e iluminação de estúdio (3 pontos), sem depender de
 * nenhum asset/textura externa — tudo é geometria e luz procedural.
 *
 * Expõe o grupo 3D do veículo via `onReady`, para que o componente pai
 * (ToroHero) controle a entrada/freada com a mesma timeline GSAP usada
 * para os elementos DOM da cena (partículas, linhas de velocidade etc.).
 *
 * Em telas pequenas (celular), reduz DPR e resolução de sombra — WebGL com
 * sombra em alta resolução é o que mais aquece/trava aparelhos simples.
 */
export function Toro3DScene({
  onReady,
}: {
  onReady?: (group: THREE.Group) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return (
    <Canvas
      shadows
      dpr={isMobile ? 1 : [1, 1.75]}
      gl={{ antialias: !isMobile, alpha: true }}
      camera={{ position: [6.2, 2.6, 8.8], fov: 24 }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.85, 0)}
    >
      <ambientLight intensity={0.35} />
      {/* luz principal (key) */}
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize={isMobile ? [512, 512] : [1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      {/* luz de preenchimento */}
      <directionalLight position={[-4, 3, 3]} intensity={0.35} color="#dfeffd" />
      {/* luz de contorno turquesa (identidade da marca) */}
      <pointLight position={[-5, 2.5, -4]} intensity={5} color="#22c7b5" distance={14} />
      {!isMobile && (
        <pointLight position={[3, 1.2, -5]} intensity={2.5} color="#4dd8c9" distance={12} />
      )}

      <ToroTruck3D groupRef={groupRef} onReady={onReady} />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.65}
        scale={9}
        blur={2.2}
        far={3}
        resolution={isMobile ? 256 : 512}
        color="#000000"
      />
    </Canvas>
  );
}
