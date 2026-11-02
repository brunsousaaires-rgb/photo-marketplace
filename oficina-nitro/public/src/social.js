// Telas online: oficinas dos amigos (visitar, curtir, desafiar), concurso semanal e perfil.
import * as L from './logic.js';
import { carType, part } from './data.js';
import { icon } from './icons.js';
import { profileSnapshot } from './online.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const carName = (c) => `${carType(c.type).name} ${(part('color', c.color) || {}).name || ''}`;
const MAX_VOTES = 3;

export async function publishProfile(ctx) {
  const o = ctx.online;
  if (!o.on) return false;
  const snap = profileSnapshot(ctx.state, L.fame(ctx.state));
  const sig = JSON.stringify({ ...snap, updated: 0 });
  if (sig === ctx._lastPublish) return true;
  await o.setMine('players', snap);
  ctx._lastPublish = sig;
  return true;
}

function weekOf(doc, week) {
  return (doc && doc.byWeek && doc.byWeek[week]) || null;
}

function trimWeeks(byWeek, keep = 3) {
  const ks = Object.keys(byWeek).map(Number).sort((a, b) => b - a);
  for (const k of ks.slice(keep)) delete byWeek[k];
  return byWeek;
}

export function openSocial(ctx, tab = 'oficinas') {
  const { sfx, coin } = ctx;
  const o = ctx.online;
  let data = null, err = null, loading = false, token = 0;

  async function load() {
    loading = true;
    const my = ++token;
    try {
      await publishProfile(ctx);
      const [players, entries, votes, likes] = await Promise.all([o.list('players'), o.list('entries'), o.list('votes'), o.list('likes')]);
      const ids = players.map((p) => p.id);
      const names = await o.names(ids);
      if (my !== token) return;
      data = { players, entries, votes, likes, names };
      err = null;
    } catch (e) {
      err = 'Não deu para falar com o servidor agora. Tente de novo em instantes.';
    }
    loading = false;
    if (document.querySelector('#modalBox')?.dataset.view === 'social') ctx.rerender(render);
  }

  const nameOf = (id, p) => (p && p.name) || data?.names[id] || 'Oficina sem nome';

  function render(box) {
    box.dataset.view = 'social';
    if (!o.on) {
      box.innerHTML = ctx.head(`${icon('amigos', 'hico')} Online`) + `<div class="mbody"><div class="empty">${icon('amigos', 'bigico')}<b>O modo online não está disponível aqui</b><p>${esc(o.reason || '')}</p></div></div>`;
      return;
    }
    const tabs = `<div class="mtabs">
      <button class="tab ${tab === 'oficinas' ? 'on' : ''}" data-stab="oficinas">${icon('amigos')} Oficinas</button>
      <button class="tab ${tab === 'concurso' ? 'on' : ''}" data-stab="concurso">${icon('trofeu')} Concurso</button>
      <button class="tab ${tab === 'perfil' ? 'on' : ''}" data-stab="perfil">${icon('garagem')} Perfil</button></div>`;
    let body;
    if (!data && !err) body = '<div class="empty"><b>Carregando…</b></div>';
    else if (err) body = `<div class="empty"><b>${err}</b><button class="btn blue" data-retry>Tentar de novo</button></div>`;
    else body = tab === 'oficinas' ? oficinas() : tab === 'concurso' ? concurso() : perfil();
    box.innerHTML = ctx.head(`${icon('amigos', 'hico')} Online`) + `<div class="mbody">${tabs}${body}</div>`;
    box.querySelectorAll('[data-stab]').forEach((b) => b.onclick = () => { sfx.play('click'); tab = b.dataset.stab; ctx.rerender(render); });
    box.querySelector('[data-retry]')?.addEventListener('click', () => { err = null; ctx.rerender(render); load(); });
    bind(box);
  }

  function oficinas() {
    const wk = L.weekKey();
    const me = o.uid;
    const myLikes = weekOf(data.likes.find((d) => d.id === me), wk) || [];
    const likeCount = (id) => data.likes.reduce((n, d) => n + ((weekOf(d, wk) || []).includes(id) ? 1 : 0), 0);
    const others = data.players.filter((p) => p.id !== me).sort((a, b) => (b.fame || 0) - (a.fame || 0));
    if (!others.length) {
      return `<div class="empty">${icon('amigos', 'bigico')}<b>Ainda não há outras oficinas por aqui</b><p>Compartilhe o link do jogo com amigos (com permissão de Contribuidor) para visitarem, curtirem e desafiarem você.</p></div>`;
    }
    const canRace = ctx.state.track && ctx.state.garage.length;
    return `<div class="grid one">${others.map((p, i) => `
      <div class="card player">
        <div class="prank">${i + 1}º</div>
        <div class="pinfo"><h4>${esc(nameOf(p.id, p))}</h4>
          <span class="meta">Nível ${p.level || 1} · ⭐ ${p.fame || 0} · 🏆 ${p.trophies || 0} · ❤️ ${likeCount(p.id)}</span></div>
        <div class="pbtns">
          <button class="btn blue" data-visit="${esc(p.id)}">Visitar</button>
          <button class="btn ${myLikes.includes(p.id) ? 'gray' : 'red'}" data-like="${esc(p.id)}" ${myLikes.includes(p.id) ? 'disabled' : ''}>❤️</button>
          ${p.cars?.length && canRace ? `<button class="btn yellow" data-race="${esc(p.id)}">${icon('corrida', 'bico')}</button>` : ''}
        </div>
      </div>`).join('')}</div>
      <div class="reqnote" style="text-align:center">Curtir dá ${coin(30)} para você (uma vez por oficina na semana). Desafiar coloca o melhor carro do amigo na sua pista.</div>`;
  }

  function concurso() {
    const wk = L.weekKey();
    const me = o.uid;
    const entries = data.entries.map((d) => ({ id: d.id, e: weekOf(d, wk) })).filter((x) => x.e);
    const votesOf = (week) => {
      const t = {};
      for (const d of data.votes) for (const id of weekOf(d, week) || []) t[id] = (t[id] || 0) + 1;
      return t;
    };
    const tally = votesOf(wk);
    const myVotes = weekOf(data.votes.find((d) => d.id === me), wk) || [];
    const mine = entries.find((x) => x.id === me);
    // Resultado da semana passada.
    const prev = wk % 100 === 1 ? wk - 100 + 52 : wk - 1;
    const prevEntries = data.entries.map((d) => ({ id: d.id, e: weekOf(d, prev) })).filter((x) => x.e);
    const prevTally = votesOf(prev);
    const podium = prevEntries.map((x) => ({ ...x, v: prevTally[x.id] || 0 })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
    const myPlace = podium.findIndex((x) => x.id === me) + 1;
    const canClaim = myPlace > 0 && !(ctx.state.contest?.claimed || []).includes(prev);
    const cars = [...ctx.state.garage];
    if (ctx.lastCustom) cars.push({ ...ctx.lastCustom, id: 'ultimo', last: true });
    const pick = !mine ? `<h3 class="sect">Inscreva um carro seu</h3>${cars.length ? `<div class="picks">${cars.map((c) => `<button class="pickcar" data-enter="${c.id}"><img src="${ctx.thumbs.car(c)}" alt=""><span>${c.last ? 'Último personalizado' : esc(carName(c))}</span></button>`).join('')}</div>` : '<p class="reqnote">Personalize um carro na Cabine de Estilo ou restaure um para a garagem e volte aqui.</p>'}` : '';
    return `<div class="contesthead">${icon('trofeu', 'hico')} <b>O carro mais bonito da semana</b><span class="meta">termina em ${L.eventDaysLeft()} dia(s) · você tem ${MAX_VOTES - myVotes.length} voto(s)</span></div>
      ${podium.length ? `<div class="podiumrow">${podium.map((x, i) => `<div class="pod p${i + 1}"><img src="${ctx.thumbs.car(x.e.spec)}" alt=""><b>${['🥇', '🥈', '🥉'][i]} ${esc(nameOf(x.id, data.players.find((p) => p.id === x.id)))}</b><span class="meta">${x.v} votos (semana passada)</span></div>`).join('')}</div>` : ''}
      ${canClaim ? `<button class="btn yellow" data-claimc="${prev}" data-place="${myPlace}" style="width:100%">Você ficou em ${myPlace}º lugar! Pegar prêmio</button>` : ''}
      ${pick}
      <h3 class="sect">Inscritos (${entries.length})</h3>
      <div class="grid">${entries.sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0)).map((x) => `
        <div class="card"><img class="thumb" src="${ctx.thumbs.car(x.e.spec)}" alt="">
          <h4>${esc(x.e.title || carName(x.e.spec))}</h4><span class="meta">${esc(nameOf(x.id, data.players.find((p) => p.id === x.id)))}</span>
          <span class="votes">❤️ ${tally[x.id] || 0}</span>
          ${x.id === me ? '<button class="btn gray" disabled>Seu carro</button>' : `<button class="btn ${myVotes.includes(x.id) ? 'gray' : 'green'}" data-vote="${esc(x.id)}" ${myVotes.includes(x.id) || myVotes.length >= MAX_VOTES ? 'disabled' : ''}>${myVotes.includes(x.id) ? 'Votado ✔' : 'Votar'}</button>`}
        </div>`).join('') || '<div class="empty"><b>Ninguém se inscreveu ainda. Seja o primeiro!</b></div>'}</div>
      <div class="reqnote" style="text-align:center">Os 3 mais votados ganham caixas de ouro, prata e bronze e fama.</div>`;
  }

  function perfil() {
    const st = ctx.state;
    return `<div class="card" style="align-items:stretch;text-align:left">
        <h4>Nome da sua oficina</h4>
        <div class="row"><input id="oficinaName" maxlength="24" value="${esc(st.name || '')}" placeholder="Ex.: Oficina do Bruno"><button class="btn green" data-savename>Salvar</button></div>
        <span class="meta">É assim que os amigos veem você no ranking e no concurso.</span>
      </div>
      <div class="card" style="align-items:stretch;text-align:left">
        <h4>${icon('nuvem', 'hico')} Salvamento na nuvem</h4>
        <span class="meta" id="cloudInfo">Continue a mesma oficina em outro aparelho.</span>
        <div class="row"><button class="btn blue" data-cloudsave>Salvar agora</button><button class="btn yellow" data-cloudload>Carregar da nuvem</button></div>
      </div>
      <div class="reqnote" style="text-align:center">Conectado ${o.kind === 'artifact' ? 'pelo link do jogo no Claude' : 'ao servidor do jogo'}.</div>`;
  }

  async function updateMine(col, mutate) {
    const cur = (await o.get(col, o.uid)) || {};
    const byWeek = { ...(cur.byWeek || {}) };
    mutate(byWeek);
    await o.setMine(col, { byWeek: trimWeeks(byWeek) });
  }

  function bind(box) {
    const st = ctx.state;
    const wk = L.weekKey();
    box.querySelectorAll('[data-visit]').forEach((b) => b.onclick = () => {
      const p = data.players.find((x) => x.id === b.dataset.visit);
      sfx.play('click');
      ctx.closeModal();
      ctx.enterVisit(p, nameOf(p.id, p));
    });
    box.querySelectorAll('[data-like]').forEach((b) => b.onclick = async () => {
      b.disabled = true;
      try {
        await updateMine('likes', (bw) => { bw[wk] = [...new Set([...(bw[wk] || []), b.dataset.like])]; });
        st.coins += 30;
        sfx.play('cash');
        ctx.afterChange();
        ctx.toast('❤️ Curtida enviada! +30 moedas');
        await load();
      } catch { b.disabled = false; ctx.toast('Não deu para curtir agora'); }
    });
    box.querySelectorAll('[data-race]').forEach((b) => b.onclick = () => {
      const p = data.players.find((x) => x.id === b.dataset.race);
      const best = [...(p.cars || [])].sort((a, c) => L.carStats({ motor: 1, turbo: 0, pneus: 1, ...c }).top - L.carStats({ motor: 1, turbo: 0, pneus: 1, ...a }).top)[0];
      const mineCar = [...st.garage].sort((a, c) => L.carStats(c).top - L.carStats(a).top)[0];
      const e = L.enterFriendRace(st, mineCar.id, { name: nameOf(p.id, p), car: best });
      if (!e.ok) { sfx.play('error'); ctx.toast(e.reason === 'coins' ? 'Precisa de 100 moedas para o desafio' : 'Não deu para desafiar agora'); return; }
      ctx.closeModal();
      ctx.afterChange();
      ctx.startRace(e);
    });
    box.querySelectorAll('[data-enter]').forEach((b) => b.onclick = async () => {
      const id = b.dataset.enter;
      const c = id === 'ultimo' ? ctx.lastCustom : st.garage.find((x) => String(x.id) === id);
      if (!c) return;
      const spec = { type: c.type, color: c.color, wheels: c.wheels, spoiler: c.spoiler, neon: c.neon, decal: c.decal };
      try {
        await updateMine('entries', (bw) => { bw[wk] = { spec, title: carName(spec) }; });
        sfx.play('stars');
        ctx.toast('Carro inscrito no concurso! 🏆');
        await load();
      } catch { ctx.toast('Não deu para inscrever agora'); }
    });
    box.querySelectorAll('[data-vote]').forEach((b) => b.onclick = async () => {
      b.disabled = true;
      try {
        await updateMine('votes', (bw) => { const v = bw[wk] || []; if (v.length < MAX_VOTES && !v.includes(b.dataset.vote)) bw[wk] = [...v, b.dataset.vote]; });
        sfx.play('pop');
        await load();
      } catch { b.disabled = false; ctx.toast('Não deu para votar agora'); }
    });
    box.querySelector('[data-claimc]')?.addEventListener('click', (e) => {
      const r = L.claimContest(st, Number(e.currentTarget.dataset.claimc), Number(e.currentTarget.dataset.place));
      if (!r) return;
      sfx.play('win');
      ctx.afterChange();
      ctx.toast(`Prêmio do concurso: ${r.crate === 'ouro' ? 'Caixa de Ouro' : r.crate === 'prata' ? 'Caixa de Prata' : 'Caixa de Bronze'}!`);
      ctx.rerender(render);
    });
    box.querySelector('[data-savename]')?.addEventListener('click', async () => {
      st.name = box.querySelector('#oficinaName').value.trim().slice(0, 24);
      ctx.afterChange();
      try { await publishProfile(ctx); ctx.toast('Nome salvo! ✔'); } catch { ctx.toast('Salvo no aparelho; o online atualiza depois'); }
    });
    box.querySelector('[data-cloudsave]')?.addEventListener('click', async () => {
      try { await o.saveCloud(st); sfx.play('pop'); box.querySelector('#cloudInfo').textContent = 'Salvo na nuvem agora mesmo ✔'; } catch { box.querySelector('#cloudInfo').textContent = 'Não deu para salvar agora. Tente de novo.'; }
    });
    box.querySelector('[data-cloudload]')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      try {
        const c = await o.loadCloud();
        if (!c) { box.querySelector('#cloudInfo').textContent = 'Nenhum jogo salvo na nuvem ainda.'; return; }
        if (!btn.dataset.sure) {
          btn.dataset.sure = '1';
          btn.textContent = `Trocar pelo nível ${c.level}? Toque de novo`;
          box.querySelector('#cloudInfo').textContent = `Salvo em ${new Date(c.at).toLocaleString('pt-BR')} · nível ${c.level}. Isso substitui o jogo deste aparelho.`;
          return;
        }
        ctx.loadState(JSON.parse(c.json));
      } catch { box.querySelector('#cloudInfo').textContent = 'Não deu para carregar agora.'; }
    });
  }

  ctx.openModal(render, { wide: true });
  load();
}
