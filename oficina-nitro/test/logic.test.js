// Testa as regras da oficina sem navegador: simula ~60 minutos de jogo automático.
import assert from 'node:assert/strict';
import * as L from '../public/src/logic.js';
import { BUILDINGS, PARTS, RACE_TIERS, LAND, MAX_W } from '../public/src/data.js';

const s = L.newState();
assert.equal(s.buildings.length, 6);
assert.ok(L.canPlace(s, 'arvore', 10, 2), 'espaço livre deveria aceitar árvore');
assert.ok(!L.canPlace(s, 'arvore', 4, 5), 'corredor do elevador não pode ser bloqueado');
assert.ok(!L.canPlace(s, 'elevador', 15, 0), 'fora do terreno');

// Save antigo (v1) é migrado.
const old = JSON.parse(JSON.stringify(s));
delete old.lotW; delete old.garage; delete old.track; old.v = 1;
const mig = L.migrate(old);
assert.equal(mig.lotW, 16);
assert.ok(Array.isArray(mig.garage));

const ev = [];
let customs = 0, perfect = 0, angry = 0, races = 0, wins = 0, built = 0;
const tryPlace = (type) => {
  if (!L.canBuy(s, type).ok) return false;
  if (BUILDINGS[type].decor && L.count(s, type) >= 6) return false;
  for (let z = 0; z < 9; z++) for (let x = 0; x < s.lotW; x++) if (L.canPlace(s, type, x, z)) { L.place(s, type, x, z); return true; }
  return false;
};
for (let t = 0; t < 60 * 60; t += 0.25) {
  L.tick(s, 0.25, ev);
  for (const e of ev) { if (e.type === 'leave') angry++; if (e.type === 'built') built++; }
  ev.length = 0;
  for (const c of [...s.queue]) L.assign(s, c.id);
  for (const b of s.buildings) {
    if (b.build) { L.speedUp(s, b.id); continue; }
    if (!b.job) continue;
    if (b.job.state === 'work') { L.speedUp(s, b.id); continue; }
    if (b.job.state === 'done') { L.collect(s, b.id); continue; }
    if (b.job.state === 'custom') {
      const spec = { ...b.job.c.car };
      for (const r of b.job.c.job.reqs) spec[r.part] = r.value;
      const r = L.deliverCustom(s, b.id, spec);
      customs++;
      if (r.stars === 3) perfect++;
    }
  }
  for (const b of s.buildings) if (b.type === 'loja') L.collectLoja(s, b.id);
  for (const m of [...s.missions]) if (m.progress >= m.target) L.claimMission(s, m.id);
  if (L.nextLand(s) && s.coins > L.nextLand(s).cost * 1.5) L.buyLand(s);
  if (!s.track && s.coins > 9000) L.buyTrack(s);
  if (t % 5 === 0) for (const type of ['posto', 'lavajato', 'restauracao', 'showroom', 'elevador', 'loja', 'arvore', 'palmeira']) tryPlace(type);
  for (const b of s.buildings) if (L.upgradeCost(b) != null && s.coins > L.upgradeCost(b) * 3) L.upgrade(s, b.id);
  // Leilão → restauração → preparação → corrida → venda.
  if (L.has(s, 'restauracao')) {
    const a = L.refreshAuction(s);
    if (a.offers.length && s.coins > 3000) L.buyWreck(s, a.offers[0].id);
    for (const p of [...s.projects]) L.startRestore(s, p.id);
  }
  for (const car of s.garage) {
    if (s.coins > 6000) for (const k of ['motor', 'turbo', 'pneus']) L.tune(s, car.id, k);
    if (s.coins > 6000) L.restyle(s, car.id, 'wheels', 'esportiva');
  }
  if (s.track && s.garage.length && Math.random() < 0.01) {
    const tier = [...RACE_TIERS].reverse().find((r) => r.lvl <= s.level && r.fee * 3 < s.coins);
    if (tier) {
      const e = L.enterRace(s, tier.id, s.garage[0].id);
      if (e.ok) {
        const pos = e.stats.top > e.rivals[0].top ? 1 : 3;
        const r = L.finishRace(s, tier.id, pos);
        races++;
        if (r.trophy) wins++;
      }
    }
  }
  if (s.garage.length >= 5) L.sellCar(s, s.garage[s.garage.length - 1].id);
}
assert.ok(s.level >= 8, `nível baixo: ${s.level}`);
assert.ok(customs > 10 && perfect === customs, 'personalizações corretas deveriam dar 3 estrelas');
assert.ok(s.lotW === MAX_W, `terreno não expandiu: ${s.lotW}`);
assert.ok(s.land.length === LAND.length);
assert.ok(s.track, 'pista não foi comprada');
assert.ok(L.has(s, 'posto') && s.stats.fuels > 0, 'posto não atendeu ninguém');
assert.ok(s.stats.restored > 0, 'nenhum carro restaurado');
assert.ok(races > 0, 'nenhuma corrida');
assert.ok(built > 5, 'obras deveriam terminar');
assert.ok(Number.isFinite(s.coins) && s.coins >= 0);
assert.ok(JSON.parse(JSON.stringify(s)).buildings.length === s.buildings.length, 'estado precisa ser JSON');
for (const b of s.buildings) {
  assert.ok(BUILDINGS[b.type]);
  assert.ok(b.x + BUILDINGS[b.type].w <= s.lotW, 'construção fora do terreno');
}

const off = L.applyOffline(s, 3600);
assert.ok(off.seconds === 3600);
const d = L.dailyAvailable(s);
assert.ok(d && L.claimDaily(s) && !L.dailyAvailable(s), 'presente diário só uma vez por dia');

console.log(`OK — 60 min simulados: nível ${s.level}, ${s.stats.delivered} clientes (${s.stats.fuels} no posto, ${s.stats.vip} VIP), ${customs} personalizações, ${built} obras, terreno ${s.lotW} colunas`);
console.log(`   restaurados ${s.stats.restored}, coleção ${s.garage.length}, vendidos ${s.stats.sold}, corridas ${races} (${wins} vitórias), fama ${L.fame(s)}, moedas ${s.coins}, desistências ${angry}`);
console.log('   peças liberadas:', Object.entries(PARTS).map(([k, l]) => `${k} ${l.filter((p) => p.lvl <= s.level).length}/${l.length}`).join(', '));
