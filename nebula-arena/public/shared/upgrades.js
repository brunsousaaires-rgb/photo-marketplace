// Melhorias escolhidas ao subir de nível (3 opções aleatórias por nível).
export const UPGRADES = [
  { id: 'dano', name: 'Dano', desc: '+20% de dano por tiro', icon: '💥', max: 8, apply: (p) => { p.stats.dmg *= 1.2; } },
  { id: 'cadencia', name: 'Cadência', desc: '+15% tiros por segundo', icon: '⚡', max: 8, apply: (p) => { p.stats.fireRate *= 1.15; } },
  { id: 'projetil', name: 'Projétil Veloz', desc: '+15% velocidade e alcance', icon: '🎯', max: 5, apply: (p) => { p.stats.bulletSpeed *= 1.15; } },
  { id: 'multitiro', name: 'Multitiro', desc: '+1 projétil por disparo', icon: '🔱', max: 3, apply: (p) => { p.stats.multishot += 1; p.stats.dmg *= 0.9; } },
  { id: 'perfurar', name: 'Perfuração', desc: 'Tiros atravessam +1 inimigo', icon: '🗡️', max: 3, apply: (p) => { p.stats.pierce += 1; } },
  { id: 'agilidade', name: 'Agilidade', desc: '+8% velocidade de movimento', icon: '👟', max: 5, apply: (p) => { p.stats.speed *= 1.08; } },
  { id: 'vitalidade', name: 'Vitalidade', desc: '+25 de vida máxima', icon: '❤️', max: 8, apply: (p) => { p.maxHp += 25; p.hp += 25; } },
  { id: 'regen', name: 'Regeneração', desc: '+2 de vida por segundo', icon: '✚', max: 5, apply: (p) => { p.stats.regen += 2; } },
  { id: 'ima', name: 'Ímã', desc: '+40% raio de coleta', icon: '🧲', max: 4, apply: (p) => { p.stats.magnet *= 1.4; } },
  { id: 'dash', name: 'Impulso', desc: '-20% recarga do dash', icon: '💨', max: 4, apply: (p) => { p.stats.dashCd *= 0.8; } },
  { id: 'vampiro', name: 'Vampirismo', desc: 'Cura 6% do dano causado', icon: '🩸', max: 4, apply: (p) => { p.stats.lifesteal += 0.06; } },
  { id: 'blindagem', name: 'Blindagem', desc: '-10% de dano recebido', icon: '🛡️', max: 4, apply: (p) => { p.stats.armor += 0.1; } },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export function rollChoices(p, n = 3) {
  const pool = UPGRADES.filter((u) => (p.upgrades[u.id] || 0) < u.max);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((u) => u.id);
}

export function applyUpgrade(p, id) {
  const u = UPGRADE_BY_ID[id];
  if (!u) return false;
  u.apply(p);
  p.upgrades[id] = (p.upgrades[id] || 0) + 1;
  return true;
}
