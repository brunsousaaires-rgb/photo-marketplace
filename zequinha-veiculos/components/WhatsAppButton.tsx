"use client";

import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { whatsappUrlGeneral } from "@/lib/whatsapp";

export function WhatsAppButton() {
  const [expanded, setExpanded] = useState(false);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 400);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={whatsappUrlGeneral()}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="link"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          className="fixed bottom-6 right-6 z-[150] flex items-center gap-3 rounded-full border border-turquoise-500/30 bg-black/80 px-4 py-3.5 text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors hover:border-turquoise-400/60"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-turquoise-500/15">
            <span className="absolute inset-0 animate-pulse-soft rounded-full bg-turquoise-500/20" />
            <MessageCircle size={18} strokeWidth={1.75} className="relative text-turquoise-300" />
          </span>
          <motion.span
            initial={false}
            animate={{ width: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden whitespace-nowrap text-[13px] font-medium tracking-wide"
          >
            Falar com a Zequinha
          </motion.span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
