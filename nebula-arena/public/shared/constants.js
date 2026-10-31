// Constantes do jogo. Compartilhadas entre cliente e (futuro) servidor.
export const WORLD_SIZE = 3600;

export const CFG = {
  tickRate: 60,
  orbTarget: 650,
  orbMax: 1100,
  maxPowerups: 6,
  powerupEvery: 6,
  baseR: 20,
  baseHp: 100,
  spawnInvuln: 3,
  respawnBot: 3,
  bulletLife: 0.75,
  bulletR: 6,
  dashTime: 0.16,
  dashMult: 3.4,
  outOfCombatRegen: 4, // segundos sem levar dano para regenerar mais rápido
  baseRegen: 1.5,
  kingMinScore: 80,
};

export const POWERUPS = {
  escudo: { color: '#5ad1ff', dur: 5, label: 'ESCUDO', icon: '◈' },
  furia: { color: '#ff5a7a', dur: 8, label: 'FÚRIA', icon: '✦' },
  turbo: { color: '#ffd35a', dur: 8, label: 'TURBO', icon: '➤' },
  cura: { color: '#6dff8a', dur: 0, label: 'CURA', icon: '✚' },
};

export const ORB_COLORS = { 1: '#7af0ff', 3: '#b98aff', 8: '#ffd35a' };

export function xpFor(level) {
  return Math.floor(12 + level * level * 5);
}

export const IDLE_INPUT = Object.freeze({ mx: 0, my: 0, angle: null, shoot: false, dash: false });
