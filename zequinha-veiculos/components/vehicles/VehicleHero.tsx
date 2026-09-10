"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const STREAK_COUNT = 4;
/** Momento (s) em que a picape já está assentada na pose 3/4 — o texto entra aqui. */
const TEXT_REVEAL_AT = 5.3;

/**
 * Abertura cinematográfica com vídeo real: a RAM Rampage branca gira sob luz
 * de estúdio, faróis acendendo, câmera em arco lento até assentar na pose
 * 3/4 — um clipe pronto, não uma simulação. A cortina (clip-path) abre como
 * em um comercial de carro, uma leve respiração de zoom mantém a cena viva
 * depois de assentada, e o texto entra em sincronia com o momento em que o
 * veículo já está parado.
 *
 * Dispara `onSettled` no momento do assentamento, para o texto do
 * HeroExperience entrar em sincronia — mesmo contrato do herói anterior.
 */
export function VehicleHero({ onSettled }: { onSettled?: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const streaksRef = useRef<HTMLDivElement>(null);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    const scene = sceneRef.current;
    const curtain = curtainRef.current;
    const videoWrap = videoWrapRef.current;
    const video = videoRef.current;
    const glow = glowRef.current;
    if (!scene || !curtain || !videoWrap || !video || !glow) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const streaks = streaksRef.current?.children ?? [];

    if (reduceMotion) {
      // Sem autoplay: o <video> exibe apenas o poster (pose final, parada).
      gsap.set(curtain, { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(glow, { opacity: 0.4 });
      onSettledRef.current?.();
      return;
    }

    video.play().catch(() => {
      // Autoplay bloqueado (raro com muted+playsInline) — segue no poster.
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      gsap.set(curtain, { clipPath: "inset(46% 0% 46% 0%)" });
      gsap.set(glow, { opacity: 0 });
      gsap.set(streaks, { opacity: 0, scaleX: 0.3 });
      gsap.set(videoWrap, { scale: 1.08 });

      // cortina abrindo, tipo comercial de carro
      tl.to(curtain, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.2,
        ease: "power4.inOut",
      });
      tl.to(videoWrap, { scale: 1, duration: 1.6, ease: "power3.out" }, 0);
      tl.to(glow, { opacity: 0.45, duration: 1.4, ease: "power1.out" }, 0.3);

      // acento turquesa da marca no instante em que o texto assenta
      tl.to(
        streaks,
        { opacity: 0.75, scaleX: 1, duration: 0.35, stagger: 0.04, ease: "power2.out" },
        TEXT_REVEAL_AT
      );
      tl.to(
        streaks,
        { opacity: 0, duration: 0.5, stagger: 0.03 },
        TEXT_REVEAL_AT + 0.45
      );
      tl.call(() => onSettledRef.current?.(), [], TEXT_REVEAL_AT);

      // respiração sutil e contínua depois de assentado — cena viva, não estática
      tl.to(
        videoWrap,
        { scale: 1.025, duration: 6, ease: "sine.inOut", yoyo: true, repeat: -1 },
        TEXT_REVEAL_AT
      );
    }, sceneRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sceneRef} className="absolute inset-0 overflow-hidden bg-black">
      <div ref={curtainRef} className="absolute inset-0">
        <div ref={videoWrapRef} className="absolute inset-0">
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            poster="/hero/rampage-hero-poster.jpg"
            disablePictureInPicture
            disableRemotePlayback
            className="h-full w-full object-cover"
          >
            <source src="/hero/rampage-hero.webm" type="video/webm" />
            <source src="/hero/rampage-hero.mp4" type="video/mp4" />
          </video>
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>

      <div ref={streaksRef} className="pointer-events-none absolute inset-0">
        {Array.from({ length: STREAK_COUNT }).map((_, i) => (
          <div
            key={i}
            className="absolute h-[2px] w-[38%] origin-left bg-gradient-to-r from-transparent via-turquoise-300/80 to-transparent opacity-0"
            style={{ left: "8%", top: `${38 + i * 7}%` }}
          />
        ))}
      </div>

      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(34,199,181,0.22) 0%, rgba(34,199,181,0.06) 40%, transparent 72%)",
        }}
      />

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
