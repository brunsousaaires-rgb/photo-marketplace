import Link from 'next/link';
import { Instagram, MessageCircle, MapPin } from 'lucide-react';
import { site } from '@/data/site';
import { generalContactLink } from '@/lib/whatsapp';

const columns = [
  {
    title: 'Navegação',
    links: [
      { label: 'Estoque', href: '/veiculos' },
      { label: 'Modelos', href: '/#modelos' },
      { label: 'Financiamento', href: '/#financiamento' },
      { label: 'Clientes', href: '/#clientes' },
      { label: 'Vendedores', href: '/vendedores' },
      { label: 'Sobre', href: '/sobre' },
      { label: 'Contato', href: '/contato' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-bg-elevated px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="font-display text-3xl text-ink">
              2L <span className="text-gradient-gold">VEÍCULOS</span>
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">{site.tagline}</p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da 2L Veículos"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink transition-colors hover:border-gold hover:text-gold"
              >
                <Instagram size={17} />
              </a>
              <a
                href={generalContactLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp da 2L Veículos"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink transition-colors hover:border-gold hover:text-gold"
              >
                <MessageCircle size={17} />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{col.title}</h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-soft transition-colors hover:text-gold">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Localização</h4>
            <div className="mt-5 flex items-start gap-2 text-sm text-ink-soft">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>{site.address}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-ink-muted sm:flex-row">
          <span>© {new Date().getFullYear()} 2L Veículos. Todos os direitos reservados.</span>
          <span>Trindade — Goiás</span>
        </div>
      </div>
    </footer>
  );
}
