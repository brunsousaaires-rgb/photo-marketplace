"use client";

import { motion } from "framer-motion";
import { Reveal } from "../ui/Reveal";

const pillars = ["Qualidade", "Confiança", "Transparência", "Bom negócio"];

export function Sobre() {
  return (
    <section id="sobre" className="relative overflow-hidden bg-black py-28 md:py-40">
      <div className="grid-lines absolute inset-0 opacity-[0.04]" />
      <div className="mx-auto max-w-5xl px-6 text-center md:px-10">
        <Reveal>
          <p className="mb-8 text-[11px] uppercase tracking-widest2 text-turquoise-400">
            Sobre a Zequinha
          </p>
        </Reveal>

        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {pillars.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0.08, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-20% 0px -20% 0px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl font-bold uppercase tracking-tight text-white sm:text-6xl md:text-7xl"
            >
              {word}
            </motion.span>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-14">
          <p className="mx-auto max-w-lg text-lg text-white/60 sm:text-xl">
            &ldquo;Qualidade e confiança em cada negócio.&rdquo;
          </p>
        </Reveal>
      </div>
    </section>
  );
}
