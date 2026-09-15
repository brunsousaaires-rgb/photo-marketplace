import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AreaId, EquipId, Exercise, Routine } from "../data/routines";
import { exerciseDisplay } from "../data/routines";
import ExerciseCard from "./ExerciseCard";
import ExerciseModal from "./ExerciseModal";
import ExerciseDemo from "./ExerciseDemo";
import Button from "./Button";
import Mascot from "./Mascot";
import ProgressHUD from "./ProgressHUD";
import Confetti from "./Confetti";
import { getCheckoutUrl } from "../lib/checkout";
import { useProgress, PHASE_BONUS_XP, BADGES } from "../lib/progress";

interface ResultPanelProps {
  area: AreaId;
  routine: Routine;
  equip: EquipId[];
  onRestart: () => void;
  unlocked: boolean;
}

export default function ResultPanel({ area, routine, equip, onRestart, unlocked }: ResultPanelProps) {
  const [activeFase, setActiveFase] = useState(0);
  const [openExIndex, setOpenExIndex] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const checkoutUrl = getCheckoutUrl(area, equip);
  const showFull = activeFase === 0 || unlocked;
  const progress = useProgress();

  const fase = routine.fases[activeFase];
  const phaseKey = `${area}:${activeFase}`;

  const keys = useMemo(
    () => fase.exercicios.map((_, i) => progress.exerciseKey(area, activeFase, i)),
    [fase, area, activeFase, progress]
  );
  const doneCount = keys.filter((k) => progress.isExerciseDone(k)).length;
  const allDone = doneCount === keys.length;

  useEffect(() => {
    if (allDone && showFull && !progress.isPhaseCompletedToday(phaseKey)) {
      progress.completePhase(phaseKey);
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 2600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, showFull, phaseKey]);

  const openExercise: Exercise | null = openExIndex !== null ? fase.exercicios[openExIndex] : null;
  const openDisplay = openExercise ? exerciseDisplay(openExercise, equip) : null;
  const openKey = openExIndex !== null ? progress.exerciseKey(area, activeFase, openExIndex) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Mascot size={40} mood={allDone && showFull ? "happy" : "idle"} />
          <div>
            <p className="text-[13px] font-semibold tracking-wide text-primary">Seu protocolo personalizado</p>
          </div>
        </div>
        <ProgressHUD level={progress.level} xpIntoLevel={progress.xpIntoLevel} streakDays={progress.streakDays} />
      </div>

      <div className="mb-4 flex gap-1.5">
        {BADGES.map((b) => {
          const unlocked = progress.badges.has(b.id);
          return (
            <span
              key={b.id}
              title={`${b.label} — ${b.desc}`}
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[13px] transition-opacity ${
                unlocked ? "border-accent bg-accent-soft opacity-100" : "border-line bg-bg opacity-35 grayscale"
              }`}
            >
              {b.icon}
            </span>
          );
        })}
      </div>

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
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] text-muted">{fase.subtitulo}</p>
            {showFull && (
              <p className="text-[12.5px] font-medium text-primary">
                {doneCount}/{keys.length} feitos hoje
              </p>
            )}
          </div>

          {showFull ? (
            <div className="flex flex-col gap-2.5">
              {fase.exercicios.map((exercise, i) => {
                const display = exerciseDisplay(exercise, equip);
                const key = keys[i];
                return (
                  <ExerciseCard
                    key={i}
                    index={i}
                    exercise={exercise}
                    displayName={display.nome}
                    usingAlternativa={display.usingAlternativa}
                    done={progress.isExerciseDone(key)}
                    onOpen={() => setOpenExIndex(i)}
                    onToggleDone={() => progress.toggleExercise(key)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="relative mt-1">
              <div className="pointer-events-none flex select-none flex-col gap-2.5 opacity-60 blur-[4px]">
                {fase.exercicios.map((exercise, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 pr-3.5 shadow-soft"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                      <ExerciseDemo demo={exercise.demo} size={44} playing={false} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-medium text-text">{exercise.nome}</div>
                      <div className="mt-0.5 text-[12.5px] text-muted">{exercise.series}</div>
                    </div>
                  </div>
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
                  Demonstração animada de cada exercício, progressão semana a semana e seu XP continua contando.
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

      <ExerciseModal
        exercise={openExercise}
        displayName={openDisplay?.nome ?? ""}
        usingAlternativa={openDisplay?.usingAlternativa ?? false}
        done={openKey ? progress.isExerciseDone(openKey) : false}
        onClose={() => setOpenExIndex(null)}
        onToggleDone={() => openKey && progress.toggleExercise(openKey)}
      />

      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 backdrop-blur-sm"
          >
            <Confetti />
            <motion.div
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative z-10 mx-6 flex flex-col items-center rounded-3xl bg-surface px-8 py-8 text-center shadow-card"
            >
              <Mascot size={80} mood="cheer" />
              <p className="font-display mt-3 text-[20px] font-semibold text-primary-dark">Treino concluído!</p>
              <p className="mt-1 text-[14px] text-muted">
                +{PHASE_BONUS_XP} XP de bônus · sequência de {progress.streakDays}{" "}
                {progress.streakDays === 1 ? "dia" : "dias"} 🔥
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
