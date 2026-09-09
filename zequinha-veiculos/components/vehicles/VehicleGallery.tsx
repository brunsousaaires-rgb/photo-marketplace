"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Car } from "lucide-react";
import { Vehicle } from "@/data/vehicles";
import { ToroSilhouette } from "./ToroSilhouette";

export function VehicleGallery({ vehicle }: { vehicle: Vehicle }) {
  const [index, setIndex] = useState(0);
  const isToroArt = vehicle.slug === "fiat-toro" && !vehicle.hasRealPhotos;
  const hasImages = vehicle.hasRealPhotos && vehicle.images.length > 0;

  if (!hasImages) {
    return (
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-graphite-800 to-black md:aspect-[21/9]">
        {isToroArt ? (
          <ToroSilhouette className="h-auto w-full max-w-3xl px-10" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/25">
            <Car size={56} strokeWidth={1} />
            <span className="text-xs uppercase tracking-widest">
              Galeria de fotos em breve
            </span>
          </div>
        )}
      </div>
    );
  }

  const goTo = (next: number) => {
    setIndex((next + vehicle.images.length) % vehicle.images.length);
  };

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/8 bg-black md:aspect-[21/9]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={vehicle.images[index]}
              alt={`${vehicle.fullName} — foto ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        {vehicle.images.length > 1 && (
          <>
            <button
              aria-label="Foto anterior"
              onClick={() => goTo(index - 1)}
              data-cursor="link"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-turquoise-500 hover:text-black"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label="Próxima foto"
              onClick={() => goTo(index + 1)}
              data-cursor="link"
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-turquoise-500 hover:text-black"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {vehicle.images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {vehicle.images.map((img, i) => (
            <button
              key={img}
              onClick={() => setIndex(i)}
              data-cursor="link"
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                i === index ? "border-turquoise-400" : "border-white/10 opacity-60"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
