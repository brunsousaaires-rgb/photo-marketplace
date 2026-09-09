import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ArrowRight } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import { generalContactLink } from '@/lib/whatsapp';

export default function CTASection() {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden bg-bg px-6 py-24 sm:px-10 lg:px-16">
      <Image
        src="https://2lveiculos.netlify.app/assets/estoque-2l/saveiro.jpg"
        alt="Veículo do estoque da 2L Veículos"
        fill
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/50" />

      <div className="relative z-[1] mx-auto max-w-4xl text-center">
        <Reveal>
          <h2 className="font-display text-[12vw] uppercase leading-[0.92] text-ink sm:text-6xl lg:text-7xl">
            O seu próximo carro
            <br />
            está mais perto
            <br />
            <span className="text-gradient-gold">do que você imagina.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/veiculos"
              data-cursor="view"
              className="group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-4 text-xs font-semibold uppercase tracking-widest text-bg transition-transform hover:scale-[1.03]"
            >
              Ver estoque
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href={generalContactLink()}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="explore"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-xs font-semibold uppercase tracking-widest text-ink transition-colors hover:border-gold hover:text-gold"
            >
              <MessageCircle size={15} />
              Falar com a 2L
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
