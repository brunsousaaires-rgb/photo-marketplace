'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, PackageOpen } from 'lucide-react';
import { apiFetch, downloadUrl } from '@/lib/api';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatPrice } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const STATUS_LABEL: Record<Order['status'], { label: string; className: string }> = {
  PAID: { label: 'Pago', className: 'bg-emerald-50 text-emerald-700' },
  PENDING: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
  FAILED: { label: 'Falhou', className: 'bg-red-50 text-red-700' },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    apiFetch<{ items: Order[] }>('/payments/orders')
      .then((res) => setOrders(res.items))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <p className="text-ink-900/60">Entre na sua conta para ver suas compras.</p>
        <Link href="/login" className="mt-4 text-sm font-medium text-ink-950 underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-medium text-ink-950">Minhas compras</h1>
      <p className="mt-1 text-ink-900/50">Baixe suas fotos em HD sempre que precisar.</p>

      {loading ? (
        <p className="mt-8 text-ink-900/50">Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-ink-900/15 py-20 text-center">
          <PackageOpen className="mb-3 h-8 w-8 text-ink-900/30" />
          <p className="text-ink-900/60">Você ainda não comprou nenhuma foto.</p>
          <Link href="/" className="mt-4">
            <Button variant="secondary">Explorar fotos</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-black/5 bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-900/50">Pedido #{order.id.slice(0, 8)}</span>
                  <Badge className={STATUS_LABEL[order.status].className}>{STATUS_LABEL[order.status].label}</Badge>
                </div>
                <span className="text-sm text-ink-900/50">{formatDate(order.createdAt)}</span>
              </div>
              <div className="divide-y divide-black/5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium text-ink-950">{item.photo.title}</p>
                      <p className="text-sm text-ink-900/50">{formatPrice(item.price)}</p>
                    </div>
                    {order.status === 'PAID' && (
                      <a href={downloadUrl(item.photo.id)} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" /> Baixar HD
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-black/5 p-4">
                <span className="font-semibold text-ink-950">Total: {formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
