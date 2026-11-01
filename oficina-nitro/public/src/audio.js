// Som do jogo, tudo sintetizado com WebAudio: efeitos, música de fundo e ambiente.
const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Progressão (16 compassos) e melodia própria em Dó maior. [passo, nota MIDI, duração] em semicolcheias.
const CHORDS = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'G'];
const CHORD_NOTES = { C: [60, 64, 67], Am: [57, 60, 64], F: [53, 57, 60], G: [55, 59, 62], Em: [52, 55, 59] };
const BASS = { C: 48, Am: 45, F: 41, G: 43, Em: 40 };
const MELODY = [
  [[0, 76, 2], [2, 79, 2], [4, 81, 2], [6, 79, 2], [8, 76, 4], [12, 74, 2], [14, 72, 2]],
  [[0, 76, 3], [3, 72, 1], [4, 69, 4], [10, 72, 2], [12, 74, 2], [14, 76, 2]],
  [[0, 77, 2], [2, 76, 2], [4, 74, 2], [6, 72, 2], [8, 74, 4], [12, 77, 2], [14, 81, 2]],
  [[0, 79, 6], [6, 74, 2], [8, 79, 2], [10, 81, 2], [12, 83, 4]],
  [[0, 84, 2], [2, 83, 2], [4, 81, 2], [6, 79, 2], [8, 76, 4], [12, 79, 4]],
  [[0, 81, 2], [2, 79, 2], [4, 76, 4], [8, 72, 2], [10, 74, 2], [12, 76, 4]],
  [[0, 77, 3], [3, 81, 3], [6, 84, 2], [8, 81, 2], [10, 77, 2], [12, 74, 4]],
  [[0, 79, 4], [4, 74, 2], [6, 76, 2], [8, 79, 8]],
  [[0, 81, 4], [4, 77, 2], [6, 79, 2], [8, 81, 6]],
  [[0, 83, 4], [4, 79, 2], [6, 81, 2], [8, 83, 6]],
  [[0, 79, 2], [2, 83, 2], [4, 84, 4], [8, 83, 2], [10, 79, 2], [12, 76, 4]],
  [[0, 76, 2], [2, 79, 2], [4, 81, 6], [12, 79, 2], [14, 81, 2]],
  [[0, 84, 4], [4, 81, 4], [8, 77, 4], [12, 81, 4]],
  [[0, 83, 4], [4, 79, 4], [8, 74, 4], [12, 79, 4]],
  [[0, 76, 2], [2, 79, 2], [4, 84, 6], [12, 83, 2], [14, 84, 2]],
  [[0, 86, 4], [4, 83, 4], [8, 79, 8]],
];

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = true;
    this.last = {};
    this.night = 0;
    try {
      this.muted = localStorage.getItem('oficina.muted') === '1';
      this.musicOn = localStorage.getItem('oficina.music') !== '0';
    } catch {}
    const unlock = () => {
      if (!this.ctx) {
        try { this.init(); } catch {}
      }
      this.ctx?.resume?.();
    };
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
  }

  init() {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = c;
    this.out = c.createGain();
    this.out.gain.value = 0.4;
    this.out.connect(c.destination);
    // Cadeia da música: filtro (mais abafado à noite) + eco leve na melodia.
    this.mFilter = c.createBiquadFilter();
    this.mFilter.type = 'lowpass';
    this.mFilter.frequency.value = 9000;
    this.mGain = c.createGain();
    this.mGain.gain.value = this.musicOn ? 0.3 : 0;
    this.mFilter.connect(this.mGain).connect(c.destination);
    this.delay = c.createDelay(1);
    this.delay.delayTime.value = 0.3;
    const fb = c.createGain();
    fb.gain.value = 0.28;
    this.delay.connect(fb).connect(this.delay);
    this.delay.connect(this.mFilter);
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.step = 0;
    this.nextT = c.currentTime + 0.1;
    this.spb = 60 / 100 / 4; // 100 BPM em semicolcheias
    this.timer = setInterval(() => this.schedule(), 25);
    this.ambT = c.currentTime + 3;
  }

  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem('oficina.muted', this.muted ? '1' : '0'); } catch {}
    return this.muted;
  }

  toggleMusic() {
    this.musicOn = !this.musicOn;
    try { localStorage.setItem('oficina.music', this.musicOn ? '1' : '0'); } catch {}
    if (this.mGain) this.mGain.gain.setTargetAtTime(this.musicOn ? 0.3 : 0, this.ctx.currentTime, 0.2);
    return this.musicOn;
  }

  setNight(n) {
    this.night = n;
    if (this.mFilter) this.mFilter.frequency.setTargetAtTime(9000 - n * 7000, this.ctx.currentTime, 0.5);
  }

  // ---------- música ----------
  schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    while (this.nextT < c.currentTime + 0.15) {
      if (this.musicOn) this.playStep(this.step, this.nextT);
      this.ambient(this.nextT);
      this.nextT += this.spb;
      this.step = (this.step + 1) % (16 * CHORDS.length);
    }
  }

  playStep(step, t) {
    const bar = Math.floor(step / 16), s = step % 16;
    const ch = CHORDS[bar];
    const night = this.night > 0.5;
    const B = bar >= 8;
    // Bateria.
    if (s === 0 || s === 8 || (B && s === 10)) this.kick(t);
    if (!night && (s === 4 || s === 12)) this.snare(t);
    if (s % 2 === 0 && (!night || s % 4 === 0)) this.hat(t, s % 4 === 2 ? 0.05 : 0.025);
    // Baixo.
    const root = BASS[ch];
    if (s === 0 || s === 8) this.bass(t, NOTE(root), this.spb * 3);
    if (s === 6) this.bass(t, NOTE(root + 12), this.spb * 2);
    if (s === 14) this.bass(t, NOTE(root + 7), this.spb * 2);
    // Acordes no contratempo (estilo cavaquinho).
    if (s % 4 === 2) for (const n of CHORD_NOTES[ch]) this.pluck(t, NOTE(n + 12), night ? 0.018 : 0.03);
    // Melodia.
    for (const [st, n, d] of MELODY[bar]) if (st === s) this.lead(t, NOTE(n), d * this.spb * 0.95, night ? 0.05 : 0.075);
  }

  env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  kick(t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.16);
    this.env(g, t, 0.005, 0.55, 0.18);
    o.connect(g).connect(this.mFilter);
    o.start(t); o.stop(t + 0.25);
  }

  noiseHit(t, freq, type, v, d, dest) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf;
    f.type = type; f.frequency.value = freq;
    this.env(g, t, 0.003, v, d);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(t + d + 0.05);
  }

  snare(t) { this.noiseHit(t, 1800, 'bandpass', 0.22, 0.12, this.mFilter); }
  hat(t, v) { this.noiseHit(t, 7500, 'highpass', v, 0.04, this.mFilter); }

  bass(t, f, d) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    this.env(g, t, 0.01, 0.32, d);
    o.connect(g).connect(this.mFilter);
    o.start(t); o.stop(t + d + 0.05);
  }

  pluck(t, f, v) {
    const c = this.ctx, o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
    o.type = 'square';
    o.frequency.value = f;
    lp.type = 'lowpass'; lp.frequency.value = 1600;
    this.env(g, t, 0.004, v, 0.16);
    o.connect(lp).connect(g).connect(this.mFilter);
    o.start(t); o.stop(t + 0.22);
  }

  lead(t, f, d, v) {
    const c = this.ctx, g = c.createGain();
    for (const [type, det] of [['triangle', 0], ['sine', 6]]) {
      const o = c.createOscillator();
      o.type = type; o.frequency.value = f; o.detune.value = det;
      o.connect(g);
      o.start(t); o.stop(t + d + 0.1);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.02);
    g.gain.setValueAtTime(v * 0.8, t + Math.max(0.03, d - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
    g.connect(this.mFilter);
    g.connect(this.delay);
  }

  // Passarinhos de dia, grilos à noite.
  ambient(t) {
    if (this.muted || t < this.ambT) return;
    this.ambT = t + 3 + Math.random() * 6;
    const c = this.ctx;
    if (this.night < 0.4) {
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const o = c.createOscillator(), g = c.createGain(), tt = t + i * 0.13;
        const f = 2400 + Math.random() * 1500;
        o.frequency.setValueAtTime(f, tt);
        o.frequency.exponentialRampToValueAtTime(f * 1.5, tt + 0.07);
        this.env(g, tt, 0.01, 0.025, 0.07);
        o.connect(g).connect(this.out);
        o.start(tt); o.stop(tt + 0.12);
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const o = c.createOscillator(), g = c.createGain(), tt = t + i * 0.06;
        o.frequency.value = 4400;
        this.env(g, tt, 0.005, 0.012, 0.03);
        o.connect(g).connect(this.out);
        o.start(tt); o.stop(tt + 0.05);
      }
    }
  }

  // ---------- efeitos ----------
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
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = freq;
    filt.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(filt).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.4);
    src.stop(t + d + 0.05);
  }

  play(name) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = performance.now();
    const gap = { tap: 60, coin: 50, click: 40, hammer: 120 }[name] || 0;
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
      case 'hammer': this.noise(0.06, { v: 0.12, freq: 1200, q: 2 }); this.tone(180, 0.05, { type: 'square', v: 0.05 }); break;
      case 'build':
        this.noise(0.25, { v: 0.2, freq: 400, q: 0.5 });
        this.tone(220, 0.2, { type: 'triangle', v: 0.2, f2: 440, delay: 0.05 });
        this.tone(660, 0.25, { type: 'triangle', v: 0.15, delay: 0.18 });
        break;
      case 'built': [523, 784, 1047].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', v: 0.14, delay: i * 0.07 })); break;
      case 'car': this.tone(90, 0.5, { type: 'sawtooth', v: 0.06, f2: 160 }); break;
      case 'horn': this.tone(420, 0.12, { type: 'square', v: 0.07 }); this.tone(420, 0.16, { type: 'square', v: 0.07, delay: 0.16 }); break;
      case 'spray': this.noise(0.35, { v: 0.18, freq: 6000, q: 0.4 }); break;
      case 'error': this.tone(180, 0.2, { type: 'square', v: 0.08, f2: 120 }); break;
      case 'angry': this.tone(300, 0.25, { type: 'sawtooth', v: 0.06, f2: 150 }); break;
      case 'vip': [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.18, { type: 'sine', v: 0.1, delay: i * 0.06 })); break;
      case 'level':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', v: 0.16, delay: i * 0.09 }));
        this.noise(0.6, { v: 0.05, freq: 8000, delay: 0.45 });
        break;
      case 'stars': [1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.2, { type: 'triangle', v: 0.14, delay: i * 0.18 })); break;
      case 'beep': this.tone(440, 0.18, { type: 'square', v: 0.1 }); break;
      case 'go': this.tone(880, 0.4, { type: 'square', v: 0.12 }); break;
      case 'engine': this.tone(60, 1.2, { type: 'sawtooth', v: 0.08, f2: 220 }); break;
      case 'nitro': this.noise(0.6, { v: 0.25, freq: 900, q: 0.3 }); this.tone(200, 0.6, { type: 'sawtooth', v: 0.06, f2: 600 }); break;
      case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, { type: 'square', v: 0.08, delay: i * 0.11 })); break;
      case 'lose': [392, 349, 330, 262].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', v: 0.12, delay: i * 0.15 })); break;
    }
  }
}
