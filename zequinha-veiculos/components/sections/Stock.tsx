"use client";

import { useMemo, useState } from "react";
import { vehicles } from "@/data/vehicles";
import { VehicleCard } from "../vehicles/VehicleCard";
import { VehicleFilters, FilterValue } from "../vehicles/VehicleFilters";
import { Reveal } from "../ui/Reveal";

export function Stock() {
  const [filter, setFilter] = useState<FilterValue>("todos");

  const filtered = useMemo(() => {
    if (filter === "todos") return vehicles;
    return vehicles.filter((v) => v.category === filter);
  }, [filter]);

  return (
    <section id="estoque" className="relative bg-black py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="mb-3 text-[11px] uppercase tracking-widest2 text-turquoise-400">
                Estoque
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
                Seu próximo carro
                <br />
                está aqui.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-md text-sm text-white/55">
                Veículos selecionados para quem valoriza qualidade, procedência
                e confiança.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.1} className="mb-10">
          <VehicleFilters active={filter} onChange={setFilter} />
        </Reveal>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vehicle, i) => (
              <Reveal key={vehicle.id} delay={i * 0.06} distance={20}>
                <VehicleCard vehicle={vehicle} index={i} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-graphite-900 py-24 text-center">
            <p className="text-sm uppercase tracking-widest text-white/40">
              Nenhum veículo nesta categoria no momento
            </p>
            <p className="max-w-sm text-xs text-white/30">
              Fale com a Zequinha pelo WhatsApp — novidades chegam toda semana.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
