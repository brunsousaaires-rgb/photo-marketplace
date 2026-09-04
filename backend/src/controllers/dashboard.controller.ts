import { Request, Response } from 'express';
import { prisma } from '../config/db';

export async function getDashboardStats(req: Request, res: Response) {
  const photographerId = req.user!.userId;

  const [photos, totalEvents] = await Promise.all([
    prisma.photo.findMany({ where: { photographerId } }),
    prisma.event.count({ where: { photographerId } }),
  ]);
  const photoIds = photos.map((p) => p.id);

  const paidItems = photoIds.length
    ? await prisma.orderItem.findMany({
        where: { photoId: { in: photoIds }, order: { status: 'PAID' } },
        include: { photo: true, order: true },
        orderBy: { order: { createdAt: 'desc' } },
      })
    : [];

  const totalRevenue = paidItems.reduce((sum, it) => sum + Number(it.price), 0);
  const totalSales = paidItems.length;
  const totalDownloads = photos.reduce((sum, p) => sum + p.downloads, 0);

  const salesByPhoto = new Map<string, { photoId: string; title: string; sales: number; revenue: number }>();
  for (const item of paidItems) {
    const entry = salesByPhoto.get(item.photoId) ?? { photoId: item.photoId, title: item.photo.title, sales: 0, revenue: 0 };
    entry.sales += 1;
    entry.revenue += Number(item.price);
    salesByPhoto.set(item.photoId, entry);
  }

  res.json({
    totalEvents,
    totalPhotos: photos.length,
    totalRevenue,
    totalSales,
    totalDownloads,
    topPhotos: [...salesByPhoto.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    recentSales: paidItems.slice(0, 10).map((it) => ({
      id: it.id,
      photoTitle: it.photo.title,
      price: Number(it.price),
      date: it.order.createdAt,
    })),
  });
}
