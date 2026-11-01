// Testa as regras da oficina sem navegador: simula ~40 minutos de jogo automático.
import assert from 'node:assert/strict';
import * as L from '../public/src/logic.js';
import { BUILDINGS, PARTS } from '../public/src/data.js';

const s = L.newState();
assert.equal(s.buildings.length, 6);
assert.ok(L.canPlace(s, 'arvore', 10, 2), 'espaço livre deveria aceitar árvore');
assert.ok(!L.canPlace(s, 'arvore', 4, 5), 'corredor do elevador não pode ser bloqueado');
assert.ok(!L.canPlace(s, 'elevador', 15, 0), 'fora do terreno');

const ev = [];
let customs = 0, perfect = 0, angry = 0;
for (let t = 0; t < 40 * 60; t += 0.25) {
  L.tick(s, 0.25, ev);
  for (const e of ev) if (e.type === 'leave') angry++;
  ev.length = 0;
  for (const c of [...s.queue]) L.assign(s, c.id);
  for (const b of s.buildings) {
    if (!b.job) continue;
    if (b.job.state === 'work') L.speedUp(s, b.id);
    if (b.job.state === 'done') { L.collect(s, b.id); continue; }
    if (b.job.state === 'custom') {
      const spec = { ...b.job.c.car };
      for (const r of b.job.c.job.reqs) spec[r.part] = r.value;
      const r = L.deliverCustom(s, b.id, spec);
      customs++;
      if (r.stars === 3) perfect++;
    }
  }
  if (s.buildings.some((b) => b.type === 'loja')) for (const b of s.buildings) if (b.type === 'loja') L.collectLoja(s, b.id);
  for (const m of [...s.missions]) if (m.progress >= m.target) L.claimMission(s, m.id);
  // Compra o que der, em lugares livres.
  for (const type of ['lavajato', 'elevador', 'loja', 'arvore', 'banco']) {
    if (!L.canBuy(s, type).ok) continue;
    outer: for (let z = 0; z < 9; z++) for (let x = 0; x < 16; x++) if (L.canPlace(s, type, x, z)) { L.place(s, type, x, z); break outer; }
  }
  for (const b of s.buildings) if (L.upgradeCost(b) != null && s.coins > L.upgradeCost(b) * 3) L.upgrade(s, b.id);
}
assert.ok(s.level >= 5, `nível baixo: ${s.level}`);
assert.ok(customs > 10 && perfect === customs, 'personalizações perfeitas deveriam dar 3 estrelas');
assert.ok(s.coins >= 0 && Number.isFinite(s.coins));
assert.ok(JSON.parse(JSON.stringify(s)).buildings.length === s.buildings.length, 'estado precisa ser JSON');
for (const b of s.buildings) assert.ok(BUILDINGS[b.type]);

const off = L.applyOffline(s, 3600);
assert.ok(off.seconds === 3600);
const d = L.dailyAvailable(s);
assert.ok(d && L.claimDaily(s) && !L.dailyAvailable(s), 'presente diário só uma vez por dia');

console.log(`OK — 40 min simulados: nível ${s.level}, ${s.stats.delivered} clientes, ${customs} personalizações, ${s.buildings.length} construções, fama ${L.fame(s)}, moedas ${s.coins}, clientes que desistiram ${angry}`);
console.log('Peças liberadas no nível atual:', Object.entries(PARTS).map(([k, l]) => `${k} ${l.filter((p) => p.lvl <= s.level).length}/${l.length}`).join(', '));
