import { motion } from "framer-motion";

interface ProgressHUDProps {
  level: number;
  xpIntoLevel: number;
  streakDays: number;
}

export default function ProgressHUD({ level, xpIntoLevel, streakDays }: ProgressHUDProps) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-3 py-1.5 shadow-soft">
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {level}
        </span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line sm:w-24">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${xpIntoLevel}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 text-[12.5px] font-semibold text-accent" title="Sequência de dias treinando">
        <motion.span
          animate={streakDays > 0 ? { scale: [1, 1.15, 1] } : undefined}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          🔥
        </motion.span>
        {streakDays}
      </div>
    </div>
  );
}
