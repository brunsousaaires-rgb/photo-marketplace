import Image from 'next/image';
import { site } from '@/data/site';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

const stats = [
  { value: site.yearsInMarket, suffix: '+', label: 'Anos de mercado' },
  ...(site.vehiclesSold ? [{ value: site.vehiclesSold, suffix: '+', label: 'Veículos vendidos' }] : []),
  ...(site.happyCustomers ? [{ value: site.happyCustomers, suffix: '+', label: 'Clientes satisfeitos' }] : []),
];

export default function AboutSection() {
  return (
    <section id="sobre" className="relative overflow-hidden bg-bg-elevated px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <SectionLabel index="04">Sobre a 2L</SectionLabel>
          <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
            Todo carro tem uma história.
            <br />
            <span className="text-gradient-gold">A sua pode começar aqui.</span>
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
            {site.missionStatement} Há {site.yearsInMarket} anos no mercado de veículos em {site.city}-{site.state},
            a 2L trabalha com compra, venda, troca, financiamento e consignação — do primeiro contato à
            entrega das chaves.
          </p>

          <div className="mt-10 flex flex-wrap gap-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-4xl text-gradient-gold sm:text-5xl">
                  <AnimatedNumber value={stat.value as number} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-ink-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <Image
            src="https://2lveiculos.netlify.app/assets/provas-sociais-2l/entrega-1.jpg"
            alt="Entrega de veículo na loja da 2L Veículos, em Trindade-GO"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </Reveal>
      </div>
    </section>
  );
}
