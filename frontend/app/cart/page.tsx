'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore, useCartTotal } from '@/lib/cart-store';
import { resolveFileUrl, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useAuth, ApiRequestError } from '@/lib/auth-context';
import { toast } from '@/lib/toast-store';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const total = useCartTotal();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ url: string }>('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ photoIds: items.map((i) => i.id) }),
      });
      window.location.href = res.url;
    } catch (err) {
      toast({
        title: 'Não foi possível iniciar o pagamento',
        description: err instanceof ApiRequestError ? err.message : undefined,
        variant: 'error',
      });
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-950/5">
          <ShoppingBag className="h-7 w-7 text-ink-900/40" />
        </span>
        <h1 className="mt-5 font-display text-2xl uppercase tracking-wide text-ink-950">Seu carrinho está vazio</h1>
        <p className="mt-1 text-ink-900/50">Explore os eventos e adicione fotos que você quer baixar em HD.</p>
        <Link href="/" className="mt-6">
          <Button variant="secondary" size="lg">
            Buscar eventos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 pb-28 sm:pb-10">
      <h1 className="font-display text-3xl uppercase tracking-wide text-ink-950">Carrinho</h1>
      <p className="mt-1 text-ink-900/50">{items.length} foto(s) selecionada(s) para compra.</p>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white shadow-card">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-900 sm:h-20 sm:w-28">
                <Image src={resolveFileUrl(item.thumbUrl)} alt={item.title} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-950">{item.title}</p>
                {item.photographerName && <p className="text-sm text-ink-900/50">{item.photographerName}</p>}
              </div>
              <span className="shrink-0 font-semibold text-ink-950">{formatPrice(item.price)}</span>
              <button
                onClick={() => remove(item.id)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-900/40 hover:bg-red-50 hover:text-red-600"
                aria-label="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="hidden h-fit rounded-2xl border border-black/5 bg-white p-6 shadow-card sm:block">
          <h2 className="font-display text-lg uppercase tracking-wide text-ink-950">Resumo</h2>
          <div className="mt-4 flex justify-between text-sm text-ink-900/60">
            <span>Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-ink-900/60">
            <span>Taxa</span>
            <span>Grátis</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-black/5 pt-4 font-display text-xl text-ink-950">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Button variant="secondary" size="lg" className="mt-6 w-full" onClick={handleCheckout} loading={loading}>
            Finalizar compra <ArrowRight className="h-4 w-4" />
          </Button>
          {!user && <p className="mt-3 text-center text-xs text-ink-900/40">Você precisa entrar para concluir a compra.</p>}
        </div>
      </div>

      {/* Barra fixa de checkout no mobile, acima da navegação inferior */}
      <div className="fixed inset-x-0 bottom-16 z-40 flex items-center gap-3 border-t border-black/10 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-ink-900/50">Total ({items.length})</p>
          <p className="font-display text-lg text-ink-950">{formatPrice(total)}</p>
        </div>
        <Button variant="secondary" className="shrink-0" onClick={handleCheckout} loading={loading}>
          Finalizar <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
