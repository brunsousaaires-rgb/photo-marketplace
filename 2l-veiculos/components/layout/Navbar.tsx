'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';
import { generalContactLink } from '@/lib/whatsapp';

const links = [
  { label: 'Estoque', href: '/veiculos' },
  { label: 'Modelos', href: '/#modelos' },
  { label: 'Vendedores', href: '/vendedores' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Contato', href: '/contato' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[95] flex justify-center px-4 pt-4 sm:px-6 sm:pt-6">
        <motion.div
          animate={{
            width: scrolled ? '100%' : '100%',
            maxWidth: scrolled ? 880 : 1280,
            paddingTop: scrolled ? 10 : 18,
            paddingBottom: scrolled ? 10 : 18,
            backgroundColor: scrolled ? 'rgba(19,19,22,0.7)' : 'rgba(19,19,22,0)',
            borderColor: scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0)',
          }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full items-center justify-between rounded-full border px-5 backdrop-blur-md sm:px-7"
        >
          <Link href="/" data-cursor="explore" className="font-display text-xl tracking-wide text-ink sm:text-2xl">
            2L <span className="text-gradient-gold">VEÍCULOS</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-cursor="explore"
                className="text-xs font-medium uppercase tracking-widest text-ink-soft transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={generalContactLink()}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="explore"
              className="hidden rounded-full border border-gold/40 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-bg md:inline-block"
            >
              WhatsApp
            </a>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink md:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </motion.div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
