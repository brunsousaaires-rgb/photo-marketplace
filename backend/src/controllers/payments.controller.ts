import { Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { ApiError } from '../middleware/errorHandler';

const stripe = env.stripe.secretKey ? new Stripe(env.stripe.secretKey) : null;

const checkoutSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos uma foto.'),
});

export async function createCheckoutSession(req: Request, res: Response) {
  const { photoIds } = checkoutSchema.parse(req.body);

  const photos = await prisma.photo.findMany({ where: { id: { in: photoIds } } });
  if (photos.length !== photoIds.length) throw new ApiError(404, 'Uma ou mais fotos não foram encontradas.');

  const total = photos.reduce((sum, p) => sum + Number(p.price), 0);

  const order = await prisma.order.create({
    data: {
      buyerId: req.user!.userId,
      status: 'PENDING',
      total,
      items: { create: photos.map((p) => ({ photoId: p.id, price: p.price })) },
    },
  });

  if (!stripe) {
    // Modo demo: sem chave Stripe configurada, marca o pedido como pago imediatamente
    // para permitir testar o fluxo completo de download em HD localmente.
    await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    return res.json({ demo: true, orderId: order.id, url: `${env.clientUrl}/checkout/success?order=${order.id}` });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: photos.map((p) => ({
      quantity: 1,
      price_data: {
        currency: 'brl',
        unit_amount: Math.round(Number(p.price) * 100),
        product_data: { name: p.title, description: 'Download em alta resolução — Photo Marketplace' },
      },
    })),
    success_url: `${env.clientUrl}/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/cart`,
    metadata: { orderId: order.id },
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });

  res.json({ demo: false, orderId: order.id, url: session.url });
}

export async function stripeWebhook(req: Request, res: Response) {
  if (!stripe || !env.stripe.webhookSecret) {
    return res.status(400).json({ error: 'Stripe não configurado.' });
  }

  const signature = req.headers['stripe-signature'];
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature as string, env.stripe.webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } }).catch(() => undefined);
    }
  }

  res.json({ received: true });
}

export async function getOrder(req: Request, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { photo: true } } },
  });
  if (!order || order.buyerId !== req.user!.userId) throw new ApiError(404, 'Pedido não encontrado.');
  res.json({ order: serializeOrder(order) });
}

export async function myOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { buyerId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { photo: true } } },
  });
  res.json({ items: orders.map(serializeOrder) });
}

function serializeOrder(order: any) {
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    items: order.items.map((it: any) => ({
      id: it.id,
      price: Number(it.price),
      photo: { id: it.photo.id, title: it.photo.title, category: it.photo.category },
    })),
  };
}
