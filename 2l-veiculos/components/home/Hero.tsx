'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';

// Foto real de um veículo do estoque da 2L Veículos, na fachada da loja em Trindade-GO.
const HERO_IMAGE = 'https://2lveiculos.netlify.app/assets/estoque-2l/corolla.jpg';

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    if (mql.matches) {
      setPhase(4);
      return;
    }
    const timers = [
      setTimeout(() => setPhase(1), 300), // darkness -> reflections
      setTimeout(() => setPhase(2), 1000), // car appears
      setTimeout(() => setPhase(3), 2100), // logo reveal
      setTimeout(() => setPhase(4), 2700), // headline + CTA
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const carScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const carX = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const carY = useTransform(scrollYProgress, [0, 1], ['0%', '-4%']);
  const carBlur = useTransform(scrollYProgress, [0, 1], [0, 6]);
  const carFilter = useTransform(carBlur, (b) => `blur(${b}px)`);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);
  const vignetteOpacity = useTransform(scrollYProgress, [0, 1], [0.5, 0.9]);

  return (
    <section ref={sectionRef} className="relative h-[180vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-bg">
        {/* Ambient particles / reflections */}
        <div className="absolute inset-0 z-[1] bg-radial-fade" />
        <div className="pointer-events-none absolute inset-0 z-[1] opacity-40">
          <div className="absolute left-1/4 top-1/3 h-1 w-1 animate-pulse rounded-full bg-gold/70 blur-[1px]" />
          <div className="absolute left-2/3 top-1/4 h-1 w-1 animate-pulse rounded-full bg-gold/50 blur-[1px] [animation-delay:0.6s]" />
          <div className="absolute left-1/2 top-2/3 h-1.5 w-1.5 animate-pulse rounded-full bg-gold/40 blur-[1px] [animation-delay:1.1s]" />
        </div>

        {/* Car */}
        <motion.div
          initial={{ opacity: 0, scale: 1.15, filter: 'blur(18px)' }}
          animate={
            phase >= 2
              ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
              : { opacity: 0, scale: 1.15, filter: 'blur(18px)' }
          }
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={
            reducedMotion
              ? undefined
              : { scale: carScale, x: carX, y: carY, filter: carFilter }
          }
          className="absolute inset-0 z-[2]"
        >
          <Image
            src={HERO_IMAGE}
            alt="Veículo em destaque na 2L Veículos"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-80"
          />
        </motion.div>

        {/* Vignette */}
        <motion.div
          style={{ opacity: reducedMotion ? 0.75 : vignetteOpacity }}
          className="absolute inset-0 z-[3] bg-gradient-to-t from-bg via-bg/40 to-bg/70"
        />
        <div className="absolute inset-0 z-[3] bg-gradient-to-r from-bg via-transparent to-bg/60" />

        {/* Content */}
        <motion.div
          style={reducedMotion ? undefined : { opacity: contentOpacity, y: contentY }}
          className="relative z-[4] flex h-full flex-col justify-between px-6 pb-10 pt-32 sm:px-10 sm:pb-14 lg:px-16"
        >
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-semibold uppercase tracking-widest2 text-gold"
            >
              2L Veículos · Trindade, GO
            </motion.p>

            <div className="mt-4 overflow-hidden">
              <motion.h1
                initial={{ y: '100%' }}
                animate={phase >= 4 ? { y: '0%' } : {}}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[13vw] uppercase leading-[0.9] text-ink sm:text-[8vw] lg:text-[6.4vw]"
              >
                Encontre mais
              </motion.h1>
            </div>
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: '100%' }}
                animate={phase >= 4 ? { y: '0%' } : {}}
                transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[13vw] uppercase leading-[0.9] text-ink sm:text-[8vw] lg:text-[6.4vw]"
              >
                do que um <span className="text-gradient-gold">carro.</span>
              </motion.h1>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md"
            >
              <p className="text-base text-ink-soft sm:text-lg">
                Encontre a sua <span className="text-ink">próxima história</span>. Compra, venda, troca e
                financiamento com 12 anos de experiência.
              </p>
              <Link
                href="/veiculos"
                data-cursor="view"
                className="group mt-6 inline-flex items-center gap-3 rounded-full border border-gold/50 px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-bg"
              >
                Explorar estoque
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={phase >= 4 ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="hidden flex-col items-center gap-3 text-ink-muted sm:flex"
            >
              <span className="text-[10px] font-medium uppercase tracking-widest2 [writing-mode:vertical-lr]">
                Scroll to explore
              </span>
              <motion.span
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowDown size={16} />
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
