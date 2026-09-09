"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Picape estilizada em baixo poli, construída inteiramente com geometrias
 * procedurais do Three.js (nenhum asset externo) — proporções inspiradas na
 * Fiat Toro, acabamento metálico prata/grafite com detalhes turquesa da
 * marca. Não é uma réplica licenciada da Toro, é uma representação 3D
 * estilizada "tipo configurador automotivo premium".
 */
export function ToroTruck3D({
  groupRef,
  onReady,
}: {
  groupRef: React.RefObject<THREE.Group>;
  onReady?: (group: THREE.Group) => void;
}) {
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);

  // Roda dentro da árvore do Canvas — o ref do grupo já está anexado
  // quando este efeito executa (ao contrário de um efeito no componente
  // pai fora do Canvas, que pode rodar antes do R3F montar a cena).
  useEffect(() => {
    if (groupRef.current) onReady?.(groupRef.current);
  }, [groupRef, onReady]);

  useFrame((_, delta) => {
    wheelRefs.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x -= delta * 3.2;
    });
  });

  const bodyMat = (
    <meshStandardMaterial color="#9aa1ad" metalness={0.78} roughness={0.28} />
  );
  const darkMat = (
    <meshStandardMaterial color="#15161b" metalness={0.4} roughness={0.55} />
  );
  const glassMat = (
    <meshStandardMaterial
      color="#0a1210"
      metalness={0.15}
      roughness={0.45}
      transparent
      opacity={0.6}
    />
  );
  const rimMat = (
    <meshStandardMaterial color="#5b6270" metalness={0.9} roughness={0.22} />
  );
  const tireMat = <meshStandardMaterial color="#141519" roughness={0.9} />;

  function Wheel({ x, z, index }: { x: number; z: number; index: number }) {
    return (
      <group
        position={[x, 0.4, z]}
        ref={(el) => {
          wheelRefs.current[index] = el;
        }}
      >
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.32, 24]} />
          {tireMat}
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.17 : -0.17, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.04, 20]} />
          {rimMat}
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.19 : -0.19, 0, 0]}>
          <torusGeometry args={[0.24, 0.012, 8, 24]} />
          <meshStandardMaterial
            color="#22c7b5"
            emissive="#22c7b5"
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {/* corpo inferior / carroceria */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.7, 4.4]} />
        {bodyMat}
      </mesh>

      {/* friso turquesa (beltline) */}
      <mesh position={[0.955, 0.95, 0.2]}>
        <boxGeometry args={[0.01, 0.04, 3.6]} />
        <meshStandardMaterial
          color="#22c7b5"
          emissive="#22c7b5"
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh position={[-0.955, 0.95, 0.2]}>
        <boxGeometry args={[0.01, 0.04, 3.6]} />
        <meshStandardMaterial
          color="#22c7b5"
          emissive="#22c7b5"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* capô */}
      <mesh position={[0, 1.12, 1.55]} castShadow>
        <boxGeometry args={[1.82, 0.32, 1.3]} />
        {bodyMat}
      </mesh>

      {/* cabine */}
      <mesh position={[0, 1.42, 0.55]} castShadow>
        <boxGeometry args={[1.74, 0.62, 1.85]} />
        {bodyMat}
      </mesh>

      {/* teto (levemente mais estreito) */}
      <mesh position={[0, 1.76, 0.5]} castShadow>
        <boxGeometry args={[1.62, 0.08, 1.7]} />
        {darkMat}
      </mesh>

      {/* para-brisa */}
      <mesh position={[0, 1.52, 1.42]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[1.6, 0.55, 0.05]} />
        {glassMat}
      </mesh>

      {/* vidro traseiro da cabine */}
      <mesh position={[0, 1.52, -0.42]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[1.6, 0.5, 0.05]} />
        {glassMat}
      </mesh>

      {/* vidros laterais */}
      <mesh position={[0.865, 1.5, 0.5]}>
        <boxGeometry args={[0.02, 0.4, 1.5]} />
        {glassMat}
      </mesh>
      <mesh position={[-0.865, 1.5, 0.5]}>
        <boxGeometry args={[0.02, 0.4, 1.5]} />
        {glassMat}
      </mesh>

      {/* caçamba */}
      <mesh position={[0, 0.95, -1.55]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.5, 1.5]} />
        {bodyMat}
      </mesh>
      <mesh position={[0, 1.05, -1.55]}>
        <boxGeometry args={[1.6, 0.05, 1.35]} />
        {darkMat}
      </mesh>

      {/* grade dianteira */}
      <mesh position={[0, 0.98, 2.21]}>
        <boxGeometry args={[1.5, 0.32, 0.06]} />
        {darkMat}
      </mesh>
      <mesh position={[0, 1.08, 2.24]}>
        <boxGeometry args={[1.4, 0.03, 0.02]} />
        <meshStandardMaterial
          color="#22c7b5"
          emissive="#22c7b5"
          emissiveIntensity={1}
        />
      </mesh>

      {/* faróis */}
      <mesh position={[0.78, 1.08, 2.2]}>
        <boxGeometry args={[0.3, 0.14, 0.06]} />
        <meshStandardMaterial
          color="#eafffb"
          emissive="#eafffb"
          emissiveIntensity={2.2}
        />
      </mesh>
      <mesh position={[-0.78, 1.08, 2.2]}>
        <boxGeometry args={[0.3, 0.14, 0.06]} />
        <meshStandardMaterial
          color="#eafffb"
          emissive="#eafffb"
          emissiveIntensity={2.2}
        />
      </mesh>

      {/* para-choque dianteiro */}
      <mesh position={[0, 0.72, 2.2]}>
        <boxGeometry args={[1.86, 0.22, 0.18]} />
        {darkMat}
      </mesh>

      {/* lanternas traseiras */}
      <mesh position={[0.86, 0.95, -2.28]}>
        <boxGeometry args={[0.14, 0.35, 0.05]} />
        <meshStandardMaterial
          color="#22c7b5"
          emissive="#22c7b5"
          emissiveIntensity={1.6}
        />
      </mesh>
      <mesh position={[-0.86, 0.95, -2.28]}>
        <boxGeometry args={[0.14, 0.35, 0.05]} />
        <meshStandardMaterial
          color="#22c7b5"
          emissive="#22c7b5"
          emissiveIntensity={1.6}
        />
      </mesh>

      {/* para-choque traseiro */}
      <mesh position={[0, 0.68, -2.28]}>
        <boxGeometry args={[1.86, 0.2, 0.15]} />
        {darkMat}
      </mesh>

      {/* retrovisores */}
      <mesh position={[1.0, 1.42, 1.15]} castShadow>
        <boxGeometry args={[0.14, 0.12, 0.1]} />
        {darkMat}
      </mesh>
      <mesh position={[-1.0, 1.42, 1.15]} castShadow>
        <boxGeometry args={[0.14, 0.12, 0.1]} />
        {darkMat}
      </mesh>

      {/* rack de teto */}
      <mesh position={[0.55, 1.82, 0.5]}>
        <boxGeometry args={[0.05, 0.05, 1.5]} />
        {darkMat}
      </mesh>
      <mesh position={[-0.55, 1.82, 0.5]}>
        <boxGeometry args={[0.05, 0.05, 1.5]} />
        {darkMat}
      </mesh>

      {/* rodas */}
      <Wheel x={0.98} z={1.45} index={0} />
      <Wheel x={-0.98} z={1.45} index={1} />
      <Wheel x={0.98} z={-1.35} index={2} />
      <Wheel x={-0.98} z={-1.35} index={3} />
    </group>
  );
}
