import { LocalGame } from './localGame.js';
import { OnlineGame } from './onlineGame.js';
import { Renderer, colorOf } from './render.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { SKINS, loadProfile, saveProfile, recordLife, accountLevel, accountXpFor } from './profile.js';
import { UPGRADE_BY_ID } from '../shared/upgrades.js';
import { POWERUPS } from '../shared/constants.js';
import { leaderboard } from '../shared/sim.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const canvas = $('#game');
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const sfx = new Sfx();
const profile = loadProfile();
const practice = new LocalGame({ bots: 15 });
let game = practice;
let mode = 'practice'; // practice | online
let online = null;
const ONLINE_OK = !!document.querySelector('meta[name="nebula-online"]') && 'WebSocket' in window;
if (ONLINE_OK) $('#onlineBtn').classList.remove('hidden');
else $('#practiceBtn').classList.add('primary');

let state = 'menu'; // menu | playing | dead
let deathTimer = 0;
let hudTimer = 0;
let lastRank = 99;
let spectateId = null;
let lastChoicesKey = '';

// ---------- Menu ----------
function skinColor(id) {
  return (SKINS.find((s) => s.id === id) || SKINS[0]).color;
}

function renderMenu() {
  const lvl = accountLevel(profile.totalXp);
  const cur = accountXpFor(lvl), next = accountXpFor(lvl + 1);
  const pct = ((profile.totalXp - cur) / (next - cur)) * 100;
  const nextSkin = SKINS.find((s) => s.lvl > lvl);
  $('#account').innerHTML = `
    <div>Conta nível <b>${lvl}</b> · ${profile.totalXp - cur}/${next - cur} XP</div>
    <div class="bar"><div style="width:${pct.toFixed(1)}%"></div></div>
    ${nextSkin ? `<div>Próxima cor: <b>${nextSkin.name}</b> no nível ${nextSkin.lvl}</div>` : '<div>Todas as cores desbloqueadas! 🌈</div>'}`;
  $('#skins').innerHTML = SKINS.map((s) => {
    const locked = s.lvl > lvl;
    const bg = s.color === 'rainbow' ? '' : `background:${s.color}`;
    return `<button class="skin ${s.color === 'rainbow' ? 'rainbow' : ''} ${locked ? 'locked' : ''} ${profile.skin === s.id ? 'sel' : ''}" style="${bg}" data-id="${s.id}" data-lvl="${locked ? 'Nv' + s.lvl : ''}" title="${s.name}${locked ? ' — nível ' + s.lvl : ''}"></button>`;
  }).join('');
  $('#records').innerHTML = profile.games
    ? `<div>Recorde <b>${profile.bestScore}</b></div><div>Mais abates <b>${profile.bestKills}</b></div><div>Nível máx. <b>${profile.bestLevel}</b></div><div>Partidas <b>${profile.games}</b></div>`
    : '';
  $('#nameInput').value = profile.name;
}

$('#skins').addEventListener('click', (e) => {
  const b = e.target.closest('.skin');
  if (!b || b.classList.contains('locked')) return;
  profile.skin = b.dataset.id;
  saveProfile(profile);
  renderMenu();
});

async function startGame(m = mode) {
  if (startGame.busy) return;
  if (m === 'online') {
    if (!online || online.status !== 'open') {
      startGame.busy = true;
      setMenuMsg('Conectando ao servidor…');
      online?.close();
      online = new OnlineGame(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
      online.onStatus = (st) => { if (st === 'closed' && game === online) connectionLost(); };
      try {
        await online.connect();
        setMenuMsg('');
      } catch {
        startGame.busy = false;
        setMenuMsg('Não foi possível conectar ao servidor online. Tente de novo ou jogue o treino.');
        return;
      } finally { startGame.busy = false; }
    }
    game = online;
  } else {
    game = practice;
  }
  mode = m;
  const name = ($('#nameInput').value.trim() || profile.name || 'Jogador').slice(0, 16);
  profile.name = name;
  saveProfile(profile);
  game.join(name, skinColor(profile.skin));
  state = 'playing';
  lastRank = 99;
  lastChoicesKey = '';
  $('#menu').classList.add('hidden');
  $('#death').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#killfeed').innerHTML = '';
  $('#upgrades').innerHTML = '';
  $('#announce').innerHTML = '';
  showHint();
  canvas.focus();
}

function showHint() {
  const h = $('#hint');
  h.textContent = input.isTouch
    ? 'Esquerda: mover · Direita: mirar e atirar · Colete os cristais para evoluir'
    : 'Colete cristais ✦ para subir de nível · Segure o clique para atirar · Espaço = dash';
  h.style.opacity = 1;
  clearTimeout(showHint.t);
  showHint.t = setTimeout(() => (h.style.opacity = 0), profile.games < 2 ? 7000 : 3500);
}

$('#onlineBtn').addEventListener('click', () => startGame('online'));
$('#practiceBtn').addEventListener('click', () => startGame('practice'));
function setMenuMsg(t) { $('#menuMsg').textContent = t; $('#menuMsg').classList.toggle('hidden', !t); }
function connectionLost() {
  game = practice;
  state = 'menu';
  $('#death').classList.add('hidden');
  $('#hud').classList.add('hidden');
  renderMenu();
  $('#menu').classList.remove('hidden');
  setMenuMsg('A conexão com o servidor caiu. Clique em Jogar online para entrar de novo.');
}
$('#nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(ONLINE_OK ? 'online' : 'practice'); });
$('#againBtn').addEventListener('click', () => startGame());
$('#menuBtn').addEventListener('click', () => {
  state = 'menu';
  $('#death').classList.add('hidden');
  $('#hud').classList.add('hidden');
  renderMenu();
  $('#menu').classList.remove('hidden');
});
$('#muteBtn').addEventListener('click', () => updateMute(sfx.toggle()));
$('#dashBtn').addEventListener('touchstart', (e) => { input.dashQueued = true; e.preventDefault(); }, { passive: false });
function updateMute(m) { $('#muteBtn').textContent = m ? '🔇' : '🔊'; }
updateMute(sfx.muted);

input.onKey = (k) => {
  if (k === 'm') updateMute(sfx.toggle());
  if (state === 'playing' && ['1', '2', '3'].includes(k)) pickUpgrade(Number(k) - 1);
  if (state === 'dead' && k === 'enter' && deathTimer <= 0) startGame();
};

// ---------- Melhorias ----------
function pickUpgrade(i) {
  if (game.chooseUpgrade(i)) sfx.play('upgrade');
}
$('#upgrades').addEventListener('pointerdown', (e) => {
  const c = e.target.closest('.card');
  if (c) { pickUpgrade(Number(c.dataset.i)); e.stopPropagation(); }
});

function renderUpgrades(me) {
  const key = me && me.alive && me.choices ? me.choices.join(',') + '|' + me.pending : '';
  if (key === lastChoicesKey) return;
  lastChoicesKey = key;
  const box = $('#upgrades');
  $('#hint').classList.toggle('hidden', !!key);
  if (!key) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="uptitle">SUBIU DE NÍVEL! ESCOLHA ${me.pending > 1 ? `(${me.pending})` : ''}</div>` +
    me.choices.map((id, i) => {
      const u = UPGRADE_BY_ID[id];
      const lv = me.upgrades[id] || 0;
      return `<div class="card" data-i="${i}"><div class="ic">${u.icon}</div><div class="t">${u.name}</div><div class="d">${u.desc}</div><div class="k">${input.isTouch ? '' : `[${i + 1}] · `}Nv ${lv} → ${lv + 1}</div></div>`;
    }).join('');
}

// ---------- Anúncios / feed ----------
function announce(text, sub = '', color = '#fff') {
  const a = $('#announce');
  a.innerHTML = `<div class="a" style="color:${color}">${esc(text)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</div>`;
}

function feed(e, me) {
  const box = $('#killfeed');
  const div = document.createElement('div');
  const mine = me && (e.killer === me.id || e.victim === me.id);
  div.className = 'kf' + (mine ? ' me' : '');
  const kc = e.killerColor ? colorOf(e.killerColor, 0) : '#aaa';
  const vc = colorOf(e.victimColor, 0);
  div.innerHTML = e.killerName
    ? `<b style="color:${kc}">${esc(e.killerName)}</b> ⚔ <b style="color:${vc}">${esc(e.victimName)}</b>${e.king ? ' 👑' : ''}`
    : `<b style="color:${vc}">${esc(e.victimName)}</b> caiu`;
  box.prepend(div);
  while (box.children.length > 5) box.lastChild.remove();
  setTimeout(() => div.remove(), 6000);
}

const STREAKS = { 3: ['EM CHAMAS', '🔥 3 abates seguidos'], 5: ['IMPARÁVEL', '5 abates seguidos'], 8: ['LENDÁRIO', '8 abates seguidos'], 12: ['DEUS DA ARENA', '12 abates seguidos'] };
const MULTI = { 2: 'ABATE DUPLO', 3: 'ABATE TRIPLO', 4: 'MASSACRE' };

function handleEvents(events) {
  const w = game.world;
  const me = game.me;
  const myId = me ? me.id : null;
  renderer.handleEvents(events, w, state === 'playing' ? myId : null);
  if (state !== 'playing' || !me) return;

  for (const e of events) {
    switch (e.type) {
      case 'shot':
        if (e.id === myId) sfx.play('shot');
        else sfx.play('enemyShot', proximity(e));
        break;
      case 'hit':
        if (e.target === myId) sfx.play('hurt');
        else if (e.source === myId) sfx.play('hit');
        break;
      case 'pickup': if (e.id === myId) sfx.play('pickup'); break;
      case 'levelup': if (e.id === myId) sfx.play('levelup'); break;
      case 'dash': if (e.id === myId) sfx.play('dash'); break;
      case 'block': if (e.target === myId) sfx.play('block'); break;
      case 'power': if (e.id === myId) sfx.play('power'); break;
      case 'king':
        if (e.id === myId) { announce('VOCÊ É O REI', '👑 todos estão atrás de você', '#ffd35a'); sfx.play('king'); }
        break;
      case 'kill':
        feed(e, me);
        if (e.killer === myId) {
          sfx.play('kill');
          if (e.king) announce('REI DERRUBADO!', `+${e.bonus} XP`, '#ffd35a');
          else if (MULTI[Math.min(4, e.multi)] && e.multi >= 2) announce(MULTI[Math.min(4, e.multi)], `+${e.bonus} XP`, '#ff5a7a');
          else if (STREAKS[e.streak]) announce(STREAKS[e.streak][0], STREAKS[e.streak][1], '#ff9b3d');
          else if (me.kills === 1) announce('PRIMEIRO ABATE', `+${e.bonus} XP`, '#36e2ff');
        }
        if (e.victim === myId) onDeath();
        break;
    }
  }
}

function proximity(e) {
  const me = game.me;
  if (!me) return 0;
  const d = Math.hypot(me.x - e.x, me.y - e.y);
  return Math.max(0, 1 - d / 900);
}

// ---------- Morte ----------
function onDeath() {
  sfx.play('death');
  state = 'dead';
  deathTimer = 1.3;
  spectateId = game.me.lastLife.killerId;
  const life = game.me.lastLife;
  const res = recordLife(profile, life);
  const mm = Math.floor(life.time / 60), ss = String(Math.floor(life.time % 60)).padStart(2, '0');
  $('#deathBy').innerHTML = life.killerName ? `por <b>${esc(life.killerName)}</b>` : '';
  $('#deathStats').innerHTML = [
    [life.score, 'Pontos'], [life.kills, 'Abates'], [life.level, 'Nível'],
    [`${mm}:${ss}`, 'Tempo'], [life.bestStreak, 'Sequência'], [life.damage, 'Dano'],
  ].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
  const lvl = accountLevel(profile.totalXp), cur = accountXpFor(lvl), next = accountXpFor(lvl + 1);
  const pct = ((profile.totalXp - cur) / (next - cur)) * 100;
  $('#deathReward').innerHTML = `
    <div><span class="badge">+${res.earned} XP de conta</span> ${res.afterLvl > res.beforeLvl ? `<span class="badge">⬆ Conta nível ${res.afterLvl}!</span>` : ''}</div>
    <div class="bar"><div style="width:${pct.toFixed(1)}%"></div></div>
    ${res.records.length ? `<div>🏅 Novo recorde de ${res.records.join(', ')}!</div>` : `<div style="color:var(--muted)">Recorde: ${profile.bestScore} pontos</div>`}
    ${res.unlocked.map((s) => `<div>🎨 Nova cor desbloqueada: <b>${s.name}</b></div>`).join('')}`;
  setTimeout(() => {
    if (state !== 'dead') return;
    $('#hud').classList.add('hidden');
    $('#death').classList.remove('hidden');
  }, 1300);
}

// ---------- HUD ----------
function updateHud(me) {
  const w = game.world;
  const lb = leaderboard(w, 10);
  const all = leaderboard(w, 999);
  const rank = all.findIndex((p) => p.id === me.id) + 1;
  $('#leaderboard ol').innerHTML = lb.map((p, i) =>
    `<li class="${p.id === me.id ? 'me' : ''}"><span class="n">${i + 1}</span><span class="dot" style="background:${colorOf(p.color, w.t)}"></span><span class="nm">${p.id === w.kingId ? '👑 ' : ''}${esc(p.name)}</span><span class="sc">${Math.floor(p.score)}</span></li>`).join('');
  $('#myrank').innerHTML = rank > 10 ? `Você: #${rank} · ${Math.floor(me.score)}` : `${all.length} na arena`;
  if (rank && rank < lastRank && lastRank !== 99) {
    if (rank === 1) announce('TOPO DO RANKING', '', '#ffd35a');
    else if (rank <= 3 && lastRank > 3) announce(`TOP ${rank}!`, 'continue subindo', '#36e2ff');
  }
  if (rank) lastRank = rank;

  $('#stats').innerHTML = `${mode === 'online' ? `<div>🟢 <span>online</span></div>` : ''}<div>⚔ ${me.kills} <span>abates</span></div><div>✦ ${Math.floor(me.score)} <span>pontos</span></div>${me.streak >= 2 ? `<div>🔥 ${me.streak}</div>` : ''}`;
  $('#buffs').innerHTML = Object.entries(me.buffs).filter(([, v]) => v > 0)
    .map(([k, v]) => `<div class="buff" style="color:${POWERUPS[k].color}">${POWERUPS[k].label} ${v.toFixed(1)}s</div>`).join('');
}

function updateBars(me) {
  const hp = Math.max(0, me.hp / me.maxHp);
  $('#hpfill').style.width = (hp * 100).toFixed(1) + '%';
  $('#hpfill').style.background = hp > 0.5 ? '' : hp > 0.25 ? 'linear-gradient(90deg,#d9a52b,#ffd35a)' : 'linear-gradient(90deg,#d92b4b,#ff4f6d)';
  $('#hplabel').textContent = `${Math.ceil(me.hp)} / ${Math.round(me.maxHp)}`;
  $('#xpfill').style.width = ((me.xp / me.xpNext) * 100).toFixed(1) + '%';
  $('#xplabel').textContent = `NÍVEL ${me.level}  ·  ${Math.floor(me.xp)}/${me.xpNext}`;
  const dr = me.dashCd <= 0 ? 1 : 1 - me.dashCd / me.stats.dashCd;
  $('#dashfill').style.height = (dr * 100).toFixed(0) + '%';
  $('#dashwrap').classList.toggle('ready', me.dashCd <= 0);
}

// ---------- Loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const me = game.me;

  if (state === 'playing' && me && me.alive) {
    const ps = renderer.worldToScreen(me.x, me.y);
    game.setInput(input.read(ps, me.angle));
  } else if (me) {
    game.setInput({ mx: 0, my: 0, angle: null, shoot: false, dash: false });
  }

  game.update(dt);
  handleEvents(game.drainEvents());

  const w = game.world;
  // Câmera: segue você; no menu/morte, assiste a arena.
  let focus = state === 'playing' && me && me.alive ? me : null;
  if (!focus) {
    let s = spectateId ? w.players.get(spectateId) : null;
    if (!s || !s.alive) {
      s = w.kingId ? w.players.get(w.kingId) : leaderboard(w, 1)[0];
      spectateId = s ? s.id : null;
    }
    focus = s;
  }
  if (focus) renderer.follow(focus.x, focus.y, focus.level, dt);
  renderer.draw(w, state === 'playing' ? game.localId : null, dt, state === 'playing' && input.isTouch ? input.touch : null);

  if (state === 'playing' && me && me.alive) {
    updateBars(me);
    renderUpgrades(me);
    hudTimer -= dt;
    if (hudTimer <= 0) { hudTimer = 0.2; updateHud(me); }
  }
  if (state === 'dead') deathTimer -= dt;
  requestAnimationFrame(frame);
}

renderMenu();
requestAnimationFrame(frame);

// Expõe para depuração no console.
window.nebula = { get game() { return game; }, renderer, profile };
