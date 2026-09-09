import { Calendar, Gauge, Cog, Fuel, Palette, Tag } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { formatMileage } from '@/lib/utils';

export default function VehicleSpecs({ vehicle }: { vehicle: Vehicle }) {
  const specs = [
    { icon: Calendar, label: 'Ano', value: `${vehicle.year}${vehicle.modelYear ? `/${vehicle.modelYear}` : ''}` },
    { icon: Gauge, label: 'Quilometragem', value: formatMileage(vehicle.mileage) },
    vehicle.transmission ? { icon: Cog, label: 'Câmbio', value: vehicle.transmission } : null,
    vehicle.fuel ? { icon: Fuel, label: 'Combustível', value: vehicle.fuel } : null,
    vehicle.color ? { icon: Palette, label: 'Cor', value: vehicle.color } : null,
    { icon: Tag, label: 'Categoria', value: vehicle.category },
  ].filter((spec): spec is NonNullable<typeof spec> => spec !== null);

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
