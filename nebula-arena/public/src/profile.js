// Progresso da conta (salvo no navegador por enquanto; no online vai para o servidor).
const KEY = 'nebula.profile.v1';

export const SKINS = [
  { id: 'ciano', name: 'Ciano', color: '#36e2ff', lvl: 1 },
  { id: 'rosa', name: 'Rosa Neon', color: '#ff4fa3', lvl: 1 },
  { id: 'lima', name: 'Lima', color: '#9dff4f', lvl: 2 },
  { id: 'laranja', name: 'Brasa', color: '#ff9b3d', lvl: 3 },
  { id: 'violeta', name: 'Violeta', color: '#a86bff', lvl: 4 },
  { id: 'dourado', name: 'Dourado', color: '#ffd23d', lvl: 6 },
  { id: 'gelo', name: 'Gelo', color: '#e8f6ff', lvl: 8 },
  { id: 'arcoiris', name: 'Arco-íris', color: 'rainbow', lvl: 10 },
];

const DEFAULT = { name: '', skin: 'ciano', totalXp: 0, bestScore: 0, bestKills: 0, bestLevel: 0, games: 0, totalKills: 0 };

export function accountLevel(xp) {
  return Math.floor(Math.sqrt(xp / 150)) + 1;
}
export function accountXpFor(level) {
  return 150 * (level - 1) ** 2;
}

export function loadProfile() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProfile(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

// Registra o fim de uma vida e devolve o que mudou (para a tela de morte).
export function recordLife(profile, life) {
  const beforeLvl = accountLevel(profile.totalXp);
  const earned = Math.floor(life.score + life.kills * 25);
  profile.totalXp += earned;
  profile.games++;
  profile.totalKills += life.kills;
  const records = [];
  if (life.score > profile.bestScore) { profile.bestScore = Math.floor(life.score); records.push('pontuação'); }
  if (life.kills > profile.bestKills) { profile.bestKills = life.kills; records.push('abates'); }
  if (life.level > profile.bestLevel) { profile.bestLevel = life.level; records.push('nível'); }
  const afterLvl = accountLevel(profile.totalXp);
  const unlocked = SKINS.filter((s) => s.lvl > beforeLvl && s.lvl <= afterLvl);
  saveProfile(profile);
  return { earned, beforeLvl, afterLvl, unlocked, records };
}
