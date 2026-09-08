"use client";

import { motion } from "framer-motion";
import { Code2, Bot, LayoutDashboard } from "lucide-react";
import Reveal from "./ui/Reveal";
import { services } from "@/lib/site.config";

const icons = [Code2, Bot, LayoutDashboard];

export default function Services() {
  return (
    <section id="servicos" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-400">
            O que eu faço
          </span>
          <h2 className="mt-4 max-w-xl font-display text-3xl font-bold sm:text-4xl">
            Serviços pensados para gerar resultado, não só entregar código
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {services.map((service, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={service.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-surface p-8"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/0 blur-3xl transition-all duration-500 group-hover:bg-violet-500/25" />

                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-aqua-400">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="relative mt-6 font-display text-xl font-semibold">
                    {service.title}
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/55">
                    {service.description}
                  </p>

                  <div className="relative mt-6 flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
