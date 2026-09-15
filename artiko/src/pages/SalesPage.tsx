import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackgroundDecor from "../components/BackgroundDecor";
import Reveal from "../components/Reveal";
import FAQItem from "../components/FAQItem";
import Button from "../components/Button";
import AreaIcon from "../components/AreaIcon";
import Mascot from "../components/Mascot";
import ExerciseDemo from "../components/ExerciseDemo";
import { getCheckoutUrl } from "../lib/checkout";
import { AREAS } from "../data/routines";

const FEATURES = [
  {
    title: "O Arti guia você",
    desc: "Um mascote animado acompanha cada etapa do quiz e comemora com você quando o treino é concluído.",
  },
  {
    title: "Veja como fazer, não só leia",
    desc: "Cada exercício tem uma demonstração animada do movimento — sem adivinhação, sem medo de fazer errado.",
  },
  {
    title: "Pontos, sequência e conquistas",
    desc: "Ganhe XP a cada exercício, suba de nível e mantenha sua sequência de dias treinando — como um jogo, para você não esquecer.",
  },
  {
    title: "10 opções de equipamento",
    desc: "Do zero equipamento a kettlebell e bola suíça — o protocolo se adapta automaticamente ao que você tem em casa.",
  },
];

const PROBLEMS = [
  "Você para de treinar toda vez que a dor volta, e não sabe se está piorando ou é normal.",
  "Já pesquisou exercícios no YouTube, mas ficou com medo de fazer errado e se machucar.",
  "Sente que perdeu mobilidade e não sabe por onde recomeçar com segurança.",
];

const STEPS = [
  {
    title: "Responda 3 perguntas",
    desc: "Área da dor, equipamento disponível em casa e seu objetivo. Leva menos de 1 minuto.",
  },
  {
    title: "Receba seu protocolo personalizado",
    desc: "Um plano de 6 semanas dividido em 3 fases: descompressão, fortalecimento e retorno funcional.",
  },
  {
    title: "Siga a progressão semana a semana",
    desc: "Cada fase libera novos exercícios, sempre dentro do que seu corpo já pode suportar.",
  },
];

const INCLUDES = [
  "Protocolo completo de 6 semanas, nas 4 áreas (ombro, coluna, joelho, quadril)",
  "Demonstração animada de cada exercício, com dica de execução",
  "Progressão em 3 fases: descompressão, fortalecimento, retorno funcional",
  "Sistema de pontos, sequência de dias e conquistas para criar o hábito",
  "Acesso vitalício e atualizações futuras incluídas",
];

const FAQS = [
  {
    q: "Isso substitui um fisioterapeuta?",
    a: "Não. O ARTIKO é um protocolo de exercícios educativo para dores leves a moderadas do dia a dia. Se você tem uma lesão diagnosticada ou dor intensa, procure um profissional de saúde antes de começar.",
  },
  {
    q: "Preciso de equipamento?",
    a: "Não. Todos os exercícios têm uma versão sem equipamento. O quiz oferece 10 opções (elástico, halteres, kettlebell, banco, cadeira, bola suíça e mais) e adapta o protocolo automaticamente ao que você marcar que tem.",
  },
  {
    q: "Quanto tempo leva por dia?",
    a: "Entre 12 e 20 minutos, de 3 a 4 vezes por semana.",
  },
];

export default function SalesPage() {
  const checkoutUrl = getCheckoutUrl();

  return (
    <div className="relative flex min-h-screen flex-col px-4 pb-28 pt-6 sm:px-6 sm:pb-10">
      <BackgroundDecor />
      <Header />

      <main className="mx-auto mt-4 w-full max-w-xl flex-1 sm:max-w-2xl">
        {/* Hero */}
        <section className="pb-10 pt-6 sm:pb-16 sm:pt-14">
          <div className="mb-4 flex items-center gap-3">
            <Mascot size={44} mood="wave" />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[13px] font-semibold tracking-wide text-primary"
            >
              PROTOCOLO DIGITAL · 6 SEMANAS
            </motion.p>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display max-w-lg text-[34px] font-bold leading-[1.12] text-primary-dark sm:text-[50px]"
          >
            Volte a se mexer sem medo da dor voltar.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-5 max-w-md text-[16px] leading-relaxed text-muted sm:text-[18px]"
          >
            Um protocolo guiado, feito para quem sente dor no ombro, na coluna, no
            joelho ou no quadril e não sabe mais o que é seguro fazer em casa.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <Button as="a" href={checkoutUrl} size="lg" className="sm:w-auto">
              Quero meu protocolo — R$ 97
            </Button>
            <Button as="a" href="/" variant="outline" size="lg" className="sm:w-auto">
              Fazer o quiz gratuito
            </Button>
          </motion.div>

          <div className="mt-10 flex flex-wrap gap-2.5">
            {AREAS.map((a, i) => (
              <Reveal key={a.id} delay={0.05 * i}>
                <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2">
                  <AreaIcon icon={a.icon} size={18} active />
                  <span className="text-[13px] font-medium text-primary-dark">{a.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Problems */}
        <section className="py-6">
          <Reveal>
            <h2 className="font-display mb-5 text-[24px] font-semibold text-primary-dark sm:text-[28px]">
              Isso é com você se...
            </h2>
          </Reveal>
          <div className="flex flex-col gap-3">
            {PROBLEMS.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="flex items-start gap-3.5 rounded-xl border border-line bg-surface p-4">
                  <span className="mt-0.5 flex-shrink-0 font-bold text-accent">✕</span>
                  <p className="text-[15px] leading-relaxed text-text">{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features / gamification */}
        <section className="py-6">
          <Reveal>
            <h2 className="font-display mb-5 text-[24px] font-semibold text-primary-dark sm:text-[28px]">
              Feito para você não esquecer de treinar
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="flex h-full flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                  {i === 0 ? (
                    <Mascot size={36} mood="happy" />
                  ) : i === 1 ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft">
                      <ExerciseDemo demo={{ type: "squat", variant: "full" }} size={30} playing />
                    </div>
                  ) : (
                    <span className="text-[22px] leading-none">{i === 2 ? "🔥" : "🧩"}</span>
                  )}
                  <h3 className="text-[15.5px] font-semibold text-primary-dark">{f.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-muted">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Credibility */}
        <section className="py-6">
          <Reveal y={30}>
            <div className="rounded-[20px] bg-primary-dark p-8 text-white sm:p-10">
              <h2 className="font-display mb-3.5 text-[22px] font-semibold sm:text-[26px]">
                Por que confiar no ARTIKO
              </h2>
              <p className="text-[15px] leading-relaxed text-[#CBD9D7] sm:text-[16px]">
                O protocolo foi desenvolvido com base na experiência de anos fabricando
                equipamento ortopédico e fitness. Cada exercício segue os mesmos princípios
                de progressão usados em reabilitação: descomprimir primeiro, fortalecer
                depois, funcionalidade por último — nunca o contrário.
              </p>
            </div>
          </Reveal>
        </section>

        {/* How it works */}
        <section className="py-8">
          <Reveal>
            <h2 className="font-display mb-7 text-[24px] font-semibold text-primary-dark sm:text-[28px]">
              Como funciona
            </h2>
          </Reveal>
          <div className="flex flex-col gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <span className="font-display w-9 flex-shrink-0 text-[22px] font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="mb-1 text-[17px] font-semibold text-primary-dark">{s.title}</h3>
                    <p className="text-[14.5px] leading-relaxed text-muted">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Price */}
        <section id="preco" className="py-8">
          <Reveal y={24}>
            <div className="rounded-[20px] border-2 border-primary bg-surface p-8 text-center sm:p-10">
              <div className="text-[15px] text-muted line-through">R$ 197</div>
              <div className="font-display my-2 text-[44px] font-bold text-primary-dark sm:text-[52px]">
                R$ 97
              </div>
              <div className="mx-auto mb-7 flex max-w-sm flex-col gap-2.5 text-left">
                {INCLUDES.map((inc, i) => (
                  <div key={i} className="flex gap-2.5 text-[14.5px]">
                    <span className="flex-shrink-0 font-bold text-primary">✓</span>
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
              <Button as="a" href={checkoutUrl} fullWidth size="lg">
                Quero meu protocolo completo
              </Button>
              <p className="mt-4 text-[13px] text-muted">
                Garantia incondicional de 7 dias — se não fizer sentido pra você, devolvemos 100%.
              </p>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section className="py-8">
          <Reveal>
            <h2 className="font-display mb-1 text-[24px] font-semibold text-primary-dark sm:text-[28px]">
              Perguntas frequentes
            </h2>
          </Reveal>
          <div className="mt-4">
            {FAQS.map((f, i) => (
              <FAQItem key={i} question={f.q} answer={f.a} />
            ))}
          </div>
        </section>
      </main>

      <Footer />

      {/* Sticky mobile CTA */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-3 backdrop-blur sm:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <Button as="a" href={checkoutUrl} fullWidth>
          Quero meu protocolo — R$ 97
        </Button>
      </motion.div>
    </div>
  );
}
