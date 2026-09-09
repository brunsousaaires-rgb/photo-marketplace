import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getFeaturedVehicles } from '@/data/vehicles';
import VehicleCard from '@/components/vehicles/VehicleCard';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

export default function VehicleShowcase() {
  const vehicles = getFeaturedVehicles().slice(0, 6);

  return (
    <section className="relative bg-bg px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal>
            <SectionLabel index="01">Estoque</SectionLabel>
            <h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
              Uma seleção pensada para você.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              href="/veiculos"
              data-cursor="explore"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-soft transition-colors hover:text-gold"
            >
              Ver todo o estoque
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle, i) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
