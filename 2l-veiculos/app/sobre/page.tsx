import type { Metadata } from 'next';
import Image from 'next/image';
import { site } from '@/data/site';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import DifferentialsSection from '@/components/home/DifferentialsSection';
import CTASection from '@/components/home/CTASection';

export const metadata: Metadata = {
  title: 'Sobre a 2L Veículos',
  description: `${site.missionStatement} Conheça a 2L Veículos, ${site.yearsInMarket} anos de experiência em ${site.city}-${site.state}.`,
};

export default function SobrePage() {
  return (
    <div className="bg-bg">
      <section className="px-6 pb-20 pt-36 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <SectionLabel>Sobre a 2L</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl uppercase leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
              Todo carro tem uma história.
              <br />
              <span className="text-gradient-gold">A sua pode começar aqui.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-ink-soft">
              {site.missionStatement}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
        <Image
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2000&q=80"
          alt="Fachada e pátio da 2L Veículos"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-black/20 to-transparent" />
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionLabel index="01">Nossa história</SectionLabel>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft sm:text-base">
              Há {site.yearsInMarket} anos no mercado automotivo, a 2L Veículos nasceu em {site.city}-{site.state}
              {' '}com um propósito claro: {site.missionStatement.charAt(0).toLowerCase() + site.missionStatement.slice(1)}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Trabalhamos com compra, venda, troca e financiamento de veículos, sempre com foco em um
              atendimento próximo — do primeiro contato até a entrega das chaves.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="flex items-center justify-center rounded-2xl border border-white/10 bg-surface p-10">
            <div className="text-center">
              <p className="font-display text-7xl text-gradient-gold">
                <AnimatedNumber value={site.yearsInMarket} suffix="+" />
              </p>
              <p className="mt-2 text-xs uppercase tracking-widest text-ink-muted">Anos de experiência</p>
            </div>
          </Reveal>
        </div>
      </section>

      <DifferentialsSection />
      <CTASection />
    </div>
  );
}
