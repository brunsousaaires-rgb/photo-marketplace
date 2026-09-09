'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Instagram, MessageCircle, X } from 'lucide-react';
import { site } from '@/data/site';
import { generalContactLink } from '@/lib/whatsapp';

const links = [
  { number: '01', label: 'Estoque', href: '/veiculos' },
  { number: '02', label: 'Modelos', href: '/#modelos' },
  { number: '03', label: 'Vendedores', href: '/vendedores' },
  { number: '04', label: 'Sobre a 2L', href: '/sobre' },
  { number: '05', label: 'Contato', href: '/contato' },
];

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ clipPath: 'circle(0% at 100% 0%)' }}
          animate={{ clipPath: 'circle(150% at 100% 0%)' }}
          exit={{ clipPath: 'circle(0% at 100% 0%)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[150] flex flex-col bg-bg-elevated md:hidden"
        >
          <div className="flex items-center justify-between px-6 pt-6">
            <span className="font-display text-2xl text-gradient-gold">2L VEÍCULOS</span>
            <button
              onClick={onClose}
              aria-label="Fechar menu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-ink"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="mt-10 flex flex-1 flex-col justify-center gap-1 px-6">
            {links.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="flex items-baseline gap-4 border-b border-white/5 py-4 text-ink"
                >
                  <span className="text-xs text-gold">{link.number}</span>
                  <span className="font-display text-4xl uppercase tracking-wide">{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between border-t border-white/5 px-6 py-6"
          >
            <a
              href={generalContactLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-ink"
            >
              <MessageCircle size={18} className="text-gold" />
              WhatsApp
            </a>
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-ink"
            >
              <Instagram size={18} className="text-gold" />
              Instagram
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
