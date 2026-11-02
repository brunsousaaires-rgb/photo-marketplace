// Corrida na pista: 4 carros, contagem regressiva, botão de NITRO, câmera seguindo o seu carro.
import * as THREE from 'three';
import { TRACK_PATH, lerpAngle } from './world.js';
import * as L from './logic.js';

// Grid de largada em duas filas (a pista comporta dois carros lado a lado).
const GRID = [[-1.2, 0], [1.2, -2.2], [-1.2, -4.6], [1.2, -6.8]];
const START = TRACK_PATH.L; // largada no meio da reta da frente

export class Race {
  constructor(ctx, entry, onEnd) {
    this.ctx = ctx;
    this.entry = entry;
    this.onEnd = onEnd;
    this.tier = entry.tier;
    this.total = TRACK_PATH.total * this.tier.laps;
    const grid = [...GRID].sort(() => Math.random() - 0.5);
    const me = { name: 'Você', me: true, spec: entry.car, st: entry.stats, nitro: 3 };
    const all = [me, ...entry.rivals.map((r) => ({ name: r.name, spec: r.spec, st: { top: r.top, acc: r.acc, grip: r.grip }, nitro: 1 + Math.floor(Math.random() * 2) }))];
    this.racers = all.map((r, i) => {
      const g = ctx.world.addRaceCar(r.spec);
      return { ...r, g, lane: grid[i][0], s: START + grid[i][1], v: 0, nitroT: 0, done: false, place: 0, heading: Math.PI / 2 };
    });
    this.me = this.racers[0];
    this.finished = [];
    this.phase = 'count';
    this.t = 3.6;
    this.time = 0;
    this.lastBeep = 4;
    this.place(0);
    ctx.world.raceHype = true;
    ctx.world.follow(this.me.g.position.clone(), 1.5);
    this.ui();
    ctx.sfx.play('engine');
  }

  ui() {
    const $ = (s) => document.querySelector(s);
    $('#race').hidden = false;
    $('#raceName').textContent = this.tier.name;
    $('#raceCount').textContent = '';
    this.updateNitroBtn();
    $('#nitroBtn').onclick = () => this.nitro();
    this.key = (e) => { if (e.key === ' ' || e.key === 'Shift') { e.preventDefault(); this.nitro(); } };
    addEventListener('keydown', this.key);
  }

  updateNitroBtn() {
    const b = document.querySelector('#nitroBtn');
    b.querySelector('i').textContent = '🔥'.repeat(this.me.nitro) || '—';
    b.disabled = this.me.nitro <= 0 || this.phase !== 'run';
    b.classList.toggle('on', this.me.nitroT > 0);
  }

  nitro() {
    const m = this.me;
    if (this.phase !== 'run' || m.nitro <= 0 || m.nitroT > 0 || m.done) return;
    m.nitro--;
    m.nitroT = 1.8;
    this.ctx.sfx.play('nitro');
    this.updateNitroBtn();
  }

  place(dt) {
    for (const r of this.racers) {
      const p = TRACK_PATH.at(r.s);
      const nx = -p.tz, nz = p.tx;
      r.g.position.set(p.x + nx * r.lane, 0, p.z + nz * r.lane);
      const want = Math.atan2(p.tx, p.tz);
      r.heading = dt ? lerpAngle(r.heading, want, Math.min(1, dt * 10)) : want;
      r.g.rotation.y = r.heading;
      const u = r.g.userData;
      for (const w of u.wheels) w.rotation.x += (r.v * dt) / u.wheelR;
      u.body.position.y = Math.sin(this.time * 20 + r.lane) * 0.025 * Math.min(1, r.v / 5);
      u.body.rotation.x = r.nitroT > 0 ? -0.08 : 0;
    }
  }

  update(dt) {
    const ctx = this.ctx;
    this.time += dt;
    const $ = (s) => document.querySelector(s);
    if (this.phase === 'count') {
      this.t -= dt;
      const n = Math.ceil(this.t - 0.6);
      if (n !== this.lastBeep && n >= 1 && n <= 3) { this.lastBeep = n; $('#raceCount').innerHTML = `<span class="pop ol">${n}</span>`; ctx.sfx.play('beep'); }
      if (this.t <= 0.6) {
        this.phase = 'run';
        $('#raceCount').innerHTML = '<span class="pop ol go">VAI!</span>';
        ctx.sfx.play('go');
        this.updateNitroBtn();
        setTimeout(() => { if ($('#raceCount')) $('#raceCount').innerHTML = ''; }, 900);
      }
      this.place(dt);
      if (ctx.world.followCam) ctx.world.followCam.pos.copy(this.me.g.position);
      return;
    }
    for (const r of this.racers) {
      const p = TRACK_PATH.at(r.s);
      let target = r.st.top * (p.curve ? Math.min(1, r.st.grip + 0.18) : 1);
      if (!r.me) target *= 1 + Math.sin(this.time * 0.7 + r.lane * 3) * 0.03;
      if (r.done) target *= 0.55;
      if (r.nitroT > 0) { target *= 1.45; r.nitroT -= dt; }
      const acc = r.st.acc * (r.nitroT > 0 ? 2.2 : 1);
      r.v += Math.max(-14 * dt, Math.min(acc * dt, target - r.v));
      r.s += r.v * dt;
      if (!r.me && r.nitro > 0 && !p.curve && r.s - START > TRACK_PATH.total * 0.3 && Math.random() < dt * 0.18) { r.nitro--; r.nitroT = 1.6; }
      if (r.nitroT > 0 && Math.random() < dt * 30) {
        const back = new THREE.Vector3(-Math.sin(r.heading) * 1.9, 0.35, -Math.cos(r.heading) * 1.9).add(r.g.position);
        ctx.world.puff(back, Math.random() < 0.5 ? '#ff8a2a' : '#ffd23d', 0.2, 0.6, 0.35);
      }
      if (!r.done && r.s - START >= this.total) {
        r.done = true;
        this.finished.push(r);
        r.place = this.finished.length;
        if (r.me) {
          ctx.sfx.play(r.place === 1 ? 'win' : 'pop');
          $('#raceCount').innerHTML = `<span class="pop ol ${r.place === 1 ? 'go' : ''}">${r.place}º LUGAR!</span>`;
          this.endAt = this.time + 2.4;
        }
      }
    }
    this.place(dt);
    if (ctx.world.followCam) {
      ctx.world.followCam.pos.copy(this.me.g.position);
      ctx.world.followCam.zoom = this.me.nitroT > 0 ? 1.3 : 1.5;
    }
    this.updateNitroBtn();
    // Placar ao vivo.
    const order = [...this.finished, ...this.racers.filter((r) => !r.done).sort((a, b) => b.s - a.s)];
    const lap = Math.min(this.tier.laps, Math.floor(Math.max(0, this.me.s - START) / TRACK_PATH.total) + 1);
    $('#raceLap').textContent = `Volta ${lap}/${this.tier.laps}`;
    $('#racePos').innerHTML = order.map((r, i) => `<li class="${r.me ? 'me' : ''}"><b>${i + 1}º</b> ${r.name}</li>`).join('');
    if ((this.endAt && this.time >= this.endAt) || this.time > 150) this.finish(order);
  }

  finish(order) {
    if (this.over) return;
    this.over = true;
    const ctx = this.ctx;
    const pos = this.me.place || order.indexOf(this.me) + 1;
    const res = L.finishRace(ctx.state, this.tier, pos);
    for (const r of this.racers) ctx.world.removeObject(r.g);
    ctx.world.raceHype = false;
    ctx.world.unfocus();
    document.querySelector('#race').hidden = true;
    removeEventListener('keydown', this.key);
    this.onEnd({ ...res, position: pos, tier: this.tier, order: order.map((r) => r.name) });
  }
}
