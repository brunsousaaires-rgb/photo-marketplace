import { motion } from "framer-motion";
import type { ReactNode } from "react";
import clsx from "clsx";
import { useRipple, RippleLayer } from "./Ripple";

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  icon?: ReactNode;
  index?: number;
}

export default function OptionCard({ selected, onClick, title, desc, icon, index = 0 }: OptionCardProps) {
  const { ripples, onPointerDown } = useRipple();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border-[1.5px] bg-surface p-4 text-left transition-colors",
        selected ? "border-primary bg-primary-soft" : "border-line hover:border-primary/60"
      )}
      aria-pressed={selected}
    >
      <RippleLayer ripples={ripples} color="rgba(31,94,91,0.14)" />
      {icon && <span className="relative z-10 mb-0.5">{icon}</span>}
      <span className="relative z-10 font-display text-base font-semibold text-primary-dark">{title}</span>
      {desc && <span className="relative z-10 text-[12.5px] leading-snug text-muted">{desc}</span>}
    </motion.button>
  );
}
