// Efeitos sonoros sintetizados com WebAudio.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.last = {};
    try { this.muted = localStorage.getItem('oficina.muted') === '1'; } catch {}
    const unlock = () => {
      if (!this.ctx) {
        try {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
          this.out = this.ctx.createGain();
          this.out.gain.value = 0.4;
          this.out.connect(this.ctx.destination);
        } catch {}
      }
      this.ctx?.resume?.();
    };
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
  }

  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem('oficina.muted', this.muted ? '1' : '0'); } catch {}
    return this.muted;
  }

  tone(f, d, { type = 'sine', v = 0.2, f2 = null, delay = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + d + 0.05);
  }

  noise(d, { v = 0.15, freq = 3000, q = 0.8, delay = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + delay;
    const len = Math.floor(c.sampleRate * d);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = freq;
    filt.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(filt).connect(g).connect(this.out);
    src.start(t);
  }

  play(name) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = performance.now();
    const gap = { tap: 60, coin: 50, click: 40 }[name] || 0;
    if (gap && now - (this.last[name] || 0) < gap) return;
    this.last[name] = now;
    switch (name) {
      case 'click': this.tone(700, 0.06, { type: 'triangle', v: 0.15 }); break;
      case 'tap': this.tone(520 + Math.random() * 200, 0.07, { type: 'square', v: 0.07, f2: 900 }); this.noise(0.05, { v: 0.06, freq: 5000 }); break;
      case 'coin':
        this.tone(988, 0.08, { type: 'square', v: 0.08 });
        this.tone(1319, 0.22, { type: 'square', v: 0.08, delay: 0.07 });
        break;
      case 'cash': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.16, { type: 'square', v: 0.07, delay: i * 0.05 })); break;
      case 'pop': this.tone(300, 0.12, { type: 'sine', v: 0.25, f2: 900 }); break;
      case 'build':
        this.noise(0.25, { v: 0.2, freq: 400, q: 0.5 });
        this.tone(220, 0.2, { type: 'triangle', v: 0.2, f2: 440, delay: 0.05 });
        this.tone(660, 0.25, { type: 'triangle', v: 0.15, delay: 0.18 });
        break;
      case 'car': this.tone(90, 0.5, { type: 'sawtooth', v: 0.06, f2: 160 }); break;
      case 'horn': this.tone(420, 0.12, { type: 'square', v: 0.07 }); this.tone(420, 0.16, { type: 'square', v: 0.07, delay: 0.16 }); break;
      case 'spray': this.noise(0.35, { v: 0.18, freq: 6000, q: 0.4 }); break;
      case 'error': this.tone(180, 0.2, { type: 'square', v: 0.08, f2: 120 }); break;
      case 'angry': this.tone(300, 0.25, { type: 'sawtooth', v: 0.06, f2: 150 }); break;
      case 'level':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', v: 0.16, delay: i * 0.09 }));
        this.noise(0.6, { v: 0.05, freq: 8000, delay: 0.45 });
        break;
      case 'stars': [1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.2, { type: 'triangle', v: 0.14, delay: i * 0.18 })); break;
    }
  }
}
