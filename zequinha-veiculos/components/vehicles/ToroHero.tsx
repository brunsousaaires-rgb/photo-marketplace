"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ToroSilhouette } from "./ToroSilhouette";

const PARTICLE_COUNT_DESKTOP = 16;

/**
 * Cena cinematográfica de abertura: a Fiat Toro entra em alta velocidade,
 * freia bruscamente e para no centro da tela. Toda a "física" é simulada
 * com transforms (translate/scale/rotate/blur) sobre camadas em
 * profundidade — não há vídeo nem modelo 3D real.
 *
 * Dispara `onSettled` quando a sequência termina, para o texto do
 * HeroExperience entrar em sincronia.
 */
export function ToroHero({ onSettled }: { onSettled?: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const carWrapRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.innerWidth < 768;
    const speed = isMobile ? 0.65 : 1;

    const ctx = gsap.context(() => {
      const car = carRef.current;
      const wrap = carWrapRef.current;
      const reflection = reflectionRef.current;
      const grid = gridRef.current;
      const scene = sceneRef.current;
      if (!car || !wrap || !reflection || !grid || !scene) return;

      const headlight = car.querySelectorAll('[data-part="headlight"]');
      const wheelFront = car.querySelectorAll('[data-part="wheel-front"]');
      const shadow = car.querySelectorAll('[data-part="shadow"]');
      const particles = particlesRef.current?.children ?? [];

      if (reduceMotion) {
        gsap.set(wrap, { opacity: 1, x: 0, scale: 1, rotate: 0, filter: "blur(0px)" });
        gsap.set(grid, { opacity: 0.4 });
        gsap.set(reflection, { opacity: 0.25 });
        gsap.to(wrap, { opacity: 1, duration: 0.6 });
        onSettled?.();
        return;
      }

      const tl = gsap.timeline({ onComplete: onSettled });

      // Estado inicial: tela quase preta, carro fora da cena.
      gsap.set(wrap, {
        opacity: 0,
        x: isMobile ? "-60vw" : "-85vw",
        y: 10,
        scale: 0.82,
        rotate: -7,
        filter: "blur(22px)",
        transformOrigin: "50% 80%",
      });
      gsap.set(reflection, { opacity: 0 });
      gsap.set(grid, { opacity: 0 });
      gsap.set(headlight, { opacity: 0.2 });
      gsap.set(shadow, { opacity: 0 });
      gsap.set(particles, { opacity: 0 });

      // Fase 1 — suspense: piso e faróis ao longe.
      tl.to(grid, { opacity: 0.35, duration: 0.9 * speed, ease: "power1.out" }, 0);
      tl.to(
        headlight,
        { opacity: 0.6, duration: 0.35 * speed, repeat: 1, yoyo: true, ease: "power1.inOut" },
        0.15
      );
      tl.to(shadow, { opacity: 0.4, duration: 0.6 * speed }, 0.3);

      // Fase 2 — entrada em alta velocidade, vindo de fora da tela.
      tl.to(
        wrap,
        {
          x: isMobile ? "4vw" : "6vw",
          scale: 1.06,
          rotate: 1.5,
          filter: "blur(2px)",
          opacity: 1,
          duration: 0.62 * speed,
          ease: "power4.in",
        },
        0.75 * speed
      );
      tl.to(headlight, { opacity: 1, duration: 0.2 * speed }, "-=0.35");

      // partículas de asfalto acompanhando a entrada
      tl.to(
        particles,
        {
          opacity: 1,
          duration: 0.15,
          stagger: { each: 0.012, from: "start" },
        },
        "-=0.5"
      );
      tl.to(
        particles,
        {
          x: (i) => gsap.utils.random(-60, -160),
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.008,
        },
        "-=0.4"
      );

      // Fase 3 — freada forte e curta: mergulho de dianteira + shake de câmera.
      tl.to(
        wrap,
        {
          x: 0,
          scale: 1,
          rotate: -2.2,
          filter: "blur(0px)",
          duration: 0.22 * speed,
          ease: "power2.out",
        },
        "-=0.08"
      );
      tl.to(wheelFront, { scaleY: 0.92, transformOrigin: "50% 100%", duration: 0.12 }, "<");
      tl.to(
        scene,
        {
          x: -6,
          duration: 0.05,
          repeat: 5,
          yoyo: true,
          ease: "power1.inOut",
        },
        "<"
      );

      // Fase 4 — assentamento com leve rebote elástico.
      tl.to(wrap, { rotate: 0, duration: 0.55, ease: "elastic.out(1, 0.55)" });
      tl.to(wheelFront, { scaleY: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" }, "<");
      tl.to(reflection, { opacity: 0.22, duration: 0.6, ease: "power2.out" }, "<");
      tl.to(shadow, { opacity: 0.55, duration: 0.5 }, "<");
      tl.to(headlight, { opacity: 1, duration: 0.4 }, "<");
      tl.to(grid, { opacity: 0.5, duration: 0.6 }, "<");

      // Fase 5 — aproximação sutil de câmera.
      tl.to(wrap, { scale: 1.035, duration: 1.1, ease: "power1.out" }, "-=0.1");
    }, sceneRef);

    return () => ctx.revert();
  }, [onSettled]);

  // Renderiza sempre a contagem "desktop" para manter o HTML idêntico entre
  // servidor e cliente (evita mismatch de hidratação); em telas menores a
  // timeline de entrada simplesmente anima menos partículas visíveis.
  const particleCount = PARTICLE_COUNT_DESKTOP;

  return (
    <div ref={sceneRef} className="absolute inset-0 overflow-hidden bg-black">
      <div
        ref={gridRef}
        className="grid-lines absolute inset-0 opacity-0 mask-fade-b"
        style={{ transform: "perspective(600px) rotateX(55deg) scale(1.6)", transformOrigin: "50% 100%" }}
      />

      <div
        ref={particlesRef}
        className="pointer-events-none absolute left-[38%] top-[74%] h-1 w-1"
      >
        {Array.from({ length: particleCount }).map((_, i) => {
          // Deterministic pseudo-random spread (avoids SSR/client hydration mismatch).
          const top = ((i * 37) % 36) - 18;
          const left = ((i * 53) % 16) - 8;
          return (
            <span
              key={i}
              className="absolute block h-[3px] w-[3px] rounded-full bg-turquoise-300"
              style={{ top: `${top}px`, left: `${left}px` }}
            />
          );
        })}
      </div>

      <div className="absolute inset-0 flex items-center justify-center pb-[30vh] sm:pb-[6vh] md:pb-0">
        <div ref={carWrapRef} className="w-[72vw] max-w-[860px] sm:w-[70vw] md:w-[62vw]">
          <div ref={carRef} className="relative drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            <ToroSilhouette className="h-auto w-full" />
          </div>
          <div ref={reflectionRef} className="mask-fade-b absolute left-0 top-full w-full opacity-0">
            <ToroSilhouette reflection className="h-auto w-full" />
          </div>
        </div>
      </div>

      <div
        ref={vignetteRef}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
