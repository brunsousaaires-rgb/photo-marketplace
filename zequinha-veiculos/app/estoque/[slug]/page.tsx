import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, MapPin, Gauge, Fuel, Cog, Calendar } from "lucide-react";
import { getVehicleBySlug, vehicles } from "@/data/vehicles";
import { formatKm, formatPrice } from "@/lib/utils";
import { whatsappUrlForVehicle } from "@/lib/whatsapp";
import { site } from "@/lib/site.config";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { Reveal } from "@/components/ui/Reveal";

export function generateStaticParams() {
  return vehicles.map((v) => ({ slug: v.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const vehicle = getVehicleBySlug(params.slug);
  if (!vehicle) return {};
  const title = `${vehicle.fullName} | Zequinha Veículos`;
  const description = `${vehicle.fullName} disponível na Zequinha Veículos, em ${site.location}. ${site.tagline}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

const specs = (vehicle: NonNullable<ReturnType<typeof getVehicleBySlug>>) => [
  { icon: Calendar, label: "Ano", value: vehicle.year ?? "Consulte" },
  {
    icon: Gauge,
    label: "Quilometragem",
    value: vehicle.mileageKm !== null ? formatKm(vehicle.mileageKm) : "Consulte",
  },
  { icon: Cog, label: "Câmbio", value: vehicle.transmission ?? "Consulte" },
  { icon: Fuel, label: "Combustível", value: vehicle.fuel ?? "Consulte" },
];

export default function VehiclePage({ params }: { params: { slug: string } }) {
  const vehicle = getVehicleBySlug(params.slug);
  if (!vehicle) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <Link
            href="/#estoque"
            className="mb-8 inline-flex items-center gap-2 text-[12px] uppercase tracking-widest text-white/50 transition-colors hover:text-turquoise-300"
          >
            <ArrowLeft size={14} />
            Voltar ao estoque
          </Link>

          <Reveal>
            <p className="text-[11px] uppercase tracking-widest2 text-turquoise-400">
              {vehicle.brand}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              {vehicle.model}
            </h1>
          </Reveal>

          <Reveal delay={0.08} className="mt-8">
            <VehicleGallery vehicle={vehicle} />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <Reveal>
                <h2 className="mb-5 font-display text-lg font-semibold uppercase tracking-wide text-white">
                  Ficha técnica
                </h2>
              </Reveal>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {specs(vehicle).map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.05}>
                    <div className="rounded-2xl border border-white/8 bg-graphite-900 p-4">
                      <s.icon size={18} className="mb-3 text-turquoise-400" strokeWidth={1.5} />
                      <p className="text-[11px] uppercase tracking-wide text-white/40">
                        {s.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">{s.value}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {vehicle.description && (
                <Reveal delay={0.15} className="mt-8">
                  <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-white">
                    Detalhes do veículo
                  </h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-white/60">
                    {vehicle.description}
                  </p>
                </Reveal>
              )}

              <Reveal delay={0.2} className="mt-8 flex items-center gap-2 text-sm text-white/50">
                <MapPin size={16} className="text-turquoise-400" />
                {site.location}
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div className="sticky top-28 rounded-3xl border border-turquoise-500/20 bg-gradient-to-b from-graphite-900 to-black p-6">
                <p className="text-[11px] uppercase tracking-widest text-white/40">
                  Valor
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-white">
                  {formatPrice(vehicle.price)}
                </p>

                <a
                  href={whatsappUrlForVehicle(vehicle.fullName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                  className="mt-6 flex items-center justify-center gap-2 rounded-full bg-turquoise-500 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-black transition-colors hover:bg-turquoise-400"
                >
                  <MessageCircle size={16} />
                  Falar no WhatsApp
                </a>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-white/35">
                  Tenho interesse neste veículo — a Zequinha responde
                  rapidamente pelo WhatsApp.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
