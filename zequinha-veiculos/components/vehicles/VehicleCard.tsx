"use client";

import Link from "next/link";
import Image from "next/image";
import { Car, ArrowUpRight } from "lucide-react";
import { Vehicle } from "@/data/vehicles";
import { formatKm, formatPrice } from "@/lib/utils";
import { whatsappUrlForVehicle } from "@/lib/whatsapp";
import { TiltCard } from "../ui/TiltCard";

export function VehicleCard({ vehicle, index = 0 }: { vehicle: Vehicle; index?: number }) {
  return (
    <TiltCard
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-graphite-900 transition-colors duration-500 hover:border-turquoise-400/30"
      style={{ transitionDelay: `${index * 40}ms` } as React.CSSProperties}
    >
      <Link
        href={`/estoque/${vehicle.slug}`}
        data-cursor="view"
        className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-b from-graphite-800 to-black"
      >
        {vehicle.hasRealPhotos && vehicle.images[0] ? (
          <Image
            src={vehicle.images[0]}
            alt={vehicle.fullName}
            fill
            className="object-cover transition-transform duration-700 ease-cinematic group-hover:scale-110"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/25">
            <Car size={40} strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-widest">Fotos em breve</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="absolute left-0 top-0 h-[2px] w-0 bg-turquoise-400 transition-all duration-500 group-hover:w-full" />

        {vehicle.status !== "disponivel" && (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[10px] uppercase tracking-widest text-white/80 backdrop-blur">
            {vehicle.status === "reservado" ? "Reservado" : "Vendido"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-turquoise-400/80">
            {vehicle.brand}
          </p>
          <h3 className="font-display text-lg font-semibold text-white">{vehicle.model}</h3>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] text-white/55">
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <dt>Ano</dt>
            <dd className="text-white/80">{vehicle.year ?? "Consulte"}</dd>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <dt>KM</dt>
            <dd className="text-white/80">
              {vehicle.mileageKm !== null ? formatKm(vehicle.mileageKm) : "Consulte"}
            </dd>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <dt>Câmbio</dt>
            <dd className="text-white/80">{vehicle.transmission ?? "Consulte"}</dd>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <dt>Combustível</dt>
            <dd className="text-white/80">{vehicle.fuel ?? "Consulte"}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-lg font-bold text-white">
            {formatPrice(vehicle.price)}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={whatsappUrlForVehicle(vehicle.fullName)}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="rounded-full border border-white/15 px-3.5 py-2 text-[11px] font-medium uppercase tracking-wide text-white/80 transition-colors hover:border-turquoise-400/60 hover:text-turquoise-300"
            >
              Interesse
            </a>
            <Link
              href={`/estoque/${vehicle.slug}`}
              data-cursor="link"
              className="flex items-center gap-1 rounded-full bg-white/5 px-3.5 py-2 text-[11px] font-medium uppercase tracking-wide text-white transition-colors hover:bg-turquoise-500 hover:text-black"
            >
              Ver
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
