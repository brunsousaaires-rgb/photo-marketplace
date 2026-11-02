// Regras e economia do jogo — funções puras sobre um estado JSON.
// Sem DOM e sem 3D: no online, o servidor usa este mesmo arquivo para validar as ações.
import {
  BUILDINGS, PARTS, CAR_TYPES, JOBS, SERVICE_OF, DEFAULT_PART, GRID_H, BASE_W, LAND, TRACK,
  BUILDING_MAX_LEVEL, UPGRADE_TIME, PERF, PART_COST, RACE_TIERS, RIVAL_NAMES, xpNeed, limitAt, part, carType,
  RARITY, RARE_PARTS, CRATES, CHARACTERS, EVENTS, EVENT_MILESTONES, STAFF_ROLES, STAFF_NAMES, STAFF_LEVEL_MULT, TEAM_SIZE,
} from './data.js';

export const QUEUE_SLOTS = 5;
export const GARAGE_MAX = 6;
export const PROJECTS_MAX = 3;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function freshStats() {
  return { delivered: 0, customs: 0, washes: 0, repairs: 0, fuels: 0, restored: 0, races: 0, wins: 0, earned: 0, taps: 0, perfect: 0, vip: 0, sold: 0, tows: 0, crates: 0 };
}

export function newState() {
  const s = {
    v: 2, coins: 250, xp: 0, level: 1, seq: 1, lotW: BASE_W, land: [], track: false,
    buildings: [], queue: [], spawnIn: 1.5, missions: [], garage: [], projects: [], auction: null, trophies: 0,
    stats: freshStats(), daily: { last: null, streak: 0 }, lastSeen: Date.now(),
    friends: {}, rare: {}, crates: { bronze: 0, prata: 0, ouro: 0 }, event: null, staff: [], uniform: '#2f7bea',
    weather: { rain: false, t: 150, wet: 0 }, towCall: null, towIn: 90, contest: { claimed: [] }, bonusFame: 0, name: '',
  };
  const add = (type, x, z) => s.buildings.push({ id: s.seq++, type, x, z, level: 1, job: null, stored: 0, build: null });
  add('escritorio', 0, 0);
  add('elevador', 4, 0);
  add('cabine', 7, 0);
  add('arvore', 0, 7);
  add('flores', 1, 8);
  add('arvore', 15, 8);
  refillMissions(s);
  return s;
}

// Atualiza saves antigos para o formato atual.
export function migrate(s) {
  const d = newState();
  for (const k of ['lotW', 'land', 'track', 'garage', 'projects', 'auction', 'trophies', 'friends', 'rare', 'crates', 'event', 'staff', 'uniform', 'weather', 'towCall', 'towIn', 'contest', 'bonusFame', 'name']) if (s[k] === undefined) s[k] = d[k];
  s.stats = { ...freshStats(), ...s.stats };
  for (const b of s.buildings) if (b.build === undefined) b.build = null;
  s.v = 2;
  return s;
}

export const count = (s, type) => s.buildings.filter((b) => b.type === type).length;
export const has = (s, type) => s.buildings.some((b) => b.type === type && !(b.build && !b.build.up));

export function fame(s) {
  let f = 0;
  for (const b of s.buildings) {
    if (b.build && !b.build.up) continue;
    const def = BUILDINGS[b.type];
    if (def.decor) f += def.fame;
    else if (!def.fixed) f += (b.level - 1) * 2;
  }
  if (has(s, 'showroom')) f += Math.min(3, s.garage.length) * 5;
  f += s.trophies * 3;
  f += s.bonusFame || 0;
  for (const m of s.staff || []) f += Math.round((STAFF_ROLES[m.role].fame || 0) * STAFF_LEVEL_MULT[m.level - 1]);
  return f;
}

export const tipBonus = (s) => fame(s) / 250;
export const arrivalInterval = (s) => Math.max(2.6, 8.5 - fame(s) * 0.045) * rand(0.75, 1.25);

const SPEED_STAFF = { elevador: 'repairSpeed', lavajato: 'washSpeed', restauracao: 'restoreSpeed' };
export function speedOf(b, s = null) {
  const def = BUILDINGS[b.type];
  const base = def.speed ? def.speed[b.level - 1] : 1;
  return s && SPEED_STAFF[b.type] ? base * (1 + staffBonus(s, SPEED_STAFF[b.type])) : base;
}

export function lojaRate(s, b) {
  const ev = currentEvent();
  return BUILDINGS.loja.rate[b.level - 1] * (1 + staffBonus(s, 'lojaRate')) * (ev.lojaBoost || 1);
}

export function stageOf(job) {
  const st = job.c.job.stages;
  if (!st || job.state !== 'work') return null;
  const k = 1 - job.remaining / job.total;
  return st[Math.min(st.length - 1, Math.floor(k * st.length))];
}

// ---------- clientes ----------
function unlocked(kind, level) {
  return PARTS[kind].filter((p) => p.lvl <= level);
}

export const owns = (s, kind, id) => !!(s.rare && s.rare[kind + ':' + id]);
export function partAvailable(s, kind, id) {
  const p = part(kind, id);
  return !!p && (p.lvl <= s.level || owns(s, kind, id));
}

export function charById(id) {
  return CHARACTERS.find((c) => c.id === id);
}

function makeCharacter(s, kinds) {
  const busy = new Set([...s.queue.map((c) => c.char), ...s.buildings.map((b) => b.job?.c?.char)].filter(Boolean));
  const avail = new Set(kinds.map((k) => k[0]));
  const list = CHARACTERS.filter((ch) => ch.lvl <= s.level && !busy.has(ch.id) && ch.kinds.some((k) => avail.has(k)));
  if (!list.length) return null;
  const ch = pick(list);
  return { ch, kind: pick(ch.kinds.filter((k) => avail.has(k))) };
}

export function makeCustomer(s) {
  const kinds = [];
  if (has(s, 'elevador')) kinds.push(['repair', 0.42]);
  if (has(s, 'cabine')) kinds.push(['custom', 0.4]);
  if (has(s, 'lavajato')) kinds.push(['wash', 0.28]);
  if (has(s, 'posto')) kinds.push(['fuel', 0.34]);
  if (!kinds.length) return null;
  if (s.weather && (s.weather.rain || s.weather.wet > 0)) for (const k of kinds) if (k[0] === 'wash') k[1] *= 3;
  let kind = s.stats.delivered === 0 && !s.queue.length && has(s, 'elevador') ? 'repair' : null;
  let chr = null;
  if (!kind && s.stats.delivered >= 3 && Math.random() < 0.16) {
    chr = makeCharacter(s, kinds);
    if (chr) kind = chr.kind;
  }
  if (!kind) {
    let r = Math.random() * kinds.reduce((a, k) => a + k[1], 0);
    for (const [k, w] of kinds) { if ((r -= w) <= 0) { kind = k; break; } }
    kind = kind || kinds[0][0];
  }
  const type = chr ? carType(chr.ch.car.type) : pick(CAR_TYPES.filter((t) => t.lvl <= s.level));
  const color = chr ? chr.ch.car.color : pick(PARTS.color.filter((c) => c.lvl <= s.level + 2)).id;
  const wet = s.weather && (s.weather.rain || s.weather.wet > 0);
  const car = { type: type.id, color, ...DEFAULT_PART, ...(chr ? chr.ch.car : {}), dirt: kind === 'wash' ? 1 : wet ? 0.45 : 0, broken: kind === 'repair', rust: 0 };
  const vip = !chr && s.level >= 3 && kind === 'custom' && Math.random() < 0.1;
  const ev = currentEvent();
  let job;
  if (kind === 'custom') {
    const n = Math.min(4, 1 + (s.level >= 3 && Math.random() < 0.6 ? 1 : 0) + (s.level >= 6 && Math.random() < 0.5 ? 1 : 0) + (vip ? 1 : 0));
    const options = ['color', 'wheels', 'spoiler', 'neon', 'decal'].filter((k) => unlocked(k, s.level).length >= 2);
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    if (Math.random() < 0.75 && options.includes('color')) options.unshift(...options.splice(options.indexOf('color'), 1));
    if (ev.neonBoost && options.includes('neon') && Math.random() < 0.7) options.unshift(...options.splice(options.indexOf('neon'), 1));
    const reqs = [];
    for (const k of options.slice(0, n)) {
      const choices = unlocked(k, s.level).filter((p) => p.id !== car[k] && p.id !== 'nenhum' && p.id !== 'padrao');
      if (choices.length) reqs.push({ part: k, value: pick(choices).id });
    }
    const pay = Math.round((50 + 35 * reqs.length) * type.mult * (vip ? 2.5 : 1) * (chr ? 1.3 : 1));
    job = { kind, id: 'estilo', name: 'Personalizar', icon: 'estilo', time: 0, pay, xp: (10 + 6 * reqs.length) * (vip ? 2 : 1), reqs };
  } else {
    const list = JOBS[kind].filter((j) => j.lvl <= s.level);
    const j = pick(list);
    if (j.rust) car.rust = 1;
    job = { kind, id: j.id, name: j.name, icon: j.icon, time: j.time, pay: Math.round(j.pay * type.mult * (chr ? 1.3 : 1)), xp: j.xp, stages: j.stages || null };
  }
  const patience = ((vip ? 40 : 55 + Math.min(job.time, 60) * 0.3) + fame(s) * 0.25) * (1 + staffBonus(s, 'patience')) * (chr ? 1.4 : 1);
  return { id: s.seq++, car, job, vip, char: chr ? chr.ch.id : null, patience, maxPatience: patience, slot: -1 };
}

function freeSlot(s) {
  for (let i = 0; i < QUEUE_SLOTS; i++) if (!s.queue.some((c) => c.slot === i)) return i;
  return -1;
}

// ---------- ciclo ----------
export function tick(s, dt, ev) {
  tickWeather(s, dt, ev);
  tickTow(s, dt, ev);
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
    if (b.build) {
      b.build.t -= dt;
      if (b.build.t <= 0) {
        if (b.build.up) b.level++;
        b.build = null;
        ev.push({ type: 'built', b });
      }
      continue;
    }
    const j = b.job;
    if (j && j.state === 'work') {
      j.remaining -= dt * speedOf(b, s);
      if (j.remaining <= 0) { j.remaining = 0; j.state = 'done'; ev.push({ type: 'done', b }); }
    }
    if (b.type === 'loja') b.stored = Math.min(BUILDINGS.loja.cap[b.level - 1], (b.stored || 0) + lojaRate(s, b) * dt);
  }
}

export function assign(s, customerId) {
  const c = s.queue.find((q) => q.id === customerId);
  if (!c) return { ok: false, reason: 'gone' };
  const btype = SERVICE_OF[c.job.kind];
  const b = s.buildings.find((x) => x.type === btype && !x.job && !x.build);
  if (!b) return { ok: false, reason: has(s, btype) ? 'busy' : 'missing', btype };
  s.queue.splice(s.queue.indexOf(c), 1);
  b.job = { c, state: c.job.kind === 'custom' ? 'custom' : 'work', remaining: c.job.time, total: c.job.time };
  return { ok: true, b, c };
}

export function speedUp(s, bid) {
  const b = s.buildings.find((x) => x.id === bid);
  if (!b) return false;
  if (b.build) {
    b.build.t = Math.max(0.01, b.build.t - (0.5 + b.build.total * 0.04));
  } else if (b.job && b.job.state === 'work') {
    b.job.remaining = Math.max(0.01, b.job.remaining - (0.6 + b.job.total * 0.012));
  } else return false;
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
  if (levels.length) refreshAuction(s, true);
  return levels;
}

export function collect(s, bid) {
  const b = s.buildings.find((x) => x.id === bid);
  if (!b || !b.job || b.job.state !== 'done') return null;
  const c = b.job.c;
  b.job = null;
  if (c.job.kind === 'restore') {
    const car = { id: c.id, type: c.car.type, color: c.car.color, ...DEFAULT_PART, motor: 1, turbo: 0, pneus: 1, spent: 0, paid: c.paid || 0 };
    s.garage.push(car);
    s.stats.restored++;
    track(s, 'restore', 1);
    const levels = addXp(s, c.job.xp);
    return { coins: 0, xp: c.job.xp, c, b, levels, restored: car };
  }
  const coins = Math.round(c.job.pay * (1 + tipBonus(s)) * (c.job.kind === 'fuel' ? 1 + staffBonus(s, 'fuelPay') : 1));
  s.stats.delivered++;
  if (c.job.kind === 'wash') { s.stats.washes++; track(s, 'wash', 1); }
  if (c.job.kind === 'repair') { s.stats.repairs++; track(s, 'repair', 1); }
  if (c.job.kind === 'fuel') { s.stats.fuels++; track(s, 'fuel', 1); }
  track(s, 'deliver', 1);
  const friend = befriend(s, c);
  const levels = reward(s, coins, c.job.xp);
  return { coins, xp: c.job.xp, c, b, levels, stars: 3, friend };
}

export function evaluateCustom(s, b, spec) {
  const c = b.job.c;
  const reqs = c.job.reqs;
  const met = reqs.filter((r) => spec[r.part] === r.value).length;
  const ratio = reqs.length ? met / reqs.length : 1;
  const requested = new Set(reqs.map((r) => r.part));
  let extras = 0, extraRate = 0, rares = 0;
  for (const k of ['color', 'wheels', 'spoiler', 'neon', 'decal']) {
    if (requested.has(k) || spec[k] === c.car[k] || spec[k] === DEFAULT_PART[k]) continue;
    const rare = part(k, spec[k])?.rare;
    if (k === 'color' && !rare) continue;
    extras++;
    if (rare) rares++;
    extraRate += rare ? 0.3 : 0.12;
  }
  const base = c.job.pay * (ratio === 1 ? 1 : 0.35 + 0.4 * ratio);
  const tipRate = ratio === 1 ? Math.min(extraRate, 0.9) + BUILDINGS.cabine.tip[b.level - 1] + tipBonus(s) + staffBonus(s, 'customTip') : 0;
  const tip = Math.round(c.job.pay * tipRate);
  const stars = ratio === 1 ? 3 : ratio >= 0.5 ? 2 : 1;
  return { met, total: reqs.length, extras, rares, base: Math.round(base), tip, coins: Math.round(base) + tip, stars, xp: Math.round(c.job.xp * (0.5 + ratio / 2)) };
}

export function deliverCustom(s, bid, spec) {
  const b = s.buildings.find((x) => x.id === bid);
  if (!b || !b.job || b.job.state !== 'custom') return null;
  const clean = {};
  for (const k of ['color', 'wheels', 'spoiler', 'neon', 'decal']) {
    clean[k] = partAvailable(s, k, spec[k]) ? spec[k] : b.job.c.car[k];
  }
  const r = evaluateCustom(s, b, clean);
  const c = b.job.c;
  b.job = null;
  s.stats.delivered++;
  s.stats.customs++;
  if (c.vip) s.stats.vip++;
  if (r.stars === 3) { s.stats.perfect++; track(s, 'stars', 1); }
  track(s, 'deliver', 1);
  track(s, 'custom', 1);
  track(s, 'color', 1, clean.color);
  if (clean.neon !== 'nenhum') track(s, 'custom_neon', 1);
  const friend = r.stars >= 2 ? befriend(s, c) : null;
  const levels = reward(s, r.coins, r.xp);
  return { ...r, c, b, vip: c.vip, spec: { ...c.car, ...clean, dirt: 0, broken: false, rust: 0 }, levels, friend };
}

export function collectLoja(s, bid) {
  const b = s.buildings.find((x) => x.id === bid);
  if (!b || b.type !== 'loja' || b.build) return null;
  const amount = Math.floor(b.stored || 0);
  if (amount < 1) return null;
  b.stored -= amount;
  s.coins += amount;
  s.stats.earned += amount;
  track(s, 'earn', amount);
  track(s, 'loja', 1);
  return { coins: amount, b };
}

// ---------- construção ----------
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
  const lx = type === 'posto' ? x + 1 : x;
  const lw = type === 'posto' ? 1 : d.w;
  for (let i = 0; i < lw; i++) for (let k = z + d.d; k < GRID_H; k++) t.push(`${lx + i},${k}`);
  return t;
}

export function laneTiles(s, ignoreId) {
  const set = new Set();
  for (const b of s.buildings) if (b.id !== ignoreId) for (const t of lane(b.type, b.x, b.z)) set.add(t);
  return set;
}

export function canPlace(s, type, x, z, ignoreId = null) {
  const d = BUILDINGS[type];
  if (x < 0 || z < 0 || x + d.w > s.lotW || z + d.d > GRID_H) return false;
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
  const t = BUILDINGS[type].build || 3;
  const b = { id: s.seq++, type, x, z, level: 1, job: null, stored: 0, build: { t, total: t, up: false } };
  s.buildings.push(b);
  if (BUILDINGS[type].decor) track(s, 'decor', 1);
  track(s, 'build', 1);
  return { ok: true, b };
}

export function move(s, bid, x, z) {
  const b = s.buildings.find((q) => q.id === bid);
  if (!b || BUILDINGS[b.type].fixed || b.job || b.build) return false;
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
  if (!b || b.build) return { ok: false, reason: 'busy' };
  if (b.job) return { ok: false, reason: 'job' };
  const cost = upgradeCost(b);
  if (cost == null) return { ok: false, reason: 'max' };
  if (s.coins < cost) return { ok: false, reason: 'coins' };
  s.coins -= cost;
  const t = UPGRADE_TIME[b.level - 1];
  b.build = { t, total: t, up: true };
  track(s, 'upgrade', 1);
  return { ok: true, b };
}

// ---------- terrenos e pista ----------
export function nextLand(s) {
  return LAND[s.land.length] || null;
}

export function buyLand(s) {
  const l = nextLand(s);
  if (!l) return { ok: false, reason: 'max' };
  if (s.level < l.lvl) return { ok: false, reason: 'level', need: l.lvl };
  if (s.coins < l.cost) return { ok: false, reason: 'coins' };
  s.coins -= l.cost;
  s.land.push(l.id);
  s.lotW += l.cols;
  track(s, 'build', 1);
  return { ok: true, land: l };
}

export function buyTrack(s) {
  if (s.track) return { ok: false, reason: 'max' };
  if (s.level < TRACK.lvl) return { ok: false, reason: 'level', need: TRACK.lvl };
  if (s.coins < TRACK.cost) return { ok: false, reason: 'coins' };
  s.coins -= TRACK.cost;
  s.track = true;
  return { ok: true };
}

// ---------- leilão, restauração e coleção ----------
function makeOffer(s) {
  const t = pick(CAR_TYPES.filter((c) => c.lvl <= s.level + 1));
  return {
    id: s.seq++, type: t.id, color: pick(PARTS.color).id,
    price: Math.round((t.value * rand(0.3, 0.42)) / 10) * 10,
    wear: pick(['Sucata de ferro-velho', 'Parado há 10 anos', 'Batido na traseira', 'Motor fundido', 'Achado no sítio do avô']),
  };
}

export function refreshAuction(s, force = false, now = Date.now()) {
  if (force || !s.auction || now >= s.auction.next) s.auction = { next: now + 10 * 60 * 1000, offers: [0, 1, 2].map(() => makeOffer(s)) };
  return s.auction;
}

export function buyWreck(s, oid) {
  const a = refreshAuction(s);
  const o = a.offers.find((x) => x.id === oid);
  if (!o) return { ok: false, reason: 'gone' };
  if (s.projects.length >= PROJECTS_MAX) return { ok: false, reason: 'full' };
  if (s.garage.length + s.projects.length >= GARAGE_MAX + PROJECTS_MAX) return { ok: false, reason: 'full' };
  if (s.coins < o.price) return { ok: false, reason: 'coins' };
  s.coins -= o.price;
  a.offers.splice(a.offers.indexOf(o), 1);
  const p = { id: o.id, paid: o.price, car: { type: o.type, color: o.color, ...DEFAULT_PART, dirt: 1, rust: 1, broken: true } };
  s.projects.push(p);
  return { ok: true, project: p };
}

export function restoreTime(type) {
  return 90 + CAR_TYPES.findIndex((t) => t.id === type) * 30;
}

export function startRestore(s, pid) {
  const p = s.projects.find((x) => x.id === pid);
  if (!p) return { ok: false, reason: 'gone' };
  if (s.garage.length >= GARAGE_MAX) return { ok: false, reason: 'garage' };
  const b = s.buildings.find((x) => x.type === 'restauracao' && !x.job && !x.build);
  if (!b) return { ok: false, reason: has(s, 'restauracao') ? 'busy' : 'missing' };
  s.projects.splice(s.projects.indexOf(p), 1);
  const time = restoreTime(p.car.type);
  const typeIdx = CAR_TYPES.findIndex((t) => t.id === p.car.type);
  const c = { id: p.id, paid: p.paid, car: p.car, job: { kind: 'restore', id: 'restauro', name: 'Restauração', icon: 'restauro', time, pay: 0, xp: 30 + typeIdx * 10, stages: ['Desmontando', 'Funilaria', 'Pintura', 'Montagem', 'Polimento'] } };
  b.job = { c, state: 'work', remaining: time, total: time };
  return { ok: true, b, c };
}

export function carStats(car) {
  const t = carType(car.type);
  const top = t.speed + (car.motor - 1) * 1.1 + car.turbo * 0.5 + (car.spoiler === 'grande' ? 0.3 : 0);
  const acc = 5 + car.turbo * 1.6 + (car.wheels === 'esportiva' || car.wheels === 'cromada' ? 0.6 : 0);
  const grip = 0.68 + (car.pneus - 1) * 0.07 + (car.spoiler === 'grande' ? 0.06 : car.spoiler === 'pequeno' ? 0.03 : 0) + (car.wheels === 'offroad' ? -0.04 : car.wheels === 'esportiva' ? 0.02 : 0);
  return { top, acc, grip };
}

export function carValue(car) {
  const t = carType(car.type);
  let v = t.value + (car.spent || 0) * 0.6;
  for (const k of ['wheels', 'spoiler', 'neon', 'decal']) if (car[k] !== DEFAULT_PART[k]) v += 60;
  return Math.round(v / 10) * 10;
}

export function tune(s, carId, key) {
  const car = s.garage.find((c) => c.id === carId);
  const def = PERF[key];
  if (!car || !def) return { ok: false };
  if (car[key] >= def.max) return { ok: false, reason: 'max' };
  const cost = def.cost[car[key] - def.start];
  if (s.coins < cost) return { ok: false, reason: 'coins' };
  s.coins -= cost;
  car[key]++;
  car.spent = (car.spent || 0) + cost;
  track(s, 'tune', 1);
  return { ok: true, car };
}

export function restyle(s, carId, kind, value) {
  const car = s.garage.find((c) => c.id === carId);
  const p = part(kind, value);
  if (!car || !p) return { ok: false };
  if (!partAvailable(s, kind, value)) return { ok: false, reason: p.rare ? 'rare' : 'level', need: p.lvl };
  if (car[kind] === value) return { ok: false, reason: 'same' };
  const cost = PART_COST[kind];
  if (s.coins < cost) return { ok: false, reason: 'coins' };
  s.coins -= cost;
  car[kind] = value;
  car.spent = (car.spent || 0) + cost;
  return { ok: true, car };
}

export function sellCar(s, carId) {
  const car = s.garage.find((c) => c.id === carId);
  if (!car) return null;
  const value = carValue(car);
  s.garage.splice(s.garage.indexOf(car), 1);
  s.coins += value;
  s.stats.earned += value;
  s.stats.sold++;
  track(s, 'earn', value);
  return { value, car };
}

// ---------- corridas ----------
export function enterRace(s, tierId, carId) {
  const tier = RACE_TIERS.find((t) => t.id === tierId);
  const car = s.garage.find((c) => c.id === carId);
  if (!tier || !car) return { ok: false };
  if (!s.track) return { ok: false, reason: 'track' };
  if (s.level < tier.lvl) return { ok: false, reason: 'level', need: tier.lvl };
  if (s.coins < tier.fee) return { ok: false, reason: 'coins' };
  s.coins -= tier.fee;
  const ti = RACE_TIERS.indexOf(tier);
  const names = [...RIVAL_NAMES].sort(() => Math.random() - 0.5);
  const stats = carStats(car);
  stats.top += staffBonus(s, 'raceTop');
  const rivals = [0, 1, 2].map((i) => ({
    name: names[i],
    spec: {
      type: pick(CAR_TYPES).id, color: pick(PARTS.color).id, wheels: pick(PARTS.wheels).id,
      spoiler: pick(PARTS.spoiler).id, neon: Math.random() < 0.4 ? pick(PARTS.neon).id : 'nenhum', decal: pick(PARTS.decal).id,
    },
    top: tier.rival * rand(0.93, 1.05), acc: 5 + ti * 1.3 + rand(0, 1.5), grip: 0.72 + ti * 0.04 + rand(-0.03, 0.03),
  }));
  return { ok: true, tier, car, rivals, stats };
}

// Desafio contra o carro de um amigo (online): o amigo vira o rival principal.
export function enterFriendRace(s, carId, friend) {
  const car = s.garage.find((c) => c.id === carId);
  if (!car || !friend || !friend.car) return { ok: false };
  if (!s.track) return { ok: false, reason: 'track' };
  const fee = 100;
  if (s.coins < fee) return { ok: false, reason: 'coins' };
  s.coins -= fee;
  const fs = carStats({ motor: 1, turbo: 0, pneus: 1, ...friend.car });
  const tier = { id: 'amigo', name: `Desafio: ${friend.name}`, lvl: 1, fee, prize: [600, 250, 100], rival: fs.top, laps: 2, friend: true };
  const names = [...RIVAL_NAMES].sort(() => Math.random() - 0.5);
  const rivals = [{ name: friend.name, spec: friend.car, top: fs.top, acc: fs.acc, grip: fs.grip }];
  for (let i = 0; i < 2; i++) rivals.push({
    name: names[i], spec: { type: pick(CAR_TYPES).id, color: pick(PARTS.color.filter((c) => !c.rare)).id, wheels: 'padrao', spoiler: 'nenhum', neon: 'nenhum', decal: 'nenhum' },
    top: fs.top * rand(0.85, 0.95), acc: 5 + rand(0, 2), grip: 0.72,
  });
  const stats = carStats(car);
  stats.top += staffBonus(s, 'raceTop');
  return { ok: true, tier, car, rivals, stats };
}

export function finishRace(s, tierRef, position) {
  const tier = typeof tierRef === 'string' ? RACE_TIERS.find((t) => t.id === tierRef) : tierRef;
  const ti = Math.max(0, RACE_TIERS.findIndex((t) => t.id === tier.id));
  const prize = tier.prize[position - 1] || 0;
  s.coins += prize;
  s.stats.earned += prize;
  s.stats.races++;
  track(s, 'race', 1);
  if (position === 1) { s.stats.wins++; s.trophies++; track(s, 'win', 1); }
  const xp = [40, 25, 15, 8][position - 1] * (ti + 1);
  let crate = position === 1 ? (ti >= 2 ? 'ouro' : 'prata') : position === 2 ? (ti >= 2 ? 'prata' : 'bronze') : position === 3 ? 'bronze' : null;
  if (crate && currentEvent().crateBoost) crate = crate === 'bronze' ? 'prata' : 'ouro';
  if (tier.friend && position !== 1) crate = null;
  if (crate) grantCrate(s, crate);
  const levels = addXp(s, xp);
  return { prize, xp, levels, trophy: position === 1, crate };
}

// ---------- missões ----------
const TEMPLATES = [
  { kind: 'deliver', make: (s) => { const n = 3 + Math.floor(s.level * 0.8); return { target: n, text: `Atenda ${n} clientes` }; } },
  { kind: 'repair', need: (s) => has(s, 'elevador'), make: (s) => { const n = 2 + Math.floor(s.level / 2); return { target: n, text: `Conserte ${n} carros` }; } },
  { kind: 'custom', need: (s) => has(s, 'cabine'), make: (s) => { const n = 2 + Math.floor(s.level / 3); return { target: n, text: `Personalize ${n} carros` }; } },
  { kind: 'color', need: (s) => has(s, 'cabine'), make: (s) => { const c = pick(unlocked('color', s.level)); return { target: 2, color: c.id, text: `Entregue 2 carros na cor ${c.name}` }; } },
  { kind: 'wash', need: (s) => has(s, 'lavajato'), make: (s) => { const n = 3 + Math.floor(s.level / 2); return { target: n, text: `Lave ${n} carros` }; } },
  { kind: 'fuel', need: (s) => has(s, 'posto'), make: (s) => { const n = 4 + Math.floor(s.level / 2); return { target: n, text: `Abasteça ${n} carros` }; } },
  { kind: 'earn', make: (s) => { const n = 150 * s.level; return { target: n, text: `Ganhe ${n} moedas` }; } },
  { kind: 'tap', make: () => ({ target: 25, text: 'Acelere serviços com 25 toques' }) },
  { kind: 'decor', make: () => ({ target: 1, text: 'Construa 1 decoração' }) },
  { kind: 'upgrade', need: (s) => s.level >= 2, make: () => ({ target: 1, text: 'Melhore uma construção' }) },
  { kind: 'stars', need: (s) => has(s, 'cabine'), make: () => ({ target: 3, text: 'Faça 3 entregas perfeitas' }) },
  { kind: 'loja', need: (s) => has(s, 'loja'), make: () => ({ target: 4, text: 'Recolha a loja 4 vezes' }) },
  { kind: 'restore', need: (s) => has(s, 'restauracao'), make: () => ({ target: 1, text: 'Restaure 1 carro do leilão' }) },
  { kind: 'tune', need: (s) => s.garage.length > 0, make: () => ({ target: 2, text: 'Prepare um carro da coleção 2 vezes' }) },
  { kind: 'race', need: (s) => s.track && s.garage.length > 0, make: () => ({ target: 2, text: 'Participe de 2 corridas' }) },
  { kind: 'win', need: (s) => s.track && s.garage.length > 0, make: () => ({ target: 1, text: 'Vença uma corrida' }) },
  { kind: 'tow', need: (s) => has(s, 'guincho'), make: () => ({ target: 1, text: 'Atenda um chamado de guincho' }) },
  { kind: 'friend', need: (s) => s.level >= 2, make: () => ({ target: 2, text: 'Atenda 2 clientes conhecidos (com retrato)' }) },
  { kind: 'crate', need: (s) => Object.values(s.crates || {}).some((n) => n > 0), make: () => ({ target: 1, text: 'Abra uma caixa de prêmio' }) },
];

export function refillMissions(s) {
  while (s.missions.length < 3) {
    const active = new Set(s.missions.map((m) => m.kind));
    const pool = TEMPLATES.filter((t) => !active.has(t.kind) && (!t.need || t.need(s)));
    const t = pick(pool);
    const m = t.make(s);
    const big = ['restore', 'race', 'win', 'tow'].includes(t.kind) ? 2 : 1;
    s.missions.push({
      id: s.seq++, kind: t.kind, progress: 0, ...m,
      reward: { coins: Math.round((60 + s.level * 35) * big), xp: (10 + s.level * 4) * big },
    });
  }
}

export function track(s, kind, n, extra) {
  const ev = ensureEvent(s);
  const pts = EVENTS.find((e) => e.id === ev.id)?.points[kind];
  if (pts) ev.points += pts * (kind === 'earn' ? 0 : n);
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

// ---------- presente diário e tempo offline ----------
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
  let loja = 0, jobs = 0, builds = 0;
  for (const b of s.buildings) {
    if (b.build) {
      b.build.t -= sec;
      if (b.build.t <= 0) { if (b.build.up) b.level++; b.build = null; builds++; }
      else continue;
    }
    if (b.job && b.job.state === 'work') {
      b.job.remaining -= sec * speedOf(b, s);
      if (b.job.remaining <= 0) { b.job.remaining = 0; b.job.state = 'done'; jobs++; }
    }
    if (b.type === 'loja') {
      const before = b.stored || 0;
      b.stored = Math.min(BUILDINGS.loja.cap[b.level - 1], before + lojaRate(s, b) * sec);
      loja += b.stored - before;
    }
  }
  s.queue = []; // clientes da fila foram embora enquanto você estava fora
  s.spawnIn = 1;
  return { seconds: sec, loja: Math.floor(loja), jobs, builds };
}

// Itens liberados exatamente neste nível (para a tela de "subiu de nível").
export function unlocksAt(level) {
  const out = [];
  for (const [id, d] of Object.entries(BUILDINGS)) {
    if (d.unlock === level) out.push({ kind: 'building', id, name: d.name });
    if (d.limit && level > 1) for (const [lvl, max] of d.limit) if (lvl === level && max > 1) out.push({ kind: 'building', id, name: `${d.name} nº ${max}` });
  }
  for (const [kind, list] of Object.entries(PARTS)) for (const p of list) if (p.lvl === level && level > 1) out.push({ kind, id: p.id, name: p.name, hex: p.hex });
  for (const t of CAR_TYPES) if (t.lvl === level && level > 1) out.push({ kind: 'car', id: t.id, name: `Clientes de ${t.name}` });
  for (const list of Object.values(JOBS)) for (const j of list) if (j.lvl === level && level > 1) out.push({ kind: 'job', icon: j.icon, name: `Serviço: ${j.name}` });
  for (const l of LAND) if (l.lvl === level) out.push({ kind: 'land', name: `Comprar: ${l.name}` });
  if (TRACK.lvl === level) out.push({ kind: 'track', name: TRACK.name });
  for (const r of RACE_TIERS) if (r.lvl === level) out.push({ kind: 'race', name: `Corrida: ${r.name}` });
  for (const ch of CHARACTERS) if (ch.lvl === level && level > 1) out.push({ kind: 'char', id: ch.id, name: `Novo cliente: ${ch.name}` });
  for (const [id, r] of Object.entries(STAFF_ROLES)) if (r.lvl === level) out.push({ kind: 'staff', icon: r.icon, name: `Contratar: ${r.name}` });
  return out;
}

// =============== Equipe ===============
export function staffBonus(s, effect) {
  let b = 0;
  for (const m of s.staff || []) {
    const r = STAFF_ROLES[m.role];
    if (r && r.effect === effect) b += r.base * STAFF_LEVEL_MULT[m.level - 1];
  }
  return b;
}

export function teamSize(s) {
  let n = 0;
  for (const [lvl, max] of TEAM_SIZE) if (s.level >= lvl) n = max;
  return n;
}

export function hire(s, role) {
  const r = STAFF_ROLES[role];
  if (!r) return { ok: false };
  if (s.level < r.lvl) return { ok: false, reason: 'level', need: r.lvl };
  if (s.staff.some((m) => m.role === role)) return { ok: false, reason: 'have' };
  if (s.staff.length >= teamSize(s)) return { ok: false, reason: 'team' };
  if (s.coins < r.cost) return { ok: false, reason: 'coins' };
  s.coins -= r.cost;
  const used = new Set(s.staff.map((m) => m.name));
  const name = pick(STAFF_NAMES.filter((n) => !used.has(n)));
  const m = { role, name, level: 1, skin: pick(['#f1c09a', '#c98a5e', '#8a5a3a', '#f6d2b4']), hair: pick(['#3a2a1e', '#1f1f24', '#c98a2a', '#e8e0d0', '#7a3a2a']) };
  s.staff.push(m);
  track(s, 'hire', 1);
  return { ok: true, m };
}

export const trainCost = (m) => STAFF_ROLES[m.role].cost * m.level;

export function train(s, role) {
  const m = s.staff.find((x) => x.role === role);
  if (!m) return { ok: false };
  if (m.level >= STAFF_LEVEL_MULT.length) return { ok: false, reason: 'max' };
  const cost = trainCost(m);
  if (s.coins < cost) return { ok: false, reason: 'coins' };
  s.coins -= cost;
  m.level++;
  return { ok: true, m };
}

export function fire(s, role) {
  const i = s.staff.findIndex((x) => x.role === role);
  if (i < 0) return false;
  s.staff.splice(i, 1);
  return true;
}

export function setUniform(s, color) {
  s.uniform = color;
}

// =============== Eventos semanais ===============
export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return y * 100 + w;
}

export function currentEvent(d = new Date()) {
  return EVENTS[weekKey(d) % EVENTS.length];
}

export function eventDaysLeft(d = new Date()) {
  const day = d.getDay() || 7; // segunda = 1 ... domingo = 7
  return 8 - day;
}

export function ensureEvent(s) {
  const wk = weekKey();
  const ev = currentEvent();
  if (!s.event || s.event.week !== wk || s.event.id !== ev.id) s.event = { id: ev.id, week: wk, points: 0, claimed: [] };
  return s.event;
}

export function claimEventMilestone(s, i) {
  const ev = ensureEvent(s);
  const m = EVENT_MILESTONES[i];
  if (!m || ev.claimed.includes(i) || ev.points < m.pts) return null;
  ev.claimed.push(i);
  const out = {};
  if (m.coins) { s.coins += m.coins; out.coins = m.coins; }
  if (m.crate) { grantCrate(s, m.crate); out.crate = m.crate; }
  if (m.part) {
    const [kind, id] = EVENTS.find((e) => e.id === ev.id).reward.part.split(':');
    if (owns(s, kind, id)) { const dup = RARITY[part(kind, id).rare].dup; s.coins += dup; out.coins = dup; }
    else { s.rare[kind + ':' + id] = true; out.part = { kind, id }; }
  }
  return out;
}

// =============== Caixas e peças raras ===============
export function grantCrate(s, tier, n = 1) {
  s.crates[tier] = (s.crates[tier] || 0) + n;
}

export function openCrate(s, tier) {
  const def = CRATES[tier];
  if (!def || !(s.crates[tier] > 0)) return null;
  s.crates[tier]--;
  s.stats.crates++;
  track(s, 'crate', 1);
  let r = Math.random(), rarity = null;
  for (const [k, p] of Object.entries(def.odds)) { if ((r -= p) <= 0) { rarity = k; break; } }
  const coins = Math.round(rand(def.coins[0], def.coins[1]) / 10) * 10;
  if (!rarity) { s.coins += coins; return { tier, coins }; }
  const p = pick(RARE_PARTS.filter((x) => x.rare === rarity));
  if (owns(s, p.kind, p.id)) {
    const dup = RARITY[rarity].dup;
    s.coins += dup;
    return { tier, part: p, dup: true, coins: dup };
  }
  s.rare[p.kind + ':' + p.id] = true;
  return { tier, part: p, dup: false, coins: 0 };
}

// =============== Clientes fixos (amizade) ===============
export function befriend(s, c) {
  if (!c.char) return null;
  const ch = charById(c.char);
  if (!ch) return null;
  const f = (s.friends[ch.id] ||= { level: 0, visits: 0 });
  f.visits++;
  track(s, 'friend', 1);
  if (f.level >= ch.lines.length) return { id: ch.id, level: f.level, line: pick(['Sempre bom te ver por aqui!', 'Serviço perfeito como sempre!', 'Já indiquei você para todo mundo!']), gift: null };
  f.level++;
  const gift = ch.gifts[f.level] || null;
  if (gift) {
    if (gift.coins) s.coins += gift.coins;
    if (gift.crate) grantCrate(s, gift.crate);
    if (gift.fame) s.bonusFame = (s.bonusFame || 0) + gift.fame;
  }
  return { id: ch.id, level: f.level, line: ch.lines[f.level - 1], gift };
}

// =============== Clima ===============
export function tickWeather(s, dt, ev) {
  const w = (s.weather ||= { rain: false, t: 150, wet: 0 });
  w.t -= dt;
  if (w.wet > 0) w.wet -= dt;
  if (w.t > 0) return;
  const boost = currentEvent().rainBoost || 1;
  if (w.rain) { w.rain = false; w.wet = 60; w.t = rand(110, 240) / boost; ev?.push({ type: 'rain_end' }); }
  else { w.rain = true; w.t = rand(40, 80) * (boost > 1 ? 1.4 : 1); ev?.push({ type: 'rain_start' }); }
}

// =============== Guincho ===============
export function towPay(s) {
  const b = s.buildings.find((x) => x.type === 'guincho' && !(x.build && !x.build.up));
  if (!b) return 0;
  return Math.round((120 + s.level * 25) * BUILDINGS.guincho.towPay[b.level - 1]);
}

export function tickTow(s, dt, ev) {
  if (!has(s, 'guincho')) return;
  if (s.towCall) {
    s.towCall.expires -= dt;
    if (s.towCall.expires <= 0) { s.towCall = null; s.towIn = rand(150, 240); ev?.push({ type: 'tow_miss' }); }
    return;
  }
  s.towIn -= dt;
  if (s.towIn <= 0) {
    s.towCall = { id: s.seq++, expires: 90, pay: towPay(s) };
    ev?.push({ type: 'tow_call' });
  }
}

export function startTow(s) {
  if (!s.towCall) return null;
  const call = s.towCall;
  s.towCall = null;
  s.towIn = rand(150, 240);
  const type = pick(CAR_TYPES.filter((t) => t.lvl <= s.level));
  call.car = { type: type.id, color: pick(PARTS.color.filter((c) => !c.rare)).id, ...DEFAULT_PART, broken: true, dirt: 0.3, rust: 0 };
  return call;
}

export function finishTow(s, call, res) {
  const stars = !res.done ? 0 : res.hits === 0 ? 3 : res.hits <= 2 ? 2 : 1;
  const coins = (res.done ? call.pay : 0) + Math.round(res.coins || 0);
  const xp = res.done ? 15 + stars * 5 : 5;
  s.coins += coins;
  s.stats.earned += coins;
  if (res.done) { s.stats.tows++; track(s, 'tow', 1); }
  let crate = null;
  if (stars === 3) { crate = 'bronze'; grantCrate(s, crate); }
  // O carro rebocado vira um cliente de conserto que paga bem.
  let customer = null;
  const slot = freeSlot(s);
  if (res.done && slot >= 0 && has(s, 'elevador')) {
    const list = JOBS.repair.filter((j) => j.lvl <= s.level);
    const j = list[list.length - 1];
    const type = carType(call.car.type);
    customer = {
      id: s.seq++, car: call.car, vip: false, char: null, slot, patience: 140, maxPatience: 140,
      job: { kind: 'repair', id: j.id, name: j.name, icon: j.icon, time: j.time, pay: Math.round(j.pay * type.mult * 1.5), xp: j.xp, stages: j.stages || null },
      towed: true,
    };
    s.queue.push(customer);
  }
  const levels = addXp(s, xp);
  return { coins, xp, stars, crate, customer, levels };
}

// =============== Concurso (prêmio da semana anterior) ===============
export function claimContest(s, week, place) {
  if (!s.contest) s.contest = { claimed: [] };
  if (s.contest.claimed.includes(week) || place < 1 || place > 3) return null;
  s.contest.claimed.push(week);
  const crate = ['ouro', 'prata', 'bronze'][place - 1];
  grantCrate(s, crate);
  s.bonusFame = (s.bonusFame || 0) + [10, 6, 3][place - 1];
  return { crate };
}
