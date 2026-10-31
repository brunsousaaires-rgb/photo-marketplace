// Renderização em Canvas 2D: câmera, partículas, glow, minimapa.
import { POWERUPS, ORB_COLORS } from '../shared/constants.js';

const TAU = Math.PI * 2;

export function colorOf(c, t) {
  if (c !== 'rainbow') return c;
  return `hsl(${(Math.floor(t * 12) * 10) % 360}, 95%, 62%)`;
}

export class Renderer {
  constructor(canvas) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.cam = { x: 1800, y: 1800, zoom: 1 };
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.shake = 0;
    this.flash = 0;
    this.sprites = new Map();
    this.time = 0;
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = innerWidth;
    this.h = innerHeight;
    this.c.width = Math.floor(this.w * this.dpr);
    this.c.height = Math.floor(this.h * this.dpr);
    this.c.style.width = this.w + 'px';
    this.c.style.height = this.h + 'px';
  }

  glow(color, r) {
    const key = color + '|' + r;
    let s = this.sprites.get(key);
    if (s) return s;
    s = document.createElement('canvas');
    s.width = s.height = r * 2;
    const g = s.getContext('2d');
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, color);
    grd.addColorStop(0.25, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.55;
    g.fillStyle = grd;
    g.fillRect(0, 0, r * 2, r * 2);
    if (this.sprites.size > 400) this.sprites.clear();
    this.sprites.set(key, s);
    return s;
  }

  worldToScreen(x, y) {
    return { x: (x - this.cam.x) * this.cam.zoom + this.w / 2, y: (y - this.cam.y) * this.cam.zoom + this.h / 2 };
  }

  follow(x, y, level, dt, instant = false) {
    const base = Math.max(0.5, Math.min(1.15, Math.min(this.w, this.h) / 950));
    const z = base * (1 - Math.min(level, 30) * 0.009);
    const k = instant ? 1 : 1 - Math.pow(0.0005, dt);
    this.cam.x += (x - this.cam.x) * k;
    this.cam.y += (y - this.cam.y) * k;
    this.cam.zoom += (z - this.cam.zoom) * (instant ? 1 : 1 - Math.pow(0.1, dt));
  }

  burst(x, y, color, n, speed = 260, size = 4, life = 0.6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = speed * (0.3 + Math.random());
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.5 + Math.random() * 0.8), max: life, color, size: size * (0.5 + Math.random()) });
    }
    if (this.particles.length > 1500) this.particles.splice(0, this.particles.length - 1500);
  }

  text(x, y, str, color, size = 18, life = 0.8) {
    this.texts.push({ x, y, str, color, size, life, max: life, vy: -70 });
    if (this.texts.length > 120) this.texts.shift();
  }

  handleEvents(events, world, localId) {
    const t = world.t;
    for (const e of events) {
      const near = this.onScreen(e.x, e.y, 200);
      switch (e.type) {
        case 'hit': {
          const target = world.players.get(e.target);
          if (near && target) {
            this.burst(e.x, e.y, colorOf(target.color, t), 5, 200, 3, 0.35);
            const mine = e.source === localId;
            if (mine || e.target === localId) this.text(e.x + (Math.random() - 0.5) * 30, e.y - target.r, '-' + e.dmg, mine ? '#fff' : '#ff6b81', mine ? 18 : 16);
          }
          if (e.target === localId) { this.shake = Math.min(18, this.shake + 7); this.flash = 0.25; }
          break;
        }
        case 'kill':
          if (near) {
            const c = colorOf(e.victimColor, t);
            this.burst(e.x, e.y, c, 40, 420, 6, 0.9);
            this.burst(e.x, e.y, '#ffffff', 12, 300, 3, 0.5);
            this.rings.push({ x: e.x, y: e.y, r: e.r, max: 0.5, life: 0.5, color: c });
          }
          if (e.killer === localId) { this.shake = Math.min(22, this.shake + 10); this.text(e.x, e.y - 30, '+' + e.bonus + ' XP', '#ffd35a', 24, 1.2); }
          if (e.victim === localId) this.shake = 30;
          break;
        case 'levelup':
          if (near) this.rings.push({ x: e.x, y: e.y, r: 30, max: 0.7, life: 0.7, color: '#ffd35a' });
          if (e.id === localId) this.text(e.x, e.y - 50, 'NÍVEL ' + e.level, '#ffd35a', 28, 1.4);
          break;
        case 'pickup':
          if (e.id === localId && e.v >= 3) this.burst(e.x, e.y, ORB_COLORS[e.v] || '#7af0ff', 4, 120, 3, 0.3);
          break;
        case 'power':
          if (near) { this.burst(e.x, e.y, POWERUPS[e.kind].color, 25, 300, 5, 0.7); this.rings.push({ x: e.x, y: e.y, r: 20, max: 0.6, life: 0.6, color: POWERUPS[e.kind].color }); }
          if (e.id === localId) this.text(e.x, e.y - 50, POWERUPS[e.kind].label + '!', POWERUPS[e.kind].color, 26, 1.3);
          break;
        case 'dash':
          if (near) {
            const p = world.players.get(e.id);
            if (p) this.burst(e.x, e.y, colorOf(p.color, t), 10, 150, 4, 0.4);
          }
          break;
        case 'block':
          if (near) this.burst(e.x, e.y, '#5ad1ff', 4, 160, 3, 0.3);
          break;
        case 'spawn':
          if (near) this.rings.push({ x: e.x, y: e.y, r: 10, max: 0.6, life: 0.6, color: '#ffffff' });
          break;
      }
    }
  }

  onScreen(x, y, pad = 0) {
    const hw = this.w / 2 / this.cam.zoom + pad, hh = this.h / 2 / this.cam.zoom + pad;
    return Math.abs(x - this.cam.x) < hw && Math.abs(y - this.cam.y) < hh;
  }

  draw(world, localId, dt, touchState) {
    const g = this.g, t = world.t;
    this.time += dt;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.fillStyle = '#070812';
    g.fillRect(0, 0, this.w, this.h);

    this.shake *= Math.pow(0.002, dt);
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    const z = this.cam.zoom;
    g.save();
    g.translate(this.w / 2 + sx, this.h / 2 + sy);
    g.scale(z, z);
    g.translate(-this.cam.x, -this.cam.y);

    const vw = this.w / 2 / z, vh = this.h / 2 / z;
    const x0 = this.cam.x - vw, x1 = this.cam.x + vw, y0 = this.cam.y - vh, y1 = this.cam.y + vh;
    const S = world.size;

    // Fora da arena.
    g.fillStyle = '#12050b';
    g.fillRect(x0 - 50, y0 - 50, x1 - x0 + 100, y1 - y0 + 100);
    g.fillStyle = '#0a0b18';
    g.fillRect(0, 0, S, S);

    // Grade.
    const step = 80;
    g.strokeStyle = 'rgba(120,140,255,0.07)';
    g.lineWidth = 1.5;
    g.beginPath();
    for (let x = Math.max(0, Math.floor(x0 / step) * step); x <= Math.min(S, x1); x += step) { g.moveTo(x, Math.max(0, y0)); g.lineTo(x, Math.min(S, y1)); }
    for (let y = Math.max(0, Math.floor(y0 / step) * step); y <= Math.min(S, y1); y += step) { g.moveTo(Math.max(0, x0), y); g.lineTo(Math.min(S, x1), y); }
    g.stroke();

    // Borda brilhante.
    g.strokeStyle = 'rgba(255,60,120,0.85)';
    g.lineWidth = 6;
    g.strokeRect(0, 0, S, S);
    g.strokeStyle = 'rgba(255,60,120,0.18)';
    g.lineWidth = 30;
    g.strokeRect(-12, -12, S + 24, S + 24);

    g.globalCompositeOperation = 'lighter';
    // Orbes.
    for (const o of world.orbs) {
      if (o.x < x0 - 30 || o.x > x1 + 30 || o.y < y0 - 30 || o.y > y1 + 30) continue;
      const col = ORB_COLORS[o.v] || '#7af0ff';
      const pulse = 1 + Math.sin(this.time * 4 + o.id) * 0.15;
      const gr = this.glow(col, 24);
      const s = o.r * 3.2 * pulse;
      g.drawImage(gr, o.x - s, o.y - s, s * 2, s * 2);
    }
    g.globalCompositeOperation = 'source-over';
    for (const o of world.orbs) {
      if (o.x < x0 - 30 || o.x > x1 + 30 || o.y < y0 - 30 || o.y > y1 + 30) continue;
      g.fillStyle = ORB_COLORS[o.v] || '#7af0ff';
      g.save();
      g.translate(o.x, o.y);
      g.rotate(this.time * 1.5 + o.id);
      const r = o.r * 0.75;
      g.beginPath();
      g.moveTo(0, -r); g.lineTo(r, 0); g.lineTo(0, r); g.lineTo(-r, 0);
      g.closePath();
      g.fill();
      g.restore();
    }

    // Power-ups.
    for (const u of world.powerups) {
      if (!this.onScreen(u.x, u.y, 60)) continue;
      const def = POWERUPS[u.kind];
      const bob = Math.sin(this.time * 3 + u.id) * 4;
      g.globalCompositeOperation = 'lighter';
      g.drawImage(this.glow(def.color, 40), u.x - 48, u.y - 48 + bob, 96, 96);
      g.globalCompositeOperation = 'source-over';
      g.save();
      g.translate(u.x, u.y + bob);
      g.rotate(this.time * 1.2);
      g.strokeStyle = def.color;
      g.lineWidth = 3;
      g.fillStyle = 'rgba(10,12,30,0.85)';
      roundRect(g, -16, -16, 32, 32, 7);
      g.fill();
      g.stroke();
      g.restore();
      g.fillStyle = def.color;
      g.font = 'bold 18px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(def.icon, u.x, u.y + bob + 1);
    }

    // Projéteis.
    g.globalCompositeOperation = 'lighter';
    for (const b of world.bullets) {
      if (b.x < x0 - 20 || b.x > x1 + 20 || b.y < y0 - 20 || b.y > y1 + 20) continue;
      const col = colorOf(b.color, t);
      const s = b.r * 3.5;
      g.drawImage(this.glow(col, 24), b.x - s, b.y - s, s * 2, s * 2);
    }
    g.globalCompositeOperation = 'source-over';
    for (const b of world.bullets) {
      if (b.x < x0 - 20 || b.x > x1 + 20 || b.y < y0 - 20 || b.y > y1 + 20) continue;
      const sp = Math.hypot(b.vx, b.vy) || 1;
      g.strokeStyle = colorOf(b.color, t);
      g.lineWidth = b.r * 1.3;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(b.x - (b.vx / sp) * b.r * 2.2, b.y - (b.vy / sp) * b.r * 2.2);
      g.lineTo(b.x, b.y);
      g.stroke();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(b.x, b.y, b.r * 0.55, 0, TAU);
      g.fill();
    }

    // Jogadores.
    const players = [...world.players.values()].filter((p) => p.alive && this.onScreen(p.x, p.y, 80));
    for (const p of players) this.drawPlayer(g, p, p.id === localId, p.id === world.kingId, t);
    for (const p of players) this.drawLabel(g, p, p.id === localId);

    // Anéis, partículas e textos.
    g.globalCompositeOperation = 'lighter';
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) { this.rings.splice(i, 1); continue; }
      const k = 1 - r.life / r.max;
      g.strokeStyle = r.color;
      g.globalAlpha = 1 - k;
      g.lineWidth = 4 * (1 - k) + 1;
      g.beginPath();
      g.arc(r.x, r.y, r.r + k * 110, 0, TAU);
      g.stroke();
    }
    g.globalAlpha = 1;
    const fr = Math.pow(0.05, dt);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= fr; p.vy *= fr;
      const a = p.life / p.max;
      g.globalAlpha = Math.min(1, a * 1.5);
      g.fillStyle = p.color;
      g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const tx = this.texts[i];
      tx.life -= dt;
      if (tx.life <= 0) { this.texts.splice(i, 1); continue; }
      tx.y += tx.vy * dt; tx.vy *= Math.pow(0.1, dt);
      const a = tx.life / tx.max;
      const pop = 1 + Math.max(0, (a - 0.85) * 4);
      g.globalAlpha = Math.min(1, a * 2);
      g.font = `800 ${tx.size * pop}px system-ui, sans-serif`;
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(0,0,0,0.7)';
      g.strokeText(tx.str, tx.x, tx.y);
      g.fillStyle = tx.color;
      g.fillText(tx.str, tx.x, tx.y);
    }
    g.globalAlpha = 1;
    g.restore();

    // Vinheta vermelha ao levar dano / vida baixa.
    const me = localId ? world.players.get(localId) : null;
    this.flash = Math.max(0, this.flash - dt);
    const low = me && me.alive ? Math.max(0, 0.35 - me.hp / me.maxHp) * 1.6 : 0;
    const vig = Math.min(0.7, this.flash * 2 + low * (0.7 + Math.sin(this.time * 6) * 0.3));
    if (vig > 0.01) {
      const grd = g.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.3, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75);
      grd.addColorStop(0, 'rgba(255,0,40,0)');
      grd.addColorStop(1, `rgba(255,0,40,${vig})`);
      g.fillStyle = grd;
      g.fillRect(0, 0, this.w, this.h);
    }

    // Seta apontando para o rei, se estiver fora da tela.
    const king = world.kingId ? world.players.get(world.kingId) : null;
    if (king && king.id !== localId && king.alive && !this.onScreen(king.x, king.y, -40)) this.drawArrow(g, king, t);

    this.drawMinimap(g, world, localId);
    if (touchState) this.drawSticks(g, touchState);
  }

  drawPlayer(g, p, isLocal, isKing, t) {
    const col = colorOf(p.color, t);
    g.globalCompositeOperation = 'lighter';
    const gs = p.r * 2.6;
    g.drawImage(this.glow(col, 48), p.x - gs, p.y - gs, gs * 2, gs * 2);
    g.globalCompositeOperation = 'source-over';

    const blink = p.invuln > 0 ? 0.45 + Math.sin(this.time * 25) * 0.25 : 1;
    g.globalAlpha = p.dashT > 0 ? 0.6 : blink;

    // Canos.
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.angle);
    const n = p.stats ? p.stats.multishot : p.multishot || 1;
    for (let i = 0; i < n; i++) {
      g.save();
      g.rotate((i - (n - 1) / 2) * 0.22);
      g.fillStyle = '#b9c3dc';
      g.strokeStyle = '#3a4260';
      g.lineWidth = 3;
      const bw = Math.max(9, p.r * 0.5);
      g.fillRect(p.r * 0.2, -bw / 2, p.r + 12, bw);
      g.strokeRect(p.r * 0.2, -bw / 2, p.r + 12, bw);
      g.restore();
    }
    g.restore();

    // Corpo.
    g.fillStyle = col;
    g.beginPath();
    g.arc(p.x, p.y, p.r, 0, TAU);
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.28)';
    g.beginPath();
    g.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.38, 0, TAU);
    g.fill();
    if (isLocal) {
      g.strokeStyle = 'rgba(255,255,255,0.9)';
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(p.x, p.y, p.r + 5, 0, TAU);
      g.stroke();
    }
    g.globalAlpha = 1;

    if (p.buffs.escudo > 0) {
      g.strokeStyle = `rgba(90,209,255,${0.6 + Math.sin(this.time * 10) * 0.3})`;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(p.x, p.y, p.r + 12, 0, TAU);
      g.stroke();
    }
    if (p.buffs.furia > 0) {
      g.strokeStyle = 'rgba(255,90,122,0.7)';
      g.lineWidth = 2;
      g.setLineDash([6, 6]);
      g.lineDashOffset = -this.time * 40;
      g.beginPath();
      g.arc(p.x, p.y, p.r + 8, 0, TAU);
      g.stroke();
      g.setLineDash([]);
    }
    if (p.buffs.turbo > 0 && Math.random() < 0.5) this.particles.push({ x: p.x, y: p.y, vx: -p.vx * 0.3, vy: -p.vy * 0.3, life: 0.4, max: 0.4, color: '#ffd35a', size: 5 });
    if (isKing) drawCrown(g, p.x, p.y - p.r - 34, 1 + Math.sin(this.time * 4) * 0.05);
  }

  drawLabel(g, p, isLocal) {
    const y = p.y - p.r - 14;
    const w = Math.max(44, p.r * 2.2);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(p.x - w / 2 - 1, y - 1, w + 2, 7);
    const hr = Math.max(0, p.hp / p.maxHp);
    g.fillStyle = hr > 0.5 ? '#5dff8f' : hr > 0.25 ? '#ffd35a' : '#ff4f6d';
    g.fillRect(p.x - w / 2, y, w * hr, 5);
    g.font = `700 ${isLocal ? 14 : 13}px system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(0,0,0,0.75)';
    const label = `${p.name}  ·  ${p.level}`;
    g.strokeText(label, p.x, y - 6);
    g.fillStyle = isLocal ? '#ffffff' : 'rgba(230,235,255,0.9)';
    g.fillText(label, p.x, y - 6);
  }

  drawArrow(g, p, t) {
    const dx = p.x - this.cam.x, dy = p.y - this.cam.y;
    const a = Math.atan2(dy, dx);
    const m = 46;
    const ex = this.w / 2 + Math.cos(a) * (this.w / 2 - m), ey = this.h / 2 + Math.sin(a) * (this.h / 2 - m);
    const x = Math.max(m, Math.min(this.w - m, ex)), y = Math.max(m + 40, Math.min(this.h - m - 60, ey));
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = '#ffd35a';
    g.beginPath();
    g.moveTo(14, 0); g.lineTo(-8, -9); g.lineTo(-8, 9);
    g.closePath();
    g.fill();
    g.restore();
    drawCrown(g, x, y - 22, 0.6);
  }

  drawMinimap(g, world, localId) {
    const size = Math.min(170, this.w * 0.28);
    const pad = 14;
    const x = this.w - size - pad, y = this.h - size - pad;
    const k = size / world.size;
    g.fillStyle = 'rgba(8,10,25,0.72)';
    g.strokeStyle = 'rgba(255,60,120,0.6)';
    g.lineWidth = 1.5;
    g.fillRect(x, y, size, size);
    g.strokeRect(x, y, size, size);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    const vw = this.w / this.cam.zoom, vh = this.h / this.cam.zoom;
    g.strokeRect(x + (this.cam.x - vw / 2) * k, y + (this.cam.y - vh / 2) * k, vw * k, vh * k);
    for (const u of world.powerups) {
      g.fillStyle = POWERUPS[u.kind].color;
      g.fillRect(x + u.x * k - 1.5, y + u.y * k - 1.5, 3, 3);
    }
    for (const p of world.players.values()) {
      if (!p.alive) continue;
      const isMe = p.id === localId, isKing = p.id === world.kingId;
      g.fillStyle = isMe ? '#ffffff' : isKing ? '#ffd35a' : 'rgba(255,90,120,0.85)';
      const r = isMe ? 3.5 : isKing ? 3.5 : 2.2;
      g.beginPath();
      g.arc(x + p.x * k, y + p.y * k, r, 0, TAU);
      g.fill();
    }
  }

  drawSticks(g, ts) {
    for (const s of [ts.move, ts.aim]) {
      if (!s) continue;
      g.strokeStyle = 'rgba(255,255,255,0.25)';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(s.ox, s.oy, 60, 0, TAU);
      g.stroke();
      const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), m = Math.min(d, 60);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.beginPath();
      g.arc(s.ox + (d ? (dx / d) * m : 0), s.oy + (d ? (dy / d) * m : 0), 26, 0, TAU);
      g.fill();
    }
  }
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function drawCrown(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = '#ffd35a';
  g.strokeStyle = '#8a5a00';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-16, 8); g.lineTo(-18, -8); g.lineTo(-8, 0); g.lineTo(0, -12); g.lineTo(8, 0); g.lineTo(18, -8); g.lineTo(16, 8);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}
