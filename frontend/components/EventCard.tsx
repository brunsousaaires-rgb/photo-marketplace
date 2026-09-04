import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Images, MapPin } from 'lucide-react';
import type { SportEvent } from '@/lib/types';
import { resolveFileUrl } from '@/lib/api';
import { sportInfo } from '@/lib/sports';
import { cn, formatPrice } from '@/lib/utils';

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function EventCard({ event }: { event: SportEvent }) {
  const sport = sportInfo(event.sport);

  return (
    <Link href={`/eventos/${event.id}`} className="group block animate-fade-up">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink-900">
        {event.coverUrl ? (
          <Image
            src={resolveFileUrl(event.coverUrl)}
            alt={event.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">{sport.emoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <span className="absolute left-2.5 right-2.5 top-2.5 flex items-center justify-between gap-1.5">
          <span className="max-w-[70%] truncate rounded-full bg-accent-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950 sm:px-2.5 sm:text-[11px]">
            {sport.emoji} {sport.label}
          </span>
          {event.photoCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur sm:text-[11px]">
              <Images className="h-3 w-3" /> {event.photoCount}
            </span>
          )}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-2.5 text-white sm:p-3.5">
          <p className="line-clamp-1 font-display text-base uppercase leading-tight tracking-wide sm:text-lg">{event.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/75 sm:text-xs">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {formatEventDate(event.eventDate)}
            </span>
            <span className="line-clamp-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" /> {event.location}
            </span>
          </div>
        </div>
      </div>

      <div className={cn('mt-2.5 flex items-center justify-between text-sm', event.fromPrice == null && 'opacity-0')}>
        <span className="text-ink-900/50">{event.photographer?.name}</span>
        {event.fromPrice != null && (
          <span className="font-bold text-ink-950">
            a partir de <span className="text-accent-600">{formatPrice(event.fromPrice)}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
