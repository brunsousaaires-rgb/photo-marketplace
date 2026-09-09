'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { categories } from '@/data/vehicles';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

export default function CategoryShowcase() {
  return (
    <section id="modelos" className="relative bg-bg-elevated px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel index="02">Modelos</SectionLabel>
          <h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl">
            Qual combina com você?
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className={i === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}
            >
              <Link
                href={`/veiculos?categoria=${encodeURIComponent(category.key)}`}
                data-cursor="explore"
                className="group relative block aspect-[16/10] overflow-hidden rounded-2xl bg-surface"
              >
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-70 transition-all duration-[1200ms] ease-cinematic group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-end justify-between p-6">
                  <span className="font-display text-4xl uppercase text-ink transition-transform duration-500 group-hover:-translate-y-1 sm:text-5xl">
                    {category.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-gold opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    Explorar
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
