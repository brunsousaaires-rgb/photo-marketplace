import Image from 'next/image';
import { Instagram, ArrowUpRight } from 'lucide-react';
import { site } from '@/data/site';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

/**
 * PENDENTE: integrar com a API do Instagram (Graph API / Basic Display)
 * para puxar os posts reais de @2lveiculoss automaticamente. Enquanto a
 * integração não é feita, esta estrutura fica pronta para receber os
 * posts manualmente — basta preencher o array abaixo com:
 * { image, url, caption }
 */
interface InstagramPost {
  image: string;
  url: string;
  caption: string;
}

const posts: InstagramPost[] = [];

export default function InstagramFeed() {
  return (
    <section className="relative bg-bg px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal>
            <SectionLabel>Direto da 2L</SectionLabel>
            <h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
              @2lveiculoss
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="explore"
              className="group inline-flex items-center gap-2 rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-bg"
            >
              <Instagram size={14} />
              Seguir @2lveiculoss
            </a>
          </Reveal>
        </div>

        {posts.length > 0 ? (
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {posts.map((post, i) => (
              <a
                key={i}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="explore"
                className="group relative aspect-square overflow-hidden rounded-xl bg-surface"
              >
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 33vw, 16vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight className="text-ink" size={20} />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <Reveal delay={0.15} className="mt-14 rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-sm text-ink-muted">
              Os posts do Instagram aparecerão aqui assim que a integração for conectada. Enquanto isso,
              acompanhe tudo direto no perfil oficial.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
