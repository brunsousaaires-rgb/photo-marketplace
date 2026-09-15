import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundDecor from "../components/BackgroundDecor";
import OptionCard from "../components/OptionCard";
import PillOption from "../components/PillOption";
import EquipmentOption from "../components/EquipmentOption";
import Button from "../components/Button";
import AreaIcon from "../components/AreaIcon";
import ResultPanel from "../components/ResultPanel";
import Mascot from "../components/Mascot";
import SpeechBubble from "../components/SpeechBubble";
import { AREAS, EQUIPS, GOALS, ROUTINES } from "../data/routines";
import type { AreaId, EquipId, GoalId } from "../data/routines";

const stepVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function QuizApp() {
  const [step, setStep] = useState(0);
  const [area, setArea] = useState<AreaId | null>(null);
  const [equip, setEquip] = useState<EquipId[]>([]);
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [searchParams] = useSearchParams();
  const preview = searchParams.get("preview") === "1";
  const [unlocked, setUnlocked] = useState(false);

  const routine = area ? ROUTINES[area] : null;

  const next = () => setStep((s) => s + 1);
  const restart = () => {
    setStep(0);
    setArea(null);
    setEquip([]);
    setGoal(null);
    setUnlocked(false);
  };

  const toggleEquip = (id: EquipId) => {
    setEquip((prev) => {
      if (id === "nenhum") return prev.includes("nenhum") ? [] : ["nenhum"];
      const withoutNenhum = prev.filter((e) => e !== "nenhum");
      return withoutNenhum.includes(id) ? withoutNenhum.filter((e) => e !== id) : [...withoutNenhum, id];
    });
  };

  const stepLabel = useMemo(() => {
    if (step === 1) return "Onde está o incômodo?";
    if (step === 2) return "O que você tem em casa?";
    if (step === 3) return "Qual é o seu objetivo agora?";
    return "";
  }, [step]);

  const mascotLine = useMemo(() => {
    if (step === 1) return "Toca na área onde você sente o incômodo.";
    if (step === 2) return "Pode escolher mais de um — ou nenhum, sem problema!";
    if (step === 3) return "Só mais uma e eu monto seu treino!";
    return "";
  }, [step]);

  return (
    <div className="relative flex min-h-screen flex-col px-4 pb-10 pt-6 sm:px-6">
      <BackgroundDecor />
      <Header step={step} />

      <main className="mx-auto mt-6 w-full max-w-xl flex-1 sm:max-w-2xl lg:flex lg:min-h-[62vh] lg:flex-col lg:justify-center">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.section
              key="hero"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="pt-2 text-left sm:pt-6"
            >
              <div className="mb-5 flex items-end gap-3">
                <Mascot size={72} mood="wave" />
                <SpeechBubble className="mb-2">
                  Oi, eu sou o Arti! Vamos montar seu treino em menos de 1 minuto?
                </SpeechBubble>
              </div>
              <h1 className="font-display max-w-md text-[36px] font-semibold leading-[1.1] text-primary-dark sm:text-[52px]">
                Movimento sem dor,
                <br />
                todo dia.
              </h1>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted sm:text-[18px]">
                Responda 3 perguntas rápidas e receba um protocolo de exercícios
                seguro — com demonstração animada de cada movimento, pontos de
                experiência e sequência de dias para você não esquecer de treinar.
              </p>
              <div className="mt-7 max-w-xs sm:max-w-[280px]">
                <Button size="lg" fullWidth onClick={next}>
                  Montar meu protocolo →
                </Button>
              </div>
              <p className="mt-3 text-[12.5px] text-muted">Leva menos de 1 minuto</p>
            </motion.section>
          )}

          {step === 1 && (
            <motion.section
              key="area"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8"
            >
              <div className="mb-4 flex items-center gap-2.5">
                <Mascot size={36} mood="idle" />
                <p className="text-[13px] font-semibold tracking-wide text-primary">{stepLabel}</p>
              </div>
              <div className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {AREAS.map((a, i) => (
                  <OptionCard
                    key={a.id}
                    index={i}
                    title={a.label}
                    desc={a.desc}
                    selected={area === a.id}
                    onClick={() => setArea(a.id)}
                    icon={<AreaIcon icon={a.icon} active={area === a.id} />}
                  />
                ))}
              </div>
              <Button fullWidth disabled={!area} onClick={next}>
                Continuar
              </Button>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="equip"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8"
            >
              <div className="mb-1 flex items-center gap-2.5">
                <Mascot size={36} mood="idle" />
                <p className="text-[13px] font-semibold tracking-wide text-primary">{stepLabel}</p>
              </div>
              <p className="mb-4 pl-[46px] text-[12.5px] text-muted">{mascotLine}</p>
              <div className="mb-6 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {EQUIPS.map((e, i) => (
                  <EquipmentOption
                    key={e.id}
                    index={i}
                    label={e.label}
                    icon={e.icon}
                    selected={equip.includes(e.id)}
                    onClick={() => toggleEquip(e.id)}
                  />
                ))}
              </div>
              <Button fullWidth disabled={equip.length === 0} onClick={next}>
                Continuar
              </Button>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section
              key="goal"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8"
            >
              <div className="mb-4 flex items-center gap-2.5">
                <Mascot size={36} mood="idle" />
                <p className="text-[13px] font-semibold tracking-wide text-primary">{stepLabel}</p>
              </div>
              <div className="mb-6 flex flex-col gap-2.5">
                {GOALS.map((g, i) => (
                  <PillOption
                    key={g.id}
                    index={i}
                    label={g.label}
                    selected={goal === g.id}
                    onClick={() => setGoal(g.id)}
                  />
                ))}
              </div>
              <Button fullWidth disabled={!goal} onClick={next}>
                Ver meu protocolo
              </Button>
            </motion.section>
          )}

          {step === 4 && area && routine && (
            <motion.div
              key="result"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8"
            >
              {preview && (
                <div className="mb-5 flex justify-end">
                  <button
                    onClick={() => setUnlocked((u) => !u)}
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11.5px] text-muted"
                  >
                    {unlocked ? "Modo cliente" : "Modo revisão (ver tudo)"}
                  </button>
                </div>
              )}
              <ResultPanel area={area} routine={routine} equip={equip} onRestart={restart} unlocked={unlocked} />
            </motion.div>
          )}
        </AnimatePresence>

        {step === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-[12.5px] text-muted"
          >
            Já conhece o protocolo?{" "}
            <Link to="/oferta" className="text-primary underline underline-offset-2">
              Veja a oferta completa
            </Link>
          </motion.p>
        )}
      </main>

      <Footer />
    </div>
  );
}
