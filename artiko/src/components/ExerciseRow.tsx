import { motion } from "framer-motion";
import type { Exercise } from "../data/routines";

export default function ExerciseRow({ ex, index }: { ex: Exercise; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-center gap-3.5 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-soft"
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="text-[14.5px] font-medium text-text">{ex.nome}</div>
        <div className="mt-0.5 text-[12.5px] text-muted">{ex.series}</div>
      </div>
    </motion.div>
  );
}
