import type { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';
import { sellers } from '@/data/sellers';
import SellerCard from '@/components/sellers/SellerCard';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import { generalContactLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Vendedores',
  description: 'Conheça a equipe da 2L Veículos e fale diretamente com um consultor pelo WhatsApp.',
};

export default function VendedoresPage() {
  return (
    <div className="bg-bg px-6 pb-24 pt-36 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel>Vendedores</SectionLabel>
          <h1 className="mt-4 max-w-2xl font-display text-5xl uppercase leading-[0.95] text-ink sm:text-6xl">
            Conheça quem vai
            <br />
            <span className="text-gradient-gold">te ajudar.</span>
          </h1>
        </Reveal>

        {sellers.length > 0 ? (
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sellers.map((seller, i) => (
              <SellerCard key={seller.id} seller={seller} index={i} />
            ))}
          </div>
        ) : (
          <Reveal delay={0.15} className="mt-14">
            <div className="flex flex-col items-start gap-5 rounded-2xl border border-white/10 bg-surface p-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-lg text-sm leading-relaxed text-ink-soft">
                A equipe de consultores da 2L ainda será cadastrada aqui. Enquanto isso, fale direto com a
                loja pelo WhatsApp e você será atendido rapidamente.
              </p>
              <a
                href={generalContactLink()}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="explore"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gold/50 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-bg"
              >
                <MessageCircle size={14} />
                Falar com a 2L
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
