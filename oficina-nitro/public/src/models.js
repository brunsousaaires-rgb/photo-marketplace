// Modelos 3D procedurais (sem arquivos externos): carros, construções, decoração, pessoas.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { part, TILE, BUILDINGS } from './data.js';

// ---------- utilidades ----------
const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + '|' + JSON.stringify(o);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color, roughness: o.r ?? 0.7, metalness: o.m ?? 0,
      emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, flatShading: !!o.flat,
    });
    matCache.set(key, m);
  }
  return m;
}

const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
const f2 = (n) => Math.round(n * 100) / 100;
export const rbox = (w, h, d, r = 0.08) => cached(`rb${f2(w)},${f2(h)},${f2(d)},${f2(r)}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)));
export const box = (w, h, d) => cached(`b${f2(w)},${f2(h)},${f2(d)}`, () => new THREE.BoxGeometry(w, h, d));
export const cyl = (rt, rb, h, s = 16) => cached(`c${f2(rt)},${f2(rb)},${f2(h)},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
export const sph = (r, ws = 12, hs = 10) => cached(`s${f2(r)},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));

export function mesh(geo, material, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

const texCache = new Map();
export function textTexture(text, { w = 512, h = 128, bg = '#2f7bea', fg = '#ffffff', size = 78, stroke = '#173a7a', radius = 26, glow = null } = {}) {
  const key = [text, w, h, bg, fg, size, stroke, glow].join('|');
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(4, 4, w - 8, h - 8, radius);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = stroke;
    g.stroke();
  }
  g.font = `${size}px "Lilita One", "Arial Black", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (glow) { g.shadowColor = glow; g.shadowBlur = 30; }
  if (stroke && !glow) { g.lineWidth = 12; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(text, w / 2, h / 2 + 4); }
  g.fillStyle = fg;
  g.fillText(text, w / 2, h / 2 + 4);
  if (glow) g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

export function clearTextures() {
  for (const t of texCache.values()) t.dispose();
  texCache.clear();
}

function sign(text, w, h, opts = {}) {
  const tex = textTexture(text, opts);
  const m = new THREE.Mesh(
    cached(`pl${w},${h}`, () => new THREE.PlaneGeometry(w, h)),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: opts.glow ? 1.2 : 0.3 }),
  );
  return m;
}

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

// ---------- carros ----------
const CAR_DIMS = {
  hatch: { L: 2.9, W: 1.56, H: 0.55, CL: 1.55, CZ: -0.3, CH: 0.56, spoilerOnRoof: true },
  sedan: { L: 3.35, W: 1.6, H: 0.52, CL: 1.5, CZ: -0.12, CH: 0.52 },
  pickup: { L: 3.6, W: 1.72, H: 0.62, CL: 1.25, CZ: 0.55, CH: 0.6, bed: true },
  esportivo: { L: 3.4, W: 1.78, H: 0.42, CL: 1.3, CZ: -0.35, CH: 0.42 },
  van: { L: 3.5, W: 1.72, H: 0.62, CL: 2.75, CZ: -0.3, CH: 0.86, van: true, spoilerOnRoof: true },
};

const WHEELS = {
  padrao: { r: 0.36, tw: 0.3, rim: '#c3c8d2', rimR: 0.55, rm: 0.3 },
  esportiva: { r: 0.38, tw: 0.32, rim: '#ff3b3b', rimR: 0.68, rm: 0.2, spokes: true },
  cromada: { r: 0.39, tw: 0.32, rim: '#eef2fa', rimR: 0.7, rm: 1, rr: 0.12, spokes: true },
  offroad: { r: 0.5, tw: 0.42, rim: '#ffcc33', rimR: 0.5, rm: 0.2 },
};

const LIGHT_COLORS = new Set(['branco', 'amarelo', 'prata', 'dourado', 'ciano']);

function buildWheel(def) {
  const g = new THREE.Group();
  const tire = mesh(cyl(def.r, def.r, def.tw, 20), mat('#24252b', { r: 0.95 }));
  tire.rotation.z = Math.PI / 2;
  g.add(tire);
  const rimMat = mat(def.rim, { r: def.rr ?? 0.4, m: def.rm });
  const rim = mesh(cyl(def.r * def.rimR, def.r * def.rimR, def.tw + 0.03, 16), rimMat);
  rim.rotation.z = Math.PI / 2;
  g.add(rim);
  const hub = mesh(cyl(def.r * 0.18, def.r * 0.18, def.tw + 0.07, 10), mat('#3a3d48', { m: 0.5, r: 0.4 }));
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  if (def.spokes) {
    for (let i = 0; i < 5; i++) {
      const sp = mesh(box(def.tw + 0.05, def.r * def.rimR * 1.7, 0.07), mat('#2b2d36', { r: 0.5 }));
      sp.rotation.x = (i / 5) * Math.PI;
      g.add(sp);
    }
  }
  return g;
}

export function buildCar(spec) {
  const D = CAR_DIMS[spec.type] || CAR_DIMS.hatch;
  const col = part('color', spec.color) || { hex: '#e8473c' };
  const wd = WHEELS[spec.wheels] || WHEELS.padrao;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const paint = new THREE.MeshStandardMaterial({ color: col.hex, roughness: col.metal ? 0.25 : 0.32, metalness: col.metal ? 0.75 : 0.08 });
  paint.userData.base = new THREE.Color(col.hex);
  const dark = mat('#2b2d36', { r: 0.6 });
  const glass = mat('#27385c', { r: 0.12, m: 0.35 });
  const { L, W, H, CL, CZ, CH } = D;
  const lift = spec.wheels === 'offroad' ? 0.16 : 0;
  const bottom = wd.r * 0.72 + lift;
  const top = bottom + H;

  mesh(rbox(W, H, L, 0.17), paint, 0, bottom + H / 2, 0, body);
  mesh(rbox(W * 0.98, 0.2, 0.24, 0.07), dark, 0, bottom + 0.12, L / 2 - 0.06, body);
  mesh(rbox(W * 0.98, 0.2, 0.24, 0.07), dark, 0, bottom + 0.12, -L / 2 + 0.06, body);
  // Grade e faróis.
  mesh(rbox(W * 0.42, 0.16, 0.06, 0.03), dark, 0, bottom + H * 0.55, L / 2 + 0.005, body);
  for (const sx of [-1, 1]) {
    mesh(rbox(0.34, 0.15, 0.08, 0.05), mat('#fff6c8', { e: '#ffe9a0', ei: 0.9 }), sx * W * 0.33, bottom + H * 0.6, L / 2 - 0.01, body);
    mesh(rbox(0.3, 0.13, 0.08, 0.04), mat('#ff3b3b', { e: '#ff2020', ei: 0.6 }), sx * W * 0.34, bottom + H * 0.62, -L / 2 + 0.01, body);
  }

  if (D.van) {
    mesh(rbox(W * 0.95, CH, CL, 0.2), paint, 0, top + CH / 2 - 0.05, CZ, body);
    mesh(rbox(W * 0.97, 0.3, CL * 0.8, 0.08), glass, 0, top + CH * 0.62, CZ + 0.05, body);
    mesh(rbox(W * 0.8, 0.34, 0.1, 0.05), glass, 0, top + CH * 0.6, CZ + CL / 2 + 0.01, body);
  } else {
    mesh(rbox(W * 0.84, CH, CL, 0.2), glass, 0, top + CH / 2 - 0.04, CZ, body);
    mesh(rbox(W * 0.86, 0.12, CL * 0.88, 0.06), paint, 0, top + CH - 0.02, CZ, body);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      mesh(box(0.09, CH * 0.9, 0.12), paint, sx * W * 0.41, top + CH / 2 - 0.05, CZ + sz * (CL / 2 - 0.1), body);
    }
  }
  if (D.bed) {
    const bz = -L / 2 + (L / 2 + CZ - CL / 2) / 2 - 0.1;
    const bl = L / 2 + CZ - CL / 2 - 0.15;
    mesh(box(W * 0.86, 0.06, bl), dark, 0, top + 0.01, bz, body);
    for (const sx of [-1, 1]) mesh(rbox(0.12, 0.3, bl, 0.04), paint, sx * (W / 2 - 0.08), top + 0.14, bz, body);
    mesh(rbox(W, 0.3, 0.12, 0.04), paint, 0, top + 0.14, -L / 2 + 0.08, body);
  }

  // Rodas.
  const wheels = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = buildWheel(wd);
    w.position.set(sx * (W / 2 - wd.tw / 2 + 0.06), wd.r, sz * (L / 2 - 0.66));
    root.add(w);
    wheels.push(w);
  }
  if (lift) for (const sx of [-1, 1]) mesh(box(0.08, 0.3, L * 0.5), dark, sx * W * 0.3, bottom - 0.08, 0, body);

  // Aerofólio.
  const back = -L / 2 + 0.25;
  const sy = D.spoilerOnRoof ? top + CH : top;
  const sz0 = D.spoilerOnRoof ? CZ - CL / 2 + 0.15 : back;
  if (spec.spoiler === 'pequeno') {
    mesh(rbox(W * 0.82, 0.08, 0.34, 0.03), paint, 0, sy + 0.06, sz0, body);
  } else if (spec.spoiler === 'grande') {
    const carbon = mat('#1f222b', { r: 0.35, m: 0.3 });
    mesh(rbox(W * 1.02, 0.08, 0.46, 0.03), carbon, 0, sy + 0.42, sz0 - 0.05, body);
    for (const sx of [-1, 1]) {
      mesh(box(0.07, 0.38, 0.1), carbon, sx * W * 0.3, sy + 0.2, sz0, body);
      mesh(rbox(0.06, 0.26, 0.5, 0.02), paint, sx * W * 0.51, sy + 0.42, sz0 - 0.05, body);
    }
  }

  // Adesivos.
  const decalCol = LIGHT_COLORS.has(spec.color) ? '#22252e' : '#ffffff';
  const dm = mat(decalCol, { r: 0.5 });
  if (spec.decal === 'listras') {
    const hoodLen = L / 2 - (CZ + CL / 2) - 0.1;
    for (const sx of [-0.15, 0.15]) {
      if (hoodLen > 0.1) mesh(box(0.14, 0.02, hoodLen), dm, sx, top + 0.005, CZ + CL / 2 + hoodLen / 2, body);
      mesh(box(0.14, 0.02, CL * 0.86), dm, sx, top + CH + 0.045, CZ, body);
      const trunk = L / 2 + (CZ - CL / 2) - 0.1;
      if (trunk > 0.2 && !D.bed) mesh(box(0.14, 0.02, trunk), dm, sx, top + 0.005, -L / 2 + trunk / 2 + 0.05, body);
    }
  } else if (spec.decal === 'faixa') {
    for (const sx of [-1, 1]) {
      mesh(box(0.02, 0.1, L * 0.82), dm, sx * (W / 2 + 0.003), bottom + H * 0.62, 0, body);
      mesh(box(0.02, 0.05, L * 0.7), mat(spec.color === 'vermelho' ? '#ffc93c' : '#e8473c'), sx * (W / 2 + 0.004), bottom + H * 0.45, 0.1, body);
    }
  } else if (spec.decal === 'numero') {
    const tex = textTexture('77', { w: 128, h: 128, bg: '#ffffff', fg: '#22252e', size: 70, stroke: '#22252e', radius: 64 });
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(cached('numpl', () => new THREE.PlaneGeometry(0.46, 0.46)), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5 }));
      p.position.set(sx * (W / 2 + 0.01), bottom + H * 0.52, 0.05);
      p.rotation.y = sx * Math.PI / 2;
      body.add(p);
    }
  }

  // Neon embaixo do carro.
  let neon = null;
  if (spec.neon && spec.neon !== 'nenhum') {
    const n = part('neon', spec.neon);
    neon = new THREE.Mesh(
      cached(`neonpl${W},${L}`, () => new THREE.PlaneGeometry(W * 1.9, L * 1.45)),
      new THREE.MeshBasicMaterial({ map: glowTexture(), color: n.hex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95 }),
    );
    neon.rotation.x = -Math.PI / 2;
    neon.position.y = 0.04;
    root.add(neon);
    mesh(box(W * 0.9, 0.04, L * 0.86), mat(n.hex, { e: n.hex, ei: 1.4 }), 0, bottom - 0.02, 0, body);
  }

  // Sujeira (some durante a lavagem).
  const mud = new THREE.Group();
  const mudMat = mat('#6b4a2c', { r: 1 });
  for (let i = 0; i < 7; i++) {
    const sx = i % 2 ? 1 : -1;
    const m = mesh(sph(0.16 + (i % 3) * 0.05, 8, 6), mudMat, sx * (W / 2 - 0.02), bottom + 0.15 + (i % 3) * 0.12, -L / 2 + 0.4 + (i / 7) * (L - 0.8));
    m.scale.set(0.35, 1, 1.4);
    mud.add(m);
  }
  body.add(mud);

  const dirtCol = new THREE.Color('#8a6a45');
  function setDirt(f) {
    paint.color.copy(paint.userData.base).lerp(dirtCol, f * 0.55);
    mud.visible = f > 0.05;
    mud.scale.setScalar(Math.max(0.01, f));
  }
  setDirt(spec.dirt || 0);

  root.userData = { body, wheels, wheelR: wd.r, paint, neon, setDirt, spec: { ...spec }, length: L };
  return root;
}

// ---------- pessoas ----------
export function buildMechanic(color = '#2f7bea') {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const overall = mat(color, { r: 0.8 });
  for (const sx of [-1, 1]) mesh(rbox(0.17, 0.4, 0.2, 0.05), mat('#26344f'), sx * 0.11, 0.2, 0, body);
  mesh(rbox(0.52, 0.55, 0.36, 0.14), overall, 0, 0.66, 0, body);
  mesh(rbox(0.3, 0.2, 0.05, 0.03), mat('#ffffff'), 0, 0.72, 0.18, body);
  const head = mesh(sph(0.27, 14, 12), mat('#f1c09a', { r: 0.8 }), 0, 1.15, 0, body);
  head.scale.set(1, 0.95, 1);
  mesh(sph(0.04, 6, 6), mat('#22252e'), -0.09, 1.18, 0.24, body);
  mesh(sph(0.04, 6, 6), mat('#22252e'), 0.09, 1.18, 0.24, body);
  const cap = mesh(sph(0.29, 14, 8), mat('#e8473c', { r: 0.7 }), 0, 1.23, 0, body);
  cap.scale.set(1, 0.55, 1);
  mesh(rbox(0.36, 0.05, 0.2, 0.02), mat('#e8473c'), 0, 1.25, 0.25, body);
  const armL = new THREE.Group();
  armL.position.set(-0.32, 0.86, 0);
  mesh(rbox(0.14, 0.42, 0.14, 0.06), overall, 0, -0.18, 0, armL);
  body.add(armL);
  const armR = new THREE.Group();
  armR.position.set(0.32, 0.86, 0);
  mesh(rbox(0.14, 0.42, 0.14, 0.06), overall, 0, -0.18, 0, armR);
  mesh(rbox(0.07, 0.3, 0.07, 0.02), mat('#aab2c0', { m: 0.8, r: 0.3 }), 0, -0.42, 0.1, armR);
  body.add(armR);
  g.userData = { body, armL, armR };
  return g;
}

// ---------- construções ----------
const TIER = ['#2f7bea', '#46c35a', '#8a5cf0', '#ff8a2a', '#e8b33a'];

function slab(w, d, color = '#d5d9e0') {
  const s = mesh(rbox(w * TILE - 0.16, 0.22, d * TILE - 0.16, 0.08), mat(color), 0, 0.11, 0);
  s.castShadow = false;
  return s;
}

function hazard(g, width, z) {
  const n = 8, sw = width / n;
  for (let i = 0; i < n; i++) {
    mesh(box(sw, 0.03, 0.26), mat(i % 2 ? '#22252e' : '#ffc93c'), -width / 2 + sw * (i + 0.5), 0.235, z, g).castShadow = false;
  }
}

function buildElevador(level) {
  const g = new THREE.Group();
  g.add(slab(2, 3));
  hazard(g, 3.6, 2.75);
  const wall = mat('#eef1f5');
  mesh(rbox(3.9, 2.3, 0.35, 0.08), wall, 0, 1.15 + 0.2, -2.75, g);
  mesh(rbox(4.0, 0.3, 0.45, 0.08), mat(TIER[level - 1]), 0, 2.55, -2.75, g);
  for (const sx of [-1, 1]) mesh(rbox(0.3, 0.9, 2.6, 0.08), wall, sx * 1.85, 0.65, -1.4, g);
  const s = sign('OFICINA', 2.6, 0.65, { bg: TIER[level - 1], stroke: '#173a7a' });
  s.position.set(0, 3.05, -2.7);
  g.add(s);
  mesh(rbox(2.7, 0.75, 0.12, 0.06), mat('#173a7a'), 0, 3.05, -2.79, g);
  // Painel de ferramentas.
  mesh(box(1.6, 0.9, 0.05), mat('#9aa3b2'), -0.6, 1.5, -2.55, g).castShadow = false;
  const toolCols = ['#e8473c', '#ffc93c', '#2f7bea', '#46c35a'];
  for (let i = 0; i < 4; i++) mesh(rbox(0.12, 0.55 - (i % 2) * 0.15, 0.05, 0.03), mat(toolCols[i]), -1.2 + i * 0.4, 1.5, -2.5, g);
  // Gaveteiro vermelho e pneus.
  mesh(rbox(0.85, 1.0, 0.55, 0.06), mat('#e8473c', { r: 0.5 }), 1.25, 0.72, -2.25, g);
  for (let i = 0; i < 3; i++) mesh(box(0.7, 0.03, 0.02), mat('#9e2b23'), 1.25, 0.5 + i * 0.25, -1.97, g);
  // Elevador: colunas + braços que sobem.
  const liftCol = mat('#ff6a3d', { r: 0.5 });
  for (const sx of [-1, 1]) mesh(rbox(0.3, 2.2, 0.3, 0.06), liftCol, sx * 1.3, 1.3, 0.1, g);
  const lift = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-0.8, 0.9]) mesh(box(0.9, 0.08, 0.16), mat('#3a3d48', { m: 0.4 }), sx * 0.85, 0, sz, lift);
  lift.position.y = 0.3;
  g.add(lift);
  g.userData.lift = lift;
  return g;
}

function buildCabine(level) {
  const g = new THREE.Group();
  g.add(slab(2, 3, '#e3e0ea'));
  const disc = new THREE.Group();
  mesh(cyl(1.8, 1.8, 0.1, 40), mat('#3a3d48', { r: 0.4, m: 0.3 }), 0, 0.27, 0, disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 8, 48), mat('#ff4fd8', { e: '#ff4fd8', ei: 1.5 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.32;
  disc.add(ring);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    mesh(box(0.5, 0.02, 0.08), mat('#ffffff', { e: '#ffffff', ei: 0.5 }), Math.cos(a) * 1.4, 0.33, Math.sin(a) * 1.4, disc).rotation.y = -a;
  }
  g.add(disc);
  g.userData.disc = disc;
  const frame = mat('#2b2d36', { r: 0.5 });
  const fr = new THREE.Group(); // estrutura que some quando a câmera aproxima
  g.add(fr);
  g.userData.frame = fr;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(rbox(0.22, 2.8, 0.22, 0.05), frame, sx * 1.85, 1.6, sz * 2.6, sz > 0 ? fr : g);
  for (const sz of [-1, 1]) {
    mesh(rbox(3.95, 0.25, 0.25, 0.05), frame, 0, 3.0, sz * 2.6, fr);
    mesh(box(3.4, 0.06, 0.1), mat('#ffffff', { e: '#fff2fb', ei: 1.2 }), 0, 2.84, sz * 2.6, fr);
  }
  for (const sx of [-1, 1]) mesh(rbox(0.25, 0.25, 5.4, 0.05), frame, sx * 1.85, 3.0, 0, fr);
  // Parede de fundo e placa.
  mesh(rbox(3.6, 2.2, 0.25, 0.06), mat('#f6e9ff'), 0, 1.3, -2.85, g);
  const s = sign('ESTILO', 2.6, 0.65, { bg: '#ff4fa3', stroke: '#7a1650' });
  s.position.set(0, 3.55, 2.73);
  fr.add(s);
  mesh(rbox(2.7, 0.75, 0.12, 0.06), mat('#7a1650'), 0, 3.55, 2.64, fr);
  for (let i = 0; i < level; i++) mesh(sph(0.1, 8, 6), mat('#ffd23d', { e: '#ffb800', ei: 0.6 }), -0.4 * (level - 1) / 2 + i * 0.4, 4.0, 2.65, fr);
  // Latas de tinta.
  const cans = ['#e8473c', '#2f7bea', '#ffc93c', '#46c35a', '#8a5cf0'];
  cans.forEach((c, i) => {
    mesh(cyl(0.16, 0.16, 0.32, 12), mat(c, { r: 0.4 }), -1.4 + (i % 3) * 0.36, 0.38 + Math.floor(i / 3) * 0.33, -2.45, g);
  });
  return g;
}

function stripeCylinder(r, h, colors, n = 6) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) mesh(cyl(r, r, h / n, 14), mat(colors[i % colors.length], { r: 0.9 }), 0, -h / 2 + (h / n) * (i + 0.5), 0, g);
  return g;
}

function buildLavajato(level) {
  const g = new THREE.Group();
  g.add(slab(2, 3, '#cfe3f2'));
  for (let i = 0; i < 4; i++) mesh(box(3.2, 0.02, 0.08), mat('#8fb3cf'), 0, 0.23, -1.8 + i * 1.2, g).castShadow = false;
  const blue = mat('#2f7bea', { r: 0.5 });
  for (const sx of [-1, 1]) mesh(rbox(0.4, 3.1, 0.6, 0.1), blue, sx * 1.85, 1.7, 0, g);
  mesh(rbox(4.1, 0.6, 0.7, 0.12), blue, 0, 3.25, 0, g);
  const s = sign('LAVA-JATO', 3.0, 0.62, { bg: '#33d0e0', stroke: '#0f5c7a', size: 70 });
  s.position.set(0, 3.25, 0.37);
  g.add(s);
  const brushes = [];
  for (const sx of [-1, 1]) {
    const b = stripeCylinder(0.42, 2.0, ['#ffc93c', '#2f7bea']);
    b.position.set(sx * 1.25, 1.3, 0);
    g.add(b);
    brushes.push(b);
  }
  const top = stripeCylinder(0.32, 2.2, ['#ffc93c', '#2f7bea'], 7);
  top.rotation.z = Math.PI / 2;
  top.position.set(0, 2.62, 0);
  g.add(top);
  brushes.push(top);
  g.userData.brushes = brushes;
  for (let i = 0; i < level; i++) mesh(sph(0.1, 8, 6), mat('#ffd23d', { e: '#ffb800', ei: 0.6 }), -0.4 * (level - 1) / 2 + i * 0.4, 3.7, 0.2, g);
  return g;
}

function buildLoja(level) {
  const g = new THREE.Group();
  g.add(slab(2, 2, '#e9e2d4'));
  mesh(rbox(3.4, 2.1, 2.6, 0.12), mat('#fff4dc'), 0, 1.25, -0.4, g);
  mesh(rbox(3.7, 0.3, 2.9, 0.1), mat(TIER[level - 1]), 0, 2.45, -0.4, g);
  mesh(rbox(1.6, 1.0, 0.08, 0.05), mat('#9fd8f5', { r: 0.1, m: 0.3, e: '#3a6a8a', ei: 0.3 }), -0.6, 1.25, 0.92, g);
  mesh(rbox(0.8, 1.5, 0.08, 0.05), mat('#8a5a3a'), 1.0, 0.98, 0.92, g);
  for (let i = 0; i < 7; i++) {
    const a = mesh(box(3.6 / 7, 0.06, 0.9), mat(i % 2 ? '#ffffff' : '#e8473c'), -1.8 + (3.6 / 7) * (i + 0.5), 1.92, 1.3, g);
    a.rotation.x = 0.35;
  }
  const s = sign('PEÇAS', 2.2, 0.6, { bg: '#ffc93c', fg: '#ffffff', stroke: '#8a5a00' });
  s.position.set(0, 2.95, 0.6);
  g.add(s);
  mesh(rbox(2.3, 0.7, 0.12, 0.05), mat('#8a5a00'), 0, 2.95, 0.52, g);
  // Pneus e calotas na vitrine externa.
  for (let i = 0; i < 2; i++) {
    const t = mesh(new THREE.TorusGeometry(0.28, 0.13, 8, 16), mat('#24252b'), -1.3 + i * 0.65, 0.42, 1.25, g);
    t.rotation.y = 0.3;
  }
  return g;
}

function buildEscritorio() {
  const g = new THREE.Group();
  g.add(slab(3, 3, '#e6e8ee'));
  mesh(rbox(5.4, 3.2, 4.2, 0.15), mat('#fdf7ec'), 0, 1.8, -0.5, g);
  mesh(rbox(5.7, 0.35, 4.5, 0.1), mat('#2f7bea'), 0, 3.5, -0.5, g);
  mesh(rbox(5.5, 0.5, 0.2, 0.08), mat('#ff8a2a'), 0, 0.45, 1.62, g);
  // Porta de garagem listrada e janelas.
  mesh(rbox(2.4, 2.1, 0.1, 0.05), mat('#c9ced8', { m: 0.3, r: 0.4 }), -1.2, 1.3, 1.62, g);
  for (let i = 0; i < 6; i++) mesh(box(2.3, 0.03, 0.04), mat('#9aa3b2'), -1.2, 0.45 + i * 0.32, 1.68, g);
  mesh(rbox(1.7, 1.2, 0.1, 0.05), mat('#9fd8f5', { r: 0.1, m: 0.3, e: '#3a6a8a', ei: 0.35 }), 1.4, 1.9, 1.62, g);
  mesh(rbox(1.8, 0.12, 0.25, 0.04), mat('#ffffff'), 1.4, 1.25, 1.7, g);
  // Placa gigante no telhado.
  const s = sign('OFICINA NITRO', 5.4, 1.2, { w: 1024, h: 224, bg: '#ff8a2a', stroke: '#7a2e00', size: 150, radius: 50 });
  s.position.set(0, 4.75, 0.12);
  g.add(s);
  mesh(rbox(5.6, 1.35, 0.18, 0.08), mat('#7a2e00'), 0, 4.75, 0.0, g);
  for (const sx of [-1.8, 1.8]) mesh(box(0.15, 0.9, 0.15), mat('#5a6070'), sx, 3.95, -0.05, g);
  // Pneu-logo na lateral.
  const t = mesh(new THREE.TorusGeometry(0.55, 0.22, 10, 20), mat('#24252b'), 2.75, 2.1, -0.5, g);
  t.rotation.y = Math.PI / 2;
  mesh(cyl(0.35, 0.35, 0.1, 16), mat('#ffc93c'), 2.78, 2.1, -0.5, g).rotation.z = Math.PI / 2;
  return g;
}

// ---------- decoração ----------
function buildTree(scale = 1, tint = 0) {
  const g = new THREE.Group();
  mesh(cyl(0.16, 0.22, 1.1, 8), mat('#8a5a3a'), 0, 0.55, 0, g);
  const greens = ['#4cb848', '#5ccc52', '#3fa63f'];
  const c = greens[tint % 3];
  mesh(sph(0.85, 10, 8), mat(c, { flat: true }), 0, 1.55, 0, g);
  mesh(sph(0.62, 10, 8), mat(greens[(tint + 1) % 3], { flat: true }), 0.35, 2.05, 0.1, g);
  mesh(sph(0.5, 10, 8), mat(c, { flat: true }), -0.3, 2.1, -0.15, g);
  g.scale.setScalar(scale);
  return g;
}

function buildDecor(type) {
  const g = new THREE.Group();
  switch (type) {
    case 'arvore': g.add(buildTree(1, 0)); break;
    case 'flores': {
      mesh(rbox(1.6, 0.45, 1.6, 0.1), mat('#b07a4a'), 0, 0.23, 0, g);
      mesh(box(1.4, 0.05, 1.4), mat('#5a3a22'), 0, 0.46, 0, g);
      const cols = ['#ff6fb5', '#ffc93c', '#ffffff', '#e8473c', '#8a5cf0'];
      for (let i = 0; i < 9; i++) {
        const x = -0.45 + (i % 3) * 0.45, z = -0.45 + Math.floor(i / 3) * 0.45;
        mesh(sph(0.16, 8, 6), mat('#4cb848', { flat: true }), x, 0.55, z, g);
        mesh(sph(0.12, 8, 6), mat(cols[i % cols.length]), x + 0.05, 0.72, z + 0.03, g);
      }
      break;
    }
    case 'banco': {
      const wood = mat('#c98a4b');
      for (let i = 0; i < 3; i++) mesh(rbox(1.5, 0.08, 0.16, 0.03), wood, 0, 0.5, -0.2 + i * 0.19, g);
      for (let i = 0; i < 2; i++) mesh(rbox(1.5, 0.14, 0.06, 0.03), wood, 0, 0.75 + i * 0.2, -0.33, g);
      for (const sx of [-0.6, 0.6]) mesh(rbox(0.1, 0.5, 0.6, 0.03), mat('#3a3d48'), sx, 0.26, -0.05, g);
      break;
    }
    case 'poste': {
      mesh(cyl(0.08, 0.12, 2.8, 8), mat('#3a3d48', { m: 0.4 }), 0, 1.4, 0, g);
      mesh(rbox(0.5, 0.25, 0.5, 0.08), mat('#3a3d48'), 0, 2.85, 0, g);
      mesh(sph(0.2, 10, 8), mat('#fff3c4', { e: '#ffd77a', ei: 1.4 }), 0, 2.65, 0, g);
      mesh(cyl(0.3, 0.3, 0.1, 10), mat('#3a3d48'), 0, 0.05, 0, g);
      break;
    }
    case 'pneus': {
      for (let i = 0; i < 4; i++) {
        const t = mesh(new THREE.TorusGeometry(0.42, 0.2, 8, 16), mat('#24252b', { r: 0.9 }), (i % 2) * 0.05, 0.2 + i * 0.36, 0, g);
        t.rotation.x = Math.PI / 2;
      }
      mesh(cyl(0.25, 0.25, 0.05, 12), mat('#ffc93c'), 0, 1.5, 0, g);
      break;
    }
    case 'refri': {
      mesh(rbox(1.0, 1.9, 0.8, 0.08), mat('#e8473c', { r: 0.4 }), 0, 0.95, 0, g);
      mesh(rbox(0.6, 1.2, 0.06, 0.04), mat('#bfe7ff', { e: '#7ac7ff', ei: 0.6, r: 0.1 }), -0.12, 1.15, 0.41, g);
      mesh(rbox(0.18, 0.5, 0.06, 0.03), mat('#2b2d36'), 0.33, 1.2, 0.41, g);
      const s = sign('REFRI', 0.9, 0.3, { w: 256, h: 96, bg: '#ffffff', fg: '#e8473c', stroke: '#e8473c', size: 64 });
      s.position.set(0, 1.75, 0.42);
      g.add(s);
      break;
    }
    case 'bandeira': {
      mesh(cyl(0.06, 0.06, 3.2, 8), mat('#c9ced8', { m: 0.6, r: 0.3 }), -0.5, 1.6, 0, g);
      const c = document.createElement('canvas');
      c.width = 128; c.height = 96;
      const x = c.getContext('2d');
      for (let i = 0; i < 8; i++) for (let k = 0; k < 6; k++) { x.fillStyle = (i + k) % 2 ? '#111' : '#fff'; x.fillRect(i * 16, k * 16, 16, 16); }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9, 8, 1), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 }));
      flag.position.set(0.12, 2.7, 0);
      flag.castShadow = true;
      g.add(flag);
      g.userData.flag = flag;
      break;
    }
    case 'placa': {
      for (const sx of [-1.2, 1.2]) mesh(box(0.12, 1.4, 0.12), mat('#3a3d48'), sx, 0.7, 0, g);
      mesh(rbox(3.3, 1.1, 0.2, 0.08), mat('#1a1530'), 0, 1.8, 0, g);
      const s = sign('NITRO', 3.0, 0.95, { w: 512, h: 160, bg: null, fg: '#ffe6fb', stroke: null, size: 120, glow: '#ff3fd0' });
      s.position.set(0, 1.8, 0.11);
      g.add(s);
      g.userData.neonSign = s;
      break;
    }
    case 'chafariz': {
      mesh(cyl(1.7, 1.8, 0.5, 28), mat('#d5d9e0'), 0, 0.25, 0, g);
      const water = mesh(cyl(1.5, 1.5, 0.08, 28), mat('#5ec8ff', { r: 0.1, m: 0.2, e: '#2a8ad0', ei: 0.35 }), 0, 0.47, 0, g);
      water.castShadow = false;
      mesh(cyl(0.25, 0.35, 1.3, 12), mat('#d5d9e0'), 0, 0.9, 0, g);
      mesh(cyl(0.75, 0.4, 0.25, 20), mat('#d5d9e0'), 0, 1.6, 0, g);
      const jet = mesh(sph(0.3, 10, 8), mat('#9fe0ff', { e: '#5ec8ff', ei: 0.5, r: 0.1 }), 0, 1.95, 0, g);
      g.userData.jet = jet;
      break;
    }
    case 'trofeu': {
      mesh(rbox(1.8, 0.6, 1.8, 0.1), mat('#2b2d36'), 0, 0.3, 0, g);
      mesh(rbox(1.3, 0.5, 1.3, 0.08), mat('#3a3d48'), 0, 0.85, 0, g);
      const cup = new THREE.Group();
      const gold = mat('#ffcc33', { m: 0.85, r: 0.25 });
      mesh(cyl(0.2, 0.35, 0.5, 14), gold, 0, 1.35, 0, cup);
      mesh(cyl(0.75, 0.3, 1.0, 20), gold, 0, 2.1, 0, cup);
      for (const sx of [-1, 1]) {
        const h = mesh(new THREE.TorusGeometry(0.32, 0.08, 8, 16, Math.PI), gold, sx * 0.72, 2.15, 0, cup);
        h.rotation.z = sx * Math.PI / 2;
      }
      mesh(sph(0.22, 10, 8), mat('#ff6fb5', { m: 0.3, r: 0.2, e: '#ff3fa0', ei: 0.3 }), 0, 2.75, 0, cup);
      g.add(cup);
      g.userData.cup = cup;
      break;
    }
  }
  return g;
}

export function buildBuilding(type, level = 1) {
  let g;
  switch (type) {
    case 'elevador': g = buildElevador(level); break;
    case 'cabine': g = buildCabine(level); break;
    case 'lavajato': g = buildLavajato(level); break;
    case 'loja': g = buildLoja(level); break;
    case 'escritorio': g = buildEscritorio(); break;
    default: g = buildDecor(type);
  }
  if (type === 'elevador') {
    const mech = buildMechanic('#2f7bea');
    mech.position.set(1.55, 0.22, 1.5);
    mech.rotation.y = -Math.PI / 2;
    g.add(mech);
    g.userData.mech = mech;
  }
  if (type === 'lavajato' || type === 'cabine') {
    const mech = buildMechanic(type === 'cabine' ? '#ff4fa3' : '#33d0e0');
    mech.position.set(-1.55, 0.22, 1.9);
    mech.rotation.y = Math.PI / 2;
    g.add(mech);
    g.userData.mech = mech;
  }
  return g;
}

export { buildTree, BUILDINGS };

// Casa simples para o outro lado da rua.
export function buildHouse(color, roof) {
  const g = new THREE.Group();
  mesh(rbox(4, 2.4, 3.4, 0.12), mat(color), 0, 1.2, 0, g);
  const r = mesh(new THREE.ConeGeometry(3.2, 1.6, 4), mat(roof, { flat: true }), 0, 3.2, 0, g);
  r.rotation.y = Math.PI / 4;
  r.scale.set(1, 1, 0.82);
  mesh(rbox(0.8, 1.4, 0.1, 0.04), mat('#8a5a3a'), -0.8, 0.7, -1.72, g);
  mesh(rbox(1.0, 0.8, 0.1, 0.04), mat('#9fd8f5', { e: '#3a6a8a', ei: 0.3 }), 0.8, 1.4, -1.72, g);
  return g;
}

// Material translúcido para o "fantasma" do modo construção.
export function ghostify(group, ok) {
  const m = new THREE.MeshStandardMaterial({ color: ok ? '#6dff8a' : '#ff5a5a', transparent: true, opacity: 0.55, emissive: ok ? '#2a8a3a' : '#8a2020', emissiveIntensity: 0.5 });
  group.traverse((o) => { if (o.isMesh) { o.material = m; o.castShadow = false; } });
}
