// Sessão local: roda a simulação no navegador com bots.
// O futuro `OnlineGame` terá a MESMA interface (join, setInput, chooseUpgrade,
// respawn, update, drainEvents, world, localId), trocando a simulação local
// por mensagens WebSocket com o servidor — o resto do cliente não muda.
import { createWorld, addPlayer, spawnPlayer, step, chooseUpgrade } from '../shared/sim.js';
import { botThink, makeBotProfile, pickBotUpgrade } from '../shared/bots.js';
import { CFG } from '../shared/constants.js';

const TICK = 1 / CFG.tickRate;

export class LocalGame {
  constructor({ bots = 15 } = {}) {
    this.world = createWorld();
    this.inputs = new Map();
    this.localId = null;
    this.acc = 0;
    const used = new Set();
    for (let i = 0; i < bots; i++) {
      const prof = makeBotProfile(used);
      used.add(prof.name);
      addPlayer(this.world, prof);
    }
    // Aquece a arena para os bots já terem níveis variados.
    for (let i = 0; i < CFG.tickRate * 25; i++) this.tick();
    this.world.events = [];
  }

  get me() {
    return this.localId ? this.world.players.get(this.localId) : null;
  }

  join(name, color) {
    if (this.me) {
      Object.assign(this.me, { name, color });
      if (!this.me.alive) spawnPlayer(this.world, this.me);
      return this.localId;
    }
    const p = addPlayer(this.world, { name, color });
    this.localId = p.id;
    return p.id;
  }

  setInput(inp) {
    if (!this.localId) return;
    // Não perde um dash apertado num frame em que nenhum tick rodou.
    const prev = this.inputs.get(this.localId);
    if (prev?.dash) inp.dash = true;
    this.inputs.set(this.localId, inp);
  }

  chooseUpgrade(i) {
    return chooseUpgrade(this.world, this.localId, i);
  }

  respawn() {
    const p = this.me;
    if (p && !p.alive) spawnPlayer(this.world, p);
  }

  tick() {
    const w = this.world;
    for (const p of w.players.values()) {
      if (!p.isBot || !p.alive) continue;
      this.inputs.set(p.id, botThink(w, p, TICK));
      if (p.choices && Math.random() < 0.05) chooseUpgrade(w, p.id, pickBotUpgrade(p));
    }
    step(w, TICK, this.inputs);
    // O dash do humano é um "toque": consome após o tick.
    const mine = this.localId && this.inputs.get(this.localId);
    if (mine) mine.dash = false;
  }

  update(dt) {
    this.acc += Math.min(dt, 0.25);
    while (this.acc >= TICK) {
      this.tick();
      this.acc -= TICK;
    }
  }

  drainEvents() {
    const e = this.world.events;
    this.world.events = [];
    return e;
  }
}
