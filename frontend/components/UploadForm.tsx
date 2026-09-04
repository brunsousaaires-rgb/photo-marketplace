'use client';

import { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input, Label, Textarea } from './ui/input';
import { apiFetch } from '@/lib/api';
import type { Photo } from '@/lib/types';
import { toast } from '@/lib/toast-store';
import { ApiRequestError } from '@/lib/auth-context';

const CATEGORIES = ['natureza', 'retrato', 'urbano', 'eventos', 'produtos', 'outros'];

export function UploadForm({ onUploaded }: { onUploaded: (photo: Photo) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('natureza');
  const [price, setPrice] = useState('39.90');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast({ title: 'Selecione uma imagem', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);

      const res = await apiFetch<{ photo: Photo }>('/photos', { method: 'POST', body: formData });
      toast({ title: 'Foto publicada!', description: res.photo.title, variant: 'success' });
      onUploaded(res.photo);
      setTitle('');
      setDescription('');
      setPrice('39.90');
      handleFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Não foi possível enviar a foto.';
      toast({ title: 'Erro no upload', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label>Imagem</Label>
        {preview ? (
          <div className="relative overflow-hidden rounded-xl border border-ink-900/10">
            <img src={preview} alt="Pré-visualização" className="max-h-72 w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                handleFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-900/15 py-10 text-center transition hover:border-accent-500 hover:bg-accent-500/5">
            <UploadCloud className="h-7 w-7 text-ink-900/40" />
            <span className="text-sm font-medium text-ink-900/70">Clique para escolher uma imagem</span>
            <span className="text-xs text-ink-900/40">JPG, PNG ou WEBP — até 25MB</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Amanhecer na serra" />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes sobre a foto, local, equipamento..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-xl border border-ink-900/15 bg-white px-3.5 text-sm text-ink-950 outline-none transition focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" required type="number" step="0.01" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>

      <Button type="submit" variant="secondary" size="lg" className="w-full" loading={loading}>
        Publicar foto
      </Button>
    </form>
  );
}
