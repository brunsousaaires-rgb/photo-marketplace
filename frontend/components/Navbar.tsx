'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, ShoppingBag, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCartStore } from '@/lib/cart-store';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuth();
  const cartCount = useCartStore((s) => s.items.length);
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: 'Explorar' },
    ...(user?.role === 'PHOTOGRAPHER' ? [{ href: '/dashboard', label: 'Meu painel' }] : []),
    ...(user ? [{ href: '/orders', label: 'Minhas compras' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-ink-950/95 backdrop-blur supports-[backdrop-filter]:bg-ink-950/80">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-ink-950">
            <Camera className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Photo Marketplace</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium text-white/70 transition hover:text-white',
                pathname === l.href && 'text-white'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-ink-950">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">
                Olá, <span className="font-medium text-white">{user.name.split(' ')[0]}</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
              >
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" variant="secondary">
                  Criar conta
                </Button>
              </Link>
            </div>
          )}
        </div>

        <button className="text-white md:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink-950 px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10">
                {l.label}
              </Link>
            ))}
            <Link href="/cart" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10">
              <ShoppingBag className="h-4 w-4" /> Carrinho {cartCount > 0 && `(${cartCount})`}
            </Link>
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                  router.push('/');
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/80 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            ) : (
              <div className="mt-2 flex gap-2 px-3">
                <Link href="/login" onClick={() => setOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Criar conta
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
