import { MessageCircle } from 'lucide-react';
import { sellers } from '@/data/sellers';
import SellerCard from '@/components/sellers/SellerCard';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';
import { contactPersonLink } from '@/lib/whatsapp';
import { site } from '@/data/site';

export default function SellerSection() {
  return (
    <section className="relative bg-bg px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel index="03">Vendedores</SectionLabel>
          <h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
            Escolha seu carro.
            <br />
            Conheça quem vai te ajudar.
          </h2>
        </Reveal>

        {sellers.length > 0 ? (
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sellers.map((seller, i) => (
              <SellerCard key={seller.id} seller={seller} index={i} />
            ))}
          </div>
        ) : (
          <Reveal delay={0.15} className="mt-14">
            <div className="flex flex-col items-start gap-5 rounded-2xl border border-white/10 bg-surface p-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-lg text-sm leading-relaxed text-ink-soft">
                {site.contactName} está pronto para te atender. Fale agora mesmo pelo WhatsApp e converse
                diretamente com a 2L Veículos.
              </p>
              <a
                href={contactPersonLink()}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="explore"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gold/50 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-bg"
              >
                <MessageCircle size={14} />
                Falar com {site.contactName}
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
