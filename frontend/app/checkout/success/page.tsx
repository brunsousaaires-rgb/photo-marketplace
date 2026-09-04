'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import { apiFetch, downloadUrl } from '@/lib/api';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [attempts, setAttempts] = useState(0);
  const clearCart = useCartStore((s) => s.clear);

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await apiFetch<{ order: Order }>(`/payments/orders/${orderId}`);
        if (cancelled) return;
        setOrder(res.order);
        if (res.order.status === 'PENDING' && attempts < 8) {
          setTimeout(() => setAttempts((a) => a + 1), 1500);
        }
      } catch {
        // ignora, tentará novamente
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId, attempts]);

  if (!orderId) {
    return <div className="container-page py-24 text-center text-ink-900/50">Pedido não encontrado.</div>;
  }

  if (!order) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center text-ink-900/50">
        <Loader2 className="mb-3 h-6 w-6 animate-spin" /> Confirmando pagamento...
      </div>
    );
  }

  if (order.status === 'PENDING') {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <Loader2 className="mb-3 h-6 w-6 animate-spin text-ink-900/50" />
        <p className="text-ink-900/60">Aguardando confirmação do pagamento...</p>
      </div>
    );
  }

  if (order.status === 'FAILED') {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <p className="text-red-600">O pagamento não foi concluído.</p>
        <Link href="/cart" className="mt-4 text-sm font-medium text-ink-950 underline">
          Voltar ao carrinho
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col items-center py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-display text-3xl uppercase tracking-wide text-ink-950">Pagamento confirmado!</h1>
      <p className="mt-1 text-ink-900/50">Suas fotos em HD já estão liberadas para download.</p>

      <div className="mt-8 w-full max-w-xl divide-y divide-black/5 rounded-2xl border border-black/5 bg-white text-left shadow-card">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-ink-950">{item.photo.title}</p>
              <p className="text-sm text-ink-900/50">{formatPrice(item.price)}</p>
            </div>
            <a href={downloadUrl(item.photo.id)} target="_blank" rel="noreferrer">
              <Button variant="secondary" size="sm">
                <Download className="h-4 w-4" /> Baixar HD
              </Button>
            </a>
          </div>
        ))}
      </div>

      <Link href="/orders" className="mt-6 text-sm font-medium text-ink-950 underline">
        Ver todas as minhas compras
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center text-ink-900/50">Carregando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
