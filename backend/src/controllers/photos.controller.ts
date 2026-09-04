import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { prisma } from '../config/db';
import { ApiError } from '../middleware/errorHandler';
import { createThumbnail, createWatermarkedPreview, readOriginalMeta } from '../utils/watermark';
import { deleteObject, publicUrl, readObjectStream, saveObject } from '../utils/storage';

function serializePhoto(photo: any) {
  return {
    id: photo.id,
    title: photo.title,
    description: photo.description,
    price: Number(photo.price),
    width: photo.width,
    height: photo.height,
    downloads: photo.downloads,
    createdAt: photo.createdAt,
    previewUrl: publicUrl(photo.previewKey),
    thumbUrl: publicUrl(photo.thumbKey),
    photographer: photo.photographer
      ? { id: photo.photographer.id, name: photo.photographer.name, avatarUrl: photo.photographer.avatarUrl }
      : undefined,
    event: photo.event
      ? { id: photo.event.id, title: photo.event.title, sport: photo.event.sport, location: photo.event.location, eventDate: photo.event.eventDate }
      : undefined,
  };
}

const listQuerySchema = z.object({
  q: z.string().optional(),
  sport: z.string().optional(),
  eventId: z.string().uuid().optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc']).optional().default('recent'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(24),
});

export async function listPhotos(req: Request, res: Response) {
  const { q, sport, eventId, sort, page, pageSize } = listQuerySchema.parse(req.query);

  const where: any = {};
  if (eventId) where.eventId = eventId;
  if (sport && sport !== 'todos') where.event = { sport };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { event: { title: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const orderBy =
    sort === 'price_asc' ? { price: 'asc' as const } : sort === 'price_desc' ? { price: 'desc' as const } : { createdAt: 'desc' as const };

  const [items, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { photographer: true, event: true },
    }),
    prisma.photo.count({ where }),
  ]);

  res.json({
    items: items.map(serializePhoto),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function getPhoto(req: Request, res: Response) {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id }, include: { photographer: true, event: true } });
  if (!photo) throw new ApiError(404, 'Foto não encontrada.');

  let purchased = false;
  if (req.user) {
    if (photo.photographerId === req.user.userId) {
      purchased = true;
    } else {
      const paidItem = await prisma.orderItem.findFirst({
        where: { photoId: photo.id, order: { buyerId: req.user.userId, status: 'PAID' } },
      });
      purchased = Boolean(paidItem);
    }
  }

  res.json({ photo: { ...serializePhoto(photo), purchased } });
}

const uploadSchema = z.object({
  eventId: z.string().uuid('Selecione um evento.'),
  title: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().positive('O preço deve ser maior que zero.'),
});

export async function uploadPhoto(req: Request, res: Response) {
  const data = uploadSchema.parse(req.body);
  const file = req.file;
  if (!file) throw new ApiError(400, 'Envie um arquivo de imagem.');

  const event = await prisma.event.findUnique({ where: { id: data.eventId } });
  if (!event) throw new ApiError(404, 'Evento não encontrado.');
  if (event.photographerId !== req.user!.userId) throw new ApiError(403, 'Este evento não pertence a você.');

  const id = uuid();
  const originalMeta = await readOriginalMeta(file.buffer);
  const preview = await createWatermarkedPreview(file.buffer);
  const thumb = await createThumbnail(file.buffer);

  const originalKey = `originals/${id}.jpg`;
  const previewKey = `previews/${id}.jpg`;
  const thumbKey = `thumbs/${id}.jpg`;

  await Promise.all([
    saveObject(originalKey, file.buffer, file.mimetype),
    saveObject(previewKey, preview.buffer, 'image/jpeg'),
    saveObject(thumbKey, thumb.buffer, 'image/jpeg'),
  ]);

  const photo = await prisma.photo.create({
    data: {
      id,
      photographerId: req.user!.userId,
      eventId: event.id,
      title: data.title,
      description: data.description,
      price: data.price,
      originalKey,
      previewKey,
      thumbKey,
      width: originalMeta.width || preview.width,
      height: originalMeta.height || preview.height,
    },
    include: { photographer: true, event: true },
  });

  res.status(201).json({ photo: serializePhoto(photo) });
}

export async function myPhotos(req: Request, res: Response) {
  const photos = await prisma.photo.findMany({
    where: { photographerId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: { photographer: true, event: true },
  });
  res.json({ items: photos.map(serializePhoto) });
}

export async function deletePhoto(req: Request, res: Response) {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
  if (!photo) throw new ApiError(404, 'Foto não encontrada.');
  if (photo.photographerId !== req.user!.userId) throw new ApiError(403, 'Você não pode remover esta foto.');

  await prisma.photo.delete({ where: { id: photo.id } });
  await Promise.allSettled([deleteObject(photo.originalKey), deleteObject(photo.previewKey), deleteObject(photo.thumbKey)]);

  res.status(204).send();
}

export async function downloadPhoto(req: Request, res: Response) {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
  if (!photo) throw new ApiError(404, 'Foto não encontrada.');

  const isOwner = photo.photographerId === req.user!.userId;

  if (!isOwner) {
    const paidItem = await prisma.orderItem.findFirst({
      where: {
        photoId: photo.id,
        order: { buyerId: req.user!.userId, status: 'PAID' },
      },
    });
    if (!paidItem) throw new ApiError(402, 'Compre esta foto para baixar a versão em HD.');
  }

  await prisma.photo.update({ where: { id: photo.id }, data: { downloads: { increment: 1 } } });

  const stream = await readObjectStream(photo.originalKey);
  res.setHeader('Content-Disposition', `attachment; filename="${photo.title.replace(/[^\w.-]+/g, '_')}.jpg"`);
  res.setHeader('Content-Type', 'image/jpeg');
  stream.pipe(res);
}
