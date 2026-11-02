// Minijogo do guincho: dirija pela avenida trocando de faixa, desvie dos obstáculos,
// pegue moedas e reboque o carro quebrado no fim do caminho.
import * as THREE from 'three';
import { buildTowTruck, buildCar, buildCone, buildBarrier, buildOil, buildCoin } from './models.js';
import { LOT_D } from './world.js';
import * as L from './logic.js';

const LANES = [LOT_D + 5.1, LOT_D + 7.0, LOT_D + 8.9];
const START_X = 112;
const END_X = -40;
const COIN_VALUE = 12;

export class TowRun {
  constructor(ctx, call, onEnd) {
    this.ctx = ctx;
    this.call = call;
    this.onEnd = onEnd;
    const w = ctx.world;
    w.towing = true;
    w.trafficPaused = true;
    w.clearTraffic();
    this.truck = buildTowTruck();
    this.truck.position.set(START_X, 0, LANES[1]);
    this.truck.rotation.y = -Math.PI / 2;
    w.scene.add(this.truck);
    this.lane = 1;
    this.speed = 0;
    this.slowT = 0;
    this.coins = 0;
    this.hits = 0;
    this.time = 0;
    this.phase = 'count';
    this.t = 2.2;
    this.objects = [];
    this.build();
    w.follow(this.truck.position.clone(), 1.25);
    this.ui();
    ctx.sfx.play('engine');
  }

  build() {
    const w = this.ctx.world;
    const add = (obj, x, lane, kind, extra = {}) => {
      obj.position.x = x;
      obj.position.z = LANES[lane];
      if (kind === 'car') obj.rotation.y = -Math.PI / 2;
      w.scene.add(obj);
      this.objects.push({ obj, kind, lane, len: kind === 'car' ? 3.4 : kind === 'barrier' ? 1 : kind === 'oil' ? 1.6 : 0.8, ...extra });
    };
    let x = START_X - 18;
    while (x > END_X + 14) {
      const r = Math.random();
      const lane = Math.floor(Math.random() * 3);
      if (r < 0.3) add(buildCone(), x, lane, 'cone');
      else if (r < 0.45) { add(buildCone(), x, lane, 'cone'); add(buildCone(), x, (lane + 1) % 3, 'cone'); }
      else if (r < 0.6) add(buildBarrier(), x, lane, 'barrier');
      else if (r < 0.72) add(buildOil(), x, lane, 'oil');
      else if (r < 0.84) {
        const c = buildCar({ type: ['hatch', 'sedan', 'van'][lane], color: ['azul', 'verde', 'laranja'][lane], wheels: 'padrao', spoiler: 'nenhum', neon: 'nenhum', decal: 'nenhum' });
        add(c, x, lane, 'car', { v: 4 + Math.random() * 2 });
      }
      // Fileira de moedas numa faixa livre.
      const free = [0, 1, 2].filter((l) => !this.objects.some((o) => o.lane === l && Math.abs(o.obj.position.x - x) < 3));
      if (free.length && Math.random() < 0.8) {
        const cl = free[Math.floor(Math.random() * free.length)];
        for (let k = 0; k < 3; k++) add(buildCoin(), x + 3 + k * 1.6, cl, 'coin');
      }
      x -= 7 + Math.random() * 4;
    }
    this.broken = buildCar(this.call.car, { driver: false });
    this.broken.position.set(END_X - 2, 0, LANES[1]);
    this.broken.rotation.y = -Math.PI / 2;
    w.scene.add(this.broken);
  }

  ui() {
    const $ = (s) => document.querySelector(s);
    $('#tow').hidden = false;
    $('#towCount').innerHTML = '';
    this.updateHud();
    const up = () => this.move(-1), down = () => this.move(1);
    $('#towUp').onclick = up;
    $('#towDown').onclick = down;
    this.key = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') { e.preventDefault(); up(); }
      if (k === 'arrowdown' || k === 's') { e.preventDefault(); down(); }
    };
    addEventListener('keydown', this.key);
    let sy = null;
    this.ts = (e) => { sy = e.touches?.[0]?.clientY ?? null; };
    this.te = (e) => {
      const y = e.changedTouches?.[0]?.clientY;
      if (sy != null && y != null && Math.abs(y - sy) > 30) (y < sy ? up : down)();
      sy = null;
    };
    addEventListener('touchstart', this.ts, { passive: true });
    addEventListener('touchend', this.te, { passive: true });
  }

  move(d) {
    if (this.phase !== 'run') return;
    const n = Math.max(0, Math.min(2, this.lane + d));
    if (n !== this.lane) { this.lane = n; this.ctx.sfx.play('click'); }
  }

  updateHud() {
    const $ = (s) => document.querySelector(s);
    $('#towCoins').innerHTML = `<i class="coin"></i>${this.coins}`;
    $('#towHits').textContent = this.hits ? `💥 ${this.hits}` : '✨ sem batidas';
    const k = Math.min(1, Math.max(0, (START_X - this.truck.position.x) / (START_X - END_X)));
    $('#towProg').style.width = (k * 100).toFixed(0) + '%';
  }

  update(dt) {
    const w = this.ctx.world, $ = (s) => document.querySelector(s);
    this.time += dt;
    const tr = this.truck, u = tr.userData;
    for (const b of u.beacons || []) b.visible = Math.sin(this.time * 12) > 0;
    if (this.phase === 'count') {
      this.t -= dt;
      $('#towCount').innerHTML = this.t > 0.6 ? '<span class="pop ol">Prepare-se!</span>' : '<span class="pop ol go">VAI!</span>';
      if (this.t <= 0) { this.phase = 'run'; $('#towCount').innerHTML = ''; }
      if (w.followCam) w.followCam.pos.copy(tr.position);
      return;
    }
    if (this.phase === 'run') {
      this.slowT = Math.max(0, this.slowT - dt);
      const target = this.slowT > 0 ? 6 : 15;
      this.speed += Math.max(-25 * dt, Math.min(8 * dt, target - this.speed));
      tr.position.x -= this.speed * dt;
      const z = LANES[this.lane];
      const dz = z - tr.position.z;
      tr.position.z += dz * Math.min(1, dt * 8);
      tr.rotation.y = -Math.PI / 2 - dz * 0.12;
      for (const wh of u.wheels) wh.rotation.x += (this.speed * dt) / 0.45;
      u.body.position.y = Math.sin(this.time * 18) * 0.03;
      if (Math.random() < dt * 10) w.puff(tr.position.clone().add(new THREE.Vector3(2.6, 0.4, 0.5)), '#cfd3da', 0.15, 0.5, 0.5);
      for (const o of this.objects) {
        if (o.done) continue;
        if (o.kind === 'car') o.obj.position.x -= o.v * dt;
        if (o.kind === 'coin') o.obj.rotation.y += dt * 4;
        const dx = Math.abs(o.obj.position.x - tr.position.x);
        if (dx > o.len / 2 + 1.7 || Math.abs(o.obj.position.z - tr.position.z) > 1.15) continue;
        o.done = true;
        if (o.kind === 'coin') {
          this.coins += COIN_VALUE;
          this.ctx.sfx.play('coin');
          w.scene.remove(o.obj);
        } else {
          this.hits++;
          this.slowT = o.kind === 'oil' ? 0.8 : 1.3;
          this.coins = Math.max(0, this.coins - 10);
          this.ctx.sfx.play(o.kind === 'oil' ? 'spray' : 'error');
          w.burst(o.obj.position.clone().setY(0.6), o.kind === 'oil' ? '#22252e' : '#ff8a2a', 12, 4, 0.18, 3);
          if (o.kind !== 'oil') { o.fly = { vy: 6, vx: -6 - this.speed * 0.4, rot: 6 }; }
        }
      }
      if (tr.position.x <= END_X + 4.2) {
        this.phase = 'hook';
        this.t = 1.6;
        this.speed = 0;
        this.ctx.sfx.play('build');
      }
      this.updateHud();
    }
    for (const o of this.objects) {
      if (!o.fly) continue;
      o.fly.vy -= 18 * dt;
      o.obj.position.x += o.fly.vx * dt;
      o.obj.position.y = Math.max(0, o.obj.position.y + o.fly.vy * dt);
      o.obj.rotation.z += o.fly.rot * dt;
    }
    if (this.phase === 'hook') {
      this.t -= dt;
      const k = Math.min(1, 1 - this.t / 1.6);
      // O carro quebrado sobe para a plataforma.
      const bedX = tr.position.x + 0.9, bedY = 1.06;
      this.broken.position.x += (bedX - this.broken.position.x) * Math.min(1, dt * 4);
      this.broken.position.z += (tr.position.z - this.broken.position.z) * Math.min(1, dt * 4);
      this.broken.position.y = bedY * Math.min(1, k * 1.3);
      this.broken.scale.setScalar(1 - 0.22 * k);
      if (this.t <= 0) { this.phase = 'done'; this.finish(); return; }
    }
    if (this.phase !== 'done' && w.followCam) w.followCam.pos.copy(tr.position);
  }

  finish() {
    const ctx = this.ctx, w = ctx.world;
    const res = L.finishTow(ctx.state, this.call, { done: true, hits: this.hits, coins: this.coins });
    for (const o of this.objects) w.scene.remove(o.obj);
    w.scene.remove(this.truck);
    w.scene.remove(this.broken);
    w.towing = false;
    w.trafficPaused = false;
    w.unfocus();
    document.querySelector('#tow').hidden = true;
    removeEventListener('keydown', this.key);
    removeEventListener('touchstart', this.ts);
    removeEventListener('touchend', this.te);
    this.onEnd(res);
  }
}
