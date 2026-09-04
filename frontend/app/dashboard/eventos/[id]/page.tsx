'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, Trash2 } from 'lucide-react';
import { apiFetch, resolveFileUrl } from '@/lib/api';
import type { Photo, PhotoListResponse, SportEvent } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { MultiUploadForm } from '@/components/MultiUploadForm';
import { sportInfo } from '@/lib/sports';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/lib/toast-store';

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function ManageEventPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<SportEvent | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    apiFetch<{ event: SportEvent }>(`/events/${id}`)
      .then((res) => setEvent(res.event))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
    apiFetch<PhotoListResponse>(`/photos?eventId=${id}&pageSize=200`, { auth: false })
      .then((res) => setPhotos(res.items))
      .catch(() => setPhotos([]));
  }, [id, user, authLoading]);

  async function handleDelete(photoId: string) {
    if (!confirm('Remover esta foto do evento?')) return;
    try {
      await apiFetch(`/photos/${photoId}`, { method: 'DELETE' });
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast({ title: 'Foto removida', variant: 'success' });
    } catch {
      toast({ title: 'Não foi possível remover a foto', variant: 'error' });
    }
  }

  if (authLoading || loading) {
    return <div className="container-page py-24 text-center text-ink-900/50">Carregando...</div>;
  }

  if (!user || user.role !== 'PHOTOGRAPHER') {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <p className="text-ink-900/60">Esta área é exclusiva para contas de fotógrafo.</p>
        <Link href="/login" className="mt-4 text-sm font-medium text-ink-950 underline">
          Entrar
        </Link>
      </div>
    );
  }

  if (!event || event.photographer?.id !== user.id) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-ink-900/60">Evento não encontrado.</p>
        <Link href="/dashboard" className="mt-3 inline-block text-sm font-medium text-ink-950 underline">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  const sport = sportInfo(event.sport);

  return (
    <div className="container-page py-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-900/60 hover:text-ink-950">
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-accent-600">
        {sport.emoji} {sport.label}
      </span>
      <h1 className="mt-3 font-display text-3xl uppercase tracking-wide text-ink-950">{event.title}</h1>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-900/50">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" /> {formatEventDate(event.eventDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> {event.location}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
        <Card className="h-fit p-6">
          <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-ink-950">Adicionar fotos</h2>
          <MultiUploadForm eventId={event.id} onUploaded={(photo) => setPhotos((prev) => [photo, ...prev])} />
        </Card>

        <div>
          <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-ink-950">
            Fotos publicadas ({photos.length})
          </h2>
          {photos.length === 0 ? (
            <p className="text-ink-900/50">Nenhuma foto publicada ainda neste evento.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="relative aspect-[4/3] w-full bg-ink-900">
                    <Image src={resolveFileUrl(photo.thumbUrl)} alt={photo.title} fill className="object-cover" />
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-sm font-medium text-ink-950">{photo.title}</p>
                    <div className="mt-0.5 flex items-center justify-between text-xs text-ink-900/50">
                      <span>{formatPrice(photo.price)}</span>
                      <span>{photo.downloads} downloads</span>
                    </div>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
