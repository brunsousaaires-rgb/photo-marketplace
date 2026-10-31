// Uma sala online: roda a simulação autoritativa e completa com bots.
import { createWorld, addPlayer, removePlayer, spawnPlayer, step, chooseUpgrade } from '../public/shared/sim.js';
import { botThink, makeBotProfile, pickBotUpgrade } from '../public/shared/bots.js';
import { CFG } from '../public/shared/constants.js';

const TICK = 1 / CFG.tickRate;
const SEND_EVERY = 3; // 60 / 3 = 20 snapshots por segundo
const VIEW = 1500; // raio do que cada cliente recebe (orbes, tiros, eventos)
const GLOBAL_EVENTS = new Set(['kill', 'king']);

const r1 = (v) => Math.round(v * 10) / 10;
const COLOR_RE = /^(#[0-9a-f]{6}|rainbow|hsl\(\d{1,3}, ?\d{1,3}%, ?\d{1,3}%\))$/i;

export class Room {
  constructor(id, { size = 16, maxHumans = 24, minBots = 4 } = {}) {
    this.id = id;
    this.size = size;
    this.maxHumans = maxHumans;
    this.minBots = minBots;
    this.world = createWorld();
    this.inputs = new Map();
    this.clients = new Map(); // playerId -> { ws, lastSeen }
    this.tickN = 0;
    this.pending = [];
    this.balanceBots();
    for (let i = 0; i < CFG.tickRate * 20; i++) this.tick(false);
    this.pending = [];
  }

  get humans() { return this.clients.size; }
  hasRoom() { return this.humans < this.maxHumans; }

  balanceBots() {
    const w = this.world;
    const bots = [...w.players.values()].filter((p) => p.isBot);
    const want = Math.max(this.minBots, this.size - this.humans);
    const used = new Set([...w.players.values()].map((p) => p.name));
    for (let i = bots.length; i < want; i++) {
      const prof = makeBotProfile(used);
      used.add(prof.name);
      addPlayer(w, prof);
    }
    if (bots.length > want) {
      // Remove primeiro os bots mortos e os mais fracos.
      bots.sort((a, b) => (a.alive - b.alive) || (a.score - b.score));
      for (const b of bots.slice(0, bots.length - want)) { removePlayer(w, b.id); this.inputs.delete(b.id); }
    }
  }

  join(ws, msg) {
    const name = String(msg.name || 'Jogador').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'Jogador';
    const color = COLOR_RE.test(String(msg.color)) ? String(msg.color) : '#36e2ff';
    const p = addPlayer(this.world, { name, color });
    this.clients.set(p.id, { ws, lastSeen: Date.now() });
    this.balanceBots();
    ws.send(JSON.stringify({ t: 'welcome', id: p.id, size: this.world.size, room: this.id }));
    return p.id;
  }

  leave(id) {
    this.clients.delete(id);
    this.inputs.delete(id);
    removePlayer(this.world, id);
    this.balanceBots();
  }

  handle(id, msg) {
    const p = this.world.players.get(id);
    if (!p) return;
    const c = this.clients.get(id);
    if (c) c.lastSeen = Date.now();
    switch (msg.t) {
      case 'input': {
        const num = (v) => (Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);
        const prev = this.inputs.get(id);
        this.inputs.set(id, {
          mx: num(msg.mx), my: num(msg.my),
          angle: Number.isFinite(msg.angle) ? msg.angle : null,
          shoot: !!msg.shoot,
          dash: !!msg.dash || !!prev?.dash, // dash é um toque: vale até o próximo tick
        });
        break;
      }
      case 'up': chooseUpgrade(this.world, id, Number(msg.i) | 0); break;
      case 'respawn': if (!p.alive) spawnPlayer(this.world, p); break;
      case 'profile': {
        const color = String(msg.color);
        if (COLOR_RE.test(color)) p.color = color;
        if (msg.name) p.name = String(msg.name).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || p.name;
        break;
      }
    }
  }

  tick(send = true) {
    const w = this.world;
    for (const p of w.players.values()) {
      if (!p.isBot || !p.alive) continue;
      this.inputs.set(p.id, botThink(w, p, TICK));
      if (p.choices && Math.random() < 0.05) chooseUpgrade(w, p.id, pickBotUpgrade(p));
    }
    step(w, TICK, this.inputs);
    for (const id of this.clients.keys()) {
      const inp = this.inputs.get(id);
      if (inp) inp.dash = false;
    }
    if (w.events.length) { this.pending.push(...w.events); w.events = []; }
    this.tickN++;
    if (send && this.tickN % SEND_EVERY === 0) this.broadcast();
  }

  broadcast() {
    const w = this.world;
    const players = [];
    for (const p of w.players.values()) {
      players.push({
        id: p.id, name: p.name, color: p.color, alive: p.alive, x: r1(p.x), y: r1(p.y), vx: r1(p.vx), vy: r1(p.vy),
        angle: Math.round(p.angle * 1000) / 1000, r: r1(p.r), hp: r1(p.hp), maxHp: Math.round(p.maxHp), level: p.level,
        score: Math.floor(p.score), kills: p.kills, invuln: r1(p.invuln), dashT: r1(p.dashT), ms: p.stats.multishot,
        buffs: { escudo: r1(p.buffs.escudo), furia: r1(p.buffs.furia), turbo: r1(p.buffs.turbo) },
      });
    }
    const powerups = w.powerups.map((u) => ({ id: u.id, kind: u.kind, x: r1(u.x), y: r1(u.y) }));
    const events = this.pending;
    this.pending = [];

    for (const [id, c] of this.clients) {
      if (c.ws.readyState !== 1) continue;
      const me = w.players.get(id);
      if (!me) continue;
      // Quem está morto assiste quem o derrubou.
      const focus = !me.alive && me.lastLife?.killerId && w.players.get(me.lastLife.killerId)?.alive ? w.players.get(me.lastLife.killerId) : me;
      const fx = focus.x, fy = focus.y;
      const near = (o) => Math.abs(o.x - fx) < VIEW && Math.abs(o.y - fy) < VIEW;
      const msg = {
        t: 's', time: r1(w.t), king: w.kingId, players, powerups,
        orbs: w.orbs.filter(near).map((o) => [o.id, Math.round(o.x), Math.round(o.y), o.v]),
        bullets: w.bullets.filter(near).map((b) => [b.id, Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), r1(b.r), b.color, r1(b.life)]),
        events: events.filter((e) => GLOBAL_EVENTS.has(e.type) || e.id === id || e.target === id || e.source === id || e.x === undefined || near(e)),
        me: {
          xp: Math.floor(me.xp), xpNext: me.xpNext, choices: me.choices, pending: me.pending, upgrades: me.upgrades,
          dashCd: r1(me.dashCd), dashMax: r1(me.stats.dashCd), streak: me.streak, lastLife: me.lastLife,
        },
      };
      c.ws.send(JSON.stringify(msg));
    }
  }
}
