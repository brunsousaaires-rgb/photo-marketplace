"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import ParticleField from "./ui/ParticleField";
import MagneticButton from "./ui/MagneticButton";
import Counter from "./ui/Counter";
import { site, stats } from "@/lib/site.config";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden pt-28">
      <div className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <ParticleField />

      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-violet-600/30 blur-[100px] animate-blob" />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 rounded-full bg-aqua-500/20 blur-[110px] animate-blob [animation-delay:4s]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center"
      >
        <motion.div
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-white/70"
        >
          <Sparkles className="h-3.5 w-3.5 text-aqua-400" />
          Disponível para novos projetos
        </motion.div>

        <motion.h1
          variants={item}
          className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Sites e soluções com{" "}
          <span className="text-gradient">Inteligência Artificial</span>{" "}
          que resolvem problemas de verdade
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-2xl text-balance text-base text-white/60 sm:text-lg"
        >
          {site.tagline}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <MagneticButton
            href="#portfolio"
            className="bg-white text-ink hover:shadow-[0_0_40px_-8px_rgba(255,255,255,0.5)]"
          >
            Ver portfólio
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </MagneticButton>
          <MagneticButton
            href="#contato"
            className="glass text-white hover:bg-white/10"
          >
            Iniciar um projeto
          </MagneticButton>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-20 grid w-full grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl font-bold sm:text-4xl">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-xs text-white/50">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-9 w-6 items-start justify-center rounded-full border border-white/20 p-1.5">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1.5 rounded-full bg-white/60"
          />
        </div>
      </motion.div>
    </section>
  );
}
