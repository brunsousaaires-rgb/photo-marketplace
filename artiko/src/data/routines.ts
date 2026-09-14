export type AreaId = "ombro" | "coluna" | "joelho" | "quadril";
export type EquipId = "nenhum" | "elastico" | "halteres" | "banco";
export type GoalId = "dor" | "mobilidade" | "treinar";

export interface Area {
  id: AreaId;
  label: string;
  desc: string;
  icon: "shoulder" | "spine" | "knee" | "hip";
}

export interface Equip {
  id: EquipId;
  label: string;
}

export interface Goal {
  id: GoalId;
  label: string;
}

export interface Exercise {
  nome: string;
  series: string;
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
  { id: "nenhum", label: "Nenhum equipamento" },
  { id: "elastico", label: "Faixa elástica" },
  { id: "halteres", label: "Halteres leves" },
  { id: "banco", label: "Banco / step" },
];

export const GOALS: Goal[] = [
  { id: "dor", label: "Reduzir a dor no dia a dia" },
  { id: "mobilidade", label: "Recuperar mobilidade" },
  { id: "treinar", label: "Voltar a treinar com segurança" },
];

export const ROUTINES: Record<AreaId, Routine> = {
  ombro: {
    nome: "Protocolo de descompressão do ombro",
    aviso: "Pare se sentir dor aguda (não confundir com o desconforto leve do alongamento).",
    fases: [
      {
        titulo: "Semanas 1–2",
        subtitulo: "Descompressão",
        exercicios: [
          { nome: "Rotação de ombro com bastão/cabo de vassoura", series: "3x10 cada lado" },
          { nome: "Elevação escapular controlada", series: "3x12" },
          { nome: "Rotação externa com elástico", series: "3x15" },
          { nome: "Pêndulo de Codman", series: "2x30s cada lado" },
        ],
      },
      {
        titulo: "Semanas 3–4",
        subtitulo: "Fortalecimento inicial",
        exercicios: [
          { nome: "Rotação interna com elástico", series: "3x12" },
          { nome: "Elevação frontal controlada (peso leve)", series: "3x10" },
          { nome: "Retração escapular (remada isométrica)", series: "3x15" },
          { nome: "Alongamento peitoral na parede", series: "2x30s" },
        ],
      },
      {
        titulo: "Semanas 5–6",
        subtitulo: "Retorno funcional",
        exercicios: [
          { nome: "Elevação lateral controlada", series: "3x12" },
          { nome: "Rotação com carga progressiva (halteres)", series: "3x10" },
          { nome: "Prancha com apoio nos antebraços", series: "3x20s" },
          { nome: "Flexão de parede (wall push-up)", series: "3x10" },
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
          { nome: "Gato-camelo", series: "3x10 devagar" },
          { nome: "Prancha isométrica curta", series: "3x20s" },
          { nome: "Extensão lombar controlada (cobra baixa)", series: "3x8" },
          { nome: "Alongamento de piriforme sentado", series: "2x30s cada lado" },
        ],
      },
      {
        titulo: "Semanas 3–4",
        subtitulo: "Fortalecimento do core",
        exercicios: [
          { nome: "Prancha lateral curta", series: "2x15s cada lado" },
          { nome: "Superman controlado", series: "3x10" },
          { nome: "Dead bug (ativação de core)", series: "3x10 cada lado" },
          { nome: "Alongamento de isquiotibiais sentado", series: "2x30s" },
        ],
      },
      {
        titulo: "Semanas 5–6",
        subtitulo: "Retorno funcional",
        exercicios: [
          { nome: "Agachamento com apoio", series: "3x10" },
          { nome: "Prancha completa", series: "3x30s" },
          { nome: "Rotação de tronco controlada em pé", series: "3x10 cada lado" },
          { nome: "Caminhada com postura ativa", series: "10 min" },
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
          { nome: "Elevação de perna reta (isometria de quadríceps)", series: "3x12 cada lado" },
          { nome: "Agachamento parcial na parede", series: "3x10" },
          { nome: "Ponte de glúteo", series: "3x12" },
          { nome: "Extensão de joelho sentado com elástico", series: "3x15" },
        ],
      },
      {
        titulo: "Semanas 3–4",
        subtitulo: "Fortalecimento",
        exercicios: [
          { nome: "Agachamento na cadeira (sentar e levantar)", series: "3x10" },
          { nome: "Step-up baixo", series: "3x8 cada lado" },
          { nome: "Elevação de perna lateral", series: "3x12 cada lado" },
          { nome: "Panturrilha em pé", series: "3x15" },
        ],
      },
      {
        titulo: "Semanas 5–6",
        subtitulo: "Retorno funcional",
        exercicios: [
          { nome: "Agachamento livre controlado", series: "3x12" },
          { nome: "Subida de step alto", series: "3x10 cada lado" },
          { nome: "Avanço estático (lunge)", series: "3x8 cada lado" },
          { nome: "Caminhada com mudança de direção", series: "10 min" },
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
          { nome: "Círculos de quadril em pé", series: "2x10 cada direção" },
          { nome: "Abdução de quadril deitado", series: "3x12 cada lado" },
          { nome: "Agachamento profundo assistido", series: "3x8" },
          { nome: "Alongamento de flexor de quadril ajoelhado", series: "2x30s cada lado" },
        ],
      },
      {
        titulo: "Semanas 3–4",
        subtitulo: "Fortalecimento",
        exercicios: [
          { nome: "Ponte unilateral", series: "3x10 cada lado" },
          { nome: "Abdução de quadril em pé com elástico", series: "3x15 cada lado" },
          { nome: "Agachamento sumô parcial", series: "3x10" },
          { nome: "Alongamento de glúteo (figura 4)", series: "2x30s cada lado" },
        ],
      },
      {
        titulo: "Semanas 5–6",
        subtitulo: "Retorno funcional",
        exercicios: [
          { nome: "Agachamento sumô completo", series: "3x12" },
          { nome: "Passada lateral com elástico", series: "3x10 cada lado" },
          { nome: "Elevação de quadril com carga", series: "3x12" },
          { nome: "Caminhada funcional com passada ampla", series: "10 min" },
        ],
      },
    ],
  },
};
