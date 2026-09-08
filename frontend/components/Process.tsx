"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Reveal from "./ui/Reveal";
import { process } from "@/lib/site.config";

export default function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.4"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="processo" className="relative px-6 py-28">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-400">
            Como funciona
          </span>
          <h2 className="mt-4 max-w-xl font-display text-3xl font-bold sm:text-4xl">
            Um processo simples, do problema à solução no ar
          </h2>
        </Reveal>

        <div ref={ref} className="relative mt-16">
          <div className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-white/10 sm:left-6" />
          <motion.div
            style={{ height: lineHeight }}
            className="absolute left-[19px] top-2 w-px bg-gradient-to-b from-violet-400 to-aqua-400 sm:left-6"
          />

          <div className="flex flex-col gap-12">
            {process.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.08}>
                <div className="relative flex gap-6 pl-2 sm:gap-8">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass font-display text-xs font-bold sm:h-12 sm:w-12">
                    {p.step}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-display text-lg font-semibold sm:text-xl">
                      {p.title}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/55">
                      {p.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
