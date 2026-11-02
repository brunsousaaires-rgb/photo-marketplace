import { World, baySpot, TRACK_PATH } from './world.js';
import * as L from './logic.js';
import { BUILDINGS, PARTS, PART_TABS, PART_LABEL, GRID_H, TILE, BUILDING_MAX_LEVEL, LAND, TRACK, xpNeed, part, limitAt, RARITY, CRATES } from './data.js';
import { Sfx } from './audio.js';
import { icon, faceFor, portrait } from './icons.js';
import { Thumbs, Viewer } from './preview.js';
import { openGarage } from './garage.js';
import { Race } from './race.js';
import { TowRun } from './tow.js';
import { Online } from './online.js';
import { openSocial, publishProfile } from './social.js';
import * as X from './extras.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.floor(n).toLocaleString('pt-BR');
const coin = (n) => `<i class="coin"></i>${fmt(n)}`;
const mmss = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.ceil(s % 60) % 60).padStart(2, '0')}` : `${Math.ceil(s)}s`);
const SAVE_KEY = 'oficina-nitro.v1';

// ---------- salvar / carregar ----------
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && Array.isArray(s.buildings)) return L.migrate(s);
  } catch {}
  return null;
}
function save() {
  if (mode === 'race') return;
  state.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

await Promise.race([document.fonts?.load('40px "Lilita One"'), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});

let state = loadSave();
let offline = null;
if (!state) state = L.newState();
else offline = L.applyOffline(state, (Date.now() - (state.lastSeen || Date.now())) / 1000);
state.hintsSeen ||= [];

const sfx = new Sfx();
const world = new World($('#scene'));
const thumbs = new Thumbs();
const viewer = new Viewer();
world.setLot(state);
world.sync(state);

let mode = 'play'; // play | place | custom | race
let placing = null;
let custom = null;
let race = null;
let shownCoins = state.coins;
const events = [];

// ---------- utilidades de tela ----------
const screenOf = (v3, dy = 0) => world.toScreen(v3.clone().setY((v3.y || 0) + dy));

function toast(msg) {
  $('#toast').innerHTML = `<div class="toastmsg">${msg}</div>`;
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
let modalOpen = null;
function openModal(render, opts = {}) {
  if (modalOpen) { opts.priority ? modalQueue.unshift([render, opts]) : modalQueue.push([render, opts]); return; }
  modalOpen = opts;
  $('#modal').hidden = false;
  $('#modalBox').className = opts.wide ? 'wide' : '';
  render($('#modalBox'));
}
function closeModal() {
  const was = modalOpen;
  $('#modal').hidden = true;
  $('#modalBox').innerHTML = '';
  delete $('#modalBox').dataset.sticky;
  delete $('#modalBox').dataset.view;
  modalOpen = null;
  was?.onClose?.();
  if (modalQueue.length) setTimeout(() => openModal(...modalQueue.shift()), 120);
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

const online = new Online();
const ctx = {
  get state() { return state; },
  world, sfx, thumbs, viewer, coin, fmt, head, toast, flyCoins, openModal, closeModal, rerender, online, icon,
  lastCustom: null,
  afterChange: () => afterChange(),
  startRace: (e) => startRace(e),
  buyTrack: () => askTrack(),
  enterVisit: (p, name) => enterVisit(p, name),
  loadState: (s) => loadState(s),
  openPhoto: (spec, title) => X.openPhoto(ctx, spec, title),
  handleLevels: (lv) => handleLevels(lv),
  get mode() { return mode; },
  setMode: (m) => { mode = m; setHudMode(); },
};

// ---------- HUD ----------
let lastHud = '';
function updateHud(dt) {
  shownCoins += (state.coins - shownCoins) * Math.min(1, dt * 7);
  if (Math.abs(state.coins - shownCoins) < 1) shownCoins = state.coins;
  const need = xpNeed(state.level);
  const fame = L.fame(state);
  const ready = state.missions.filter((m) => m.progress >= m.target).length;
  const showGarage = state.level >= 5 || state.garage.length > 0 || state.projects.length > 0;
  const crates = Object.values(state.crates || {}).reduce((a, n) => a + n, 0);
  const key = [Math.round(shownCoins), state.level, state.xp, fame, ready, showGarage, mode, crates, state.event?.points, state.event?.claimed?.length].join('|');
  if (key === lastHud) return;
  lastHud = key;
  $('#coins').textContent = fmt(shownCoins);
  $('#fame').textContent = fame;
  $('#lvlNum').textContent = state.level;
  $('#xpFill').style.width = Math.min(100, (state.xp / need) * 100) + '%';
  $('#xpText').textContent = `${state.xp} / ${need} XP`;
  $('#missionDot').hidden = !ready;
  $('#missionDot').textContent = ready;
  $('#btnGarage').hidden = !showGarage || mode !== 'play';
  X.updateHudExtras(ctx);
}

function setHudMode() {
  const play = mode === 'play';
  $('#btnShop').hidden = !play;
  $('#btnMissions').hidden = !play;
  $('#btnGarage').hidden = !play || !(state.level >= 5 || state.garage.length || state.projects.length);
  $('#buildBar').hidden = mode !== 'place';
  $('#custom').hidden = mode !== 'custom';
  $('#lvl').hidden = mode === 'race';
  $('#res').hidden = mode === 'race' || mode === 'tow';
  $('#btnMenu').hidden = !play;
  $('#eventPill').hidden = !play;
  $('#visitBar').hidden = mode !== 'visit';
  if (mode === 'visit' || mode === 'tow') { $('#lvl').hidden = mode === 'tow'; $('#btnShop').hidden = true; $('#btnMissions').hidden = true; $('#btnGarage').hidden = true; }
  lastHud = '';
}

$('#btnShop').innerHTML = `<span class="ico">${icon('construir')}</span><span class="lbl ol">Construir</span>`;
$('#btnMissions').innerHTML = `<span class="ico">${icon('missoes')}</span><span class="lbl ol">Missões</span><span class="dot" id="missionDot" hidden></span>`;
$('#btnGarage').innerHTML = `<span class="ico">${icon('garagem')}</span><span class="lbl ol">Garagem</span>`;
$('#btnMenu').innerHTML = `<span class="ico">${icon('menu')}</span><span class="lbl ol">Menu</span><span class="dot" id="menuDot" hidden></span>`;

let tipText = null, hintUntil = 0, hintText = null;
const HINTS = [
  ['land', (s) => s.level >= 3 && !s.land.length, 'Novidade: compre o terreno vizinho na placa À VENDA para crescer 🏗️'],
  ['posto', (s) => s.level >= 4 && !L.has(s, 'posto'), 'Novidade: o Posto de Combustível está no menu Construir ⛽'],
  ['resto', (s) => s.level >= 5 && !L.has(s, 'restauracao'), 'Novidade: Box de Restauração! Compre sucatas no leilão da Garagem e restaure 🛠️'],
  ['pista', (s) => s.level >= 6 && !s.track, 'Novidade: a Pista de Corrida! Toque na placa PISTA atrás da oficina 🏁'],
  ['evento', (s) => s.level >= 2, `Evento da semana: ${L.currentEvent().name}! Toque no aviso colorido no alto da tela 🎉`],
  ['equipe', (s) => s.level >= 3 && !s.staff.length, 'Novidade: contrate sua equipe no Menu → Equipe 👷'],
  ['guincho', (s) => s.level >= 4 && !L.has(s, 'guincho'), 'Novidade: construa a Base do Guincho e atenda chamados pela cidade 🚚'],
  ['caixa', (s) => Object.values(s.crates || {}).some((n) => n > 0), 'Você ganhou uma caixa de prêmio! Abra no Menu → Caixas 🎁'],
  ['online', (s) => s.level >= 3 && online.on, 'Jogue com os amigos: Menu → Online para visitar oficinas e votar no concurso 🏆'],
];
function tutorial() {
  const s = state.stats;
  if (!state.tutDone) {
    if (s.delivered === 0) {
      const inBay = state.buildings.find((b) => b.job);
      if (!inBay) return state.queue.length ? 'Um cliente chegou! Toque no carro dele 🚗' : 'Aguarde: o primeiro cliente já vem aí… 🚗';
      if (inBay.job.state === 'work') return 'Toque várias vezes no elevador para acelerar o conserto ⚡';
      if (inBay.job.state === 'done') return 'Prontinho! Toque nas moedas para receber 💰';
    }
    if (s.customs === 0) {
      if (state.queue.some((c) => c.job.kind === 'custom')) return 'Esse cliente quer personalizar o carro! O balão mostra o que ele quer 🎨';
      return 'Atenda mais clientes. Logo chega alguém querendo personalizar 🎨';
    }
    if (!state.openedShop) return 'Toque em Construir para expandir e decorar sua oficina';
    state.tutDone = true;
  }
  const now = performance.now();
  if (now < hintUntil) return hintText;
  for (const [id, cond, text] of HINTS) {
    if (!state.hintsSeen.includes(id) && cond(state)) {
      state.hintsSeen.push(id);
      hintText = text;
      hintUntil = now + 9000;
      return text;
    }
  }
  return null;
}
function updateTip() {
  const t = mode !== 'play' ? null : tutorial();
  if (t === tipText) return;
  tipText = t;
  $('#tip').hidden = !t;
  if (t) { $('#tip').textContent = t; $('#tip').style.animation = 'none'; void $('#tip').offsetWidth; $('#tip').style.animation = ''; }
}

// ---------- balões presos no 3D ----------
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

function wantsHtml(c) {
  if (c.job.kind !== 'custom') return `<span class="jobic">${icon(c.job.icon)}</span>${c.job.time >= 30 ? `<span class="t">${mmss(c.job.time)}</span>` : ''}`;
  return `<span class="jobic">${icon('estilo')}</span>` + c.job.reqs.map((r) => {
    const p = part(r.part, r.value);
    if (r.part === 'color') return `<span class="dotc" style="background:${p.hex}"></span>`;
    if (r.part === 'neon') return `<span class="dotc neonc" style="background:${p.hex};box-shadow:0 0 8px ${p.hex}"></span>`;
    return `<img class="mini" src="${thumbs.part(r.part, r.value)}" alt="${p.name}">`;
  }).join('');
}

function updateBubbles() {
  const seen = new Set();
  if (mode === 'play') {
    for (const c of state.queue) {
      const v = world.carViews.get(c.id);
      if (!v || v.path.length) continue;
      const pct = Math.max(0, c.patience / c.maxPatience);
      const col = pct > 0.5 ? '#46c35a' : pct > 0.25 ? '#ffb800' : '#f0503c';
      const ch = c.char ? X.charById(c.char) : null;
      const html = `<div class="face ${ch ? 'char' : ''}">${ch ? portrait(ch.face) : icon(faceFor(pct))}<svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" stroke="#e3e8f0"/><circle cx="18" cy="18" r="16" stroke="${col}" stroke-dasharray="${(pct * 100.5).toFixed(0)} 200" transform="rotate(-90 18 18)"/></svg></div><div class="want">${wantsHtml(c)}</div><span class="price">${coin(c.job.pay)}</span>${c.vip ? `<span class="vipb">${icon('vip')}</span>` : ''}${ch ? `<span class="chname">${ch.name}</span>` : ''}${c.towed ? '<span class="chname">Rebocado</span>' : ''}`;
      setBubble(seen, 'c' + c.id, screenOf(v.g.position, 2.7), 'wait' + (pct < 0.25 ? ' urgent' : '') + (c.vip ? ' vip' : ''), html, 'assign', c.id);
    }
  }
  if (mode === 'play' || mode === 'place') {
    for (const b of state.buildings) {
      const v = world.buildViews.get(b.id);
      if (!v) continue;
      const top = b.type === 'elevador' ? 3.9 : b.type === 'posto' ? 4.6 : 4.4;
      if (b.build) {
        const p = 100 * (1 - b.build.t / b.build.total);
        setBubble(seen, 'k' + b.id, screenOf(v.g.position, BUILDINGS[b.type].decor ? 2.4 : top), 'work build', `<span class="jobic">${icon('construir')}</span><div class="col"><span class="stage">${b.build.up ? 'Melhorando' : 'Construindo'}</span><div class="prog"><i style="width:${p.toFixed(0)}%"></i></div></div><span class="t">${mmss(b.build.t)}</span>`, 'speed', b.id);
        continue;
      }
      if (b.job && mode === 'play') {
        const j = b.job;
        const cv = world.carViews.get(j.c.id);
        if (cv && cv.path.length) continue;
        const pos = screenOf(v.g.position, top);
        if (j.state === 'work') {
          const p = 100 * (1 - j.remaining / j.total);
          const stage = L.stageOf(j) || j.c.job.name;
          setBubble(seen, 'b' + b.id, pos, 'work', `<span class="jobic">${icon(j.c.job.icon)}</span><div class="col"><span class="stage">${stage}</span><div class="prog"><i style="width:${p.toFixed(0)}%"></i></div></div><span class="t">${mmss(j.remaining / L.speedOf(b))}</span>`, 'speed', b.id);
        } else if (j.state === 'done') {
          const html = j.c.job.kind === 'restore' ? `<span class="jobic">${icon('garagem')}</span>Restaurado!` : coin(Math.round(j.c.job.pay * (1 + L.tipBonus(state))));
          setBubble(seen, 'b' + b.id, pos, 'done', html, 'collect', b.id);
        } else if (j.state === 'custom') {
          setBubble(seen, 'b' + b.id, pos, 'custom', `<span class="jobic">${icon('estilo')}</span>Personalizar`, 'custom', b.id);
        }
      }
      if (b.type === 'guincho' && state.towCall && mode === 'play') {
        setBubble(seen, 't' + b.id, screenOf(v.g.position, 4.2), 'done tow', `<span class="jobic">${icon('telefone')}</span>Chamado! <span class="t">${Math.ceil(state.towCall.expires)}s</span>`, 'tow', b.id);
      }
      if (b.type === 'loja' && b.stored >= 5 && mode === 'play') {
        const full = b.stored >= BUILDINGS.loja.cap[b.level - 1];
        setBubble(seen, 'l' + b.id, screenOf(v.g.position, 4.0), 'done', `${coin(b.stored)}${full ? ' <span class="t">CHEIO</span>' : ''}`, 'loja', b.id);
      }
    }
  }
  if (mode === 'play') {
    const next = L.nextLand(state);
    if (next && world.saleSign) {
      const html = state.level >= next.lvl ? `<span class="jobic">${icon('terreno')}</span>${coin(next.cost)}` : `<span class="jobic">${icon('terreno')}</span>🔒 Nível ${next.lvl}`;
      setBubble(seen, 'land', screenOf(world.saleSign.position, 3.6), 'sale', html, 'land', 0);
    }
    if (!state.track && world.trackSign) {
      const html = state.level >= TRACK.lvl ? `<span class="jobic">${icon('corrida')}</span>${coin(TRACK.cost)}` : `<span class="jobic">${icon('corrida')}</span>🔒 Nível ${TRACK.lvl}`;
      setBubble(seen, 'track', screenOf(world.trackSign.position, 4.6), 'sale', html, 'track', 0);
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
    case 'tow': startTow(); break;
    case 'land': askLand(); break;
    case 'track': askTrack(); break;
  }
});

// ---------- ações ----------
function assignCustomer(id) {
  const r = L.assign(state, id);
  if (!r.ok) {
    sfx.play('error');
    if (r.reason === 'busy') toast(`${BUILDINGS[r.btype].name}: todos ocupados!`);
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
  const b = state.buildings.find((x) => x.id === bid);
  const v = world.buildViews.get(bid);
  sfx.play(b.build ? 'hammer' : 'tap');
  world.burst(v.g.position.clone().setY(1.4), '#ffd23d', 5, 3, 0.08, 3);
  const p = screenOf(v.g.position, 2.5);
  floatText({ x: p.x + (Math.random() - 0.5) * 50, y: p.y }, '⚡', '#ffd23d');
}

function collectJob(bid) {
  const v = world.buildViews.get(bid);
  const r = L.collect(state, bid);
  if (!r) return;
  const p = screenOf(v.g.position, 3);
  if (r.restored) {
    sfx.play('stars');
    world.confetti(v.g.position, 40);
    floatText(p, 'Carro restaurado!', '#a9f07e');
    floatText({ x: p.x, y: p.y + 34 }, `+${r.xp} XP`, '#a9f07e');
    world.carLeave(r.c.id, true, true);
    world.sync(state);
    toast('Novo carro na sua Garagem! 🚗');
  } else {
    sfx.play('cash');
    world.coins3d(v.g.position, 8);
    flyCoins(p, r.coins);
    floatText(p, `+${fmt(r.coins)}`, '#ffd23d');
    floatText({ x: p.x, y: p.y + 34 }, `+${r.xp} XP`, '#a9f07e');
    setTimeout(() => sfx.play('horn'), 250);
    world.carLeave(r.c.id, true, true);
  }
  if (r.friend) X.showFriend(ctx, r.friend);
  handleLevels(r.levels);
  afterChange();
}

function collectLoja(bid) {
  const r = L.collectLoja(state, bid);
  if (!r) return;
  const v = world.buildViews.get(bid);
  const p = screenOf(v.g.position, 3);
  sfx.play('cash');
  world.coins3d(v.g.position, 6);
  flyCoins(p, r.coins);
  floatText(p, `+${fmt(r.coins)}`, '#ffd23d');
  afterChange();
}

function unlockVisual(u) {
  if (u.kind === 'building') return `<img class="uimg" src="${thumbs.building(u.id)}" alt="">`;
  if (u.kind === 'color') return `<span class="sw" style="background:${u.hex}"></span>`;
  if (u.kind === 'neon') return `<span class="sw" style="background:${u.hex};box-shadow:0 0 8px ${u.hex}"></span>`;
  if (['wheels', 'spoiler', 'decal'].includes(u.kind)) return `<img class="uimg" src="${thumbs.part(u.kind, u.id)}" alt="">`;
  if (u.kind === 'car') return `<img class="uimg" src="${thumbs.car({ type: u.id, color: 'vermelho', wheels: 'padrao', spoiler: 'nenhum', neon: 'nenhum', decal: 'nenhum' })}" alt="">`;
  if (u.kind === 'job') return icon(u.icon);
  if (u.kind === 'land') return icon('terreno');
  return icon('corrida');
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
          <div class="hero">${icon('trofeu')}</div>
          <p class="bigtext ol">Nível ${lv}</p>
          <div class="reward" style="justify-content:center;font-size:18px">Prêmio: ${coin(40 * lv)}</div>
          ${un.length ? `<b>Novidades liberadas:</b><div class="unlocks">${un.map((u) => `<div class="unl">${unlockVisual(u)} ${u.name}</div>`).join('')}</div>` : ''}
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

// ---------- expansões ----------
function askLand() {
  const next = L.nextLand(state);
  if (!next) return;
  sfx.play('click');
  openModal((box) => {
    const ok = state.level >= next.lvl;
    box.innerHTML = head(`${icon('terreno', 'hico')} ${next.name}`, 'gold') + `
      <div class="mbody center">
        <div class="hero">${icon('terreno')}</div>
        <b>+${next.cols} colunas de terreno para construir mais serviços e decorar.</b>
        <div class="reqnote">Terrenos comprados: ${state.land.length}/${LAND.length}</div>
        <button class="btn yellow" id="buyLand" style="width:100%" ${!ok || state.coins < next.cost ? 'disabled' : ''}>${ok ? `Comprar ${coin(next.cost)}` : `Libera no nível ${next.lvl}`}</button>
      </div>`;
    box.querySelector('#buyLand').onclick = () => {
      const r = L.buyLand(state);
      if (!r.ok) { sfx.play('error'); return; }
      closeModal();
      world.setLot(state);
      world.sync(state);
      sfx.play('build');
      const c = { x: (state.lotW - next.cols / 2) * TILE, y: 0, z: (GRID_H * TILE) / 2 };
      world.panTo(world.target.clone().set(c.x - 4, 0, c.z - 1), world.zoomTarget);
      setTimeout(() => world.confetti(c, 60), 500);
      toast('Terreno comprado! Mais espaço para crescer 🏗️');
      afterChange();
    };
  });
}

function askTrack() {
  if (state.track) return;
  sfx.play('click');
  openModal((box) => {
    const ok = state.level >= TRACK.lvl;
    box.innerHTML = head(`${icon('corrida', 'hico')} Pista de Corrida`, 'gold') + `
      <div class="mbody center">
        <div class="hero">${icon('corrida')}</div>
        <b>Uma pista oval com arquibancada atrás da sua oficina.</b>
        <p class="reqnote">Restaure carros, prepare motor, turbo e pneus e dispute campeonatos por prêmios e troféus. Cada troféu dá +3 de fama.</p>
        <button class="btn yellow" id="buyTrack" style="width:100%" ${!ok || state.coins < TRACK.cost ? 'disabled' : ''}>${ok ? `Construir ${coin(TRACK.cost)}` : `Libera no nível ${TRACK.lvl}`}</button>
      </div>`;
    box.querySelector('#buyTrack').onclick = () => {
      const r = L.buyTrack(state);
      if (!r.ok) { sfx.play('error'); return; }
      closeModal();
      world.setLot(state);
      sfx.play('build');
      const c = { x: TRACK_PATH.cx, y: 0, z: TRACK_PATH.cz };
      world.panTo(world.target.clone().set(c.x, 0, c.z + 6), 0.8);
      setTimeout(() => { world.confetti(c, 80); sfx.play('win'); }, 700);
      toast('Pista pronta! Abra a Garagem para correr 🏁');
      afterChange();
    };
  });
}

// ---------- corrida ----------
function startRace(entry) {
  mode = 'race';
  setHudMode();
  race = new Race(ctx, entry, (res) => {
    race = null;
    mode = 'play';
    setHudMode();
    afterChange();
    const medal = ['🥇', '🥈', '🥉', '4º'][res.position - 1];
    if (res.position === 1) sfx.play('win'); else if (res.position === 4) sfx.play('lose');
    openModal((box) => {
      box.dataset.sticky = '1';
      box.innerHTML = head(res.position === 1 ? 'VITÓRIA!' : `${res.position}º LUGAR`, res.position === 1 ? 'gold' : 'pink', false) + `
        <div class="mbody center">
          <div class="hero">${res.position === 1 ? icon('trofeu') : medal}</div>
          <b>${res.tier.name}</b>
          <ol class="podium">${res.order.map((n, i) => `<li class="${n === 'Você' ? 'me' : ''}"><b>${i + 1}º</b> ${n}</li>`).join('')}</ol>
          <div class="statline" style="width:100%"><span>Prêmio</span><b>${coin(res.prize)}</b></div>
          <div class="statline" style="width:100%"><span>Experiência</span><b class="up">+${res.xp} XP</b></div>
          ${res.trophy ? '<div class="statline" style="width:100%"><span>Troféu (+3 de fama)</span><b class="up">🏆</b></div>' : ''}
          ${res.crate ? `<div class="statline" style="width:100%"><span>${CRATES[res.crate].name}</span><b class="up">🎁</b></div>` : ''}
          <div class="row" style="width:100%"><button class="btn green" id="raceOk">${res.prize ? `RECEBER ${coin(res.prize)}` : 'OK'}</button></div>
        </div>`;
      box.querySelector('#raceOk').onclick = () => {
        const rect = box.querySelector('#raceOk').getBoundingClientRect();
        closeModal();
        if (res.prize) { sfx.play('cash'); flyCoins({ x: rect.left + rect.width / 2, y: rect.top }, res.prize); }
        handleLevels(res.levels);
      };
    }, { priority: true });
  });
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

function optVisual(kind, p) {
  if (kind === 'color') return `<span class="swatch" style="background:${p.metal ? `radial-gradient(circle at 35% 30%, #fff 0 12%, ${p.hex} 40%, #555 120%)` : p.hex}"></span>`;
  if (kind === 'neon' && p.hex) return `<img class="pimg" src="${thumbs.part(kind, p.id)}" alt="">`;
  return `<img class="pimg" src="${thumbs.part(kind, p.id)}" alt="">`;
}

function renderCustom() {
  const b = state.buildings.find((x) => x.id === custom.bid);
  if (!b || !b.job) { closeCustom(); return; }
  const c = b.job.c, sp = custom.spec;
  const ev = L.evaluateCustom(state, b, sp);
  const reqs = c.job.reqs.map((r) => {
    const p = part(r.part, r.value);
    const ok = sp[r.part] === r.value;
    const vis = r.part === 'color' || r.part === 'neon' ? `<span class="sw" style="background:${p.hex}"></span>` : `<img class="mini" src="${thumbs.part(r.part, r.value)}" alt="">`;
    return `<div class="req ${ok ? 'ok' : ''}"><span class="chk">${ok ? '✔' : ''}</span>${PART_LABEL[r.part]}: ${vis}<b>${p.name}</b></div>`;
  }).join('');
  $('#reqCard').innerHTML = `
    <h3><span>${c.vip ? `${icon('vip', 'hico')} Cliente VIP` : `${icon('face-ok', 'hico')} Pedido do cliente`}</span><span class="reward">${coin(c.job.pay)}${ev.tip ? ` <span style="color:#2f8f1c">+${fmt(ev.tip)} gorjeta</span>` : ''}</span></h3>
    <div class="reqs">${reqs}</div>
    <div class="reqnote">Peças extras que o cliente não pediu rendem gorjeta! ✨</div>`;
  const wanted = new Map(c.job.reqs.map((r) => [r.part, r.value]));
  $('#tabs').innerHTML = PART_TABS.map((t) => `<button class="tab ${custom.tab === t.id ? 'on' : ''}" data-tab="${t.id}">${icon(t.icon)}<span>${t.name}</span>${wanted.has(t.id) ? '<b class="wantdot"></b>' : ''}</button>`).join('');
  $('#options').innerHTML = PARTS[custom.tab].map((p) => {
    const locked = !L.partAvailable(state, custom.tab, p.id);
    const on = sp[custom.tab] === p.id;
    const want = wanted.get(custom.tab) === p.id;
    const rare = p.rare ? ` rare r-${p.rare}` : '';
    return `<button class="opt ${on ? 'on' : ''} ${want ? 'want' : ''} ${locked ? 'locked' : ''}${rare}" data-opt="${p.id}">${optVisual(custom.tab, p)}<span>${p.name}</span>${locked ? `<span class="lock">${p.rare ? `🎁 ${RARITY[p.rare].name}` : `🔒 Nv ${p.lvl}`}</span>` : p.rare ? `<span class="lock rlabel">${RARITY[p.rare].name}</span>` : ''}</button>`;
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
  if (!L.partAvailable(state, custom.tab, p.id)) { sfx.play('error'); toast(p.rare ? `🎁 Peça ${RARITY[p.rare].name}: ganhe em caixas de prêmio` : `🔒 Libera no nível ${p.lvl}`); return; }
  if (custom.spec[custom.tab] === p.id) return;
  custom.spec[custom.tab] = p.id;
  world.replaceCar(custom.cid, custom.spec);
  const pos = world.buildViews.get(custom.bid).g.position.clone().setY(1);
  world.burst(pos, p.hex || '#ffffff', 18, 4, 0.14, 4);
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
    box.innerHTML = head(r.stars === 3 ? (r.vip ? 'VIP SATISFEITO!' : 'ENTREGA PERFEITA!') : 'ENTREGA FEITA', r.stars === 3 ? 'gold' : 'pink', false) + `
      <div class="mbody center">
        <img class="thumb big" src="${thumbs.car(r.spec)}" alt="">
        <div class="stars">${[1, 2, 3].map((i) => `<i class="${i <= r.stars ? '' : 'off'}">★</i>`).join('')}</div>
        <b style="font-size:18px">${msg}</b>
        <div class="statline" style="width:100%"><span>Serviço (${r.met}/${r.total} pedidos)</span><b>${coin(r.base)}</b></div>
        ${r.tip ? `<div class="statline" style="width:100%"><span>Gorjeta${r.extras ? ` (${r.extras} extra${r.extras > 1 ? 's' : ''})` : ''}</span><b class="up">+${coin(r.tip)}</b></div>` : ''}
        <div class="statline" style="width:100%"><span>Experiência</span><b class="up">+${r.xp} XP</b></div>
        <div class="row" style="width:100%"><button class="btn blue" id="photoDeliver">${icon('foto', 'bico')} Foto</button><button class="btn green" id="okDeliver">RECEBER ${coin(r.coins)}</button></div>
      </div>`;
    ctx.lastCustom = { ...r.spec };
    box.querySelector('#photoDeliver').onclick = () => X.photoPreview(ctx, r.spec, `Carro de cliente${r.c.char ? ': ' + X.charById(r.c.char).name : ''}`);
    box.querySelector('#okDeliver').onclick = () => {
      if (r.friend) setTimeout(() => X.showFriend(ctx, r.friend), 600);
      closeModal();
      const p = screenOf(pos, 2);
      flyCoins(p, r.coins);
      world.coins3d(pos, 10);
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
  for (let z = 0; z <= GRID_H - d.d; z++) for (let x = 0; x <= state.lotW - d.w; x++) {
    if (!L.canPlace(state, type, x, z, moveId)) continue;
    const dist = (x - cx) ** 2 + (z - cz) ** 2;
    if (dist < bd) { bd = dist; best = { x, z }; }
  }
  return best;
}

function startPlacement(type, moveId = null) {
  const spot = moveId ? (() => { const b = state.buildings.find((q) => q.id === moveId); return { x: b.x, z: b.z }; })() : suggestSpot(type);
  if (!spot) { sfx.play('error'); toast('Sem espaço livre: compre o terreno vizinho!'); return; }
  mode = 'place';
  placing = { type, moveId, x: spot.x, z: spot.z };
  if (moveId) world.buildViews.get(moveId).g.visible = false;
  world.setGhost(state, type, spot.x, spot.z, moveId);
  const d = BUILDINGS[type];
  $('#buildLabel').innerHTML = moveId ? `Mover ${d.name}` : `${d.name} · ${coin(L.costOf(state, type))}`;
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
  world.sync(state, moveId);
  if (newId) {
    const v = world.buildViews.get(newId);
    if (v) world.burst(v.g.position, '#e9dcc4', 16, 3, 0.25, 1);
  }
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
    let grid = '';
    if (tab === 'expansoes') {
      const next = L.nextLand(state);
      const cards = [];
      if (next) {
        const ok = state.level >= next.lvl;
        cards.push(`<div class="card ${ok ? '' : 'locked'}"><div class="big">${icon('terreno')}</div><h4>${next.name}</h4><p>+${next.cols} colunas de terreno para crescer.</p><span class="meta">${state.land.length}/${LAND.length} comprados</span><button class="btn ${ok ? 'yellow' : 'gray'}" data-exp="land" ${!ok || state.coins < next.cost ? 'disabled' : ''}>${ok ? coin(next.cost) : `🔒 Nível ${next.lvl}`}</button></div>`);
      } else cards.push(`<div class="card"><div class="big">${icon('terreno')}</div><h4>Terrenos</h4><p>Você já comprou todos os terrenos!</p></div>`);
      const okT = state.level >= TRACK.lvl;
      cards.push(`<div class="card ${okT ? '' : 'locked'}"><div class="big">${icon('corrida')}</div><h4>Pista de Corrida</h4><p>Corra com os carros da sua coleção por prêmios e troféus.</p><button class="btn ${state.track ? 'gray' : okT ? 'yellow' : 'gray'}" data-exp="track" ${state.track || !okT || state.coins < TRACK.cost ? 'disabled' : ''}>${state.track ? 'Construída ✔' : okT ? coin(TRACK.cost) : `🔒 Nível ${TRACK.lvl}`}</button></div>`);
      grid = cards.join('');
    } else {
      const items = Object.entries(BUILDINGS).filter(([, d]) => d.cat === tab);
      grid = items.map(([id, d]) => {
        const can = L.canBuy(state, id);
        const cnt = L.count(state, id), lim = limitAt(id, state.level);
        let btn;
        if (can.reason === 'level') btn = `<button class="btn gray" disabled>🔒 Nível ${can.need}</button>`;
        else if (can.reason === 'limit') btn = `<button class="btn gray" disabled>${can.need ? `Mais no nível ${can.need}` : 'Máximo'}</button>`;
        else btn = `<button class="btn yellow" data-buy="${id}" ${can.reason === 'coins' ? 'disabled' : ''}>${coin(L.costOf(state, id))}</button>`;
        const meta = d.decor ? `<span class="meta">⭐ +${d.fame} de fama</span>` : `<span class="meta">${cnt}/${lim || '—'} construídos</span>`;
        return `<div class="card ${can.reason === 'level' ? 'locked' : ''}"><img class="thumb" src="${thumbs.building(id)}" alt=""><h4>${d.name}</h4>${d.desc ? `<p>${d.desc}</p>` : '<p></p>'}${meta}${btn}</div>`;
      }).join('');
    }
    box.innerHTML = head(`${icon('construir', 'hico')} Construir`) + `
      <div class="mbody">
        <div class="mtabs">
          <button class="tab ${tab === 'servicos' ? 'on' : ''}" data-shoptab="servicos">${icon('revisao')} Serviços</button>
          <button class="tab ${tab === 'decor' ? 'on' : ''}" data-shoptab="decor">${icon('polimento')} Decoração</button>
          <button class="tab ${tab === 'expansoes' ? 'on' : ''}" data-shoptab="expansoes">${icon('terreno')} Expansões</button>
        </div>
        <div class="grid">${grid}</div>
        <div class="reqnote" style="text-align:center">⭐ Fama traz clientes mais rápido e aumenta as gorjetas.</div>
      </div>`;
    box.querySelectorAll('[data-shoptab]').forEach((b) => b.onclick = () => { sfx.play('click'); tab = b.dataset.shoptab; rerender(render); });
    box.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { sfx.play('click'); closeModal(); startPlacement(b.dataset.buy); });
    box.querySelectorAll('[data-exp]').forEach((b) => b.onclick = () => { closeModal(); b.dataset.exp === 'land' ? askLand() : askTrack(); });
  };
  openModal(render, { wide: true });
}

// ---------- informações da construção ----------
function openInfo(bid) {
  const render = (box) => {
    const b = state.buildings.find((q) => q.id === bid);
    if (!b) { closeModal(); return; }
    const d = BUILDINGS[b.type];
    const lines = [];
    const nx = b.level < BUILDING_MAX_LEVEL && d.upCost;
    if (d.speed) lines.push(['Velocidade', `${d.speed[b.level - 1]}x`, nx ? `${d.speed[b.level]}x` : null]);
    if (d.tip) lines.push(['Gorjeta extra', `+${Math.round(d.tip[b.level - 1] * 100)}%`, nx ? `+${Math.round(d.tip[b.level] * 100)}%` : null]);
    if (d.rate) {
      lines.push(['Renda', `${Math.round(d.rate[b.level - 1] * 60)}/min`, nx ? `${Math.round(d.rate[b.level] * 60)}/min` : null]);
      lines.push(['Capacidade', fmt(d.cap[b.level - 1]), nx ? fmt(d.cap[b.level]) : null]);
    }
    if (d.decor) lines.push(['Fama', `+${d.fame}`, null]);
    if (b.type === 'showroom') lines.push(['Carros expostos', `${Math.min(3, state.garage.length)}/3`, null]);
    if (d.fixed) {
      const s = state.stats;
      lines.push(['Nível da oficina', state.level, null], ['Fama total', `⭐ ${L.fame(state)}`, null], ['Clientes atendidos', fmt(s.delivered), null], ['Carros personalizados', fmt(s.customs), null], ['Clientes VIP', fmt(s.vip), null], ['Carros restaurados', fmt(s.restored), null], ['Vitórias / corridas', `${s.wins} / ${s.races}`, null], ['Moedas ganhas', coin(s.earned), null]);
    }
    const cost = L.upgradeCost(b);
    const stars = d.upCost ? `<div class="lvstars">${'★'.repeat(b.level)}<span style="color:#c3cbd8">${'★'.repeat(BUILDING_MAX_LEVEL - b.level)}</span></div>` : '';
    const busy = b.build || b.job;
    box.innerHTML = head(d.name) + `
      <div class="mbody">
        <div class="infohead"><img class="thumb" src="${thumbs.building(b.type)}" alt="">
          <div>${stars}<b>Nível ${b.level}${b.level >= BUILDING_MAX_LEVEL ? ' (máximo)' : ''}</b>${d.desc ? `<div class="reqnote">${d.desc}</div>` : ''}</div></div>
        ${lines.map(([k, v, n]) => `<div class="statline"><span>${k}</span><b>${v}${n ? ` <span class="up">→ ${n}</span>` : ''}</b></div>`).join('')}
        <div class="row">
          ${b.type === 'restauracao' || b.type === 'showroom' ? `<button class="btn blue" data-garage>${icon('garagem', 'bico')} Garagem</button>` : ''}
          ${!d.fixed && !busy ? '<button class="btn blue" data-move>↔ Mover</button>' : ''}
          ${cost != null ? `<button class="btn green" data-up ${state.coins < cost || busy ? 'disabled' : ''}>${busy ? 'Ocupado' : `Melhorar ${coin(cost)}`}</button>` : ''}
        </div>
      </div>`;
    box.querySelector('[data-garage]')?.addEventListener('click', () => { closeModal(); openGarage(ctx); });
    box.querySelector('[data-move]')?.addEventListener('click', () => { sfx.play('click'); closeModal(); startPlacement(b.type, b.id); });
    box.querySelector('[data-up]')?.addEventListener('click', () => {
      const r = L.upgrade(state, b.id);
      if (!r.ok) { sfx.play('error'); return; }
      sfx.play('build');
      world.sync(state);
      afterChange();
      closeModal();
    });
  };
  openModal(render);
}

// ---------- missões ----------
function openMissions() {
  const render = (box) => {
    box.innerHTML = head(`${icon('missoes', 'hico')} Missões`) + `
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
$('#btnGarage').addEventListener('click', () => { sfx.play('click'); openGarage(ctx); });
$('#btnMenu').addEventListener('click', () => { sfx.play('click'); X.openMenu(ctx, { openSocial: () => openSocial(ctx) }); });
$('#eventPill').addEventListener('click', () => { sfx.play('click'); X.openEvent(ctx); });
$('#visitBack').addEventListener('click', () => { sfx.play('click'); exitVisit(); });
const setSoundIcons = () => {
  $('#btnMute').innerHTML = icon(sfx.muted ? 'mudo' : 'som');
  $('#btnMusic').innerHTML = icon('musica');
  $('#btnMusic').classList.toggle('off', !sfx.musicOn);
};
$('#btnMute').addEventListener('click', () => { sfx.toggle(); setSoundIcons(); });
$('#btnMusic').addEventListener('click', () => { sfx.toggleMusic(); setSoundIcons(); toast(sfx.musicOn ? '🎵 Música ligada' : 'Música desligada'); });
setSoundIcons();
$('#famePill').addEventListener('click', () => toast('⭐ Fama: decore, melhore e ganhe troféus para atrair mais clientes'));

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
    if (pinch && mode !== 'custom' && mode !== 'race') world.zoomBy(d / pinch);
    pinch = d;
    moved = 99;
    return;
  }
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  moved += Math.hypot(dx, dy);
  if (moved > 8 && mode !== 'custom' && mode !== 'race') {
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
canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (mode !== 'custom' && mode !== 'race') world.zoomBy(Math.pow(1.0018, -e.deltaY)); }, { passive: false });

function onTap(x, y) {
  if (mode === 'custom' || mode === 'race' || mode === 'tow' || mode === 'visit') return;
  if (mode === 'place') {
    const t = world.tileAt(x, y, placing.type);
    if (!t) return;
    if (t.x === placing.x && t.z === placing.z) confirmPlacement();
    else movePlacement(t.x, t.z);
    return;
  }
  const hit = world.pick(x, y);
  if (!hit) return;
  if (hit.kind === 'land') return askLand();
  if (hit.kind === 'track') return askTrack();
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
  if (b.build) return speedUp(b.id);
  if (b.type === 'guincho' && state.towCall) return startTow();
  if (b.job) {
    if (b.job.state === 'work') return speedUp(b.id);
    if (b.job.state === 'done') return collectJob(b.id);
    if (b.job.state === 'custom') return openCustom(b.id);
  }
  if (b.type === 'loja' && b.stored >= 1) return collectLoja(b.id);
  sfx.play('click');
  if (b.type === 'restauracao' && state.projects.length) return openGarage(ctx);
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

// ---------- guincho ----------
let tow = null;
function startTow() {
  if (mode !== 'play' || modalOpen) return;
  const call = L.startTow(state);
  if (!call) return;
  sfx.play('click');
  mode = 'tow';
  setHudMode();
  tow = new TowRun(ctx, call, (res) => {
    tow = null;
    mode = 'play';
    setHudMode();
    if (res.customer) world.carArrive(res.customer);
    afterChange();
    X.towResult(ctx, res);
  });
}

// ---------- visita a outra oficina ----------
function enterVisit(p, name) {
  mode = 'visit';
  setHudMode();
  world.enterVisit(p);
  $('#visitName').textContent = name;
  $('#visitInfo').innerHTML = `Nível ${p.level || 1} · ⭐ ${p.fame || 0} · 🏆 ${p.trophies || 0}`;
}
function exitVisit() {
  world.exitVisit();
  mode = 'play';
  setHudMode();
}

function loadState(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(L.migrate(s))); } catch {}
  mode = 'race'; // impede o save automático de sobrescrever antes de recarregar
  location.reload();
}

// ---------- loop ----------
function handleEvents() {
  for (const e of events) {
    if (e.type === 'arrive') {
      world.carArrive(e.c);
      if (mode === 'play') sfx.play('car');
      if (e.c.vip) { sfx.play('vip'); toast('👑 Cliente VIP chegou! Paga muito mais'); }
    } else if (e.type === 'leave') {
      const v = world.carViews.get(e.c.id);
      if (v) { const p = screenOf(v.g.position, 2.5); floatText(p, '😠', '#fff'); }
      sfx.play('angry');
      world.carLeave(e.c.id, false, false);
    } else if (e.type === 'done') {
      sfx.play('pop');
    } else if (e.type === 'tow_call') {
      sfx.play('phone');
      toast('📞 Chamado de guincho! Toque na Base do Guincho');
    } else if (e.type === 'tow_miss') {
      toast('O chamado de guincho foi para outra empresa 😕');
    } else if (e.type === 'rain_start') {
      toast('🌧️ Começou a chover! Vem muito carro sujo para o lava-jato');
    } else if (e.type === 'built') {
      sfx.play('built');
      world.sync(state);
      const d = BUILDINGS[e.b.type];
      if (!d.decor) toast(`${d.name} ${e.b.level > 1 ? `nível ${e.b.level}` : ''} pronto! ✔`);
      afterChange();
    }
  }
  events.length = 0;
}

let last = performance.now(), tipT = 0, lastNight = -1;
function frame(now) {
  requestAnimationFrame(frame);
  try { step(now); } catch (err) { console.error(err); }
}

function step(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  L.tick(state, dt, events);
  if (events.length) handleEvents();
  if (race) race.update(dt);
  if (tow) tow.update(dt);
  world.update(dt, state);
  sfx.setRain(world.rainK);
  $('#rainFx').classList.toggle('on', !!state.weather?.rain && mode !== 'visit');
  X.tickOnline(ctx, dt);
  if (Math.abs(world.night - lastNight) > 0.03) { lastNight = world.night; sfx.setNight(world.night); }
  updateBubbles();
  updateHud(dt);
  tipT -= dt;
  if (tipT <= 0) { tipT = 0.3; updateTip(); }
  saveT -= dt;
  if (saveT <= 0) { saveT = 4; save(); }
}

addEventListener('visibilitychange', () => { if (document.hidden) save(); });
addEventListener('pagehide', save);

setHudMode();
requestAnimationFrame(frame);
$('#loading').classList.add('out');
window.__started = true;

// Boas-vindas: tempo fora e presente diário.
if (offline && offline.seconds > 90 && (offline.loja > 0 || offline.jobs > 0 || offline.builds > 0)) {
  openModal((box) => {
    const h = Math.floor(offline.seconds / 3600), m = Math.floor((offline.seconds % 3600) / 60);
    box.innerHTML = head('Bem-vindo de volta!') + `
      <div class="mbody center">
        <div class="hero">${icon('revisao')}</div>
        <b>Você ficou fora ${h ? `${h}h ` : ''}${m}min. Sua equipe continuou trabalhando:</b>
        ${offline.jobs ? `<div class="statline" style="width:100%"><span>Serviços prontos para entregar</span><b>${offline.jobs}</b></div>` : ''}
        ${offline.builds ? `<div class="statline" style="width:100%"><span>Obras concluídas</span><b>${offline.builds}</b></div>` : ''}
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
      closeModal();
      if (r) { sfx.play('cash'); flyCoins({ x: rect.left + rect.width / 2, y: rect.top }, r.coins); }
      afterChange();
    };
  });
}

// Depuração no console.
X.afterBoot(ctx);
window.oficina = {
  get state() { return state; }, world, L, ctx, startTow, enterVisit, exitVisit, assignCustomer, openCustom, collectJob, speedUp, openGarage: () => openGarage(ctx), startRace,
  reset() { localStorage.removeItem(SAVE_KEY); location.reload(); },
  advance(sec) { step(last + sec * 1000); }, // usado nos testes automáticos
};
