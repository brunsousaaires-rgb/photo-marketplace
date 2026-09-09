'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import type { Seller } from '@/types/seller';
import { sellerContactLink } from '@/lib/whatsapp';

export default function SellerCard({ seller, index = 0 }: { seller: Seller; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl bg-surface"
    >
      <div className="relative aspect-[3/4]">
        <Image
          src={seller.image}
          alt={seller.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover grayscale transition-all duration-700 ease-cinematic group-hover:grayscale-0 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display text-2xl uppercase text-ink">{seller.name}</h3>
        <p className="text-xs uppercase tracking-widest text-gold">{seller.role}</p>
        {seller.bio && <p className="mt-2 text-xs text-ink-muted">{seller.bio}</p>}
        <a
          href={sellerContactLink(seller.name, seller.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="explore"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-bg"
        >
          <MessageCircle size={13} />
          Falar com {seller.name.split(' ')[0]}
        </a>
      </div>
    </motion.div>
  );
}
