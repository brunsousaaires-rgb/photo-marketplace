'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, Download, Lock, ShoppingBag, ArrowLeft, Ruler, CalendarDays, MapPin } from 'lucide-react';
import { apiFetch, resolveFileUrl, downloadUrl } from '@/lib/api';
import type { Photo } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/lib/toast-store';
import { sportInfo } from '@/lib/sports';
import Link from 'next/link';

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function PhotoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const add = useCartStore((s) => s.add);
  const has = useCartStore((s) => (photo ? s.has(photo.id) : false));

  useEffect(() => {
    apiFetch<{ photo: Photo }>(`/photos/${id}`, { auth: !!user })
      .then((res) => setPhoto(res.photo))
      .catch(() => setPhoto(null))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading) {
    return <div className="container-page py-24 text-center text-ink-900/50">Carregando...</div>;
  }

  if (!photo) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-ink-900/60">Foto não encontrada.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-ink-950 underline">
          Voltar para a busca
        </Link>
      </div>
    );
  }

  const sport = photo.event ? sportInfo(photo.event.sport) : null;

  function handleAdd() {
    if (!photo) return;
    add(photo);
    toast({ title: 'Adicionado ao carrinho', description: photo.title, variant: 'success' });
  }

  return (
    <div className="container-page py-10 pb-24 sm:pb-10">
      <Link
        href={photo.event ? `/eventos/${photo.event.id}` : '/'}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-900/60 hover:text-ink-950"
      >
        <ArrowLeft className="h-4 w-4" /> {photo.event ? `Voltar para ${photo.event.title}` : 'Voltar para a busca'}
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900">
          <div className="relative aspect-[4/3] w-full">
            <Image src={resolveFileUrl(photo.previewUrl)} alt={photo.title} fill className="object-contain" priority />
          </div>
          {!photo.purchased && (
            <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Lock className="h-3.5 w-3.5" /> Pré-visualização com marca d’água
            </span>
          )}
        </div>

        <div>
          {sport && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-accent-600">
              {sport.emoji} {sport.label}
            </span>
          )}
          <h1 className="font-display text-3xl uppercase tracking-wide text-ink-950">{photo.title}</h1>
          {photo.description && <p className="mt-3 text-ink-900/60">{photo.description}</p>}

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-900/60">
            {photo.event && (
              <>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> {formatEventDate(photo.event.eventDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {photo.event.location}
                </span>
              </>
            )}
            <span className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4" /> {photo.width} × {photo.height}px
            </span>
          </div>

          <div className="mt-8 hidden rounded-2xl border border-black/5 bg-white p-6 shadow-card sm:block">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-900/50">Download em HD</span>
              <span className="font-display text-3xl text-ink-950">{formatPrice(photo.price)}</span>
            </div>

            {photo.purchased ? (
              <a href={downloadUrl(photo.id)} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg" className="mt-5 w-full">
                  <Download className="h-4 w-4" /> Baixar em HD
                </Button>
              </a>
            ) : (
              <div className="mt-5 flex flex-col gap-3">
                <Button variant="secondary" size="lg" className="w-full" disabled={has} onClick={handleAdd}>
                  {has ? (
                    <>
                      <Check className="h-4 w-4" /> No carrinho
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" /> Adicionar ao carrinho
                    </>
                  )}
                </Button>
                {has && (
                  <Button variant="outline" size="lg" className="w-full" onClick={() => router.push('/cart')}>
                    Ir para o carrinho
                  </Button>
                )}
              </div>
            )}

            <p className="mt-4 text-center text-xs text-ink-900/40">
              A imagem em alta resolução, sem marca d’água, é liberada imediatamente após a confirmação do pagamento.
            </p>
          </div>
        </div>
      </div>

      {/* Barra fixa de compra no mobile, acima da navegação inferior */}
      <div className="fixed inset-x-0 bottom-16 z-40 flex items-center gap-3 border-t border-black/10 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-ink-900/50">Download em HD</p>
          <p className="font-display text-lg text-ink-950">{formatPrice(photo.price)}</p>
        </div>
        {photo.purchased ? (
          <a href={downloadUrl(photo.id)} target="_blank" rel="noreferrer" className="shrink-0">
            <Button variant="secondary">
              <Download className="h-4 w-4" /> Baixar
            </Button>
          </a>
        ) : has ? (
          <Button variant="secondary" className="shrink-0" onClick={() => router.push('/cart')}>
            Ver carrinho
          </Button>
        ) : (
          <Button variant="secondary" className="shrink-0" onClick={handleAdd}>
            <ShoppingBag className="h-4 w-4" /> Comprar
          </Button>
        )}
      </div>
    </div>
  );
}
