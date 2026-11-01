// Regras e economia do jogo — funções puras sobre um estado JSON.
// Sem DOM e sem 3D: no online, o servidor usa este mesmo arquivo para validar as ações.
import {
  BUILDINGS, PARTS, CAR_TYPES, JOBS, SERVICE_OF, DEFAULT_PART, GRID_W, GRID_H,
  BUILDING_MAX_LEVEL, xpNeed, limitAt, part,
} from './data.js';

export const QUEUE_SLOTS = 5;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function newState() {
  const s = {
    v: 1, coins: 250, xp: 0, level: 1, seq: 1, buildings: [], queue: [], spawnIn: 1.5,
    missions: [], stats: { delivered: 0, customs: 0, washes: 0, repairs: 0, earned: 0, taps: 0, perfect: 0 },
    daily: { last: null, streak: 0 }, lastSeen: Date.now(), firstRun: true,
  };
  const add = (type, x, z) => s.buildings.push({ id: s.seq++, type, x, z, level: 1, job: null, stored: 0 });
  add('escritorio', 0, 0);
  add('elevador', 4, 0);
  add('cabine', 7, 0);
  add('arvore', 0, 7);
  add('flores', 1, 8);
  add('arvore', 15, 8);
  refillMissions(s);
  return s;
}

export const count = (s, type) => s.buildings.filter((b) => b.type === type).length;
export const has = (s, type) => count(s, type) > 0;

export function fame(s) {
  let f = 0;
  for (const b of s.buildings) {
    const def = BUILDINGS[b.type];
    if (def.decor) f += def.fame;
    else if (!def.fixed) f += (b.level - 1) * 2;
  }
  return f;
}

export const tipBonus = (s) => fame(s) / 250;
export const arrivalInterval = (s) => Math.max(2.8, 8.5 - fame(s) * 0.05) * rand(0.75, 1.25);

export function speedOf(b) {
  const def = BUILDINGS[b.type];
  return def.speed ? def.speed[b.level - 1] : 1;
}

// ---------- Clientes ----------
function unlocked(kind, level) {
  return PARTS[kind].filter((p) => p.lvl <= level);
}

export function makeCustomer(s) {
  const kinds = [];
  if (has(s, 'elevador')) kinds.push(['repair', 0.45]);
  if (has(s, 'cabine')) kinds.push(['custom', 0.42]);
  if (has(s, 'lavajato')) kinds.push(['wash', 0.3]);
  if (!kinds.length) return null;
  // O primeiro cliente do jogo é sempre um conserto simples (tutorial).
  let kind = s.stats.delivered === 0 && !s.queue.length ? 'repair' : null;
  if (!kind) {
    let r = Math.random() * kinds.reduce((a, k) => a + k[1], 0);
    for (const [k, w] of kinds) { if ((r -= w) <= 0) { kind = k; break; } }
    kind = kind || kinds[0][0];
  }
  const type = pick(CAR_TYPES.filter((t) => t.lvl <= s.level));
  const color = pick(PARTS.color.filter((c) => c.lvl <= s.level + 2)).id;
  const car = { type: type.id, color, ...DEFAULT_PART, dirt: kind === 'wash' ? 1 : 0, broken: kind === 'repair' };
  let job;
  if (kind === 'custom') {
    const n = 1 + (s.level >= 3 && Math.random() < 0.6 ? 1 : 0) + (s.level >= 6 && Math.random() < 0.5 ? 1 : 0);
    const options = ['color', 'wheels', 'spoiler', 'neon', 'decal'].filter((k) => unlocked(k, s.level).length >= 2);
    const reqs = [];
    // Cor aparece na maioria dos pedidos.
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    if (Math.random() < 0.75 && options.includes('color')) options.unshift(...options.splice(options.indexOf('color'), 1));
    for (const k of options.slice(0, n)) {
      const choices = unlocked(k, s.level).filter((p) => p.id !== car[k] && p.id !== 'nenhum' && p.id !== 'padrao');
      if (choices.length) reqs.push({ part: k, value: pick(choices).id });
    }
    job = { kind, id: 'estilo', name: 'Personalizar', icon: '🎨', time: 0, pay: Math.round((50 + 35 * reqs.length) * type.mult), xp: 10 + 6 * reqs.length, reqs };
  } else {
    const list = JOBS[kind].filter((j) => j.lvl <= s.level);
    const j = Math.random() < 0.5 ? list[list.length - 1] : pick(list);
    job = { kind, id: j.id, name: j.name, icon: j.icon, time: j.time, pay: Math.round(j.pay * type.mult), xp: j.xp };
  }
  const patience = 55 + fame(s) * 0.25;
  return { id: s.seq++, car, job, patience, maxPatience: patience, slot: -1 };
}

function freeSlot(s) {
  for (let i = 0; i < QUEUE_SLOTS; i++) if (!s.queue.some((c) => c.slot === i)) return i;
  return -1;
}

// ---------- Ciclo ----------
export function tick(s, dt, ev) {
  s.spawnIn -= dt;
  if (s.spawnIn <= 0) {
    s.spawnIn = arrivalInterval(s);
    const slot = freeSlot(s);
    if (slot >= 0) {
      const c = makeCustomer(s);
      if (c) { c.slot = slot; s.queue.push(c); ev.push({ type: 'arrive', c }); }
    }
  }
  for (let i = s.queue.length - 1; i >= 0; i--) {
    const c = s.queue[i];
    c.patience -= dt;
    if (c.patience <= 0) { s.queue.splice(i, 1); ev.push({ type: 'leave', c, angry: true }); }
  }
  for (const b of s.buildings) {
    const j = b.job;
    if (j && j.state === 'work') {
      j.remaining -= dt * speedOf(b);
      if (j.remaining <= 0) { j.remaining = 0; j.state = 'done'; ev.push({ type: 'done', b }); }
    }
    if (b.type === 'loja') {
      const def = BUILDINGS.loja;
      b.stored = Math.min(def.cap[b.level - 1], (b.stored || 0) + def.rate[b.level - 1] * dt);
    }
  }
}

export function assign(s, customerId) {
  const c = s.queue.find((q) => q.id === customerId);
  if (!c) return { ok: false, reason: 'gone' };
  const btype = SERVICE_OF[c.job.kind];
  const b = s.buildings.find((x) => x.type === btype && !x.job);
  if (!b) return { ok: false, reason: has(s, btype) ? 'busy' : 'missing', btype };
  s.queue.splice(s.queue.indexOf(c), 1);
  b.job = { c, state: c.job.kind === 'custom' ? 'custom' : 'work', remaining: c.job.time, total: c.job.time };
  return { ok: true, b, c };
}

export function speedUp(s, bid) {
  const b = s.buildings.find((x) => x.id === bid);
  if (!b || !b.job || b.job.state !== 'work') return false;
  b.job.remaining = Math.max(0.01, b.job.remaining - 0.6);
  s.stats.taps++;
  track(s, 'tap', 1);
  return true;
}

function reward(s, coins, xp) {
  s.coins += coins;
  s.stats.earned += coins;
  track(s, 'earn', coins);
  return addXp(s, xp);
}

export function addXp(s, n) {
  s.xp += n;
  const levels = [];
  while (s.xp >= xpNeed(s.level)) {
    s.xp -= xpNeed(s.level);
    s.level++;
    s.coins += 40 * s.level;
    levels.push(s.level);
  }
  return levels;
}

export function collect(s, bid) {
  const b = s.buildings.find((x) => x.id === bid);
  if (!b || !b.job || b.job.state !== 'done') return null;
  const c = b.job.c;
  const coins = Math.round(c.job.pay * (1 + tipBonus(s)));
  b.job = null;
  s.stats.delivered++;
  if (c.job.kind === 'wash') { s.stats.washes++; track(s, 'wash', 1); }
  if (c.job.kind === 'repair') { s.stats.repairs++; track(s, 'repair', 1); }
  track(s, 'deliver', 1);
  const levels = reward(s, coins, c.job.xp);
  return { coins, xp: c.job.xp, c, b, levels, stars: 3 };
}

export function evaluateCustom(s, b, spec) {
  const c = b.job.c;
  const reqs = c.job.reqs;
  const met = reqs.filter((r) => spec[r.part] === r.value).length;
  const ratio = reqs.length ? met / reqs.length : 1;
  const requested = new Set(reqs.map((r) => r.part));
  let extras = 0;
  for (const k of ['wheels', 'spoiler', 'neon', 'decal']) {
    if (!requested.has(k) && spec[k] !== c.car[k] && spec[k] !== DEFAULT_PART[k]) extras++;
  }
  const base = c.job.pay * (ratio === 1 ? 1 : 0.35 + 0.4 * ratio);
  const tipRate = ratio === 1 ? 0.12 * Math.min(extras, 3) + BUILDINGS.cabine.tip[b.level - 1] + tipBonus(s) : 0;
  const tip = Math.round(c.job.pay * tipRate);
  const stars = ratio === 1 ? 3 : ratio >= 0.5 ? 2 : 1;
  return { met, total: reqs.length, extras, base: Math.round(base), tip, coins: Math.round(base) + tip, stars, xp: Math.round(c.job.xp * (0.5 + ratio / 2)) };
}

export function deliverCustom(s, bid, spec) {
  const b = s.buildings.find((x) => x.id === bid);
  if (!b || !b.job || b.job.state !== 'custom') return null;
  const clean = {};
  for (const k of ['color', 'wheels', 'spoiler', 'neon', 'decal']) {
    const p = part(k, spec[k]);
    clean[k] = p && p.lvl <= s.level ? p.id : b.job.c.car[k];
  }
  const r = evaluateCustom(s, b, clean);
  const c = b.job.c;
  b.job = null;
  s.stats.delivered++;
  s.stats.customs++;
  if (r.stars === 3) { s.stats.perfect++; track(s, 'stars', 1); }
  track(s, 'deliver', 1);
  track(s, 'custom', 1);
  track(s, 'color', 1, clean.color);
  const levels = reward(s, r.coins, r.xp);
  return { ...r, c, b, spec: { ...c.car, ...clean, dirt: 0, broken: false }, levels };
}

export function collectLoja(s, bid) {
  const b = s.buildings.find((x) => x.id === bid);
  if (!b || b.type !== 'loja') return null;
  const amount = Math.floor(b.stored || 0);
  if (amount < 1) return null;
  b.stored -= amount;
  s.coins += amount;
  s.stats.earned += amount;
  track(s, 'earn', amount);
  track(s, 'loja', 1);
  return { coins: amount, b };
}

// ---------- Construção ----------
export function costOf(s, type) {
  const def = BUILDINGS[type];
  if (def.decor) return def.cost;
  return def.cost[count(s, type)] ?? Infinity;
}

export function canBuy(s, type) {
  const def = BUILDINGS[type];
  if (def.fixed) return { ok: false, reason: 'fixed' };
  if (s.level < def.unlock) return { ok: false, reason: 'level', need: def.unlock };
  if (count(s, type) >= limitAt(type, s.level)) {
    const next = (def.limit || []).find(([lvl]) => lvl > s.level);
    return { ok: false, reason: 'limit', need: next ? next[0] : null };
  }
  if (s.coins < costOf(s, type)) return { ok: false, reason: 'coins' };
  return { ok: true };
}

function footprint(type, x, z) {
  const d = BUILDINGS[type];
  const t = [];
  for (let i = 0; i < d.w; i++) for (let k = 0; k < d.d; k++) t.push(`${x + i},${z + k}`);
  return t;
}

// Corredor de acesso: do portão do serviço até a rua (precisa ficar livre).
function lane(type, x, z) {
  const d = BUILDINGS[type];
  const t = [];
  if (!d.service) return t;
  for (let i = 0; i < d.w; i++) for (let k = z + d.d; k < GRID_H; k++) t.push(`${x + i},${k}`);
  return t;
}

export function laneTiles(s, ignoreId) {
  const set = new Set();
  for (const b of s.buildings) if (b.id !== ignoreId) for (const t of lane(b.type, b.x, b.z)) set.add(t);
  return set;
}

export function canPlace(s, type, x, z, ignoreId = null) {
  const d = BUILDINGS[type];
  if (x < 0 || z < 0 || x + d.w > GRID_W || z + d.d > GRID_H) return false;
  const occupied = new Set();
  for (const b of s.buildings) if (b.id !== ignoreId) for (const t of footprint(b.type, b.x, b.z)) occupied.add(t);
  const lanes = laneTiles(s, ignoreId);
  for (const t of footprint(type, x, z)) if (occupied.has(t) || lanes.has(t)) return false;
  for (const t of lane(type, x, z)) if (occupied.has(t)) return false;
  return true;
}

export function place(s, type, x, z) {
  const can = canBuy(s, type);
  if (!can.ok) return can;
  if (!canPlace(s, type, x, z)) return { ok: false, reason: 'spot' };
  s.coins -= costOf(s, type);
  const b = { id: s.seq++, type, x, z, level: 1, job: null, stored: 0 };
  s.buildings.push(b);
  if (BUILDINGS[type].decor) track(s, 'decor', 1);
  track(s, 'build', 1);
  return { ok: true, b };
}

export function move(s, bid, x, z) {
  const b = s.buildings.find((q) => q.id === bid);
  if (!b || BUILDINGS[b.type].fixed || b.job) return false;
  if (!canPlace(s, b.type, x, z, bid)) return false;
  b.x = x; b.z = z;
  return true;
}

export function upgradeCost(b) {
  const def = BUILDINGS[b.type];
  if (!def.upCost || b.level >= BUILDING_MAX_LEVEL) return null;
  return def.upCost[b.level - 1];
}

export function upgrade(s, bid) {
  const b = s.buildings.find((q) => q.id === bid);
  if (!b) return { ok: false };
  const cost = upgradeCost(b);
  if (cost == null) return { ok: false, reason: 'max' };
  if (s.coins < cost) return { ok: false, reason: 'coins' };
  s.coins -= cost;
  b.level++;
  track(s, 'upgrade', 1);
  return { ok: true, b };
}

// ---------- Missões ----------
const TEMPLATES = [
  { kind: 'deliver', make: (s) => { const n = 3 + Math.floor(s.level * 0.8); return { target: n, text: `Atenda ${n} clientes` }; } },
  { kind: 'repair', need: (s) => has(s, 'elevador'), make: (s) => { const n = 2 + Math.floor(s.level / 2); return { target: n, text: `Conserte ${n} carros` }; } },
  { kind: 'custom', need: (s) => has(s, 'cabine'), make: (s) => { const n = 2 + Math.floor(s.level / 3); return { target: n, text: `Personalize ${n} carros` }; } },
  { kind: 'color', need: (s) => has(s, 'cabine'), make: (s) => { const c = pick(unlocked('color', s.level)); return { target: 2, color: c.id, text: `Entregue 2 carros na cor ${c.name}` }; } },
  { kind: 'wash', need: (s) => has(s, 'lavajato'), make: (s) => { const n = 3 + Math.floor(s.level / 2); return { target: n, text: `Lave ${n} carros` }; } },
  { kind: 'earn', make: (s) => { const n = 150 * s.level; return { target: n, text: `Ganhe ${n} moedas` }; } },
  { kind: 'tap', make: () => ({ target: 25, text: 'Acelere serviços com 25 toques' }) },
  { kind: 'decor', make: () => ({ target: 1, text: 'Construa 1 decoração' }) },
  { kind: 'upgrade', need: (s) => s.level >= 2, make: () => ({ target: 1, text: 'Melhore uma construção' }) },
  { kind: 'stars', need: (s) => has(s, 'cabine'), make: () => ({ target: 3, text: 'Faça 3 entregas perfeitas ⭐⭐⭐' }) },
  { kind: 'loja', need: (s) => has(s, 'loja'), make: () => ({ target: 4, text: 'Recolha a loja 4 vezes' }) },
];

export function refillMissions(s) {
  while (s.missions.length < 3) {
    const active = new Set(s.missions.map((m) => m.kind));
    const pool = TEMPLATES.filter((t) => !active.has(t.kind) && (!t.need || t.need(s)));
    const t = pick(pool);
    const m = t.make(s);
    s.missions.push({
      id: s.seq++, kind: t.kind, progress: 0, ...m,
      reward: { coins: Math.round(60 + s.level * 35), xp: 10 + s.level * 4 },
    });
  }
}

export function track(s, kind, n, extra) {
  for (const m of s.missions) {
    if (m.kind !== kind || m.progress >= m.target) continue;
    if (kind === 'color' && m.color !== extra) continue;
    m.progress = Math.min(m.target, m.progress + n);
  }
}

export function claimMission(s, mid) {
  const m = s.missions.find((x) => x.id === mid);
  if (!m || m.progress < m.target) return null;
  s.missions.splice(s.missions.indexOf(m), 1);
  s.coins += m.reward.coins;
  const levels = addXp(s, m.reward.xp);
  refillMissions(s);
  return { ...m.reward, levels };
}

// ---------- Presente diário e tempo offline ----------
const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export function dailyAvailable(s) {
  if (s.daily.last === dayKey()) return null;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = s.daily.last === dayKey(y) ? s.daily.streak + 1 : 1;
  return { streak, coins: 80 + Math.min(streak, 7) * 40 + s.level * 20 };
}

export function claimDaily(s) {
  const d = dailyAvailable(s);
  if (!d) return null;
  s.daily = { last: dayKey(), streak: d.streak };
  s.coins += d.coins;
  return d;
}

export function applyOffline(s, seconds) {
  const sec = Math.min(Math.max(0, seconds), 8 * 3600);
  let loja = 0, jobs = 0;
  for (const b of s.buildings) {
    if (b.job && b.job.state === 'work') {
      b.job.remaining -= sec * speedOf(b);
      if (b.job.remaining <= 0) { b.job.remaining = 0; b.job.state = 'done'; jobs++; }
    }
    if (b.type === 'loja') {
      const def = BUILDINGS.loja;
      const before = b.stored || 0;
      b.stored = Math.min(def.cap[b.level - 1], before + def.rate[b.level - 1] * sec);
      loja += b.stored - before;
    }
  }
  s.queue = []; // clientes da fila foram embora enquanto você estava fora
  s.spawnIn = 1;
  return { seconds: sec, loja: Math.floor(loja), jobs };
}

// Itens liberados exatamente neste nível (para a tela de "subiu de nível").
export function unlocksAt(level) {
  const out = [];
  for (const [id, d] of Object.entries(BUILDINGS)) {
    if (d.unlock === level) out.push({ icon: d.icon, name: d.name });
    if (d.limit && level > 1) for (const [lvl, max] of d.limit) if (lvl === level && max > 1) out.push({ icon: d.icon, name: `${d.name} nº ${max}` });
  }
  for (const [kind, list] of Object.entries(PARTS)) for (const p of list) if (p.lvl === level && level > 1) out.push({ icon: p.icon || '🎨', name: p.name, hex: p.hex, kind });
  for (const t of CAR_TYPES) if (t.lvl === level && level > 1) out.push({ icon: '🚗', name: `Clientes de ${t.name}` });
  for (const list of Object.values(JOBS)) for (const j of list) if (j.lvl === level && level > 1) out.push({ icon: j.icon, name: `Serviço: ${j.name}` });
  return out;
}
