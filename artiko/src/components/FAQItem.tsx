import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRipple, RippleLayer } from "./Ripple";

export default function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const { ripples, onPointerDown } = useRipple();

  return (
    <div className="border-b border-line py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        onPointerDown={onPointerDown}
        className="relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-lg text-left"
        aria-expanded={open}
      >
        <RippleLayer ripples={ripples} color="rgba(31,94,91,0.1)" />
        <span className="relative z-10 font-display text-[16px] font-semibold text-primary-dark">{question}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex-shrink-0 text-xl leading-none text-primary"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pt-2.5 text-[14.5px] leading-relaxed text-muted">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
