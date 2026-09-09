"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const PARTICLE_COUNT_DESKTOP = 22;
const STREAK_COUNT = 6;

/**
 * Foto real da Fiat Toro usada na abertura (fonte: Wikimedia Commons,
 * licença livre). Uma máscara radial + vinheta escurecem as bordas da foto
 * (mostruário/piso) para que o carro pareça "flutuar" sobre o fundo preto
 * do site, sem precisar de um recorte com fundo transparente.
 */
const TORO_PHOTO =
  "https://upload.wikimedia.org/wikipedia/commons/6/60/Fiat_Toro_%28r%29.png";

/**
 * Cena cinematográfica de abertura: a Fiat Toro (foto real) entra em alta
 * velocidade, freia bruscamente e para no centro da tela. A "física" é
 * simulada com transforms (translate/scale/rotate/blur) — não há vídeo nem
 * modelo 3D real, mas o veículo é uma fotografia real, não uma ilustração.
 *
 * Dispara `onSettled` quando a sequência termina, para o texto do
 * HeroExperience entrar em sincronia.
 */
export function ToroHero({ onSettled }: { onSettled?: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const carWrapRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const streaksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.innerWidth < 768;
    const speed = isMobile ? 0.65 : 1;

    const ctx = gsap.context(() => {
      const car = carRef.current;
      const wrap = carWrapRef.current;
      const glow = glowRef.current;
      const contact = contactRef.current;
      const grid = gridRef.current;
      const scene = sceneRef.current;
      if (!car || !wrap || !glow || !contact || !grid || !scene) return;

      const particles = particlesRef.current?.children ?? [];
      const streaks = streaksRef.current?.children ?? [];

      if (reduceMotion) {
        gsap.set(wrap, { opacity: 1, x: 0, scale: 1, rotate: 0, filter: "blur(0px)" });
        gsap.set(grid, { opacity: 0.4 });
        gsap.set(glow, { opacity: 0.5 });
        gsap.set(contact, { opacity: 0.6, scaleX: 1 });
        onSettled?.();
        return;
      }

      const tl = gsap.timeline({ onComplete: onSettled });

      // Estado inicial: tela quase preta, carro fora da cena.
      gsap.set(wrap, {
        opacity: 0,
        x: isMobile ? "-70vw" : "-95vw",
        y: 6,
        scale: 0.78,
        rotate: -8,
        filter: "blur(26px)",
        transformOrigin: "50% 82%",
      });
      gsap.set(glow, { opacity: 0, scale: 0.6 });
      gsap.set(contact, { opacity: 0, scaleX: 0.4 });
      gsap.set(grid, { opacity: 0 });
      gsap.set(particles, { opacity: 0 });
      gsap.set(streaks, { opacity: 0, scaleX: 0.3 });

      // Fase 1 — suspense: piso e brilho ao longe, quase no escuro.
      tl.to(grid, { opacity: 0.35, duration: 0.9 * speed, ease: "power1.out" }, 0);
      tl.to(
        glow,
        { opacity: 0.35, scale: 0.8, duration: 0.4 * speed, repeat: 1, yoyo: true, ease: "power1.inOut" },
        0.15
      );

      // Fase 2 — entrada em alta velocidade, vindo de fora da tela.
      tl.to(
        streaks,
        { opacity: 0.8, scaleX: 1, duration: 0.3 * speed, stagger: 0.02, ease: "power2.out" },
        0.55 * speed
      );
      tl.to(
        wrap,
        {
          x: isMobile ? "4vw" : "6vw",
          scale: 1.08,
          rotate: 2,
          filter: "blur(3px)",
          opacity: 1,
          duration: 0.6 * speed,
          ease: "power4.in",
        },
        0.62 * speed
      );
      tl.to(glow, { opacity: 1, scale: 1.05, duration: 0.3 * speed }, "-=0.4");
      tl.to(
        streaks,
        { opacity: 0, duration: 0.25 * speed, stagger: 0.015 },
        "-=0.15"
      );

      // partículas de asfalto acompanhando a entrada
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

      // Fase 3 — freada forte e curta: mergulho + achatamento + shake de câmera.
      tl.to(
        wrap,
        {
          x: 0,
          scale: 1,
          rotate: -3,
          filter: "blur(0px)",
          duration: 0.2 * speed,
          ease: "power2.out",
        },
        "-=0.1"
      );
      tl.to(
        car,
        { scaleX: 1.035, scaleY: 0.955, transformOrigin: "50% 85%", duration: 0.14, ease: "power2.out" },
        "<"
      );
      tl.to(contact, { opacity: 0.65, scaleX: 1.15, duration: 0.16, ease: "power2.out" }, "<");
      tl.to(
        scene,
        { x: -8, duration: 0.045, repeat: 7, yoyo: true, ease: "power1.inOut" },
        "<"
      );

      // Fase 4 — assentamento com leve rebote elástico.
      tl.to(wrap, { rotate: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      tl.to(car, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" }, "<");
      tl.to(contact, { opacity: 0.45, scaleX: 1, duration: 0.6, ease: "power2.out" }, "<");
      tl.to(glow, { opacity: 0.7, scale: 1, duration: 0.6 }, "<");
      tl.to(grid, { opacity: 0.5, duration: 0.6 }, "<");

      // Fase 5 — aproximação sutil de câmera.
      tl.to(wrap, { scale: 1.04, duration: 1.1, ease: "power1.out" }, "-=0.1");
    }, sceneRef);

    return () => ctx.revert();
  }, [onSettled]);

  const particleCount = PARTICLE_COUNT_DESKTOP;

  return (
    <div ref={sceneRef} className="absolute inset-0 overflow-hidden bg-black">
      <div
        ref={gridRef}
        className="grid-lines absolute inset-0 opacity-0 mask-fade-b"
        style={{ transform: "perspective(600px) rotateX(55deg) scale(1.6)", transformOrigin: "50% 100%" }}
      />

      {/* linhas de velocidade durante a entrada */}
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

      <div className="absolute inset-0 flex items-center justify-center pb-[28vh] sm:pb-[8vh] md:pb-0">
        <div ref={carWrapRef} className="relative w-[80vw] max-w-[760px] sm:w-[58vw] md:w-[46vw]">
          {/* brilho ambiente atrás do carro (substitui o farol, já que a foto é real) */}
          <div
            ref={glowRef}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[95%] -translate-x-1/2 -translate-y-1/2 opacity-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(126,232,220,0.4) 0%, rgba(34,199,181,0.14) 45%, transparent 75%)",
              filter: "blur(10px)",
            }}
          />

          <div
            ref={carRef}
            className="relative aspect-[16/9] w-full overflow-hidden"
            style={{
              maskImage:
                "radial-gradient(ellipse 68% 68% at 50% 52%, black 45%, transparent 92%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 68% 68% at 50% 52%, black 45%, transparent 92%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TORO_PHOTO}
              alt="Fiat Toro"
              className="absolute inset-0 h-full w-full select-none object-cover"
              style={{
                objectPosition: "30% 78%",
                filter: "contrast(1.14) saturate(1.1) brightness(0.94)",
              }}
              draggable={false}
            />
          </div>

          {/* sombra/reflexo de contato no chão */}
          <div
            ref={contactRef}
            className="pointer-events-none absolute left-1/2 top-[78%] h-6 w-[60%] -translate-x-1/2 rounded-[100%] opacity-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.28) 55%, transparent 80%)",
              filter: "blur(7px)",
            }}
          />
        </div>
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
