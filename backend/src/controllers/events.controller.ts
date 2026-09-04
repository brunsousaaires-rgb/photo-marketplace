import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { prisma } from '../config/db';
import { ApiError } from '../middleware/errorHandler';
import { SPORT_SLUGS } from '../utils/sports';
import { createThumbnail } from '../utils/watermark';
import { deleteObject, publicUrl, saveObject } from '../utils/storage';

function serializeEvent(event: any, minPrice?: number | null) {
  const cover = event.coverKey ?? event.photos?.[0]?.thumbKey ?? null;
  return {
    id: event.id,
    title: event.title,
    sport: event.sport,
    location: event.location,
    eventDate: event.eventDate,
    coverUrl: cover ? publicUrl(cover) : null,
    photoCount: event._count?.photos ?? event.photos?.length ?? 0,
    fromPrice: minPrice ?? null,
    photographer: event.photographer
      ? { id: event.photographer.id, name: event.photographer.name, avatarUrl: event.photographer.avatarUrl }
      : undefined,
    createdAt: event.createdAt,
  };
}

const listQuerySchema = z.object({
  q: z.string().optional(),
  sport: z.string().optional(),
  sort: z.enum(['recent', 'date_desc', 'date_asc']).optional().default('date_desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(48).optional().default(12),
});

export async function listEvents(req: Request, res: Response) {
  const { q, sport, sort, page, pageSize } = listQuerySchema.parse(req.query);

  const where: any = {};
  if (sport && sport !== 'todos') where.sport = sport;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
    ];
  }

  const orderBy = sort === 'recent' ? { createdAt: 'desc' as const } : sort === 'date_asc' ? { eventDate: 'asc' as const } : { eventDate: 'desc' as const };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        photographer: true,
        photos: { take: 1, orderBy: { createdAt: 'asc' }, select: { thumbKey: true } },
        _count: { select: { photos: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  const prices = events.length
    ? await prisma.photo.groupBy({ by: ['eventId'], where: { eventId: { in: events.map((e) => e.id) } }, _min: { price: true } })
    : [];
  const priceByEvent = new Map(prices.map((p) => [p.eventId, p._min.price ? Number(p._min.price) : null]));

  res.json({
    items: events.map((e) => serializeEvent(e, priceByEvent.get(e.id))),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function getSports(_req: Request, res: Response) {
  const rows = await prisma.event.groupBy({ by: ['sport'], _count: { sport: true } });
  res.json({
    sports: rows.map((r) => ({ slug: r.sport, count: r._count.sport })).sort((a, b) => b.count - a.count),
  });
}

export async function getEvent(req: Request, res: Response) {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { photographer: true, photos: { take: 1, orderBy: { createdAt: 'asc' }, select: { thumbKey: true } }, _count: { select: { photos: true } } },
  });
  if (!event) throw new ApiError(404, 'Evento não encontrado.');

  const priceAgg = await prisma.photo.aggregate({ where: { eventId: event.id }, _min: { price: true } });

  res.json({ event: serializeEvent(event, priceAgg._min.price ? Number(priceAgg._min.price) : null) });
}

const createEventSchema = z.object({
  title: z.string().min(2, 'Dê um nome ao evento.'),
  sport: z.enum(SPORT_SLUGS as [string, ...string[]], { errorMap: () => ({ message: 'Selecione um esporte válido.' }) }),
  location: z.string().min(2, 'Informe o local do evento.'),
  eventDate: z.coerce.date({ errorMap: () => ({ message: 'Informe a data do evento.' }) }),
});

export async function createEvent(req: Request, res: Response) {
  const data = createEventSchema.parse(req.body);

  let coverKey: string | undefined;
  if (req.file) {
    const id = uuid();
    const thumb = await createThumbnail(req.file.buffer, 900);
    coverKey = `covers/${id}.jpg`;
    await saveObject(coverKey, thumb.buffer, 'image/jpeg');
  }

  const event = await prisma.event.create({
    data: {
      photographerId: req.user!.userId,
      title: data.title,
      sport: data.sport,
      location: data.location,
      eventDate: data.eventDate,
      coverKey,
    },
    include: { photographer: true, photos: true, _count: { select: { photos: true } } },
  });

  res.status(201).json({ event: serializeEvent(event, null) });
}

export async function myEvents(req: Request, res: Response) {
  const events = await prisma.event.findMany({
    where: { photographerId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: { photographer: true, photos: { take: 1, orderBy: { createdAt: 'asc' }, select: { thumbKey: true } }, _count: { select: { photos: true } } },
  });
  res.json({ items: events.map((e) => serializeEvent(e, null)) });
}

export async function deleteEvent(req: Request, res: Response) {
  const event = await prisma.event.findUnique({ where: { id: req.params.id }, include: { photos: true } });
  if (!event) throw new ApiError(404, 'Evento não encontrado.');
  if (event.photographerId !== req.user!.userId) throw new ApiError(403, 'Você não pode remover este evento.');

  await prisma.event.delete({ where: { id: event.id } });

  const fileDeletions = event.photos.flatMap((p) => [deleteObject(p.originalKey), deleteObject(p.previewKey), deleteObject(p.thumbKey)]);
  if (event.coverKey) fileDeletions.push(deleteObject(event.coverKey));
  await Promise.allSettled(fileDeletions);

  res.status(204).send();
}
