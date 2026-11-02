// Cidade no visual premium: casas com telhado de telha, lojas com vitrine e toldo de babado, prédio com
// varandas de vidro, igreja com relógio, mercadinho, ponto de ônibus, postes de praça, lago com água que
// desliza e meio-fio nas ruas. Tudo é parado e vai ser juntado (bake) pela cidade.
import * as THREE from 'three';
import { mesh, mat, rbox as rboxR, box, cyl, sph as sphR, glow, sign, softShadow, torus } from './models.js';

// Peças pequenas: caixa simples em vez de arredondada e esfera de poucas faces (a diferença não aparece
// a essa distância, e o celular desenha bem menos triângulos).
const rbox = (w, h, d, r) => (Math.min(w, h, d) < 0.16 || Math.max(w, h, d) < 1.0 ? box(w, h, d) : rboxR(w, h, d, r));
const LOW = new Map();
const sph = (r, ws, hs) => (r > 0.25 ? sphR(r, ws, hs) : (LOW.get(r) || LOW.set(r, new THREE.IcosahedronGeometry(r, 0)).get(r)));
import { PM, rng, premiumBush } from './premium.js';

const white = () => mat('#ffffff', { r: 0.55 });
const darkMetal = () => PM.metal('#3a3d48');
const MC = new Map();
function once(key, make) { let m = MC.get(key); if (!m) { m = make(); m.userData.keep = true; MC.set(key, m); } return m; }
const railGlass = () => once('railGlass', () => { const m = new THREE.MeshStandardMaterial({ color: '#d6efff', transparent: true, opacity: 0.38, roughness: 0.05, metalness: 0.1, depthWrite: false }); m.envMapIntensity = 1.2; return m; });
const lampGlow = () => glow('#fff1c4', '#3a3420', '#ffd27a', 0.15, 2.2);
const noShadow = (m) => { m.castShadow = false; return m; };
function put(parent, child, x, y, z, ry = 0) { child.position.set(x, y, z); child.rotation.y = ry; parent.add(child); return child; }

// Janela com moldura, vidro com cortina (acende à noite), cruzeta e peitoril. De frente para +z.
export function windowP(w = 1.1, h = 0.9, o = {}) {
  const g = new THREE.Group();
  const fr = o.frame || white();
  mesh(rbox(w + 0.18, h + 0.18, 0.1, 0.03), fr, 0, 0, 0, g);
  noShadow(mesh(box(w, h, 0.04), o.glass || PM.pane(), 0, 0, 0.04, g));
  noShadow(mesh(box(0.05, h, 0.03), fr, 0, 0, 0.07, g));
  noShadow(mesh(box(w, 0.05, 0.03), fr, 0, h * 0.12, 0.07, g));
  mesh(rbox(w + 0.32, 0.08, 0.22, 0.02), white(), 0, -h / 2 - 0.11, 0.09, g);
  if (o.shutters) {
    const sm = PM.plastic(o.shutters);
    for (const s of [-1, 1]) {
      const x = s * (w / 2 + w * 0.24 + 0.06);
      mesh(rbox(w * 0.44, h + 0.14, 0.06, 0.02), sm, x, 0, 0.02, g);
      for (let i = 0; i < 4; i++) noShadow(mesh(box(w * 0.36, 0.03, 0.02), sm, x, -h / 2 + 0.16 + (i * (h - 0.24)) / 3, 0.06, g));
    }
  }
  if (o.flowers) {
    mesh(rbox(w + 0.1, 0.22, 0.28, 0.04), PM.plastic(o.flowers), 0, -h / 2 - 0.3, 0.2, g);
    const r = rng(Math.round(w * 100 + h * 31 + (o.seed || 0)));
    for (let i = 0; i < 5; i++) noShadow(mesh(sph(0.1, 6, 5), mat(i % 2 ? '#4cb848' : '#3fa63f'), -w / 2 + 0.12 + (i * (w - 0.24)) / 4, -h / 2 - 0.14, 0.2, g));
    for (let i = 0; i < 4; i++) noShadow(mesh(sph(0.055, 6, 5), mat(['#ff6fb5', '#ffd23d', '#ffffff', '#e8473c'][Math.floor(r() * 4)]), -w / 2 + 0.22 + (i * (w - 0.44)) / 3, -h / 2 - 0.05 + r() * 0.05, 0.27, g));
  }
  return g;
}

// Telhado de duas águas com cumeeira ao longo de x, beiral, testeiras e oitões (triângulos das pontas).
function gable(g, W, Dp, rise, ov, roofM, y0, wallM) {
  const run = Dp / 2, ang = Math.atan2(rise, run);
  const len = (run + ov) / Math.cos(ang);
  for (const s of [-1, 1]) {
    const cz = (s * (run + ov)) / 2, cy = y0 + rise - (rise * (run + ov)) / Dp;
    const slab = mesh(box(W + ov * 2, 0.13, len), roofM, 0, cy + 0.07, cz, g);
    slab.rotation.x = s * ang;
    const ey = y0 - (rise * ov) / run;
    mesh(box(W + ov * 2 + 0.04, 0.16, 0.07), white(), 0, ey - 0.02, s * (run + ov) + s * 0.02, g);
  }
  const ridge = mesh(cyl(0.1, 0.1, W + ov * 2 + 0.06, 8), roofM, 0, y0 + rise + 0.1, 0, g);
  ridge.rotation.z = Math.PI / 2;
  const tri = new THREE.Shape();
  tri.moveTo(-run, 0); tri.lineTo(run, 0); tri.lineTo(0, rise); tri.lineTo(-run, 0);
  const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.1, bevelEnabled: false });
  tg.rotateY(Math.PI / 2);
  for (const sx of [-1, 1]) {
    const t = new THREE.Mesh(tg, wallM);
    t.position.set(sx * (W / 2) - 0.05, y0, 0);
    t.castShadow = true; t.receiveShadow = true;
    g.add(t);
  }
}

// ---------------- casa ----------------
export function houseP(color, roof, garden = true, seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed * 131 + 7);
  const W = 4.2, H = 2.5, Dp = 3.6, base = 0.3;
  const wall = PM.plaster(color, [2, 1]);
  mesh(rbox(W + 0.14, base, Dp + 0.14, 0.04), PM.brick([4, 0.5]), 0, base / 2, 0, g);
  mesh(rbox(W, H, Dp, 0.06), wall, 0, base + H / 2, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) noShadow(mesh(box(0.14, H, 0.14), white(), sx * (W / 2 - 0.03), base + H / 2, sz * (Dp / 2 - 0.03), g));
  noShadow(mesh(box(W + 0.06, 0.12, Dp + 0.06), white(), 0, base + H - 0.04, 0, g));
  gable(g, W, Dp, 1.45, 0.38, PM.roofTint(roof, [3, 2]), base + H, wall);
  // Chaminé de tijolo.
  const cx = 1.15 * (r() < 0.5 ? 1 : -1);
  mesh(rbox(0.5, 1.5, 0.5, 0.04), PM.brick([1, 2]), cx, base + H + 1.0, -0.75, g);
  mesh(rbox(0.62, 0.12, 0.62, 0.03), PM.concrete(), cx, base + H + 1.78, -0.75, g);
  // Porta de madeira com moldura, toldinho, luminária, maçaneta e degrau.
  const fz = Dp / 2;
  mesh(rbox(1.08, 1.78, 0.1, 0.03), white(), -0.9, base + 0.86, fz + 0.02, g);
  mesh(rbox(0.86, 1.62, 0.08, 0.03), PM.wood([1, 2]), -0.9, base + 0.8, fz + 0.06, g);
  for (const y of [0.5, 1.15]) noShadow(mesh(box(0.6, 0.42, 0.03), PM.wood([1, 1]), -0.9, base + y, fz + 0.11, g));
  noShadow(mesh(sph(0.055, 8, 6), PM.metal('#ffd23d'), -0.6, base + 0.8, fz + 0.14, g));
  mesh(rbox(1.4, 0.1, 0.62, 0.03), PM.roofTint(roof), -0.9, base + 1.95, fz + 0.3, g);
  for (const sx of [-0.55, 0.55]) noShadow(mesh(box(0.05, 0.05, 0.5), white(), -0.9 + sx, base + 1.82, fz + 0.26, g)).rotation.x = 0.5;
  noShadow(mesh(sph(0.08, 8, 6), lampGlow(), -0.2, base + 1.62, fz + 0.12, g));
  mesh(rbox(1.3, 0.16, 0.5, 0.03), PM.concrete(), -0.9, 0.08, fz + 0.3, g);
  // Janelas: frente (com venezianas e floreira), fundos e laterais.
  const shutter = roof;
  put(g, windowP(1.1, 0.85, { shutters: shutter, flowers: '#ffffff', seed }), 0.95, base + 1.3, fz + 0.04);
  put(g, windowP(1.0, 0.8), 0.6, base + 1.3, -fz - 0.04, Math.PI);
  put(g, windowP(1.0, 0.8, { flowers: r() < 0.5 ? '#c0533a' : null, seed: seed + 3 }), W / 2 + 0.04, base + 1.3, 0.3, Math.PI / 2);
  put(g, windowP(0.8, 0.8), -W / 2 - 0.04, base + 1.3, -0.4, -Math.PI / 2);
  // Calha e cano.
  noShadow(mesh(cyl(0.05, 0.05, H + 0.2, 6), PM.metal('#c6ccd6'), W / 2 + 0.12, base + H / 2, fz + 0.12, g));
  // Ar-condicionado em algumas casas.
  if (r() < 0.5) mesh(rbox(0.7, 0.42, 0.3, 0.04), PM.metal('#e8ecf2'), W / 2 + 0.17, base + 2.0, -1.0, g).rotation.y = Math.PI / 2;
  if (garden) {
    // Cerca de ripas com portão aberto, caminho de pedra, caixa de correio e arbustos.
    const fm = white();
    for (let x = -2.4; x <= 2.41; x += 0.4) {
      if (Math.abs(x + 0.9) < 0.5) continue;
      mesh(rbox(0.1, 0.62, 0.06, 0.02), fm, x, 0.31, 3.2, g);
      noShadow(mesh(new THREE.ConeGeometry(0.07, 0.12, 4), fm, x, 0.68, 3.2, g)).rotation.y = Math.PI / 4;
    }
    for (const [a, b] of [[-2.45, -1.4], [-0.4, 2.45]]) for (const y of [0.22, 0.48]) noShadow(mesh(box(b - a, 0.06, 0.04), fm, (a + b) / 2, y, 3.16, g));
    noShadow(mesh(box(0.9, 0.05, 1.3), PM.pavers([0.5, 1.2]), -0.9, 0.03, fz + 1.2, g));
    mesh(cyl(0.04, 0.04, 0.9, 6), PM.wood(), -1.75, 0.45, 3.4, g);
    mesh(rbox(0.36, 0.26, 0.24, 0.05), PM.plastic(r() < 0.5 ? '#2f7bea' : '#e8473c'), -1.75, 0.98, 3.4, g);
    noShadow(mesh(box(0.03, 0.18, 0.08), PM.plastic('#ffd23d'), -1.56, 1.05, 3.42, g));
    put(g, premiumBush(seed * 3 + 1, 0.8), -2.0, 0, 2.4);
    put(g, premiumBush(seed * 3 + 2, 0.75), 1.9, 0, 2.5);
    if (r() < 0.6) put(g, premiumBush(seed * 3 + 4, 0.6), 0.6, 0, 2.6);
  }
  const sh = softShadow(5.4, 4.8, 0.45); sh.position.y = 0.03; g.add(sh);
  return g;
}

// Laje com platibanda: borda colorida em volta e piso de concreto no meio (em vez de um bloco chapado).
function roofDeck(g, w, d, y, rimM, t = 0.2, hh = 0.45) {
  noShadow(mesh(box(w - 0.1, 0.08, d - 0.1), PM.concrete([w / 3, d / 3]), 0, y + 0.04, 0, g));
  for (const s of [-1, 1]) {
    mesh(box(w, hh, t), rimM, 0, y + hh / 2, s * (d / 2 - t / 2), g);
    mesh(box(t, hh, d - t * 2), rimM, s * (w / 2 - t / 2), y + hh / 2, 0, g);
  }
  for (const s of [-1, 1]) noShadow(mesh(box(w + 0.04, 0.05, t + 0.04), white(), 0, y + hh + 0.02, s * (d / 2 - t / 2), g));
  for (const s of [-1, 1]) noShadow(mesh(box(t + 0.04, 0.05, d), white(), s * (w / 2 - t / 2), y + hh + 0.02, 0, g));
}

// ---------------- loja ----------------
function stripes(a, b) {
  const key = 'awn' + a + b;
  return once(key, () => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 32;
    const x = c.getContext('2d');
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * 16, 0, 17, 32); }
    x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(0, 0, 128, 4);
    x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 28, 128, 4);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 }); m.envMapIntensity = 0.2;
    return m;
  });
}
// Toldo inclinado com babado de meia-lua alternando as duas cores.
function awning(g, w, x, y, z, color) {
  const aw = mesh(box(w, 0.08, 1.25), stripes(color, '#ffffff'), x, y, z + 0.55, g);
  aw.rotation.x = 0.4;
  const n = Math.max(4, Math.round(w / 0.32));
  for (let i = 0; i < n; i++) noShadow(mesh(cyl(0.16, 0.16, 0.07, 10, 1), i % 2 ? white() : PM.plastic(color), x - w / 2 + (w / n) * (i + 0.5), y - 0.27, z + 1.12, g)).rotation.x = Math.PI / 2;
  for (const sx of [-1, 1]) noShadow(mesh(box(0.04, 0.04, 1.2), darkMetal(), x + sx * (w / 2 - 0.1), y - 0.18, z + 0.55, g)).rotation.x = 0.4;
}
export function shopP(name, wallC, awnC, signBg, w = 6, d = 5, h = 3.4) {
  const g = new THREE.Group();
  const wall = PM.plaster(wallC, [w / 3, h / 2]);
  mesh(rbox(w + 0.1, 0.55, d + 0.1, 0.04), PM.brick([w / 1.6, 0.8]), 0, 0.27, 0, g);
  mesh(rbox(w, h, d, 0.08), wall, 0, h / 2, 0, g);
  mesh(rbox(w + 0.3, 0.16, d + 0.3, 0.04), white(), 0, h + 0.02, 0, g);
  roofDeck(g, w + 0.16, d + 0.16, h + 0.1, PM.plastic(signBg));
  // Telhado: ar-condicionado e respiro.
  mesh(rbox(1.0, 0.55, 0.8, 0.06), PM.metal('#dfe4ec'), -w / 2 + 1.1, h + 0.45, -d / 2 + 1.0, g);
  noShadow(mesh(cyl(0.24, 0.24, 0.04, 14), mat('#3a3d48'), -w / 2 + 1.1, h + 0.74, -d / 2 + 1.0, g));
  mesh(cyl(0.12, 0.12, 0.5, 8), PM.metal('#c6ccd6'), w / 2 - 0.9, h + 0.42, -d / 2 + 0.9, g);
  // Fachada: moldura escura, vitrine com prateleiras e porta de vidro.
  const fz = d / 2;
  const fw = w * 0.9, winW = fw - 1.35;
  mesh(rbox(fw, 1.86, 0.12, 0.04), darkMetal(), 0, 1.47, fz + 0.03, g);
  const wx = -fw / 2 + winW / 2 + 0.1;
  noShadow(mesh(box(winW - 0.1, 1.62, 0.04), PM.shelves(), wx, 1.5, fz + 0.1, g));
  for (let k = 1; k < 3; k++) noShadow(mesh(box(0.06, 1.62, 0.05), PM.metal('#c6ccd6'), wx - winW / 2 + (k * winW) / 3, 1.5, fz + 0.13, g));
  const dx = fw / 2 - 0.62;
  noShadow(mesh(box(0.95, 1.7, 0.04), PM.shelves(), dx, 1.43, fz + 0.1, g));
  noShadow(mesh(box(0.06, 0.6, 0.06), PM.chrome(), dx - 0.32, 1.3, fz + 0.16, g));
  mesh(rbox(1.2, 0.12, 0.45, 0.03), PM.concrete(), dx, 0.06, fz + 0.25, g);
  mesh(rbox(winW + 0.15, 0.1, 0.24, 0.03), white(), wx, 0.62, fz + 0.14, g);
  // Toldo, letreiro com placa de fundo e lâmpadas.
  awning(g, fw * 0.98, 0, 2.62, fz, awnC);
  const sw = Math.min(w * 0.8, 6.6), shh = Math.min(0.62, h - 2.9 + 0.1);
  mesh(rbox(sw + 0.16, shh + 0.14, 0.12, 0.04), PM.plastic('#1d2b4f'), 0, h - 0.4, fz + 0.05, g);
  const ch = Math.round((640 * shh) / sw);
  const s = sign(name, sw, shh, { bg: signBg, size: Math.round(ch * 0.66), stroke: '#1d2b4f', night: true, w: 640, h: ch, radius: 14 });
  s.position.set(0, h - 0.4, fz + 0.12); g.add(s);
  for (const x of [-sw / 3, 0, sw / 3]) {
    noShadow(mesh(box(0.04, 0.04, 0.32), darkMetal(), x, h - 0.02, fz + 0.24, g));
    noShadow(mesh(sph(0.07, 8, 6), lampGlow(), x, h - 0.08, fz + 0.4, g));
  }
  // Lado (+x): janela e ar-condicionado com cano.
  put(g, windowP(0.9, 0.8), w / 2 + 0.04, 2.0, -0.7, Math.PI / 2);
  mesh(rbox(0.32, 0.5, 0.8, 0.05), PM.metal('#e8ecf2'), w / 2 + 0.17, 2.3, 0.9, g);
  noShadow(mesh(cyl(0.035, 0.035, 2.0, 6), PM.metal('#9aa3b2'), w / 2 + 0.1, 1.2, 1.4, g));
  // Fundos (lado da avenida): janela e porta de serviço.
  put(g, windowP(w * 0.35, 0.8), -w * 0.15, 1.9, -fz - 0.04, Math.PI);
  mesh(rbox(0.9, 1.9, 0.1, 0.03), PM.metal('#9aa3b2'), w * 0.3, 0.95, -fz - 0.03, g);
  // Cavalete com plaquinha e vaso na porta.
  const cav = new THREE.Group();
  for (const sz of [-1, 1]) { const b = mesh(rbox(0.5, 0.7, 0.04, 0.02), PM.wood(), 0, 0.36, sz * 0.12, cav); b.rotation.x = sz * 0.28; }
  noShadow(mesh(box(0.38, 0.4, 0.02), mat('#2b3242', { r: 0.9 }), 0, 0.42, 0.24, cav)).rotation.x = 0.28;
  put(g, cav, -fw / 2 + 0.5, 0, fz + 1.45, 0.3);
  mesh(rbox(0.5, 0.45, 0.5, 0.06), PM.plastic('#c0533a'), dx + 0.85, 0.22, fz + 0.4, g);
  put(g, premiumBush(name.length * 7, 0.55), dx + 0.85, 0.35, fz + 0.4);
  const sh = softShadow(w + 1.4, d + 1.6, 0.4); sh.position.y = 0.03; g.add(sh);
  return g;
}

export function marketP() {
  const g = shopP('MERCADINHO', '#ffffff', '#46c35a', '#2f8f1c', 10, 7, 3.8);
  // Bancas de frutas em caixotes de madeira.
  const fruits = ['#e8473c', '#ffc93c', '#ff8a2a', '#7cc94a', '#8a5cf0', '#ffd23d'];
  const r = rng(99);
  for (let i = 0; i < 4; i++) {
    const x = -4 + i * 1.15;
    mesh(rbox(1.0, 0.55, 0.7, 0.04), PM.wood([1, 1]), x, 0.32, 4.55, g);
    const c = fruits[i % fruits.length];
    for (let k = 0; k < 7; k++) noShadow(mesh(sph(0.12, 8, 6), mat(c, { r: 0.45 }), x - 0.32 + (k % 4) * 0.21, 0.66 + Math.floor(k / 4) * 0.08, 4.42 + (k > 3 ? 0.22 : 0) + r() * 0.04, g));
  }
  // Carrinhos de compra.
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Group();
    mesh(rbox(0.6, 0.45, 0.85, 0.03), PM.metal('#c6ccd6'), 0, 0.6, 0, c);
    noShadow(mesh(box(0.5, 0.05, 0.75), mat('#3a3d48'), 0, 0.4, 0, c));
    mesh(box(0.6, 0.05, 0.05), PM.plastic('#e8473c'), 0, 0.95, -0.47, c);
    for (const sx of [-0.25, 0.25]) for (const sz of [-0.35, 0.35]) noShadow(mesh(cyl(0.06, 0.06, 0.04, 8), PM.rubber(), sx, 0.07, sz, c)).rotation.z = Math.PI / 2;
    put(g, c, 3.0 + i * 0.35, 0, 4.4 + i * 0.25, 0.2);
  }
  return g;
}

// ---------------- prédio de apartamentos ----------------
export function apartmentsP() {
  const g = new THREE.Group();
  const w = 7, d = 6, floors = 5, fh = 2.3, H = floors * fh;
  mesh(rbox(w, H, d, 0.1), PM.plaster('#f2c38b', [3, 5]), 0, H / 2, 0, g);
  mesh(rbox(w + 0.08, fh - 0.1, d + 0.08, 0.06), PM.stone([3, 1]), 0, (fh - 0.1) / 2, 0, g);
  for (let f = 1; f < floors; f++) noShadow(mesh(box(w + 0.14, 0.14, d + 0.14), white(), 0, f * fh, 0, g));
  const fz = d / 2, sx = w / 2;
  for (let f = 1; f < floors; f++) {
    const y = f * fh;
    put(g, windowP(1.2, 1.0, { flowers: f % 2 ? '#ffffff' : null, seed: f }), 0, y + 1.2, fz + 0.04);
    for (const x of [-2.3, 2.3]) {
      put(g, windowP(1.0, 1.6), x, y + 0.98, fz + 0.04);
      mesh(rbox(1.9, 0.12, 0.9, 0.03), PM.concrete(), x, y + 0.12, fz + 0.45, g);
      noShadow(mesh(box(1.8, 0.62, 0.04), railGlass(), x, y + 0.5, fz + 0.86, g));
      noShadow(mesh(box(1.86, 0.06, 0.06), PM.metal('#e8ecf2'), x, y + 0.83, fz + 0.86, g));
      for (const s of [-1, 1]) noShadow(mesh(box(0.05, 0.7, 0.85), PM.metal('#e8ecf2'), x + s * 0.92, y + 0.47, fz + 0.45, g));
    }
    // Lado direito (+x), visto pela câmera: duas janelas por andar, alguns com ar-condicionado.
    for (const z of [-1.5, 1.4]) {
      put(g, windowP(1.0, 1.0), sx + 0.04, y + 1.2, z, Math.PI / 2);
      if ((f + (z > 0 ? 1 : 0)) % 2) mesh(rbox(0.32, 0.45, 0.75, 0.04), PM.metal('#e8ecf2'), sx + 0.18, y + 0.45, z, g);
    }
  }
  // Térreo: portaria com porta de vidro, marquise, número e duas vitrines.
  mesh(rbox(1.8, 2.25, 0.12, 0.04), darkMetal(), 0, 1.12, fz + 0.04, g);
  noShadow(mesh(box(1.5, 2.0, 0.04), PM.glass(), 0, 1.05, fz + 0.1, g));
  noShadow(mesh(box(0.05, 2.0, 0.05), PM.metal('#c6ccd6'), 0, 1.05, fz + 0.13, g));
  mesh(rbox(2.6, 0.15, 1.3, 0.04), PM.concrete(), 0, 2.45, fz + 0.65, g);
  for (const s of [-1, 1]) noShadow(mesh(cyl(0.05, 0.05, 2.4, 8), PM.metal('#c6ccd6'), s * 1.15, 1.2, fz + 1.2, g));
  const num = sign('127', 0.6, 0.3, { bg: '#ffffff', fg: '#1d2b4f', size: 80, w: 160, h: 80 });
  num.position.set(1.3, 2.1, fz + 0.08); g.add(num);
  for (const x of [-2.4, 2.4]) put(g, windowP(1.3, 1.1, { glass: PM.shelves() }), x, 1.2, fz + 0.06);
  for (const z of [-1.5, 1.4]) put(g, windowP(1.0, 0.9), sx + 0.06, 1.2, z, Math.PI / 2);
  mesh(rbox(3.4, 0.16, 0.6, 0.03), PM.concrete(), 0, 0.08, fz + 0.4, g);
  // Cobertura: platibanda, casa de máquinas, caixa d'água e antena.
  roofDeck(g, w + 0.3, d + 0.3, H, white());
  mesh(rbox(1.9, 1.2, 1.6, 0.05), PM.plaster('#f2c38b'), 1.6, H + 0.68, -1.2, g);
  mesh(rbox(1.0, 1.6, 0.08, 0.02), PM.metal('#9aa3b2'), 1.6, H + 0.68, -0.38, g);
  mesh(cyl(0.8, 0.8, 1.2, 16), PM.plastic('#2f7bea'), -1.8, H + 0.68, -1, g);
  mesh(cyl(0.85, 0.85, 0.15, 16), PM.plastic('#1f5bb5'), -1.8, H + 1.33, -1, g);
  noShadow(mesh(cyl(0.03, 0.03, 1.8, 6), PM.metal('#9aa3b2'), 2.6, H + 1.2, 1.8, g));
  noShadow(mesh(box(0.8, 0.04, 0.04), PM.metal('#9aa3b2'), 2.6, H + 1.8, 1.8, g));
  noShadow(mesh(sph(0.08, 6, 5), mat('#ff3b3b', { e: '#ff2020', ei: 1.2 }), 2.6, H + 2.12, 1.8, g));
  const sh = softShadow(w + 2, d + 2.4, 0.45); sh.position.y = 0.03; g.add(sh);
  return g;
}

// ---------------- igreja ----------------
function clockFace() {
  return once('clock', () => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#fffbea'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill();
    x.strokeStyle = '#1d2b4f'; x.lineWidth = 6; x.stroke();
    x.lineWidth = 4;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; x.beginPath(); x.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); x.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); x.stroke(); }
    x.lineCap = 'round'; x.lineWidth = 7; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 30); x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(64, 64); x.lineTo(90, 72); x.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.15 });
    return m;
  });
}
export function churchP() {
  const g = new THREE.Group();
  const wall = PM.plaster('#fbf6ea', [3, 2]);
  const blue = PM.plastic('#2f7bea');
  const gold = PM.metal('#ffd23d');
  mesh(rbox(6.4, 0.45, 9.4, 0.05), PM.stone([3, 0.5]), 0, 0.22, 0, g);
  mesh(rbox(6, 3.8, 9, 0.1), wall, 0, 0.45 + 1.9, 0, g);
  noShadow(mesh(box(6.1, 0.16, 9.1), blue, 0, 4.2, 0, g));
  // Telhado da nave (cumeeira ao longo de z).
  const nave = new THREE.Group();
  gable(nave, 9, 6, 2.3, 0.35, PM.roofTint('#d0583c', [5, 3]), 0, wall);
  nave.rotation.y = Math.PI / 2; nave.position.y = 4.25;
  g.add(nave);
  // Vitrais em arco nas laterais.
  const vit = [glow('#8fc6ff', '#2a5aa8', '#ffd27a', 0.35, 1.8), glow('#ffd77a', '#a86a10', '#ffd27a', 0.35, 1.8), glow('#ff9a8a', '#a8302a', '#ffd27a', 0.35, 1.8)];
  [-2.6, 0, 2.6].forEach((z, i) => {
    for (const sx of [-1, 1]) {
      const x = sx * 3.03;
      mesh(rbox(0.12, 1.5, 0.82, 0.04), white(), x, 2.3, z, g);
      noShadow(mesh(box(0.1, 1.3, 0.62), vit[i], x + sx * 0.02, 2.25, z, g));
      noShadow(mesh(cyl(0.31, 0.31, 0.1, 12, 1), vit[i], x + sx * 0.02, 2.9, z, g)).rotation.z = Math.PI / 2;
    }
  });
  // Torre com sineiro, relógio, coruchéu e cruz.
  mesh(rbox(2.7, 8.4, 2.7, 0.08), wall, 0, 4.2, 4.4, g);
  for (const y of [3.2, 6.3]) noShadow(mesh(box(2.8, 0.16, 2.8), blue, 0, y, 4.4, g));
  const bell = mat('#1d2b4f', { r: 0.9 });
  for (const [x, z, ry] of [[0, 5.77, 0], [1.37, 4.4, Math.PI / 2], [-1.37, 4.4, Math.PI / 2]]) {
    const o = noShadow(mesh(box(0.9, 1.3, 0.06), bell, x, 7.3, z, g)); o.rotation.y = ry;
    const a = noShadow(mesh(cyl(0.45, 0.45, 0.06, 12, 1), bell, x, 7.95, z, g)); a.rotation.set(Math.PI / 2, 0, ry ? Math.PI / 2 : 0);
    if (ry) { a.rotation.set(0, 0, Math.PI / 2); }
  }
  noShadow(mesh(sph(0.32, 10, 8), gold, 0, 7.15, 4.4, g));
  mesh(rbox(2.95, 0.3, 2.95, 0.05), blue, 0, 8.5, 4.4, g);
  const top = mesh(new THREE.ConeGeometry(2.0, 2.8, 4), PM.roofTint('#d0583c', [2, 2]), 0, 10.05, 4.4, g);
  top.rotation.y = Math.PI / 4;
  mesh(box(0.14, 1.2, 0.14), gold, 0, 12.0, 4.4, g);
  mesh(box(0.7, 0.14, 0.14), gold, 0, 12.2, 4.4, g);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), clockFace());
  clock.position.set(0, 5.4, 5.77); g.add(clock);
  noShadow(mesh(torus(0.57, 0.06, 6, 24), gold, 0, 5.4, 5.76, g));
  // Porta em arco de madeira com degraus.
  mesh(rbox(1.6, 2.5, 0.14, 0.04), white(), 0, 1.6, 5.77, g);
  mesh(rbox(1.3, 2.0, 0.1, 0.03), PM.wood([1, 2]), 0, 1.45, 5.82, g);
  noShadow(mesh(cyl(0.65, 0.65, 0.1, 14, 1), PM.wood([1, 1]), 0, 2.45, 5.82, g)).rotation.x = Math.PI / 2;
  noShadow(mesh(box(0.04, 2.0, 0.02), mat('#3a2412'), 0, 1.45, 5.88, g));
  for (let i = 0; i < 3; i++) mesh(rbox(2.6 - i * 0.4, 0.15, 0.5, 0.03), PM.stone(), 0, 0.08 + i * 0.15, 6.4 - i * 0.3, g);
  const sh = softShadow(8.4, 12, 0.45); sh.position.y = 0.03; g.add(sh);
  return g;
}

// ---------------- ponto de ônibus ----------------
export function busStopP() {
  const g = new THREE.Group();
  const m = PM.metal('#2b3242');
  for (const x of [-1.6, 1.6]) mesh(cyl(0.06, 0.06, 2.4, 8), m, x, 1.2, -0.4, g);
  mesh(rbox(3.9, 0.14, 1.5, 0.05), PM.plastic('#2f7bea'), 0, 2.46, 0, g);
  noShadow(mesh(box(3.4, 1.7, 0.05), railGlass(), 0, 1.35, -0.45, g));
  for (let i = 0; i < 3; i++) mesh(rbox(2.6, 0.06, 0.14, 0.02), PM.wood(), 0, 0.55, -0.32 + i * 0.16, g);
  for (const x of [-1.1, 1.1]) mesh(rbox(0.06, 0.5, 0.4, 0.02), m, x, 0.28, -0.16, g);
  // Painel de propaganda iluminado na ponta.
  mesh(rbox(0.16, 1.9, 1.1, 0.03), m, -1.95, 1.2, -0.05, g);
  const ad = sign('NITRO', 1.0, 1.6, { bg: '#ff8a2a', size: 58, stroke: '#1d2b4f', night: true, w: 200, h: 320, sub: 'OFICINA' });
  ad.position.set(-1.86, 1.2, -0.05); ad.rotation.y = Math.PI / 2; g.add(ad);
  mesh(cyl(0.05, 0.05, 2.7, 8), m, 2.3, 1.35, 0.2, g);
  const s = sign('ÔNIBUS', 1.1, 0.4, { bg: '#ffd23d', fg: '#1d2b4f', stroke: '#1d2b4f', size: 64, w: 320, h: 120 });
  s.position.set(2.3, 2.55, 0.23); g.add(s);
  const sh = softShadow(4.4, 2, 0.35); sh.position.y = 0.03; g.add(sh);
  return g;
}

// Poste de praça com lanterna de vidro (não tem luz de verdade: só brilha, para o celular continuar leve).
export function parkLamp(h = 3.2) {
  const g = new THREE.Group();
  const m = PM.metal('#2b3242');
  mesh(cyl(0.2, 0.26, 0.4, 10), m, 0, 0.2, 0, g);
  mesh(cyl(0.06, 0.09, h, 8), m, 0, h / 2 + 0.2, 0, g);
  noShadow(mesh(torus(0.1, 0.03, 6, 12), m, 0, h * 0.45, 0, g)).rotation.x = Math.PI / 2;
  mesh(cyl(0.16, 0.12, 0.12, 8), m, 0, h + 0.26, 0, g);
  mesh(cyl(0.17, 0.13, 0.42, 6), lampGlow(), 0, h + 0.53, 0, g);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; noShadow(mesh(box(0.03, 0.44, 0.03), m, Math.cos(a) * 0.16, h + 0.53, Math.sin(a) * 0.16, g)); }
  mesh(new THREE.ConeGeometry(0.3, 0.3, 6), m, 0, h + 0.9, 0, g);
  noShadow(mesh(sph(0.05, 6, 5), m, 0, h + 1.08, 0, g));
  return g;
}

// Lago: borda de pedra, água que desliza, pedras, vitórias-régias, taboas e píer de madeira.
export function pondP(rx, rz, seed = 3) {
  const g = new THREE.Group();
  const r = rng(seed);
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.22, 48), PM.stone([10, 1]));
  edge.scale.set(rx + 0.85, 1, rz + 0.85); edge.position.y = 0.05; edge.receiveShadow = true; g.add(edge);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 48), PM.water([3, 2]));
  water.scale.set(rx, 1, rz); water.position.y = 0.09; water.receiveShadow = true; g.add(water);
  const rockM = once('rock', () => { const m = new THREE.MeshStandardMaterial({ color: '#a7aab2', roughness: 0.85, flatShading: true }); m.envMapIntensity = 0.15; return m; });
  for (let i = 0; i < 18; i++) {
    const a = r() * Math.PI * 2;
    const k = mesh(new THREE.DodecahedronGeometry(0.3 + r() * 0.35), rockM, Math.cos(a) * (rx + 0.75), 0.16, Math.sin(a) * (rz + 0.75), g);
    k.scale.y = 0.55 + r() * 0.2; k.rotation.y = r() * 6;
  }
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2, rr = 0.3 + r() * 0.45;
    const lily = noShadow(mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.03, 14, 1, false, 0, Math.PI * 1.8), mat('#3fa63f'), Math.cos(a) * rx * rr, 0.21, Math.sin(a) * rz * rr, g));
    lily.rotation.y = r() * 6;
    if (i % 3 === 0) noShadow(mesh(sph(0.09, 8, 6), mat('#ff9fd4', { r: 0.5 }), Math.cos(a) * rx * rr + 0.1, 0.27, Math.sin(a) * rz * rr, g));
  }
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2;
    const x = Math.cos(a) * (rx - 0.3), z = Math.sin(a) * (rz - 0.3);
    noShadow(mesh(cyl(0.035, 0.035, 1.3, 5), mat('#4c8a3a'), x, 0.65, z, g));
    noShadow(mesh(cyl(0.08, 0.08, 0.32, 6), mat('#7a4a2a'), x, 1.2, z, g));
  }
  for (let i = 0; i < 5; i++) mesh(rbox(1.6, 0.1, 0.42, 0.02), PM.wood([1, 1]), rx - 0.4, 0.3, -1 + i * 0.48, g);
  for (const z of [-1.1, 1.0]) for (const dx of [-0.7, 0.7]) mesh(cyl(0.08, 0.08, 0.7, 6), PM.wood(), rx - 0.4 + dx, 0.15, z, g);
  return g;
}

// Chafariz da praça em pedra, com água que desliza nas duas bacias.
export function fountainP() {
  const g = new THREE.Group();
  const st = PM.stone([4, 1]), st2 = PM.stone([2, 1]);
  mesh(cyl(3, 3.2, 0.75, 32), st, 0, 0.37, 0, g);
  mesh(torus(3.0, 0.12, 6, 40), white(), 0, 0.75, 0, g).rotation.x = Math.PI / 2;
  noShadow(mesh(cyl(2.75, 2.75, 0.06, 32), PM.water([2, 2]), 0, 0.68, 0, g));
  mesh(cyl(0.45, 0.65, 1.7, 14), st2, 0, 1.4, 0, g);
  mesh(cyl(1.25, 0.55, 0.35, 22), st, 0, 2.3, 0, g);
  noShadow(mesh(cyl(1.1, 1.1, 0.05, 22), PM.water([1, 1]), 0, 2.46, 0, g));
  mesh(cyl(0.18, 0.25, 0.6, 10), st2, 0, 2.7, 0, g);
  mesh(sph(0.2, 10, 8), PM.metal('#ffd23d'), 0, 3.05, 0, g);
  return g;
}

// Meio-fio de concreto nas ruas laterais e na Rua dos Fundos (com vão nos cruzamentos).
export function sideCurbs(S, D, { C1, C2, BZ }) {
  const m = PM.concrete([1, 1]);
  const E = 3.62, HW = 3.5;
  const seg = (x0, z0, x1, z1) => {
    const ax = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    const len = ax ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
    if (len < 0.3) return;
    noShadow(mesh(rbox(ax ? len : 0.26, 0.3, ax ? 0.26 : len, 0.08), m, (x0 + x1) / 2, 0.07, (z0 + z1) / 2, S));
  };
  for (const C of [C1, C2]) for (const s of [-1, 1]) seg(C + s * E, D + 11.8, C + s * E, D + 56); // ao sul da avenida
  seg(C2 + E, D - 62, C2 + E, D);
  seg(C2 - E, D - 62, C2 - E, BZ - HW); seg(C2 - E, BZ + HW, C2 - E, D);
  seg(C1 - E, BZ - E, C1 - E, D); seg(C1 + E, BZ + HW, C1 + E, D);
  seg(C1 - E, BZ - E, C2 - HW, BZ - E);
  seg(C1 + HW, BZ + E, C2 - HW, BZ + E);
  // Baias de estacionamento (piso intertravado) onde ficam os carros parados.
  return (x, z) => noShadow(mesh(box(2.5, 0.08, 5.4), PM.pavers([1, 2]), x, 0.03, z, S));
}
