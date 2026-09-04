'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, User, LayoutDashboard, PackageOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const cartCount = useCartStore((s) => s.items.length);

  const isPhotographer = user?.role === 'PHOTOGRAPHER';

  const tabs = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/cart', label: 'Carrinho', icon: ShoppingBag, badge: cartCount },
    isPhotographer
      ? { href: '/dashboard', label: 'Painel', icon: LayoutDashboard }
      : { href: '/orders', label: 'Compras', icon: PackageOpen },
    { href: user ? '/orders' : '/login', label: user ? 'Perfil' : 'Entrar', icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-stretch border-t border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 md:hidden">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
              active ? 'text-ink-950' : 'text-ink-900/45'
            )}
          >
            <span className="relative">
              <Icon className={cn('h-5 w-5', active && 'text-accent-600')} strokeWidth={active ? 2.5 : 2} />
              {'badge' in tab && tab.badge ? (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-ink-950">
                  {tab.badge}
                </span>
              ) : null}
            </span>
            {tab.label}
            {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent-500" />}
          </Link>
        );
      })}
    </nav>
  );
}
