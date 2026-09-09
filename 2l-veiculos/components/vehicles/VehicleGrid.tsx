import type { Vehicle } from '@/types/vehicle';
import VehicleCard from './VehicleCard';

export default function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
        <p className="text-sm text-ink-muted">Nenhum veículo encontrado com esses filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle, i) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} index={i} />
      ))}
    </div>
  );
}
