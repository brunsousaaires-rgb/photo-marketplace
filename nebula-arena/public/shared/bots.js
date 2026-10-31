// IA dos bots (NPCs). Gera o mesmo tipo de "input" que um jogador humano,
// então no online os bots podem continuar preenchendo salas vazias.
import { CFG } from './constants.js';
import { UPGRADE_BY_ID } from './upgrades.js';

const rand = (a, b) => a + Math.random() * (b - a);

export const BOT_NAMES = [
  'Zé Foguete', 'NinjaDoSertão', 'Capivara_Pro', 'TioDoPix', 'Lagartixa', 'Xandão', 'Tsunami', 'Bruxa',
  'Pastel', 'Picanha', 'Turbina', 'Coxinha99', 'Saci', 'Boto Rosa', 'Curupira', 'Mandioca', 'Faísca',
  'Raio', 'Jabuti', 'Tatu Bola', 'Mula Sem Freio', 'Dona Bala', 'Cometa', 'Pipoca', 'Guaraná', 'Tropeiro',
  'Vovó Sniper', 'Cuscuz', 'Açaí', 'Brigadeiro', 'Furacão', 'Paçoca',
];

export const PERSONALITIES = {
  agressivo: { aggro: 900, fleeHp: 0.15, levelTol: 6, range: 280, dashIn: true, prefs: ['dano', 'cadencia', 'multitiro', 'vampiro', 'vitalidade'] },
  cacador: { aggro: 800, fleeHp: 0.3, levelTol: 2, range: 430, dashIn: false, prefs: ['projetil', 'dano', 'perfurar', 'cadencia'] },
  coletor: { aggro: 450, fleeHp: 0.5, levelTol: -1, range: 450, dashIn: false, prefs: ['ima', 'agilidade', 'regen', 'vitalidade', 'multitiro'] },
  equilibrado: { aggro: 650, fleeHp: 0.35, levelTol: 1, range: 360, dashIn: false, prefs: ['dano', 'cadencia', 'vitalidade', 'multitiro', 'regen'] },
  covarde: { aggro: 380, fleeHp: 0.65, levelTol: -2, range: 500, dashIn: false, prefs: ['agilidade', 'dash', 'blindagem', 'regen'] },
};

export function makeBotProfile(usedNames) {
  const free = BOT_NAMES.filter((n) => !usedNames.has(n));
  const name = free.length ? free[Math.floor(Math.random() * free.length)] : `Bot${Math.floor(Math.random() * 999)}`;
  const keys = Object.keys(PERSONALITIES);
  return {
    name,
    color: `hsl(${Math.floor(Math.random() * 360)}, 85%, 60%)`,
    isBot: true,
    skill: rand(0.25, 0.9),
    personality: keys[Math.floor(Math.random() * keys.length)],
  };
}

export function pickBotUpgrade(p) {
  if (!p.choices) return -1;
  const prefs = PERSONALITIES[p.personality]?.prefs || [];
  let best = 0, bestS = -1;
  p.choices.forEach((id, i) => {
    const s = (prefs.includes(id) ? 10 - prefs.indexOf(id) : 0) + Math.random() * 4;
    if (UPGRADE_BY_ID[id] && s > bestS) { bestS = s; best = i; }
  });
  return best;
}

export function botThink(w, p, dt) {
  const b = p.brain || (p.brain = { decideT: 0, targetId: null, goal: null, strafe: 1, strafeT: 0, aimErr: 0, mode: 'farm' });
  const P = PERSONALITIES[p.personality] || PERSONALITIES.equilibrado;
  b.decideT -= dt;
  b.strafeT -= dt;
  if (b.strafeT <= 0) { b.strafe = Math.random() < 0.5 ? -1 : 1; b.strafeT = rand(0.5, 1.8); }

  let tgt = b.targetId ? w.players.get(b.targetId) : null;
  if (tgt && !tgt.alive) { tgt = null; b.targetId = null; b.decideT = 0; }

  if (b.decideT <= 0) {
    b.decideT = rand(0.15, 0.32) * (1.4 - p.skill);
    let best = null, bestScore = -1e9, near = null, nd = 1e9;
    for (const e of w.players.values()) {
      if (e === p || !e.alive) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < nd) { nd = d; near = e; }
      if (d > P.aggro) continue;
      const s = -d + (e.hp < e.maxHp * 0.4 ? 250 : 0) + (e.id === w.kingId ? 200 : 0) + (p.level - e.level) * 20;
      if (s > bestScore) { bestScore = s; best = e; }
    }
    const hpRatio = p.hp / p.maxHp;
    if (near && nd < 600 && hpRatio < P.fleeHp) { b.mode = 'flee'; b.targetId = near.id; }
    else if (best && p.level >= best.level - P.levelTol) { b.mode = 'fight'; b.targetId = best.id; }
    else {
      b.mode = 'farm';
      b.targetId = near && nd < 420 ? near.id : null;
      let goal = null, gs = -1e9;
      for (const u of w.powerups) {
        const d = Math.hypot(u.x - p.x, u.y - p.y);
        if (d < 800 && 900 - d > gs) { gs = 900 - d; goal = u; }
      }
      for (const o of w.orbs) {
        const d = Math.abs(o.x - p.x) + Math.abs(o.y - p.y);
        const s = o.v * 45 - d;
        if (s > gs) { gs = s; goal = o; }
      }
      b.goal = goal ? { x: goal.x, y: goal.y } : { x: rand(300, w.size - 300), y: rand(300, w.size - 300) };
    }
    tgt = b.targetId ? w.players.get(b.targetId) : null;
  }

  let mx = 0, my = 0, shoot = false, dash = false, angle = p.angle;

  if (tgt && tgt.alive) {
    const dx = tgt.x - p.x, dy = tgt.y - p.y, d = Math.hypot(dx, dy) || 1;
    const lead = (d / p.stats.bulletSpeed) * p.skill;
    const ax = tgt.x + tgt.vx * lead - p.x, ay = tgt.y + tgt.vy * lead - p.y;
    b.aimErr = b.aimErr * 0.9 + (Math.random() - 0.5) * 0.5;
    angle = Math.atan2(ay, ax) + b.aimErr * (1 - p.skill) * 0.9;
    const range = p.stats.bulletSpeed * CFG.bulletLife * Math.sqrt(p.stats.bulletSpeed / 880);
    shoot = d < range * 1.05 && tgt.invuln <= 0;
    const ux = dx / d, uy = dy / d;
    if (b.mode === 'flee') {
      mx = -ux - uy * b.strafe * 0.6; my = -uy + ux * b.strafe * 0.6;
      if (p.dashCd <= 0 && d < 320 && Math.random() < 0.05) dash = true;
    } else if (b.mode === 'fight') {
      const radial = d > P.range + 60 ? 1 : d < P.range - 60 ? -1 : 0;
      mx = ux * radial - uy * b.strafe * 0.9; my = uy * radial + ux * b.strafe * 0.9;
      if (P.dashIn && d > P.range + 140 && p.dashCd <= 0 && Math.random() < 0.02) dash = true;
    }
  }

  if (b.mode === 'farm' && b.goal) {
    const dx = b.goal.x - p.x, dy = b.goal.y - p.y, d = Math.hypot(dx, dy) || 1;
    mx = dx / d; my = dy / d;
    if (!tgt) angle = Math.atan2(my, mx);
    if (d < 30) b.decideT = 0;
  }

  // Esquiva: dash para o lado quando um projétil vem na direção.
  if (p.dashCd <= 0 && !dash) {
    for (const bl of w.bullets) {
      if (bl.owner === p.id) continue;
      const rx = p.x - bl.x, ry = p.y - bl.y;
      if (rx * rx + ry * ry > 230 * 230) continue;
      const sp = Math.hypot(bl.vx, bl.vy) || 1, vx = bl.vx / sp, vy = bl.vy / sp;
      const along = rx * vx + ry * vy;
      if (along <= 0) continue;
      const perp = Math.abs(rx * vy - ry * vx);
      if (perp < p.r + 12 && Math.random() < p.skill * 0.06) {
        const side = rx * vy - ry * vx > 0 ? 1 : -1;
        mx = vy * side; my = -vx * side; dash = true;
        break;
      }
    }
  }

  // Evita as bordas.
  const m = 180, S = w.size;
  if (p.x < m) mx += 1; else if (p.x > S - m) mx -= 1;
  if (p.y < m) my += 1; else if (p.y > S - m) my -= 1;

  return { mx, my, angle, shoot, dash };
}
