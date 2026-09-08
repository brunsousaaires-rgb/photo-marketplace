"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./ui/Reveal";
import TiltCard from "./ui/TiltCard";
import { projects } from "@/lib/site.config";

export default function Portfolio() {
  return (
    <section id="portfolio" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            Portfólio
          </span>
          <h2 className="mt-4 max-w-xl font-display text-3xl font-bold sm:text-4xl">
            Projetos recentes de sites e produtos com IA
          </h2>
          <p className="mt-4 max-w-xl text-sm text-white/50">
            Substitua estes cards pelos seus próprios projetos em{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
              lib/site.config.ts
            </code>
            .
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.title} delay={(i % 2) * 0.1}>
              <TiltCard className="group relative overflow-hidden rounded-3xl border border-white/10 bg-surface">
                <a href={project.href} className="block">
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </motion.div>
                  </div>

                  <div className="p-6" style={{ transform: "translateZ(40px)" }}>
                    <h3 className="font-display text-lg font-semibold">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">
                      {project.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </a>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
