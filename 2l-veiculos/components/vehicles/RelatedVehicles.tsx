import type { Vehicle } from '@/types/vehicle';
import VehicleCard from './VehicleCard';
import SectionLabel from '@/components/ui/SectionLabel';

export default function RelatedVehicles({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) return null;

  return (
    <section className="mt-24">
      <SectionLabel>Veículos semelhantes</SectionLabel>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle, i) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} index={i} />
        ))}
      </div>
    </section>
  );
}
