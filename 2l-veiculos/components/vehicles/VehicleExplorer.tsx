'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Vehicle } from '@/types/vehicle';
import VehicleFilters, { emptyFilters, type Filters } from './VehicleFilters';
import VehicleGrid from './VehicleGrid';

export default function VehicleExplorer({ vehicles }: { vehicles: Vehicle[] }) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoria');

  const [filters, setFilters] = useState<Filters>({
    ...emptyFilters,
    category: initialCategory ?? emptyFilters.category,
  });

  useEffect(() => {
    if (initialCategory) {
      setFilters((f) => ({ ...f, category: initialCategory }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory]);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    let result = vehicles.filter((v) => {
      const haystack = `${v.brand} ${v.model} ${v.version ?? ''} ${v.category}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesBrand = filters.brand === 'Todas' || v.brand === filters.brand;
      const matchesCategory = filters.category === 'Todas' || v.category === filters.category;
      const matchesTransmission = filters.transmission === 'Todos' || v.transmission === filters.transmission;
      const matchesFuel = filters.fuel === 'Todos' || v.fuel === filters.fuel;
      return matchesSearch && matchesBrand && matchesCategory && matchesTransmission && matchesFuel;
    });

    if (filters.sort === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    if (filters.sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    if (filters.sort === 'year-desc') result = [...result].sort((a, b) => b.year - a.year);

    return result;
  }, [vehicles, filters]);

  return (
    <div>
      <VehicleFilters filters={filters} onChange={setFilters} vehicles={vehicles} />

      <p className="mt-6 text-xs uppercase tracking-widest text-ink-muted">
        {filtered.length} {filtered.length === 1 ? 'veículo encontrado' : 'veículos encontrados'}
      </p>

      <div className="mt-6">
        <VehicleGrid vehicles={filtered} />
      </div>
    </div>
  );
}
