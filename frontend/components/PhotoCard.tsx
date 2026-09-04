'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Check, Lock } from 'lucide-react';
import type { Photo } from '@/lib/types';
import { resolveFileUrl } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { toast } from '@/lib/toast-store';

export function PhotoCard({ photo }: { photo: Photo }) {
  const add = useCartStore((s) => s.add);
  const has = useCartStore((s) => s.has(photo.id));

  return (
    <div className="group animate-fade-up">
      <Link href={`/photos/${photo.id}`} className="block overflow-hidden rounded-2xl bg-ink-900">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={resolveFileUrl(photo.thumbUrl)}
            alt={photo.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition group-hover:opacity-100" />
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <Lock className="h-3 w-3" /> Preview
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-accent-500 px-2.5 py-1 text-[11px] font-bold text-ink-950">
            {formatPrice(photo.price)}
          </span>
        </div>
      </Link>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/photos/${photo.id}`} className="line-clamp-1 font-medium text-ink-950 hover:underline">
            {photo.title}
          </Link>
          <p className="mt-0.5 text-sm text-ink-900/50">{photo.photographer?.name ?? 'Fotógrafo'}</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (has) return;
            add(photo);
            toast({ title: 'Adicionado ao carrinho', description: photo.title, variant: 'success' });
          }}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition',
            has ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-ink-900/10 bg-white text-ink-900 hover:border-accent-500 hover:text-accent-600'
          )}
          aria-label={has ? 'Já está no carrinho' : 'Adicionar ao carrinho'}
        >
          {has ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
