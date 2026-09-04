'use client';

import { useRef, useState } from 'react';
import { UploadCloud, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { apiFetch } from '@/lib/api';
import type { Photo } from '@/lib/types';
import { toast } from '@/lib/toast-store';
import { ApiRequestError } from '@/lib/auth-context';

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  price: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

function titleFromFilename(name: string) {
  const base = name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function MultiUploadForm({ eventId, defaultPrice = '24.90', onUploaded }: { eventId: string; defaultPrice?: string; onUploaded: (photo: Photo) => void }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const items: QueueItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      title: titleFromFilename(file.name),
      price: defaultPrice,
      status: 'pending',
    }));
    setQueue((prev) => [...prev, ...items]);
  }

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((it) => it.id !== id));
  }

  async function handleSendAll() {
    setSending(true);
    const pending = queue.filter((it) => it.status === 'pending' || it.status === 'error');

    for (const item of pending) {
      updateItem(item.id, { status: 'uploading', error: undefined });
      try {
        const formData = new FormData();
        formData.append('image', item.file);
        formData.append('eventId', eventId);
        formData.append('title', item.title || titleFromFilename(item.file.name));
        formData.append('price', item.price);

        const res = await apiFetch<{ photo: Photo }>('/photos', { method: 'POST', body: formData });
        updateItem(item.id, { status: 'done' });
        onUploaded(res.photo);
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : 'Falha no envio.';
        updateItem(item.id, { status: 'error', error: message });
      }
    }

    setSending(false);
    const remaining = queue.filter((it) => it.status !== 'done');
    if (remaining.length === 0) {
      toast({ title: 'Fotos publicadas!', variant: 'success' });
    }
  }

  const pendingCount = queue.filter((it) => it.status === 'pending' || it.status === 'error').length;
  const doneCount = queue.filter((it) => it.status === 'done').length;

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-900/15 py-10 text-center transition hover:border-accent-500 hover:bg-accent-500/5">
        <UploadCloud className="h-7 w-7 text-ink-900/40" />
        <span className="text-sm font-medium text-ink-900/70">Clique para escolher uma ou várias fotos</span>
        <span className="text-xs text-ink-900/40">JPG, PNG ou WEBP — até 25MB cada</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </label>

      {queue.length > 0 && (
        <>
          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-ink-900/10 bg-white p-2.5">
                <img src={item.previewUrl} alt={item.title} className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5 sm:grid-cols-[1fr_100px]">
                  <Input
                    value={item.title}
                    disabled={item.status === 'uploading' || item.status === 'done'}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    value={item.price}
                    disabled={item.status === 'uploading' || item.status === 'done'}
                    onChange={(e) => updateItem(item.id, { price: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex w-16 shrink-0 items-center justify-end gap-2">
                  {item.status === 'pending' && (
                    <button type="button" onClick={() => removeItem(item.id)} className="text-ink-900/40 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-accent-600" />}
                  {item.status === 'done' && <Check className="h-4 w-4 text-emerald-600" />}
                  {item.status === 'error' && (
                    <span title={item.error}>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button variant="secondary" size="lg" className="w-full" loading={sending} disabled={pendingCount === 0} onClick={handleSendAll}>
            {doneCount > 0 && pendingCount === 0
              ? `${doneCount} foto${doneCount === 1 ? '' : 's'} publicada${doneCount === 1 ? '' : 's'}`
              : `Publicar ${pendingCount} foto${pendingCount === 1 ? '' : 's'}`}
          </Button>
        </>
      )}
    </div>
  );
}
