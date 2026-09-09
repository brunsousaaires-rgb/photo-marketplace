"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import type * as THREE from "three";

const Toro3DScene = dynamic(
  () => import("../three/Toro3DScene").then((m) => m.Toro3DScene),
  { ssr: false }
);

const PARTICLE_COUNT_DESKTOP = 22;
const STREAK_COUNT = 6;

/**
 * Cena cinematográfica de abertura: uma picape 3D estilizada (Three.js,
 * geometria procedural — não é uma foto nem uma réplica licenciada da Fiat
 * Toro) entra em alta velocidade, freia bruscamente e para no centro da
 * tela, com profundidade, luz e sombra reais de uma cena WebGL.
 *
 * Dispara `onSettled` quando a sequência termina, para o texto do
 * HeroExperience entrar em sincronia.
 */
export function ToroHero({ onSettled }: { onSettled?: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const streaksRef = useRef<HTMLDivElement>(null);
  const truckGroupRef = useRef<THREE.Group | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const handleReady = useCallback((group: THREE.Group) => {
    truckGroupRef.current = group;
    setCanvasReady(true);
  }, []);

  useEffect(() => {
    if (!canvasReady) return;
    const group = truckGroupRef.current;
    const scene = sceneRef.current;
    const glow = glowRef.current;
    const grid = gridRef.current;
    if (!group || !scene || !glow || !grid) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.innerWidth < 768;
    const speed = isMobile ? 0.65 : 1;

    const particles = particlesRef.current?.children ?? [];
    const streaks = streaksRef.current?.children ?? [];

    if (reduceMotion) {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0.5, 0);
      group.scale.setScalar(1);
      gsap.set(grid, { opacity: 0.4 });
      gsap.set(glow, { opacity: 0.5 });
      onSettledRef.current?.();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => onSettledRef.current?.() });

      group.position.set(isMobile ? -9 : -13, -0.1, -0.6);
      group.rotation.set(0.02, 0.85, -0.08);
      group.scale.setScalar(0.86);
      gsap.set(glow, { opacity: 0, scale: 0.6 });
      gsap.set(grid, { opacity: 0 });
      gsap.set(particles, { opacity: 0 });
      gsap.set(streaks, { opacity: 0, scaleX: 0.3 });

      tl.to(grid, { opacity: 0.35, duration: 0.9 * speed, ease: "power1.out" }, 0);
      tl.to(
        glow,
        { opacity: 0.35, scale: 0.8, duration: 0.4 * speed, repeat: 1, yoyo: true, ease: "power1.inOut" },
        0.15
      );

      tl.to(
        streaks,
        { opacity: 0.8, scaleX: 1, duration: 0.3 * speed, stagger: 0.02, ease: "power2.out" },
        0.55 * speed
      );
      tl.to(
        group.position,
        { x: 0.4, z: 0, duration: 0.6 * speed, ease: "power4.in" },
        0.62 * speed
      );
      tl.to(
        group.rotation,
        { y: 0.55, x: 0, z: 0, duration: 0.6 * speed, ease: "power4.in" },
        0.62 * speed
      );
      tl.to(
        group.scale,
        { x: 1.02, y: 1.02, z: 1.02, duration: 0.6 * speed, ease: "power4.in" },
        0.62 * speed
      );
      tl.to(glow, { opacity: 1, scale: 1.05, duration: 0.3 * speed }, "-=0.4");
      tl.to(streaks, { opacity: 0, duration: 0.25 * speed, stagger: 0.015 }, "-=0.15");

      tl.to(
        particles,
        { opacity: 1, duration: 0.15, stagger: { each: 0.01, from: "start" } },
        "-=0.45"
      );
      tl.to(
        particles,
        {
          x: (i) => gsap.utils.random(-70, -190),
          y: (i) => gsap.utils.random(-10, 10),
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.007,
        },
        "-=0.35"
      );

      // freada: mergulho de dianteira (pitch) + achatamento + shake de câmera
      tl.to(
        group.position,
        { x: 0, duration: 0.2 * speed, ease: "power2.out" },
        "-=0.1"
      );
      tl.to(
        group.rotation,
        { x: -0.09, y: 0.42, duration: 0.16 * speed, ease: "power2.out" },
        "<"
      );
      tl.to(
        group.scale,
        { x: 1.06, y: 0.93, z: 1.04, duration: 0.14, ease: "power2.out" },
        "<"
      );
      tl.to(
        scene,
        { x: -7, duration: 0.045, repeat: 7, yoyo: true, ease: "power1.inOut" },
        "<"
      );

      // assentamento elástico
      tl.to(group.rotation, { x: 0, y: 0.32, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      tl.to(
        group.scale,
        { x: 1, y: 1, z: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" },
        "<"
      );
      tl.to(glow, { opacity: 0.7, scale: 1, duration: 0.6 }, "<");
      tl.to(grid, { opacity: 0.5, duration: 0.6 }, "<");

      // leve giro contínuo (showcase) enquanto o texto entra
      tl.to(group.rotation, { y: 0.18, duration: 1.3, ease: "power1.out" }, "-=0.1");
    }, sceneRef);

    return () => ctx.revert();
  }, [canvasReady]);

  const particleCount = PARTICLE_COUNT_DESKTOP;

  return (
    <div ref={sceneRef} className="absolute inset-0 overflow-hidden bg-black">
      <div
        ref={gridRef}
        className="grid-lines absolute inset-0 opacity-0 mask-fade-b"
        style={{ transform: "perspective(600px) rotateX(55deg) scale(1.6)", transformOrigin: "50% 100%" }}
      />

      <div ref={streaksRef} className="pointer-events-none absolute inset-0">
        {Array.from({ length: STREAK_COUNT }).map((_, i) => (
          <div
            key={i}
            className="absolute h-[2px] w-[45%] origin-left bg-gradient-to-r from-transparent via-turquoise-300/70 to-transparent opacity-0"
            style={{ left: 0, top: `${30 + i * 8}%` }}
          />
        ))}
      </div>

      <div
        ref={particlesRef}
        className="pointer-events-none absolute left-[36%] top-[76%] h-1 w-1"
      >
        {Array.from({ length: particleCount }).map((_, i) => {
          const top = ((i * 37) % 40) - 20;
          const left = ((i * 53) % 18) - 9;
          return (
            <span
              key={i}
              className="absolute block h-[3px] w-[3px] rounded-full bg-turquoise-300"
              style={{ top: `${top}px`, left: `${left}px` }}
            />
          );
        })}
      </div>

      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-[58%] h-[55%] w-[80%] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(126,232,220,0.35) 0%, rgba(34,199,181,0.12) 45%, transparent 75%)",
          filter: "blur(14px)",
        }}
      />

      <div className="absolute inset-x-0 top-0 h-[62vh] sm:h-[78vh] md:inset-0 md:h-auto">
        <Toro3DScene onReady={handleReady} />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </div>
  );
}
