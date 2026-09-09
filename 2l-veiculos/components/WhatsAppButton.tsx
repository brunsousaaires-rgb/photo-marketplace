'use client';

import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { generalContactLink } from '@/lib/whatsapp';

export default function WhatsAppButton() {
  return (
    <motion.a
      href={generalContactLink()}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="explore"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="group fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-full border border-white/10 bg-surface/90 py-3 pl-3 pr-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md sm:bottom-8 sm:right-8"
      aria-label="Falar com a 2L Veículos no WhatsApp"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
        <MessageCircle size={18} strokeWidth={2} />
      </span>
      <span className="hidden text-sm font-medium text-ink sm:inline">Falar com a 2L</span>
    </motion.a>
  );
}
