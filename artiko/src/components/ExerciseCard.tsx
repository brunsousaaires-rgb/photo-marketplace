import { motion } from "framer-motion";
import type { Exercise } from "../data/routines";
import ExerciseDemo from "./ExerciseDemo";

interface ExerciseCardProps {
  exercise: Exercise;
  displayName: string;
  usingAlternativa: boolean;
  index: number;
  done: boolean;
  onOpen: () => void;
  onToggleDone: () => void;
}

export default function ExerciseCard({
  exercise,
  displayName,
  usingAlternativa,
  index,
  done,
  onOpen,
  onToggleDone,
}: ExerciseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 pr-3.5 shadow-soft"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-center gap-3 text-left"
        aria-label={`Ver demonstração de ${displayName}`}
      >
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft">
          <ExerciseDemo demo={exercise.demo} size={44} playing={false} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[14.5px] font-medium ${done ? "text-muted line-through" : "text-text"}`}>
            {displayName}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
            <span>{exercise.series}</span>
            {usingAlternativa && (
              <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-medium text-[#7A5A1E]">
                adaptado
              </span>
            )}
          </div>
        </div>
      </button>

      <motion.button
        type="button"
        onClick={onToggleDone}
        whileTap={{ scale: 0.85 }}
        aria-label={done ? "Marcar como não feito" : "Marcar como feito"}
        aria-pressed={done}
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done ? "border-primary bg-primary text-white" : "border-line text-transparent hover:border-primary/50"
        }`}
      >
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.path
            d="M3 8.5L6.2 12L13 4"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: done ? 1 : 0 }}
            transition={{ duration: 0.25 }}
          />
        </motion.svg>
      </motion.button>
    </motion.div>
  );
}
