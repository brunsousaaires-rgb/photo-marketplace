// Camada online com dois "motores":
//  - no link publicado (claude.ai): banco compartilhado do artifact + identidade de quem joga;
//  - rodando com `npm start`: a API simples do server.js (arquivo JSON no servidor).
// Sem nenhum dos dois, o jogo segue normal e o menu online explica como ativar.
const TIMEOUT = 10000;
const withTimeout = (p, ms = TIMEOUT) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export class Online {
  constructor() {
    this.kind = null;
    this.uid = null;
    this.ready = this.init().catch(() => false);
  }

  async init() {
    if (window.claude?.use) {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (db && user) {
        const id = await user.id();
        if (id) {
          this.kind = 'artifact';
          this.db = db;
          this.user = user;
          this.uid = id;
          return true;
        }
      }
      this.reason = 'Entre na sua conta do Claude e peça acesso de "Contribuidor" ao dono do jogo para jogar online.';
      return false;
    }
    try {
      const r = await withTimeout(fetch('api/ping'), 4000);
      if (r.ok) {
        this.kind = 'http';
        let id = null, secret = null;
        try { id = localStorage.getItem('oficina.uid'); secret = localStorage.getItem('oficina.secret'); } catch {}
        if (!id) {
          id = 'p' + Math.random().toString(36).slice(2, 12);
          secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
          try { localStorage.setItem('oficina.uid', id); localStorage.setItem('oficina.secret', secret); } catch {}
        }
        this.uid = id;
        this.secret = secret;
        return true;
      }
    } catch {}
    this.reason = 'O online funciona no link publicado do jogo ou rodando o servidor (npm start).';
    return false;
  }

  get on() { return !!this.kind; }

  // ---------- documentos compartilhados (cada jogador escreve só o seu) ----------
  async list(col) {
    if (this.kind === 'artifact') {
      const snap = await withTimeout(this.db.collection(col).get());
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    if (this.kind === 'http') {
      const r = await withTimeout(fetch(`api/c/${col}`));
      return r.ok ? r.json() : [];
    }
    return [];
  }

  async get(col, id) {
    if (this.kind === 'artifact') {
      const d = await withTimeout(this.db.doc(`${col}/${id}`).get());
      return d.exists ? { id: d.id, ...d.data() } : null;
    }
    if (this.kind === 'http') {
      const r = await withTimeout(fetch(`api/c/${col}/${id}`));
      return r.ok ? r.json() : null;
    }
    return null;
  }

  async setMine(col, data) {
    if (this.kind === 'artifact') return withTimeout(this.db.doc(`${col}/${this.uid}`).set(data));
    if (this.kind === 'http') {
      const r = await withTimeout(fetch(`api/c/${col}/${this.uid}`, { method: 'PUT', headers: { 'content-type': 'application/json', 'x-secret': this.secret }, body: JSON.stringify(data) }));
      if (!r.ok) throw new Error('http ' + r.status);
    }
  }

  // ---------- salvamento na nuvem (privado) ----------
  async saveCloud(state) {
    const data = { json: JSON.stringify(state), at: Date.now(), level: state.level };
    if (this.kind === 'artifact') return withTimeout(this.db.doc(`data/users/${this.uid}/save`).set(data));
    if (this.kind === 'http') {
      await withTimeout(fetch(`api/save/${this.uid}`, { method: 'PUT', headers: { 'content-type': 'application/json', 'x-secret': this.secret }, body: JSON.stringify(data) }));
    }
  }

  async loadCloud() {
    if (this.kind === 'artifact') {
      const d = await withTimeout(this.db.doc(`data/users/${this.uid}/save`).get());
      return d.exists ? d.data() : null;
    }
    if (this.kind === 'http') {
      const r = await withTimeout(fetch(`api/save/${this.uid}`, { headers: { 'x-secret': this.secret } }));
      return r.ok ? r.json() : null;
    }
    return null;
  }

  // Nome de exibição: o nome da oficina que o jogador escolheu ou o nome da conta.
  async names(ids) {
    if (this.kind === 'artifact' && ids.length) {
      try { const ps = await this.user.profiles(ids); return Object.fromEntries(ids.map((i) => [i, ps[i]?.name || ''])); } catch {}
    }
    return {};
  }

  // ---------- downloads (foto) ----------
  async saveFile(filename, dataUrl) {
    const blob = await (await fetch(dataUrl)).blob();
    if (window.claude?.use) {
      const dl = await window.claude.use('downloads');
      if (!dl) throw Object.assign(new Error('indisponível'), { code: 'unavailable' });
      return dl.save({ filename, data: blob });
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return { status: 'saved' };
  }
}

// Foto da oficina para os outros verem (sem dados pessoais além do nome escolhido).
export function profileSnapshot(state, fame) {
  return {
    name: (state.name || '').slice(0, 24),
    level: state.level,
    fame,
    trophies: state.trophies,
    lotW: state.lotW,
    track: !!state.track,
    uniform: state.uniform,
    buildings: state.buildings.filter((b) => !(b.build && !b.build.up)).map((b) => ({ type: b.type, x: b.x, z: b.z, level: b.level })),
    cars: state.garage.slice(0, 4).map((c) => ({ type: c.type, color: c.color, wheels: c.wheels, spoiler: c.spoiler, neon: c.neon, decal: c.decal, motor: c.motor, turbo: c.turbo, pneus: c.pneus })),
    updated: Date.now(),
  };
}
