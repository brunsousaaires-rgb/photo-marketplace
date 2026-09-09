'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ScrollStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const opacity = useTransform(scrollYProgress, [0.15, 0.4, 0.7, 0.9], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.15, 0.5], [40, 0]);
  const lineWidth = useTransform(scrollYProgress, [0.2, 0.55], ['0%', '100%']);

  return (
    <section ref={ref} className="relative flex h-[70vh] items-center justify-center overflow-hidden bg-bg px-6 text-center">
      <div className="absolute inset-0 bg-radial-fade" />
      <motion.div style={{ opacity, y }} className="relative z-[2] max-w-4xl">
        <h2 className="font-display text-[11vw] uppercase leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
          Veículos que merecem
          <br />
          <span className="text-gradient-gold">uma segunda olhada.</span>
        </h2>
        <motion.span style={{ width: lineWidth }} className="mx-auto mt-8 block h-px bg-gold/60" />
      </motion.div>
    </section>
  );
}
