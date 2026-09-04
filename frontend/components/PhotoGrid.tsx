import type { Photo } from '@/lib/types';
import { PhotoCard } from './PhotoCard';
import { ImageOff } from 'lucide-react';

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-900/15 py-24 text-center">
        <ImageOff className="mb-3 h-8 w-8 text-ink-900/30" />
        <p className="font-medium text-ink-900/70">Nenhuma foto encontrada</p>
        <p className="text-sm text-ink-900/40">Tente ajustar a busca ou os filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}
