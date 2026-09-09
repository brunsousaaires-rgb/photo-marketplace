import type { Metadata } from 'next';
import { MessageCircle, MapPin, Instagram, Clock } from 'lucide-react';
import { site, whatsappLink } from '@/data/site';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

export const metadata: Metadata = {
  title: 'Contato',
  description: `Fale com a 2L Veículos em ${site.city}-${site.state} pelo WhatsApp, Instagram ou visite nossa loja.`,
};

const mapQuery = encodeURIComponent(`${site.address}`);

export default function ContatoPage() {
  return (
    <div className="bg-bg px-6 pb-24 pt-36 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionLabel>Contato</SectionLabel>
          <h1 className="mt-4 max-w-2xl font-display text-5xl uppercase leading-[0.95] text-ink sm:text-6xl">
            Fale com a <span className="text-gradient-gold">2L Veículos.</span>
          </h1>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal className="space-y-4">
            <a
              href={whatsappLink('Olá! Vim pelo site da 2L Veículos e gostaria de mais informações.', site.whatsappPrimary)}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="explore"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-gold/40"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <MessageCircle size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">WhatsApp</p>
                  <p className="text-xs text-ink-muted">(62) 98516-9550</p>
                </div>
              </div>
            </a>

            <a
              href={whatsappLink('Olá! Vim pelo site da 2L Veículos e gostaria de mais informações.', site.whatsappSecondary)}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="explore"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-gold/40"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <MessageCircle size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">WhatsApp (alternativo)</p>
                  <p className="text-xs text-ink-muted">(62) 98456-1510</p>
                </div>
              </div>
            </a>

            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="explore"
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-gold/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Instagram size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Instagram</p>
                <p className="text-xs text-ink-muted">{site.handle}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/10 text-gold">
                <MapPin size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Endereço</p>
                <p className="text-xs text-ink-muted">{site.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-dashed border-white/10 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-ink-muted">
                <Clock size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Horário de atendimento</p>
                <p className="text-xs text-ink-muted">
                  Pendente de confirmação — consulte pelo WhatsApp para horário atualizado.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="min-h-[380px] overflow-hidden rounded-2xl border border-white/10">
            <iframe
              title="Localização da 2L Veículos"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-full min-h-[380px] w-full grayscale invert-[0.92] contrast-[0.9]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
