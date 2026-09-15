import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "artiko_progress_v1";

interface ProgressState {
  xp: number;
  streakDays: number;
  lastCompletionDate: string | null;
  completedToday: string[];
  completedTodayDate: string | null;
  phasesCompletedEver: number;
}

const DEFAULT_STATE: ProgressState = {
  xp: 0,
  streakDays: 0,
  lastCompletionDate: null,
  completedToday: [],
  completedTodayDate: null,
  phasesCompletedEver: 0,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isYesterday(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

function loadState(): ProgressState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const state = { ...DEFAULT_STATE, ...parsed };
    if (state.completedTodayDate !== todayKey()) {
      state.completedToday = [];
      state.completedTodayDate = todayKey();
    }
    return state;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: ProgressState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponível (ex.: modo privado) — progresso não persiste nesta sessão
  }
}

export const EXERCISE_XP = 10;
export const PHASE_BONUS_XP = 30;

export function levelFromXp(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export const BADGES = [
  { id: "week1", label: "Primeiro treino", desc: "Complete todos os exercícios de uma fase", icon: "🌱" },
  { id: "streak3", label: "3 dias seguidos", desc: "Treine 3 dias seguidos", icon: "🔥" },
  { id: "streak7", label: "1 semana de foco", desc: "Treine 7 dias seguidos", icon: "🏆" },
  { id: "xp500", label: "500 XP", desc: "Acumule 500 pontos de experiência", icon: "⭐" },
] as const;

export type BadgeId = (typeof BADGES)[number]["id"];

function computeBadges(state: Pick<ProgressState, "xp" | "streakDays" | "phasesCompletedEver">) {
  const set = new Set<BadgeId>();
  if (state.phasesCompletedEver > 0) set.add("week1");
  if (state.streakDays >= 3) set.add("streak3");
  if (state.streakDays >= 7) set.add("streak7");
  if (state.xp >= 500) set.add("xp500");
  return set;
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const exerciseKey = useCallback(
    (area: string, faseIndex: number, exIndex: number) => `${area}:${faseIndex}:${exIndex}`,
    []
  );

  const isExerciseDone = useCallback((key: string) => state.completedToday.includes(key), [state.completedToday]);

  const toggleExercise = useCallback((key: string) => {
    setState((prev) => {
      const done = prev.completedToday.includes(key);
      if (done) {
        return { ...prev, xp: Math.max(0, prev.xp - EXERCISE_XP), completedToday: prev.completedToday.filter((k) => k !== key) };
      }
      return { ...prev, xp: prev.xp + EXERCISE_XP, completedToday: [...prev.completedToday, key] };
    });
  }, []);

  const completePhase = useCallback((phaseKey: string) => {
    setState((prev) => {
      const doneKey = `phase:${phaseKey}`;
      if (prev.completedToday.includes(doneKey)) return prev;
      const today = todayKey();
      let streakDays = prev.streakDays;
      if (prev.lastCompletionDate === today) {
        // já contabilizado hoje por outra fase
      } else if (prev.lastCompletionDate && isYesterday(prev.lastCompletionDate)) {
        streakDays += 1;
      } else {
        streakDays = 1;
      }
      return {
        ...prev,
        xp: prev.xp + PHASE_BONUS_XP,
        completedToday: [...prev.completedToday, doneKey],
        lastCompletionDate: today,
        streakDays,
        phasesCompletedEver: prev.phasesCompletedEver + 1,
      };
    });
  }, []);

  const isPhaseCompletedToday = useCallback(
    (phaseKey: string) => state.completedToday.includes(`phase:${phaseKey}`),
    [state.completedToday]
  );

  return {
    xp: state.xp,
    streakDays: state.streakDays,
    level: levelFromXp(state.xp),
    xpIntoLevel: state.xp % 100,
    badges: computeBadges(state),
    exerciseKey,
    isExerciseDone,
    toggleExercise,
    completePhase,
    isPhaseCompletedToday,
  };
}
