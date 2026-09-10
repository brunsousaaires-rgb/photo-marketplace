"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { navLinks } from "@/lib/site.config";
import { whatsappUrlGeneral } from "@/lib/whatsapp";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 48);
  });

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-[120] transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled ? "glass" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <a href="#inicio" className="flex items-center gap-2.5" data-cursor="link">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-turquoise-500/50 font-display text-sm font-bold text-turquoise-300">
              ZV
            </span>
            <span className="font-display text-sm font-semibold uppercase tracking-widest text-white">
              Zequinha <span className="text-turquoise-300">Veículos</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-cursor="link"
                className="text-[13px] font-medium uppercase tracking-wide text-white/70 transition-colors hover:text-turquoise-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href={whatsappUrlGeneral()}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              className="hidden items-center gap-2 rounded-full border border-turquoise-500/40 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-turquoise-300 transition-colors hover:bg-turquoise-500/10 md:flex"
            >
              <MessageCircle size={14} strokeWidth={2} />
              WhatsApp
            </a>

            <button
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
              data-cursor="link"
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
            >
              <span className="h-[1.5px] w-6 bg-white" />
              <span className="h-[1.5px] w-6 bg-white" />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
