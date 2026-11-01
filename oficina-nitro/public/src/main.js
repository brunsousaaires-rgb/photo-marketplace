import { World } from './world.js';
import * as L from './logic.js';
import { BUILDINGS, PARTS, PART_TABS, PART_LABEL, GRID_W, GRID_H, BUILDING_MAX_LEVEL, xpNeed, part, limitAt } from './data.js';
import { Sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.floor(n).toLocaleString('pt-BR');
const coin = (n) => `<i class="coin"></i>${fmt(n)}`;
const SAVE_KEY = 'oficina-nitro.v1';

// ---------- salvar / carregar ----------
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.v === 1 && Array.isArray(s.buildings)) return s;
  } catch {}
  return null;
}
function save() {
  state.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

await Promise.race([document.fonts?.load('40px "Lilita One"'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});

let state = loadSave();
let offline = null;
if (!state) state = L.newState();
else offline = L.applyOffline(state, (Date.now() - (state.lastSeen || Date.now())) / 1000);

const sfx = new Sfx();
const world = new World($('#scene'));
world.sync(state);

let mode = 'play'; // play | place | custom
let placing = null;
let custom = null;
let shownCoins = state.coins;
const events = [];

// ---------- utilidades de tela ----------
function screenOf(v3, dy = 0) {
  return world.toScreen(v3.clone().setY((v3.y || 0) + dy));
}

function toast(msg) {
  const t = $('#toast');
  t.innerHTML = `<div class="toastmsg">${msg}</div>`;
}

function floatText(pos, html, color = '#fff') {
  const el = document.createElement('div');
  el.className = 'float ol';
  el.style.left = pos.x + 'px';
  el.style.top = pos.y + 'px';
  el.style.color = color;
  el.innerHTML = html;
  $('#fly').appendChild(el);
  setTimeout(() => el.remove(), 1150);
}

function flyCoins(from, amount) {
  const target = $('#coinPill .coin').getBoundingClientRect();
  const tx = target.left + target.width / 2, ty = target.top + target.height / 2;
  const n = Math.min(12, 3 + Math.floor(amount / 40));
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'flycoin';
    el.innerHTML = '<i class="coin"></i>';
    $('#fly').appendChild(el);
    const x0 = from.x + (Math.random() - 0.5) * 60, y0 = from.y + (Math.random() - 0.5) * 40;
    const xm = x0 + (Math.random() - 0.5) * 120, ym = y0 - 60 - Math.random() * 60;
    const a = el.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.3)` },
      { transform: `translate(${xm}px, ${ym}px) scale(1.2)`, offset: 0.35 },
      { transform: `translate(${tx - 13}px, ${ty - 13}px) scale(.8)` },
    ], { duration: 650 + i * 55, easing: 'cubic-bezier(.4,0,.7,.6)', fill: 'forwards' });
    a.onfinish = () => {
      el.remove();
      sfx.play('coin');
      const p = $('#coinPill');
      p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump');
    };
  }
}

// ---------- janelas ----------
const modalQueue = [];
let modalOpen = false;
function openModal(render, { priority = false } = {}) {
  if (modalOpen) { priority ? modalQueue.unshift(render) : modalQueue.push(render); return; }
  modalOpen = true;
  $('#modal').hidden = false;
  render($('#modalBox'));
}
function closeModal() {
  $('#modal').hidden = true;
  $('#modalBox').innerHTML = '';
  modalOpen = false;
  if (modalQueue.length) setTimeout(() => openModal(modalQueue.shift()), 120);
}
function rerender(render) {
  $('#modalBox').innerHTML = '';
  render($('#modalBox'));
}
$('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal' && !$('#modalBox').dataset.sticky) { sfx.play('click'); closeModal(); } });
function head(title, cls = '', closable = true) {
  return `<div class="mhead ${cls}"><h2 class="ol">${title}</h2>${closable ? '<button class="mclose" data-close aria-label="Fechar">✕</button>' : ''}</div>`;
}
$('#modalBox').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) { sfx.play('click'); closeModal(); } });

// ---------- HUD ----------
let lastHud = '';
function updateHud(dt) {
  shownCoins += (state.coins - shownCoins) * Math.min(1, dt * 7);
  if (Math.abs(state.coins - shownCoins) < 1) shownCoins = state.coins;
  const need = xpNeed(state.level);
  const fame = L.fame(state);
  const ready = state.missions.filter((m) => m.progress >= m.target).length;
  const key = [Math.round(shownCoins), state.level, state.xp, fame, ready].join('|');
  if (key === lastHud) return;
  lastHud = key;
  $('#coins').textContent = fmt(shownCoins);
  $('#fame').textContent = fame;
  $('#lvlNum').textContent = state.level;
  $('#xpFill').style.width = Math.min(100, (state.xp / need) * 100) + '%';
  $('#xpText').textContent = `${state.xp} / ${need} XP`;
  $('#missionDot').hidden = !ready;
  $('#missionDot').textContent = ready;
}

function setHudMode() {
  const play = mode === 'play';
  $('#btnShop').hidden = !play;
  $('#btnMissions').hidden = !play;
  $('#buildBar').hidden = mode !== 'place';
  $('#custom').hidden = mode !== 'custom';
}

let tipText = null;
function tutorial() {
  if (state.tutDone) return null;
  const s = state.stats;
  if (s.delivered === 0) {
    const inBay = state.buildings.find((b) => b.job);
    if (!inBay) return state.queue.length ? 'Um cliente chegou! Toque no carro dele 🚗' : 'Aguarde: o primeiro cliente já vem aí… 🚗';
    if (inBay.job.state === 'work') return 'Toque várias vezes no elevador para acelerar o conserto ⚡';
    if (inBay.job.state === 'done') return 'Prontinho! Toque nas moedas para receber 💰';
  }
  if (s.customs === 0) {
    if (mode === 'custom') return 'Escolha o que está marcado como PEDIDO e toque em ENTREGAR';
    if (state.queue.some((c) => c.job.kind === 'custom')) return 'Esse cliente quer personalizar o carro! Toque no carro com 🎨';
    return 'Atenda mais clientes. Logo chega alguém querendo personalizar 🎨';
  }
  if (!state.openedShop) return 'Toque em Construir 🛠️ para expandir e decorar sua oficina';
  state.tutDone = true;
  return null;
}
function updateTip() {
  const t = mode !== 'play' ? null : tutorial();
  if (t === tipText) return;
  tipText = t;
  $('#tip').hidden = !t;
  if (t) { $('#tip').textContent = t; $('#tip').style.animation = 'none'; void $('#tip').offsetWidth; $('#tip').style.animation = ''; }
}

// ---------- balões sobre carros e construções ----------
const bubbleEls = new Map();
function setBubble(seen, key, pos, cls, html, act, id) {
  seen.add(key);
  let el = bubbleEls.get(key);
  if (!el) {
    el = document.createElement('div');
    el.innerHTML = '<div class="in"></div>';
    $('#bubbles').appendChild(el);
    bubbleEls.set(key, el);
  }
  if (el._cls !== cls) { el.className = 'bub ' + cls; el._cls = cls; }
  if (el._html !== html) { el.firstChild.innerHTML = html; el._html = html; }
  el.dataset.act = act;
  el.dataset.id = id;
  el.style.display = pos.visible ? '' : 'none';
  el.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) translate(-50%, -100%)`;
}

function updateBubbles() {
  const seen = new Set();
  const hideQueue = mode !== 'play';
  if (!hideQueue) {
    for (const c of state.queue) {
      const v = world.carViews.get(c.id);
      if (!v || v.path.length) continue;
      const pct = Math.max(0, c.patience / c.maxPatience);
      const col = pct > 0.5 ? '#46c35a' : pct > 0.25 ? '#ffb800' : '#f0503c';
      const html = `<div class="ic">${c.job.icon}<svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" stroke="#e3e8f0"/><circle cx="18" cy="18" r="16" stroke="${col}" stroke-dasharray="${(pct * 100.5).toFixed(0)} 200" transform="rotate(-90 18 18)"/></svg></div>${coin(c.job.pay)}`;
      setBubble(seen, 'c' + c.id, screenOf(v.g.position, 2.7), 'wait' + (pct < 0.25 ? ' urgent' : ''), html, 'assign', c.id);
    }
  }
  for (const b of state.buildings) {
    const v = world.buildViews.get(b.id);
    if (!v) continue;
    if (b.job && !(mode === 'custom' && custom?.bid === b.id)) {
      const j = b.job;
      const cv = world.carViews.get(j.c.id);
      if (cv && cv.path.length) continue;
      const pos = screenOf(v.g.position, b.type === 'elevador' ? 3.9 : 4.4);
      if (j.state === 'work') {
        const p = 100 * (1 - j.remaining / j.total);
        setBubble(seen, 'b' + b.id, pos, 'work', `<div class="ic">${j.c.job.icon}</div><div class="prog"><i style="width:${p.toFixed(0)}%"></i></div><span class="t">${Math.ceil(j.remaining / L.speedOf(b))}s</span>`, 'speed', b.id);
      } else if (j.state === 'done') {
        setBubble(seen, 'b' + b.id, pos, 'done', `${coin(Math.round(j.c.job.pay * (1 + L.tipBonus(state))))}`, 'collect', b.id);
      } else if (j.state === 'custom' && mode === 'play') {
        setBubble(seen, 'b' + b.id, pos, 'custom', '<div class="ic">🎨</div>Personalizar', 'custom', b.id);
      }
    }
    if (b.type === 'loja' && b.stored >= 5 && mode === 'play') {
      const full = b.stored >= BUILDINGS.loja.cap[b.level - 1];
      setBubble(seen, 'l' + b.id, screenOf(v.g.position, 4.0), full ? 'done' : 'done', `${coin(b.stored)}${full ? ' <span class="t">CHEIO</span>' : ''}`, 'loja', b.id);
    }
  }
  for (const [k, el] of bubbleEls) if (!seen.has(k)) { el.remove(); bubbleEls.delete(k); }
}

$('#bubbles').addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.bub');
  if (!el) return;
  e.stopPropagation();
  const id = Number(el.dataset.id);
  switch (el.dataset.act) {
    case 'assign': assignCustomer(id); break;
    case 'speed': speedUp(id); break;
    case 'collect': collectJob(id); break;
    case 'custom': openCustom(id); break;
    case 'loja': collectLoja(id); break;
  }
});

// ---------- ações ----------
function assignCustomer(id) {
  const r = L.assign(state, id);
  if (!r.ok) {
    sfx.play('error');
    if (r.reason === 'busy') toast(`${BUILDINGS[r.btype].icon} ${BUILDINGS[r.btype].name} ocupado!`);
    else if (r.reason === 'missing') toast(`Construa um(a) ${BUILDINGS[r.btype].name} primeiro`);
    return;
  }
  sfx.play('car');
  world.carToBay(r.c, r.b, () => {
    if (r.c.job.kind === 'custom' && mode === 'play' && !modalOpen && r.b.job?.c.id === r.c.id) openCustom(r.b.id);
  });
  afterChange();
}

function speedUp(bid) {
  if (!L.speedUp(state, bid)) return;
  const v = world.buildViews.get(bid);
  sfx.play('tap');
  world.burst(v.g.position.clone().setY(1.4), '#ffd23d', 5, 3, 0.08, 3);
  const p = screenOf(v.g.position, 2.5);
  floatText({ x: p.x + (Math.random() - 0.5) * 50, y: p.y }, '⚡', '#ffd23d');
}

function collectJob(bid) {
  const v = world.buildViews.get(bid);
  const r = L.collect(state, bid);
  if (!r) return;
  const p = screenOf(v.g.position, 3);
  sfx.play('cash');
  flyCoins(p, r.coins);
  floatText(p, `+${fmt(r.coins)}`, '#ffd23d');
  floatText({ x: p.x, y: p.y + 34 }, `+${r.xp} XP`, '#a9f07e');
  setTimeout(() => sfx.play('horn'), 250);
  world.carLeave(r.c.id, true, true);
  handleLevels(r.levels);
  afterChange();
}

function collectLoja(bid) {
  const r = L.collectLoja(state, bid);
  if (!r) return;
  const v = world.buildViews.get(bid);
  const p = screenOf(v.g.position, 3);
  sfx.play('cash');
  flyCoins(p, r.coins);
  floatText(p, `+${fmt(r.coins)}`, '#ffd23d');
  afterChange();
}

function handleLevels(levels) {
  for (const lv of levels || []) {
    setTimeout(() => {
      sfx.play('level');
      const esc = state.buildings.find((b) => b.type === 'escritorio');
      if (esc) world.confetti(world.buildViews.get(esc.id).g.position, 60);
    }, 300);
    openModal((box) => {
      const un = L.unlocksAt(lv);
      box.innerHTML = head('SUBIU DE NÍVEL!', 'gold') + `
        <div class="mbody center">
          <div class="hero">🏆</div>
          <p class="bigtext ol">Nível ${lv}</p>
          <div class="reward" style="justify-content:center;font-size:18px">Prêmio: ${coin(40 * lv)}</div>
          ${un.length ? `<b>Novidades liberadas:</b><div class="unlocks">${un.map((u) => `<div class="unl">${u.hex ? `<span class="sw" style="background:${u.hex}"></span>` : u.icon} ${u.name}</div>`).join('')}</div>` : ''}
          <button class="btn yellow" data-close style="width:100%">Continuar</button>
        </div>`;
    });
  }
}

let saveT = 0;
function afterChange() {
  lastHud = '';
  saveT = 0.5;
}

// ---------- personalização ----------
function openCustom(bid) {
  const b = state.buildings.find((x) => x.id === bid);
  if (!b || !b.job || b.job.state !== 'custom' || mode !== 'play') return;
  const cv = world.carViews.get(b.job.c.id);
  if (!cv || cv.path.length) return;
  const c = b.job.c;
  custom = { bid, cid: c.id, spec: { ...c.car, dirt: 0, broken: false }, tab: c.job.reqs[0]?.part || 'color' };
  mode = 'custom';
  setHudMode();
  world.focus(world.buildViews.get(bid).g.position.clone(), world.viewH / 10.5);
  sfx.play('pop');
  renderCustom();
}

function closeCustom() {
  mode = 'play';
  custom = null;
  world.unfocus();
  setHudMode();
}

function renderCustom() {
  const b = state.buildings.find((x) => x.id === custom.bid);
  if (!b || !b.job) { closeCustom(); return; }
  const c = b.job.c, sp = custom.spec;
  const ev = L.evaluateCustom(state, b, sp);
  const reqs = c.job.reqs.map((r) => {
    const p = part(r.part, r.value);
    const ok = sp[r.part] === r.value;
    const sw = p.hex ? `<span class="sw" style="background:${p.hex}"></span>` : `<span>${p.icon || ''}</span>`;
    return `<div class="req ${ok ? 'ok' : ''}"><span class="chk">${ok ? '✔' : ''}</span>${PART_LABEL[r.part]}: ${sw}<b>${p.name}</b></div>`;
  }).join('');
  $('#reqCard').innerHTML = `
    <h3><span>🧑‍🔧 Pedido do cliente</span><span class="reward">${coin(c.job.pay)}${ev.tip ? ` <span style="color:#2f8f1c">+${fmt(ev.tip)} gorjeta</span>` : ''}</span></h3>
    <div class="reqs">${reqs}</div>
    <div class="reqnote">Peças extras que o cliente não pediu rendem gorjeta! ✨</div>`;
  const wanted = new Map(c.job.reqs.map((r) => [r.part, r.value]));
  $('#tabs').innerHTML = PART_TABS.map((t) => `<button class="tab ${custom.tab === t.id ? 'on' : ''}" data-tab="${t.id}"><span>${t.icon}</span>${t.name}${wanted.has(t.id) ? ' •' : ''}</button>`).join('');
  $('#options').innerHTML = PARTS[custom.tab].map((p) => {
    const locked = p.lvl > state.level;
    const on = sp[custom.tab] === p.id;
    const want = wanted.get(custom.tab) === p.id;
    let vis;
    if (custom.tab === 'color') vis = `<span class="swatch" style="background:${p.hex}${p.metal ? ';background:radial-gradient(circle at 35% 30%, #fff 0 12%, ' + p.hex + ' 40%, #555 120%)' : ''}"></span>`;
    else if (custom.tab === 'neon' && p.hex) vis = `<span class="swatch" style="background:${p.hex};box-shadow:0 0 14px ${p.hex}, inset 0 -6px 0 rgba(0,0,0,.18)"></span>`;
    else vis = `<span class="big">${p.icon}</span>`;
    return `<button class="opt ${on ? 'on' : ''} ${want ? 'want' : ''} ${locked ? 'locked' : ''}" data-opt="${p.id}">${vis}<span>${p.name}</span>${locked ? `<span class="lock">🔒 Nv ${p.lvl}</span>` : ''}</button>`;
  }).join('');
  $('#deliverBtn').innerHTML = `ENTREGAR ${coin(ev.coins)}`;
}

$('#tabs').addEventListener('click', (e) => {
  const t = e.target.closest('[data-tab]');
  if (!t || !custom) return;
  sfx.play('click');
  custom.tab = t.dataset.tab;
  renderCustom();
});

$('#options').addEventListener('click', (e) => {
  const o = e.target.closest('[data-opt]');
  if (!o || !custom) return;
  const p = part(custom.tab, o.dataset.opt);
  if (p.lvl > state.level) { sfx.play('error'); toast(`🔒 Libera no nível ${p.lvl}`); return; }
  if (custom.spec[custom.tab] === p.id) return;
  custom.spec[custom.tab] = p.id;
  world.replaceCar(custom.cid, custom.spec);
  const pos = world.buildViews.get(custom.bid).g.position.clone().setY(1);
  const col = p.hex || '#ffffff';
  world.burst(pos, col, 18, 4, 0.14, 4);
  sfx.play(custom.tab === 'color' ? 'spray' : 'pop');
  renderCustom();
});

$('#customClose').addEventListener('click', () => { sfx.play('click'); closeCustom(); });

$('#deliverBtn').addEventListener('click', () => {
  if (!custom) return;
  const { bid, cid, spec } = custom;
  const r = L.deliverCustom(state, bid, spec);
  if (!r) return;
  world.replaceCar(cid, r.spec);
  const pos = world.buildViews.get(bid).g.position.clone();
  closeCustom();
  afterChange();
  if (r.stars === 3) { world.confetti(pos, 50); sfx.play('stars'); } else sfx.play('pop');
  const msg = r.stars === 3 ? (r.extras ? 'Ficou incrível! Cliente apaixonado 😍' : 'Exatamente como pedi! 😄') : r.stars === 2 ? 'Quase… mas faltou uma coisa 😐' : 'Não era bem isso que eu pedi 😕';
  openModal((box) => {
    box.dataset.sticky = '1';
    box.innerHTML = head(r.stars === 3 ? 'ENTREGA PERFEITA!' : 'ENTREGA FEITA', r.stars === 3 ? 'gold' : 'pink', false) + `
      <div class="mbody center">
        <div class="stars">${[1, 2, 3].map((i) => `<i class="${i <= r.stars ? '' : 'off'}">★</i>`).join('')}</div>
        <b style="font-size:18px">${msg}</b>
        <div class="statline" style="width:100%"><span>Serviço (${r.met}/${r.total} pedidos)</span><b>${coin(r.base)}</b></div>
        ${r.tip ? `<div class="statline" style="width:100%"><span>Gorjeta${r.extras ? ` (${r.extras} extra${r.extras > 1 ? 's' : ''})` : ''}</span><b class="up">+${coin(r.tip)}</b></div>` : ''}
        <div class="statline" style="width:100%"><span>Experiência</span><b class="up">+${r.xp} XP</b></div>
        <button class="btn green" id="okDeliver" style="width:100%">RECEBER ${coin(r.coins)}</button>
      </div>`;
    box.querySelector('#okDeliver').onclick = () => {
      delete box.dataset.sticky;
      closeModal();
      const p = screenOf(pos, 2);
      flyCoins(p, r.coins);
      sfx.play('cash');
      setTimeout(() => { sfx.play('horn'); world.carLeave(cid, true, true); }, 200);
      handleLevels(r.levels);
    };
  }, { priority: true });
});

// ---------- construção ----------
function suggestSpot(type, moveId) {
  const d = BUILDINGS[type];
  const cx = world.target.x / 2 - d.w / 2, cz = world.target.z / 2 - d.d / 2;
  let best = null, bd = 1e9;
  for (let z = 0; z <= GRID_H - d.d; z++) for (let x = 0; x <= GRID_W - d.w; x++) {
    if (!L.canPlace(state, type, x, z, moveId)) continue;
    const dist = (x - cx) ** 2 + (z - cz) ** 2;
    if (dist < bd) { bd = dist; best = { x, z }; }
  }
  return best;
}

function startPlacement(type, moveId = null) {
  const spot = moveId ? (() => { const b = state.buildings.find((q) => q.id === moveId); return { x: b.x, z: b.z }; })() : suggestSpot(type);
  if (!spot) { sfx.play('error'); toast('Sem espaço livre no terreno!'); return; }
  mode = 'place';
  placing = { type, moveId, x: spot.x, z: spot.z };
  if (moveId) world.buildViews.get(moveId).g.visible = false;
  world.setGhost(state, type, spot.x, spot.z, moveId);
  const d = BUILDINGS[type];
  $('#buildLabel').innerHTML = moveId ? `Mover ${d.name}` : `${d.icon} ${d.name} · ${coin(L.costOf(state, type))}`;
  setHudMode();
  updateTip();
}

function movePlacement(x, z) {
  if (!placing) return;
  placing.x = x; placing.z = z;
  world.setGhost(state, placing.type, x, z, placing.moveId);
}

function confirmPlacement() {
  if (!placing) return;
  const { type, moveId, x, z } = placing;
  let ok, newId = null;
  if (moveId) ok = L.move(state, moveId, x, z);
  else {
    const r = L.place(state, type, x, z);
    ok = r.ok;
    if (ok) newId = r.b.id;
    else if (r.reason === 'coins') { sfx.play('error'); toast('Moedas insuficientes'); return; }
  }
  if (!ok) { sfx.play('error'); toast('Não dá para construir aí'); return; }
  endPlacement();
  world.sync(state, newId ?? moveId);
  sfx.play('build');
  afterChange();
}

function endPlacement() {
  if (placing?.moveId) { const v = world.buildViews.get(placing.moveId); if (v) v.g.visible = true; }
  placing = null;
  world.clearGhost();
  mode = 'play';
  setHudMode();
}

$('#buildOk').addEventListener('click', confirmPlacement);
$('#buildCancel').addEventListener('click', () => { sfx.play('click'); endPlacement(); });

function openShop(tab = 'servicos') {
  state.openedShop = true;
  const render = (box) => {
    const items = Object.entries(BUILDINGS).filter(([, d]) => d.cat === tab);
    box.innerHTML = head('🛠️ Construir') + `
      <div class="mbody">
        <div class="mtabs">
          <button class="tab ${tab === 'servicos' ? 'on' : ''}" data-shoptab="servicos">🔧 Serviços</button>
          <button class="tab ${tab === 'decor' ? 'on' : ''}" data-shoptab="decor">🌳 Decoração</button>
        </div>
        <div class="grid">${items.map(([id, d]) => {
          const can = L.canBuy(state, id);
          const cnt = L.count(state, id), lim = limitAt(id, state.level);
          let btn;
          if (can.reason === 'level') btn = `<button class="btn gray" disabled>🔒 Nível ${can.need}</button>`;
          else if (can.reason === 'limit') btn = `<button class="btn gray" disabled>${can.need ? `Mais no nível ${can.need}` : 'Máximo'}</button>`;
          else btn = `<button class="btn yellow" data-buy="${id}" ${can.reason === 'coins' ? 'disabled' : ''}>${coin(L.costOf(state, id))}</button>`;
          const meta = d.decor ? `<span class="meta">⭐ +${d.fame} de fama</span>` : `<span class="meta">${cnt}/${lim || '—'} construídos</span>`;
          return `<div class="card ${can.reason === 'level' ? 'locked' : ''}"><div class="big">${d.icon}</div><h4>${d.name}</h4>${d.desc ? `<p>${d.desc}</p>` : ''}${meta}${btn}</div>`;
        }).join('')}</div>
        <div class="reqnote" style="text-align:center">⭐ Fama traz clientes mais rápido e aumenta as gorjetas.</div>
      </div>`;
    box.querySelectorAll('[data-shoptab]').forEach((b) => b.onclick = () => { sfx.play('click'); tab = b.dataset.shoptab; rerender(render); });
    box.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { sfx.play('click'); closeModal(); startPlacement(b.dataset.buy); });
  };
  openModal(render);
}

// ---------- informações da construção ----------
function openInfo(bid) {
  const render = (box) => {
    const b = state.buildings.find((q) => q.id === bid);
    if (!b) { closeModal(); return; }
    const d = BUILDINGS[b.type];
    const lines = [];
    const nx = b.level < BUILDING_MAX_LEVEL;
    if (d.speed) lines.push(['Velocidade', `${d.speed[b.level - 1]}x`, nx ? `${d.speed[b.level]}x` : null]);
    if (d.tip) lines.push(['Gorjeta extra', `+${Math.round(d.tip[b.level - 1] * 100)}%`, nx ? `+${Math.round(d.tip[b.level] * 100)}%` : null]);
    if (d.rate) {
      lines.push(['Renda', `${Math.round(d.rate[b.level - 1] * 60)}/min`, nx ? `${Math.round(d.rate[b.level] * 60)}/min` : null]);
      lines.push(['Capacidade', fmt(d.cap[b.level - 1]), nx ? fmt(d.cap[b.level]) : null]);
    }
    if (d.decor) lines.push(['Fama', `+${d.fame}`, null]);
    if (d.fixed) {
      const s = state.stats;
      lines.push(['Nível da oficina', state.level, null], ['Fama total', `⭐ ${L.fame(state)}`, null], ['Clientes atendidos', fmt(s.delivered), null], ['Carros personalizados', fmt(s.customs), null], ['Entregas perfeitas', fmt(s.perfect), null], ['Moedas ganhas', coin(s.earned), null]);
    }
    const cost = L.upgradeCost(b);
    const stars = d.upCost ? `<div class="lvstars">${'★'.repeat(b.level)}<span style="color:#c3cbd8">${'★'.repeat(BUILDING_MAX_LEVEL - b.level)}</span></div>` : '';
    box.innerHTML = head(`${d.icon} ${d.name}`) + `
      <div class="mbody">
        ${stars ? `<div class="center" style="display:flex;flex-direction:column">${stars}<b>Nível ${b.level}${b.level >= BUILDING_MAX_LEVEL ? ' (máximo)' : ''}</b></div>` : ''}
        ${d.desc ? `<div class="reqnote" style="text-align:center">${d.desc}</div>` : ''}
        ${lines.map(([k, v, n]) => `<div class="statline"><span>${k}</span><b>${v}${n ? ` <span class="up">→ ${n}</span>` : ''}</b></div>`).join('')}
        <div class="row">
          ${!d.fixed && !b.job ? '<button class="btn blue" data-move>↔ Mover</button>' : ''}
          ${cost != null ? `<button class="btn green" data-up ${state.coins < cost ? 'disabled' : ''}>Melhorar ${coin(cost)}</button>` : ''}
        </div>
      </div>`;
    box.querySelector('[data-move]')?.addEventListener('click', () => { sfx.play('click'); closeModal(); startPlacement(b.type, b.id); });
    box.querySelector('[data-up]')?.addEventListener('click', () => {
      const r = L.upgrade(state, b.id);
      if (!r.ok) { sfx.play('error'); return; }
      sfx.play('build');
      world.sync(state);
      world.confetti(world.buildViews.get(b.id).g.position, 30);
      afterChange();
      rerender(render);
    });
  };
  openModal(render);
}

// ---------- missões ----------
function openMissions() {
  const render = (box) => {
    box.innerHTML = head('📋 Missões') + `
      <div class="mbody">${state.missions.map((m) => {
        const done = m.progress >= m.target;
        return `<div class="card mission">
          <div class="mtext"><b>${m.text}</b>
            <div class="mprog"><i style="width:${(m.progress / m.target) * 100}%"></i><span>${fmt(m.progress)} / ${fmt(m.target)}</span></div>
            <div class="reward">${coin(m.reward.coins)} <span style="color:#2f8f1c">+${m.reward.xp} XP</span></div>
          </div>
          ${done ? `<button class="btn green" data-claim="${m.id}">Resgatar</button>` : ''}
        </div>`;
      }).join('')}
      <div class="reqnote" style="text-align:center">Novas missões aparecem quando você resgata as antigas.</div></div>`;
    box.querySelectorAll('[data-claim]').forEach((btn) => btn.onclick = () => {
      const rect = btn.getBoundingClientRect();
      const r = L.claimMission(state, Number(btn.dataset.claim));
      if (!r) return;
      sfx.play('cash');
      flyCoins({ x: rect.left + rect.width / 2, y: rect.top }, r.coins);
      afterChange();
      rerender(render);
      handleLevels(r.levels);
    });
  };
  openModal(render);
}

$('#btnShop').addEventListener('click', () => { sfx.play('click'); openShop(); });
$('#btnMissions').addEventListener('click', () => { sfx.play('click'); openMissions(); });
$('#btnMute').addEventListener('click', () => { $('#btnMute').textContent = sfx.toggle() ? '🔇' : '🔊'; });
$('#btnMute').textContent = sfx.muted ? '🔇' : '🔊';
$('#famePill').addEventListener('click', () => toast('⭐ Fama: decore e melhore a oficina para atrair mais clientes'));

// ---------- toque / arrastar / zoom ----------
const canvas = $('#scene');
const pointers = new Map();
let moved = 0, pinch = null;

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) moved = 0;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (mode === 'place' && e.pointerType === 'mouse' && !pointers.size) {
    const t = world.tileAt(e.clientX, e.clientY, placing.type);
    if (t && (t.x !== placing.x || t.z !== placing.z)) movePlacement(t.x, t.z);
    return;
  }
  const p = pointers.get(e.pointerId);
  if (!p) return;
  if (pointers.size === 2) {
    p.x = e.clientX; p.y = e.clientY;
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch && mode !== 'custom') world.zoomBy(d / pinch);
    pinch = d;
    moved = 99;
    return;
  }
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  moved += Math.hypot(dx, dy);
  if (moved > 8 && mode !== 'custom') {
    if (mode === 'place' && e.pointerType !== 'mouse') {
      const t = world.tileAt(e.clientX, e.clientY, placing.type);
      if (t && (t.x !== placing.x || t.z !== placing.z)) movePlacement(t.x, t.z);
    } else world.pan(p.x, p.y, e.clientX, e.clientY);
  }
  p.x = e.clientX; p.y = e.clientY;
});
const endPointer = (e) => {
  const was = pointers.has(e.pointerId);
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (was && !pointers.size && moved < 8) onTap(e.clientX, e.clientY);
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); pinch = null; });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (mode !== 'custom') world.zoomBy(Math.pow(1.0018, -e.deltaY)); }, { passive: false });

function onTap(x, y) {
  if (mode === 'custom') return;
  if (mode === 'place') {
    const t = world.tileAt(x, y, placing.type);
    if (!t) return;
    if (t.x === placing.x && t.z === placing.z) confirmPlacement();
    else movePlacement(t.x, t.z);
    return;
  }
  const hit = world.pick(x, y);
  if (!hit) return;
  if (hit.kind === 'car') {
    if (state.queue.some((c) => c.id === hit.id)) { assignCustomer(hit.id); return; }
    const b = state.buildings.find((q) => q.job && q.job.c.id === hit.id);
    if (b) tapBuilding(b);
    return;
  }
  const b = state.buildings.find((q) => q.id === hit.id);
  if (b) tapBuilding(b);
}

function tapBuilding(b) {
  if (b.job) {
    if (b.job.state === 'work') return speedUp(b.id);
    if (b.job.state === 'done') return collectJob(b.id);
    if (b.job.state === 'custom') return openCustom(b.id);
  }
  if (b.type === 'loja' && b.stored >= 1) return collectLoja(b.id);
  sfx.play('click');
  openInfo(b.id);
}

addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalOpen && !$('#modalBox').dataset.sticky) closeModal();
    else if (mode === 'place') endPlacement();
    else if (mode === 'custom') closeCustom();
  }
  if (e.key === 'Enter' && mode === 'place') confirmPlacement();
});

// ---------- loop ----------
function handleEvents() {
  for (const e of events) {
    if (e.type === 'arrive') { world.carArrive(e.c); if (mode === 'play') sfx.play('car'); }
    else if (e.type === 'leave') {
      const v = world.carViews.get(e.c.id);
      if (v) { const p = screenOf(v.g.position, 2.5); floatText(p, '😠', '#fff'); }
      sfx.play('angry');
      world.carLeave(e.c.id, false, false);
    } else if (e.type === 'done') {
      sfx.play('pop');
    }
  }
  events.length = 0;
}

let last = performance.now(), tipT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  L.tick(state, dt, events);
  if (events.length) handleEvents();
  world.update(dt, state);
  updateBubbles();
  updateHud(dt);
  tipT -= dt;
  if (tipT <= 0) { tipT = 0.3; updateTip(); }
  saveT -= dt;
  if (saveT <= 0) { saveT = 4; save(); }
  requestAnimationFrame(frame);
}

addEventListener('visibilitychange', () => { if (document.hidden) save(); });
addEventListener('pagehide', save);

setHudMode();
requestAnimationFrame(frame);
$('#loading').classList.add('out');
window.__started = true;

// Boas-vindas: tempo fora e presente diário.
if (offline && offline.seconds > 90 && (offline.loja > 0 || offline.jobs > 0)) {
  openModal((box) => {
    const h = Math.floor(offline.seconds / 3600), m = Math.floor((offline.seconds % 3600) / 60);
    box.innerHTML = head('Bem-vindo de volta!') + `
      <div class="mbody center">
        <div class="hero">🔧</div>
        <b>Você ficou fora ${h ? `${h}h ` : ''}${m}min. Sua equipe continuou trabalhando:</b>
        ${offline.jobs ? `<div class="statline" style="width:100%"><span>Serviços prontos para entregar</span><b>${offline.jobs}</b></div>` : ''}
        ${offline.loja ? `<div class="statline" style="width:100%"><span>Vendas da loja (toque nela para recolher)</span><b>${coin(offline.loja)}</b></div>` : ''}
        <button class="btn green" data-close style="width:100%">Bora trabalhar!</button>
      </div>`;
  });
}
const daily = L.dailyAvailable(state);
if (daily) {
  openModal((box) => {
    box.dataset.sticky = '1';
    box.innerHTML = head('Presente do dia', 'gold', false) + `
      <div class="mbody center">
        <div class="hero">🎁</div>
        <p class="bigtext ol">Dia ${daily.streak}${daily.streak > 1 ? ' 🔥' : ''}</p>
        <b>${daily.streak > 1 ? 'Sequência mantida! Volte amanhã para ganhar ainda mais.' : 'Volte todo dia: o presente cresce a cada dia seguido.'}</b>
        <button class="btn yellow" id="dailyOk" style="width:100%">PEGAR ${coin(daily.coins)}</button>
      </div>`;
    box.querySelector('#dailyOk').onclick = () => {
      const r = L.claimDaily(state);
      const rect = box.querySelector('#dailyOk').getBoundingClientRect();
      delete box.dataset.sticky;
      closeModal();
      if (r) { sfx.play('cash'); flyCoins({ x: rect.left + rect.width / 2, y: rect.top }, r.coins); }
      afterChange();
    };
  });
}

// Depuração no console.
window.oficina = { get state() { return state; }, world, L, assignCustomer, openCustom, collectJob, speedUp, reset() { localStorage.removeItem(SAVE_KEY); location.reload(); } };
