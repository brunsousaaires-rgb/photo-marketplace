// Modelos 3D procedurais (sem arquivos externos): carros, pessoas, construções, decoração, pista.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { part, TILE } from './data.js';

// ---------- utilidades ----------
const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + '|' + JSON.stringify(o);
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color, roughness: o.r ?? 0.7, metalness: o.m ?? 0,
      emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, flatShading: !!o.flat,
      transparent: o.t != null, opacity: o.t ?? 1,
    });
    m.envMapIntensity = (o.m ?? 0) > 0.4 ? 1 : 0.12;
    matCache.set(key, m);
  }
  return m;
}

// Materiais que acendem à noite (faróis, janelas, postes, letreiros).
export const NIGHT = new Set();
export function glow(color, dayE, nightE, dayI = 0.3, nightI = 1.6, o = {}) {
  const key = 'glow|' + [color, dayE, nightE, dayI, nightI, JSON.stringify(o)].join('|');
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.4, metalness: o.m ?? 0, emissive: dayE, emissiveIntensity: dayI });
    m.userData.night = { dayE: new THREE.Color(dayE), nightE: new THREE.Color(nightE), dayI, nightI };
    matCache.set(key, m);
    NIGHT.add(m);
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
const torus = (r, t, rs = 8, ts = 16, arc = Math.PI * 2) => cached(`t${f2(r)},${f2(t)},${rs},${ts},${f2(arc)}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc));
const plane = (w, h) => cached(`pl${f2(w)},${f2(h)}`, () => new THREE.PlaneGeometry(w, h));

export function mesh(geo, material, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

const texCache = new Map();
export function textTexture(text, { w = 512, h = 128, bg = '#2f7bea', fg = '#ffffff', size = 78, stroke = '#173a7a', radius = 26, glow: gl = null, sub = null } = {}) {
  const key = [text, w, h, bg, fg, size, stroke, gl, sub].join('|');
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
  const ty = sub ? h * 0.38 : h / 2 + 4;
  if (gl) { g.shadowColor = gl; g.shadowBlur = 30; }
  if (stroke && !gl) { g.lineWidth = 12; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(text, w / 2, ty); }
  g.fillStyle = fg;
  g.fillText(text, w / 2, ty);
  if (gl) g.fillText(text, w / 2, ty);
  if (sub) {
    g.font = `${Math.round(size * 0.5)}px "Lilita One", "Arial Black", sans-serif`;
    g.shadowBlur = 0;
    g.fillStyle = fg;
    g.fillText(sub, w / 2, h * 0.76);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

function canvasTex(w, h, draw, repeat = null) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

function sign(text, w, h, opts = {}) {
  const tex = textTexture(text, opts);
  const m = new THREE.Mesh(plane(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: opts.glow ? 1.2 : 0.3 }));
  if (opts.glow || opts.night) {
    m.material.userData.night = { dayE: new THREE.Color('#ffffff'), nightE: new THREE.Color('#ffffff'), dayI: opts.glow ? 1.1 : 0.3, nightI: opts.glow ? 2.2 : 0.9 };
    NIGHT.add(m.material);
  }
  return m;
}

let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  glowTex = canvasTex(128, 128, (g) => {
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  });
  return glowTex;
}

function lamp(parent, x, y, z, color = '#ffd27a', dist = 9, max = 12) {
  const l = new THREE.PointLight(color, 0, dist, 1.8);
  l.position.set(x, y, z);
  l.userData.max = max;
  parent.add(l);
  (parent.userData.lights ||= []).push(l);
  return l;
}

// ---------- carros ----------
const CAR_DIMS = {
  hatch: { L: 2.9, W: 1.56, H: 0.55, CL: 1.55, CZ: -0.3, CH: 0.56, spoilerOnRoof: true },
  sedan: { L: 3.35, W: 1.6, H: 0.52, CL: 1.5, CZ: -0.12, CH: 0.52 },
  pickup: { L: 3.6, W: 1.72, H: 0.62, CL: 1.25, CZ: 0.55, CH: 0.6, bed: true },
  esportivo: { L: 3.4, W: 1.78, H: 0.42, CL: 1.3, CZ: -0.35, CH: 0.42 },
  van: { L: 3.5, W: 1.72, H: 0.62, CL: 2.75, CZ: -0.3, CH: 0.86, van: true, spoilerOnRoof: true },
};

export const WHEELS = {
  padrao: { r: 0.36, tw: 0.3, rim: '#c3c8d2', rimR: 0.55, rm: 0.3 },
  esportiva: { r: 0.38, tw: 0.32, rim: '#ff3b3b', rimR: 0.68, rm: 0.2, spokes: 5 },
  cromada: { r: 0.39, tw: 0.32, rim: '#eef2fa', rimR: 0.72, rm: 1, rr: 0.12, spokes: 8 },
  offroad: { r: 0.5, tw: 0.42, rim: '#ffcc33', rimR: 0.5, rm: 0.2, tread: true },
  raio: { r: 0.39, tw: 0.32, rim: '#ffcc33', rimR: 0.74, rm: 1, rr: 0.18, spokes: 6, spokeCol: '#ffd96a', spokeMetal: true },
  neonrim: { r: 0.38, tw: 0.32, rim: '#1d2b4f', rimR: 0.7, rm: 0.3, glowRim: '#35f0ff' },
  turbina: { r: 0.4, tw: 0.34, rim: '#f4f6fa', rimR: 0.76, rm: 0.6, rr: 0.2, fan: 10 },
};

const LIGHT_COLORS = new Set(['branco', 'amarelo', 'prata', 'dourado', 'ciano']);

export function buildWheel(def) {
  const g = new THREE.Group();
  const tire = mesh(cyl(def.r, def.r, def.tw, 22), mat('#24252b', { r: 0.95 }));
  tire.rotation.z = Math.PI / 2;
  g.add(tire);
  // Banda de rodagem com gomos.
  const nT = def.tread ? 12 : 0;
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * Math.PI * 2;
    const k = mesh(box(def.tw + 0.04, 0.09, 0.12), mat('#1c1d22', { r: 1 }), 0, Math.cos(a) * def.r, Math.sin(a) * def.r);
    k.rotation.x = a;
    g.add(k);
  }
  const rimMat = mat(def.rim, { r: def.rr ?? 0.4, m: def.rm });
  const rim = mesh(cyl(def.r * def.rimR, def.r * def.rimR, def.tw + 0.03, 18), rimMat);
  rim.rotation.z = Math.PI / 2;
  g.add(rim);
  const hub = mesh(cyl(def.r * 0.18, def.r * 0.18, def.tw + 0.07, 10), mat('#3a3d48', { m: 0.5, r: 0.4 }));
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  for (let i = 0; i < (def.spokes || 0); i++) {
    const col = def.spokeCol || (def.spokes > 5 ? '#9aa3b2' : '#2b2d36');
    const sp = mesh(box(def.tw + 0.05, def.r * def.rimR * 1.75, 0.06), mat(col, { r: 0.3, m: def.spokeMetal || def.spokes > 5 ? 0.9 : 0 }));
    sp.rotation.x = (i / def.spokes) * Math.PI;
    g.add(sp);
  }
  if (def.glowRim) {
    for (const sx of [-1, 1]) {
      const ring = mesh(torus(def.r * 0.62, 0.035, 6, 24), glow(def.glowRim, def.glowRim, def.glowRim, 1.6, 2.6), sx * (def.tw / 2 + 0.02), 0, 0);
      ring.rotation.y = Math.PI / 2;
      ring.castShadow = false;
      g.add(ring);
    }
  }
  for (let i = 0; i < (def.fan || 0); i++) {
    const a = (i / def.fan) * Math.PI * 2;
    const bl = mesh(box(def.tw + 0.06, def.r * 0.5, 0.05), mat('#9aa3b2', { m: 0.9, r: 0.25 }), 0, Math.cos(a) * def.r * 0.33, Math.sin(a) * def.r * 0.33);
    bl.rotation.x = -a + 0.5;
    g.add(bl);
  }
  return g;
}

export function buildWheelModel(id) {
  return buildWheel(WHEELS[id] || WHEELS.padrao);
}

function paintMaterial(col) {
  if (col.iris) {
    const m = new THREE.MeshPhysicalMaterial({ color: col.hex, roughness: 0.18, metalness: 0.65, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 900], clearcoat: 1 });
    m.envMapIntensity = 1.4;
    return m;
  }
  if (col.pearl) {
    const m = new THREE.MeshPhysicalMaterial({ color: col.hex, roughness: 0.25, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 1, sheenColor: new THREE.Color('#ffd9f0'), sheenRoughness: 0.4 });
    m.envMapIntensity = 0.8;
    return m;
  }
  const m = new THREE.MeshStandardMaterial({
    color: col.hex,
    roughness: col.chrome ? 0.06 : col.matte ? 0.95 : col.metal ? 0.22 : 0.3,
    metalness: col.chrome ? 1 : col.matte ? 0 : col.metal ? 0.75 : 0.08,
  });
  m.envMapIntensity = col.chrome ? 1.6 : col.metal ? 1 : col.matte ? 0.05 : 0.35;
  return m;
}

const decalTexCache = new Map();
function decalTexture(kind, colorHex) {
  const key = kind + colorHex;
  if (decalTexCache.has(key)) return decalTexCache.get(key);
  const t = canvasTex(256, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    if (kind === 'chamas') {
      const grd = g.createLinearGradient(0, 0, w, 0);
      grd.addColorStop(0, '#ffe14a'); grd.addColorStop(0.5, '#ff8a2a'); grd.addColorStop(1, '#e8301c');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(0, h * 0.2);
      for (let i = 0; i <= 6; i++) { const x = (i / 6) * w; g.quadraticCurveTo(x - w / 14, h * (i % 2 ? 0.05 : 0.35), x, h * (i % 2 ? 0.25 : 0.1)); }
      g.lineTo(w, h * 0.5);
      for (let i = 6; i >= 0; i--) { const x = (i / 6) * w; g.quadraticCurveTo(x + w / 14, h * (i % 2 ? 0.95 : 0.7), x, h * (i % 2 ? 0.8 : 0.9)); }
      g.closePath();
      g.fill();
      g.lineWidth = 3; g.strokeStyle = '#7a1a12'; g.stroke();
    } else if (kind === 'relampago') {
      g.fillStyle = '#ffd23d';
      g.strokeStyle = '#1d2b4f'; g.lineWidth = 4;
      g.beginPath();
      g.moveTo(10, h * 0.55); g.lineTo(w * 0.4, h * 0.2); g.lineTo(w * 0.42, h * 0.45); g.lineTo(w * 0.75, h * 0.15); g.lineTo(w * 0.62, h * 0.55); g.lineTo(w - 6, h * 0.35);
      g.lineTo(w * 0.55, h * 0.85); g.lineTo(w * 0.58, h * 0.6); g.lineTo(w * 0.25, h * 0.85); g.lineTo(w * 0.32, h * 0.55); g.closePath();
      g.fill(); g.stroke();
    } else if (kind === 'xadrez') {
      for (let i = 0; i < 16; i++) for (let k = 0; k < 4; k++) { g.fillStyle = (i + k) % 2 ? '#111' : '#fff'; g.fillRect(i * 16, k * 16, 16, 16); }
    }
  });
  decalTexCache.set(key, t);
  return t;
}

export function buildCar(spec, { driver = true, face = null } = {}) {
  const D = CAR_DIMS[spec.type] || CAR_DIMS.hatch;
  const col = part('color', spec.color) || { hex: '#e8473c' };
  const wd = WHEELS[spec.wheels] || WHEELS.padrao;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const paint = paintMaterial(col);
  paint.userData.base = new THREE.Color(col.hex);
  const dark = mat('#2b2d36', { r: 0.6 });
  const trim = mat('#3a3d48', { r: 0.5, m: 0.2 });
  const glass = mat('#2a4068', { r: 0.08, m: 0.4, t: 0.62 });
  const { L, W, H, CL, CZ, CH } = D;
  const lift = spec.wheels === 'offroad' ? 0.16 : 0;
  const bottom = wd.r * 0.72 + lift;
  const top = bottom + H;

  // Carroceria + para-choques.
  mesh(rbox(W, H, L, 0.18), paint, 0, bottom + H / 2, 0, body);
  mesh(rbox(W * 0.98, 0.2, 0.26, 0.08), trim, 0, bottom + 0.12, L / 2 - 0.06, body);
  mesh(rbox(W * 0.98, 0.2, 0.26, 0.08), trim, 0, bottom + 0.12, -L / 2 + 0.06, body);
  // Grade, faróis, lanternas e placa Mercosul.
  mesh(rbox(W * 0.44, 0.16, 0.06, 0.03), dark, 0, bottom + H * 0.55, L / 2 + 0.005, body);
  for (let i = 0; i < 3; i++) mesh(box(W * 0.4, 0.02, 0.07), mat('#5a6070'), 0, bottom + H * 0.5 + i * 0.05, L / 2 + 0.01, body);
  const head = glow('#fff6c8', '#ffe9a0', '#fff4c0', 0.6, 2.4);
  const tail = glow('#ff3b3b', '#ff2020', '#ff2a2a', 0.5, 1.8);
  for (const sx of [-1, 1]) {
    mesh(rbox(0.36, 0.16, 0.08, 0.05), head, sx * W * 0.33, bottom + H * 0.62, L / 2 - 0.01, body);
    mesh(rbox(0.32, 0.13, 0.08, 0.04), tail, sx * W * 0.34, bottom + H * 0.64, -L / 2 + 0.01, body);
  }
  for (const sz of [1, -1]) {
    mesh(box(0.46, 0.15, 0.03), mat('#ffffff', { r: 0.5 }), 0, bottom + 0.16, sz * (L / 2 + 0.07), body);
    mesh(box(0.46, 0.04, 0.035), mat('#1f5bd8'), 0, bottom + 0.215, sz * (L / 2 + 0.072), body);
  }
  // Escapamento.
  const ex = mesh(cyl(0.06, 0.06, 0.22, 8), mat('#6b7180', { m: 0.8, r: 0.3 }), W * 0.28, bottom + 0.06, -L / 2 - 0.02, body);
  ex.rotation.x = Math.PI / 2;
  // Caixas de roda escuras.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const arch = mesh(torus(wd.r + 0.08, 0.05, 6, 14, Math.PI), dark, sx * (W / 2 + 0.005), wd.r + lift * 0.5, sz * (L / 2 - 0.66));
    arch.rotation.y = Math.PI / 2;
    arch.castShadow = false;
    body.add(arch);
  }

  // Cabine.
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
  // Retrovisores, maçanetas e linhas das portas.
  for (const sx of [-1, 1]) {
    mesh(rbox(0.12, 0.1, 0.18, 0.03), paint, sx * (W * 0.46 + 0.07), top + 0.1, CZ + CL / 2 - 0.12, body);
    mesh(box(0.02, H * 0.62, 0.025), mat('#22252e'), sx * (W / 2 + 0.002), bottom + H * 0.5, CZ + CL / 2 - 0.05, body).castShadow = false;
    mesh(box(0.03, 0.04, 0.14), trim, sx * (W / 2 + 0.01), bottom + H * 0.72, CZ + 0.15, body).castShadow = false;
  }
  if (driver && !D.van) {
    const skin = face?.skin || ['#f1c09a', '#c98a5e', '#8a5a3a', '#f6d2b4'][Math.abs(hash(spec.color + spec.type)) % 4];
    mesh(sph(0.16, 10, 8), mat(skin, { r: 0.8 }), W * 0.2, top + 0.2, CZ + 0.15, body);
    const hairCol = face?.hat || face?.hair || ['#3a2a1e', '#1f1f24', '#c98a2a', '#7a3a2a'][Math.abs(hash(spec.type + spec.color)) % 4];
    if (face?.style !== 'careca' || face?.hat) {
      const hair = mesh(sph(0.17, 10, 6), mat(hairCol, { r: 0.9 }), W * 0.2, top + 0.27, CZ + 0.1, body);
      hair.scale.set(1, 0.6, 1);
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
  const sy = D.spoilerOnRoof ? top + CH : top;
  const sz0 = D.spoilerOnRoof ? CZ - CL / 2 + 0.15 : -L / 2 + 0.25;
  if (spec.spoiler === 'pequeno') {
    const lip = mesh(rbox(W * 0.86, 0.08, 0.34, 0.03), paint, 0, sy + 0.07, sz0, body);
    lip.rotation.x = -0.18;
  } else if (spec.spoiler === 'grande') {
    const carbon = mat('#1f222b', { r: 0.35, m: 0.3 });
    const wing = mesh(rbox(W * 1.04, 0.08, 0.5, 0.03), carbon, 0, sy + 0.46, sz0 - 0.05, body);
    wing.rotation.x = -0.12;
    for (const sx of [-1, 1]) {
      mesh(box(0.07, 0.42, 0.12), carbon, sx * W * 0.3, sy + 0.22, sz0, body);
      mesh(rbox(0.06, 0.28, 0.54, 0.02), paint, sx * W * 0.52, sy + 0.46, sz0 - 0.05, body);
    }
  } else if (spec.spoiler === 'ducktail') {
    const duck = mesh(rbox(W * 0.94, 0.12, 0.42, 0.05), paint, 0, sy + 0.1, sz0 - 0.08, body);
    duck.rotation.x = -0.45;
  } else if (spec.spoiler === 'drift') {
    const carbon = mat('#1f222b', { r: 0.35, m: 0.3 });
    const wing = mesh(rbox(W * 1.25, 0.09, 0.62, 0.03), carbon, 0, sy + 0.78, sz0 - 0.15, body);
    wing.rotation.x = -0.2;
    mesh(box(W * 1.2, 0.03, 0.12), mat('#e8473c', { e: '#e8473c', ei: 0.3 }), 0, sy + 0.84, sz0 - 0.38, body);
    for (const sx of [-1, 1]) {
      const post = mesh(box(0.06, 0.8, 0.1), carbon, sx * W * 0.28, sy + 0.38, sz0 - 0.05, body);
      post.rotation.x = 0.25;
      mesh(rbox(0.06, 0.4, 0.7, 0.02), paint, sx * W * 0.63, sy + 0.78, sz0 - 0.15, body);
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
      mesh(box(0.02, 0.1, L * 0.82), dm, sx * (W / 2 + 0.004), bottom + H * 0.62, 0, body);
      mesh(box(0.02, 0.05, L * 0.7), mat(spec.color === 'vermelho' ? '#ffc93c' : '#e8473c'), sx * (W / 2 + 0.005), bottom + H * 0.42, 0.1, body);
    }
  } else if (spec.decal === 'chamas' || spec.decal === 'relampago') {
    const tex = decalTexture(spec.decal, decalCol);
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(plane(L * 0.62, H * 0.75), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4 }));
      p.position.set(sx * (W / 2 + 0.012), bottom + H * 0.5, L * 0.12);
      p.rotation.y = sx * Math.PI / 2;
      if (sx < 0) p.scale.x = -1;
      body.add(p);
    }
  } else if (spec.decal === 'xadrez') {
    const tex = decalTexture('xadrez', decalCol);
    const roof = new THREE.Mesh(plane(CL * 0.85, 0.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
    roof.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    roof.position.set(0, top + CH + 0.05, CZ);
    body.add(roof);
    const hoodLen = L / 2 - (CZ + CL / 2) - 0.1;
    if (hoodLen > 0.2) {
      const hood = new THREE.Mesh(plane(hoodLen, 0.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
      hood.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      hood.position.set(0, top + 0.01, CZ + CL / 2 + hoodLen / 2);
      body.add(hood);
    }
  } else if (spec.decal === 'numero') {
    const tex = textTexture('77', { w: 128, h: 128, bg: '#ffffff', fg: '#22252e', size: 70, stroke: '#22252e', radius: 64 });
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(plane(0.46, 0.46), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5 }));
      p.position.set(sx * (W / 2 + 0.012), bottom + H * 0.52, 0.05);
      p.rotation.y = sx * Math.PI / 2;
      body.add(p);
    }
  }

  // Neon embaixo do carro.
  let neon = null;
  if (spec.neon && spec.neon !== 'nenhum') {
    const n = part('neon', spec.neon);
    neon = new THREE.Mesh(
      plane(W * 1.9, L * 1.45),
      new THREE.MeshBasicMaterial({ map: glowTexture(), color: n.hex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95 }),
    );
    neon.rotation.x = -Math.PI / 2;
    neon.position.y = 0.04;
    neon.userData.rainbow = !!n.rainbow;
    root.add(neon);
    mesh(box(W * 0.9, 0.04, L * 0.86), mat(n.hex, { e: n.hex, ei: 1.4 }), 0, bottom - 0.02, 0, body);
  }

  // Sujeira e ferrugem.
  const mud = new THREE.Group();
  const mudMat = mat('#6b4a2c', { r: 1 });
  for (let i = 0; i < 7; i++) {
    const sx = i % 2 ? 1 : -1;
    const m = mesh(sph(0.16 + (i % 3) * 0.05, 8, 6), mudMat, sx * (W / 2 - 0.02), bottom + 0.15 + (i % 3) * 0.12, -L / 2 + 0.4 + (i / 7) * (L - 0.8));
    m.scale.set(0.35, 1, 1.4);
    mud.add(m);
  }
  body.add(mud);
  const rust = new THREE.Group();
  const rustMats = [mat('#a0522d', { r: 1 }), mat('#7a3b1d', { r: 1 }), mat('#c26a2e', { r: 1 })];
  for (let i = 0; i < 12; i++) {
    const sx = i % 2 ? 1 : -1;
    const onTop = i % 3 === 0;
    const m = mesh(sph(0.12 + (i % 4) * 0.05, 7, 5), rustMats[i % 3], onTop ? (i % 5 - 2) * 0.2 : sx * (W / 2 - 0.03), onTop ? top - 0.02 : bottom + 0.1 + (i % 4) * 0.1, -L / 2 + 0.3 + ((i * 7) % 12) / 12 * (L - 0.6));
    m.scale.set(onTop ? 1.3 : 0.3, onTop ? 0.25 : 1, 1.3);
    rust.add(m);
  }
  body.add(rust);
  rust.visible = (spec.rust || 0) > 0;
  if (spec.rust) paint.color.copy(paint.userData.base).lerp(new THREE.Color('#8a7a6a'), 0.5);

  const dirtCol = new THREE.Color('#8a6a45');
  function setDirt(f) {
    paint.color.copy(paint.userData.base).lerp(dirtCol, f * 0.55);
    if (spec.rust) paint.color.lerp(new THREE.Color('#8a7a6a'), 0.5);
    mud.visible = f > 0.05;
    mud.scale.setScalar(Math.max(0.01, f));
  }
  function setRust(f) {
    rust.visible = f > 0.05;
    rust.scale.setScalar(Math.max(0.01, f));
    paint.color.copy(paint.userData.base).lerp(new THREE.Color('#8a7a6a'), f * 0.5);
  }
  setDirt(spec.dirt || 0);
  if (spec.rust) setRust(spec.rust);

  root.userData = { body, wheels, wheelR: wd.r, paint, neon, setDirt, setRust, spec: { ...spec }, length: L, width: W };
  return root;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

// ---------- pessoas ----------
export function buildPerson({ shirt = '#2f7bea', pants = '#26344f', skin = '#f1c09a', hat = null, hair = '#3a2a1e', tool = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const legs = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.11, 0.42, 0);
    mesh(rbox(0.17, 0.4, 0.2, 0.05), mat(pants), 0, -0.2, 0, leg);
    mesh(rbox(0.19, 0.08, 0.26, 0.03), mat('#22252e'), 0, -0.38, 0.04, leg);
    body.add(leg);
    legs.push(leg);
  }
  const shirtM = mat(shirt, { r: 0.8 });
  mesh(rbox(0.52, 0.55, 0.36, 0.14), shirtM, 0, 0.68, 0, body);
  if (tool) mesh(rbox(0.3, 0.2, 0.05, 0.03), mat('#ffffff'), 0, 0.74, 0.18, body);
  mesh(sph(0.27, 14, 12), mat(skin, { r: 0.8 }), 0, 1.17, 0, body).scale.set(1, 0.95, 1);
  mesh(sph(0.04, 6, 6), mat('#22252e'), -0.09, 1.2, 0.24, body);
  mesh(sph(0.04, 6, 6), mat('#22252e'), 0.09, 1.2, 0.24, body);
  mesh(box(0.1, 0.025, 0.02), mat('#9e2b23'), 0, 1.08, 0.26, body);
  if (hat) {
    const cap = mesh(sph(0.29, 14, 8), mat(hat, { r: 0.7 }), 0, 1.25, 0, body);
    cap.scale.set(1, 0.55, 1);
    mesh(rbox(0.36, 0.05, 0.2, 0.02), mat(hat), 0, 1.27, 0.25, body);
  } else {
    const hr = mesh(sph(0.285, 14, 8), mat(hair, { r: 0.9 }), 0, 1.24, -0.03, body);
    hr.scale.set(1, 0.65, 1);
  }
  const arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(sx * 0.32, 0.88, 0);
    mesh(rbox(0.14, 0.42, 0.14, 0.06), shirtM, 0, -0.18, 0, arm);
    mesh(sph(0.08, 8, 6), mat(skin), 0, -0.42, 0, arm);
    if (tool && sx > 0) mesh(rbox(0.07, 0.3, 0.07, 0.02), mat('#aab2c0', { m: 0.8, r: 0.3 }), 0, -0.46, 0.1, arm);
    body.add(arm);
    arms.push(arm);
  }
  g.userData = { body, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1] };
  return g;
}

export function buildMechanic(color = '#2f7bea', hat = '#e8473c') {
  return buildPerson({ shirt: color, hat, tool: true });
}

// Anima uma pessoa: andando (passo) ou trabalhando.
export function animatePerson(p, t, mode) {
  const u = p.userData;
  if (mode === 'walk') {
    const s = Math.sin(t * 10);
    u.legL.rotation.x = s * 0.6; u.legR.rotation.x = -s * 0.6;
    u.armL.rotation.x = -s * 0.5; u.armR.rotation.x = s * 0.5;
    u.body.position.y = Math.abs(Math.cos(t * 10)) * 0.06;
  } else if (mode === 'work') {
    u.legL.rotation.x *= 0.8; u.legR.rotation.x *= 0.8;
    u.armR.rotation.x = -1.2 + Math.sin(t * 14) * 0.6;
    u.armL.rotation.x = -0.6 + Math.sin(t * 14 + 1) * 0.3;
    u.body.position.y = Math.abs(Math.sin(t * 7)) * 0.06;
  } else if (mode === 'cheer') {
    u.armL.rotation.x = -2.8 + Math.sin(t * 12) * 0.3; u.armR.rotation.x = -2.8 - Math.sin(t * 12) * 0.3;
    u.body.position.y = Math.abs(Math.sin(t * 8)) * 0.18;
  } else {
    u.legL.rotation.x *= 0.85; u.legR.rotation.x *= 0.85;
    u.armL.rotation.x *= 0.85; u.armR.rotation.x *= 0.85;
    u.body.position.y = Math.sin(t * 2) * 0.015;
  }
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
  for (let i = 0; i < n; i++) mesh(box(sw, 0.03, 0.26), mat(i % 2 ? '#22252e' : '#ffc93c'), -width / 2 + sw * (i + 0.5), 0.235, z, g).castShadow = false;
}

function levelStars(g, level, y, z) {
  for (let i = 0; i < level; i++) mesh(sph(0.1, 8, 6), mat('#ffd23d', { e: '#ffb800', ei: 0.6 }), -0.4 * (level - 1) / 2 + i * 0.4, y, z, g);
}

function buildElevador(level) {
  const g = new THREE.Group();
  g.add(slab(2, 3));
  hazard(g, 3.6, 2.75);
  const wall = mat('#eef1f5');
  mesh(rbox(3.9, 2.3, 0.35, 0.08), wall, 0, 1.35, -2.75, g);
  mesh(rbox(4.0, 0.3, 0.45, 0.08), mat(TIER[level - 1]), 0, 2.55, -2.75, g);
  for (const sx of [-1, 1]) mesh(rbox(0.3, 0.9, 2.6, 0.08), wall, sx * 1.85, 0.65, -1.4, g);
  const s = sign('OFICINA', 2.6, 0.65, { bg: TIER[level - 1], stroke: '#173a7a', night: true });
  s.position.set(0, 3.05, -2.7);
  g.add(s);
  mesh(rbox(2.7, 0.75, 0.12, 0.06), mat('#173a7a'), 0, 3.05, -2.79, g);
  levelStars(g, level, 3.55, -2.75);
  // Painel de ferramentas.
  mesh(box(1.6, 0.9, 0.05), mat('#9aa3b2'), -0.6, 1.5, -2.55, g).castShadow = false;
  const toolCols = ['#e8473c', '#ffc93c', '#2f7bea', '#46c35a'];
  for (let i = 0; i < 4; i++) mesh(rbox(0.12, 0.55 - (i % 2) * 0.15, 0.05, 0.03), mat(toolCols[i]), -1.2 + i * 0.4, 1.5, -2.5, g);
  // Gaveteiro, tambor de óleo e pneu na parede.
  mesh(rbox(0.85, 1.0, 0.55, 0.06), mat('#e8473c', { r: 0.5 }), 1.25, 0.72, -2.25, g);
  for (let i = 0; i < 3; i++) mesh(box(0.7, 0.03, 0.02), mat('#9e2b23'), 1.25, 0.5 + i * 0.25, -1.97, g);
  mesh(cyl(0.3, 0.3, 0.8, 14), mat('#2f7bea', { r: 0.5 }), -1.5, 0.62, -1.9, g);
  mesh(cyl(0.31, 0.31, 0.05, 14), mat('#1f5bb5'), -1.5, 0.8, -1.9, g);
  const wt = mesh(torus(0.32, 0.13, 8, 16), mat('#24252b'), 1.25, 1.85, -2.52, g);
  wt.castShadow = false;
  // Elevador: colunas + braços que sobem + mangueiras.
  const liftCol = mat('#ff6a3d', { r: 0.5 });
  for (const sx of [-1, 1]) {
    mesh(rbox(0.3, 2.2, 0.3, 0.06), liftCol, sx * 1.3, 1.3, 0.1, g);
    mesh(cyl(0.04, 0.04, 2.0, 6), mat('#22252e'), sx * 1.48, 1.2, 0.1, g);
  }
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
  const ring = new THREE.Mesh(torus(1.8, 0.05, 8, 48), glow('#ff4fd8', '#ff4fd8', '#ff4fd8', 1.4, 2.6));
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
  const strip = glow('#ffffff', '#fff2fb', '#fff2fb', 1.2, 2.4);
  for (const sz of [-1, 1]) {
    mesh(rbox(3.95, 0.25, 0.25, 0.05), frame, 0, 3.0, sz * 2.6, fr);
    mesh(box(3.4, 0.06, 0.1), strip, 0, 2.84, sz * 2.6, fr);
  }
  for (const sx of [-1, 1]) mesh(rbox(0.25, 0.25, 5.4, 0.05), frame, sx * 1.85, 3.0, 0, fr);
  mesh(rbox(3.6, 2.2, 0.25, 0.06), mat('#f6e9ff'), 0, 1.3, -2.85, g);
  const s = sign('ESTILO', 2.6, 0.65, { bg: '#ff4fa3', stroke: '#7a1650', night: true });
  s.position.set(0, 3.55, 2.73);
  fr.add(s);
  mesh(rbox(2.7, 0.75, 0.12, 0.06), mat('#7a1650'), 0, 3.55, 2.64, fr);
  levelStars(fr, level, 4.0, 2.65);
  // Latas de tinta, pistola de pintura e rodas de amostra.
  const cans = ['#e8473c', '#2f7bea', '#ffc93c', '#46c35a', '#8a5cf0'];
  cans.forEach((c, i) => mesh(cyl(0.16, 0.16, 0.32, 12), mat(c, { r: 0.4 }), -1.4 + (i % 3) * 0.36, 0.38 + Math.floor(i / 3) * 0.33, -2.45, g));
  const rack = buildWheel(WHEELS.esportiva);
  rack.position.set(1.2, 1.4, -2.65);
  rack.rotation.y = Math.PI / 2;
  g.add(rack);
  const rack2 = buildWheel(WHEELS.cromada);
  rack2.position.set(0.4, 1.4, -2.65);
  rack2.rotation.y = Math.PI / 2;
  g.add(rack2);
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
  const puddle = mesh(cyl(1.1, 1.1, 0.02, 20), mat('#8fd3ff', { r: 0.05, m: 0.3, t: 0.55 }), 0.7, 0.235, 1.9, g);
  puddle.scale.set(1, 1, 0.6);
  puddle.castShadow = false;
  const blue = mat('#2f7bea', { r: 0.5 });
  for (const sx of [-1, 1]) mesh(rbox(0.4, 3.1, 0.6, 0.1), blue, sx * 1.85, 1.7, 0, g);
  mesh(rbox(4.1, 0.6, 0.7, 0.12), blue, 0, 3.25, 0, g);
  const s = sign('LAVA-JATO', 3.0, 0.62, { bg: '#33d0e0', stroke: '#0f5c7a', size: 70, night: true });
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
  // Carretel de mangueira e balde.
  mesh(torus(0.3, 0.08, 8, 16), mat('#46c35a'), -1.55, 0.9, -2.4, g).rotation.y = Math.PI / 2;
  mesh(cyl(0.2, 0.16, 0.35, 12), mat('#ffc93c'), 1.4, 0.4, -2.3, g);
  levelStars(g, level, 3.7, 0.2);
  return g;
}

function buildLoja(level) {
  const g = new THREE.Group();
  g.add(slab(2, 2, '#e9e2d4'));
  mesh(rbox(3.4, 2.1, 2.6, 0.12), mat('#fff4dc'), 0, 1.25, -0.4, g);
  mesh(rbox(3.7, 0.3, 2.9, 0.1), mat(TIER[level - 1]), 0, 2.45, -0.4, g);
  mesh(rbox(1.6, 1.0, 0.08, 0.05), glow('#9fd8f5', '#3a6a8a', '#ffcf70', 0.3, 1.4, { r: 0.1, m: 0.3 }), -0.6, 1.25, 0.92, g);
  mesh(rbox(0.8, 1.5, 0.08, 0.05), mat('#8a5a3a'), 1.0, 0.98, 0.92, g);
  for (let i = 0; i < 7; i++) {
    const a = mesh(box(3.6 / 7, 0.06, 0.9), mat(i % 2 ? '#ffffff' : '#e8473c'), -1.8 + (3.6 / 7) * (i + 0.5), 1.92, 1.3, g);
    a.rotation.x = 0.35;
  }
  const s = sign('PEÇAS', 2.2, 0.6, { bg: '#ffc93c', fg: '#ffffff', stroke: '#8a5a00', night: true });
  s.position.set(0, 2.95, 0.6);
  g.add(s);
  mesh(rbox(2.3, 0.7, 0.12, 0.05), mat('#8a5a00'), 0, 2.95, 0.52, g);
  for (let i = 0; i < 2; i++) {
    const t = mesh(torus(0.28, 0.13, 8, 16), mat('#24252b'), -1.3 + i * 0.65, 0.42, 1.25, g);
    t.rotation.y = 0.3;
  }
  levelStars(g, level, 3.4, 0.6);
  return g;
}

function buildPosto(level) {
  const g = new THREE.Group();
  g.add(slab(3, 3, '#dfe3ea'));
  const red = mat('#e8473c', { r: 0.5 });
  const white = mat('#ffffff', { r: 0.6 });
  // Ilha das bombas e cobertura (só na parte de trás, para enxergar o carro).
  mesh(rbox(5.2, 0.25, 1.0, 0.1), mat('#c9ced8'), 0, 0.33, -1.2, g);
  for (const sx of [-1.4, 1.4]) {
    const pump = new THREE.Group();
    mesh(rbox(0.75, 1.5, 0.55, 0.08), mat('#46c35a', { r: 0.4 }), 0, 1.2, 0, pump);
    mesh(rbox(0.6, 0.35, 0.05, 0.03), glow('#1d2b4f', '#3aff9a', '#3aff9a', 0.6, 1.6), 0, 1.55, 0.28, pump);
    mesh(rbox(0.8, 0.18, 0.6, 0.05), white, 0, 2.0, 0, pump);
    mesh(box(0.08, 0.5, 0.08), mat('#22252e'), 0.42, 1.1, 0.1, pump);
    mesh(cyl(0.03, 0.03, 0.8, 6), mat('#22252e'), 0.42, 0.75, 0.2, pump).rotation.x = 0.5;
    pump.position.set(sx, 0, -1.2);
    g.add(pump);
  }
  for (const sx of [-2.4, 2.4]) mesh(rbox(0.3, 3.4, 0.3, 0.06), white, sx, 1.9, -1.2, g);
  const roof = mesh(rbox(5.8, 0.45, 3.0, 0.12), white, 0, 3.75, -1.6, g);
  roof.castShadow = true;
  mesh(rbox(5.9, 0.35, 0.12, 0.05), red, 0, 3.75, -0.08, g);
  const s = sign('POSTO NITRO', 3.6, 0.42, { w: 768, h: 96, bg: '#e8473c', stroke: '#7a1a12', size: 66, night: true });
  s.position.set(0, 3.75, -0.01);
  g.add(s);
  for (const sx of [-1.6, 0, 1.6]) mesh(box(1.0, 0.04, 0.4), glow('#ffffff', '#ffffff', '#fff6d8', 0.3, 2.2), sx, 3.51, -1.4, g);
  lamp(g, 0, 3.2, -0.5, '#fff1d0', 10, 14);
  // Totem de preços (gasolina e etanol).
  mesh(box(0.2, 3.6, 0.2), mat('#5a6070'), 2.55, 1.8, 2.3, g);
  const tot = sign('GASOLINA', 1.3, 1.3, { w: 256, h: 256, bg: '#1d2b4f', fg: '#ffd23d', stroke: '#0c1428', size: 46, sub: 'R$ 5,89', night: true });
  tot.position.set(2.55, 3.4, 2.42);
  g.add(tot);
  mesh(rbox(1.4, 1.4, 0.15, 0.05), mat('#0c1428'), 2.55, 3.4, 2.32, g);
  levelStars(g, level, 4.15, -0.05);
  return g;
}

function buildRestauracao(level) {
  const g = new THREE.Group();
  g.add(slab(2, 3, '#d8d2c8'));
  const brick = mat('#c86a4a', { r: 0.9 });
  mesh(rbox(3.9, 2.8, 0.35, 0.06), brick, 0, 1.6, -2.75, g);
  for (const sx of [-1, 1]) mesh(rbox(0.3, 1.0, 5.2, 0.06), brick, sx * 1.85, 0.7, -0.2, g);
  for (const sx of [-1, 1]) mesh(rbox(0.25, 2.9, 0.25, 0.05), mat('#5a6070'), sx * 1.85, 1.6, -0.9, g);
  mesh(rbox(4.2, 0.25, 2.2, 0.06), mat('#7a8090', { m: 0.4, r: 0.5 }), 0, 3.05, -1.85, g);
  for (let i = 0; i < 6; i++) mesh(box(4.2, 0.04, 0.06), mat('#5a6070'), 0, 3.19, -2.8 + i * 0.38, g);
  const s = sign('RESTAURAÇÃO', 3.2, 0.55, { w: 768, h: 128, bg: '#ff8a2a', stroke: '#7a2e00', size: 70, night: true });
  s.position.set(0, 2.5, -2.56);
  g.add(s);
  // Guincho de motor amarelo e bancada.
  const y = mat('#ffc93c', { r: 0.5 });
  mesh(box(0.15, 2.2, 0.15), y, -1.4, 1.3, -2.2, g);
  const arm = mesh(box(0.15, 0.15, 1.4), y, -1.4, 2.35, -1.6, g);
  arm.rotation.x = 0.2;
  mesh(cyl(0.02, 0.02, 0.8, 6), mat('#22252e'), -1.4, 1.85, -1.0, g);
  mesh(rbox(0.5, 0.4, 0.4, 0.05), mat('#6b7180', { m: 0.6, r: 0.4 }), -1.4, 1.3, -1.0, g);
  mesh(rbox(1.4, 0.15, 0.6, 0.04), mat('#a06a3a'), 1.0, 1.05, -2.3, g);
  for (const sx of [0.4, 1.6]) mesh(box(0.1, 0.9, 0.5), mat('#5a6070'), sx, 0.6, -2.3, g);
  for (let i = 0; i < 3; i++) mesh(rbox(0.3, 0.2, 0.3, 0.04), mat(['#a0522d', '#6b7180', '#c26a2e'][i]), 0.6 + i * 0.4, 1.25, -2.3, g);
  levelStars(g, level, 3.5, -2.6);
  return g;
}

export const SHOWROOM_SLOTS = [
  { x: 0, z: 1.0, r: 0.5 },
  { x: -1.6, z: -1.1, r: 0.4 },
  { x: 1.6, z: -1.1, r: 0.6 },
];

function buildShowroom() {
  const g = new THREE.Group();
  g.add(slab(3, 3, '#f4f6fa'));
  mesh(rbox(5.6, 0.04, 5.6, 0.02), mat('#ffffff', { r: 0.15, m: 0.1 }), 0, 0.24, 0, g).castShadow = false;
  mesh(rbox(5.6, 3.2, 0.3, 0.06), mat('#1d2b4f'), 0, 1.8, -2.75, g);
  const s = sign('SHOWROOM', 4.2, 0.8, { w: 768, h: 144, bg: null, fg: '#fff6fb', stroke: null, size: 110, glow: '#36b8ff' });
  s.position.set(0, 2.6, -2.58);
  g.add(s);
  for (const sx of [-1, 1]) {
    mesh(rbox(0.25, 3.2, 0.25, 0.05), mat('#c9ced8', { m: 0.6, r: 0.3 }), sx * 2.75, 1.8, 2.6, g);
    mesh(rbox(0.08, 1.6, 5.2, 0.03), mat('#bfe7ff', { r: 0.05, m: 0.3, t: 0.3 }), sx * 2.78, 1.0, 0, g).castShadow = false;
  }
  for (const sl of SHOWROOM_SLOTS) {
    mesh(cyl(1.25, 1.35, 0.2, 32), mat('#e9edf3', { r: 0.3 }), sl.x, 0.34, sl.z, g);
    const ring = mesh(torus(1.3, 0.04, 6, 40), glow('#36b8ff', '#36b8ff', '#36b8ff', 1.2, 2.6), sl.x, 0.42, sl.z, g);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = false;
  }
  lamp(g, 0, 3, 0, '#d8f0ff', 10, 10);
  g.userData.slots = SHOWROOM_SLOTS;
  return g;
}

function buildEscritorio() {
  const g = new THREE.Group();
  g.add(slab(3, 3, '#e6e8ee'));
  mesh(rbox(5.4, 3.2, 4.2, 0.15), mat('#fdf7ec'), 0, 1.8, -0.5, g);
  mesh(rbox(5.7, 0.35, 4.5, 0.1), mat('#2f7bea'), 0, 3.5, -0.5, g);
  mesh(rbox(5.5, 0.5, 0.2, 0.08), mat('#ff8a2a'), 0, 0.45, 1.62, g);
  mesh(rbox(2.4, 2.1, 0.1, 0.05), mat('#c9ced8', { m: 0.3, r: 0.4 }), -1.2, 1.3, 1.62, g);
  for (let i = 0; i < 6; i++) mesh(box(2.3, 0.03, 0.04), mat('#9aa3b2'), -1.2, 0.45 + i * 0.32, 1.68, g);
  const win = glow('#9fd8f5', '#3a6a8a', '#ffcf70', 0.35, 1.5, { r: 0.1, m: 0.3 });
  mesh(rbox(1.7, 1.2, 0.1, 0.05), win, 1.4, 1.9, 1.62, g);
  mesh(rbox(1.8, 0.12, 0.25, 0.04), mat('#ffffff'), 1.4, 1.25, 1.7, g);
  for (const z of [-1.7, 0.2]) mesh(rbox(0.1, 1.0, 1.2, 0.04), win, 2.71, 2.0, z, g);
  const s = sign('OFICINA NITRO', 5.4, 1.2, { w: 1024, h: 224, bg: '#ff8a2a', stroke: '#7a2e00', size: 150, radius: 50, night: true });
  s.position.set(0, 4.75, 0.12);
  g.add(s);
  mesh(rbox(5.6, 1.35, 0.18, 0.08), mat('#7a2e00'), 0, 4.75, 0.0, g);
  for (const sx of [-1.8, 1.8]) mesh(box(0.15, 0.9, 0.15), mat('#5a6070'), sx, 3.95, -0.05, g);
  const t = mesh(torus(0.55, 0.22, 10, 20), mat('#24252b'), 2.75, 2.1, -0.5, g);
  t.rotation.y = Math.PI / 2;
  mesh(cyl(0.35, 0.35, 0.1, 16), mat('#ffc93c'), 2.78, 2.1, -0.5, g).rotation.z = Math.PI / 2;
  // Antena com luz piscando.
  mesh(cyl(0.04, 0.04, 1.4, 6), mat('#9aa3b2'), -2.2, 4.4, -1.8, g);
  const blink = mesh(sph(0.1, 8, 6), mat('#ff3b3b', { e: '#ff2020', ei: 1.5 }), -2.2, 5.1, -1.8, g);
  g.userData.blink = blink;
  return g;
}

// ---------- decoração ----------
export function buildTree(scale = 1, tint = 0) {
  const g = new THREE.Group();
  mesh(cyl(0.16, 0.22, 1.1, 8), mat('#8a5a3a'), 0, 0.55, 0, g);
  const greens = ['#4cb848', '#5ccc52', '#3fa63f'];
  const crown = new THREE.Group();
  crown.position.y = 1.1;
  const c = greens[tint % 3];
  mesh(sph(0.85, 10, 8), mat(c, { flat: true }), 0, 0.45, 0, crown);
  mesh(sph(0.62, 10, 8), mat(greens[(tint + 1) % 3], { flat: true }), 0.35, 0.95, 0.1, crown);
  mesh(sph(0.5, 10, 8), mat(c, { flat: true }), -0.3, 1.0, -0.15, crown);
  g.add(crown);
  g.userData.crown = crown;
  g.scale.setScalar(scale);
  return g;
}

function buildPalm() {
  const g = new THREE.Group();
  const trunk = mat('#b07a4a', { flat: true });
  for (let i = 0; i < 6; i++) mesh(cyl(0.13 - i * 0.01, 0.16 - i * 0.01, 0.5, 7), trunk, i * 0.05, 0.25 + i * 0.47, 0, g);
  const crown = new THREE.Group();
  crown.position.set(0.3, 3.0, 0);
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Group();
    const leaf = mesh(box(0.35, 0.05, 1.5), mat(i % 2 ? '#3fa63f' : '#5ccc52', { flat: true }), 0, 0, 0.75, f);
    leaf.rotation.x = 0.5;
    f.rotation.y = (i / 7) * Math.PI * 2;
    crown.add(f);
  }
  for (let i = 0; i < 3; i++) mesh(sph(0.12, 8, 6), mat('#7a4a22'), Math.cos(i * 2) * 0.18, -0.15, Math.sin(i * 2) * 0.18, crown);
  g.add(crown);
  g.userData.crown = crown;
  return g;
}

function buildDecor(type) {
  const g = new THREE.Group();
  switch (type) {
    case 'arvore': g.add(buildTree(1, 0)); g.userData.crown = g.children[0].userData.crown; break;
    case 'palmeira': { const p = buildPalm(); g.add(p); g.userData.crown = p.userData.crown; break; }
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
      mesh(sph(0.2, 10, 8), glow('#fff3c4', '#ffd77a', '#ffe7a0', 0.5, 3), 0, 2.65, 0, g);
      mesh(cyl(0.3, 0.3, 0.1, 10), mat('#3a3d48'), 0, 0.05, 0, g);
      lamp(g, 0, 2.4, 0, '#ffd27a', 9, 14);
      break;
    }
    case 'pneus': {
      for (let i = 0; i < 4; i++) {
        const t = mesh(torus(0.42, 0.2, 8, 16), mat('#24252b', { r: 0.9 }), (i % 2) * 0.05, 0.2 + i * 0.36, 0, g);
        t.rotation.x = Math.PI / 2;
      }
      mesh(cyl(0.25, 0.25, 0.05, 12), mat('#ffc93c'), 0, 1.5, 0, g);
      break;
    }
    case 'refri': {
      mesh(rbox(1.0, 1.9, 0.8, 0.08), mat('#e8473c', { r: 0.4 }), 0, 0.95, 0, g);
      mesh(rbox(0.6, 1.2, 0.06, 0.04), glow('#bfe7ff', '#7ac7ff', '#bfe7ff', 0.6, 2), -0.12, 1.15, 0.41, g);
      mesh(rbox(0.18, 0.5, 0.06, 0.03), mat('#2b2d36'), 0.33, 1.2, 0.41, g);
      const s = sign('REFRI', 0.9, 0.3, { w: 256, h: 96, bg: '#ffffff', fg: '#e8473c', stroke: '#e8473c', size: 64 });
      s.position.set(0, 1.75, 0.42);
      g.add(s);
      break;
    }
    case 'bandeira': {
      mesh(cyl(0.06, 0.06, 3.2, 8), mat('#c9ced8', { m: 0.6, r: 0.3 }), -0.5, 1.6, 0, g);
      const tex = canvasTex(128, 96, (x) => { for (let i = 0; i < 8; i++) for (let k = 0; k < 6; k++) { x.fillStyle = (i + k) % 2 ? '#111' : '#fff'; x.fillRect(i * 16, k * 16, 16, 16); } });
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
      lamp(g, 0, 1.8, 0.8, '#ff4fd8', 6, 6);
      break;
    }
    case 'foodtruck': {
      const t = new THREE.Group();
      mesh(rbox(3.2, 1.5, 1.5, 0.2), mat('#ffc93c', { r: 0.4 }), 0, 1.15, 0, t);
      mesh(rbox(1.0, 1.0, 1.4, 0.15), mat('#ffc93c', { r: 0.4 }), 1.75, 0.95, 0, t);
      mesh(rbox(0.5, 0.45, 1.3, 0.08), mat('#2a4068', { r: 0.1, t: 0.7 }), 2.05, 1.15, 0, t);
      mesh(rbox(1.8, 0.7, 0.06, 0.04), glow('#3a2a1e', '#3a2a1e', '#ffcf70', 0.2, 1.4), -0.3, 1.35, 0.76, t);
      for (let i = 0; i < 6; i++) {
        const a = mesh(box(2.2 / 6, 0.05, 0.6), mat(i % 2 ? '#ffffff' : '#46c35a'), -0.3 - 1.1 + (2.2 / 6) * (i + 0.5), 1.85, 1.0, t);
        a.rotation.x = 0.4;
      }
      const s = sign('PASTEL', 1.9, 0.5, { w: 384, h: 96, bg: '#e8473c', stroke: '#7a1a12', size: 64 });
      s.position.set(-0.3, 2.2, 0.77);
      t.add(s);
      for (const sx of [-1, 1.4]) for (const sz of [-0.7, 0.7]) {
        const w = buildWheel(WHEELS.padrao);
        w.position.set(sx, 0.36, sz);
        w.rotation.y = Math.PI / 2;
        t.add(w);
      }
      t.scale.setScalar(0.62);
      g.add(t);
      break;
    }
    case 'outdoor': {
      for (const sx of [-1.2, 1.2]) mesh(box(0.15, 2.4, 0.15), mat('#5a6070'), sx, 1.2, 0, g);
      mesh(rbox(3.6, 1.7, 0.18, 0.06), mat('#1d2b4f'), 0, 3.0, -0.05, g);
      const tex = canvasTex(512, 240, (x, w, h) => {
        const grd = x.createLinearGradient(0, 0, w, h);
        grd.addColorStop(0, '#ff8a2a'); grd.addColorStop(1, '#ff4fa3');
        x.fillStyle = grd; x.fillRect(0, 0, w, h);
        x.fillStyle = '#ffffff'; x.font = '64px "Lilita One", sans-serif'; x.textAlign = 'center';
        x.fillText('OFICINA NITRO', w / 2, 80);
        x.font = '34px "Lilita One", sans-serif';
        x.fillText('seu carro do seu jeito', w / 2, 128);
        x.fillStyle = '#1d2b4f'; x.beginPath(); x.roundRect(150, 150, 210, 48, 18); x.fill();
        x.fillRect(195, 132, 110, 30);
        x.fillStyle = '#ffffff'; x.beginPath(); x.arc(195, 200, 18, 0, 7); x.arc(315, 200, 18, 0, 7); x.fill();
      });
      const board = new THREE.Mesh(plane(3.4, 1.55), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3 }));
      board.material.userData.night = { dayE: new THREE.Color('#ffffff'), nightE: new THREE.Color('#ffffff'), dayI: 0.3, nightI: 1.0 };
      NIGHT.add(board.material);
      board.position.set(0, 3.0, 0.05);
      g.add(board);
      lamp(g, 0, 4.2, 1, '#fff1d0', 6, 8);
      break;
    }
    case 'chafariz': {
      mesh(cyl(1.7, 1.8, 0.5, 28), mat('#d5d9e0'), 0, 0.25, 0, g);
      const water = mesh(cyl(1.5, 1.5, 0.08, 28), mat('#5ec8ff', { r: 0.1, m: 0.2, e: '#2a8ad0', ei: 0.35 }), 0, 0.47, 0, g);
      water.castShadow = false;
      mesh(cyl(0.25, 0.35, 1.3, 12), mat('#d5d9e0'), 0, 0.9, 0, g);
      mesh(cyl(0.75, 0.4, 0.25, 20), mat('#d5d9e0'), 0, 1.6, 0, g);
      g.userData.jet = mesh(sph(0.3, 10, 8), mat('#9fe0ff', { e: '#5ec8ff', ei: 0.5, r: 0.1 }), 0, 1.95, 0, g);
      break;
    }
    case 'trofeu': {
      mesh(rbox(1.8, 0.6, 1.8, 0.1), mat('#2b2d36'), 0, 0.3, 0, g);
      mesh(rbox(1.3, 0.5, 1.3, 0.08), mat('#3a3d48'), 0, 0.85, 0, g);
      const cup = new THREE.Group();
      const gold = mat('#ffcc33', { m: 0.85, r: 0.25 });
      mesh(cyl(0.2, 0.35, 0.5, 14), gold, 0, 1.35, 0, cup);
      mesh(cyl(0.75, 0.3, 1.0, 20), gold, 0, 2.1, 0, cup);
      for (const sx of [-1, 1]) mesh(torus(0.32, 0.08, 8, 16, Math.PI), gold, sx * 0.72, 2.15, 0, cup).rotation.z = sx * Math.PI / 2;
      mesh(sph(0.22, 10, 8), mat('#ff6fb5', { m: 0.3, r: 0.2, e: '#ff3fa0', ei: 0.3 }), 0, 2.75, 0, cup);
      g.add(cup);
      g.userData.cup = cup;
      break;
    }
    case 'estatua': {
      mesh(rbox(2.6, 0.5, 2.6, 0.1), mat('#c9ced8'), 0, 0.25, 0, g);
      mesh(rbox(1.2, 1.4, 1.2, 0.1), mat('#e9edf3'), 0, 1.2, 0, g);
      const pl = sign('LENDA', 1.0, 0.3, { w: 256, h: 80, bg: '#1d2b4f', fg: '#ffd23d', stroke: '#0c1428', size: 54 });
      pl.position.set(0, 1.0, 0.61);
      g.add(pl);
      const car = buildCar({ type: 'esportivo', color: 'dourado', wheels: 'cromada', spoiler: 'grande', neon: 'nenhum', decal: 'listras' }, { driver: false });
      car.position.set(0, 1.9, 0);
      car.rotation.set(-0.35, 0.6, 0);
      car.scale.setScalar(0.75);
      g.add(car);
      break;
    }
  }
  return g;
}

export function buildBuilding(type, level = 1, uniform = null) {
  let g;
  switch (type) {
    case 'guincho': g = buildGuincho(level); break;
    case 'elevador': g = buildElevador(level); break;
    case 'cabine': g = buildCabine(level); break;
    case 'lavajato': g = buildLavajato(level); break;
    case 'loja': g = buildLoja(level); break;
    case 'posto': g = buildPosto(level); break;
    case 'restauracao': g = buildRestauracao(level); break;
    case 'showroom': g = buildShowroom(level); break;
    case 'escritorio': g = buildEscritorio(); break;
    default: g = buildDecor(type);
  }
  const staff = {
    elevador: ['#2f7bea', '#e8473c', 1.55, 1.5, -Math.PI / 2],
    lavajato: ['#33d0e0', '#ffffff', -1.55, 1.9, Math.PI / 2],
    cabine: ['#ff4fa3', '#1d2b4f', -1.55, 1.9, Math.PI / 2],
    posto: ['#e8473c', '#ffffff', 2.3, 0.3, -Math.PI / 2],
    restauracao: ['#ff8a2a', '#22252e', 1.5, 1.4, -Math.PI / 2],
  }[type];
  if (staff) {
    const mech = buildMechanic(uniform || staff[0], staff[1]);
    mech.position.set(staff[2], 0.22, staff[3]);
    mech.rotation.y = staff[4];
    mech.userData.home = { x: staff[2], z: staff[3], r: staff[4] };
    g.add(mech);
    g.userData.mech = mech;
  }
  return g;
}

// Onde o carro para dentro de cada serviço (coordenadas locais).
export const BAY_SPOT = { elevador: [0, 0], cabine: [0, 0], lavajato: [0, 0], posto: [0, 1.1], restauracao: [0, 0] };

// Caminho do mecânico em volta do carro.
export const STAFF_PATH = {
  elevador: [[1.6, 1.5], [1.6, -1.3], [-1.6, -1.3], [-1.6, 1.5]],
  restauracao: [[1.4, 1.4], [1.4, -1.2], [-1.0, -1.0], [-1.4, 1.5]],
  posto: [[1.4, 2.3], [1.4, 0.2], [-1.3, 0.3], [-1.3, 2.2]],
  lavajato: [[-1.55, 1.9], [-1.55, -1.9]],
};

export function buildHouse(color, roof) {
  const g = new THREE.Group();
  mesh(rbox(4, 2.4, 3.4, 0.12), mat(color), 0, 1.2, 0, g);
  const r = mesh(new THREE.ConeGeometry(3.2, 1.6, 4), mat(roof, { flat: true }), 0, 3.2, 0, g);
  r.rotation.y = Math.PI / 4;
  r.scale.set(1, 1, 0.82);
  mesh(rbox(0.8, 1.4, 0.1, 0.04), mat('#8a5a3a'), -0.8, 0.7, -1.72, g);
  mesh(rbox(1.0, 0.8, 0.1, 0.04), glow('#9fd8f5', '#3a6a8a', '#ffcf70', 0.3, 1.5), 0.8, 1.4, -1.72, g);
  return g;
}

// Andaime de obra (aparece enquanto constrói ou melhora).
export function buildScaffold(w, d) {
  const g = new THREE.Group();
  const W = w * TILE - 0.4, D = d * TILE - 0.4, H = w * d > 2 ? 3.4 : 1.8;
  const pole = mat('#ffc93c', { r: 0.5, m: 0.2 });
  const plank = mat('#c98a4b');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(cyl(0.06, 0.06, H, 6), pole, sx * W / 2, H / 2, sz * D / 2, g);
  for (let y = 0.9; y < H; y += 1.2) {
    for (const sz of [-1, 1]) mesh(box(W, 0.08, 0.35), plank, 0, y, sz * D / 2, g);
    for (const sx of [-1, 1]) mesh(box(0.35, 0.08, D), plank, sx * W / 2, y, 0, g);
  }
  const net = mesh(box(W, H * 0.6, D), mat('#46c35a', { t: 0.25, r: 1 }), 0, H * 0.35, 0, g);
  net.castShadow = false;
  const cone = new THREE.Group();
  mesh(cyl(0.05, 0.22, 0.6, 10), mat('#ff8a2a'), 0, 0.3, 0, cone);
  mesh(cyl(0.11, 0.15, 0.12, 10), mat('#ffffff'), 0, 0.32, 0, cone);
  cone.position.set(W / 2 + 0.3, 0, D / 2 + 0.3);
  g.add(cone);
  const worker = buildPerson({ shirt: '#ff8a2a', hat: '#ffd23d', tool: true });
  worker.position.set(-W / 2 + 0.2, 0, D / 2 + 0.5);
  worker.rotation.y = Math.PI * 0.8;
  g.add(worker);
  g.userData.worker = worker;
  return g;
}

// Placa "À VENDA" para terrenos e pista.
export function buildSaleSign(title, sub) {
  const g = new THREE.Group();
  for (const sx of [-0.8, 0.8]) mesh(box(0.15, 2.2, 0.15), mat('#8a5a3a'), sx, 1.1, 0, g);
  mesh(rbox(2.6, 1.5, 0.14, 0.05), mat('#ffffff'), 0, 2.1, 0, g);
  const s = sign(title, 2.4, 1.3, { w: 384, h: 208, bg: '#e8473c', stroke: '#7a1a12', size: 64, sub, radius: 24, night: true });
  s.position.set(0, 2.1, 0.08);
  g.add(s);
  return g;
}

// ---------- pista de corrida ----------
export function makeTrackPath(cx, cz, L, R) {
  const total = 4 * L + 2 * Math.PI * R;
  const seg = [2 * L, Math.PI * R, 2 * L, Math.PI * R];
  function at(s) {
    s = ((s % total) + total) % total;
    if (s < seg[0]) return { x: cx - L + s, z: cz + R, tx: 1, tz: 0, curve: false };
    s -= seg[0];
    if (s < seg[1]) { const a = s / R; return { x: cx + L + R * Math.sin(a), z: cz + R * Math.cos(a), tx: Math.cos(a), tz: -Math.sin(a), curve: true }; }
    s -= seg[1];
    if (s < seg[2]) return { x: cx + L - s, z: cz - R, tx: -1, tz: 0, curve: false };
    s -= seg[2];
    const a = s / R;
    return { x: cx - L - R * Math.sin(a), z: cz - R * Math.cos(a), tx: -Math.cos(a), tz: Math.sin(a), curve: true };
  }
  return { total, at, cx, cz, L, R, curves: [[seg[0], seg[0] + seg[1]], [seg[0] + seg[1] + seg[2], total]] };
}

function ribbon(path, a, b, o0, o1, y, mat_, uvLen = 1, step = 0.6) {
  const pos = [], uv = [], idx = [];
  const n = Math.max(2, Math.ceil((b - a) / step));
  for (let i = 0; i <= n; i++) {
    const s = a + ((b - a) * i) / n;
    const p = path.at(Math.min(s, path.total - 0.0001));
    const nx = -p.tz, nz = p.tx;
    pos.push(p.x + nx * o0, y, p.z + nz * o0, p.x + nx * o1, y, p.z + nz * o1);
    uv.push((s - a) / uvLen, 0, (s - a) / uvLen, 1);
    if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat_);
  m.receiveShadow = true;
  return m;
}

export function buildTrack(path, width = 5.2, dirt = false) {
  const g = new THREE.Group();
  const asphalt = new THREE.MeshStandardMaterial({ color: dirt ? '#b08a5a' : '#4a4f5c', roughness: 0.95, side: THREE.DoubleSide });
  g.add(ribbon(path, 0, path.total, -width / 2, width / 2, 0.04, asphalt, 1, 0.8));
  if (dirt) return g;
  const edge = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, side: THREE.DoubleSide });
  g.add(ribbon(path, 0, path.total, width / 2 - 0.25, width / 2 - 0.1, 0.05, edge, 1, 0.8));
  g.add(ribbon(path, 0, path.total, -width / 2 + 0.1, -width / 2 + 0.25, 0.05, edge, 1, 0.8));
  const curbTex = canvasTex(64, 8, (x) => { x.fillStyle = '#e8473c'; x.fillRect(0, 0, 32, 8); x.fillStyle = '#ffffff'; x.fillRect(32, 0, 32, 8); });
  curbTex.wrapS = THREE.RepeatWrapping;
  const curbMat = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.7, side: THREE.DoubleSide });
  for (const [a, b] of path.curves) {
    g.add(ribbon(path, a, b, width / 2, width / 2 + 0.6, 0.08, curbMat, 1.6, 0.4));
    g.add(ribbon(path, a, b, -width / 2 - 0.6, -width / 2, 0.08, curbMat, 1.6, 0.4));
  }
  // Linha de largada quadriculada + pórtico.
  const check = canvasTex(64, 16, (x) => { for (let i = 0; i < 16; i++) for (let k = 0; k < 4; k++) { x.fillStyle = (i + k) % 2 ? '#111' : '#fff'; x.fillRect(i * 4, k * 4, 4, 4); } });
  const line = new THREE.Mesh(plane(width, 1), new THREE.MeshStandardMaterial({ map: check, roughness: 0.8 }));
  const p0 = path.at(path.L);
  line.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  line.position.set(p0.x, 0.07, p0.z);
  g.add(line);
  for (const sz of [-1, 1]) mesh(rbox(0.35, 4.2, 0.35, 0.06), mat('#e8473c'), p0.x, 2.1, p0.z + sz * (width / 2 + 0.6), g);
  mesh(rbox(0.5, 0.9, width + 1.6, 0.08), mat('#1d2b4f'), p0.x, 4.0, p0.z, g);
  const gs = sign('LARGADA', width + 1.2, 0.7, { w: 768, h: 112, bg: '#1d2b4f', fg: '#ffd23d', stroke: '#0c1428', size: 80, night: true });
  gs.position.set(p0.x + 0.26, 4.0, p0.z);
  gs.rotation.y = Math.PI / 2;
  g.add(gs);
  // Arquibancada atrás da reta oposta.
  const { cx, cz, L, R } = path;
  const crowdTex = canvasTex(512, 64, (x, w, h) => {
    x.fillStyle = '#3a4260'; x.fillRect(0, 0, w, h);
    const cols = ['#e8473c', '#ffc93c', '#2f7bea', '#46c35a', '#ff6fb5', '#ffffff', '#ff8a2a'];
    for (let i = 0; i < 90; i++) {
      x.fillStyle = cols[i % cols.length];
      x.beginPath(); x.arc((i * 5.7) % w + 3, 26 + (i % 3) * 10, 6, 0, 7); x.fill();
      x.fillStyle = '#f1c09a';
      x.beginPath(); x.arc((i * 5.7) % w + 3, 14 + (i % 3) * 10, 4, 0, 7); x.fill();
    }
  }, [3, 1]);
  const crowdMat = new THREE.MeshStandardMaterial({ map: crowdTex, roughness: 0.9 });
  const standLen = 2 * L * 0.9;
  for (let i = 0; i < 4; i++) {
    const z = cz - R - width / 2 - 2.2 - i * 1.1;
    mesh(box(standLen, 0.6 + i * 0.6, 1.1), mat('#c9ced8'), cx, (0.6 + i * 0.6) / 2, z, g);
    const crowd = new THREE.Mesh(box(standLen, 0.5, 0.5), crowdMat);
    crowd.position.set(cx, 0.6 + i * 0.6 + 0.25, z + 0.2);
    g.add(crowd);
    if (i === 0) g.userData.crowd = [];
    g.userData.crowd.push(crowd);
  }
  for (const sx of [-1, 1]) mesh(box(0.25, 5.5, 0.25), mat('#5a6070'), cx + sx * standLen / 2, 2.75, cz - R - width / 2 - 6, g);
  mesh(rbox(standLen + 1, 0.3, 5.2, 0.08), mat('#e8473c'), cx, 5.5, cz - R - width / 2 - 3.8, g);
  const ban = sign('NITRO GP', 8, 1.2, { w: 1024, h: 150, bg: '#ff8a2a', stroke: '#7a2e00', size: 110, night: true });
  ban.position.set(cx, 4.9, cz - R - width / 2 - 1.15);
  g.add(ban);
  // Barreiras de pneus nas curvas e bandeiras.
  for (const side of [1, -1]) {
    for (let k = -3; k <= 3; k++) {
      const a = (k / 3) * (Math.PI / 2) * 0.9;
      const px = cx + side * (L + (R + width / 2 + 1.4) * Math.cos(a));
      const pz = cz + (R + width / 2 + 1.4) * Math.sin(a);
      for (let h = 0; h < 2; h++) {
        const t = mesh(torus(0.35, 0.16, 6, 12), mat(h % 2 ? '#e8473c' : '#24252b'), px, 0.18 + h * 0.3, pz, g);
        t.rotation.x = Math.PI / 2;
      }
    }
  }
  for (let i = -2; i <= 2; i++) {
    mesh(cyl(0.05, 0.05, 3, 6), mat('#c9ced8'), cx + i * 6, 1.5, cz + R + width / 2 + 1.2, g);
    const fl = mesh(box(0.9, 0.55, 0.03), mat(['#e8473c', '#ffc93c', '#2f7bea', '#46c35a', '#ff6fb5'][i + 2]), cx + i * 6 + 0.45, 2.7, cz + R + width / 2 + 1.2, g);
    (g.userData.flags ||= []).push(fl);
  }
  return g;
}

// Material translúcido para o "fantasma" do modo construção.
export function ghostify(group, ok) {
  const m = new THREE.MeshStandardMaterial({ color: ok ? '#6dff8a' : '#ff5a5a', transparent: true, opacity: 0.55, emissive: ok ? '#2a8a3a' : '#8a2020', emissiveIntensity: 0.5 });
  group.traverse((o) => { if (o.isMesh) { o.material = m; o.castShadow = false; } if (o.isLight) o.intensity = 0; });
}


// ---------- guincho ----------
export function buildTowTruck(withCar = null) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const red = mat('#e8473c', { r: 0.35, m: 0.1 });
  const yellow = mat('#ffc93c', { r: 0.4 });
  const dark = mat('#2b2d36', { r: 0.6 });
  // Cabine na frente (+z).
  mesh(rbox(1.9, 1.0, 1.7, 0.18), red, 0, 1.1, 1.55, body);
  mesh(rbox(1.75, 0.75, 1.2, 0.2), mat('#2a4068', { r: 0.08, m: 0.4, t: 0.7 }), 0, 1.85, 1.35, body);
  mesh(rbox(1.8, 0.12, 1.25, 0.05), red, 0, 2.25, 1.35, body);
  for (const sx of [-1, 1]) {
    mesh(rbox(0.36, 0.18, 0.08, 0.05), glow('#fff6c8', '#ffe9a0', '#fff4c0', 0.6, 2.4), sx * 0.62, 1.05, 2.42, body);
    mesh(rbox(0.25, 0.25, 0.25, 0.05), glow('#ff9a1a', '#ff8a00', '#ffaa20', 1.2, 2.6), sx * 0.55, 2.42, 1.35, body);
  }
  mesh(rbox(1.92, 0.22, 0.2, 0.06), mat('#3a3d48'), 0, 0.62, 2.45, body);
  // Plataforma inclinável e braço.
  mesh(rbox(2.0, 0.22, 3.0, 0.06), yellow, 0, 0.95, -0.85, body);
  for (const sx of [-1, 1]) mesh(box(0.08, 0.2, 2.9), dark, sx * 0.98, 1.15, -0.85, body);
  for (let i = 0; i < 6; i++) mesh(box(1.9, 0.02, 0.06), mat('#d9a520'), 0, 1.07, -2.2 + i * 0.5, body);
  const boom = mesh(box(0.22, 0.22, 1.6), mat('#3a3d48', { m: 0.5, r: 0.4 }), 0, 1.75, -1.7, body);
  boom.rotation.x = 0.55;
  mesh(cyl(0.02, 0.02, 0.6, 6), dark, 0, 1.6, -2.45, body);
  mesh(box(0.25, 0.08, 0.15), dark, 0, 1.28, -2.45, body);
  const s1 = sign('GUINCHO', 1.4, 0.36, { w: 384, h: 96, bg: '#ffc93c', fg: '#1d2b4f', stroke: '#1d2b4f', size: 66 });
  for (const sx of [-1, 1]) {
    const sg = s1.clone();
    sg.position.set(sx * 0.96, 1.15, 1.55);
    sg.rotation.y = sx * Math.PI / 2;
    body.add(sg);
  }
  const wheels = [];
  for (const sz of [1.5, -0.4, -1.6]) for (const sx of [-1, 1]) {
    const w = buildWheel(WHEELS.padrao);
    w.scale.setScalar(1.25);
    w.position.set(sx * 0.95, 0.45, sz);
    g.add(w);
    wheels.push(w);
  }
  if (withCar) {
    const c = buildCar(withCar, { driver: false });
    c.scale.setScalar(0.78);
    c.position.set(0, 1.06, -0.9);
    body.add(c);
    g.userData.towed = c;
  }
  g.userData = { ...g.userData, body, wheels, wheelR: 0.45, beacons: body.children.filter((m) => m.material?.userData?.night && m.position.y > 2.3) };
  return g;
}

function buildGuincho(level) {
  const g = new THREE.Group();
  g.add(slab(2, 3, '#d8dce4'));
  hazard(g, 3.6, 2.75);
  // Cabine de atendimento com telefone e placa 24h.
  mesh(rbox(1.6, 2.2, 1.4, 0.1), mat('#fff4dc'), -1.0, 1.3, -2.0, g);
  mesh(rbox(1.8, 0.25, 1.6, 0.08), mat(TIER[level - 1]), -1.0, 2.5, -2.0, g);
  mesh(rbox(0.9, 0.7, 0.06, 0.04), glow('#9fd8f5', '#3a6a8a', '#ffcf70', 0.3, 1.4, { r: 0.1, m: 0.3 }), -1.0, 1.5, -1.28, g);
  const s = sign('GUINCHO 24H', 2.6, 0.6, { w: 640, h: 128, bg: '#ffc93c', fg: '#1d2b4f', stroke: '#1d2b4f', size: 76, night: true });
  s.position.set(0.3, 3.3, -2.6);
  g.add(s);
  mesh(rbox(2.7, 0.7, 0.12, 0.05), mat('#1d2b4f'), 0.3, 3.3, -2.68, g);
  for (const sx of [-0.8, 1.4]) mesh(box(0.12, 3.0, 0.12), mat('#5a6070'), sx, 1.5, -2.7, g);
  // Caminhão estacionado.
  const truck = buildTowTruck();
  truck.scale.setScalar(0.8);
  truck.position.set(0.55, 0.22, 0.3);
  g.add(truck);
  g.userData.truck = truck;
  // Luz de chamado (pisca quando tem chamado).
  const beacon = mesh(sph(0.22, 10, 8), mat('#ff3b3b', { e: '#ff2020', ei: 2 }), -1.0, 2.85, -2.0, g);
  beacon.visible = false;
  g.userData.beacon = beacon;
  for (let i = 0; i < 3; i++) g.add(buildCone(-1.6 + i * 0.5, 2.4));
  levelStars(g, level, 3.85, -2.6);
  return g;
}

export function buildCone(x = 0, z = 0, scale = 1) {
  const c = new THREE.Group();
  mesh(cyl(0.06, 0.24, 0.62, 10), mat('#ff8a2a'), 0, 0.33, 0, c);
  mesh(cyl(0.12, 0.16, 0.12, 10), mat('#ffffff'), 0, 0.36, 0, c);
  mesh(box(0.5, 0.06, 0.5), mat('#ff8a2a'), 0, 0.03, 0, c);
  c.position.set(x, 0.22, z);
  c.scale.setScalar(scale);
  return c;
}

export function buildBarrier() {
  const g = new THREE.Group();
  for (const sx of [-0.7, 0.7]) mesh(box(0.1, 0.8, 0.1), mat('#ffffff'), sx, 0.4, 0, g);
  const tex = canvasTex(128, 32, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#e8473c' : '#ffffff'; x.beginPath(); x.moveTo(i * 16, 32); x.lineTo(i * 16 + 16, 0); x.lineTo(i * 16 + 32, 0); x.lineTo(i * 16 + 16, 32); x.fill(); } });
  const bar = new THREE.Mesh(box(1.8, 0.35, 0.12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  bar.position.y = 0.75;
  bar.castShadow = true;
  g.add(bar);
  return g;
}

export function buildOil() {
  const m = new THREE.Mesh(cyl(0.9, 0.9, 0.02, 20), mat('#14151a', { r: 0.05, m: 0.6, t: 0.85 }));
  m.scale.set(1, 1, 0.6);
  m.position.y = 0.03;
  return m;
}

export function buildCoin() {
  const g = new THREE.Group();
  const c = mesh(cyl(0.38, 0.38, 0.1, 18), mat('#ffcc33', { m: 0.85, r: 0.25, e: '#ff9900', ei: 0.35 }), 0, 0, 0, g);
  c.rotation.x = Math.PI / 2;
  mesh(box(0.08, 0.36, 0.12), mat('#e8a300', { m: 0.8, r: 0.3 }), 0, 0, 0, g);
  g.position.y = 0.8;
  return g;
}
