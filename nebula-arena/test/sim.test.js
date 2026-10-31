// Teste de fumaça da simulação: roda 3 minutos de partida só com bots em Node.
import assert from 'node:assert/strict';
import { createWorld, addPlayer, step, chooseUpgrade, leaderboard, snapshot } from '../public/shared/sim.js';
import { botThink, makeBotProfile, pickBotUpgrade } from '../public/shared/bots.js';

const w = createWorld();
const used = new Set();
for (let i = 0; i < 16; i++) { const p = makeBotProfile(used); used.add(p.name); addPlayer(w, p); }
const inputs = new Map();
let kills = 0, levelups = 0, upgrades = 0;
const T = 1 / 60;
const t0 = performance.now();
for (let i = 0; i < 60 * 180; i++) {
  for (const p of w.players.values()) {
    if (!p.alive) continue;
    inputs.set(p.id, botThink(w, p, T));
    if (p.choices && chooseUpgrade(w, p.id, pickBotUpgrade(p))) upgrades++;
  }
  step(w, T, inputs);
  for (const e of w.events) { if (e.type === 'kill') kills++; if (e.type === 'levelup') levelups++; }
  w.events = [];
  for (const p of w.players.values()) {
    if (!p.alive) continue;
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.hp), `estado inválido: ${p.name}`);
    assert.ok(p.x >= 0 && p.y >= 0 && p.x <= w.size && p.y <= w.size, 'fora da arena');
  }
}
const ms = performance.now() - t0;
assert.ok(kills > 10, `poucos abates: ${kills}`);
assert.ok(levelups > 30, `poucos níveis: ${levelups}`);
assert.ok(upgrades > 30, 'bots não escolhem melhorias');
assert.ok(JSON.stringify(snapshot(w)).length > 100);
const top = leaderboard(w, 3).map((p) => `${p.name} (nv ${p.level}, ${Math.floor(p.score)} pts, ${p.kills} abates)`);
console.log(`OK — 3 min simulados em ${ms.toFixed(0)} ms | abates ${kills} | níveis ${levelups} | orbes ${w.orbs.length}`);
console.log('Top 3:', top.join(' | '));
