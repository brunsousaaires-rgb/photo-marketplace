"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ArrowUpRight, Car } from "lucide-react";
import { getFeaturedVehicles } from "@/data/vehicles";
import { formatKm, formatPrice } from "@/lib/utils";
import { Reveal } from "../ui/Reveal";

function FeaturedRow({ vehicle, reverse }: { vehicle: ReturnType<typeof getFeaturedVehicles>[number]; reverse?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 30%"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const hasImage = vehicle.hasRealPhotos && vehicle.images[0];

  // Parallax da foto (GSAP ScrollTrigger, scrub): a imagem se move mais
  // devagar que o card enquanto rola, dando profundidade real — o efeito
  // de scroll que mais impressiona por menos esforço num site de venda.
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion || !imageWrapRef.current || !ref.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageWrapRef.current,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "start end",
            end: "end start",
            scrub: 0.6,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.4fr_1fr] ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <motion.div
        style={{ scale }}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-graphite-800 to-black lg:aspect-[16/11]"
      >
        {hasImage ? (
          <div ref={imageWrapRef} className="absolute inset-x-0 -inset-y-[10%]">
            <Image
              src={vehicle.images[0]}
              alt={vehicle.fullName}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/20">
            <Car size={48} strokeWidth={1} />
          </div>
        )}
      </motion.div>

      <div>
        <Reveal>
          <p className="text-[11px] uppercase tracking-widest2 text-turquoise-400">
            {vehicle.brand}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h3 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">
            {vehicle.model}
          </h3>
        </Reveal>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/55">
          <Reveal delay={0.12}>
            <span>{vehicle.year ?? "Ano a consultar"}</span>
          </Reveal>
          <Reveal delay={0.17}>
            <span>{vehicle.mileageKm !== null ? formatKm(vehicle.mileageKm) : "KM a consultar"}</span>
          </Reveal>
          <Reveal delay={0.22}>
            <span>{vehicle.transmission ?? "Câmbio a consultar"}</span>
          </Reveal>
        </div>

        <Reveal delay={0.3} className="mt-6">
          <span className="font-display text-2xl font-bold text-white">
            {formatPrice(vehicle.price)}
          </span>
        </Reveal>

        <Reveal delay={0.36} className="mt-8">
          <Link
            href={`/estoque/${vehicle.slug}`}
            data-cursor="link"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:border-turquoise-400/60 hover:text-turquoise-300"
          >
            Conhecer veículo
            <ArrowUpRight size={14} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}

export function FeaturedVehicle() {
  const featured = getFeaturedVehicles();
  if (featured.length === 0) return null;

  return (
    <section id="destaques" className="relative bg-graphite-900/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <p className="mb-3 text-[11px] uppercase tracking-widest2 text-turquoise-400">
            Destaques
          </p>
        </Reveal>
        <Reveal delay={0.05} className="mb-16 md:mb-24">
          <h2 className="max-w-2xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Veículos que merecem sua atenção.
          </h2>
        </Reveal>

        <div className="flex flex-col gap-24 md:gap-32">
          {featured.map((vehicle, i) => (
            <FeaturedRow key={vehicle.id} vehicle={vehicle} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
