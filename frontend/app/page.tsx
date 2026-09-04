'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, Zap, Camera } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { EventListResponse, SportCount, SportEvent } from '@/lib/types';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { SPORTS } from '@/lib/sports';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [sportCounts, setSportCounts] = useState<SportCount[]>([]);
  const [sport, setSport] = useState('todos');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    apiFetch<{ sports: SportCount[] }>('/events/sports', { auth: false })
      .then((res) => setSportCounts(res.sports))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '24' });
    if (sport !== 'todos') params.set('sport', sport);
    if (q) params.set('q', q);

    const timeout = setTimeout(() => {
      apiFetch<EventListResponse>(`/events?${params.toString()}`, { auth: false })
        .then((res) => {
          setEvents(res.items);
          setTotal(res.total);
        })
        .catch(() => setEvents([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [sport, q]);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink-950">
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-accent2-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-accent-500/10 blur-2xl animate-pulse-glow" />

        <div className="container-page relative py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-500">
              <Zap className="h-3.5 w-3.5" /> Fotos de esporte em alta resolução
            </span>
            <h1 className="mt-5 font-display text-5xl uppercase leading-[0.95] tracking-wide text-white text-balance sm:text-6xl lg:text-7xl">
              Ache sua foto. <span className="text-gradient-hype">Baixe em HD.</span>
            </h1>
            <p className="mt-5 text-lg text-white/60 text-balance">
              Vôlei, futevôlei, beach tennis e muito mais. Busque o evento onde você jogou, encontre seus melhores lances com marca d’água e libere o download em HD na hora.
            </p>

            <div className="mt-8 flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-card-hover">
              <Search className="ml-3 h-5 w-5 text-ink-900/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busque pelo nome do evento ou cidade..."
                className="h-11 w-full border-0 bg-transparent px-1 text-sm text-ink-950 outline-none placeholder:text-ink-900/40"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/60">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent-500" /> Pagamento seguro via Stripe</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent-500" /> Download HD liberado na hora</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          <SportChip active={sport === 'todos'} onClick={() => setSport('todos')} emoji="🔥" label="Todos" />
          {SPORTS.filter((s) => s.slug !== 'outros').map((s) => {
            const count = sportCounts.find((c) => c.slug === s.slug)?.count ?? 0;
            return <SportChip key={s.slug} active={sport === s.slug} onClick={() => setSport(s.slug)} emoji={s.emoji} label={s.label} count={count} />;
          })}
        </div>

        <p className="mb-6 mt-5 text-sm text-ink-900/50">{loading ? 'Buscando eventos...' : `${total} evento${total === 1 ? '' : 's'} encontrado${total === 1 ? '' : 's'}`}</p>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] w-full rounded-2xl bg-ink-900/10" />
                <div className="mt-3 h-4 w-2/3 rounded bg-ink-900/10" />
                <div className="mt-2 h-3 w-1/3 rounded bg-ink-900/10" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-900/15 py-20 text-center">
            <Camera className="mb-3 h-8 w-8 text-ink-900/30" />
            <p className="font-medium text-ink-900/70">Nenhum evento encontrado</p>
            <p className="text-sm text-ink-900/40">Tente outro esporte ou termo de busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl bg-ink-950 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-2xl uppercase tracking-wide text-white">É fotógrafo esportivo?</p>
            <p className="mt-1 text-white/60">Suba as fotos do seu evento e venda em HD para os atletas.</p>
          </div>
          <Link href="/register">
            <Button variant="secondary" size="lg">Quero vender minhas fotos</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function SportChip({
  active,
  onClick,
  emoji,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition',
        active ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-900/15 bg-white text-ink-900/70 hover:border-ink-900/30'
      )}
    >
      <span>{emoji}</span> {label}
      {typeof count === 'number' && count > 0 && <span className="opacity-50">· {count}</span>}
    </button>
  );
}
