'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Gauge, CalendarDays } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { formatMileage, formatPrice } from '@/lib/utils';

export default function VehicleCard({ vehicle, index = 0 }: { vehicle: Vehicle; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/veiculos/${vehicle.slug}`}
        data-cursor="view"
        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-surface"
      >
        <Image
          src={vehicle.images[0]}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1200ms] ease-cinematic group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/95" />

        {vehicle.isPlaceholder && (
          <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-ink-muted backdrop-blur">
            Exemplo
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">{vehicle.brand}</p>
          <h3 className="mt-1 font-display text-3xl uppercase text-ink">{vehicle.model}</h3>

          <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} /> {vehicle.year}
            </span>
            <span className="flex items-center gap-1">
              <Gauge size={13} /> {formatMileage(vehicle.mileage)}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between overflow-hidden">
            <span className="font-display text-2xl text-ink">{formatPrice(vehicle.price)}</span>
            <span className="flex translate-y-8 items-center gap-1 text-xs font-semibold uppercase tracking-widest text-gold opacity-0 transition-all duration-500 ease-cinematic group-hover:translate-y-0 group-hover:opacity-100">
              Ver veículo
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
