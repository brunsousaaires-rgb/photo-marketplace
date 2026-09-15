export type AreaId = "ombro" | "coluna" | "joelho" | "quadril";
export type GoalId = "dor" | "mobilidade" | "treinar";

export type EquipId =
  | "nenhum"
  | "colchonete"
  | "elastico_leve"
  | "elastico_medio"
  | "elastico_forte"
  | "halteres"
  | "kettlebell"
  | "banco"
  | "cadeira"
  | "bola_suica";

export type DemoType =
  | "arm-circle"
  | "arm-raise"
  | "scapular-squeeze"
  | "wall-lean"
  | "spine-wave"
  | "plank"
  | "floor-limb-raise"
  | "bridge"
  | "trunk-rotate"
  | "squat"
  | "lunge"
  | "step"
  | "calf-raise"
  | "leg-swing"
  | "walk";

export interface Demo {
  type: DemoType;
  variant?: string;
}

export interface Area {
  id: AreaId;
  label: string;
  desc: string;
  icon: "shoulder" | "spine" | "knee" | "hip";
}

export interface Equip {
  id: EquipId;
  label: string;
  icon: string;
}

export interface Goal {
  id: GoalId;
  label: string;
}

export interface Exercise {
  nome: string;
  series: string;
  xp: number;
  demo: Demo;
  equipamento: EquipId[];
  alternativa?: string;
  dica: string;
}

export interface Fase {
  titulo: string;
  subtitulo: string;
  exercicios: Exercise[];
}

export interface Routine {
  nome: string;
  aviso: string;
  fases: Fase[];
}

export const AREAS: Area[] = [
  { id: "ombro", label: "Ombro", desc: "Dor ao levantar o braço ou dormir de lado", icon: "shoulder" },
  { id: "coluna", label: "Coluna", desc: "Lombar ou cervical travada, dor ao sentar muito tempo", icon: "spine" },
  { id: "joelho", label: "Joelho", desc: "Dor ao subir escada, agachar ou correr", icon: "knee" },
  { id: "quadril", label: "Quadril", desc: "Rigidez ao caminhar ou levantar da cadeira", icon: "hip" },
];

export const EQUIPS: Equip[] = [
  { id: "nenhum", label: "Nenhum equipamento", icon: "hand" },
  { id: "colchonete", label: "Colchonete ou tapete", icon: "mat" },
  { id: "elastico_leve", label: "Elástico leve", icon: "band" },
  { id: "elastico_medio", label: "Elástico médio", icon: "band" },
  { id: "elastico_forte", label: "Elástico forte", icon: "band" },
  { id: "halteres", label: "Halteres", icon: "dumbbell" },
  { id: "kettlebell", label: "Kettlebell", icon: "kettlebell" },
  { id: "banco", label: "Banco ou step", icon: "bench" },
  { id: "cadeira", label: "Cadeira", icon: "chair" },
  { id: "bola_suica", label: "Bola suíça", icon: "ball" },
];

export const GOALS: Goal[] = [
  { id: "dor", label: "Reduzir a dor no dia a dia" },
  { id: "mobilidade", label: "Recuperar mobilidade" },
  { id: "treinar", label: "Voltar a treinar com segurança" },
];

function ex(
  nome: string,
  series: string,
  demo: Demo,
  equipamento: EquipId[],
  dica: string,
  alternativa?: string
): Exercise {
  return { nome, series, xp: 10, demo, equipamento, dica, alternativa };
}

export const ROUTINES: Record<AreaId, Routine> = {
  ombro: {
    nome: "Protocolo de descompressão do ombro",
    aviso: "Pare se sentir dor aguda (não confundir com o desconforto leve do alongamento).",
    fases: [
      {
        titulo: "Semanas 1–2",
        subtitulo: "Descompressão",
        exercicios: [
          ex(
            "Rotação de ombro com bastão/cabo de vassoura",
            "3x10 cada lado",
            { type: "arm-circle", variant: "wide" },
            ["nenhum"],
            "Segure o bastão com as duas mãos e gire os ombros devagar, sem forçar a amplitude."
          ),
          ex(
            "Elevação escapular controlada",
            "3x12",
            { type: "scapular-squeeze", variant: "shrug" },
            ["nenhum"],
            "Suba os ombros em direção às orelhas e solte devagar, sentindo o alongamento."
          ),
          ex(
            "Rotação externa com elástico",
            "3x15",
            { type: "arm-circle", variant: "small" },
            ["elastico_leve"],
            "Cotovelo colado ao corpo, gire o antebraço para fora sem mover o ombro.",
            "Sem elástico: faça o mesmo movimento apenas com o peso do braço, controlando bem a rotação."
          ),
          ex(
            "Pêndulo de Codman",
            "2x30s cada lado",
            { type: "arm-circle", variant: "pendulum" },
            ["nenhum"],
            "Incline o tronco e deixe o braço balançar livremente, como um pêndulo."
          ),
        ],
      },
      {
        titulo: "Semanas 3–4",
        subtitulo: "Fortalecimento inicial",
        exercicios: [
          ex(
            "Rotação interna com elástico",
            "3x12",
            { type: "arm-circle", variant: "small" },
            ["elastico_leve"],
            "Cotovelo fixo no corpo, gire o antebraço para dentro com controle.",
            "Sem elástico: faça o giro no ar e contraia por 3s no fim do movimento."
          ),
          ex(
            "Elevação frontal controlada (peso leve)",
            "3x10",
            { type: "arm-raise", variant: "front" },
            ["halteres"],
            "Suba o braço à frente até a altura do ombro, sem balançar o corpo.",
            "Sem peso: eleve o braço até a altura do ombro e segure 2s no topo."
          ),
          ex(
            "Retração escapular (remada isométrica)",
            "3x15",
            { type: "scapular-squeeze", variant: "row" },
            ["elastico_medio"],
            "Puxe os cotovelos para trás, aproximando as escápulas.",
            "Sem elástico: junte as escápulas e segure 3s, como se prendesse um lápis entre elas."
          ),
          ex(
            "Alongamento peitoral na parede",
            "2x30s",
            { type: "wall-lean", variant: "chest" },
            ["nenhum"],
            "Apoie o antebraço na parede e gire o corpo suavemente para o lado oposto."
          ),
        ],
      },
      {
        titulo: "Semanas 5–6",
        subtitulo: "Retorno funcional",
        exercicios: [
          ex(
            "Elevação lateral controlada",
            "3x12",
            { type: "arm-raise", variant: "lateral" },
            ["halteres"],
            "Suba os braços para os lados até a linha dos ombros, cotovelos levemente flexionados.",
            "Sem peso: suba o braço lateralmente e controle bem a descida."
          ),
          ex(
            "Rotação com carga progressiva (halteres)",
            "3x10",
            { type: "arm-circle", variant: "small" },
            ["halteres"],
            "Cotovelo a 90°, gire o antebraço para fora e para dentro com carga leve.",
            "Sem halteres: aumente as repetições mantendo o movimento bem controlado."
          ),
          ex(
            "Prancha com apoio nos antebraços",
            "3x20s",
            { type: "plank", variant: "forearm" },
            ["colchonete"],
            "Corpo alinhado da cabeça aos calcanhares, abdômen contraído.",
            "Sem colchonete: use um tapete ou toalha dobrada para proteger os cotovelos."
          ),
          ex(
            "Flexão de parede (wall push-up)",
            "3x10",
            { type: "wall-lean", variant: "pushup" },
            ["nenhum"],
            "Mãos na parede na altura dos ombros, flexione os cotovelos aproximando o peito da parede."
          ),
        ],
      },
    ],
  },
  coluna: {
    nome: "Protocolo de descompressão da coluna",
    aviso: "Movimentos lentos, sem repique. Respire fundo em cada posição.",
    fases: [
      {
        titulo: "Semanas 1–2",
        subtitulo: "Descompressão",
        exercicios: [
          ex(
            "Gato-camelo",
            "3x10 devagar",
            { type: "spine-wave", variant: "catcamel" },
            ["colchonete"],
            "Alterne entre arredondar e arquear a coluna, seguindo a respiração.",
            "Sem colchonete: faça sobre um tapete ou carpete."
          ),
          ex(
            "Prancha isométrica curta",
            "3x20s",
            { type: "plank", variant: "forearm" },
            ["colchonete"],
            "Mantenha o corpo reto, sem deixar o quadril cair."
          ),
          ex(
            "Extensão lombar controlada (cobra baixa)",
            "3x8",
            { type: "spine-wave", variant: "cobra" },
            ["colchonete"],
            "Deitado de bruços, eleve o tronco levemente usando a lombar, sem forçar."
          ),
          ex(
            "Alongamento de piriforme sentado",
            "2x30s cada lado",
            { type: "trunk-rotate", variant: "seated" },
            ["cadeira"],
            "Cruze uma perna sobre a outra e incline o tronco à frente.",
            "Sem cadeira: faça sentado no chão."
          ),
        ],
      },
      {
        titulo: "Semanas 3–4",
        subtitulo: "Fortalecimento do core",
        exercicios: [
          ex(
            "Prancha lateral curta",
            "2x15s cada lado",
            { type: "plank", variant: "side" },
            ["colchonete"],
            "Apoie o antebraço e a lateral do pé, mantendo o corpo alinhado."
          ),
          ex(
            "Superman controlado",
            "3x10",
            { type: "floor-limb-raise", variant: "superman" },
            ["colchonete"],
            "Eleve braço e perna opostos ao mesmo tempo, sem pressa."
          ),
          ex(
            "Dead bug (ativação de core)",
            "3x10 cada lado",
            { type: "floor-limb-raise", variant: "deadbug" },
            ["colchonete"],
            "Estenda braço e perna opostos mantendo a lombar apoiada no chão."
          ),
          ex(
            "Alongamento de isquiotibiais sentado",
            "2x30s",
            { type: "trunk-rotate", variant: "forward-fold" },
            ["colchonete"],
            "Pernas estendidas, incline o tronco à frente mantendo a coluna longa."
          ),
        ],
      },
      {
        titulo: "Semanas 5–6",
        subtitulo: "Retorno funcional",
        exercicios: [
          ex(
            "Agachamento com apoio",
            "3x10",
            { type: "squat", variant: "partial" },
            ["cadeira"],
            "Desça como se fosse sentar, apoiando levemente as mãos.",
            "Sem cadeira: use uma parede como referência de profundidade."
          ),
          ex(
            "Prancha completa",
            "3x30s",
            { type: "plank", variant: "forearm" },
            ["colchonete"],
            "Aumente o tempo mantendo a técnica perfeita, sem compensar com a lombar."
          ),
          ex(
            "Rotação de tronco controlada em pé",
            "3x10 cada lado",
            { type: "trunk-rotate", variant: "standing" },
            ["nenhum"],
            "Gire o tronco mantendo o quadril estável, olhando para trás devagar."
          ),
          ex(
            "Caminhada com postura ativa",
            "10 min",
            { type: "walk", variant: "normal" },
            ["nenhum"],
            "Ombros para trás, olhar no horizonte, passos leves e constantes."
          ),
        ],
      },
    ],
  },
  joelho: {
    nome: "Protocolo de estabilização do joelho",
    aviso: "Evite travar o joelho no final do movimento.",
    fases: [
      {
        titulo: "Semanas 1–2",
        subtitulo: "Estabilização",
        exercicios: [
          ex(
            "Elevação de perna reta (isometria de quadríceps)",
            "3x12 cada lado",
            { type: "floor-limb-raise", variant: "legraise" },
            ["colchonete"],
            "Perna esticada, contraia a coxa e eleve cerca de 30cm."
          ),
          ex(
            "Agachamento parcial na parede",
            "3x10",
            { type: "squat", variant: "wall" },
            ["nenhum"],
            "Costas na parede, desça até meio agachamento e suba devagar."
          ),
          ex(
            "Ponte de glúteo",
            "3x12",
            { type: "bridge", variant: "double" },
            ["colchonete"],
            "Pés apoiados, eleve o quadril contraindo o glúteo no topo."
          ),
          ex(
            "Extensão de joelho sentado com elástico",
            "3x15",
            { type: "leg-swing", variant: "seated-extension" },
            ["elastico_leve", "cadeira"],
            "Sentado, estenda o joelho até a perna ficar reta, sem travar.",
            "Sem elástico: estenda o joelho controlando bem a descida por 3s."
          ),
        ],
      },
      {
        titulo: "Semanas 3–4",
        subtitulo: "Fortalecimento",
        exercicios: [
          ex(
            "Agachamento na cadeira (sentar e levantar)",
            "3x10",
            { type: "squat", variant: "chair" },
            ["cadeira"],
            "Desça controlado até tocar a cadeira e levante sem impulso."
          ),
          ex(
            "Step-up baixo",
            "3x8 cada lado",
            { type: "step", variant: "low" },
            ["banco"],
            "Suba com uma perna, controle a descida, sem pular.",
            "Sem banco/step: use o primeiro degrau de uma escada."
          ),
          ex(
            "Elevação de perna lateral",
            "3x12 cada lado",
            { type: "leg-swing", variant: "lying-abduction" },
            ["colchonete"],
            "Deitado de lado, eleve a perna de cima mantendo o quadril estável."
          ),
          ex(
            "Panturrilha em pé",
            "3x15",
            { type: "calf-raise", variant: "standing" },
            ["nenhum"],
            "Suba na ponta dos pés e desça devagar, sem pressa."
          ),
        ],
      },
      {
        titulo: "Semanas 5–6",
        subtitulo: "Retorno funcional",
        exercicios: [
          ex(
            "Agachamento livre controlado",
            "3x12",
            { type: "squat", variant: "full" },
            ["nenhum"],
            "Desça como se fosse sentar numa cadeira invisível, joelhos alinhados aos pés."
          ),
          ex(
            "Subida de step alto",
            "3x10 cada lado",
            { type: "step", variant: "high" },
            ["banco"],
            "Empurre com o calcanhar da perna de cima, controle a descida.",
            "Sem banco: use um degrau mais alto de escada."
          ),
          ex(
            "Avanço estático (lunge)",
            "3x8 cada lado",
            { type: "lunge", variant: "dynamic" },
            ["nenhum"],
            "Passo à frente, desça o joelho de trás sem tocar o chão com força."
          ),
          ex(
            "Caminhada com mudança de direção",
            "10 min",
            { type: "walk", variant: "agility" },
            ["nenhum"],
            "Alterne direções mantendo o passo controlado e o core ativado."
          ),
        ],
      },
    ],
  },
  quadril: {
    nome: "Protocolo de mobilidade de quadril",
    aviso: "Trabalhe dentro da amplitude confortável, sem forçar.",
    fases: [
      {
        titulo: "Semanas 1–2",
        subtitulo: "Mobilidade",
        exercicios: [
          ex(
            "Círculos de quadril em pé",
            "2x10 cada direção",
            { type: "leg-swing", variant: "hip-circles" },
            ["nenhum"],
            "Mãos na cintura, desenhe círculos amplos com o quadril."
          ),
          ex(
            "Abdução de quadril deitado",
            "3x12 cada lado",
            { type: "leg-swing", variant: "lying-abduction" },
            ["colchonete"],
            "Deitado de lado, eleve a perna reta sem girar o quadril para trás."
          ),
          ex(
            "Agachamento profundo assistido",
            "3x8",
            { type: "squat", variant: "assisted" },
            ["cadeira"],
            "Desça o máximo confortável, segurando em um apoio para equilíbrio.",
            "Sem apoio: segure em uma parede ou batente de porta."
          ),
          ex(
            "Alongamento de flexor de quadril ajoelhado",
            "2x30s cada lado",
            { type: "lunge", variant: "static-stretch" },
            ["colchonete"],
            "Joelho de trás no chão, empurre o quadril à frente suavemente."
          ),
        ],
      },
      {
        titulo: "Semanas 3–4",
        subtitulo: "Fortalecimento",
        exercicios: [
          ex(
            "Ponte unilateral",
            "3x10 cada lado",
            { type: "bridge", variant: "single" },
            ["colchonete"],
            "Uma perna estendida, eleve o quadril apoiando só um pé."
          ),
          ex(
            "Abdução de quadril em pé com elástico",
            "3x15 cada lado",
            { type: "leg-swing", variant: "standing-abduction" },
            ["elastico_medio"],
            "Tronco estável, afaste a perna lateralmente sem inclinar o corpo.",
            "Sem elástico: aumente as repetições controlando bem a descida da perna."
          ),
          ex(
            "Agachamento sumô parcial",
            "3x10",
            { type: "squat", variant: "sumo" },
            ["nenhum"],
            "Pés afastados e apontados para fora, desça controlando os joelhos."
          ),
          ex(
            "Alongamento de glúteo (figura 4)",
            "2x30s cada lado",
            { type: "floor-limb-raise", variant: "figure4" },
            ["colchonete"],
            "Deitado, cruze o tornozelo sobre o joelho oposto e puxe a coxa em direção ao peito."
          ),
        ],
      },
      {
        titulo: "Semanas 5–6",
        subtitulo: "Retorno funcional",
        exercicios: [
          ex(
            "Agachamento sumô completo",
            "3x12",
            { type: "squat", variant: "sumo" },
            ["nenhum"],
            "Desça até a linha dos joelhos, mantendo o tronco ereto."
          ),
          ex(
            "Passada lateral com elástico",
            "3x10 cada lado",
            { type: "leg-swing", variant: "lateral-walk" },
            ["elastico_medio"],
            "Elástico nos tornozelos, dê passos largos para o lado mantendo a tensão.",
            "Sem elástico: dê passadas laterais amplas controlando bem a descida."
          ),
          ex(
            "Elevação de quadril com carga",
            "3x12",
            { type: "bridge", variant: "loaded" },
            ["halteres"],
            "Apoie o peso sobre o quadril e eleve contraindo o glúteo.",
            "Sem carga: segure a posição no topo por 3s a cada repetição."
          ),
          ex(
            "Caminhada funcional com passada ampla",
            "10 min",
            { type: "walk", variant: "long-stride" },
            ["nenhum"],
            "Passadas mais largas que o normal, braços acompanhando o movimento."
          ),
        ],
      },
    ],
  },
};

export function exerciseDisplay(exercise: Exercise, ownedEquip: EquipId[]) {
  const needsEquip = !exercise.equipamento.includes("nenhum");
  const hasMatch = exercise.equipamento.some((e) => e === "nenhum" || ownedEquip.includes(e));
  if (!needsEquip || hasMatch || !exercise.alternativa) {
    return { nome: exercise.nome, usingAlternativa: false };
  }
  return { nome: exercise.nome, usingAlternativa: true };
}
