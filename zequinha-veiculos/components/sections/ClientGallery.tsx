"use client";

import Image from "next/image";
import { Users } from "lucide-react";
import { clientStories } from "@/data/clients";
import { Reveal } from "../ui/Reveal";

export function ClientGallery() {
  return (
    <section id="clientes" className="relative bg-graphite-900/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 text-[11px] uppercase tracking-widest2 text-turquoise-400">
            Clientes
          </p>
        </Reveal>
        <Reveal delay={0.05} className="mb-16">
          <h2 className="max-w-2xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Quem já fez negócio, recomenda.
          </h2>
        </Reveal>

        {clientStories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {clientStories.map((client, i) => (
              <Reveal key={client.id} delay={i * 0.05}>
                <figure className="group relative aspect-square overflow-hidden rounded-2xl border border-white/8 bg-graphite-900">
                  <Image
                    src={client.image}
                    alt={client.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-cinematic group-hover:scale-[1.08]"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
                    <p className="text-sm font-semibold text-white">{client.name}</p>
                    {client.vehicle && (
                      <p className="text-[11px] text-turquoise-300">{client.vehicle}</p>
                    )}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/12 py-20 text-center">
            <Users size={32} strokeWidth={1.2} className="text-turquoise-400/70" />
            <p className="max-w-sm text-sm text-white/45">
              Este mural vai reunir fotos reais dos clientes da Zequinha,
              como no destaque{" "}
              <span className="text-white/70">&ldquo;Clientes&rdquo;</span> do
              Instagram — em breve por aqui.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
