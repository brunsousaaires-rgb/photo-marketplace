import { Banknote, Repeat2, MessageCircle } from 'lucide-react';
import { site, whatsappLink } from '@/data/site';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

const financeMessage = `Olá! Vim pelo site da 2L Veículos e quero simular um financiamento.`;
const tradeMessage = `Olá! Vim pelo site da 2L Veículos e quero avaliar/vender/trocar meu veículo.`;

export default function FinanceSection() {
  return (
    <section id="financiamento" className="relative bg-bg px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel index="05">Negociação</SectionLabel>
          <h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
            {site.finance.title}
          </h2>
          <p className="mt-3 max-w-lg text-sm text-ink-muted">{site.finance.text}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Reveal delay={0.08} className="rounded-2xl border border-white/10 bg-surface p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Banknote size={20} />
            </span>
            <h3 className="mt-6 font-display text-2xl uppercase text-ink">{site.finance.financeTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{site.finance.financeText}</p>
            <a
              href={whatsappLink(financeMessage)}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="explore"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-bg"
            >
              <MessageCircle size={13} />
              Simular financiamento
            </a>
          </Reveal>

          <Reveal id="consignacao" delay={0.16} className="rounded-2xl border border-white/10 bg-surface p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Repeat2 size={20} />
            </span>
            <h3 className="mt-6 font-display text-2xl uppercase text-ink">{site.finance.tradeTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{site.finance.tradeText}</p>
            <a
              href={whatsappLink(tradeMessage)}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="explore"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-bg"
            >
              <MessageCircle size={13} />
              Vender, trocar ou consignar
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
