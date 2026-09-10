"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageCircle, Instagram } from "lucide-react";
import { navLinks, site } from "@/lib/site.config";
import { whatsappUrlGeneral } from "@/lib/whatsapp";

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ clipPath: "circle(0% at 100% 0%)" }}
          animate={{ clipPath: "circle(150% at 100% 0%)" }}
          exit={{ clipPath: "circle(0% at 100% 0%)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[200] flex flex-col bg-black"
        >
          <div className="flex items-center justify-between px-6 py-5">
            <span className="font-display text-sm font-semibold uppercase tracking-widest text-white">
              Zequinha <span className="text-turquoise-300">Veículos</span>
            </span>
            <button
              aria-label="Fechar menu"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-start justify-center gap-2 px-8">
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={onClose}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-4xl font-semibold uppercase tracking-tight text-white/90"
              >
                {link.label}
              </motion.a>
            ))}
          </nav>

          <div className="flex flex-col gap-4 border-t border-white/10 px-8 py-8">
            <a
              href={whatsappUrlGeneral()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-turquoise-500 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-black"
            >
              <MessageCircle size={16} />
              Falar com a Zequinha
            </a>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-white/60"
            >
              <Instagram size={16} />@{site.instagramHandle}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
