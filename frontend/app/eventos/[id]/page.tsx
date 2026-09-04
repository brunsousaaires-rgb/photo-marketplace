'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CalendarDays, Images, MapPin, User as UserIcon } from 'lucide-react';
import { apiFetch, resolveFileUrl } from '@/lib/api';
import type { Photo, PhotoListResponse, SportEvent } from '@/lib/types';
import { PhotoGrid } from '@/components/PhotoGrid';
import { sportInfo } from '@/lib/sports';

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SportEvent | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ event: SportEvent }>(`/events/${id}`, { auth: false })
      .then((res) => setEvent(res.event))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
    apiFetch<PhotoListResponse>(`/photos?eventId=${id}&pageSize=200`, { auth: false })
      .then((res) => setPhotos(res.items))
      .catch(() => setPhotos([]));
  }, [id]);

  if (loading) {
    return <div className="container-page py-24 text-center text-ink-900/50">Carregando evento...</div>;
  }

  if (!event) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-ink-900/60">Evento não encontrado.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-ink-950 underline">
          Voltar para a busca
        </Link>
      </div>
    );
  }

  const sport = sportInfo(event.sport);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink-950">
        {event.coverUrl && (
          <div className="absolute inset-0">
            <Image src={resolveFileUrl(event.coverUrl)} alt={event.title} fill className="object-cover opacity-30" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/40" />

        <div className="container-page relative py-10 sm:py-14">
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Voltar para a busca
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink-950">
            {sport.emoji} {sport.label}
          </span>

          <h1 className="mt-4 font-display text-3xl uppercase leading-tight tracking-wide text-white text-balance sm:text-4xl lg:text-5xl">
            {event.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-accent-500" /> {formatEventDate(event.eventDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-accent-500" /> {event.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Images className="h-4 w-4 text-accent-500" /> {photos.length} foto{photos.length === 1 ? '' : 's'}
            </span>
            {event.photographer && (
              <span className="flex items-center gap-1.5">
                <UserIcon className="h-4 w-4 text-accent-500" /> {event.photographer.name}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <PhotoGrid photos={photos} />
      </section>
    </div>
  );
}
