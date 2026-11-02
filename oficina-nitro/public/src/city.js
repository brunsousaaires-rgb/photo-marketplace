// A cidade em volta da oficina: praça com chafariz e coreto, lojinhas, igrejinha, prédio, campinho,
// parque com lago e patinhos, parquinho, mercadinho, ponto de ônibus, semáforo e o letreiro no morro.
// O que fica parado é juntado em poucos blocos (um por material) para o celular continuar leve.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, mesh, box, cyl, sph, rbox, buildTree, buildPerson, animatePerson, buildBuilding, buildCar, textTexture, glow } from './models.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// Calçadão de pedra portuguesa (ondas pretas e brancas, como em Copacabana).
function waveTexture(repeat) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f3efe6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a3f4b';
    for (let band = -1; band < 3; band++) {
      g.beginPath();
      for (let x = 0; x <= w; x += 4) g.lineTo(x, band * 128 + 40 + Math.sin((x / w) * Math.PI * 2) * 28);
      for (let x = w; x >= 0; x -= 4) g.lineTo(x, band * 128 + 84 + Math.sin((x / w) * Math.PI * 2) * 28);
      g.closePath(); g.fill();
    }
    // Rejuntes: pedrinhas.
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1;
    for (let i = 0; i < 900; i++) { const x = Math.random() * w, y = Math.random() * h; g.strokeRect(x, y, 5 + Math.random() * 4, 5 + Math.random() * 4); }
  }, repeat);
}

function pavers(repeat, a = '#d9d4c7', b = '#cfc8b8') {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    g.fillStyle = b;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); }
  }, repeat);
}

// Grama com manchas suaves (fica menos "chapada").
export function grassTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7ccb5b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 50;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      const c = Math.random() < 0.5 ? '120,200,85' : '104,184,74';
      grd.addColorStop(0, `rgba(${c},.55)`); grd.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(150,215,110,.45)' : 'rgba(90,165,65,.35)';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 3);
    }
  }, [60, 60]);
}

function stripes(c1, c2, n = 8) {
  return canvasTex(128, 32, (g, w, h) => {
    for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect((i * w) / n, 0, w / n + 1, h); }
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, w, 5);
  });
}

const texMat = (tex, o = {}) => {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: o.r ?? 0.85, metalness: 0, transparent: !!o.t, side: o.side ?? THREE.FrontSide });
  m.envMapIntensity = 0.12; // sem isso o reflexo do céu deixa as cores desbotadas
  return m;
};

function signMesh(text, w, h, opts) {
  const tex = textTexture(text, opts);
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

// Junta tudo que é parado num bloco por material (bem menos chamadas de desenho).
function bake(group) {
  group.updateMatrixWorld(true);
  const buckets = new Map();
  group.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    const key = o.material.uuid + (o.castShadow ? 'c' : 'n');
    if (!buckets.has(key)) buckets.set(key, { m: o.material, cast: o.castShadow, list: [] });
    buckets.get(key).list.push(g);
  });
  const out = new THREE.Group();
  for (const { m, cast, list } of buckets.values()) {
    const merged = mergeGeometries(list, false);
    if (!merged) continue;
    const me = new THREE.Mesh(merged, m);
    me.castShadow = cast;
    me.receiveShadow = true;
    me.matrixAutoUpdate = false;
    out.add(me);
  }
  return out;
}

const flat = (m) => { m.castShadow = false; return m; };

// ---------------- peças da cidade ----------------
function lampPost(g, x, z, h = 3.2) {
  mesh(cyl(0.07, 0.1, h, 8), mat('#2b3242', { m: 0.5, r: 0.4 }), x, h / 2, z, g);
  mesh(cyl(0.18, 0.12, 0.12, 10), mat('#2b3242', { m: 0.5, r: 0.4 }), x, h + 0.02, z, g);
  mesh(sph(0.22, 12, 10), glow('#fff1c4', '#3a3420', '#ffd27a', 0.15, 2.2), x, h + 0.22, z, g);
}

function bench(g, x, z, rot) {
  const b = buildBuilding('banco');
  b.position.set(x, 0, z);
  b.rotation.y = rot;
  g.add(b);
}

function flowerBed(g, x, z, s = 1) {
  const f = buildBuilding('flores');
  f.position.set(x, 0, z);
  f.scale.setScalar(s);
  g.add(f);
}

function tree(g, x, z, s = 1) {
  const t = buildTree(s, Math.floor(Math.random() * 3));
  t.position.set(x, 0, z);
  t.rotation.y = rnd(0, 6);
  g.add(t);
  return t;
}

function bush(g, x, z, s = 1) {
  const c = pick(['#4cb848', '#3fa63f', '#5ccc52']);
  mesh(sph(0.55 * s, 9, 7), mat(c, { flat: true }), x, 0.35 * s, z, g).scale.set(1, 0.75, 1);
  mesh(sph(0.4 * s, 9, 7), mat(c, { flat: true }), x + 0.4 * s, 0.3 * s, z + 0.15 * s, g).scale.set(1, 0.75, 1);
}

// Lojinha com toldo listrado e letreiro (frente virada para +z).
function shop(name, wall, awn, signBg, w = 6, d = 5, h = 3.4) {
  const g = new THREE.Group();
  mesh(rbox(w, h, d, 0.12), mat(wall), 0, h / 2, 0, g);
  mesh(rbox(w + 0.2, 0.3, d + 0.2, 0.08), mat('#ffffff'), 0, h + 0.1, 0, g);
  // Vitrine e porta.
  const win = glow('#bfe6ff', '#2a4a6a', '#ffe0a0', 0.25, 1.6);
  mesh(rbox(w * 0.42, 1.5, 0.12, 0.04), win, -w * 0.2, 1.25, d / 2 + 0.02, g);
  mesh(rbox(1.1, 2.1, 0.12, 0.04), mat('#8a5a3a'), w * 0.25, 1.05, d / 2 + 0.02, g);
  mesh(sph(0.06, 6, 6), mat('#ffd23d', { m: 0.8, r: 0.3 }), w * 0.25 + 0.35, 1.05, d / 2 + 0.12, g);
  // Toldo.
  const aw = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.12, 1.4), texMat(stripes(awn, '#ffffff')));
  aw.position.set(0, 2.55, d / 2 + 0.6);
  aw.rotation.x = 0.35;
  aw.castShadow = true;
  g.add(aw);
  const s = signMesh(name, w * 0.8, w * 0.2, { bg: signBg, size: 70, stroke: '#1d2b4f' });
  s.position.set(0, h - 0.45, d / 2 + 0.08);
  g.add(s);
  // Fundos (lado da avenida): janelas e porta de serviço.
  mesh(rbox(w * 0.5, 0.9, 0.12, 0.04), win, -w * 0.15, 1.8, -d / 2 - 0.02, g);
  mesh(rbox(0.9, 1.9, 0.12, 0.04), mat('#9aa3b2'), w * 0.3, 0.95, -d / 2 - 0.02, g);
  return g;
}

function house(c1, roof, garden = true) {
  const g = buildHouse2(c1, roof);
  if (garden) {
    // Cerquinha branca e jardim na frente.
    for (let x = -2.4; x <= 2.4; x += 0.6) mesh(rbox(0.1, 0.6, 0.1, 0.03), mat('#ffffff'), x, 0.3, 3.2, g);
    mesh(box(5, 0.08, 0.08), mat('#ffffff'), 0, 0.45, 3.2, g);
    bush(g, -1.7, 2.4, 0.8);
    bush(g, 1.8, 2.5, 0.7);
  }
  return g;
}

function buildHouse2(color, roof) {
  const g = new THREE.Group();
  mesh(rbox(4.2, 2.5, 3.6, 0.12), mat(color), 0, 1.25, 0, g);
  const r = mesh(new THREE.ConeGeometry(3.3, 1.7, 4), mat(roof, { flat: true }), 0, 3.3, 0, g);
  r.rotation.y = Math.PI / 4;
  r.scale.set(1, 1, 0.84);
  mesh(rbox(0.9, 1.5, 0.12, 0.04), mat('#8a5a3a'), -0.9, 0.75, 1.82, g);
  const win = glow('#9fd8f5', '#3a6a8a', '#ffcf70', 0.3, 1.5);
  mesh(rbox(1.1, 0.85, 0.12, 0.04), win, 0.9, 1.45, 1.82, g);
  mesh(rbox(1.3, 0.12, 0.3, 0.03), mat('#ffffff'), 0.9, 0.95, 1.9, g);
  mesh(rbox(0.5, 1.2, 0.5, 0.05), mat('#b5523b'), 1.2, 3.4, -0.6, g); // chaminé
  mesh(rbox(1.1, 0.85, 0.12, 0.04), win, 0, 1.45, -1.82, g);
  mesh(rbox(0.12, 0.85, 1.1, 0.04), win, 2.12, 1.45, 0, g);
  return g;
}

function church() {
  const g = new THREE.Group();
  const white = mat('#f7f3ea'), blue = mat('#2f7bea'), roofM = mat('#c0533a', { flat: true });
  mesh(rbox(6, 4, 9, 0.15), white, 0, 2, 0, g);
  // Telhado de duas águas: triângulo puxado ao longo da nave.
  const tri = new THREE.Shape();
  tri.moveTo(-3.5, 0); tri.lineTo(3.5, 0); tri.lineTo(0, 2.4); tri.lineTo(-3.5, 0);
  const roofG = new THREE.ExtrudeGeometry(tri, { depth: 9.4, bevelEnabled: false });
  roofG.translate(0, 0, -4.7);
  const roof = new THREE.Mesh(roofG, roofM);
  roof.position.set(0, 4, 0); roof.castShadow = true; roof.receiveShadow = true;
  g.add(roof);
  // Torre do sino.
  mesh(rbox(2.6, 8, 2.6, 0.1), white, 0, 4, 4.4, g);
  mesh(rbox(2.8, 0.3, 2.8, 0.05), blue, 0, 8.1, 4.4, g);
  const top = mesh(new THREE.ConeGeometry(2, 2.6, 4), roofM, 0, 9.5, 4.4, g);
  top.rotation.y = Math.PI / 4;
  mesh(box(0.14, 1.2, 0.14), mat('#ffd23d', { m: 0.7, r: 0.3 }), 0, 11.4, 4.4, g);
  mesh(box(0.7, 0.14, 0.14), mat('#ffd23d', { m: 0.7, r: 0.3 }), 0, 11.6, 4.4, g);
  mesh(cyl(0.5, 0.5, 0.15, 16), mat('#1d2b4f'), 0, 6.6, 5.72, g).rotation.x = Math.PI / 2;
  mesh(sph(0.35, 10, 8), mat('#ffd23d', { m: 0.8, r: 0.3 }), 0, 6.4, 5.6, g);
  // Porta em arco e janelas azuis.
  mesh(rbox(1.3, 2.2, 0.15, 0.05), mat('#6b4a2c'), 0, 1.1, 5.72, g);
  mesh(cyl(0.65, 0.65, 0.15, 16, 1), mat('#6b4a2c'), 0, 2.2, 5.72, g).rotation.x = Math.PI / 2;
  const win = glow('#8fc6ff', '#2a4a8a', '#ffd27a', 0.3, 1.6);
  for (const z of [-2.5, 0, 2.5]) for (const x of [-3.02, 3.02]) mesh(rbox(0.12, 1.4, 0.8, 0.04), win, x, 2.2, z, g);
  mesh(rbox(6.4, 0.4, 9.4, 0.08), blue, 0, 0.2, 0, g);
  return g;
}

function apartments() {
  const g = new THREE.Group();
  const w = 7, d = 6, floors = 5, fh = 2.3;
  mesh(rbox(w, floors * fh, d, 0.15), mat('#f2c38b'), 0, (floors * fh) / 2, 0, g);
  const win = glow('#a8dcff', '#2a4a6a', '#ffe0a0', 0.25, 1.5);
  const rail = mat('#ffffff');
  for (let f = 0; f < floors; f++) {
    for (const x of [-2.3, 0, 2.3]) mesh(rbox(1.3, 1.1, 0.12, 0.04), win, x, f * fh + 1.3, d / 2 + 0.02, g);
    if (f > 0) for (const x of [-2.3, 2.3]) {
      mesh(rbox(1.7, 0.12, 0.8, 0.03), rail, x, f * fh + 0.55, d / 2 + 0.4, g);
      mesh(rbox(1.7, 0.5, 0.06, 0.02), rail, x, f * fh + 0.8, d / 2 + 0.8, g);
    }
  }
  mesh(rbox(w + 0.3, 0.3, d + 0.3, 0.06), mat('#ffffff'), 0, floors * fh, 0, g);
  // Caixa d'água azul no telhado.
  mesh(cyl(0.8, 0.8, 1.2, 14), mat('#2f7bea'), -1.8, floors * fh + 0.75, -1, g);
  mesh(cyl(0.85, 0.85, 0.15, 14), mat('#1f5bb5'), -1.8, floors * fh + 1.4, -1, g);
  mesh(cyl(0.03, 0.03, 1.6, 6), mat('#9aa3b2'), 2, floors * fh + 0.95, 1.5, g);
  mesh(rbox(1.4, 2.2, 0.15, 0.04), mat('#5a6a8c'), 0, 1.1, d / 2 + 0.03, g);
  return g;
}

function market() {
  const g = shop('MERCADINHO', '#ffffff', '#46c35a', '#46c35a', 10, 7, 3.8);
  for (let i = 0; i < 3; i++) mesh(rbox(0.9, 0.5, 0.6, 0.05), mat(pick(['#e8473c', '#ffc93c', '#ff8a2a'])), -3 + i * 1.1, 0.4, 4.6, g); // caixotes de frutas
  return g;
}

function busStop() {
  const g = new THREE.Group();
  const metal = mat('#2b3242', { m: 0.5, r: 0.4 });
  for (const x of [-1.6, 1.6]) mesh(cyl(0.06, 0.06, 2.4, 8), metal, x, 1.2, -0.4, g);
  mesh(rbox(3.8, 0.12, 1.4, 0.04), mat('#2f7bea'), 0, 2.45, 0, g);
  const glass = new THREE.MeshStandardMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.45, roughness: 0.1 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.7, 0.06), glass);
  back.position.set(0, 1.35, -0.45); g.add(back);
  mesh(rbox(2.6, 0.12, 0.45, 0.03), mat('#c98a4b'), 0, 0.55, -0.2, g);
  mesh(cyl(0.05, 0.05, 2.6, 8), metal, 2.3, 1.3, 0.2, g);
  const s = signMesh('ÔNIBUS', 1.1, 0.4, { bg: '#ffd23d', fg: '#1d2b4f', stroke: '#1d2b4f', size: 64, w: 320, h: 120 });
  s.position.set(2.3, 2.5, 0.23); g.add(s);
  return g;
}

function billboard() {
  const g = new THREE.Group();
  const metal = mat('#5a6070', { m: 0.5, r: 0.4 });
  for (const x of [-2.4, 2.4]) mesh(cyl(0.12, 0.14, 4.2, 8), metal, x, 2.1, 0, g);
  mesh(rbox(8.4, 3.4, 0.3, 0.06), mat('#1d2b4f'), 0, 5.3, 0, g);
  const s = signMesh('OFICINA NITRO', 7.9, 2.9, { w: 640, h: 236, bg: '#ff8a2a', size: 100, sub: 'Seu carro no grau!', stroke: '#1d2b4f' });
  s.position.set(0, 5.3, 0.17); g.add(s);
  for (const x of [-2.6, 0, 2.6]) mesh(sph(0.16, 8, 6), glow('#fff1c4', '#3a3420', '#ffd27a', 0.1, 2), x, 7.15, 0.3, g);
  return g;
}

function newsstand() {
  const g = new THREE.Group();
  mesh(rbox(2.4, 2.2, 1.8, 0.1), mat('#2f8f5a'), 0, 1.1, 0, g);
  mesh(rbox(2.8, 0.15, 2.3, 0.05), mat('#1f6b44'), 0, 2.3, 0.15, g);
  for (let i = 0; i < 6; i++) mesh(box(0.32, 0.42, 0.03), mat(pick(['#e8473c', '#ffd23d', '#2f7bea', '#ff6fb5', '#ffffff'])), -0.85 + (i % 3) * 0.85, 1.2 + Math.floor(i / 3) * 0.55, 0.92, g);
  const s = signMesh('BANCA', 1.6, 0.4, { bg: '#ffd23d', fg: '#1d2b4f', size: 64, w: 320, h: 90 });
  s.position.set(0, 2.05, 0.92); g.add(s);
  return g;
}

function cart(color, umbrella, label) {
  const g = new THREE.Group();
  mesh(rbox(1.4, 0.9, 0.8, 0.08), mat(color), 0, 0.85, 0, g);
  for (const x of [-0.5, 0.5]) mesh(cyl(0.22, 0.22, 0.1, 12), mat('#2b2d36'), x, 0.22, 0.42, g).rotation.x = Math.PI / 2;
  mesh(cyl(0.04, 0.04, 1.6, 6), mat('#d5d9e0'), 0, 2, 0, g);
  const u = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), texMat(stripes(umbrella, '#ffffff', 8)));
  u.position.y = 2.85; u.castShadow = true; g.add(u);
  if (label) { const s = signMesh(label, 1.2, 0.36, { bg: '#ffffff', fg: '#e8473c', size: 60, w: 320, h: 96, stroke: '#1d2b4f' }); s.position.set(0, 0.95, 0.42); g.add(s); }
  return g;
}

function coreto() {
  const g = new THREE.Group();
  mesh(cyl(3, 3.2, 0.6, 8), mat('#f3efe6'), 0, 0.3, 0, g);
  mesh(cyl(3.05, 3.05, 0.08, 8), mat('#c98a4b'), 0, 0.64, 0, g);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    mesh(cyl(0.1, 0.12, 2.6, 8), mat('#ffffff'), Math.cos(a) * 2.7, 1.95, Math.sin(a) * 2.7, g);
    if (i !== 2) { const r = mesh(box(2.1, 0.08, 0.08), mat('#ffffff'), Math.cos(a + Math.PI / 8) * 2.6, 1.2, Math.sin(a + Math.PI / 8) * 2.6, g); r.rotation.y = -(a + Math.PI / 8) + Math.PI / 2; }
  }
  const roof = mesh(new THREE.ConeGeometry(3.7, 1.8, 8), mat('#e8473c', { flat: true }), 0, 4.15, 0, g);
  roof.rotation.y = Math.PI / 8;
  mesh(rbox(7.2, 0.18, 7.2, 0.05), mat('#ffffff'), 0, 3.25, 0, g).scale.set(0.98, 1, 0.98);
  mesh(sph(0.22, 10, 8), mat('#ffd23d', { m: 0.7, r: 0.3 }), 0, 5.15, 0, g);
  // escadinha
  for (let i = 0; i < 2; i++) mesh(rbox(1.4, 0.2, 0.4, 0.04), mat('#f3efe6'), 0, 0.1 + i * 0.2, 3.35 - i * 0.3, g);
  return g;
}

function fountainBase() {
  const g = new THREE.Group();
  const stone = mat('#e3dccb'), stone2 = mat('#cfc6b0');
  mesh(cyl(3, 3.2, 0.75, 28), stone, 0, 0.37, 0, g);
  mesh(cyl(2.7, 2.7, 0.06, 28), mat('#4aa8e8', { r: 0.12, m: 0.1 }), 0, 0.66, 0, g);
  mesh(cyl(0.45, 0.65, 1.7, 14), stone2, 0, 1.4, 0, g);
  mesh(cyl(1.25, 0.55, 0.35, 20), stone, 0, 2.3, 0, g);
  mesh(cyl(1.1, 1.1, 0.05, 20), mat('#4aa8e8', { r: 0.12, m: 0.1 }), 0, 2.46, 0, g);
  mesh(cyl(0.18, 0.25, 0.6, 10), stone2, 0, 2.7, 0, g);
  return g;
}

function soccerField(w, d) {
  const g = new THREE.Group();
  const tex = canvasTex(512, 320, (c, W, H) => {
    for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#5fbf45' : '#6ccb4f'; c.fillRect((i * W) / 10, 0, W / 10 + 1, H); }
    c.strokeStyle = '#ffffff'; c.lineWidth = 6;
    c.strokeRect(12, 12, W - 24, H - 24);
    c.beginPath(); c.moveTo(W / 2, 12); c.lineTo(W / 2, H - 12); c.stroke();
    c.beginPath(); c.arc(W / 2, H / 2, 42, 0, Math.PI * 2); c.stroke();
    c.strokeRect(12, H / 2 - 70, 70, 140); c.strokeRect(W - 82, H / 2 - 70, 70, 140);
  });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), texMat(tex));
  f.rotation.x = -Math.PI / 2; f.position.y = 0.03; f.receiveShadow = true;
  g.add(flat(f));
  const white = mat('#ffffff');
  for (const sx of [-1, 1]) {
    const gx = sx * (w / 2 - 0.4);
    for (const z of [-1.6, 1.6]) mesh(cyl(0.08, 0.08, 1.6, 8), white, gx, 0.8, z, g);
    mesh(cyl(0.08, 0.08, 3.3, 8), white, gx, 1.6, 0, g).rotation.x = Math.PI / 2;
    const net = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 3.2), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, roughness: 1 }));
    net.position.set(gx + sx * 0.45, 0.78, 0); g.add(net);
  }
  // Alambrado (cerca) baixinho e arquibancada de madeira.
  for (let x = -w / 2; x <= w / 2; x += 2) for (const z of [-d / 2 - 0.8, d / 2 + 0.8]) mesh(cyl(0.05, 0.05, 1.4, 6), mat('#9aa3b2', { m: 0.6, r: 0.4 }), x, 0.7, z, g);
  for (let i = 0; i < 3; i++) mesh(rbox(8, 0.3, 0.8, 0.05), mat('#c98a4b'), 0, 0.3 + i * 0.4, -d / 2 - 2 - i * 0.8, g);
  return g;
}

function pond(rx, rz) {
  const g = new THREE.Group();
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 40), mat('#d8c9a3'));
  edge.scale.set(rx + 0.8, 1, rz + 0.8); edge.position.y = 0.04; g.add(flat(edge));
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 40), new THREE.MeshStandardMaterial({ color: '#3f9be0', roughness: 0.08, metalness: 0.15 }));
  water.scale.set(rx, 1, rz); water.position.y = 0.08; g.add(flat(water));
  for (let i = 0; i < 14; i++) {
    const a = rnd(0, Math.PI * 2);
    const r = mesh(new THREE.DodecahedronGeometry(rnd(0.3, 0.6)), mat('#9aa0aa', { flat: true }), Math.cos(a) * (rx + 0.7), 0.15, Math.sin(a) * (rz + 0.7), g);
    r.scale.y = 0.6;
  }
  for (let i = 0; i < 6; i++) { // vitórias-régias
    const a = rnd(0, Math.PI * 2), rr = rnd(0.3, 0.75);
    mesh(cyl(0.45, 0.45, 0.04, 12), mat('#3fa63f'), Math.cos(a) * rx * rr, 0.2, Math.sin(a) * rz * rr, g);
  }
  for (let i = 0; i < 12; i++) { // taboas
    const a = rnd(0, Math.PI * 2);
    const x = Math.cos(a) * (rx - 0.3), z = Math.sin(a) * (rz - 0.3);
    mesh(cyl(0.04, 0.04, 1.3, 5), mat('#4c8a3a'), x, 0.65, z, g);
    mesh(cyl(0.09, 0.09, 0.35, 6), mat('#7a4a2a'), x, 1.2, z, g);
  }
  // Píer de madeira.
  for (let i = 0; i < 5; i++) mesh(rbox(1.6, 0.12, 0.42, 0.03), mat('#b07a4a'), rx - 0.4, 0.3, -1 + i * 0.48, g);
  for (const z of [-1.1, 1.0]) for (const dx of [-0.7, 0.7]) mesh(cyl(0.08, 0.08, 0.7, 6), mat('#8a5a3a'), rx - 0.4 + dx, 0.15, z, g);
  return g;
}

function duck() {
  const g = new THREE.Group();
  mesh(sph(0.3, 10, 8), mat('#ffffff'), 0, 0.28, 0, g).scale.set(1, 0.75, 1.3);
  mesh(sph(0.17, 10, 8), mat('#ffffff'), 0, 0.55, 0.28, g);
  mesh(new THREE.ConeGeometry(0.07, 0.2, 6), mat('#ff9a2a'), 0, 0.52, 0.48, g).rotation.x = Math.PI / 2;
  mesh(sph(0.03, 6, 6), mat('#1d2b4f'), 0.08, 0.6, 0.38, g);
  mesh(sph(0.03, 6, 6), mat('#1d2b4f'), -0.08, 0.6, 0.38, g);
  return g;
}

function playground() {
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 10), mat('#f0dca8'));
  sand.position.y = 0.04; g.add(flat(sand));
  // Escorregador.
  const red = mat('#e8473c'), yel = mat('#ffd23d'), blue = mat('#2f7bea');
  for (const x of [-4.6, -3.6]) for (const z of [-3.4, -2.6]) mesh(cyl(0.06, 0.06, 2.2, 8), blue, x, 1.1, z, g);
  mesh(rbox(1.2, 0.12, 1, 0.03), yel, -4.1, 2.1, -3, g);
  const sl = mesh(rbox(0.9, 0.08, 3.2, 0.03), red, -4.1, 1.2, -1.1, g);
  sl.rotation.x = -0.6;
  for (let i = 0; i < 5; i++) mesh(rbox(0.9, 0.06, 0.08, 0.02), yel, -4.1, 0.35 + i * 0.38, -3.55, g);
  // Gangorra (base fixa).
  mesh(rbox(0.3, 0.5, 0.3, 0.05), blue, 3.5, 0.25, 2.5, g);
  // Estrutura do balanço (os assentos se mexem, ficam fora daqui).
  for (const x of [-0.8, 3.2]) {
    const l1 = mesh(cyl(0.07, 0.07, 3, 8), yel, x, 1.4, -2.7, g); l1.rotation.x = 0.25;
    const l2 = mesh(cyl(0.07, 0.07, 3, 8), yel, x, 1.4, -3.9, g); l2.rotation.x = -0.25;
  }
  mesh(cyl(0.07, 0.07, 4.2, 8), red, 1.2, 2.85, -3.3, g).rotation.z = Math.PI / 2;
  return g;
}

function trafficPole() {
  const g = new THREE.Group();
  const metal = mat('#2b3242', { m: 0.5, r: 0.4 });
  mesh(cyl(0.09, 0.11, 3.6, 8), metal, 0, 1.8, 0, g);
  mesh(rbox(0.5, 1.3, 0.45, 0.06), metal, 0, 3.6, 0.1, g);
  return g;
}

function nitroSign() {
  const g = new THREE.Group();
  const R = 16, sx = 1.5, sy = 0.55, sz = 0.75, y0 = -1.5;
  const hill = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 14), mat('#68bd4b', { flat: true }));
  hill.scale.set(sx, sy, sz); hill.position.y = y0; hill.receiveShadow = true; hill.castShadow = true;
  g.add(hill);
  const hAt = (x, z) => Math.sqrt(Math.max(0, 1 - (x / (R * sx)) ** 2 - (z / (R * sz)) ** 2)) * R * sy + y0;
  for (const [x, z, s] of [[-16, -2, 1.3], [-12, -6, 1.1], [14, -4, 1.4], [18, 0, 1.0], [-19, 3, 1.2], [9, -8, 1.2]]) tree(g, x, z, s).position.y = hAt(x, z) - 0.2;
  const letters = 'NITRO';
  [...letters].forEach((ch, i) => {
    const tex = textTexture(ch, { w: 256, h: 256, bg: null, fg: '#ffffff', size: 230, stroke: '#1d2b4f' });
    const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25, side: THREE.DoubleSide, alphaTest: 0.4 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), m);
    const x = -10 + i * 5, z = 5.5;
    const base = hAt(x, z);
    p.position.set(x, base + 2.6, z);
    p.rotation.x = -0.18;
    p.castShadow = true;
    g.add(p);
    for (const dx of [-1, 1]) mesh(cyl(0.08, 0.08, 1.6, 6), mat('#9aa3b2'), x + dx, base + 0.6, z - 0.2, g);
  });
  return g;
}

function parkedCar(g, x, z, rot) {
  const c = buildCar({ type: pick(['hatch', 'sedan', 'pickup', 'van']), color: pick(['vermelho', 'azul', 'branco', 'amarelo', 'verde', 'preto']), wheels: 'padrao', spoiler: 'nenhum', neon: 'nenhum', decal: 'nenhum' }, { driver: false });
  c.position.set(x, 0, z);
  c.rotation.y = rot;
  g.add(c);
}

function road(g, x, z, w, d, rot = 0) {
  const r = new THREE.Mesh(box(w, 0.25, d), mat('#4a4f5c', { r: 0.95 }));
  r.position.set(x, 0, z); r.rotation.y = rot; r.castShadow = false; r.receiveShadow = true;
  g.add(r);
}

function zebra(g, x0, z0, along, n, len) {
  // Faixa de pedestres: n listras ao longo de 'along' ('x' ou 'z').
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(box(along === 'x' ? 0.55 : len, 0.02, along === 'x' ? len : 0.55), mat('#ffffff'));
    s.position.set(x0 + (along === 'x' ? i * 1.1 : 0), 0.14, z0 + (along === 'z' ? i * 1.1 : 0));
    g.add(flat(s));
  }
}

// ---------------- a cidade ----------------
export class City {
  constructor(scene, { lotD, maxW, track }) {
    this.scene = scene;
    this.D = lotD;
    this.maxW = maxW;
    this.track = track;
    this.t = 0;
    this.anims = [];
    this.people = [];
  }

  // Áreas reservadas (lote, terrenos à venda, pista, ruas) onde não nasce árvore.
  blocked(x, z) {
    const D = this.D, tp = this.track;
    if (x > -3 && x < this.maxW + 3 && z > -2.5 && z < D + 1.5) return true;
    if (x > tp.cx - tp.L - tp.R - 9 && x < tp.cx + tp.L + tp.R + 9 && z > tp.cz - tp.R - 14 && z < tp.cz + tp.R + 6) return true;
    if (z > D - 1 && z < D + 12.6) return true; // avenida e calçadas
    for (const [x0, z0, x1, z1] of this.zones) if (x > x0 && x < x1 && z > z0 && z < z1) return true;
    return false;
  }

  build() {
    const D = this.D;
    const S = new THREE.Group(); // parado (vai ser juntado)
    const Dyn = new THREE.Group(); // anima
    this.zones = [];
    const zone = (x0, z0, x1, z1) => this.zones.push([x0, z0, x1, z1]);

    // Ruas transversais (decorativas) com faixa de pedestres na avenida.
    const C1 = -20, C2 = 66;
    road(S, C1, D + 12 + 22, 7, 44);
    road(S, C2, D + 12 + 22, 7, 44);
    road(S, C2, D - 31, 7, 62);
    zone(C1 - 4, D + 11, C1 + 4, D + 60); zone(C2 - 4, D - 64, C2 + 4, D + 60);
    zebra(S, C1 - 2.8, D + 2.6, 'x', 6, 6.6);
    zebra(S, C2 - 2.8, D + 2.6, 'x', 6, 6.6);
    for (let z = D + 15; z < D + 56; z += 4) { const m = new THREE.Mesh(box(0.16, 0.02, 2), mat('#ffd23d')); m.position.set(C1, 0.14, z); S.add(flat(m)); const m2 = m.clone(); m2.position.x = C2; S.add(m2); }
    for (let z = D - 60; z < D - 2; z += 4) { const m = new THREE.Mesh(box(0.16, 0.02, 2), mat('#ffd23d')); m.position.set(C2, 0.14, z); S.add(flat(m)); }
    // Semáforo na esquina (as luzes trocam).
    const tl = trafficPole(); tl.position.set(C2 - 4.2, 0, D + 0.4); S.add(tl);
    this.tlights = ['#e8473c', '#ffd23d', '#46c35a'].map((c, i) => {
      const m = new THREE.MeshStandardMaterial({ color: '#222630', emissive: c, emissiveIntensity: 0.05, roughness: 0.4 });
      const l = new THREE.Mesh(sph(0.13, 10, 8), m);
      l.position.set(C2 - 4.2, 4.0 - i * 0.38, D + 0.75);
      Dyn.add(l);
      return m;
    });
    const tl2 = trafficPole(); tl2.position.set(C2 + 4.2, 0, D + 11.6); tl2.rotation.y = Math.PI; S.add(tl2);
    this.tlights2 = ['#e8473c', '#ffd23d', '#46c35a'].map((c, i) => {
      const m = new THREE.MeshStandardMaterial({ color: '#222630', emissive: c, emissiveIntensity: 0.05, roughness: 0.4 });
      const l = new THREE.Mesh(sph(0.13, 10, 8), m);
      l.position.set(C2 + 4.2, 4.0 - i * 0.38, D + 11.25);
      Dyn.add(l);
      return m;
    });

    // ===== PRAÇA (do outro lado da avenida, de frente para a oficina) =====
    const PX = 18, PZ = D + 25, PW = 26, PD = 22;
    zone(PX - PW / 2 - 1, D + 12, PX + PW / 2 + 1, PZ + PD / 2 + 1);
    const plaza = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.18, PD), texMat(waveTexture([PW / 6, PD / 6])));
    plaza.position.set(PX, 0.02, PZ); plaza.castShadow = false; plaza.receiveShadow = true; S.add(plaza);
    // Canteiros de grama nos quatro cantos.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const gx = PX + sx * 7.8, gz = PZ + sz * 6.4;
      const gr = new THREE.Mesh(rbox(8.2, 0.3, 6.2, 0.1), mat('#6cc04f'));
      gr.position.set(gx, 0.12, gz); gr.castShadow = false; S.add(gr);
      tree(S, gx + sx * 2.2, gz + sz * 1.6, rnd(1.1, 1.4));
      flowerBed(S, gx - sx * 1.6, gz - sz * 1.2, 0.9);
      bush(S, gx + sx * 2.8, gz - sz * 1.4);
      bush(S, gx - sx * 2.6, gz + sz * 2, 0.8);
    }
    // Chafariz no centro.
    const fb = fountainBase(); fb.position.set(PX, 0, PZ); S.add(fb);
    this.fountain = { x: PX, z: PZ, drops: [] };
    const dropM = new THREE.MeshStandardMaterial({ color: '#bfe8ff', emissive: '#7fd0ff', emissiveIntensity: 0.25, transparent: true, opacity: 0.85, roughness: 0.1 });
    for (let i = 0; i < 26; i++) {
      const d = new THREE.Mesh(sph(0.09, 6, 5), dropM);
      d.castShadow = false;
      Dyn.add(d);
      this.fountain.drops.push({ m: d, t: Math.random(), a: (i / 26) * Math.PI * 2, top: i % 2 });
    }
    this.ripples = [0, 1, 2].map((i) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: '#e8f8ff', transparent: true, opacity: 0.6 }));
      r.rotation.x = Math.PI / 2; r.position.set(PX, 0.72, PZ); Dyn.add(r);
      return { m: r, t: i / 3 };
    });
    // Coreto, bancos, postes, banca, pipoqueiro e sorveteiro.
    const co = coreto(); co.position.set(PX + 8.5, 0.1, PZ + 6.3); co.rotation.y = -0.3; S.add(co);
    for (const [bx, bz, r] of [[PX - 3.6, PZ, Math.PI / 2], [PX + 3.6, PZ, -Math.PI / 2], [PX, PZ - 3.6, 0], [PX, PZ + 3.6, Math.PI], [PX - 6, PZ - 9.4, 0], [PX + 6, PZ - 9.4, 0], [PX - 11.6, PZ, Math.PI / 2]]) bench(S, bx, bz, r);
    for (const [lx, lz] of [[PX - 12.4, PZ - 10.4], [PX + 12.4, PZ - 10.4], [PX - 12.4, PZ + 10.4], [PX + 12.4, PZ + 10.4], [PX - 4, PZ - 4], [PX + 4, PZ + 4], [PX - 4, PZ + 4], [PX + 4, PZ - 4]]) lampPost(S, lx, lz);
    const ns = newsstand(); ns.position.set(PX - 9.5, 0, PZ - 8.8); ns.rotation.y = 0.2; S.add(ns);
    const pc = cart('#e8473c', '#e8473c', 'PIPOCA'); pc.position.set(PX + 5.5, 0, PZ - 8.6); pc.rotation.y = -0.2; S.add(pc);
    const ic = cart('#ff9fd4', '#ff6fb5', 'SORVETE'); ic.position.set(PX - 5.4, 0, PZ + 8.8); ic.rotation.y = Math.PI + 0.3; S.add(ic);

    // ===== Lojinhas ao lado da praça =====
    const shops = [
      ['SORVETERIA', '#ffd6e8', '#ff6fb5', '#ff6fb5'],
      ['FARMÁCIA', '#e9ffef', '#46c35a', '#2f8f1c'],
      ['PASTELARIA', '#fff4c2', '#ff8a2a', '#e8473c'],
      ['PADARIA', '#ffe9d6', '#c98a4b', '#8a5a3a'],
    ];
    shops.forEach(([n, wall, awn, sbg], i) => {
      const sh = shop(n, wall, awn, sbg, 6, 5, 3.4 + (i % 2) * 0.6);
      sh.position.set(36 + i * 6.6, 0, D + 16);
      S.add(sh);
    });
    // Calçadão na frente das lojas (a frente fica virada para quem joga).
    const walk = new THREE.Mesh(new THREE.BoxGeometry(28, 0.14, 4.5), texMat(pavers([10, 2])));
    walk.position.set(46, 0.02, D + 20.8); walk.castShadow = false; walk.receiveShadow = true; S.add(walk);
    zone(32, D + 12, 62, D + 24);
    // Mesinhas com guarda-sol na frente da pastelaria e da sorveteria.
    for (const x of [35.5, 49, 52.5]) {
      mesh(cyl(0.5, 0.5, 0.06, 12), mat('#ffffff'), x, 0.85, D + 21, S);
      mesh(cyl(0.05, 0.05, 0.85, 6), mat('#9aa3b2'), x, 0.42, D + 21, S);
      const um = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 8), texMat(stripes(x < 40 ? '#ff6fb5' : '#ffd23d', '#ffffff')));
      um.position.set(x, 2.4, D + 21); um.castShadow = true; S.add(um);
      mesh(cyl(0.04, 0.04, 1.6, 6), mat('#ffffff'), x, 1.6, D + 21, S);
      for (const dx of [-0.8, 0.8]) mesh(rbox(0.45, 0.5, 0.45, 0.06), mat('#e8473c'), x + dx, 0.25, D + 21, S);
    }
    for (const x of [33, 59]) lampPost(S, x, D + 22.6);

    // ===== Prédio e igrejinha (depois da rua transversal da direita) =====
    const ap = apartments(); ap.position.set(C2 + 9, 0, D + 17); S.add(ap);
    const ch = church(); ch.position.set(C2 + 21, 0, D + 18); S.add(ch);
    const yard = new THREE.Mesh(new THREE.BoxGeometry(9, 0.14, 4), texMat(pavers([3, 1.4], '#e9e3d4', '#ddd5c2')));
    yard.position.set(C2 + 21, 0.02, D + 26); yard.castShadow = false; S.add(yard);
    zone(C2 + 4, D + 12, C2 + 28, D + 28);
    for (const x of [C2 + 15, C2 + 27]) tree(S, x, D + 14.5, 1.2);

    // ===== Casinhas (entre a rua da esquerda e a praça) =====
    const hc = [['#ffe0b3', '#e8473c'], ['#d6ecff', '#2f7bea'], ['#e9ffd6', '#8a5cf0'], ['#ffd6e8', '#ff8a2a']];
    hc.forEach(([a, b], i) => {
      const h = house(a, b);
      h.position.set(-13 + i * 6.2, 0, D + 15.4);
      if (i < 3) S.add(h);
    });
    zone(-16.5, D + 12, 4.5, D + 21);
    // Segunda fileira de casas, mais atrás.
    for (let i = 0; i < 9; i++) {
      const [a, b] = hc[i % hc.length];
      const h = house(a, b, false);
      h.position.set(-12 + i * 8.6, 0, D + 42 + (i % 2) * 1.5);
      if (h.position.x > PX - PW / 2 - 3 && h.position.x < PX + PW / 2 + 3) continue;
      S.add(h);
      zone(h.position.x - 3, D + 38, h.position.x + 3, D + 46);
    }

    // ===== Campinho de futebol (depois da rua da esquerda) =====
    const FX = -42, FZ = D + 26;
    const sf = soccerField(22, 13); sf.position.set(FX, 0, FZ); S.add(sf);
    zone(FX - 13, D + 14, FX + 13, FZ + 10);
    this.ball = new THREE.Mesh(sph(0.22, 12, 10), mat('#ffffff'));
    Dyn.add(this.ball);
    this.kids = [];
    const shirts = ['#e8473c', '#e8473c', '#2f7bea', '#2f7bea'];
    shirts.forEach((sh, i) => {
      const p = buildPerson({ shirt: sh, pants: '#ffffff', skin: pick(['#f1c09a', '#c98a5e', '#8a5a3a', '#f6d2b4']), hair: pick(['#3a2a1e', '#1f1f24', '#c98a2a']) });
      p.scale.setScalar(0.72);
      Dyn.add(p);
      const home = [FX + (i < 2 ? -5 : 5) + rnd(-2, 2), FZ + rnd(-4, 4)];
      p.position.set(home[0], 0.05, home[1]);
      this.kids.push({ p, home, ph: rnd(0, 6) });
    });
    this.field = { x: FX, z: FZ, ballT: 0, from: [FX, FZ], to: [FX, FZ], kick: 0 };

    // ===== Parque com lago e parquinho (à esquerda da oficina) =====
    const LX = -24, LZ = 2;
    const pd = pond(8, 5.5); pd.position.set(LX, 0, LZ); S.add(pd);
    zone(LX - 11, LZ - 8, LX + 11, LZ + 8);
    const path = new THREE.Mesh(new THREE.RingGeometry(9.7, 11.3, 48, 1), texMat(pavers([16, 2]), { side: THREE.DoubleSide }));
    path.rotation.x = -Math.PI / 2; path.scale.set(1, 0.74, 1); path.position.set(LX, 0.05, LZ); path.castShadow = false; path.receiveShadow = true; S.add(path);
    zone(LX - 12.5, LZ - 9, LX + 12.5, LZ + 9);
    for (const [bx, bz, r] of [[LX, LZ + 9.2, Math.PI], [LX - 8, LZ + 6.8, Math.PI * 0.8], [LX + 8, LZ - 6.8, 0.2]]) bench(S, bx, bz, r);
    for (const [lx, lz] of [[LX - 11, LZ], [LX + 11, LZ], [LX, LZ - 8.6], [LX, LZ + 8.6]]) lampPost(S, lx, lz);
    this.ducks = [0, 1, 2, 3].map((i) => { const d = duck(); d.scale.setScalar(i === 0 ? 1.2 : 0.7); Dyn.add(d); return { d, a: i * 0.35, r: 0.55 }; });
    this.pondPos = { x: LX, z: LZ, rx: 8, rz: 5.5 };
    const PGX = -24, PGZ = -16;
    const pg = playground(); pg.position.set(PGX, 0, PGZ); S.add(pg);
    zone(PGX - 8, PGZ - 6, PGX + 8, PGZ + 6);
    this.swings = [0, 1].map((i) => {
      const sw = new THREE.Group();
      sw.position.set(PGX + 0.2 + i * 2, 2.85, PGZ - 3.3);
      mesh(cyl(0.02, 0.02, 1.9, 4), mat('#5a6070'), -0.3, -0.95, 0, sw);
      mesh(cyl(0.02, 0.02, 1.9, 4), mat('#5a6070'), 0.3, -0.95, 0, sw);
      mesh(rbox(0.8, 0.08, 0.35, 0.03), mat(i ? '#2f7bea' : '#e8473c'), 0, -1.9, 0, sw);
      const kid = buildPerson({ shirt: i ? '#ffd23d' : '#46c35a', skin: pick(['#f1c09a', '#c98a5e']), hair: '#3a2a1e' });
      kid.scale.setScalar(0.6); kid.position.set(0, -2.15, -0.05);
      kid.userData.legL.rotation.x = kid.userData.legR.rotation.x = -1.3;
      kid.userData.armL.rotation.x = kid.userData.armR.rotation.x = -2.6;
      sw.add(kid);
      Dyn.add(sw);
      return { sw, ph: i * 1.7 };
    });
    const saw = new THREE.Group();
    saw.position.set(PGX + 3.5, 0.55, PGZ + 2.5);
    mesh(rbox(3.2, 0.12, 0.35, 0.04), mat('#ff8a2a'), 0, 0, 0, saw);
    for (const x of [-1.4, 1.4]) mesh(rbox(0.1, 0.4, 0.4, 0.03), mat('#1d2b4f'), x, 0.2, 0, saw);
    Dyn.add(saw);
    this.seesaw = saw;
    for (let i = 0; i < 14; i++) {
      const a = rnd(0, Math.PI * 2), r = rnd(13, 17);
      const x = LX + Math.cos(a) * r, z = LZ + Math.sin(a) * r * 0.8;
      if (x > -4 || this.blocked(x, z)) continue;
      tree(S, x, z, rnd(1, 1.5));
    }

    // ===== Mercadinho, ponto de ônibus e outdoor (à direita, depois da rua transversal) =====
    const mk = market(); mk.position.set(C2 + 12, 0, D - 6); mk.rotation.y = 0; S.add(mk);
    zone(C2 + 4, D - 14, C2 + 22, D);
    const pk = new THREE.Mesh(new THREE.BoxGeometry(14, 0.06, 7), mat('#5d6270', { r: 0.95 }));
    pk.position.set(C2 + 12, 0.03, D - 15); pk.castShadow = false; S.add(pk);
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(box(0.12, 0.02, 3), mat('#ffffff')); m.position.set(C2 + 6.5 + i * 2.8, 0.07, D - 15); S.add(flat(m)); }
    parkedCar(S, C2 + 7.9, D - 15, 0);
    parkedCar(S, C2 + 13.5, D - 15, Math.PI);
    zone(C2 + 4, D - 19, C2 + 20, D - 11);
    const bs = busStop(); bs.position.set(C2 + 26, 0, D + 0.6); S.add(bs);
    const bb = billboard(); bb.position.set(C2 + 34, 0, D - 3); bb.rotation.y = 0.15; S.add(bb);
    zone(C2 + 22, D - 6, C2 + 40, D);
    // Gente esperando o ônibus.
    for (let i = 0; i < 3; i++) {
      const p = buildPerson({ shirt: pick(['#8a5cf0', '#ff8a2a', '#46c35a', '#ffffff']), pants: pick(['#26344f', '#3a3d48']), skin: pick(['#f1c09a', '#c98a5e', '#8a5a3a']), hair: pick(['#3a2a1e', '#1f1f24']) });
      p.scale.setScalar(0.85);
      p.position.set(C2 + 24.6 + i * 1.2, 0.12, D + 1.1);
      S.add(p);
    }
    // Carros estacionados nas ruas transversais.
    parkedCar(S, C1 - 2.4, D + 30, 0);
    parkedCar(S, C1 + 2.4, D + 40, Math.PI);
    parkedCar(S, C2 - 2.4, D - 22, 0);
    parkedCar(S, C2 + 2.4, D + 34, Math.PI);

    // ===== Letreiro NITRO no morro atrás da pista =====
    const ns2 = nitroSign(); ns2.position.set(this.track.cx, 0, this.track.cz - this.track.R - 16); S.add(ns2);

    // ===== Gente passeando na praça e sentada nos bancos =====
    const pals = [['#e8473c', '#26344f'], ['#2f7bea', '#3a3d48'], ['#ffc93c', '#6b4a2c'], ['#ff6fb5', '#26344f'], ['#46c35a', '#3a3d48'], ['#ffffff', '#2f7bea']];
    for (let i = 0; i < 4; i++) {
      const [sh, pa] = pals[i];
      const p = buildPerson({ shirt: sh, pants: pa, skin: pick(['#f1c09a', '#c98a5e', '#8a5a3a', '#f6d2b4']), hair: pick(['#3a2a1e', '#1f1f24', '#c98a2a', '#e8e0d0']), hat: i === 2 ? '#ffffff' : null });
      p.scale.setScalar(0.85);
      Dyn.add(p);
      this.people.push({ p, mode: 'walk', loop: { cx: PX, cz: PZ, r: 6.2 + (i % 2) * 2.6 }, a: rnd(0, 6), v: (i % 2 ? 1 : -1) * rnd(0.12, 0.18), ph: rnd(0, 6) });
    }
    for (const [bx, bz, r] of [[PX - 3.6, PZ, Math.PI / 2], [PX, PZ + 3.6, Math.PI], [PX - 6, PZ - 9.4, 0]]) {
      const p = buildPerson({ shirt: pick(['#8a5cf0', '#ff8a2a', '#2f7bea']), pants: '#26344f', skin: pick(['#f1c09a', '#c98a5e', '#8a5a3a']), hair: pick(['#e8e0d0', '#3a2a1e']) });
      p.scale.setScalar(0.85);
      p.position.set(bx, -0.05, bz);
      p.rotation.y = r;
      p.userData.legL.rotation.x = p.userData.legR.rotation.x = -1.45;
      p.translateZ(0.05);
      S.add(p);
    }
    // Pombinhos ciscando perto do chafariz.
    this.pigeons = [];
    for (let i = 0; i < 6; i++) {
      const pg2 = new THREE.Group();
      mesh(sph(0.14, 8, 6), mat('#8a93a5'), 0, 0.14, 0, pg2).scale.set(1, 0.8, 1.3);
      mesh(sph(0.08, 8, 6), mat('#5a6070'), 0, 0.26, 0.14, pg2);
      const a = rnd(0, Math.PI * 2), r = rnd(3.6, 5);
      pg2.position.set(PX + Math.cos(a) * r, 0.1, PZ + Math.sin(a) * r);
      pg2.rotation.y = rnd(0, 6);
      Dyn.add(pg2);
      this.pigeons.push({ g: pg2, ph: rnd(0, 6) });
    }

    // ===== Árvores e arbustos espalhados no resto =====
    let n = 0, tries = 0;
    while (n < 130 && tries < 3000) {
      tries++;
      const x = rnd(-62, this.maxW + 62), z = rnd(-52, D + 60);
      if (this.blocked(x, z)) continue;
      if (Math.random() < 0.25) bush(S, x, z, rnd(0.8, 1.3));
      else tree(S, x, z, rnd(0.9, 1.7));
      n++;
    }

    // Passarinhos atravessando o céu de vez em quando.
    this.birds = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Group();
      const wingM = mat('#1d2b4f');
      const l = mesh(box(0.7, 0.05, 0.22), wingM, -0.35, 0, 0, b); const r = mesh(box(0.7, 0.05, 0.22), wingM, 0.35, 0, 0, b);
      l.castShadow = r.castShadow = false;
      b.userData = { l, r };
      b.position.set((i % 2 ? -1 : 1) * Math.ceil(i / 2) * 1.2, 0, -Math.ceil(i / 2) * 1.4);
      this.birds.add(b);
    }
    this.birds.visible = false;
    Dyn.add(this.birds);
    this.birdT = 6;

    this.static = bake(S);
    this.dyn = Dyn;
    this.scene.add(this.static, this.dyn);
  }

  update(dt, night = 0) {
    if (!this.dyn) return;
    this.t += dt;
    const T = this.t;
    // Chafariz: gotas em arco caindo na bacia + ondinhas.
    const f = this.fountain;
    for (const d of f.drops) {
      d.t = (d.t + dt * 0.9) % 1;
      const a = d.a + T * 0.15;
      const r = d.top ? 0.2 + d.t * 0.9 : 0.6 + d.t * 1.9;
      const h0 = d.top ? 3.05 : 2.55, up = d.top ? 1.1 : 0.7;
      d.m.position.set(f.x + Math.cos(a) * r, h0 + up * 4 * d.t * (1 - d.t) - (d.top ? 0.6 : 1.9) * d.t * d.t, f.z + Math.sin(a) * r);
    }
    for (const rp of this.ripples) {
      rp.t = (rp.t + dt * 0.35) % 1;
      rp.m.scale.setScalar(0.6 + rp.t * 2);
      rp.m.material.opacity = 0.55 * (1 - rp.t);
    }
    // Semáforos: verde, amarelo, vermelho (os dois desencontrados).
    const cyc = (T % 14);
    const st = cyc < 6 ? 2 : cyc < 8 ? 1 : 0;
    this.tlights.forEach((m, i) => { m.emissiveIntensity = i === st ? 2.2 : 0.05; });
    const st2 = st === 2 ? 0 : st === 0 ? 2 : 0;
    this.tlights2.forEach((m, i) => { m.emissiveIntensity = i === st2 ? 2.2 : 0.05; });
    // Patinhos nadando em volta do lago.
    const pp = this.pondPos;
    this.ducks.forEach((dk, i) => {
      const a = T * 0.18 + dk.a;
      const x = pp.x + Math.cos(a) * pp.rx * dk.r, z = pp.z + Math.sin(a) * pp.rz * dk.r;
      dk.d.position.set(x, 0.12 + Math.sin(T * 3 + i) * 0.03, z);
      dk.d.rotation.y = Math.atan2(-Math.sin(a) * pp.rx, Math.cos(a) * pp.rz);
    });
    // Balanço e gangorra.
    for (const s of this.swings) s.sw.rotation.x = Math.sin(T * 2.2 + s.ph) * 0.55;
    this.seesaw.rotation.z = Math.sin(T * 1.6) * 0.22;
    // Futebol: a bola vai de um menino para outro.
    const fd = this.field;
    fd.ballT += dt / 1.2;
    if (fd.ballT >= 1) {
      fd.ballT = 0;
      fd.from = fd.to;
      const k = this.kids[Math.floor(Math.random() * this.kids.length)];
      fd.to = [k.p.position.x + 0.3, k.p.position.z + 0.3];
      fd.target = k;
    }
    const bt = fd.ballT;
    this.ball.position.set(fd.from[0] + (fd.to[0] - fd.from[0]) * bt, 0.22 + Math.sin(bt * Math.PI) * 1.4, fd.from[1] + (fd.to[1] - fd.from[1]) * bt);
    this.ball.rotation.x += dt * 8;
    for (const k of this.kids) {
      const chasing = fd.target === k;
      const gx = chasing ? fd.to[0] - 0.4 : k.home[0] + Math.sin(T * 0.7 + k.ph) * 1.5;
      const gz = chasing ? fd.to[1] - 0.4 : k.home[1] + Math.cos(T * 0.5 + k.ph) * 1.2;
      const dx = gx - k.p.position.x, dz = gz - k.p.position.z, d = Math.hypot(dx, dz);
      const moving = d > 0.15;
      if (moving) {
        const s = Math.min(d, dt * (chasing ? 3.2 : 1.6));
        k.p.position.x += (dx / d) * s; k.p.position.z += (dz / d) * s;
        k.p.rotation.y = Math.atan2(dx, dz);
      } else k.p.lookAt(this.ball.position.x, k.p.position.y, this.ball.position.z);
      k.p.position.y = 0.05;
      animatePerson(k.p, T * 1.4 + k.ph, moving ? 'walk' : 'idle');
    }
    // Gente na praça.
    for (const pe of this.people) {
      if (pe.mode === 'walk') {
        pe.a += pe.v * dt;
        const x = pe.loop.cx + Math.cos(pe.a) * pe.loop.r, z = pe.loop.cz + Math.sin(pe.a) * pe.loop.r * 0.8;
        pe.p.position.set(x, 0.12, z);
        pe.p.rotation.y = Math.atan2(-Math.sin(pe.a) * Math.sign(pe.v), Math.cos(pe.a) * 0.8 * Math.sign(pe.v));
        animatePerson(pe.p, T * 0.9 + pe.ph, 'walk');
      } else if (pe.mode === 'idle') animatePerson(pe.p, T + pe.ph, 'idle');
      else pe.p.userData.body.position.y = Math.sin(T * 1.5 + pe.ph) * 0.01;
    }
    for (const pg of this.pigeons) {
      const peck = Math.sin(T * 6 + pg.ph) > 0.6;
      pg.g.children[1].position.y = peck ? 0.16 : 0.26;
      if (Math.random() < dt * 0.3) pg.g.rotation.y += rnd(-1, 1);
    }
    // Passarinhos.
    this.birdT -= dt;
    const B = this.birds;
    if (!B.visible && this.birdT <= 0 && night < 0.5) {
      B.visible = true;
      B.position.set(-70, 16, rnd(-20, this.D + 30));
      B.userData.v = rnd(7, 10);
    }
    if (B.visible) {
      B.position.x += B.userData.v * dt;
      B.rotation.y = Math.PI / 2;
      B.children.forEach((b, i) => { const fl = Math.sin(T * 12 + i) * 0.6; b.userData.l.rotation.z = fl; b.userData.r.rotation.z = -fl; });
      if (B.position.x > this.maxW + 80) { B.visible = false; this.birdT = rnd(15, 35); }
    }
  }
}
