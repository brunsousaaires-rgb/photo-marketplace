import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  className?: string;
}

export default function SpeechBubble({ children, className }: SpeechBubbleProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={typeof children === "string" ? children : undefined}
        initial={{ opacity: 0, y: 6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative rounded-2xl rounded-bl-sm bg-surface px-4 py-2.5 text-[13.5px] leading-snug text-primary-dark shadow-soft ${className ?? ""}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
