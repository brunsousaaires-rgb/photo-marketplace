// Garagem: coleção de carros, leilão de sucatas, preparação e inscrição nas corridas.
import * as L from './logic.js';
import { PARTS, PART_TABS, PART_COST, PERF, RACE_TIERS, TRACK, carType, part } from './data.js';
import { icon } from './icons.js';

const colorName = (id) => (part('color', id) || {}).name || '';
const carName = (c) => `${carType(c.type).name} ${colorName(c.color)}`;

function statBars(st) {
  const bars = [
    ['Velocidade', (st.top - 10) / 12, st.top.toFixed(1)],
    ['Aceleração', st.acc / 11, st.acc.toFixed(1)],
    ['Aderência', (st.grip - 0.6) / 0.4, Math.round(st.grip * 100) + '%'],
  ];
  return `<div class="stats">${bars.map(([n, k, v]) => `<div class="stat"><span>${n}</span><div class="sbar"><i style="width:${Math.max(6, Math.min(100, k * 100)).toFixed(0)}%"></i></div><b>${v}</b></div>`).join('')}</div>`;
}

export function openGarage(ctx, opts = {}) {
  let tab = opts.tab || 'colecao';
  let carId = opts.carId || null;
  let sub = 'visual';
  let partTab = 'color';
  let raceCar = opts.carId || ctx.state.garage[0]?.id || null;
  const { coin, fmt, sfx } = ctx;

  const render = (box) => {
    const s = ctx.state;
    ctx.viewer.unmount();
    const car = carId ? s.garage.find((c) => c.id === carId) : null;
    if (carId && !car) carId = null;
    let body = '';
    if (car) body = detail(car);
    else if (tab === 'colecao') body = colecao();
    else if (tab === 'leilao') body = leilao();
    else body = corridas();
    box.innerHTML = ctx.head(`${icon('garagem', 'hico')} Garagem`) + `
      <div class="mbody">
        ${car ? '' : `<div class="mtabs">
          <button class="tab ${tab === 'colecao' ? 'on' : ''}" data-gtab="colecao">${icon('garagem')} Coleção ${s.garage.length}/${L.GARAGE_MAX}</button>
          <button class="tab ${tab === 'leilao' ? 'on' : ''}" data-gtab="leilao">${icon('leilao')} Leilão</button>
          <button class="tab ${tab === 'corridas' ? 'on' : ''}" data-gtab="corridas">${icon('corrida')} Corridas</button>
        </div>`}
        ${body}
      </div>`;
    box.querySelectorAll('[data-gtab]').forEach((b) => b.onclick = () => { sfx.play('click'); tab = b.dataset.gtab; ctx.rerender(render); });
    bind(box, car);
    if (car) ctx.viewer.mount(box.querySelector('#viewer'), car);
  };

  function colecao() {
    const s = ctx.state;
    const projects = s.projects.map((p) => {
      const busy = !s.buildings.some((b) => b.type === 'restauracao' && !b.job && !b.build);
      const hasBox = L.has(s, 'restauracao');
      const t = L.restoreTime(p.car.type);
      return `<div class="card">
        <img class="thumb" src="${ctx.thumbs.car(p.car)}" alt="">
        <h4>${carName(p.car)}</h4><p>Aguardando restauração · ${Math.round(t / 60 * 10) / 10} min</p>
        <button class="btn ${hasBox && !busy ? 'green' : 'gray'}" data-restore="${p.id}" ${hasBox && !busy ? '' : 'disabled'}>${!hasBox ? 'Construa o Box' : busy ? 'Box ocupado' : 'Restaurar'}</button>
      </div>`;
    }).join('');
    const cars = s.garage.map((c) => `<button class="card carcard" data-car="${c.id}">
        <img class="thumb" src="${ctx.thumbs.car(c)}" alt="">
        <h4>${carName(c)}</h4>
        ${statBars(L.carStats(c))}
        <span class="meta">Vale ${coin(L.carValue(c))}</span>
      </button>`).join('');
    if (!projects && !cars) {
      return `<div class="empty">${icon('restauro', 'bigico')}
        <b>Sua coleção está vazia</b>
        <p>Compre uma sucata no <b>Leilão</b>, restaure no <b>Box de Restauração</b> e ela vira um carro seu: para preparar, correr na pista ou vender com lucro.</p>
        ${L.has(s, 'restauracao') ? '' : `<p class="reqnote">O Box de Restauração libera no nível 5 (menu Construir).</p>`}
        <button class="btn yellow" data-gtab="leilao">Ver o leilão</button></div>`;
    }
    return `${projects ? `<h3 class="sect">Projetos</h3><div class="grid">${projects}</div>` : ''}
      ${cars ? `<h3 class="sect">Seus carros</h3><div class="grid">${cars}</div>` : ''}`;
  }

  function leilao() {
    const s = ctx.state;
    const a = L.refreshAuction(s);
    const left = Math.max(0, a.next - Date.now());
    const mm = Math.floor(left / 60000), ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    const full = s.projects.length >= L.PROJECTS_MAX;
    const offers = a.offers.map((o) => {
      const spec = { type: o.type, color: o.color, wheels: 'padrao', spoiler: 'nenhum', neon: 'nenhum', decal: 'nenhum', rust: 1 };
      const t = carType(o.type);
      return `<div class="card">
        <img class="thumb" src="${ctx.thumbs.car(spec)}" alt="">
        <h4>${t.name} ${colorName(o.color)}</h4>
        <p>“${o.wear}”</p>
        <span class="meta">Restaurado vale ~${coin(t.value)}</span>
        <button class="btn yellow" data-buy="${o.id}" ${s.coins < o.price || full ? 'disabled' : ''}>${coin(o.price)}</button>
      </div>`;
    }).join('');
    return `<div class="reqnote" style="text-align:center">Carros novos chegam em ${mm}:${ss}. ${full ? '<b>Você já tem 3 projetos esperando restauração.</b>' : ''}</div>
      <div class="grid">${offers || '<div class="empty"><b>Tudo vendido!</b><p>Volte mais tarde.</p></div>'}</div>
      ${L.has(s, 'restauracao') ? '' : '<div class="reqnote" style="text-align:center">Você vai precisar de um Box de Restauração (nível 5) para restaurar.</div>'}`;
  }

  function corridas() {
    const s = ctx.state;
    if (!s.track) {
      return `<div class="empty">${icon('corrida', 'bigico')}
        <b>Construa a Pista de Corrida</b>
        <p>Fica atrás da oficina. Corra com os carros da sua coleção contra pilotos da região e ganhe prêmios e troféus (troféus dão fama).</p>
        <button class="btn yellow" data-track ${s.level < TRACK.lvl || s.coins < TRACK.cost ? 'disabled' : ''}>${s.level < TRACK.lvl ? `Nível ${TRACK.lvl}` : `Construir ${coin(TRACK.cost)}`}</button></div>`;
    }
    if (!s.garage.length) {
      return `<div class="empty">${icon('garagem', 'bigico')}<b>Você precisa de um carro</b><p>Restaure um carro do leilão para poder correr.</p><button class="btn yellow" data-gtab="leilao">Ver o leilão</button></div>`;
    }
    if (!s.garage.find((c) => c.id === raceCar)) raceCar = s.garage[0].id;
    const my = L.carStats(s.garage.find((c) => c.id === raceCar));
    const picks = s.garage.map((c) => `<button class="pickcar ${c.id === raceCar ? 'on' : ''}" data-racecar="${c.id}"><img src="${ctx.thumbs.car(c)}" alt=""><span>${carName(c)}</span></button>`).join('');
    const tiers = RACE_TIERS.map((t) => {
      const locked = s.level < t.lvl;
      const diff = my.top - t.rival;
      const odds = diff > 1 ? ['Favorito', 'good'] : diff > -0.6 ? ['Equilibrado', 'mid'] : ['Difícil', 'bad'];
      return `<div class="card race ${locked ? 'locked' : ''}">
        <h4>${icon('corrida', 'hico')} ${t.name}</h4>
        <div class="prizes"><span>🥇 ${coin(t.prize[0])}</span><span>🥈 ${coin(t.prize[1])}</span><span>🥉 ${coin(t.prize[2])}</span></div>
        <span class="meta">${t.laps} voltas · rivais com velocidade ~${t.rival.toFixed(1)} · <b class="odds ${odds[1]}">${odds[0]}</b></span>
        <button class="btn ${locked ? 'gray' : 'green'}" data-race="${t.id}" ${locked || s.coins < t.fee ? 'disabled' : ''}>${locked ? `Nível ${t.lvl}` : `Correr · inscrição ${coin(t.fee)}`}</button>
      </div>`;
    }).join('');
    return `<h3 class="sect">Escolha o carro</h3><div class="picks">${picks}</div>${statBars(my)}<h3 class="sect">Campeonatos</h3><div class="grid one">${tiers}</div>
      <div class="reqnote" style="text-align:center">Na corrida, toque em NITRO nas retas! Você tem 3 cargas.</div>`;
  }

  function detail(car) {
    const s = ctx.state;
    const st = L.carStats(car);
    let opts = '';
    if (sub === 'visual') {
      const tabs = PART_TABS.map((t) => `<button class="tab ${partTab === t.id ? 'on' : ''}" data-ptab="${t.id}">${icon(t.icon)}${t.name}</button>`).join('');
      const list = PARTS[partTab].map((p) => {
        const locked = p.lvl > s.level;
        const on = car[partTab] === p.id;
        const vis = partTab === 'color'
          ? `<span class="swatch" style="background:${p.hex}"></span>`
          : `<img class="pimg" src="${ctx.thumbs.part(partTab, p.id)}" alt="">`;
        return `<button class="opt ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-style="${p.id}">${vis}<span>${p.name}</span><span class="price">${locked ? `🔒 Nv ${p.lvl}` : on ? '✔ Atual' : coin(PART_COST[partTab])}</span></button>`;
      }).join('');
      opts = `<div id="tabs" class="ptabs">${tabs}</div><div class="optrow">${list}</div>`;
    } else {
      opts = Object.entries(PERF).map(([k, d]) => {
        const lv = car[k];
        const max = lv >= d.max;
        const cost = max ? 0 : d.cost[lv - d.start];
        return `<div class="perf"><div><b>${d.name}</b><span>${d.desc}</span><div class="pips">${Array.from({ length: d.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
          <button class="btn ${max ? 'gray' : 'green'}" data-tune="${k}" ${max || s.coins < cost ? 'disabled' : ''}>${max ? 'Máximo' : coin(cost)}</button></div>`;
      }).join('');
    }
    return `<div class="detail">
        <div id="viewer"></div>
        <div class="dinfo"><h3>${carName(car)}</h3>${statBars(st)}<span class="meta">Valor de venda: ${coin(L.carValue(car))}</span></div>
      </div>
      <div class="mtabs"><button class="tab ${sub === 'visual' ? 'on' : ''}" data-sub="visual">${icon('estilo')} Visual</button><button class="tab ${sub === 'perf' ? 'on' : ''}" data-sub="perf">${icon('motor')} Desempenho</button></div>
      ${opts}
      <div class="row">
        <button class="btn gray" data-back>← Voltar</button>
        <button class="btn blue" data-goRace>${icon('corrida', 'bico')} Correr</button>
        <button class="btn yellow" data-sell>Vender ${coin(L.carValue(car))}</button>
      </div>`;
  }

  function bind(box, car) {
    const s = ctx.state;
    box.querySelectorAll('[data-car]').forEach((b) => b.onclick = () => { sfx.play('click'); carId = Number(b.dataset.car); sub = 'visual'; ctx.rerender(render); });
    box.querySelector('[data-back]')?.addEventListener('click', () => { sfx.play('click'); carId = null; ctx.rerender(render); });
    box.querySelectorAll('[data-sub]').forEach((b) => b.onclick = () => { sfx.play('click'); sub = b.dataset.sub; ctx.rerender(render); });
    box.querySelectorAll('[data-ptab]').forEach((b) => b.onclick = () => { sfx.play('click'); partTab = b.dataset.ptab; ctx.rerender(render); });
    box.querySelectorAll('[data-style]').forEach((b) => b.onclick = () => {
      const r = L.restyle(s, car.id, partTab, b.dataset.style);
      if (!r.ok) { if (r.reason === 'coins') ctx.toast('Moedas insuficientes'); if (r.reason === 'level') ctx.toast(`Libera no nível ${r.need}`); if (r.reason !== 'same') sfx.play('error'); return; }
      sfx.play(partTab === 'color' ? 'spray' : 'pop');
      ctx.afterChange();
      ctx.rerender(render);
    });
    box.querySelectorAll('[data-tune]').forEach((b) => b.onclick = () => {
      const r = L.tune(s, car.id, b.dataset.tune);
      if (!r.ok) { sfx.play('error'); return; }
      sfx.play('build');
      ctx.afterChange();
      ctx.rerender(render);
    });
    box.querySelector('[data-sell]')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      if (!btn.dataset.sure) { btn.dataset.sure = '1'; btn.innerHTML = 'Toque de novo para vender'; return; }
      const rect = btn.getBoundingClientRect();
      const r = L.sellCar(s, car.id);
      if (!r) return;
      sfx.play('cash');
      ctx.flyCoins({ x: rect.left + rect.width / 2, y: rect.top }, r.value);
      carId = null;
      ctx.afterChange();
      ctx.world.sync(s);
      ctx.rerender(render);
    });
    box.querySelector('[data-goRace]')?.addEventListener('click', () => { sfx.play('click'); raceCar = car.id; carId = null; tab = 'corridas'; ctx.rerender(render); });
    box.querySelectorAll('[data-restore]').forEach((b) => b.onclick = () => {
      const r = L.startRestore(s, Number(b.dataset.restore));
      if (!r.ok) { sfx.play('error'); ctx.toast(r.reason === 'garage' ? 'Garagem cheia: venda um carro' : 'Box de Restauração ocupado'); return; }
      sfx.play('car');
      ctx.closeModal();
      ctx.world.carToBay(r.c, r.b, null);
      ctx.world.panTo(ctx.world.buildViews.get(r.b.id).g.position.clone(), 1.3);
      ctx.afterChange();
    });
    box.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => {
      const r = L.buyWreck(s, Number(b.dataset.buy));
      if (!r.ok) { sfx.play('error'); ctx.toast(r.reason === 'full' ? 'Limite de projetos atingido' : 'Moedas insuficientes'); return; }
      sfx.play('cash');
      ctx.toast('Sucata comprada! Restaure no Box 🔧');
      tab = 'colecao';
      ctx.afterChange();
      ctx.rerender(render);
    });
    box.querySelectorAll('[data-racecar]').forEach((b) => b.onclick = () => { sfx.play('click'); raceCar = Number(b.dataset.racecar); ctx.rerender(render); });
    box.querySelectorAll('[data-race]').forEach((b) => b.onclick = () => {
      const e = L.enterRace(s, b.dataset.race, raceCar);
      if (!e.ok) { sfx.play('error'); return; }
      ctx.afterChange();
      ctx.closeModal();
      ctx.startRace(e);
    });
    box.querySelector('[data-track]')?.addEventListener('click', () => { ctx.closeModal(); ctx.buyTrack(); });
  }

  ctx.openModal(render, { onClose: () => ctx.viewer.unmount(), wide: true });
}
