// Visual 3D Cartoon Premium: materiais PBR com texturas feitas em código, carros esculpidos
// (carroceria extrudada com caixas de roda, faróis com lente, retrovisores...), prédios da oficina
// detalhados, vegetação volumétrica variada e mobiliário urbano.
// Tudo aqui é chamado sob demanda (nada roda ao carregar o módulo), por isso pode importar de models.js.
import * as THREE from 'three';
import { mesh, mat, rbox, box, cyl, sph, glow, sign, lamp, levelStars, hazard, TIER, softShadow, shine, torus, WHEELS, buildWheel, NIGHT, stripeCylinder, buildTowTruck, buildCone, SHOWROOM_SLOTS } from './models.js';

const NIGHT_HOOK = (m) => NIGHT.add(m);
// Texturas de água que deslizam devagar (chamado a cada quadro pelo mundo).
const WATER = [];
export function waterTick(t) { for (const tx of WATER) { tx.offset.x = Math.sin(t * 0.05) * 0.08 + t * 0.006; tx.offset.y = t * 0.011; } }

// ---------------- texturas feitas em canvas ----------------
const TC = new Map();
function tex(key, w, h, draw, rep = [1, 1], srgb = true) {
  let t = TC.get(key);
  if (!t) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h, rng(hashStr(key)));
    t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    TC.set(key, t);
  }
  if (rep[0] === 1 && rep[1] === 1) return t;
  const k2 = key + '@' + rep.join('x');
  let t2 = TC.get(k2);
  if (!t2) { t2 = t.clone(); t2.repeat.set(rep[0], rep[1]); TC.set(k2, t2); }
  return t2;
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const speckle = (g, w, h, n, cols, r, s0 = 1, s1 = 2.5) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; const s = s0 + r() * (s1 - s0); g.fillRect(r() * w, r() * h, s, s); } };
const blob = (g, x, y, rad, col) => { const grd = g.createRadialGradient(x, y, 0, x, y, rad); grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

export const TEX = {
  asphalt: (rep) => tex('asphalt', 256, 256, (g, w, h, r) => {
    g.fillStyle = '#545a66'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) blob(g, r() * w, r() * h, 30 + r() * 60, r() < 0.5 ? 'rgba(76,80,90,.22)' : 'rgba(100,105,116,.18)');
    speckle(g, w, h, 4200, ['#5d636f', '#4d525d', '#636975', '#4a4f59'], r, 1, 1.8);
    g.strokeStyle = 'rgba(40,42,48,.35)'; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    blob(g, r() * w, r() * h, 12 + r() * 8, 'rgba(30,31,36,.2)'); // mancha de óleo
  }, rep),
  concrete: (rep) => tex('concrete', 256, 256, (g, w, h, r) => {
    g.fillStyle = '#e6e9ee'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) blob(g, r() * w, r() * h, 50 + r() * 60, r() < 0.5 ? 'rgba(214,218,225,.25)' : 'rgba(248,249,251,.3)');
    speckle(g, w, h, 700, ['rgba(196,201,210,.5)', 'rgba(250,251,253,.6)'], r, 1, 1.4);
    if (r() < 0.35) blob(g, 70 + r() * 120, 70 + r() * 120, 14 + r() * 10, 'rgba(90,84,76,.1)'); // mancha de óleo
    g.strokeStyle = 'rgba(168,175,186,.45)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  }, rep),
  pavers: (rep) => tex('pavers', 256, 128, (g, w, h, r) => {
    g.fillStyle = '#b9b3a8'; g.fillRect(0, 0, w, h);
    const tones = ['#dcd6cb', '#d2ccc0', '#e4dfd5', '#cfc8bb', '#d8cfc0'];
    for (let y = 0; y < 4; y++) for (let x = -1; x < 5; x++) {
      const ox = (y % 2) * 32;
      g.fillStyle = tones[Math.floor(r() * tones.length)];
      g.fillRect(x * 64 + ox + 2, y * 32 + 2, 60, 28);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x * 64 + ox + 2, y * 32 + 2, 60, 3);
    }
    speckle(g, w, h, 900, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.12)'], r, 1, 2);
  }, rep),
  wood: (rep) => tex('wood', 128, 128, (g, w, h, r) => {
    g.fillStyle = '#c98a4b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#c4844a' : '#d0935a'; g.fillRect(0, i * 32, w, 30); g.fillStyle = 'rgba(90,50,20,.5)'; g.fillRect(0, i * 32 + 30, w, 2); }
    g.strokeStyle = 'rgba(110,62,25,.35)'; g.lineWidth = 1;
    for (let i = 0; i < 26; i++) { g.beginPath(); const y = r() * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.08 + i) * 2); g.stroke(); }
  }, rep),
  roof: (rep) => tex('roof', 128, 128, (g, w, h, r) => {
    g.fillStyle = '#9c3a26'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = -1; x < 9; x++) {
      const ox = (y % 2) * 8;
      const grd = g.createLinearGradient(0, y * 16, 0, y * 16 + 16);
      const c = ['#d0623f', '#c95a39', '#d86d48'][Math.floor(r() * 3)];
      grd.addColorStop(0, c); grd.addColorStop(0.75, c); grd.addColorStop(1, '#8a3320');
      g.fillStyle = grd;
      g.beginPath(); g.ellipse(x * 16 + ox + 8, y * 16 + 6, 8, 10, 0, 0, Math.PI); g.fill();
    }
  }, rep),
  plaster: (rep) => tex('plaster', 128, 128, (g, w, h, r) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1500, ['rgba(0,0,0,.05)', 'rgba(0,0,0,.08)', 'rgba(255,255,255,.4)'], r, 1, 2);
    const grd = g.createLinearGradient(0, h * 0.78, 0, h);
    grd.addColorStop(0, 'rgba(60,50,40,0)'); grd.addColorStop(1, 'rgba(60,50,40,.22)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, rep),
  brick: (rep) => tex('brick', 128, 64, (g, w, h, r) => {
    g.fillStyle = '#d9cfc2'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 4; y++) for (let x = -1; x < 5; x++) {
      g.fillStyle = ['#b85c3e', '#c4664a', '#a9533a', '#c96f4f'][Math.floor(r() * 4)];
      g.fillRect(x * 32 + (y % 2) * 16 + 1.5, y * 16 + 1.5, 29, 13);
    }
  }, rep),
  corrugated: (rep) => tex('corrugated', 128, 64, (g, w, h) => {
    for (let x = 0; x < w; x += 8) { const grd = g.createLinearGradient(x, 0, x + 8, 0); grd.addColorStop(0, '#c9d2de'); grd.addColorStop(0.5, '#eef2f7'); grd.addColorStop(1, '#aeb8c6'); g.fillStyle = grd; g.fillRect(x, 0, 8, h); }
  }, rep),
  tread: () => tex('tread', 128, 32, (g, w, h) => {
    g.fillStyle = '#26272d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a1b20';
    for (let x = 0; x < w; x += 8) { g.fillRect(x, 3, 3, 11); g.fillRect(x + 4, 18, 3, 11); }
  }, [3, 1]),
  hedge: (rep) => tex('hedge', 128, 128, (g, w, h, r) => {
    g.fillStyle = '#3c9a3a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) blob(g, r() * w, r() * h, 3 + r() * 7, ['rgba(92,190,80,.8)', 'rgba(40,120,45,.7)', 'rgba(120,205,95,.6)'][Math.floor(r() * 3)]);
    const grd = g.createLinearGradient(0, h * 0.6, 0, h); grd.addColorStop(0, 'rgba(10,40,10,0)'); grd.addColorStop(1, 'rgba(10,40,10,.35)'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, rep),
  pegboard: () => tex('pegboard', 256, 128, (g, w, h) => {
    g.fillStyle = '#c99a62'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(80,50,20,.55)';
    for (let y = 8; y < h; y += 12) for (let x = 8; x < w; x += 12) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
    // Silhuetas das ferramentas penduradas.
    g.fillStyle = '#e8473c'; g.fillRect(28, 22, 10, 70); g.fillRect(20, 18, 26, 14);
    g.fillStyle = '#2f7bea'; g.fillRect(70, 30, 8, 64); g.beginPath(); g.arc(74, 28, 13, 0, 7); g.fill();
    g.fillStyle = '#ffc93c'; g.fillRect(112, 24, 12, 58); g.fillRect(104, 82, 28, 10);
    g.fillStyle = '#5a6070'; g.fillRect(156, 26, 6, 70); g.fillRect(166, 26, 6, 60); g.fillRect(176, 26, 6, 52);
    g.fillStyle = '#46c35a'; g.fillRect(210, 30, 14, 52); g.fillRect(206, 24, 22, 10);
  }, [1, 1]),
  swatches: () => tex('swatches', 256, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const cols = ['#e8473c', '#ff8a2a', '#ffd23d', '#46c35a', '#33d0e0', '#2f7bea', '#8a5cf0', '#ff4fa3', '#22252e', '#ffffff', '#c0c6d0', '#b07a4a'];
    cols.forEach((c, i) => { const x = 12 + (i % 6) * 40, y = 14 + Math.floor(i / 6) * 52; g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 2, y + 3, 34, 42); g.fillStyle = c; g.fillRect(x, y, 34, 42); g.strokeStyle = '#d0d6df'; g.strokeRect(x, y, 34, 42); });
  }, [1, 1]),
  grate: () => tex('grate', 64, 64, (g, w, h) => {
    g.fillStyle = '#3a3e47'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1d22'; for (let x = 6; x < w - 4; x += 8) g.fillRect(x, 6, 4, h - 12);
  }, [1, 1]),
  // Telha neutra (clara): a cor vem do material, assim o mesmo desenho serve para telhado vermelho, azul, roxo...
  roofTile: (rep) => tex('roofTile', 128, 128, (g, w, h, r) => {
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = -1; x < 9; x++) {
      const ox = (y % 2) * 8;
      const grd = g.createLinearGradient(0, y * 16, 0, y * 16 + 16);
      const c = ['#ffffff', '#f2f2f2', '#e6e6e6'][Math.floor(r() * 3)];
      grd.addColorStop(0, c); grd.addColorStop(0.72, c); grd.addColorStop(1, '#8c8c8c');
      g.fillStyle = grd;
      g.beginPath(); g.ellipse(x * 16 + ox + 8, y * 16 + 6, 8, 10, 0, 0, Math.PI); g.fill();
    }
  }, rep),
  // Vitrine de loja vista de fora: prateleiras com produtos coloridos e um reflexo diagonal no vidro.
  shelves: () => tex('shelves', 256, 128, (g, w, h, r) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#fff3d6'); bg.addColorStop(1, '#ffd99a');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cols = ['#e8473c', '#2f7bea', '#46c35a', '#ffc93c', '#ff6fb5', '#8a5cf0', '#ff8a2a', '#ffffff'];
    for (const y of [40, 82, 124]) {
      g.fillStyle = '#b07a4a'; g.fillRect(0, y - 4, w, 6);
      for (let x = 4; x < w - 10;) {
        const pw = 8 + r() * 14, ph = 14 + r() * 18;
        g.fillStyle = cols[Math.floor(r() * cols.length)];
        g.fillRect(x, y - 4 - ph, pw, ph);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 2, y - 4 - ph + 2, 3, ph - 4);
        x += pw + 3 + r() * 4;
      }
    }
    g.fillStyle = 'rgba(255,255,255,.28)';
    g.beginPath(); g.moveTo(60, 0); g.lineTo(110, 0); g.lineTo(50, h); g.lineTo(0, h); g.fill();
    g.beginPath(); g.moveTo(150, 0); g.lineTo(166, 0); g.lineTo(106, h); g.lineTo(90, h); g.fill();
  }),
  // Janela de casa: cortina, vidro azulado e reflexo.
  pane: () => tex('pane', 64, 64, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#cdeeff'); bg.addColorStop(1, '#6fb2dd');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 0, 12, h); g.fillRect(w - 12, 0, 12, h);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(26, 0); g.lineTo(40, 0); g.lineTo(18, h); g.lineTo(4, h); g.fill();
  }),
  // Água: brilhos e ondinhas claras (a textura desliza devagar).
  water: (rep) => tex('water', 256, 256, (g, w, h, r) => {
    g.fillStyle = '#3a95db'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) blob(g, r() * w, r() * h, 30 + r() * 50, r() < 0.5 ? 'rgba(90,180,240,.35)' : 'rgba(30,110,190,.3)');
    g.strokeStyle = 'rgba(220,245,255,.55)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, l = 6 + r() * 16; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3, x + l, y); g.stroke(); }
  }, rep),
  stone: (rep) => tex('stone', 128, 128, (g, w, h, r) => {
    g.fillStyle = '#c9c2b2'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 4; y++) for (let x = -1; x < 4; x++) {
      g.fillStyle = ['#ddd6c6', '#d2cab8', '#e6e0d2', '#cbc3b0'][Math.floor(r() * 4)];
      const ox = (y % 2) * 20;
      g.beginPath(); g.roundRect(x * 40 + ox + 2, y * 32 + 2, 36, 28, 6); g.fill();
    }
    speckle(g, w, h, 500, ['rgba(0,0,0,.07)', 'rgba(255,255,255,.2)'], r, 1, 2);
  }, rep),
  manhole: () => tex('manhole', 64, 64, (g, w, h) => {
    g.fillStyle = '#4b505a'; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill();
    g.strokeStyle = '#3a3e47'; g.lineWidth = 3; for (let rr = 8; rr < 30; rr += 6) { g.beginPath(); g.arc(32, 32, rr, 0, 7); g.stroke(); }
    g.lineWidth = 2; for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(32, 32); g.lineTo(32 + Math.cos(a * 0.785) * 29, 32 + Math.sin(a * 0.785) * 29); g.stroke(); }
  }, [1, 1]),
};

// ---------------- materiais PBR estilizados (reaproveitados) ----------------
const MC = new Map();
function std(key, o, env = 0.3) {
  let m = MC.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial(o); m.envMapIntensity = env; m.userData.keep = true; MC.set(key, m); }
  return m;
}
export const PM = {
  asphalt: (rep = [1, 1]) => std('asphalt' + rep, { map: TEX.asphalt(rep), roughness: 0.92, metalness: 0 }, 0.15),
  concrete: (rep = [1, 1]) => std('concrete' + rep, { map: TEX.concrete(rep), roughness: 0.88 }, 0.15),
  pavers: (rep = [1, 1]) => std('pavers' + rep, { map: TEX.pavers(rep), roughness: 0.85 }, 0.15),
  wood: (rep = [1, 1]) => std('wood' + rep, { map: TEX.wood(rep), roughness: 0.7 }, 0.2),
  roof: (rep = [1, 1]) => std('roof' + rep, { map: TEX.roof(rep), roughness: 0.75 }, 0.2),
  plaster: (color, rep = [1, 1]) => std('plaster' + color + rep, { map: TEX.plaster(rep), color, roughness: 0.82 }, 0.2),
  brick: (rep = [1, 1]) => std('brick' + rep, { map: TEX.brick(rep), roughness: 0.85 }, 0.15),
  corrugated: (color = '#ffffff', rep = [1, 1]) => std('corr' + color + rep, { map: TEX.corrugated(rep), color, roughness: 0.4, metalness: 0.5 }, 0.8),
  hedge: (rep = [1, 1]) => std('hedge' + rep, { map: TEX.hedge(rep), roughness: 0.95 }, 0.1),
  roofTint: (color, rep = [1, 1]) => std('rooft' + color + rep, { map: TEX.roofTile(rep), color, roughness: 0.72 }, 0.2),
  stone: (rep = [1, 1]) => std('stone' + rep, { map: TEX.stone(rep), roughness: 0.85 }, 0.15),
  shelves: () => {
    let m = MC.get('shelves');
    if (!m) { m = new THREE.MeshStandardMaterial({ map: TEX.shelves(), roughness: 0.15, metalness: 0.1, emissive: '#ffffff', emissiveMap: TEX.shelves(), emissiveIntensity: 0.12 }); m.envMapIntensity = 0.6; m.userData.night = { dayE: new THREE.Color('#ffffff'), nightE: new THREE.Color('#ffe2a8'), dayI: 0.12, nightI: 0.9 }; m.userData.keep = true; MC.set('shelves', m); NIGHT_HOOK(m); }
    return m;
  },
  pane: () => {
    let m = MC.get('pane');
    if (!m) { m = new THREE.MeshStandardMaterial({ map: TEX.pane(), roughness: 0.1, metalness: 0.2, emissive: '#000000', emissiveIntensity: 0.0 }); m.envMapIntensity = 0.9; m.userData.night = { dayE: new THREE.Color('#000000'), nightE: new THREE.Color('#ffc870'), dayI: 0, nightI: 1.2 }; m.userData.keep = true; MC.set('pane', m); NIGHT_HOOK(m); }
    return m;
  },
  // Água que desliza (a textura é a mesma; quem chama anima o offset em waterTick).
  water: (rep = [1, 1]) => {
    const k = 'water' + rep;
    let m = MC.get(k);
    if (!m) { m = new THREE.MeshStandardMaterial({ map: TEX.water(rep), color: '#ffffff', roughness: 0.08, metalness: 0.25 }); m.envMapIntensity = 1.3; m.userData.keep = true; MC.set(k, m); WATER.push(m.map); }
    return m;
  },
  metal: (color = '#c6ccd6') => std('metal' + color, { color, roughness: 0.3, metalness: 0.85 }, 1.1),
  chrome: () => std('chrome', { color: '#eef2f8', roughness: 0.1, metalness: 1 }, 1.5),
  plastic: (color) => std('plastic' + color, { color, roughness: 0.48, metalness: 0 }, 0.35),
  rubber: () => std('rubber', { color: '#25262c', roughness: 0.92 }, 0.1),
  tread: () => std('tread', { map: TEX.tread(), roughness: 0.95 }, 0.1),
  glass: () => {
    let m = MC.get('glass');
    if (!m) { m = new THREE.MeshStandardMaterial({ color: '#203a5c', roughness: 0.06, metalness: 0.55, transparent: true, opacity: 0.86 }); m.envMapIntensity = 1.6; m.userData.keep = true; MC.set('glass', m); }
    return m;
  },
};

// Pintura automotiva: verniz brilhante por cima (clearcoat), como miniatura de coleção.
export function carPaint(hex) {
  const m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.34, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.07 });
  m.envMapIntensity = 0.95;
  return m;
}

// ---------------- carro esculpido ----------------
// Gira a extrusão para que o perfil (x = comprimento, y = altura) vire o lado do carro e a profundidade vire a largura.
function sideExtrude(shape, depth, bevel, curve = 10) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 3, curveSegments: curve });
  g.rotateY(-Math.PI / 2);
  g.translate(depth / 2, 0, 0);
  return g;
}

export function premiumCarBody(body, o) {
  const { D, L, W, CL, CZ, CH, bottom, top, r, paint } = o;
  const dark = PM.plastic('#2a2d35'), chrome = PM.chrome(), glassM = PM.glass();
  const add = (geo, m, x = 0, y = 0, z = 0) => mesh(geo, m, x, y, z, body);

  // Lateral: para-choque a para-choque, com as caixas de roda recortadas.
  const wz = L / 2 - 0.66, yb = bottom + 0.02, yt = top;
  const A = Math.min(r + 0.1, yt - r - 0.05);
  const dy = Math.min(A - 0.01, r - yb);
  const dx = Math.sqrt(Math.max(0.0004, A * A - dy * dy));
  const beta = Math.asin(Math.max(-0.99, Math.min(0.99, dy / A)));
  const s = new THREE.Shape();
  const zF = L / 2, zB = -L / 2, rc = 0.17;
  const noseDrop = D.van || D.jeep ? 0.06 : 0.12;
  s.moveTo(zB + rc, yb);
  s.lineTo(-wz - dx, yb);
  s.absarc(-wz, r, A, Math.PI + beta, -beta, true);
  s.lineTo(wz - dx, yb);
  s.absarc(wz, r, A, Math.PI + beta, -beta, true);
  s.lineTo(zF - rc, yb);
  s.quadraticCurveTo(zF, yb, zF, yb + rc);
  s.lineTo(zF, yt - noseDrop - 0.16);
  s.quadraticCurveTo(zF, yt - noseDrop, zF - 0.26, yt - noseDrop + 0.01);
  s.lineTo(CZ + CL / 2 + 0.05, yt);
  s.lineTo(CZ - CL / 2 - 0.05, yt);
  s.lineTo(zB + 0.24, yt - 0.03);
  s.quadraticCurveTo(zB, yt - 0.03, zB, yt - 0.2);
  s.lineTo(zB, yb + rc);
  s.quadraticCurveTo(zB, yb, zB + rc, yb);
  const bodyGeo = sideExtrude(s, W - 0.3, 0.16, 12);
  add(bodyGeo, paint);
  // Para-lamas arredondados por cima das rodas (cara de miniatura).
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    const f = add(torus(A + 0.03, 0.075, 8, 22, Math.PI), paint, sx * (W / 2 - 0.07), r, sz * wz);
    f.rotation.y = Math.PI / 2;
    const cut = add(cyl(A - 0.02, A - 0.02, 0.2, 20, 1), PM.plastic('#1d2028'), sx * (W / 2 - 0.08), r, sz * wz);
    cut.rotation.z = Math.PI / 2;
    cut.castShadow = false;
  }

  // Estufa (vidros) + teto e colunas pintados.
  const z0 = CZ - CL / 2, z1 = CZ + CL / 2, yb2 = top - 0.05, yr = top + CH;
  const fs = D.van ? Math.min(0.32, CL * 0.13) : D.jeep ? 0.22 : Math.min(0.62, CL * 0.36);
  const rs = D.van ? 0.08 : D.jeep ? 0.1 : D.bed ? 0.08 : Math.min(0.46, CL * 0.25);
  const Wc = W * 0.8;
  const c = new THREE.Shape();
  c.moveTo(z0, yb2);
  c.lineTo(z1, yb2);
  c.lineTo(z1 - fs, yr - 0.06);
  c.quadraticCurveTo(z1 - fs - 0.05, yr, z1 - fs - 0.16, yr);
  c.lineTo(z0 + rs + 0.16, yr);
  c.quadraticCurveTo(z0 + rs + 0.05, yr, z0 + rs, yr - 0.06);
  c.lineTo(z0, yb2);
  const cab = add(sideExtrude(c, Wc - 0.16, 0.09, 8), glassM);
  cab.scale.set(1, 1, 1);
  const roofLen = (z1 - fs) - (z0 + rs);
  add(rbox(Wc + 0.08, 0.09, roofLen + 0.12, 0.045), paint, 0, yr + 0.02, (z1 - fs + z0 + rs) / 2);
  const pillar = (za, zb, x) => {
    const len = Math.hypot(zb - za, CH + 0.04);
    const m = add(box(0.08, len, 0.1), paint, x, (yb2 + yr) / 2, (za + zb) / 2);
    m.rotation.x = Math.atan2(zb - za, CH + 0.04);
  };
  for (const sx of [-1, 1]) {
    const x = sx * (Wc / 2 + 0.005);
    pillar(z1, z1 - fs, x);
    pillar(z0, z0 + rs, x);
    if (CL > 1.3 && !D.van) add(box(0.09, CH, 0.12), paint, x, (yb2 + yr) / 2, CZ - (D.jeep ? 0.1 : 0.02));
    if (D.van) for (const k of [0.33, 0.66]) add(box(0.09, CH, 0.1), paint, x, (yb2 + yr) / 2, z0 + (z1 - z0) * k);
    // Brilho no vidro lateral.
    const hs = add(box(0.02, CH * 0.5, 0.09), shine, sx * (Wc / 2 + 0.03), top + CH * 0.5, CZ + CL * 0.16);
    hs.rotation.x = 0.55; hs.castShadow = false;
  }
  const hw = add(box(Wc * 0.12, CH * 0.62, 0.02), shine, -Wc * 0.2, top + CH * 0.45, z1 - fs * 0.45 + 0.04);
  hw.rotation.set(-Math.atan2(fs, CH), 0, 0.5); hw.castShadow = false;

  // Frente: grade, faróis com lente e aro cromado, para-choques de plástico.
  add(rbox(W * 0.54, 0.2, 0.05, 0.03), chrome, 0, bottom + (top - bottom) * 0.42, zF + 0.035);
  add(rbox(W * 0.48, 0.14, 0.06, 0.03), dark, 0, bottom + (top - bottom) * 0.42, zF + 0.05);
  const head = glow('#fff6c8', '#ffe9a0', '#fff4c0', 0.6, 2.4);
  const tail = glow('#ff3b3b', '#ff2020', '#ff2a2a', 0.5, 1.8);
  for (const sx of [-1, 1]) {
    const lens = add(sph(0.13, 14, 10), head, sx * W * 0.32, yt - noseDrop - 0.16, zF + 0.0);
    lens.scale.set(1.15, 0.82, 0.42);
    const bez = add(torus(0.125, 0.025, 6, 18), chrome, sx * W * 0.32, yt - noseDrop - 0.16, zF + 0.03);
    bez.scale.set(1.15, 0.82, 1);
    const tl = add(rbox(0.32, 0.15, 0.07, 0.035), tail, sx * W * 0.33, yt - 0.2, zB - 0.01);
    tl.castShadow = false;
    add(rbox(0.12, 0.06, 0.05, 0.02), glow('#ffb84a', '#ffa020', '#ffb040', 0.4, 1.6), sx * W * 0.4, bottom + 0.3, zF + 0.04);
  }
  for (const sz of [1, -1]) {
    add(rbox(W + 0.06, 0.2, 0.24, 0.08), dark, 0, bottom + 0.12, sz * (L / 2 - 0.02));
    add(box(0.48, 0.15, 0.03), mat('#ffffff', { r: 0.5 }), 0, bottom + 0.2, sz * (L / 2 + 0.11));
    add(box(0.48, 0.04, 0.035), mat('#1f5bd8'), 0, bottom + 0.255, sz * (L / 2 + 0.112));
  }
  // Saias laterais, frisos das portas, maçanetas e retrovisores.
  for (const sx of [-1, 1]) {
    const xs = sx * (W / 2 - 0.02);
    add(rbox(0.08, 0.09, L * 0.42, 0.03), dark, xs + sx * 0.03, bottom + 0.07, 0);
    for (const zz of D.van ? [CZ + CL / 2 - 0.15] : [CZ + CL / 2 - 0.08, ...(CL > 1.3 ? [CZ - 0.02] : [])]) add(box(0.012, (top - bottom) * 0.7, 0.025), mat('#1d2028'), sx * (W / 2 + 0.005), bottom + (top - bottom) * 0.52, zz).castShadow = false;
    add(rbox(0.03, 0.045, 0.15, 0.015), chrome, sx * (W / 2 + 0.02), top - 0.17, CZ + 0.2).castShadow = false;
    const arm = add(box(0.16, 0.04, 0.05), dark, sx * (Wc / 2 + 0.1), top + 0.08, z1 - 0.12);
    arm.castShadow = false;
    add(rbox(0.12, 0.11, 0.2, 0.04), paint, sx * (Wc / 2 + 0.2), top + 0.12, z1 - 0.14);
    add(box(0.01, 0.07, 0.14), glassM, sx * (Wc / 2 + 0.262), top + 0.12, z1 - 0.18).castShadow = false;
  }
  // Escapamento.
  const ex = add(cyl(0.055, 0.055, 0.24, 10), chrome, W * 0.28, bottom + 0.06, zB - 0.04);
  ex.rotation.x = Math.PI / 2;
}

// Roda premium: pneu com banda de rodagem e ombros arredondados, aro com porcas e calota.
export function premiumWheel(def) {
  const g = new THREE.Group();
  const tireTw = def.tw * 0.84;
  const tire = mesh(cyl(def.r, def.r, tireTw, 28, 1), PM.tread());
  tire.rotation.z = Math.PI / 2;
  g.add(tire);
  for (const sx of [-1, 1]) {
    const sh = mesh(torus(def.r - 0.055, 0.058, 8, 28), PM.rubber(), sx * tireTw / 2, 0, 0);
    sh.rotation.y = Math.PI / 2;
    g.add(sh);
  }
  if (def.tread) for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const k = mesh(box(def.tw + 0.04, 0.08, 0.12), PM.rubber(), 0, Math.cos(a) * def.r, Math.sin(a) * def.r);
    k.rotation.x = a;
    g.add(k);
  }
  const rimMat = def.rm >= 0.8 ? PM.chrome() : mat(def.rim, { r: def.rr ?? 0.35, m: def.rm });
  const rr = def.r * def.rimR;
  const dish = mesh(cyl(rr, rr * 0.9, def.tw + 0.02, 22), rimMat);
  dish.rotation.z = Math.PI / 2;
  g.add(dish);
  for (const sx of [-1, 1]) {
    const lip = mesh(torus(rr, 0.022, 6, 24), PM.chrome(), sx * (def.tw / 2 + 0.01), 0, 0);
    lip.rotation.y = Math.PI / 2;
    lip.castShadow = false;
    g.add(lip);
    const cap = mesh(cyl(def.r * 0.16, def.r * 0.16, 0.04, 12), PM.chrome(), sx * (def.tw / 2 + 0.03), 0, 0);
    cap.rotation.z = Math.PI / 2;
    g.add(cap);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const nut = mesh(cyl(0.022, 0.022, 0.05, 6), PM.metal('#9aa3b2'), sx * (def.tw / 2 + 0.02), Math.cos(a) * def.r * 0.27, Math.sin(a) * def.r * 0.27);
      nut.rotation.z = Math.PI / 2;
      nut.castShadow = false;
      g.add(nut);
    }
  }
  for (let i = 0; i < (def.spokes || 0); i++) {
    const col = def.spokeCol || (def.spokes > 5 ? '#c3cad6' : '#2b2d36');
    const sp = mesh(box(def.tw + 0.05, rr * 1.75, 0.06), def.spokeMetal || def.spokes > 5 ? PM.metal(col) : mat(col, { r: 0.4 }));
    sp.rotation.x = (i / def.spokes) * Math.PI;
    g.add(sp);
  }
  if (def.glowRim) for (const sx of [-1, 1]) {
    const ring = mesh(torus(def.r * 0.62, 0.035, 6, 24), glow(def.glowRim, def.glowRim, def.glowRim, 1.6, 2.6), sx * (def.tw / 2 + 0.02), 0, 0);
    ring.rotation.y = Math.PI / 2; ring.castShadow = false; g.add(ring);
  }
  for (let i = 0; i < (def.fan || 0); i++) {
    const a = (i / def.fan) * Math.PI * 2;
    const bl = mesh(box(def.tw + 0.06, def.r * 0.5, 0.05), PM.metal(), 0, Math.cos(a) * def.r * 0.33, Math.sin(a) * def.r * 0.33);
    bl.rotation.x = -a + 0.5; g.add(bl);
  }
  return g;
}

// ---------------- prédios da oficina ----------------
const TILE = 2;
function slabP(w, d) {
  const s = mesh(rbox(w * TILE - 0.16, 0.22, d * TILE - 0.16, 0.08), PM.concrete([w, d]), 0, 0.11, 0);
  s.castShadow = false;
  return s;
}
// Sombra suave no chão em volta da construção (oclusão de ambiente "pintada").
function groundAO(g, w, d) {
  const s = softShadow(w * 1.08, d * 1.08, 0.55);
  s.position.y = 0.235;
  g.add(s);
}
function tireStack(g, x, z, n = 3) {
  for (let i = 0; i < n; i++) {
    const t = mesh(torus(0.34, 0.14, 10, 20), PM.rubber(), x, 0.36 + i * 0.27, z, g);
    t.rotation.x = Math.PI / 2;
    mesh(cyl(0.2, 0.2, 0.06, 14), PM.metal('#aab2bf'), x, 0.36 + i * 0.27, z, g).castShadow = false;
  }
}
function planter(g, x, z, flower = '#ff6fb5') {
  mesh(rbox(0.7, 0.5, 0.7, 0.08), PM.plastic('#c0533a'), x, 0.47, z, g);
  mesh(cyl(0.3, 0.3, 0.06, 12), mat('#5a3a22'), x, 0.73, z, g).castShadow = false;
  const r = rng(Math.round(x * 100 + z * 7));
  for (let i = 0; i < 5; i++) {
    const a = r() * 6.28, d = r() * 0.18;
    mesh(sph(0.15, 8, 6), mat(i % 2 ? '#4cb848' : '#3fa63f'), x + Math.cos(a) * d, 0.86 + r() * 0.12, z + Math.sin(a) * d, g);
  }
  for (let i = 0; i < 4; i++) mesh(sph(0.06, 6, 5), mat(flower, { e: flower, ei: 0.08 }), x + (r() - 0.5) * 0.4, 1.0 + r() * 0.1, z + (r() - 0.5) * 0.4, g).castShadow = false;
}

export function premiumEscritorio() {
  const g = new THREE.Group();
  g.add(slabP(3, 3));
  groundAO(g, 5.6, 4.6);
  const wallM = PM.plaster('#fdf1de', [3, 2]);
  // Base de tijolinho, paredes rebocadas, cornija e platibanda azul.
  mesh(rbox(5.6, 0.5, 4.4, 0.06), PM.brick([5, 1]), 0, 0.47, -0.5, g);
  mesh(rbox(5.4, 3.0, 4.2, 0.12), wallM, 0, 2.18, -0.5, g);
  mesh(rbox(5.75, 0.2, 4.55, 0.06), mat('#ffffff', { r: 0.6 }), 0, 3.72, -0.5, g);
  mesh(rbox(5.85, 0.5, 4.65, 0.08), PM.plastic('#2f7bea'), 0, 4.05, -0.5, g);
  mesh(rbox(5.95, 0.08, 4.75, 0.03), mat('#ffffff', { r: 0.5 }), 0, 4.32, -0.5, g);
  mesh(rbox(5.3, 0.1, 4.1, 0.03), PM.concrete([2, 2]), 0, 3.95, -0.5, g).castShadow = false;
  // Caixa d'água e ar-condicionado no telhado.
  mesh(cyl(0.55, 0.55, 0.8, 18), PM.plastic('#2f7bea'), -1.8, 4.45, -1.6, g);
  mesh(cyl(0.6, 0.6, 0.12, 18), PM.plastic('#1f5bb5'), -1.8, 4.9, -1.6, g);
  mesh(rbox(1.0, 0.6, 0.7, 0.06), PM.metal('#dfe4ec'), 1.6, 4.3, -2.0, g);
  const fan = mesh(cyl(0.25, 0.25, 0.04, 16), mat('#3a3d48'), 1.6, 4.62, -2.0, g);
  fan.castShadow = false;
  // Porta de enrolar (metal ondulado) com moldura.
  mesh(rbox(2.6, 2.4, 0.16, 0.05), PM.plastic('#3a3d48'), -1.2, 1.4, 1.62, g);
  mesh(rbox(2.3, 2.15, 0.06, 0.02), PM.corrugated('#d8dee8', [3, 1]), -1.2, 1.32, 1.7, g);
  mesh(rbox(2.4, 0.18, 0.2, 0.04), PM.plastic('#ff8a2a'), -1.2, 2.55, 1.72, g);
  // Vitrine com caixilhos, porta de vidro, soleira e degraus.
  const win = glow('#9fd8f5', '#3a6a8a', '#ffcf70', 0.35, 1.5, { r: 0.08, m: 0.4 });
  mesh(rbox(1.8, 1.35, 0.1, 0.03), win, 1.45, 2.05, 1.63, g);
  for (const x of [1.0, 1.9]) mesh(box(0.06, 1.35, 0.06), PM.metal('#e8ecf2'), x, 2.05, 1.7, g).castShadow = false;
  mesh(box(1.86, 0.06, 0.06), PM.metal('#e8ecf2'), 1.45, 2.05, 1.7, g).castShadow = false;
  mesh(rbox(1.95, 0.12, 0.3, 0.04), mat('#ffffff', { r: 0.5 }), 1.45, 1.32, 1.76, g);
  mesh(rbox(0.9, 1.9, 0.08, 0.03), win, 0.25, 1.05, 1.64, g);
  mesh(rbox(1.02, 2.02, 0.05, 0.03), PM.metal('#c6ccd6'), 0.25, 1.06, 1.6, g);
  for (let i = 0; i < 2; i++) mesh(rbox(1.3 - i * 0.2, 0.12, 0.4 - i * 0.12, 0.03), PM.concrete(), 0.25, 0.28 + i * 0.12, 1.85 - i * 0.06, g);
  // Toldo listrado com babado.
  const aw = new THREE.Mesh(box(2.3, 0.08, 1.0), std('awning-o', { map: stripesTex('#ff8a2a', '#ffffff'), roughness: 0.75 }));
  aw.position.set(0.9, 2.95, 2.05); aw.rotation.x = 0.38; aw.castShadow = true; g.add(aw);
  for (let i = 0; i < 9; i++) mesh(cyl(0.13, 0.13, 0.08, 10, 1), i % 2 ? mat('#ffffff', { r: 0.7 }) : PM.plastic('#ff8a2a'), -0.15 + i * 0.26, 2.72, 2.5, g).rotation.x = Math.PI / 2;
  // Arandelas (acendem à noite) e calha.
  for (const x of [-0.45, 2.55]) {
    mesh(rbox(0.16, 0.24, 0.12, 0.04), PM.metal('#3a3d48'), x, 2.35, 1.68, g);
    mesh(sph(0.08, 8, 6), glow('#fff3c4', '#ffd77a', '#ffe7a0', 0.4, 2.6), x, 2.25, 1.76, g).castShadow = false;
  }
  mesh(cyl(0.06, 0.06, 3.6, 8), PM.metal('#9aa3b2'), 2.66, 2.0, 1.55, g);
  // Letreiro no telhado com lâmpadas em volta.
  const sg = sign('OFICINA NITRO', 5.4, 1.2, { w: 1024, h: 224, bg: '#ff8a2a', stroke: '#7a2e00', size: 150, radius: 50, night: true });
  sg.position.set(0, 5.05, 0.18);
  g.add(sg);
  mesh(rbox(5.75, 1.45, 0.2, 0.08), PM.plastic('#7a2e00'), 0, 5.05, 0.04, g);
  const bulb = glow('#fff6d0', '#ffe28a', '#fff1b0', 0.7, 2.8);
  for (let i = 0; i < 14; i++) { const x = -2.7 + (i / 13) * 5.4; for (const y of [4.38, 5.72]) mesh(sph(0.055, 6, 5), bulb, x, y, 0.16, g).castShadow = false; }
  for (const sx of [-1.9, 1.9]) mesh(box(0.14, 0.9, 0.14), PM.metal('#5a6070'), sx, 4.35, -0.08, g);
  // Pneu-logo na lateral, pilha de pneus e vasos.
  const t = mesh(torus(0.55, 0.22, 12, 24), PM.rubber(), 2.78, 2.2, -0.5, g);
  t.rotation.y = Math.PI / 2;
  mesh(cyl(0.36, 0.36, 0.1, 18), PM.plastic('#ffc93c'), 2.8, 2.2, -0.5, g).rotation.z = Math.PI / 2;
  tireStack(g, -2.55, 2.3, 3);
  planter(g, 2.45, 2.4, '#ff6fb5');
  planter(g, -0.75, 2.45, '#ffd23d');
  // Antena com luz piscando.
  mesh(cyl(0.04, 0.04, 1.4, 6), PM.metal('#9aa3b2'), -2.2, 4.8, -2.2, g);
  const blink = mesh(sph(0.1, 8, 6), mat('#ff3b3b', { e: '#ff2020', ei: 1.5 }), -2.2, 5.55, -2.2, g);
  g.userData.blink = blink;
  return g;
}

function stripesTex(a, b) {
  return tex('stripes' + a + b, 128, 32, (g, w, h) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((i * w) / 8, 0, w / 8 + 1, h); }
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, w, 4);
  });
}

export function premiumElevador(level) {
  const g = new THREE.Group();
  g.add(slabP(2, 3));
  groundAO(g, 3.9, 5.6);
  hazard(g, 3.6, 2.75);
  // Parede do fundo de metal ondulado, viga colorida, letreiro.
  mesh(rbox(3.95, 2.5, 0.3, 0.06), PM.corrugated('#e6ebf2', [4, 2]), 0, 1.45, -2.78, g);
  mesh(rbox(4.05, 0.32, 0.46, 0.08), PM.plastic(TIER[level - 1]), 0, 2.78, -2.75, g);
  const s = sign('OFICINA', 2.6, 0.65, { bg: TIER[level - 1], stroke: '#173a7a', night: true });
  s.position.set(0, 3.28, -2.7);
  g.add(s);
  mesh(rbox(2.7, 0.75, 0.12, 0.06), PM.plastic('#173a7a'), 0, 3.28, -2.79, g);
  levelStars(g, level, 3.78, -2.75);
  // Colunas laterais com mureta.
  for (const sx of [-1, 1]) {
    mesh(rbox(0.32, 0.8, 2.4, 0.06), PM.brick([1, 1]), sx * 1.84, 0.62, -1.5, g);
    mesh(rbox(0.38, 0.08, 2.46, 0.03), PM.concrete(), sx * 1.84, 1.05, -1.5, g);
  }
  // Painel de ferramentas, luminária e gaveteiro.
  const peg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), std('peg', { map: TEX.pegboard(), roughness: 0.8 }));
  peg.position.set(-0.75, 1.65, -2.62); g.add(peg);
  mesh(box(1.9, 1.0, 0.04), PM.wood(), -0.75, 1.65, -2.645, g).castShadow = false;
  for (const x of [-1.2, 1.2]) mesh(cyl(0.03, 0.03, 0.5, 6), PM.metal('#5a6070'), x, 2.4, -2.3, g);
  mesh(rbox(2.6, 0.1, 0.22, 0.04), PM.metal('#dfe4ec'), 0, 2.62, -2.3, g);
  mesh(box(2.4, 0.04, 0.12), glow('#ffffff', '#eaf6ff', '#f2faff', 0.6, 2.2), 0, 2.56, -2.3, g).castShadow = false;
  const red = PM.plastic('#d93b30');
  mesh(rbox(0.95, 1.05, 0.6, 0.06), red, 1.25, 0.76, -2.25, g);
  for (let i = 0; i < 4; i++) {
    mesh(box(0.86, 0.02, 0.02), mat('#8f2820'), 1.25, 0.45 + i * 0.22, -1.94, g).castShadow = false;
    mesh(rbox(0.3, 0.035, 0.04, 0.015), PM.chrome(), 1.25, 0.37 + i * 0.22, -1.93, g).castShadow = false;
  }
  mesh(rbox(1.0, 0.1, 0.62, 0.03), PM.metal('#3a3d48'), 1.25, 1.32, -2.25, g);
  // Tambor de óleo com anéis e etiqueta, macaco hidráulico e compressor.
  mesh(cyl(0.3, 0.3, 0.82, 16), PM.plastic('#2f7bea'), -1.45, 0.64, -1.95, g);
  for (const y of [0.4, 0.88]) mesh(torus(0.305, 0.025, 6, 18), PM.metal('#1f5bb5'), -1.45, y, -1.95, g).rotation.x = Math.PI / 2;
  mesh(cyl(0.31, 0.31, 0.2, 16), PM.plastic('#ffffff'), -1.45, 0.64, -1.95, g);
  mesh(cyl(0.18, 0.18, 0.7, 12), PM.plastic('#d93b30'), -1.5, 0.45, -0.9, g).rotation.x = Math.PI / 2;
  mesh(rbox(0.3, 0.25, 0.25, 0.05), PM.metal('#3a3d48'), -1.5, 0.58, -0.62, g);
  // Elevador de duas colunas: base, coluna, carro do braço e mangueiras.
  const liftCol = PM.plastic('#ff6a3d');
  for (const sx of [-1, 1]) {
    mesh(rbox(0.6, 0.06, 0.6, 0.02), PM.metal('#5a6070'), sx * 1.32, 0.25, 0.1, g);
    mesh(rbox(0.32, 2.3, 0.34, 0.06), liftCol, sx * 1.32, 1.4, 0.1, g);
    mesh(rbox(0.36, 0.12, 0.38, 0.03), PM.metal('#3a3d48'), sx * 1.32, 2.58, 0.1, g);
    mesh(cyl(0.035, 0.035, 2.1, 6), mat('#22252e'), sx * 1.52, 1.3, 0.1, g);
    mesh(box(0.06, 1.8, 0.06), PM.metal('#c6ccd6'), sx * 1.15, 1.3, 0.1, g).castShadow = false;
  }
  const lift = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-0.8, 0.9]) {
    mesh(rbox(0.95, 0.09, 0.17, 0.03), PM.metal('#4a4f5c'), sx * 0.85, 0, sz, lift);
    mesh(cyl(0.11, 0.11, 0.08, 12), PM.rubber(), sx * 0.42, 0.07, sz, lift).castShadow = false;
  }
  lift.position.y = 0.3;
  g.add(lift);
  g.userData.lift = lift;
  // Rack de pneus.
  tireStack(g, 1.6, 2.2, 2);
  return g;
}

export function premiumCabine(level) {
  const g = new THREE.Group();
  g.add(slabP(2, 3));
  groundAO(g, 3.9, 5.6);
  // Prato giratório de metal escovado com anel de LED.
  const disc = new THREE.Group();
  mesh(cyl(1.8, 1.85, 0.12, 48), std('disc', { color: '#3a3f4b', roughness: 0.35, metalness: 0.6 }, 0.6), 0, 0.27, 0, disc);
  mesh(cyl(1.55, 1.55, 0.02, 48), std('disc2', { color: '#555c6a', roughness: 0.3, metalness: 0.7 }, 0.6), 0, 0.34, 0, disc).castShadow = false;
  const ring = new THREE.Mesh(torus(1.82, 0.05, 8, 64), glow('#ff4fd8', '#ff4fd8', '#ff4fd8', 1.4, 2.6));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.33; disc.add(ring);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    mesh(box(0.5, 0.02, 0.06), mat('#ffffff', { e: '#ffffff', ei: 0.5 }), Math.cos(a) * 1.3, 0.355, Math.sin(a) * 1.3, disc).rotation.y = -a;
  }
  g.add(disc);
  g.userData.disc = disc;
  // Estrutura de alumínio (some quando a câmera aproxima) com barras de luz e spots.
  const frame = PM.metal('#3a3d48');
  const fr = new THREE.Group();
  g.add(fr);
  g.userData.frame = fr;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    mesh(rbox(0.22, 2.9, 0.22, 0.05), frame, sx * 1.85, 1.65, sz * 2.6, sz > 0 ? fr : g);
    mesh(rbox(0.36, 0.08, 0.36, 0.02), PM.metal('#5a6070'), sx * 1.85, 0.27, sz * 2.6, sz > 0 ? fr : g);
  }
  const strip = glow('#ffffff', '#fff2fb', '#fff2fb', 1.2, 2.4);
  for (const sz of [-1, 1]) {
    mesh(rbox(3.95, 0.25, 0.25, 0.05), frame, 0, 3.1, sz * 2.6, fr);
    mesh(box(3.4, 0.06, 0.1), strip, 0, 2.94, sz * 2.6, fr);
  }
  for (const sx of [-1, 1]) {
    mesh(rbox(0.25, 0.25, 5.4, 0.05), frame, sx * 1.85, 3.1, 0, fr);
    for (const sz of [-1.2, 1.2]) {
      const sp = mesh(cyl(0.12, 0.18, 0.3, 12), PM.metal('#22252e'), sx * 1.6, 2.85, sz, fr);
      sp.rotation.z = sx * 0.5;
      mesh(sph(0.12, 8, 6), glow('#fff6e0', '#fff0c0', '#fff8e0', 0.8, 2.6), sx * 1.52, 2.73, sz, fr).castShadow = false;
    }
  }
  // Parede do fundo: amostras de cor, exaustor e prateleiras com tintas.
  mesh(rbox(3.7, 2.4, 0.25, 0.06), PM.plaster('#f6e9ff', [2, 1]), 0, 1.42, -2.85, g);
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), std('swatch', { map: TEX.swatches(), roughness: 0.6 }));
  sw.position.set(-0.8, 1.85, -2.72); g.add(sw);
  mesh(cyl(0.38, 0.38, 0.08, 20), PM.metal('#c6ccd6'), 1.05, 2.0, -2.7, g).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) mesh(box(0.7, 0.03, 0.02), mat('#3a3d48'), 1.05, 1.76 + i * 0.16, -2.64, g).castShadow = false;
  for (const y of [0.7, 1.15]) mesh(rbox(1.9, 0.06, 0.32, 0.02), PM.wood(), -0.75, y, -2.55, g);
  const cans = ['#e8473c', '#2f7bea', '#ffc93c', '#46c35a', '#8a5cf0', '#ff8a2a', '#33d0e0', '#ff4fa3'];
  cans.forEach((c, i) => {
    const x = -1.5 + (i % 4) * 0.5, y = (i < 4 ? 0.73 : 1.18) + 0.17;
    mesh(cyl(0.15, 0.15, 0.3, 14), PM.plastic(c), x, y, -2.52, g);
    mesh(cyl(0.155, 0.155, 0.04, 14), PM.metal('#c6ccd6'), x, y + 0.16, -2.52, g).castShadow = false;
  });
  // Rodas de mostruário e pistola de pintura no gancho.
  const rack = buildWheel(WHEELS.esportiva); rack.position.set(1.25, 0.95, -2.6); rack.rotation.y = Math.PI / 2; g.add(rack);
  const rack2 = buildWheel(WHEELS.cromada); rack2.position.set(0.45, 0.95, -2.6); rack2.rotation.y = Math.PI / 2; g.add(rack2);
  mesh(rbox(0.12, 0.3, 0.1, 0.03), PM.metal('#c6ccd6'), 1.6, 1.55, -2.62, g);
  mesh(cyl(0.02, 0.02, 0.9, 6), mat('#22252e'), 1.6, 1.0, -2.6, g).castShadow = false;
  const sg = sign('ESTILO', 2.6, 0.65, { bg: '#ff4fa3', stroke: '#7a1650', night: true });
  sg.position.set(0, 3.65, 2.73);
  fr.add(sg);
  mesh(rbox(2.7, 0.75, 0.12, 0.06), PM.plastic('#7a1650'), 0, 3.65, 2.64, fr);
  levelStars(fr, level, 4.1, 2.65);
  return g;
}

// ---------------- decoração do lote ----------------
export function premiumBench() {
  const g = new THREE.Group();
  const w = PM.wood([1, 1]), iron = PM.metal('#2b3242');
  for (let i = 0; i < 3; i++) mesh(rbox(1.5, 0.07, 0.15, 0.025), w, 0, 0.5, -0.19 + i * 0.18, g);
  for (let i = 0; i < 2; i++) mesh(rbox(1.5, 0.13, 0.05, 0.025), w, 0, 0.74 + i * 0.19, -0.33, g);
  for (const x of [-0.62, 0.62]) {
    mesh(rbox(0.07, 0.5, 0.5, 0.02), iron, x, 0.25, -0.03, g);
    mesh(rbox(0.06, 0.5, 0.06, 0.02), iron, x, 0.75, -0.34, g);
    mesh(rbox(0.07, 0.06, 0.5, 0.02), iron, x, 0.62, -0.03, g);
  }
  const s = softShadow(1.9, 0.9, 0.4); s.position.y = 0.02; g.add(s);
  return g;
}

export function premiumFlowerBed() {
  const g = new THREE.Group();
  mesh(rbox(1.6, 0.45, 1.6, 0.06), PM.wood([2, 1]), 0, 0.23, 0, g);
  mesh(box(1.42, 0.05, 1.42), mat('#4a3020'), 0, 0.46, 0, g).castShadow = false;
  const r = rng(77);
  const cols = ['#ff6fb5', '#ffc93c', '#ffffff', '#e8473c', '#8a5cf0', '#ff8a2a'];
  for (let i = 0; i < 14; i++) {
    const x = (r() - 0.5) * 1.2, z = (r() - 0.5) * 1.2;
    mesh(sph(0.14 + r() * 0.06, 8, 6), mat(r() < 0.5 ? '#4cb848' : '#3fa63f'), x, 0.55, z, g);
    mesh(cyl(0.012, 0.012, 0.22, 4), mat('#3f8a3a'), x, 0.68, z, g).castShadow = false;
    mesh(sph(0.075, 8, 6), mat(cols[i % cols.length], { r: 0.6 }), x, 0.8, z, g).castShadow = false;
  }
  return g;
}

// Poste de rua com braço curvo e luminária (mantém a luz que acende à noite).
export function premiumStreetLamp() {
  const g = new THREE.Group();
  const m = PM.metal('#2b3242');
  mesh(cyl(0.22, 0.28, 0.35, 12), m, 0, 0.17, 0, g);
  mesh(cyl(0.07, 0.11, 3.8, 10), m, 0, 2.05, 0, g);
  mesh(box(0.95, 0.07, 0.07), m, 0.45, 3.92, 0, g);
  const brace = mesh(box(0.55, 0.05, 0.05), m, 0.25, 3.7, 0, g);
  brace.rotation.z = 0.7;
  mesh(rbox(0.55, 0.14, 0.32, 0.05), m, 0.85, 3.95, 0, g);
  mesh(box(0.42, 0.04, 0.24), glow('#fff3c4', '#ffd77a', '#ffe7a0', 0.5, 3), 0.85, 3.86, 0, g).castShadow = false;
  lamp(g, 0.85, 3.6, 0, '#ffd27a', 9, 14);
  return g;
}

// ---------------- vegetação volumétrica ----------------
// Copas: esferas geodésicas deformadas, com cor mais escura embaixo (sombra de ambiente nos vértices).
const CANOPY = new Map();
function canopyGeo(v, detail = 2) {
  let gGeo = CANOPY.get(v + '|' + detail);
  if (gGeo) return gGeo;
  gGeo = new THREE.IcosahedronGeometry(1, detail);
  const r = rng(1000 + v * 37);
  const pos = gGeo.attributes.position;
  const cache = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let f = cache.get(k);
    if (f == null) { f = 0.86 + r() * 0.26; cache.set(k, f); }
    pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f * 0.92, pos.getZ(i) * f);
  }
  gGeo.computeVertexNormals();
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const k = 0.62 + 0.45 * Math.min(1, Math.max(0, (y + 1) / 2)); col.set([k, k, k], i * 3); }
  gGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  CANOPY.set(v + '|' + detail, gGeo);
  return gGeo;
}
const leaf = (hex) => std('leaf' + hex, { color: hex, roughness: 0.85, vertexColors: true }, 0.15);
const bark = () => std('bark', { color: '#7a5034', roughness: 0.9 }, 0.1);

export function premiumTree(seed = 1, scale = 1, detail = 2) {
  const r = rng(seed * 7919 + 13);
  const g = new THREE.Group();
  const kind = r();
  const greens = ['#4caf46', '#5cbf4f', '#3f9d3c', '#6bc556', '#56b04a'];
  if (kind < 0.16) {
    // Pinheiro: cones empilhados.
    mesh(cyl(0.12, 0.2, 1.0, 8), bark(), 0, 0.5, 0, g);
    const c = std('pine', { color: '#2f7d3f', roughness: 0.85, vertexColors: true }, 0.12);
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.ConeGeometry(1.1 - i * 0.28, 1.3, 9);
      const col = new Float32Array(cone.attributes.position.count * 3);
      for (let k = 0; k < cone.attributes.position.count; k++) { const y = cone.attributes.position.getY(k); const v = 0.7 + 0.35 * (y + 0.65) / 1.3; col.set([v, v, v], k * 3); }
      cone.setAttribute('color', new THREE.BufferAttribute(col, 3));
      mesh(cone, c, 0, 1.25 + i * 0.75, 0, g).rotation.y = r() * 3;
    }
  } else {
    // Árvore de copa (às vezes um ipê florido, rosa ou amarelo).
    const ipe = kind > 0.82 ? (r() < 0.5 ? '#ff7ac8' : '#ffd23d') : null;
    const h = 1.0 + r() * 0.5;
    mesh(cyl(0.13, 0.22, h * 1.2, 8), bark(), 0, h * 0.6, 0, g);
    for (let i = 0; i < 2; i++) {
      const b = mesh(cyl(0.05, 0.09, 0.8, 6), bark(), (i ? 0.25 : -0.22), h * 1.05, (i ? -0.1 : 0.12), g);
      b.rotation.z = i ? -0.7 : 0.6;
    }
    const n = 3 + Math.floor(r() * 3);
    const base = greens[Math.floor(r() * greens.length)];
    const crown = new THREE.Group();
    g.add(crown);
    g.userData.crown = crown;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r();
      const d = i === 0 ? 0 : 0.45 + r() * 0.25;
      const s = (i === 0 ? 0.95 : 0.65 + r() * 0.25);
      const blobM = ipe && i % 2 === 0 ? leaf(ipe) : leaf(i % 2 ? base : greens[(greens.indexOf(base) + 1) % greens.length]);
      const m = mesh(canopyGeo(Math.floor(r() * 6), detail), blobM, Math.cos(a) * d, h * 1.15 + 0.55 + (i === 0 ? 0.35 : r() * 0.4), Math.sin(a) * d, crown);
      m.scale.set(s * 1.05, s * 0.9, s);
      m.rotation.y = r() * 6;
    }
  }
  const sh = softShadow(2.6, 2.6, 0.45); sh.position.y = 0.025; g.add(sh);
  g.scale.setScalar(scale * (0.85 + r() * 0.3));
  return g;
}

export function premiumBush(seed = 1, scale = 1) {
  const r = rng(seed * 104729 + 3);
  const g = new THREE.Group();
  const base = ['#4caf46', '#3f9d3c', '#5cbf4f'][Math.floor(r() * 3)];
  for (let i = 0; i < 3; i++) {
    const m = mesh(canopyGeo(Math.floor(r() * 6), 1), leaf(base), (r() - 0.5) * 0.7, 0.32, (r() - 0.5) * 0.7, g);
    m.scale.set(0.5 + r() * 0.2, 0.42, 0.5 + r() * 0.2);
  }
  if (r() < 0.6) {
    const fc = ['#ff6fb5', '#ffffff', '#ffd23d', '#e8473c'][Math.floor(r() * 4)];
    for (let i = 0; i < 6; i++) mesh(sph(0.06, 6, 5), mat(fc, { r: 0.6 }), (r() - 0.5) * 0.9, 0.55 + r() * 0.15, (r() - 0.5) * 0.9, g).castShadow = false;
  }
  g.scale.setScalar(scale);
  return g;
}

// ---------------- detalhes que somem no zoom longe (LOD por zoom) ----------------
// Tufos de grama e florzinhas em InstancedMesh: milhares de peças em poucas chamadas de desenho.
export function scatterDetails(rects, avoid, count = 900, seed = 5) {
  const g = new THREE.Group();
  const r = rng(seed);
  const pts = [];
  let tries = 0;
  while (pts.length < count && tries < count * 20) {
    tries++;
    const R = rects[Math.floor(r() * rects.length)];
    const x = R[0] + r() * (R[2] - R[0]), z = R[1] + r() * (R[3] - R[1]);
    if (avoid(x, z)) continue;
    pts.push([x, z, r()]);
  }
  const tuftGeo = new THREE.ConeGeometry(0.07, 0.38, 3, 1, true);
  tuftGeo.translate(0, 0.19, 0);
  const tuftM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
  tuftM.envMapIntensity = 0.1;
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftM, pts.length * 3);
  const flowerGeo = new THREE.OctahedronGeometry(0.075, 0);
  const flowerM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
  flowerM.envMapIntensity = 0.1;
  const nFl = Math.floor(pts.length * 0.35);
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerM, nFl);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
  const greens = ['#5cbf4f', '#4caf46', '#6fcf58', '#3f9d3c'];
  const fcols = ['#ff6fb5', '#ffd23d', '#ffffff', '#e8473c', '#b58cff'];
  let ti = 0, fi = 0;
  for (const [x, z, k] of pts) {
    for (let j = 0; j < 3; j++) {
      e.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5); q.setFromEuler(e);
      const s = 0.7 + r() * 0.6; sc.set(s, s * (0.8 + r() * 0.5), s);
      p.set(x + (r() - 0.5) * 0.25, 0, z + (r() - 0.5) * 0.25);
      m4.compose(p, q, sc); tufts.setMatrixAt(ti, m4); tufts.setColorAt(ti, col.set(greens[Math.floor(r() * greens.length)])); ti++;
    }
    if (fi < nFl && k < 0.35) {
      p.set(x + 0.1, 0.32 + r() * 0.08, z - 0.05); sc.setScalar(0.8 + r() * 0.5); q.identity();
      m4.compose(p, q, sc); flowers.setMatrixAt(fi, m4); flowers.setColorAt(fi, col.set(fcols[Math.floor(r() * fcols.length)])); fi++;
    }
  }
  tufts.count = ti; flowers.count = fi;
  tufts.instanceMatrix.needsUpdate = true; flowers.instanceMatrix.needsUpdate = true;
  tufts.receiveShadow = true; flowers.castShadow = false; tufts.castShadow = false;
  g.add(tufts, flowers);
  return g;
}

// ---------------- mobiliário urbano ----------------
export function trashBin() {
  const g = new THREE.Group();
  mesh(cyl(0.06, 0.06, 0.9, 6), PM.metal('#2b3242'), 0, 0.45, 0, g);
  mesh(cyl(0.26, 0.22, 0.55, 14), PM.plastic('#46c35a'), 0, 0.75, 0.05, g);
  mesh(cyl(0.27, 0.27, 0.06, 14), PM.plastic('#2f8f3c'), 0, 1.03, 0.05, g);
  return g;
}
export function hydrant() {
  const g = new THREE.Group();
  const red = PM.plastic('#e8473c');
  mesh(cyl(0.16, 0.19, 0.6, 12), red, 0, 0.3, 0, g);
  mesh(sph(0.17, 12, 8), red, 0, 0.62, 0, g);
  for (const sx of [-1, 1]) mesh(cyl(0.07, 0.07, 0.18, 8), PM.metal('#c6ccd6'), sx * 0.18, 0.42, 0, g).rotation.z = Math.PI / 2;
  mesh(cyl(0.05, 0.05, 0.08, 6), PM.metal('#c6ccd6'), 0, 0.82, 0, g);
  return g;
}
export function bollard() {
  const g = new THREE.Group();
  mesh(cyl(0.09, 0.11, 0.75, 10), PM.metal('#3a3d48'), 0, 0.38, 0, g);
  mesh(cyl(0.115, 0.115, 0.08, 10), PM.plastic('#ffd23d'), 0, 0.6, 0, g).castShadow = false;
  return g;
}
export function streetSign(kind) {
  const g = new THREE.Group();
  mesh(cyl(0.04, 0.04, 2.4, 6), PM.metal('#9aa3b2'), 0, 1.2, 0, g);
  if (kind === 'pare') {
    mesh(cyl(0.38, 0.38, 0.05, 8), PM.plastic('#d93b30'), 0, 2.35, 0.04, g).rotation.set(Math.PI / 2, 0, Math.PI / 8);
    const s = sign('PARE', 0.6, 0.24, { w: 256, h: 100, bg: null, fg: '#ffffff', size: 84, stroke: null });
    s.position.set(0, 2.35, 0.075); g.add(s);
  } else {
    mesh(cyl(0.34, 0.34, 0.05, 20), PM.plastic('#ffffff'), 0, 2.35, 0.04, g).rotation.x = Math.PI / 2;
    mesh(torus(0.3, 0.05, 6, 24), PM.plastic('#d93b30'), 0, 2.35, 0.07, g);
    const s = sign('40', 0.36, 0.3, { w: 128, h: 100, bg: null, fg: '#1d2b4f', size: 80, stroke: null });
    s.position.set(0, 2.35, 0.075); g.add(s);
  }
  return g;
}
export function streetPlanterTree(seed) {
  const g = new THREE.Group();
  mesh(rbox(1.3, 0.35, 1.3, 0.05), PM.concrete(), 0, 0.17, 0, g);
  mesh(box(1.05, 0.04, 1.05), mat('#5a3a22'), 0, 0.33, 0, g).castShadow = false;
  const t = premiumTree(seed, 0.85);
  t.position.y = 0.3;
  g.add(t);
  return g;
}

// ---------------- prédios de serviço (visual novo) ----------------
const ns = (m) => { m.castShadow = false; return m; };
const wetM = () => {
  let m = MC.get('wet');
  if (!m) { m = new THREE.MeshStandardMaterial({ color: '#9fdcff', roughness: 0.02, metalness: 0.4, transparent: true, opacity: 0.5, depthWrite: false }); m.envMapIntensity = 1.6; m.userData.keep = true; MC.set('wet', m); }
  return m;
};
const bubbleM = () => {
  let m = MC.get('bubble');
  if (!m) { m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.7 }); m.envMapIntensity = 1.4; m.userData.keep = true; MC.set('bubble', m); }
  return m;
};
function signBoard(g, text, w, h, x, y, z, bg, stroke, back = '#1d2b4f', opts = {}) {
  mesh(rbox(w + 0.14, h + 0.14, 0.12, 0.05), PM.plastic(back), x, y, z - 0.07, g);
  const s = sign(text, w, h, { bg, stroke, night: true, ...opts });
  s.position.set(x, y, z);
  g.add(s);
  return s;
}

export function premiumLavajato(level) {
  const g = new THREE.Group();
  g.add(slabP(2, 3));
  groundAO(g, 3.9, 5.6);
  // Piso com grelhas de escoamento e poças d'água.
  const grate = std('grateM', { map: TEX.grate(), roughness: 0.6, metalness: 0.4 }, 0.3);
  for (const z of [-1.6, 0, 1.6]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.3), grate); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.226, z); g.add(d); }
  for (const [x, z, s] of [[0.7, 1.9, 1.1], [-0.9, -1.0, 0.7], [0.4, -0.4, 0.5]]) { const p = ns(mesh(cyl(s, s, 0.01, 20), wetM(), x, 0.232, z, g)); p.scale.set(1, 1, 0.6); }
  // Pórtico azul com colunas, faixa de LED, bicos de água e letreiro.
  const blue = PM.plastic('#2f7bea');
  for (const sx of [-1, 1]) {
    mesh(rbox(0.42, 3.1, 0.7, 0.1), blue, sx * 1.85, 1.75, 0, g);
    mesh(rbox(0.5, 0.12, 0.78, 0.03), PM.chrome(), sx * 1.85, 0.28, 0, g);
    mesh(box(0.06, 2.4, 0.08), glow('#7ff0ff', '#33d0e0', '#7ff0ff', 1.0, 2.4), sx * 1.62, 1.7, 0.3, g).castShadow = false;
    for (let i = 0; i < 4; i++) ns(mesh(cyl(0.05, 0.07, 0.12, 8), PM.metal('#c6ccd6'), sx * 1.6, 0.8 + i * 0.5, -0.25, g)).rotation.z = Math.PI / 2;
  }
  mesh(rbox(4.2, 0.65, 0.8, 0.12), blue, 0, 3.3, 0, g);
  mesh(rbox(4.24, 0.1, 0.84, 0.03), PM.plastic('#1f5bb5'), 0, 2.98, 0, g);
  signBoard(g, 'LAVA-JATO', 3.0, 0.6, 0, 3.3, 0.44, '#33d0e0', '#0f5c7a', '#0f5c7a', { size: 70 });
  levelStars(g, level, 3.8, 0.2);
  const brushes = [];
  for (const sx of [-1, 1]) {
    const b = stripeCylinder(0.42, 2.0, ['#ffc93c', '#2f7bea']);
    b.position.set(sx * 1.2, 1.3, 0); g.add(b); brushes.push(b);
    mesh(cyl(0.05, 0.05, 0.5, 6), PM.metal('#c6ccd6'), sx * 1.2, 2.5, 0, g);
  }
  const top = stripeCylinder(0.32, 2.2, ['#ffc93c', '#2f7bea'], 7);
  top.rotation.z = Math.PI / 2; top.position.set(0, 2.62, 0); g.add(top); brushes.push(top);
  g.userData.brushes = brushes;
  // Espuma (bolhas) nas escovas.
  const r = rng(41);
  for (let i = 0; i < 14; i++) ns(mesh(sph(0.08 + r() * 0.1, 8, 6), bubbleM(), (r() - 0.5) * 3, 0.3 + r() * 0.4, (r() - 0.5) * 1.6, g));
  // Lavadora de pressão, carretel de mangueira, baldes e prateleira de produtos.
  mesh(rbox(0.6, 0.55, 0.45, 0.06), PM.plastic('#e8473c'), -1.4, 0.55, -2.35, g);
  for (const sx of [-0.22, 0.22]) ns(mesh(cyl(0.12, 0.12, 0.08, 12), PM.rubber(), -1.4 + sx, 0.33, -2.12, g)).rotation.x = Math.PI / 2;
  mesh(cyl(0.03, 0.03, 0.6, 6), PM.metal('#3a3d48'), -1.4, 1.05, -2.5, g);
  const reel = mesh(torus(0.3, 0.08, 8, 18), PM.plastic('#46c35a'), -0.55, 0.85, -2.6, g); reel.rotation.y = Math.PI / 2;
  mesh(cyl(0.1, 0.1, 0.25, 10), PM.metal('#c6ccd6'), -0.55, 0.85, -2.6, g).rotation.z = Math.PI / 2;
  for (const [x, c] of [[1.0, '#ffc93c'], [1.45, '#2f7bea']]) { mesh(cyl(0.2, 0.16, 0.35, 14), PM.plastic(c), x, 0.4, -2.3, g); ns(mesh(cyl(0.17, 0.17, 0.02, 14), bubbleM(), x, 0.58, -2.3, g)); }
  mesh(rbox(1.6, 0.06, 0.32, 0.02), PM.wood(), 0.9, 1.25, -2.62, g);
  for (const sx of [0.25, 1.55]) mesh(box(0.05, 1.0, 0.3), PM.metal('#9aa3b2'), sx, 0.75, -2.62, g);
  ['#ff4fa3', '#33d0e0', '#ffc93c', '#8a5cf0', '#46c35a'].forEach((c, i) => mesh(cyl(0.08, 0.1, 0.3, 10), PM.plastic(c), 0.35 + i * 0.28, 1.43, -2.62, g));
  return g;
}

export function premiumLoja(level) {
  const g = new THREE.Group();
  g.add(slabP(2, 2));
  groundAO(g, 3.9, 3.9);
  const wall = PM.plaster('#fff4dc', [2, 1]);
  mesh(rbox(3.5, 0.4, 2.7, 0.04), PM.brick([3, 0.5]), 0, 0.42, -0.4, g);
  mesh(rbox(3.4, 2.1, 2.6, 0.08), wall, 0, 1.3, -0.4, g);
  mesh(rbox(3.6, 0.14, 2.8, 0.04), mat('#ffffff', { r: 0.55 }), 0, 2.38, -0.4, g);
  // Platibanda colorida (cor do nível) com laje de concreto.
  const tier = PM.plastic(TIER[level - 1]);
  ns(mesh(box(3.4, 0.06, 2.6), PM.concrete([1, 1]), 0, 2.48, -0.4, g));
  for (const s of [-1, 1]) { mesh(box(3.6, 0.38, 0.16), tier, 0, 2.62, -0.4 + s * 1.32, g); mesh(box(0.16, 0.38, 2.5), tier, s * 1.72, 2.62, -0.4, g); }
  mesh(rbox(0.8, 0.45, 0.6, 0.05), PM.metal('#dfe4ec'), -0.9, 2.72, -1.1, g);
  // Vitrine com prateleiras, porta de vidro, toldo de babado.
  mesh(rbox(3.1, 1.6, 0.1, 0.03), PM.metal('#3a3d48'), 0, 1.25, 0.93, g);
  ns(mesh(box(1.75, 1.3, 0.04), PM.shelves(), -0.55, 1.3, 0.99, g));
  ns(mesh(box(0.05, 1.3, 0.05), PM.metal('#c6ccd6'), -0.55, 1.3, 1.02, g));
  ns(mesh(box(0.85, 1.42, 0.04), PM.shelves(), 0.95, 1.18, 0.99, g));
  ns(mesh(box(0.05, 0.5, 0.05), PM.chrome(), 0.65, 1.15, 1.04, g));
  const aw = mesh(box(3.3, 0.07, 0.9), std('awn-r', { map: stripesTex('#e8473c', '#ffffff'), roughness: 0.75 }), 0, 2.05, 1.3, g);
  aw.rotation.x = 0.38;
  for (let i = 0; i < 10; i++) ns(mesh(cyl(0.16, 0.16, 0.06, 10, 1), i % 2 ? mat('#ffffff', { r: 0.7 }) : PM.plastic('#e8473c'), -1.48 + i * 0.33, 1.83, 1.72, g)).rotation.x = Math.PI / 2;
  signBoard(g, 'PEÇAS', 2.2, 0.6, 0, 3.15, 0.55, '#ffc93c', '#8a5a00', '#8a5a00', { fg: '#ffffff' });
  levelStars(g, level, 3.62, 0.5);
  // Expositor de pneus e pirâmide de latas de óleo na calçada.
  mesh(rbox(0.12, 1.2, 0.12, 0.03), PM.metal('#3a3d48'), -1.6, 0.8, 1.35, g);
  for (let i = 0; i < 3; i++) { const t = mesh(torus(0.26, 0.11, 10, 18), PM.rubber(), -1.6, 0.55 + i * 0.32, 1.35, g); t.rotation.y = 0.2; mesh(cyl(0.16, 0.16, 0.05, 12), PM.metal('#c6ccd6'), -1.6, 0.55 + i * 0.32, 1.35, g).rotation.x = Math.PI / 2; }
  const can = PM.plastic('#ffc93c');
  for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) mesh(cyl(0.1, 0.1, 0.22, 10), can, 1.35 + (i - (2 - row) / 2) * 0.22, 0.35 + row * 0.22, 1.35, g);
  return g;
}

export function premiumPosto(level) {
  const g = new THREE.Group();
  g.add(slabP(3, 3));
  groundAO(g, 5.8, 5.8);
  const white = mat('#ffffff', { r: 0.5 });
  const red = PM.plastic('#e8473c');
  // Ilha das bombas de concreto com protetores amarelos.
  mesh(rbox(5.2, 0.25, 1.0, 0.08), PM.concrete([3, 1]), 0, 0.33, -1.2, g);
  for (const sx of [-2.4, 2.4]) { mesh(cyl(0.08, 0.08, 0.8, 10), PM.plastic('#ffc93c'), sx, 0.75, -0.75, g); ns(mesh(cyl(0.085, 0.085, 0.12, 10), mat('#22252e'), sx, 0.95, -0.75, g)); }
  for (const sx of [-1.4, 1.4]) {
    const pump = new THREE.Group();
    mesh(rbox(0.8, 1.55, 0.58, 0.08), PM.plastic('#46c35a'), 0, 1.22, 0, pump);
    mesh(rbox(0.82, 0.3, 0.6, 0.06), white, 0, 2.05, 0, pump);
    mesh(rbox(0.6, 0.36, 0.05, 0.03), glow('#1d2b4f', '#3aff9a', '#3aff9a', 0.6, 1.6), 0, 1.6, 0.3, pump);
    mesh(box(0.5, 0.08, 0.04), PM.chrome(), 0, 1.08, 0.3, pump);
    for (const s of [-1, 1]) {
      mesh(rbox(0.12, 0.3, 0.12, 0.03), PM.metal('#22252e'), s * 0.46, 1.25, 0.12, pump);
      ns(mesh(cyl(0.025, 0.025, 0.9, 6), mat('#22252e'), s * 0.46, 0.85, 0.2, pump)).rotation.x = 0.35;
    }
    const brand = sign('NITRO', 0.6, 0.18, { w: 256, h: 80, bg: '#e8473c', stroke: '#7a1a12', size: 52 });
    brand.position.set(0, 2.05, 0.31); pump.add(brand);
    pump.position.set(sx, 0, -1.2);
    g.add(pump);
  }
  // Colunas revestidas e cobertura com faixa vermelha, letreiro e luzes embaixo.
  for (const sx of [-2.4, 2.4]) {
    mesh(rbox(0.36, 3.3, 0.36, 0.06), PM.stone([1, 3]), sx, 1.95, -1.2, g);
    mesh(rbox(0.44, 0.2, 0.44, 0.04), PM.metal('#c6ccd6'), sx, 0.32, -1.2, g);
  }
  mesh(rbox(5.9, 0.42, 3.1, 0.1), white, 0, 3.78, -1.6, g);
  mesh(rbox(6.0, 0.36, 0.12, 0.05), red, 0, 3.78, -0.04, g);
  for (const sx of [-1, 1]) mesh(rbox(0.12, 0.36, 3.2, 0.05), red, sx * 2.98, 3.78, -1.6, g);
  const s = sign('POSTO NITRO', 3.6, 0.42, { w: 768, h: 96, bg: '#e8473c', stroke: '#7a1a12', size: 66, night: true });
  s.position.set(0, 3.78, 0.03); g.add(s);
  for (const sx of [-1.8, -0.6, 0.6, 1.8]) ns(mesh(box(0.8, 0.04, 0.36), glow('#ffffff', '#ffffff', '#fff6d8', 0.4, 2.4), sx, 3.55, -1.4, g));
  lamp(g, 0, 3.2, -0.5, '#fff1d0', 10, 14);
  // Calibrador de pneus e lixeira com rodo.
  mesh(rbox(0.4, 1.2, 0.3, 0.05), PM.plastic('#2f7bea'), -2.6, 0.82, 1.9, g);
  ns(mesh(cyl(0.12, 0.12, 0.04, 16), mat('#ffffff', { r: 0.4 }), -2.6, 1.15, 2.06, g)).rotation.x = Math.PI / 2;
  const hose = mesh(torus(0.18, 0.025, 6, 16), mat('#22252e'), -2.6, 0.7, 2.08, g); hose.rotation.y = 0;
  mesh(cyl(0.16, 0.14, 0.6, 12), PM.plastic('#46c35a'), -2.0, 0.52, 2.2, g);
  // Totem de preços.
  mesh(rbox(0.3, 3.6, 0.3, 0.05), PM.metal('#5a6070'), 2.55, 1.9, 2.3, g);
  mesh(rbox(1.5, 1.5, 0.18, 0.05), PM.plastic('#0c1428'), 2.55, 3.4, 2.32, g);
  const tot = sign('GASOLINA', 1.3, 1.3, { w: 256, h: 256, bg: '#1d2b4f', fg: '#ffd23d', stroke: '#0c1428', size: 46, sub: 'R$ 5,89', night: true });
  tot.position.set(2.55, 3.4, 2.42); g.add(tot);
  mesh(rbox(1.5, 0.3, 0.2, 0.05), red, 2.55, 4.3, 2.32, g);
  levelStars(g, level, 4.2, -0.05);
  return g;
}

export function premiumRestauracao(level) {
  const g = new THREE.Group();
  g.add(slabP(2, 3));
  groundAO(g, 3.9, 5.6);
  // Galpão de tijolo com telhado de zinco ondulado.
  mesh(rbox(3.95, 2.9, 0.35, 0.05), PM.brick([4, 3]), 0, 1.65, -2.75, g);
  for (const sx of [-1, 1]) {
    mesh(rbox(0.32, 1.0, 5.2, 0.05), PM.brick([5, 1]), sx * 1.85, 0.72, -0.2, g);
    mesh(rbox(0.38, 0.08, 5.26, 0.03), PM.concrete(), sx * 1.85, 1.24, -0.2, g);
    mesh(rbox(0.25, 2.9, 0.25, 0.05), PM.metal('#5a6070'), sx * 1.85, 1.65, -0.9, g);
  }
  const roof = mesh(box(4.3, 0.08, 2.3), PM.corrugated('#b8c2cf', [6, 1]), 0, 3.12, -1.85, g);
  roof.rotation.x = -0.08;
  mesh(box(4.3, 0.12, 0.12), PM.metal('#5a6070'), 0, 3.02, -0.72, g);
  signBoard(g, 'RESTAURAÇÃO', 3.2, 0.55, 0, 2.5, -2.52, '#ff8a2a', '#7a2e00', '#7a2e00', { w: 768, h: 128, size: 70 });
  // Guincho de motor (talha) amarelo com corrente e motor pendurado.
  const y = PM.plastic('#ffc93c');
  mesh(rbox(0.9, 0.1, 0.12, 0.03), y, -1.4, 0.32, -1.9, g);
  for (const sx of [-0.4, 0.4]) mesh(rbox(0.1, 0.08, 1.2, 0.02), y, -1.4 + sx, 0.3, -1.35, g);
  mesh(rbox(0.16, 2.2, 0.16, 0.04), y, -1.4, 1.4, -1.9, g);
  const arm = mesh(rbox(0.15, 0.15, 1.5, 0.04), y, -1.4, 2.4, -1.3, g); arm.rotation.x = 0.2;
  for (let i = 0; i < 6; i++) ns(mesh(torus(0.04, 0.012, 4, 8), PM.metal('#5a6070'), -1.4, 2.05 - i * 0.08, -0.72, g)).rotation.y = i % 2 ? Math.PI / 2 : 0;
  mesh(rbox(0.55, 0.42, 0.42, 0.05), PM.metal('#6b7180'), -1.4, 1.45, -0.72, g);
  for (let i = 0; i < 3; i++) mesh(box(0.08, 0.1, 0.44), PM.metal('#9aa3b2'), -1.56 + i * 0.16, 1.72, -0.72, g);
  // Bancada de madeira com morsa, gaveteiro, peças enferrujadas e máquina de solda.
  mesh(rbox(1.5, 0.12, 0.62, 0.03), PM.wood([2, 1]), 0.95, 1.02, -2.3, g);
  for (const sx of [0.3, 1.6]) mesh(box(0.08, 0.9, 0.55), PM.metal('#5a6070'), sx, 0.57, -2.3, g);
  mesh(rbox(0.2, 0.18, 0.26, 0.03), PM.metal('#2f7bea'), 0.4, 1.17, -2.15, g);
  const rust = [PM.plastic('#a0522d'), PM.metal('#6b7180'), PM.plastic('#c26a2e')];
  for (let i = 0; i < 3; i++) mesh(rbox(0.28, 0.2, 0.28, 0.04), rust[i], 0.85 + i * 0.36, 1.18, -2.32, g);
  mesh(rbox(0.5, 0.45, 0.4, 0.05), PM.plastic('#2f7bea'), 1.45, 0.45, -1.6, g);
  ns(mesh(box(0.3, 0.1, 0.02), glow('#3aff9a', '#3aff9a', '#3aff9a', 0.8, 1.8), 1.45, 0.55, -1.39, g));
  // Porta velha encostada na parede e pneus carecas.
  const door = mesh(rbox(0.9, 0.8, 0.08, 0.04), PM.plastic('#8fa3b8'), 1.6, 0.68, -0.4, g); door.rotation.set(0, -Math.PI / 2, -0.15);
  tireStack(g, -1.55, 1.9, 2);
  levelStars(g, level, 3.55, -2.6);
  return g;
}

export function premiumShowroom() {
  const g = new THREE.Group();
  g.add(slabP(3, 3));
  groundAO(g, 5.8, 5.8);
  const gloss = std('gloss', { color: '#f4f6fa', roughness: 0.08, metalness: 0.1 }, 1.2);
  ns(mesh(box(5.6, 0.04, 5.6), gloss, 0, 0.24, 0, g));
  // Parede do fundo azul-marinho com painel de LED e letreiro brilhante.
  mesh(rbox(5.6, 3.3, 0.3, 0.06), PM.plastic('#1d2b4f'), 0, 1.85, -2.75, g);
  for (let i = 0; i < 5; i++) ns(mesh(box(0.04, 2.6, 0.04), glow('#36b8ff', '#36b8ff', '#7fd7ff', 0.9, 2.2), -2.2 + i * 1.1, 1.7, -2.58, g));
  const s = sign('SHOWROOM', 4.2, 0.8, { w: 768, h: 144, bg: null, fg: '#fff6fb', stroke: null, size: 110, glow: '#36b8ff' });
  s.position.set(0, 2.85, -2.56); g.add(s);
  // Colunas cromadas, vidros laterais e trilho de spots.
  for (const sx of [-1, 1]) {
    mesh(rbox(0.25, 3.3, 0.25, 0.05), PM.chrome(), sx * 2.75, 1.85, 2.6, g);
    ns(mesh(box(0.08, 1.7, 5.2), std('showglass', { color: '#bfe7ff', roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.28, depthWrite: false }, 1.4), sx * 2.78, 1.05, 0, g));
    mesh(box(0.1, 0.08, 5.3), PM.metal('#c6ccd6'), sx * 2.78, 1.92, 0, g);
    mesh(rbox(0.12, 0.12, 5.4, 0.03), PM.metal('#3a3d48'), sx * 2.3, 3.4, 0, g);
    for (const z of [-1.4, 0, 1.4]) {
      const sp = mesh(cyl(0.1, 0.15, 0.28, 10), PM.metal('#22252e'), sx * 2.1, 3.22, z, g);
      sp.rotation.z = sx * 0.6;
      ns(mesh(sph(0.1, 8, 6), glow('#fff6e0', '#fff0c0', '#fff8e0', 0.8, 2.6), sx * 2.0, 3.12, z, g));
    }
  }
  for (const sl of SHOWROOM_SLOTS) {
    mesh(cyl(1.25, 1.35, 0.2, 40), std('podium', { color: '#e9edf3', roughness: 0.18, metalness: 0.3 }, 1.0), sl.x, 0.34, sl.z, g);
    const ring = ns(mesh(torus(1.3, 0.045, 6, 48), glow('#36b8ff', '#36b8ff', '#36b8ff', 1.2, 2.6), sl.x, 0.42, sl.z, g));
    ring.rotation.x = Math.PI / 2;
  }
  // Vasos com plantas nos cantos da frente.
  for (const sx of [-2.4, 2.4]) { mesh(cyl(0.28, 0.22, 0.5, 14), PM.plastic('#ffffff'), sx, 0.5, 2.2, g); const b = premiumBush(sx > 0 ? 5 : 9, 0.55); b.position.set(sx, 0.62, 2.2); g.add(b); }
  lamp(g, 0, 3, 0, '#d8f0ff', 10, 10);
  g.userData.slots = SHOWROOM_SLOTS;
  return g;
}

export function premiumGuincho(level) {
  const g = new THREE.Group();
  g.add(slabP(2, 3));
  groundAO(g, 3.9, 5.6);
  hazard(g, 3.6, 2.75);
  // Cabine de atendimento rebocada, com janela, porta, ar-condicionado e laje colorida.
  mesh(rbox(1.7, 0.3, 1.5, 0.04), PM.brick([2, 0.5]), -1.0, 0.37, -2.0, g);
  mesh(rbox(1.6, 2.1, 1.4, 0.08), PM.plaster('#fff4dc', [1, 1]), -1.0, 1.4, -2.0, g);
  mesh(rbox(1.8, 0.25, 1.6, 0.06), PM.plastic(TIER[level - 1]), -1.0, 2.55, -2.0, g);
  mesh(rbox(1.0, 0.8, 0.08, 0.03), mat('#ffffff', { r: 0.5 }), -1.2, 1.55, -1.28, g);
  ns(mesh(box(0.85, 0.65, 0.04), PM.pane(), -1.2, 1.55, -1.23, g));
  mesh(rbox(0.35, 0.3, 0.5, 0.04), PM.metal('#e8ecf2'), -0.05, 1.9, -2.2, g);
  // Placa 24H com fundo, postes e a luz de chamado (pisca quando tem chamado).
  signBoard(g, 'GUINCHO 24H', 2.6, 0.6, 0.3, 3.3, -2.6, '#ffc93c', '#1d2b4f', '#1d2b4f', { w: 640, h: 128, fg: '#1d2b4f', size: 76 });
  for (const sx of [-0.8, 1.4]) mesh(rbox(0.12, 3.0, 0.12, 0.03), PM.metal('#5a6070'), sx, 1.5, -2.72, g);
  mesh(cyl(0.18, 0.2, 0.1, 12), PM.metal('#3a3d48'), -1.0, 2.72, -2.0, g);
  const beacon = mesh(sph(0.22, 10, 8), mat('#ff3b3b', { e: '#ff2020', ei: 2 }), -1.0, 2.88, -2.0, g);
  beacon.visible = false;
  g.userData.beacon = beacon;
  const truck = buildTowTruck();
  truck.scale.setScalar(0.8);
  truck.position.set(0.55, 0.22, 0.3);
  g.add(truck);
  g.userData.truck = truck;
  for (let i = 0; i < 3; i++) g.add(buildCone(-1.6 + i * 0.5, 2.4));
  // Corrente enrolada, pneu reserva e galões.
  mesh(torus(0.25, 0.06, 6, 16), PM.metal('#6b7180'), 1.5, 0.3, -2.3, g).rotation.x = Math.PI / 2;
  for (const [x, c] of [[1.1, '#e8473c'], [1.4, '#ffc93c']]) mesh(rbox(0.25, 0.4, 0.18, 0.04), PM.plastic(c), x, 0.43, -1.6, g);
  levelStars(g, level, 3.85, -2.6);
  return g;
}
