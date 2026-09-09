'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';

export default function VehicleGallery({ vehicle }: { vehicle: Vehicle }) {
  const [active, setActive] = useState(0);

  function go(dir: 1 | -1) {
    setActive((prev) => (prev + dir + vehicle.images.length) % vehicle.images.length);
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface sm:aspect-[16/9]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={vehicle.images[active]}
              alt={`${vehicle.brand} ${vehicle.model} — foto ${active + 1}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {vehicle.images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              data-cursor="explore"
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-ink backdrop-blur transition-colors hover:bg-gold hover:text-bg"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Próxima foto"
              data-cursor="explore"
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-ink backdrop-blur transition-colors hover:bg-gold hover:text-bg"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {vehicle.images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {vehicle.images.map((image, i) => (
            <button
              key={image}
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                active === i ? 'border-gold' : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={image} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
