"use client";

import { Instagram, ArrowUpRight } from "lucide-react";
import { instagramPosts } from "@/data/instagram";
import { site } from "@/lib/site.config";
import { Reveal } from "../ui/Reveal";
import { Counter } from "../ui/Counter";

// Números públicos reais do perfil @zequinha_veiculos (Instagram).
const stats = [
  { value: 2654, label: "Seguidores" },
  { value: 85, label: "Publicações" },
  { value: 34, label: "Seguindo" },
];

export function InstagramSection() {
  return (
    <section className="relative bg-black py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Reveal>
              <p className="mb-3 text-[11px] uppercase tracking-widest2 text-turquoise-400">
                Instagram
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
                Acompanhe a Zequinha.
              </h2>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:border-turquoise-400/60 hover:text-turquoise-300"
            >
              <Instagram size={16} />
              @{site.instagramHandle}
              <ArrowUpRight size={14} />
            </a>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 border-y border-white/8 py-8 sm:max-w-md">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={0.1 + i * 0.06}>
              <Counter value={s.value} className="font-display text-3xl font-bold text-white" />
              <p className="mt-1 text-[11px] uppercase tracking-wide text-white/40">{s.label}</p>
            </Reveal>
          ))}
        </div>

        {instagramPosts.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {instagramPosts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="relative aspect-square overflow-hidden rounded-xl border border-white/8"
              >
                {/* Renderizado via API do Instagram quando configurada */}
              </a>
            ))}
          </div>
        ) : (
          <Reveal delay={0.2} className="mt-10">
            <p className="max-w-md text-sm text-white/40">
              As publicações mais recentes aparecerão aqui assim que a
              integração com o Instagram for conectada. Enquanto isso, visite
              o perfil completo pelo botão acima.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
