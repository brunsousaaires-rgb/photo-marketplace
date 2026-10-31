// Efeitos sonoros sintetizados (sem arquivos de áudio).
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.last = {};
    try { this.muted = localStorage.getItem('nebula.muted') === '1'; } catch {}
    const unlock = () => {
      if (!this.ctx) {
        try {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.35;
          this.master.connect(this.ctx.destination);
        } catch {}
      }
      this.ctx?.resume?.();
    };
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
  }

  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem('nebula.muted', this.muted ? '1' : '0'); } catch {}
    return this.muted;
  }

  tone({ f = 440, f2 = null, d = 0.1, type = 'sine', v = 0.3, delay = 0 }) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + d + 0.02);
  }

  play(name, vol = 1) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running' || vol < 0.03) return;
    const now = performance.now();
    const gap = { shot: 55, hit: 40, pickup: 35, enemyShot: 90 }[name] || 0;
    if (gap && now - (this.last[name] || 0) < gap) return;
    this.last[name] = now;
    const v = vol;
    switch (name) {
      case 'shot': this.tone({ f: 880, f2: 260, d: 0.07, type: 'square', v: 0.05 * v }); break;
      case 'enemyShot': this.tone({ f: 600, f2: 200, d: 0.06, type: 'square', v: 0.025 * v }); break;
      case 'hit': this.tone({ f: 220, f2: 90, d: 0.08, type: 'sawtooth', v: 0.12 * v }); break;
      case 'hurt': this.tone({ f: 140, f2: 60, d: 0.16, type: 'sawtooth', v: 0.22 * v }); break;
      case 'pickup': this.tone({ f: 900 + Math.random() * 300, f2: 1600, d: 0.06, type: 'sine', v: 0.08 * v }); break;
      case 'dash': this.tone({ f: 300, f2: 900, d: 0.12, type: 'triangle', v: 0.15 * v }); break;
      case 'kill':
        this.tone({ f: 523, d: 0.1, type: 'square', v: 0.12 * v });
        this.tone({ f: 784, d: 0.16, type: 'square', v: 0.12 * v, delay: 0.07 });
        break;
      case 'levelup':
        [523, 659, 784, 1047].forEach((f, i) => this.tone({ f, d: 0.14, type: 'triangle', v: 0.16 * v, delay: i * 0.06 }));
        break;
      case 'power': this.tone({ f: 400, f2: 1200, d: 0.25, type: 'sine', v: 0.2 * v }); break;
      case 'upgrade': this.tone({ f: 660, f2: 990, d: 0.12, type: 'triangle', v: 0.14 * v }); break;
      case 'death':
        this.tone({ f: 300, f2: 40, d: 0.6, type: 'sawtooth', v: 0.25 * v });
        break;
      case 'block': this.tone({ f: 1200, f2: 800, d: 0.05, type: 'sine', v: 0.08 * v }); break;
      case 'king': [784, 988, 1175].forEach((f, i) => this.tone({ f, d: 0.2, type: 'sine', v: 0.15 * v, delay: i * 0.09 })); break;
    }
  }
}
