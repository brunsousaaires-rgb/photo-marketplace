'use client';

import { useEffect, useState } from 'react';
import { Search, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Photo, PhotoListResponse } from '@/lib/types';
import { PhotoGrid } from '@/components/PhotoGrid';
import { cn } from '@/lib/utils';

interface Category {
  name: string;
  count: number;
}

const SORTS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
];

export default function HomePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('todos');
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/photos/categories', { auth: false })
      .then((res) => setCategories(res.categories))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, pageSize: '24' });
    if (category !== 'todos') params.set('category', category);
    if (q) params.set('q', q);

    const timeout = setTimeout(() => {
      apiFetch<PhotoListResponse>(`/photos?${params.toString()}`, { auth: false })
        .then((res) => {
          setPhotos(res.items);
          setTotal(res.total);
        })
        .catch(() => setPhotos([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [category, sort, q]);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink-950">
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />

        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-accent-400">
              <Sparkles className="h-3.5 w-3.5" /> Fotografias profissionais em alta resolução
            </span>
            <h1 className="mt-5 font-display text-4xl font-medium leading-[1.1] text-white text-balance sm:text-5xl lg:text-6xl">
              Encontre a foto certa. <span className="text-accent-400">Baixe em HD</span> em segundos.
            </h1>
            <p className="mt-5 text-lg text-white/60 text-balance">
              Explore um acervo com marca d’água até você comprar. Pagamento seguro, download em alta resolução liberado na hora.
            </p>

            <div className="mt-8 flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-card-hover">
              <Search className="ml-3 h-5 w-5 text-ink-900/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busque por natureza, retrato, eventos..."
                className="h-11 w-full border-0 bg-transparent px-1 text-sm text-ink-950 outline-none placeholder:text-ink-900/40"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/60">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent-400" /> Pagamento seguro via Stripe</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent-400" /> Download HD imediato após a compra</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <CategoryChip active={category === 'todos'} onClick={() => setCategory('todos')}>
              Todas
            </CategoryChip>
            {categories.map((c) => (
              <CategoryChip key={c.name} active={category === c.name} onClick={() => setCategory(c.name)}>
                {c.name.charAt(0).toUpperCase() + c.name.slice(1)} <span className="opacity-50">· {c.count}</span>
              </CategoryChip>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 shrink-0 rounded-xl border border-ink-900/15 bg-white px-3 text-sm text-ink-900 outline-none focus:border-accent-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <p className="mb-6 mt-4 text-sm text-ink-900/50">{loading ? 'Carregando fotos...' : `${total} foto${total === 1 ? '' : 's'} encontrada${total === 1 ? '' : 's'}`}</p>

        {loading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] w-full rounded-2xl bg-ink-900/10" />
                <div className="mt-3 h-4 w-2/3 rounded bg-ink-900/10" />
                <div className="mt-2 h-3 w-1/3 rounded bg-ink-900/10" />
              </div>
            ))}
          </div>
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </section>
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
        active ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-900/15 bg-white text-ink-900/70 hover:border-ink-900/30'
      )}
    >
      {children}
    </button>
  );
}
