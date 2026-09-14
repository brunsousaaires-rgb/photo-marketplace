import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AreaId, Routine } from "../data/routines";
import ExerciseRow from "./ExerciseRow";
import Button from "./Button";
import { getCheckoutUrl } from "../lib/checkout";

interface ResultPanelProps {
  area: AreaId;
  routine: Routine;
  onRestart: () => void;
  unlocked: boolean;
}

export default function ResultPanel({ area, routine, onRestart, unlocked }: ResultPanelProps) {
  const [activeFase, setActiveFase] = useState(0);
  const checkoutUrl = getCheckoutUrl(area);
  const showFull = activeFase === 0 || unlocked;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-1.5 text-[13px] font-semibold tracking-wide text-primary"
      >
        Seu protocolo personalizado
      </motion.p>
      <h2 className="font-display mb-4 text-[24px] font-semibold text-primary-dark sm:text-[28px]">
        {routine.nome}
      </h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-lg border border-accent bg-accent-soft px-4 py-3 text-[13.5px] text-[#7A5A1E]"
      >
        ⚠ {routine.aviso}
      </motion.div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line sm:gap-2">
        {routine.fases.map((f, i) => {
          const locked = !unlocked && i > 0;
          const active = activeFase === i;
          return (
            <button
              key={i}
              onClick={() => setActiveFase(i)}
              className="relative flex-shrink-0 whitespace-nowrap px-1 pb-3 pr-4 text-[13.5px] font-semibold transition-colors"
              style={{ color: active ? "#16302E" : "#5C726F" }}
            >
              {f.titulo}
              {active && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-0 right-4 h-[2px] bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {locked && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeFase}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
        >
          <p className="mb-3 text-[13px] text-muted">{routine.fases[activeFase].subtitulo}</p>

          {showFull ? (
            <div className="flex flex-col gap-2.5">
              {routine.fases[activeFase].exercicios.map((ex, i) => (
                <ExerciseRow key={i} ex={ex} index={i} />
              ))}
            </div>
          ) : (
            <div className="relative mt-1">
              <div className="pointer-events-none flex select-none flex-col gap-2.5 opacity-60 blur-[4px]">
                {routine.fases[activeFase].exercicios.map((ex, i) => (
                  <ExerciseRow key={i} ex={ex} index={i} />
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-[rgba(241,243,242,0.65)] px-5 text-center backdrop-blur-[2px]"
              >
                <p className="font-display mb-2 text-lg font-semibold text-primary-dark">
                  Desbloqueie as 6 semanas completas do protocolo
                </p>
                <p className="mb-4 max-w-xs text-[13.5px] leading-relaxed text-muted">
                  Progressão semana a semana com ajuste automático conforme sua evolução.
                </p>
                <div className="mb-3.5 flex items-baseline gap-2.5">
                  <span className="font-display text-[26px] font-bold text-primary-dark">R$ 97</span>
                  <span className="text-sm text-muted line-through">R$ 197</span>
                </div>
                <Button as="a" href={checkoutUrl} fullWidth>
                  Quero meu protocolo completo
                </Button>
                <p className="mt-2.5 text-[12.5px] text-muted">Acesso vitalício · Garantia de 7 dias</p>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <button
        onClick={onRestart}
        className="mt-6 block text-[13px] text-muted underline decoration-line underline-offset-2 hover:text-primary-dark"
      >
        Refazer o questionário
      </button>
    </motion.section>
  );
}
