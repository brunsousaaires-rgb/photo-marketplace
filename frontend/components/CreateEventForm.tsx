'use client';

import { useState } from 'react';
import { CalendarDays, MapPin, Trophy, UploadCloud, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input, Label } from './ui/input';
import { apiFetch } from '@/lib/api';
import { ApiRequestError } from '@/lib/auth-context';
import { toast } from '@/lib/toast-store';
import { SPORTS } from '@/lib/sports';
import type { SportEvent } from '@/lib/types';

export function CreateEventForm({ onCreated }: { onCreated: (event: SportEvent) => void }) {
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState(SPORTS[0].slug);
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleCover(file: File | null) {
    setCover(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('sport', sport);
      formData.append('location', location);
      formData.append('eventDate', eventDate);
      if (cover) formData.append('cover', cover);

      const res = await apiFetch<{ event: SportEvent }>('/events', { method: 'POST', body: formData });
      toast({ title: 'Evento criado!', description: res.event.title, variant: 'success' });
      onCreated(res.event);
      setTitle('');
      setLocation('');
      setEventDate('');
      handleCover(null);
    } catch (err) {
      toast({
        title: 'Não foi possível criar o evento',
        description: err instanceof ApiRequestError ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Capa do evento (opcional)</Label>
        {coverPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-ink-900/10">
            <img src={coverPreview} alt="Capa" className="max-h-48 w-full object-cover" />
            <button
              type="button"
              onClick={() => handleCover(null)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-900/15 py-6 text-center transition hover:border-accent-500 hover:bg-accent-500/5">
            <UploadCloud className="h-6 w-6 text-ink-900/40" />
            <span className="text-sm font-medium text-ink-900/70">Escolher imagem de capa</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleCover(e.target.files?.[0] ?? null)} />
          </label>
        )}
      </div>

      <div>
        <Label htmlFor="title">Nome do evento</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: 2º Open Cristal de Futevôlei" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sport">
            <Trophy className="mr-1 inline h-3.5 w-3.5" /> Esporte
          </Label>
          <select
            id="sport"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="h-11 w-full rounded-xl border border-ink-900/15 bg-white px-3.5 text-sm text-ink-950 outline-none transition focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15"
          >
            {SPORTS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="eventDate">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Data
          </Label>
          <Input id="eventDate" required type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="location">
          <MapPin className="mr-1 inline h-3.5 w-3.5" /> Local
        </Label>
        <Input id="location" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Praia do Gonzaga, Santos - SP" />
      </div>

      <Button type="submit" variant="secondary" size="lg" className="w-full" loading={loading}>
        Criar evento
      </Button>
    </form>
  );
}
