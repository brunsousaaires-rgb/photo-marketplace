"use client";

import { useState } from "react";
import { ShoppingBag, Repeat, HandCoins, ArrowUpRight } from "lucide-react";
import { EvaluationForm, EvaluationMode } from "../EvaluationForm";
import { Reveal } from "../ui/Reveal";

const options = [
  {
    key: "comprar" as const,
    icon: ShoppingBag,
    title: "Comprar",
    description: "Explore o estoque selecionado e encontre o carro certo para você.",
  },
  {
    key: "vender" as const,
    icon: HandCoins,
    title: "Vender",
    description: "Avaliação rápida e justa para o seu veículo, direto com a Zequinha.",
  },
  {
    key: "trocar" as const,
    icon: Repeat,
    title: "Trocar",
    description: "Use seu carro atual na entrada do próximo negócio.",
  },
];

export function CompraVendaTroca() {
  const [formMode, setFormMode] = useState<EvaluationMode | null>(null);

  function handleClick(key: (typeof options)[number]["key"]) {
    if (key === "comprar") {
      document.getElementById("estoque")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setFormMode(key);
  }

  return (
    <section id="negocio" className="relative bg-black py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 text-center text-[11px] uppercase tracking-widest2 text-turquoise-400">
            Compra · Venda · Troca
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mx-auto max-w-2xl text-center font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Um carro.
            <br />
            Três possibilidades.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {options.map((opt, i) => (
            <Reveal key={opt.key} delay={0.1 + i * 0.08}>
              <button
                onClick={() => handleClick(opt.key)}
                data-cursor="link"
                className="group relative flex h-full w-full flex-col items-start gap-5 overflow-hidden rounded-3xl border border-white/8 bg-graphite-900 p-8 text-left transition-colors hover:border-turquoise-400/40"
              >
                <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-turquoise-500/0 blur-2xl transition-colors duration-500 group-hover:bg-turquoise-500/15" />
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 text-turquoise-300 transition-colors group-hover:border-turquoise-400/50">
                  <opt.icon size={22} strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-white">
                    {opt.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    {opt.description}
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-turquoise-300 opacity-0 transition-opacity group-hover:opacity-100">
                  Começar
                  <ArrowUpRight size={13} />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <EvaluationForm mode={formMode} onClose={() => setFormMode(null)} />
    </section>
  );
}
