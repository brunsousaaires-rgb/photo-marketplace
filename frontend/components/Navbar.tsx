"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { site } from "@/lib/site.config";

const links = [
  { label: "Serviços", href: "#servicos" },
  { label: "Portfólio", href: "#portfolio" },
  { label: "Processo", href: "#processo" },
  { label: "Contato", href: "#contato" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`flex w-full max-w-4xl items-center justify-between rounded-full px-5 py-3 transition-all duration-300 ${
          scrolled ? "glass shadow-lg shadow-black/20" : "bg-transparent"
        }`}
      >
        <a href="#top" className="font-display text-sm font-bold tracking-tight">
          {site.name.split(" ")[0]}
          <span className="text-gradient">.</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#contato"
          className="hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink transition-transform hover:scale-105 md:inline-block"
        >
          Vamos conversar
        </a>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full glass md:hidden"
          aria-label="Abrir menu"
        >
          <span className={`h-px w-4 bg-white transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
          <span className={`h-px w-4 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-4 bg-white transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass absolute left-4 right-4 top-20 flex flex-col gap-1 rounded-2xl p-3 md:hidden"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm text-white/80 hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}
