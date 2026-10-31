// Sessão online: mesma interface do LocalGame, mas o estado vem do servidor.
// Os outros jogadores são suavizados entre snapshots (20/s) e extrapolados pela velocidade.
import { WORLD_SIZE } from '../shared/constants.js';

const SEND_HZ = 30;

export class OnlineGame {
  constructor(url) {
    this.url = url;
    this.world = { t: 0, size: WORLD_SIZE, players: new Map(), bullets: [], orbs: [], powerups: [], events: [], kingId: null };
    this.localId = null;
    this.status = 'connecting'; // connecting | open | closed
    this.onStatus = null;
    this.queue = [];
    this.lastInput = null;
    this.sendT = 0;
    this.dashPending = false;
    this.ping = 0;
    this.lastSnap = 0;
  }

  get me() {
    return this.localId ? this.world.players.get(this.localId) : null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 6000);
      ws.onopen = () => { clearTimeout(timer); this.setStatus('open'); resolve(); };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('erro de conexão')); };
      ws.onclose = () => { this.setStatus('closed'); };
      ws.onmessage = (ev) => this.onMessage(JSON.parse(ev.data));
    });
  }

  setStatus(s) {
    this.status = s;
    this.onStatus?.(s);
  }

  send(obj) {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(obj));
  }

  join(name, color) {
    if (this.localId) {
      this.send({ t: 'profile', name, color });
      this.respawn();
      return this.localId;
    }
    this.send({ t: 'join', name, color });
    return null;
  }

  setInput(inp) {
    if (inp.dash) this.dashPending = true;
    this.lastInput = inp;
  }

  chooseUpgrade(i) {
    const me = this.me;
    if (!me || !me.choices || !me.choices[i]) return false;
    this.send({ t: 'up', i });
    me.choices = null; // otimista: o servidor confirma no próximo snapshot
    return true;
  }

  respawn() {
    this.send({ t: 'respawn' });
  }

  onMessage(m) {
    if (m.t === 'welcome') {
      this.localId = m.id;
      this.world.size = m.size;
      return;
    }
    if (m.t !== 's') return;
    const w = this.world;
    const now = performance.now();
    if (this.lastSnap) this.ping = now - this.lastSnap;
    this.lastSnap = now;
    w.t = m.time;
    w.kingId = m.king;

    const seen = new Set();
    for (const s of m.players) {
      seen.add(s.id);
      let p = w.players.get(s.id);
      const fresh = !p || (!p.alive && s.alive);
      if (!p) { p = { stats: { multishot: 1, dashCd: 3.2 } }; w.players.set(s.id, p); }
      const { x, y, angle, ms, ...rest } = s;
      Object.assign(p, rest);
      p.stats.multishot = ms;
      p.tx = x; p.ty = y; p.ta = angle;
      if (fresh) { p.x = x; p.y = y; p.angle = angle; }
    }
    for (const id of w.players.keys()) if (!seen.has(id)) w.players.delete(id);

    const me = this.me;
    if (me && m.me) {
      Object.assign(me, m.me);
      me.stats.dashCd = m.me.dashMax;
      me.r = me.r || 20;
    }
    w.orbs = m.orbs.map(([id, x, y, v]) => ({ id, x, y, v, r: 5 + Math.sqrt(v) * 2.2 }));
    w.bullets = m.bullets.map(([id, x, y, vx, vy, r, color, life]) => ({ id, x, y, vx, vy, r, color, life }));
    w.powerups = m.powerups;
    if (m.events.length) w.events.push(...m.events);
  }

  update(dt) {
    const w = this.world;
    // Envia o input a ~30 Hz (o dash vai junto assim que apertado).
    this.sendT -= dt;
    if (this.lastInput && (this.sendT <= 0 || this.dashPending)) {
      const i = this.lastInput;
      this.send({ t: 'input', mx: i.mx, my: i.my, angle: i.angle, shoot: i.shoot, dash: this.dashPending });
      this.dashPending = false;
      this.sendT = 1 / SEND_HZ;
    }
    // Suavização: anda pela velocidade e corrige em direção à posição do servidor.
    const k = 1 - Math.pow(0.0001, dt);
    for (const p of w.players.values()) {
      if (p.tx === undefined) continue;
      p.tx += p.vx * dt; p.ty += p.vy * dt;
      p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
      if (p.id === this.localId && this.lastInput && Number.isFinite(this.lastInput.angle)) p.angle = this.lastInput.angle;
      else {
        let d = p.ta - p.angle;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        p.angle += d * k;
      }
      for (const b in p.buffs) p.buffs[b] = Math.max(0, p.buffs[b] - dt);
      if (p.dashCd !== undefined) p.dashCd -= dt;
      p.invuln = Math.max(0, p.invuln - dt);
    }
    for (const b of w.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
    w.t += dt;
  }

  drainEvents() {
    const e = this.world.events;
    this.world.events = [];
    return e;
  }

  close() {
    this.ws?.close();
  }
}
