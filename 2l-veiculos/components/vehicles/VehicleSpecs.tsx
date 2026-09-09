import { Calendar, Gauge, Cog, Fuel, Palette, Tag } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { formatMileage } from '@/lib/utils';

export default function VehicleSpecs({ vehicle }: { vehicle: Vehicle }) {
  const specs = [
    { icon: Calendar, label: 'Ano', value: `${vehicle.year}${vehicle.modelYear ? `/${vehicle.modelYear}` : ''}` },
    { icon: Gauge, label: 'Quilometragem', value: formatMileage(vehicle.mileage) },
    { icon: Cog, label: 'Câmbio', value: vehicle.transmission },
    { icon: Fuel, label: 'Combustível', value: vehicle.fuel },
    { icon: Palette, label: 'Cor', value: vehicle.color },
    { icon: Tag, label: 'Categoria', value: vehicle.category },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {specs.map((spec) => (
        <div key={spec.label} className="rounded-xl border border-white/10 bg-surface p-4">
          <spec.icon size={16} className="text-gold" />
          <p className="mt-2 text-sm font-medium text-ink">{spec.value}</p>
          <p className="text-[11px] uppercase tracking-widest text-ink-muted">{spec.label}</p>
        </div>
      ))}
    </div>
  );
}
