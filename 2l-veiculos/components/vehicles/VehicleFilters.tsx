'use client';

import { Search } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';

export interface Filters {
  search: string;
  brand: string;
  category: string;
  transmission: string;
  fuel: string;
  sort: 'relevance' | 'price-asc' | 'price-desc' | 'year-desc';
}

export const emptyFilters: Filters = {
  search: '',
  brand: 'Todas',
  category: 'Todas',
  transmission: 'Todos',
  fuel: 'Todos',
  sort: 'relevance',
};

export default function VehicleFilters({
  filters,
  onChange,
  vehicles,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  vehicles: Vehicle[];
}) {
  const brands = ['Todas', ...Array.from(new Set(vehicles.map((v) => v.brand))).sort()];
  const categories = ['Todas', ...Array.from(new Set(vehicles.map((v) => v.category))).sort()];
  const transmissions = ['Todos', ...Array.from(new Set(vehicles.map((v) => v.transmission))).sort()];
  const fuels = ['Todos', ...Array.from(new Set(vehicles.map((v) => v.fuel))).sort()];

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-bg px-5 py-3.5">
        <Search size={16} className="shrink-0 text-ink-muted" />
        <input
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Busque por Corolla, SUV, BMW..."
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select label="Marca" value={filters.brand} options={brands} onChange={(v) => update('brand', v)} />
        <Select label="Categoria" value={filters.category} options={categories} onChange={(v) => update('category', v)} />
        <Select
          label="Câmbio"
          value={filters.transmission}
          options={transmissions}
          onChange={(v) => update('transmission', v)}
        />
        <Select label="Combustível" value={filters.fuel} options={fuels} onChange={(v) => update('fuel', v)} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['relevance', 'price-asc', 'price-desc', 'year-desc'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => update('sort', sort)}
              className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                filters.sort === sort
                  ? 'border-gold bg-gold text-bg'
                  : 'border-white/10 text-ink-muted hover:border-gold/50 hover:text-gold'
              }`}
            >
              {sort === 'relevance' && 'Relevância'}
              {sort === 'price-asc' && 'Menor preço'}
              {sort === 'price-desc' && 'Maior preço'}
              {sort === 'year-desc' && 'Mais novos'}
            </button>
          ))}
        </div>
        {(filters.search ||
          filters.brand !== 'Todas' ||
          filters.category !== 'Todas' ||
          filters.transmission !== 'Todos' ||
          filters.fuel !== 'Todos') && (
          <button
            onClick={() => onChange(emptyFilters)}
            className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted underline-offset-4 hover:text-gold hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-white/10 bg-bg px-3 py-2.5 text-xs text-ink focus:border-gold/50 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
