// Simulação do jogo — código puro (sem DOM). Roda no navegador no modo local
// e vai rodar no servidor (autoritativo) no modo online.
import { WORLD_SIZE, CFG, POWERUPS, IDLE_INPUT, xpFor } from './constants.js';
import { rollChoices, applyUpgrade } from './upgrades.js';

let _id = 1;
const nid = () => _id++;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function baseStats() {
  return {
    dmg: 12, fireRate: 3.6, bulletSpeed: 880, multishot: 1, pierce: 0,
    speed: 290, regen: 0, magnet: 110, dashCd: 3.2, lifesteal: 0, armor: 0,
  };
}

export function createWorld() {
  const w = {
    t: 0, size: WORLD_SIZE, players: new Map(), bullets: [], orbs: [], powerups: [],
    events: [], powerupTimer: 2, kingId: null,
  };
  for (let i = 0; i < CFG.orbTarget; i++) spawnOrb(w);
  for (let i = 0; i < 3; i++) spawnPowerup(w);
  return w;
}

function orbValue() {
  const r = Math.random();
  return r < 0.72 ? 1 : r < 0.96 ? 3 : 8;
}

export function spawnOrb(w, x, y, v, vx = 0, vy = 0) {
  const val = v ?? orbValue();
  w.orbs.push({
    id: nid(), v: val, r: 5 + Math.sqrt(val) * 2.2, vx, vy, born: w.t,
    x: x ?? rand(40, w.size - 40), y: y ?? rand(40, w.size - 40),
  });
}

function spawnPowerup(w) {
  const kinds = Object.keys(POWERUPS);
  w.powerups.push({ id: nid(), kind: kinds[Math.floor(Math.random() * kinds.length)], x: rand(200, w.size - 200), y: rand(200, w.size - 200), born: w.t });
}

function findSpawn(w) {
  let best = null, bestD = -1;
  for (let i = 0; i < 14; i++) {
    const x = rand(150, w.size - 150), y = rand(150, w.size - 150);
    let md = 1e9;
    for (const p of w.players.values()) {
      if (!p.alive) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < md) md = d;
    }
    if (md > bestD) { bestD = md; best = { x, y }; }
  }
  return best;
}

export function addPlayer(w, { name, color, isBot = false, skill = 0.5, personality = 'equilibrado' }) {
  const p = { id: nid(), name, color, isBot, skill, personality, brain: null, alive: false, deaths: 0, lastLife: null };
  w.players.set(p.id, p);
  spawnPlayer(w, p);
  return p;
}

export function spawnPlayer(w, p) {
  const s = findSpawn(w);
  Object.assign(p, {
    x: s.x, y: s.y, vx: 0, vy: 0, angle: Math.random() * Math.PI * 2,
    r: CFG.baseR, hp: CFG.baseHp, maxHp: CFG.baseHp, level: 1, xp: 0, xpNext: xpFor(1),
    score: 0, kills: 0, alive: true, respawnAt: 0, fireCd: 0, dashCd: 0, dashT: 0, dashDx: 0, dashDy: 0,
    invuln: CFG.spawnInvuln, lastDamageAt: -99, lastHitBy: null, streak: 0, bestStreak: 0,
    multiN: 0, multiT: -99, buffs: { escudo: 0, furia: 0, turbo: 0 }, upgrades: {}, choices: null, pending: 0,
    stats: baseStats(), spawnedAt: w.t, damageDealt: 0, orbsCollected: 0, brain: null,
  });
  w.events.push({ type: 'spawn', id: p.id, x: p.x, y: p.y });
}

export function removePlayer(w, id) {
  w.players.delete(id);
  w.bullets = w.bullets.filter((b) => b.owner !== id);
}

export function chooseUpgrade(w, id, index) {
  const p = w.players.get(id);
  if (!p || !p.alive || !p.choices) return false;
  const upId = p.choices[index];
  if (!upId) return false;
  applyUpgrade(p, upId);
  p.pending--;
  p.choices = p.pending > 0 ? rollChoices(p) : null;
  if (p.choices && p.choices.length === 0) { p.choices = null; p.pending = 0; }
  w.events.push({ type: 'upgrade', id, up: upId });
  return true;
}

function gainXp(w, p, v) {
  p.xp += v;
  p.score += v;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = xpFor(p.level);
    p.maxHp += 4;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.15);
    p.r = CFG.baseR + Math.min(p.level, 30) * 0.45;
    p.pending++;
    if (!p.choices) {
      p.choices = rollChoices(p);
      if (p.choices.length === 0) { p.choices = null; p.pending = 0; p.stats.dmg *= 1.03; }
    }
    w.events.push({ type: 'levelup', id: p.id, level: p.level, x: p.x, y: p.y });
  }
}

function damage(w, target, amount, src) {
  if (!target.alive || target.invuln > 0 || target.dashT > 0) return 0;
  if (target.buffs.escudo > 0) {
    w.events.push({ type: 'block', x: target.x, y: target.y, target: target.id });
    return 0;
  }
  amount *= 1 - Math.min(0.6, target.stats.armor);
  target.hp -= amount;
  target.lastDamageAt = w.t;
  target.lastHitBy = src ? src.id : null;
  if (src) {
    src.damageDealt += amount;
    if (src.alive && src.stats.lifesteal > 0) src.hp = Math.min(src.maxHp, src.hp + amount * src.stats.lifesteal);
  }
  w.events.push({ type: 'hit', x: target.x, y: target.y, dmg: Math.round(amount), target: target.id, source: src ? src.id : null });
  if (target.hp <= 0) kill(w, target, src);
  return amount;
}

function kill(w, v, k) {
  const wasKing = w.kingId === v.id;
  v.alive = false;
  v.hp = 0;
  v.deaths++;
  v.respawnAt = w.t + CFG.respawnBot;
  v.lastLife = {
    score: Math.floor(v.score), kills: v.kills, level: v.level, time: w.t - v.spawnedAt,
    bestStreak: v.bestStreak, damage: Math.round(v.damageDealt), killerName: k ? k.name : null, killerId: k ? k.id : null,
  };

  // Solta parte da pontuação como orbes espalhados.
  const drop = Math.floor(v.score * 0.35) + 6;
  const n = clamp(Math.floor(drop / 4), 4, 24);
  const each = Math.max(1, Math.round(drop / n));
  for (let i = 0; i < n && w.orbs.length < CFG.orbMax; i++) {
    const a = Math.random() * Math.PI * 2, sp = rand(80, 340);
    spawnOrb(w, v.x, v.y, each, Math.cos(a) * sp, Math.sin(a) * sp);
  }

  let bonus = 0;
  if (k && k !== v && k.alive) {
    k.kills++;
    k.streak++;
    k.bestStreak = Math.max(k.bestStreak, k.streak);
    k.multiN = w.t - k.multiT < 4 ? k.multiN + 1 : 1;
    k.multiT = w.t;
    bonus = Math.floor((20 + v.score * 0.25) * (wasKing ? 1.5 : 1));
    gainXp(w, k, bonus);
    k.hp = Math.min(k.maxHp, k.hp + k.maxHp * 0.2); // cura ao abater
  }
  w.events.push({
    type: 'kill', killer: k ? k.id : null, killerName: k ? k.name : null, killerColor: k ? k.color : null,
    victim: v.id, victimName: v.name, victimColor: v.color, x: v.x, y: v.y, r: v.r,
    streak: k ? k.streak : 0, multi: k ? k.multiN : 0, king: wasKing, bonus,
  });
  v.streak = 0;
  v.choices = null;
  v.pending = 0;
}

function fire(w, p) {
  const n = p.stats.multishot, spread = 0.13, sp = p.stats.bulletSpeed;
  const life = CFG.bulletLife * Math.sqrt(sp / 880);
  const r = CFG.bulletR + clamp((p.stats.dmg - 12) / 8, 0, 4);
  for (let i = 0; i < n; i++) {
    const a = p.angle + (i - (n - 1) / 2) * spread;
    const ox = Math.cos(a), oy = Math.sin(a);
    w.bullets.push({
      id: nid(), owner: p.id, color: p.color, x: p.x + ox * (p.r + 8), y: p.y + oy * (p.r + 8),
      vx: ox * sp + p.vx * 0.25, vy: oy * sp + p.vy * 0.25, r, dmg: p.stats.dmg, life, pierce: p.stats.pierce, hit: [],
    });
  }
  p.vx -= Math.cos(p.angle) * 14;
  p.vy -= Math.sin(p.angle) * 14;
  w.events.push({ type: 'shot', id: p.id, x: p.x, y: p.y });
}

function applyPowerup(w, p, kind) {
  const def = POWERUPS[kind];
  if (kind === 'cura') p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.5);
  else p.buffs[kind] = def.dur;
  w.events.push({ type: 'power', id: p.id, kind, x: p.x, y: p.y });
}

export function step(w, dt, inputs) {
  w.t += dt;
  const S = w.size;
  const alive = [];

  for (const p of w.players.values()) {
    if (!p.alive) {
      if (p.isBot && w.t >= p.respawnAt) spawnPlayer(w, p);
      continue;
    }
    alive.push(p);
    const inp = inputs.get(p.id) || IDLE_INPUT;
    p.invuln = Math.max(0, p.invuln - dt);
    p.fireCd -= dt;
    p.dashCd -= dt;
    p.dashT -= dt;
    for (const k in p.buffs) p.buffs[k] = Math.max(0, p.buffs[k] - dt);

    let mx = inp.mx || 0, my = inp.my || 0;
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    const spd = p.stats.speed * (p.buffs.turbo > 0 ? 1.45 : 1) * (1 - Math.min(p.level, 30) * 0.004);

    if (inp.dash && p.dashCd <= 0) {
      let dx = mx, dy = my;
      if (Math.hypot(dx, dy) < 0.1) { dx = Math.cos(p.angle); dy = Math.sin(p.angle); }
      const l = Math.hypot(dx, dy);
      p.dashDx = dx / l; p.dashDy = dy / l;
      p.dashT = CFG.dashTime;
      p.dashCd = p.stats.dashCd;
      w.events.push({ type: 'dash', id: p.id, x: p.x, y: p.y });
    }
    if (p.dashT > 0) {
      p.vx = p.dashDx * spd * CFG.dashMult;
      p.vy = p.dashDy * spd * CFG.dashMult;
    } else {
      const k = Math.min(1, dt * 9);
      p.vx += (mx * spd - p.vx) * k;
      p.vy += (my * spd - p.vy) * k;
    }
    p.x = clamp(p.x + p.vx * dt, p.r, S - p.r);
    p.y = clamp(p.y + p.vy * dt, p.r, S - p.r);
    if (typeof inp.angle === 'number' && Number.isFinite(inp.angle)) p.angle = inp.angle;

    let rg = p.stats.regen;
    if (w.t - p.lastDamageAt > CFG.outOfCombatRegen) rg += CFG.baseRegen + p.maxHp * 0.02;
    p.hp = Math.min(p.maxHp, p.hp + rg * dt);

    if (inp.shoot && p.fireCd <= 0 && p.invuln <= 0.05) {
      fire(w, p);
      p.fireCd = 1 / (p.stats.fireRate * (p.buffs.furia > 0 ? 1.8 : 1));
    } else if (inp.shoot && p.invuln > 0.05) {
      p.invuln = 0; // atirar cancela a proteção de nascimento
    }
  }

  // Separação entre jogadores.
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i], b = alive[j];
      const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 < min * min && d2 > 0.0001) {
        const d = Math.sqrt(d2), push = (min - d) / 2, ux = dx / d, uy = dy / d;
        a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
      }
    }
  }

  // Projéteis.
  for (let i = w.bullets.length - 1; i >= 0; i--) {
    const b = w.bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let dead = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > S || b.y > S;
    if (!dead) {
      for (const p of alive) {
        if (!p.alive || p.id === b.owner || p.invuln > 0 || p.dashT > 0 || b.hit.includes(p.id)) continue;
        const dx = p.x - b.x, dy = p.y - b.y, rr = p.r + b.r;
        if (dx * dx + dy * dy < rr * rr) {
          damage(w, p, b.dmg, w.players.get(b.owner) || null);
          b.hit.push(p.id);
          if (b.pierce-- <= 0) { dead = true; break; }
        }
      }
    }
    if (dead) w.bullets.splice(i, 1);
  }

  // Orbes: movimento, ímã e coleta.
  const fr = Math.pow(0.03, dt);
  for (let i = w.orbs.length - 1; i >= 0; i--) {
    const o = w.orbs[i];
    if (o.vx || o.vy) {
      o.x = clamp(o.x + o.vx * dt, 10, S - 10); o.y = clamp(o.y + o.vy * dt, 10, S - 10);
      o.vx *= fr; o.vy *= fr;
      if (Math.abs(o.vx) + Math.abs(o.vy) < 4) { o.vx = 0; o.vy = 0; }
    }
    if (w.t - o.born < 0.35) continue;
    for (const p of alive) {
      if (!p.alive) continue;
      const dx = p.x - o.x, dy = p.y - o.y, m = p.stats.magnet + p.r;
      const d2 = dx * dx + dy * dy;
      if (d2 > m * m) continue;
      const d = Math.sqrt(d2);
      if (d < p.r + o.r) {
        gainXp(w, p, o.v);
        p.orbsCollected++;
        w.events.push({ type: 'pickup', id: p.id, v: o.v, x: o.x, y: o.y });
        w.orbs.splice(i, 1);
        break;
      }
      const pull = (220 + 600 * (1 - d / m)) * dt;
      o.x += (dx / d) * pull; o.y += (dy / d) * pull;
      break;
    }
  }
  if (w.orbs.length < CFG.orbTarget) for (let i = 0; i < 2; i++) spawnOrb(w);

  // Power-ups.
  w.powerupTimer -= dt;
  if (w.powerupTimer <= 0) {
    w.powerupTimer = CFG.powerupEvery;
    if (w.powerups.length < CFG.maxPowerups) spawnPowerup(w);
  }
  for (let i = w.powerups.length - 1; i >= 0; i--) {
    const u = w.powerups[i];
    for (const p of alive) {
      if (!p.alive) continue;
      const rr = p.r + 20;
      if ((p.x - u.x) ** 2 + (p.y - u.y) ** 2 < rr * rr) {
        applyPowerup(w, p, u.kind);
        w.powerups.splice(i, 1);
        break;
      }
    }
  }

  // Rei da arena: maior pontuação viva.
  let king = null;
  for (const p of w.players.values()) {
    if (p.alive && p.score >= CFG.kingMinScore && (!king || p.score > king.score)) king = p;
  }
  const newKing = king ? king.id : null;
  if (newKing !== w.kingId) {
    w.kingId = newKing;
    if (king) w.events.push({ type: 'king', id: king.id, name: king.name });
  }
}

// Ranking ordenado por pontuação (jogadores vivos).
export function leaderboard(w, n = 10) {
  return [...w.players.values()].filter((p) => p.alive).sort((a, b) => b.score - a.score).slice(0, n);
}

// Estado serializável — base do protocolo de rede da fase online.
export function snapshot(w) {
  return {
    t: w.t, kingId: w.kingId,
    players: [...w.players.values()].map((p) => ({
      id: p.id, name: p.name, color: p.color, alive: p.alive, x: p.x, y: p.y, vx: p.vx, vy: p.vy, angle: p.angle,
      r: p.r, hp: p.hp, maxHp: p.maxHp, level: p.level, score: Math.floor(p.score), kills: p.kills,
      invuln: p.invuln, dashT: p.dashT, buffs: p.buffs, multishot: p.stats.multishot,
    })),
    bullets: w.bullets.map((b) => ({ id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, r: b.r, color: b.color })),
    powerups: w.powerups,
  };
}
