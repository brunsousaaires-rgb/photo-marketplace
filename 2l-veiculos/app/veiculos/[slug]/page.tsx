import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { vehicles, getVehicleBySlug, getRelatedVehicles } from '@/data/vehicles';
import { sellers } from '@/data/sellers';
import { formatMileage, formatPrice } from '@/lib/utils';
import { vehicleInterestLink } from '@/lib/whatsapp';
import VehicleGallery from '@/components/vehicles/VehicleGallery';
import VehicleSpecs from '@/components/vehicles/VehicleSpecs';
import RelatedVehicles from '@/components/vehicles/RelatedVehicles';
import Reveal from '@/components/ui/Reveal';

export function generateStaticParams() {
  return vehicles.map((vehicle) => ({ slug: vehicle.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const vehicle = getVehicleBySlug(params.slug);
  if (!vehicle) return {};

  const title = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
  const description = `${title} — ${formatMileage(vehicle.mileage)}, ${vehicle.transmission}, ${vehicle.fuel}. ${formatPrice(vehicle.price)} na 2L Veículos, Trindade-GO.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | 2L Veículos`,
      description,
      images: vehicle.images[0] ? [{ url: vehicle.images[0] }] : undefined,
    },
  };
}

export default function VehiclePage({ params }: { params: { slug: string } }) {
  const vehicle = getVehicleBySlug(params.slug);
  if (!vehicle) notFound();

  const related = getRelatedVehicles(vehicle);
  const seller = sellers.find((s) => s.id === vehicle.sellerId);

  return (
    <div className="bg-bg px-6 pb-24 pt-32 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        {vehicle.isPlaceholder && (
          <div className="mb-6 rounded-lg border border-gold/30 bg-gold/5 px-4 py-2 text-xs text-gold">
            Veículo de exemplo — dados de demonstração até o estoque real ser cadastrado.
          </div>
        )}

        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest2 text-gold">{vehicle.brand}</p>
          <h1 className="mt-2 font-display text-5xl uppercase leading-[0.95] text-ink sm:text-6xl">
            {vehicle.model} <span className="text-ink-muted">{vehicle.year}</span>
          </h1>
        </Reveal>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <Reveal delay={0.1}>
            <VehicleGallery vehicle={vehicle} />

            <div className="mt-10">
              <h2 className="font-display text-2xl uppercase text-ink">Especificações</h2>
              <div className="mt-5">
                <VehicleSpecs vehicle={vehicle} />
              </div>
            </div>

            <div className="mt-10">
              <h2 className="font-display text-2xl uppercase text-ink">Sobre este veículo</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{vehicle.description}</p>
            </div>

            {vehicle.features.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl uppercase text-ink">Opcionais</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {vehicle.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs text-ink-soft"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Reveal>

          <Reveal delay={0.2}>
            <div className="sticky top-28 rounded-2xl border border-white/10 bg-surface p-6">
              <p className="text-xs uppercase tracking-widest text-ink-muted">Valor</p>
              <p className="mt-2 font-display text-4xl text-gradient-gold">{formatPrice(vehicle.price)}</p>

              <a
                href={vehicleInterestLink(vehicle, seller?.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="explore"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-4 text-xs font-semibold uppercase tracking-widest text-bg transition-transform hover:scale-[1.02]"
              >
                <MessageCircle size={15} />
                Tenho interesse
              </a>

              {seller && (
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6">
                  <div>
                    <p className="text-sm font-medium text-ink">{seller.name}</p>
                    <p className="text-xs text-ink-muted">{seller.role}</p>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        <RelatedVehicles vehicles={related} />
      </div>
    </div>
  );
}
