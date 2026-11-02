// Telas da atualização 3: menu, clientes fixos, álbum, caixas, peças raras, evento, equipe, foto, guincho e rotina online.
import { VISUAL, setVisual } from './visual.js';
import * as L from './logic.js';
import { CHARACTERS, CRATES, RARITY, RARE_PARTS, EVENTS, EVENT_MILESTONES, STAFF_ROLES, STAFF_LEVEL_MULT, UNIFORMS, PART_LABEL, carType, part } from './data.js';
import { icon, portrait, crateSvg } from './icons.js';
import { PhotoStudio, BACKDROPS, ANGLES } from './photo.js';
import { publishProfile } from './social.js';

const $ = (s) => document.querySelector(s);
export const charById = (id) => CHARACTERS.find((c) => c.id === id);
const hearts = (n, max = 5) => `<span class="hearts">${'❤️'.repeat(n)}<span class="off">${'🤍'.repeat(Math.max(0, max - n))}</span></span>`;
const crateTotal = (s) => Object.values(s.crates || {}).reduce((a, n) => a + n, 0);

// ---------- HUD ----------
export function updateHudExtras(ctx) {
  const s = ctx.state;
  const ev = L.ensureEvent(s);
  const def = EVENTS.find((e) => e.id === ev.id);
  const next = EVENT_MILESTONES.find((m, i) => !ev.claimed.includes(i));
  const claimable = EVENT_MILESTONES.some((m, i) => !ev.claimed.includes(i) && ev.points >= m.pts);
  const pill = $('#eventPill');
  pill.style.setProperty('--ev', def.color);
  pill.innerHTML = `${icon('evento')}<span class="ol">${def.name}</span><b>${next ? `${Math.min(ev.points, next.pts)}/${next.pts}` : 'Completo!'}</b>${claimable ? '<i class="dot">!</i>' : ''}`;
  const crates = crateTotal(s);
  const dot = $('#menuDot');
  if (dot) { dot.hidden = !crates; dot.textContent = crates; }
}

// ---------- menu ----------
export function openMenu(ctx, { openSocial }) {
  const s = ctx.state;
  const items = [
    ['equipe', 'Equipe', `${s.staff.length}/${L.teamSize(s)} contratados`, () => openStaff(ctx), '#2f7bea'],
    ['caixa', 'Caixas', crateTotal(s) ? `${crateTotal(s)} para abrir!` : 'Ganhe em corridas e eventos', () => openCrates(ctx), '#ff8a2a'],
    ['album', 'Álbum de clientes', `${Object.keys(s.friends).length}/${CHARACTERS.length} conhecidos`, () => openAlbum(ctx), '#8a5cf0'],
    ['estilo', 'Peças raras', `${Object.keys(s.rare).length}/${RARE_PARTS.length} na coleção`, () => openCollection(ctx), '#ff4fa3'],
    ['evento', 'Evento da semana', L.currentEvent().name, () => openEvent(ctx), '#46c35a'],
    ['amigos', 'Online', ctx.online.on ? 'Amigos, concurso e nuvem' : 'Ver como jogar online', () => openSocial(), '#33b0e0'],
  ];
  const render = (box) => {
    const sf = ctx.sfx;
    const fs = document.fullscreenEnabled && document.documentElement.requestFullscreen;
    const setting = (key, label, on, ic) => `<button class="setting ${on ? 'on' : ''}" data-set="${key}" role="switch" aria-checked="${on}"><span class="sico">${icon(ic)}</span><span class="slabel">${label}</span><i>${on ? '✔' : ''}</i></button>`;
    box.innerHTML = ctx.head(`${icon('menu', 'hico')} Menu`) + `<div class="mbody"><div class="menugrid">${items.map(([ic, t, sub, , c], i) => `
      <button class="card menuitem" data-mi="${i}" style="--c:${c}">${icon(ic, 'mico')}<h4>${t}</h4><span class="meta">${sub}</span>${ic === 'caixa' && crateTotal(s) ? `<i class="dot">${crateTotal(s)}</i>` : ''}</button>`).join('')}</div>
      <div class="sect">Configurações</div>
      <div class="settings">
        ${setting('music', 'Música', sf.musicOn, 'musica')}
        ${setting('sound', 'Efeitos', !sf.muted, sf.muted ? 'mudo' : 'som')}
        ${sf.canBuzz ? setting('haptics', 'Vibração', sf.haptics, 'telefone') : ''}
        ${fs ? setting('full', 'Tela cheia', !!document.fullscreenElement, 'foto') : ''}
        ${setting('visual', 'Visual novo', VISUAL.premium, 'estilo')}
      </div></div>`;
    box.querySelectorAll('[data-mi]').forEach((b) => b.onclick = () => { ctx.sfx.play('click'); ctx.closeModal(); setTimeout(items[Number(b.dataset.mi)][3], 140); });
    box.querySelectorAll('[data-set]').forEach((b) => b.onclick = async () => {
      const k = b.dataset.set;
      if (k === 'music') sf.toggleMusic();
      if (k === 'sound') sf.toggle();
      if (k === 'haptics') sf.toggleHaptics();
      if (k === 'visual') { ctx.save?.(); setVisual(!VISUAL.premium); return; }
      if (k === 'full') {
        try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); } catch {}
      }
      sf.play('click');
      ctx.onSettings?.();
      box.innerHTML = '';
      render(box);
    });
  };
  ctx.openModal(render);
}

// ---------- clientes fixos ----------
let dialogTimer = 0;
export function showFriend(ctx, fr) {
  const ch = charById(fr.id);
  if (!ch) return;
  ctx.sfx.play('friend');
  const d = $('#dialog');
  const gift = fr.gift ? (fr.gift.coins ? ` <b class="gift">Presente: ${ctx.coin(fr.gift.coins)}</b>` : fr.gift.crate ? ` <b class="gift">Presente: ${CRATES[fr.gift.crate].name}!</b>` : fr.gift.fame ? ` <b class="gift">Presente: +${fr.gift.fame} de fama!</b>` : '') : '';
  d.innerHTML = `${portrait(ch.face, 'dportrait')}<div class="dtext"><b>${ch.name}</b> ${hearts(fr.level)}<p>“${fr.line}”${gift}</p></div>`;
  d.hidden = false;
  d.classList.remove('show'); void d.offsetWidth; d.classList.add('show');
  clearTimeout(dialogTimer);
  dialogTimer = setTimeout(() => { d.hidden = true; }, 7500);
  d.onclick = () => { d.hidden = true; };
  ctx.afterChange();
}

export function openAlbum(ctx) {
  const s = ctx.state;
  ctx.openModal((box) => {
    box.innerHTML = ctx.head(`${icon('album', 'hico')} Álbum de clientes`) + `<div class="mbody">
      <div class="reqnote" style="text-align:center">Clientes conhecidos aparecem de vez em quando. Atenda bem para ganhar a amizade, ouvir a história deles e receber presentes.</div>
      <div class="grid">${CHARACTERS.map((ch) => {
        const f = s.friends[ch.id];
        if (!f) return `<div class="card locked"><div class="unknown">?</div><h4>???</h4><p>Aparece a partir do nível ${ch.lvl}</p></div>`;
        const next = Object.keys(ch.gifts).map(Number).find((lv) => lv > f.level);
        return `<div class="card">${portrait(ch.face, 'aportrait')}<h4>${ch.name}</h4>${hearts(f.level)}<p>${ch.bio}</p>
          <span class="meta">${f.visits} visita(s)${next ? ` · presente com ${next} ❤️` : ' · melhores amigos!'}</span>
          ${f.level ? `<p class="quote">“${ch.lines[f.level - 1]}”</p>` : ''}</div>`;
      }).join('')}</div></div>`;
  }, { wide: true });
}

// ---------- caixas e peças raras ----------
export function openCrates(ctx) {
  const s = ctx.state;
  const render = (box) => {
    box.innerHTML = ctx.head(`${icon('caixa', 'hico')} Caixas de prêmio`) + `<div class="mbody">
      <div class="grid three">${Object.entries(CRATES).map(([id, c]) => `
        <div class="card">${crateSvg(c.color, 'bigcrate')}<h4>${c.name}</h4>
          <span class="meta">${Object.entries(c.odds).map(([r, p]) => `${RARITY[r].name} ${Math.round(p * 100)}%`).join(' · ')}</span>
          <b>Você tem: ${s.crates[id] || 0}</b>
          <button class="btn ${s.crates[id] ? 'yellow' : 'gray'}" data-open="${id}" ${s.crates[id] ? '' : 'disabled'}>Abrir</button></div>`).join('')}</div>
      <div class="reqnote" style="text-align:center">Ganhe caixas em corridas, no evento da semana, com amigos fiéis, guinchos perfeitos e no concurso online. Peça repetida vira moedas.</div>
    </div>`;
    box.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => {
      const r = L.openCrate(s, b.dataset.open);
      if (!r) return;
      ctx.afterChange();
      reveal(box, r);
    });
  };
  function reveal(box, r) {
    const c = CRATES[r.tier];
    ctx.sfx.play('crate');
    box.innerHTML = ctx.head(c.name, 'gold', false) + `<div class="mbody center reveal">
      <div class="crateopen">${crateSvg(c.color, 'bigcrate shake')}</div>
      <div class="prize" hidden></div></div>`;
    box.dataset.sticky = '1';
    setTimeout(() => {
      const p = box.querySelector('.prize');
      if (!p) return;
      box.querySelector('.crateopen').classList.add('burst');
      let html;
      if (r.part) {
        const rr = RARITY[r.part.rare];
        ctx.sfx.play(r.dup ? 'cash' : 'rare');
        html = `<div class="raylight" style="--rc:${rr.color}"></div>
          ${partVisual(ctx, r.part.kind, r.part, 'prizeimg')}
          <span class="rarity" style="background:${rr.color}">${rr.name}</span>
          <p class="bigtext ol">${r.part.name}</p>
          <b>${PART_LABEL[r.part.kind]}${r.dup ? ` · repetida, virou ${ctx.coin(r.coins)}` : ' · nova na coleção!'}</b>`;
      } else {
        ctx.sfx.play('cash');
        html = `${icon('moeda', 'prizeimg')}<p class="bigtext ol">${ctx.coin(r.coins)}</p><b>Moedas!</b>`;
      }
      p.innerHTML = html + `<div class="row" style="width:100%"><button class="btn green" data-more>Continuar</button></div>`;
      p.hidden = false;
      p.querySelector('[data-more]').onclick = () => { delete box.dataset.sticky; ctx.rerender(render); };
    }, 1100);
  }
  ctx.openModal(render);
}

export function partVisual(ctx, kind, p, cls = '') {
  if (kind === 'color') {
    const bg = p.iris ? 'conic-gradient(#7a5cff, #36d0ff, #4dff9a, #ffd23d, #ff4fd8, #7a5cff)' : p.chrome ? 'linear-gradient(135deg,#ffffff,#9aa3b2 45%,#ffffff 55%,#6b7180)' : p.pearl ? 'radial-gradient(circle at 35% 30%, #ffffff, #f4efe6 50%, #e6d6f2)' : p.hex;
    return `<span class="swatch ${cls}" style="background:${bg}"></span>`;
  }
  return `<img class="pimg ${cls}" src="${ctx.thumbs.part(kind, p.id)}" alt="">`;
}

export function openCollection(ctx) {
  const s = ctx.state;
  ctx.openModal((box) => {
    box.innerHTML = ctx.head(`${icon('estilo', 'hico')} Peças raras · ${Object.keys(s.rare).length}/${RARE_PARTS.length}`) + `<div class="mbody">
      <div class="grid">${RARE_PARTS.map((p) => {
        const own = L.owns(s, p.kind, p.id);
        const rr = RARITY[p.rare];
        return `<div class="card rarecard ${own ? '' : 'missing'}" style="--rc:${rr.color}">${partVisual(ctx, p.kind, p)}<h4>${own ? p.name : '???'}</h4><span class="rarity" style="background:${rr.color}">${rr.name}</span><span class="meta">${PART_LABEL[p.kind]}</span></div>`;
      }).join('')}</div>
      <div class="reqnote" style="text-align:center">Peças raras aparecem na Cabine de Estilo e na Garagem. Como extra num cliente, valem gorjeta muito maior!</div></div>`;
  }, { wide: true });
}

// ---------- evento da semana ----------
export function openEvent(ctx) {
  const s = ctx.state;
  const render = (box) => {
    const ev = L.ensureEvent(s);
    const def = EVENTS.find((e) => e.id === ev.id);
    const [kind, id] = def.reward.part.split(':');
    const rp = part(kind, id);
    const max = EVENT_MILESTONES[EVENT_MILESTONES.length - 1].pts;
    const how = Object.entries(def.points).map(([k, v]) => `<span class="chip">${({ custom_neon: 'Personalizar com neon', custom: 'Personalizar', deliver: 'Atender', wash: 'Lavar', race: 'Correr', win: 'Vencer corrida', tune: 'Preparar carro', tow: 'Guincho', fuel: 'Abastecer', loja: 'Recolher loja' })[k] || k} +${v}</span>`).join('');
    box.innerHTML = `<div class="mhead" style="background:linear-gradient(${def.color}, ${def.color}cc)"><h2 class="ol">${icon('evento', 'hico')} ${def.name}</h2><button class="mclose" data-close aria-label="Fechar">✕</button></div>
      <div class="mbody">
        <b>${def.desc}</b>
        <span class="meta">Termina em ${L.eventDaysLeft()} dia(s). Toda semana tem um evento diferente.</span>
        <div class="evbar"><i style="width:${Math.min(100, (ev.points / max) * 100)}%;background:${def.color}"></i>${EVENT_MILESTONES.map((m) => `<span class="mark" style="left:${(m.pts / max) * 100}%"></span>`).join('')}<b>${ev.points} pts</b></div>
        <div class="chips">${how}</div>
        <div class="grid three">${EVENT_MILESTONES.map((m, i) => {
          const done = ev.claimed.includes(i), ok = ev.points >= m.pts;
          const vis = m.part ? partVisual(ctx, kind, rp) : m.crate ? crateSvg(CRATES[m.crate].color, 'midcrate') : icon('moeda', 'mico');
          const label = m.part ? `${rp.name} (exclusiva)` : m.crate ? CRATES[m.crate].name : ctx.coin(m.coins);
          return `<div class="card">${vis}<h4>${label}</h4><span class="meta">${m.pts} pontos</span>
            <button class="btn ${done ? 'gray' : ok ? 'green' : 'gray'}" data-claim="${i}" ${done || !ok ? 'disabled' : ''}>${done ? 'Resgatado ✔' : ok ? 'Resgatar' : `Faltam ${m.pts - ev.points}`}</button></div>`;
        }).join('')}</div>
      </div>`;
    box.querySelectorAll('[data-claim]').forEach((b) => b.onclick = () => {
      const r = L.claimEventMilestone(s, Number(b.dataset.claim));
      if (!r) return;
      ctx.sfx.play(r.part ? 'rare' : 'cash');
      ctx.toast(r.part ? `Nova peça rara: ${rp.name}!` : r.crate ? 'Caixa ganha! Abra no Menu → Caixas' : 'Moedas resgatadas!');
      ctx.afterChange();
      ctx.rerender(render);
    });
  };
  ctx.openModal(render);
}

// ---------- equipe ----------
export function openStaff(ctx) {
  const s = ctx.state;
  const render = (box) => {
    const size = L.teamSize(s);
    box.innerHTML = ctx.head(`${icon('equipe', 'hico')} Equipe · ${s.staff.length}/${size}`) + `<div class="mbody">
      <div class="card" style="align-items:stretch;text-align:left"><h4>Cor do uniforme</h4>
        <div class="uniforms">${UNIFORMS.map((c) => `<button class="uni ${s.uniform === c ? 'on' : ''}" style="background:${c}" data-uni="${c}" aria-label="Uniforme"></button>`).join('')}</div>
        <span class="meta">Mecânicos e funcionários usam essa cor. A equipe cresce com o nível da oficina.</span></div>
      <div class="grid">${Object.entries(STAFF_ROLES).map(([id, r]) => {
        const m = s.staff.find((x) => x.role === id);
        const pct = Math.round(r.base * (m ? STAFF_LEVEL_MULT[m.level - 1] : 1) * 100);
        const eff = r.effect === 'raceTop' ? `+${(r.base * (m ? STAFF_LEVEL_MULT[m.level - 1] : 1)).toFixed(1)} vel.` : `+${pct}%`;
        let btn;
        if (m) btn = m.level >= 3 ? '<button class="btn gray" disabled>Nível máximo</button>' : `<button class="btn green" data-train="${id}" ${s.coins < L.trainCost(m) ? 'disabled' : ''}>Treinar ${ctx.coin(L.trainCost(m))}</button>`;
        else if (s.level < r.lvl) btn = `<button class="btn gray" disabled>🔒 Nível ${r.lvl}</button>`;
        else if (s.staff.length >= size) btn = '<button class="btn gray" disabled>Equipe cheia</button>';
        else btn = `<button class="btn yellow twoline" data-hire="${id}" ${s.coins < r.cost ? 'disabled' : ''}><span class="bl">Contratar</span> ${ctx.coin(r.cost)}</button>`;
        return `<div class="card ${!m && s.level < r.lvl ? 'locked' : ''}"><div class="staffic" style="background:${s.uniform}">${icon(r.icon)}</div>
          <h4>${m ? `${m.name}` : r.name}</h4>${m ? `<span class="meta">${r.name}</span><span class="lvstars">${'★'.repeat(m.level)}<span style="color:#c3cbd8">${'★'.repeat(3 - m.level)}</span></span>` : ''}
          <p>${r.desc}: <b>${eff}</b>${r.fame ? ` e +${Math.round(r.fame * (m ? STAFF_LEVEL_MULT[m.level - 1] : 1))} de fama` : ''}</p>${btn}</div>`;
      }).join('')}</div></div>`;
    box.querySelectorAll('[data-uni]').forEach((b) => b.onclick = () => { L.setUniform(s, b.dataset.uni); ctx.sfx.play('spray'); ctx.world.sync(s); ctx.afterChange(); ctx.rerender(render); });
    box.querySelectorAll('[data-hire]').forEach((b) => b.onclick = () => {
      const r = L.hire(s, b.dataset.hire);
      if (!r.ok) { ctx.sfx.play('error'); return; }
      ctx.sfx.play('cash');
      ctx.toast(`${r.m.name} entrou para a equipe! 👷`);
      ctx.world.sync(s);
      ctx.afterChange();
      ctx.rerender(render);
    });
    box.querySelectorAll('[data-train]').forEach((b) => b.onclick = () => {
      const r = L.train(s, b.dataset.train);
      if (!r.ok) { ctx.sfx.play('error'); return; }
      ctx.sfx.play('level');
      ctx.afterChange();
      ctx.rerender(render);
    });
  };
  ctx.openModal(render, { wide: true });
}

// ---------- modo foto ----------
const studio = new PhotoStudio();
export function photoPreview(ctx, spec, title) {
  openPhoto(ctx, spec, title);
}

export function openPhoto(ctx, spec, title) {
  let bg = 'estudio', angle = 'frente', url = '';
  const sub = ctx.state.name || 'Minha oficina';
  const draw = () => { url = studio.render(spec, { bg, angle, title, subtitle: sub, size: 720 }); };
  const render = (box) => {
    box.innerHTML = ctx.head(`${icon('foto', 'hico')} Modo foto`) + `<div class="mbody">
      <img class="photo" src="${url}" alt="Foto do carro ${title}">
      <div class="chips">${BACKDROPS.map((b) => `<button class="chip ${b.id === bg ? 'on' : ''}" data-bg="${b.id}">${b.name}</button>`).join('')}</div>
      <div class="chips">${ANGLES.map((a) => `<button class="chip ${a.id === angle ? 'on' : ''}" data-ang="${a.id}">${a.name}</button>`).join('')}</div>
      <div class="row"><button class="btn green" data-save>Salvar foto</button></div>
      <div class="reqnote" style="text-align:center" id="photoNote">No computador, também dá para clicar com o botão direito na foto e salvar.</div></div>`;
    box.querySelectorAll('[data-bg]').forEach((b) => b.onclick = () => { bg = b.dataset.bg; ctx.sfx.play('click'); draw(); ctx.rerender(render); });
    box.querySelectorAll('[data-ang]').forEach((b) => b.onclick = () => { angle = b.dataset.ang; ctx.sfx.play('click'); draw(); ctx.rerender(render); });
    box.querySelector('[data-save]').onclick = async () => {
      const full = studio.render(spec, { bg, angle, title, subtitle: sub, size: 1080 });
      try {
        const r = await ctx.online.saveFile(`oficina-nitro-${Date.now()}.png`, full);
        box.querySelector('#photoNote').textContent = r?.status === 'saved' ? 'Foto salva! ✔' : 'Foto enviada.';
        ctx.sfx.play('pop');
      } catch (e) {
        box.querySelector('#photoNote').textContent = e?.code === 'declined' ? 'Tudo bem, a foto não foi salva.' : 'Não deu para salvar aqui. Clique com o botão direito (ou segure o dedo) na foto para salvar.';
      }
    };
  };
  draw();
  ctx.openModal(render, { priority: true });
}

// ---------- guincho ----------
export function towResult(ctx, res) {
  ctx.openModal((box) => {
    box.innerHTML = ctx.head(res.stars === 3 ? 'REBOQUE PERFEITO!' : 'CARRO REBOCADO!', res.stars === 3 ? 'gold' : '', true) + `
      <div class="mbody center">
        <div class="stars">${[1, 2, 3].map((i) => `<i class="${i <= res.stars ? '' : 'off'}">★</i>`).join('')}</div>
        <div class="statline" style="width:100%"><span>Pagamento + moedas da rua</span><b>${ctx.coin(res.coins)}</b></div>
        <div class="statline" style="width:100%"><span>Experiência</span><b class="up">+${res.xp} XP</b></div>
        ${res.crate ? `<div class="statline" style="width:100%"><span>${CRATES[res.crate].name} (sem batidas!)</span><b class="up">🎁</b></div>` : ''}
        ${res.customer ? '<b>O carro rebocado está na fila esperando conserto. Ele paga mais! 🔧</b>' : ''}
        <button class="btn green" data-close style="width:100%">Beleza!</button>
      </div>`;
  }, { priority: true });
  ctx.sfx.play(res.stars === 3 ? 'stars' : 'cash');
  ctx.handleLevels(res.levels);
}

// ---------- rotina online ----------
let pubT = 20, cloudT = 120;
export function tickOnline(ctx, dt) {
  const o = ctx.online;
  if (!o.on || ctx.mode === 'race' || ctx.mode === 'tow') return;
  pubT -= dt;
  cloudT -= dt;
  if (pubT <= 0) { pubT = 180; publishProfile(ctx).catch(() => {}); }
  if (cloudT <= 0) { cloudT = 300; o.saveCloud(ctx.state).catch(() => {}); }
}

export async function afterBoot(ctx) {
  const ok = await ctx.online.ready;
  if (!ok) return;
  try {
    const c = await ctx.online.loadCloud();
    const s = ctx.state;
    if (c && c.level > s.level && c.at > (s.lastSeen || 0) - 60000) {
      ctx.openModal((box) => {
        box.innerHTML = ctx.head(`${icon('nuvem', 'hico')} Jogo na nuvem`) + `<div class="mbody center">
          <b>Encontramos uma oficina sua salva na nuvem, no nível ${c.level} (aqui você está no nível ${s.level}).</b>
          <span class="meta">Salva em ${new Date(c.at).toLocaleString('pt-BR')}.</span>
          <div class="row" style="width:100%"><button class="btn gray" data-close>Continuar aqui</button><button class="btn green" data-load>Carregar da nuvem</button></div></div>`;
        box.querySelector('[data-load]').onclick = () => ctx.loadState(JSON.parse(c.json));
      });
    }
  } catch {}
}
