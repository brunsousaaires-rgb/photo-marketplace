import { AnimatePresence, motion } from "framer-motion";
import type { Exercise } from "../data/routines";
import ExerciseDemo from "./ExerciseDemo";
import Mascot from "./Mascot";
import Button from "./Button";

interface ExerciseModalProps {
  exercise: Exercise | null;
  displayName: string;
  usingAlternativa: boolean;
  done: boolean;
  onClose: () => void;
  onToggleDone: () => void;
}

export default function ExerciseModal({
  exercise,
  displayName,
  usingAlternativa,
  done,
  onClose,
  onToggleDone,
}: ExerciseModalProps) {
  return (
    <AnimatePresence>
      {exercise && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-primary-dark/40 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={displayName}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="w-full max-w-sm rounded-t-3xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-card sm:rounded-3xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-primary">Como fazer</span>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-primary-soft"
              >
                ✕
              </button>
            </div>

            <div className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-2xl bg-primary-soft">
              <ExerciseDemo demo={exercise.demo} size={140} playing />
            </div>

            <h3 className="font-display mb-1 text-[19px] font-semibold text-primary-dark">{displayName}</h3>
            <p className="mb-3 text-[13.5px] font-medium text-primary">{exercise.series}</p>

            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-bg px-3.5 py-3">
              <Mascot size={30} mood="think" />
              <p className="text-[13.5px] leading-relaxed text-text">{exercise.dica}</p>
            </div>

            {usingAlternativa && exercise.alternativa && (
              <div className="mb-4 rounded-xl border border-accent bg-accent-soft px-3.5 py-2.5 text-[12.5px] text-[#7A5A1E]">
                <strong>Sem o equipamento ideal?</strong> {exercise.alternativa}
              </div>
            )}

            <Button fullWidth variant={done ? "outline" : "primary"} onClick={onToggleDone}>
              {done ? "Concluído — desmarcar" : `Marcar como feito · +${exercise.xp} XP`}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
