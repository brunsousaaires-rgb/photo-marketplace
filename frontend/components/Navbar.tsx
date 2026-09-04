'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCartStore } from '@/lib/cart-store';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuth();
  const cartCount = useCartStore((s) => s.items.length);
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: '/', label: 'Explorar' },
    ...(user?.role === 'PHOTOGRAPHER' ? [{ href: '/dashboard', label: 'Meu painel' }] : []),
    ...(user ? [{ href: '/orders', label: 'Minhas compras' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-ink-950/95 backdrop-blur supports-[backdrop-filter]:bg-ink-950/80">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-ink-950 shadow-glow">
            <Camera className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-lg uppercase tracking-wide">
            Photo <span className="text-accent-500">Marketplace</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'border-b-2 border-transparent py-5 text-sm font-semibold uppercase tracking-wide text-white/60 transition hover:text-white',
                pathname === l.href && 'border-accent-500 text-white'
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

        <div className="flex items-center gap-1 md:hidden">
          <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/80">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-ink-950">
                {cartCount}
              </span>
            )}
          </Link>
          {user && (
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
