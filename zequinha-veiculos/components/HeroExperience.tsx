"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { VehicleHero } from "./vehicles/VehicleHero";
import { MagneticButton } from "./ui/MagneticButton";
import { whatsappUrlGeneral } from "@/lib/whatsapp";

export function HeroExperience() {
  const wrapperRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!settled) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 28, filter: "blur(6px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: reduceMotion ? 0.4 : 1,
        ease: "power3.out",
      }
    );
  }, [settled]);

  // Transição de saída: enquanto a seção (mais alta que a tela) rola por
  // trás da cena "sticky", a câmera se aproxima e a cena esmaece — sem
  // depender de pin via ScrollTrigger.
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.55, 1], [1, 1, 1.18]);
  const opacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 1, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.55, 1], [0, 0, 6]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <section id="inicio" ref={wrapperRef} className="relative h-[175svh] w-full bg-black">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <motion.div style={{ scale, opacity, filter }} className="absolute inset-0">
          <VehicleHero onSettled={() => setSettled(true)} />

          <div
            ref={textRef}
            className="absolute inset-x-0 bottom-[9%] flex flex-col items-center px-6 text-center opacity-0 md:bottom-[11%]"
          >
            <p className="mb-4 text-[11px] font-medium uppercase tracking-widest2 text-turquoise-300">
              Trindade · GO
            </p>
            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
              ZEQUINHA
              <br />
              <span className="text-gradient">VEÍCULOS</span>
            </h1>
            <p className="mt-5 text-sm uppercase tracking-[0.25em] text-white/70 sm:text-base">
              Qualidade e confiança
              <br className="sm:hidden" /> em cada negócio.
            </p>
            <div className="mt-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-white/40 sm:text-xs">
              <span>Compra</span>
              <span className="h-1 w-1 rounded-full bg-turquoise-500" />
              <span>Venda</span>
              <span className="h-1 w-1 rounded-full bg-turquoise-500" />
              <span>Troca</span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <MagneticButton
                href="#estoque"
                className="rounded-full bg-turquoise-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-black transition-colors hover:bg-turquoise-400"
              >
                Ver Estoque
              </MagneticButton>
              <MagneticButton
                href={whatsappUrlGeneral()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:border-turquoise-400/60 hover:text-turquoise-300"
              >
                Falar com a Zequinha
              </MagneticButton>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-white/40">
            <span className="text-[10px] uppercase tracking-widest2">Scroll to explore</span>
            <ChevronDown size={16} className="animate-bounce" strokeWidth={1.5} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
