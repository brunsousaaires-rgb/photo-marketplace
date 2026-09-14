import { motion } from "framer-motion";
import clsx from "clsx";

interface PillOptionProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  index?: number;
}

export default function PillOption({ selected, onClick, label, index = 0 }: PillOptionProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "rounded-lg border-[1.5px] bg-surface px-4 py-3.5 text-left font-sans text-[15px] transition-colors",
        selected ? "border-primary bg-primary-soft text-primary-dark" : "border-line text-text hover:border-primary/60"
      )}
      aria-pressed={selected}
    >
      {label}
    </motion.button>
  );
}
