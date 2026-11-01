// Cena 3D: câmera isométrica, terreno, rua, construções, carros e efeitos.
import * as THREE from 'three';
import { TILE, GRID_W, GRID_H, BUILDINGS } from './data.js';
import { buildCar, buildBuilding, buildTree, buildHouse, mat, mesh, rbox, sph, box, ghostify } from './models.js';
import { laneTiles, canPlace } from './logic.js';

const LOT_W = GRID_W * TILE;
const LOT_D = GRID_H * TILE;
const QUEUE_Z = LOT_D + 3.2; // faixa de espera, colada na calçada
const PASS_Z = LOT_D + 7.4; // faixa de passagem
const SLOT_X = [5, 10.5, 16, 21.5, 27];
const CAM_DIR = new THREE.Vector3(1, 1.25, 1).normalize();

export const lerpAngle = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
const easeOutBack = (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;

export function tileCenter(type, x, z) {
  const d = BUILDINGS[type];
  return new THREE.Vector3((x + d.w / 2) * TILE, 0, (z + d.d / 2) * TILE);
}

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#8fd3f2');
    this.target = new THREE.Vector3(LOT_W / 2 - 1.5, 0, LOT_D / 2 - 1.5);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
    this.viewH = 30;
    this.zoom = 1;
    this.zoomTarget = 1;
    this.focusTween = null;

    const hemi = new THREE.HemisphereLight('#d6eeff', '#8a7a55', 1.25);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff0d6', 2.4);
    sun.position.set(LOT_W / 2 - 22, 40, LOT_D / 2 - 6);
    sun.target.position.set(LOT_W / 2, 0, LOT_D / 2 + 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -34; sc.right = 34; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 120;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    this.scene.add(sun, sun.target);

    this.buildViews = new Map();
    this.carViews = new Map();
    this.leaving = [];
    this.particles = [];
    this.time = 0;
    this.lanesGroup = new THREE.Group();
    this.scene.add(this.lanesGroup);
    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.ghost = null;

    this.buildTerrain();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  // ---------- terreno e cenário ----------
  buildTerrain() {
    const S = this.scene;
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat('#7ccb5b', { r: 1 }));
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(LOT_W / 2, -0.02, LOT_D / 2);
    grass.receiveShadow = true;
    S.add(grass);

    // Piso do terreno com quadriculado discreto.
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#d9dde3'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#c4c9d1'; g.lineWidth = 4; g.strokeRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(GRID_W, GRID_H);
    const lot = new THREE.Mesh(new THREE.BoxGeometry(LOT_W, 0.2, LOT_D), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    lot.position.set(LOT_W / 2, -0.08, LOT_D / 2);
    lot.receiveShadow = true;
    S.add(lot);
    const curb = mat('#b8bec8');
    mesh(box(LOT_W + 0.6, 0.35, 0.3), curb, LOT_W / 2, 0.05, -0.15, S);
    mesh(box(0.3, 0.35, LOT_D), curb, -0.15, 0.05, LOT_D / 2, S);
    mesh(box(0.3, 0.35, LOT_D), curb, LOT_W + 0.15, 0.05, LOT_D / 2, S);

    // Calçada e rua.
    const side = new THREE.Mesh(new THREE.BoxGeometry(160, 0.24, 1.6), mat('#e4e1da'));
    side.position.set(LOT_W / 2, 0.0, LOT_D + 0.8);
    side.receiveShadow = true;
    S.add(side);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(160, 8.6), mat('#4a4f5c', { r: 0.95 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(LOT_W / 2, 0.01, LOT_D + 5.9);
    road.receiveShadow = true;
    S.add(road);
    for (let x = -70; x < 100; x += 4) mesh(box(2, 0.02, 0.22), mat('#ffffff'), x, 0.03, LOT_D + 5.5, S).castShadow = false;
    for (const i in SLOT_X) {
      const x = SLOT_X[i];
      for (const dx of [-2.6, 2.6]) mesh(box(0.12, 0.02, 2.8), mat('#e6e6e6'), x + dx, 0.03, QUEUE_Z, S).castShadow = false;
    }
    const side2 = new THREE.Mesh(new THREE.BoxGeometry(160, 0.24, 1.6), mat('#e4e1da'));
    side2.position.set(LOT_W / 2, 0, LOT_D + 11);
    side2.receiveShadow = true;
    S.add(side2);

    // Cerca viva atrás e nas laterais.
    const hedge = mat('#3fa63f', { flat: true });
    mesh(rbox(LOT_W + 2, 1.1, 1, 0.4), hedge, LOT_W / 2, 0.55, -1.0, S);
    mesh(rbox(1, 1.1, LOT_D + 1, 0.4), hedge, -1.0, 0.55, LOT_D / 2 - 0.5, S);
    mesh(rbox(1, 1.1, LOT_D + 1, 0.4), hedge, LOT_W + 1.0, 0.55, LOT_D / 2 - 0.5, S);

    // Árvores ao redor.
    const rnd = (a, b) => a + Math.random() * (b - a);
    const spots = [];
    for (let i = 0; i < 26; i++) spots.push([rnd(-14, LOT_W + 14), rnd(-14, -3)]);
    for (let i = 0; i < 12; i++) spots.push([rnd(-14, -3), rnd(-3, LOT_D + 1)]);
    for (let i = 0; i < 12; i++) spots.push([rnd(LOT_W + 3, LOT_W + 16), rnd(-3, LOT_D + 1)]);
    spots.forEach(([x, z], i) => { const t = buildTree(rnd(0.9, 1.5), i); t.position.set(x, 0, z); t.rotation.y = rnd(0, 6); S.add(t); });
    // Casas do outro lado da rua.
    const houses = [['#ffe0b3', '#e8473c'], ['#d6ecff', '#2f7bea'], ['#e9ffd6', '#8a5cf0'], ['#ffd6e8', '#ff8a2a'], ['#fff4c2', '#46c35a']];
    houses.forEach(([c1, c2], i) => {
      const h = buildHouse(c1, c2);
      h.position.set(-6 + i * 10, 0, LOT_D + 15.5);
      h.rotation.y = Math.PI;
      S.add(h);
      const t = buildTree(rnd(0.8, 1.2), i);
      t.position.set(-1 + i * 10, 0, LOT_D + 14.5);
      S.add(t);
    });
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.viewH = Math.min(46, Math.max(31, 34 / this.aspect));
    this.updateCamera();
  }

  updateCamera() {
    const h = this.viewH / this.zoom, w = h * this.aspect;
    const c = this.camera;
    c.left = -w / 2; c.right = w / 2; c.top = h / 2; c.bottom = -h / 2;
    c.position.copy(this.target).addScaledVector(CAM_DIR, 120);
    c.lookAt(this.target);
    c.updateProjectionMatrix();
  }

  // ---------- câmera ----------
  groundAt(sx, sy) {
    const ndc = new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.ground, p) ? p : null;
  }

  pan(fromX, fromY, toX, toY) {
    if (this.focusTween) return;
    const a = this.groundAt(fromX, fromY), b = this.groundAt(toX, toY);
    if (!a || !b) return;
    this.target.add(a.sub(b));
    this.clampTarget();
    this.updateCamera();
  }

  clampTarget() {
    this.target.x = Math.max(-6, Math.min(LOT_W + 6, this.target.x));
    this.target.z = Math.max(-2, Math.min(LOT_D + 10, this.target.z));
  }

  zoomBy(f) {
    if (this.focusTween) return;
    this.zoomTarget = Math.max(0.6, Math.min(2.6, this.zoomTarget * f));
  }

  focus(pos, zoom = 2.3, dur = 0.7) {
    this.saved = this.saved || { target: this.target.clone(), zoom: this.zoomTarget };
    // Desloca o alvo para o carro ficar na parte de cima da tela (o painel ocupa a de baixo).
    const t = pos.clone().add(new THREE.Vector3(1, 0, 1).normalize().multiplyScalar((this.viewH / zoom) * 0.17));
    this.focusTween = { from: this.target.clone(), to: t, z0: this.zoom, z1: zoom, t: 0, dur };
  }

  unfocus() {
    if (!this.saved) return;
    const s = this.saved;
    this.saved = null;
    this.focusTween = { from: this.target.clone(), to: s.target, z0: this.zoom, z1: s.zoom, t: 0, dur: 0.6, release: true };
  }

  toScreen(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, visible: p.z < 1 && p.x > -1.2 && p.x < 1.2 && p.y > -1.2 && p.y < 1.2 };
  }

  pick(sx, sy) {
    const ndc = new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const roots = [...this.buildViews.values()].map((v) => v.g).concat([...this.carViews.values()].map((v) => v.g));
    const hits = this.raycaster.intersectObjects(roots, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.pick) o = o.parent;
      if (o) return o.userData.pick;
    }
    return null;
  }

  tileAt(sx, sy, type) {
    const p = this.groundAt(sx, sy);
    if (!p) return null;
    const d = BUILDINGS[type];
    return { x: Math.round(p.x / TILE - d.w / 2), z: Math.round(p.z / TILE - d.d / 2) };
  }

  // ---------- construções ----------
  sync(state, popId = null) {
    const ids = new Set();
    for (const b of state.buildings) {
      ids.add(b.id);
      let v = this.buildViews.get(b.id);
      if (v && (v.level !== b.level || v.x !== b.x || v.z !== b.z)) {
        const pop = v.level !== b.level;
        this.scene.remove(v.g);
        this.buildViews.delete(b.id);
        v = null;
        if (pop) popId = b.id;
      }
      if (!v) {
        const g = buildBuilding(b.type, b.level);
        g.position.copy(tileCenter(b.type, b.x, b.z));
        g.userData.pick = { kind: 'building', id: b.id };
        this.scene.add(g);
        v = { g, type: b.type, level: b.level, x: b.x, z: b.z, pop: b.id === popId ? 0 : 1, lift: 0.3 };
        this.buildViews.set(b.id, v);
        if (b.id === popId) this.burst(g.position, '#e9dcc4', 22, 4, 0.9, 1.2);
        // Carro que já estava em serviço (ao carregar o jogo).
        if (b.job && !this.carViews.has(b.job.c.id)) {
          const cv = this.addCar(b.job.c, g.position.clone(), Math.PI);
          cv.atBay = b.id;
        }
      }
    }
    for (const [id, v] of this.buildViews) if (!ids.has(id)) { this.scene.remove(v.g); this.buildViews.delete(id); }
    this.drawLanes(state);
  }

  drawLanes(state) {
    this.lanesGroup.clear();
    const asphalt = mat('#5d6270', { r: 0.95 });
    const yellow = mat('#ffd23d');
    for (const b of state.buildings) {
      const d = BUILDINGS[b.type];
      if (!d.service) continue;
      const z0 = (b.z + d.d) * TILE, z1 = LOT_D + 1.6;
      const len = z1 - z0;
      if (len <= 0.1) continue;
      const cx = (b.x + d.w / 2) * TILE;
      const p = mesh(box(d.w * TILE - 0.5, 0.06, len), asphalt, cx, 0.03, z0 + len / 2, this.lanesGroup);
      p.castShadow = false;
      for (let z = z0 + 0.8; z < z1 - 0.5; z += 1.6) mesh(box(0.14, 0.07, 0.8), yellow, cx, 0.04, z, this.lanesGroup).castShadow = false;
    }
  }

  // ---------- modo construção ----------
  setGhost(state, type, x, z, moveId = null) {
    if (!this.ghost || this.ghost.type !== type) {
      this.clearGhost();
      const g = buildBuilding(type, 1);
      const d = BUILDINGS[type];
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(d.w * TILE - 0.1, d.d * TILE - 0.1), new THREE.MeshBasicMaterial({ color: '#6dff8a', transparent: true, opacity: 0.45, depthWrite: false }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.06;
      const holder = new THREE.Group();
      holder.add(g, pad);
      let lane = null;
      if (d.service) {
        lane = new THREE.Mesh(new THREE.PlaneGeometry(d.w * TILE - 0.5, 1), new THREE.MeshBasicMaterial({ color: '#ffd23d', transparent: true, opacity: 0.35, depthWrite: false }));
        lane.rotation.x = -Math.PI / 2;
        holder.add(lane);
      }
      this.scene.add(holder);
      this.ghost = { type, holder, model: g, pad, lane, ok: null };
    }
    const gh = this.ghost;
    const ok = canPlace(state, type, x, z, moveId);
    gh.x = x; gh.z = z;
    gh.holder.position.copy(tileCenter(type, x, z));
    if (gh.ok !== ok) {
      ghostify(gh.model, ok);
      gh.pad.material.color.set(ok ? '#6dff8a' : '#ff5a5a');
      gh.ok = ok;
    }
    if (gh.lane) {
      const d = BUILDINGS[type];
      const len = Math.max(0.1, (GRID_H - z - d.d) * TILE);
      gh.lane.scale.y = len;
      gh.lane.position.set(0, 0.07, (d.d * TILE) / 2 + len / 2);
      gh.lane.visible = len > 0.2;
    }
    this.showLaneHints(state, true);
    return ok;
  }

  showLaneHints(state, on) {
    if (this.hints) { this.scene.remove(this.hints); this.hints = null; }
    if (!on) return;
    this.hints = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color: '#ffd23d', transparent: true, opacity: 0.22, depthWrite: false });
    for (const t of laneTiles(state)) {
      const [x, z] = t.split(',').map(Number);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(TILE - 0.15, TILE - 0.15), m);
      p.rotation.x = -Math.PI / 2;
      p.position.set((x + 0.5) * TILE, 0.08, (z + 0.5) * TILE);
      this.hints.add(p);
    }
    this.scene.add(this.hints);
  }

  clearGhost() {
    if (this.ghost) this.scene.remove(this.ghost.holder);
    this.ghost = null;
    this.showLaneHints(null, false);
  }

  // ---------- carros ----------
  addCar(c, pos, heading) {
    const g = buildCar(c.car);
    g.position.copy(pos);
    g.rotation.y = heading;
    g.userData.pick = { kind: 'car', id: c.id };
    this.scene.add(g);
    const v = { g, id: c.id, path: [], speed: 11, heading, moving: false, wob: 0, onDone: null };
    this.carViews.set(c.id, v);
    return v;
  }

  carArrive(c) {
    const v = this.addCar(c, new THREE.Vector3(-34, 0, QUEUE_Z), Math.PI / 2);
    this.drive(v, [[SLOT_X[c.slot], QUEUE_Z]]);
  }

  carToBay(c, b, onArrive) {
    const v = this.carViews.get(c.id);
    if (!v) return;
    const p = tileCenter(b.type, b.x, b.z);
    const front = (b.z + BUILDINGS[b.type].d) * TILE;
    v.atBay = b.id;
    this.drive(v, [[p.x, QUEUE_Z], [p.x, front + 0.5], [p.x, p.z]], onArrive);
  }

  // Remove o carro do mundo "lógico" e o manda embora pela rua.
  carLeave(id, fromBay, happy = true) {
    const v = this.carViews.get(id);
    if (!v) return;
    this.carViews.delete(id);
    v.g.userData.pick = null;
    v.lift = 0;
    const x = v.g.position.x;
    const path = fromBay
      ? [[x, QUEUE_Z + 0.5, true], [x + 3, PASS_Z], [90, PASS_Z]]
      : [[x + 4, PASS_Z], [90, PASS_Z]];
    v.g.position.y = 0;
    this.drive(v, path, () => { this.scene.remove(v.g); this.leaving.splice(this.leaving.indexOf(v), 1); });
    v.speed = happy ? 14 : 16;
    this.leaving.push(v);
  }

  replaceCar(id, spec) {
    const v = this.carViews.get(id);
    if (!v) return;
    const g = buildCar(spec);
    g.position.copy(v.g.position);
    g.rotation.copy(v.g.rotation);
    g.userData.pick = v.g.userData.pick;
    this.scene.remove(v.g);
    this.scene.add(g);
    v.g = g;
    v.pop = 0;
  }

  drive(v, points, onDone) {
    v.path = points.map(([x, z, rev]) => ({ x, z, rev: !!rev }));
    v.onDone = onDone || null;
  }

  // ---------- efeitos ----------
  burst(pos, color, n, speed = 3, size = 0.25, up = 2) {
    const m = mat(color, { r: 0.8, e: color, ei: 0.25 });
    for (let i = 0; i < n; i++) {
      const p = mesh(sph(size, 6, 5), m, pos.x, (pos.y || 0) + 0.3, pos.z, this.scene);
      p.castShadow = false;
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({ m: p, vx: Math.cos(a) * s, vy: up * (0.5 + Math.random()), vz: Math.sin(a) * s, life: 0.7 + Math.random() * 0.5, max: 1.2, g: 6, s0: 0.6 + Math.random() * 0.8 });
    }
  }

  puff(pos, color, size = 0.3, vy = 1.5, life = 1.2) {
    const p = mesh(sph(size, 7, 6), mat(color, { r: 1 }), pos.x + (Math.random() - 0.5) * 0.4, pos.y, pos.z + (Math.random() - 0.5) * 0.4, this.scene);
    p.castShadow = false;
    this.particles.push({ m: p, vx: (Math.random() - 0.5) * 0.4, vy, vz: (Math.random() - 0.5) * 0.4, life, max: life, g: 0, grow: true, s0: 1 });
  }

  confetti(pos, n = 40) {
    const cols = ['#e8473c', '#ffc93c', '#2f7bea', '#46c35a', '#ff6fb5', '#8a5cf0'];
    for (let i = 0; i < n; i++) {
      const p = mesh(box(0.22, 0.04, 0.14), mat(cols[i % cols.length]), pos.x, pos.y + 1.5, pos.z, this.scene);
      p.castShadow = false;
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
      this.particles.push({ m: p, vx: Math.cos(a) * s, vy: 5 + Math.random() * 5, vz: Math.sin(a) * s, life: 1.6, max: 1.6, g: 9, spin: true, s0: 1 });
    }
  }

  // ---------- quadro a quadro ----------
  update(dt, state) {
    this.time += dt;
    const T = this.time;

    if (this.focusTween) {
      const f = this.focusTween;
      f.t = Math.min(1, f.t + dt / f.dur);
      const k = 1 - (1 - f.t) ** 3;
      this.target.lerpVectors(f.from, f.to, k);
      this.zoom = this.zoomTarget = f.z0 + (f.z1 - f.z0) * k;
      if (f.t >= 1) this.focusTween = null;
      this.updateCamera();
    } else if (Math.abs(this.zoom - this.zoomTarget) > 0.001) {
      this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * 12);
      this.updateCamera();
    }

    // Construções: animação de entrada e do serviço.
    const byId = new Map(state.buildings.map((b) => [b.id, b]));
    for (const [id, v] of this.buildViews) {
      const b = byId.get(id);
      if (v.pop < 1) {
        v.pop = Math.min(1, v.pop + dt * 2.2);
        const s = easeOutBack(v.pop);
        v.g.scale.set(s, s, s);
      }
      const u = v.g.userData;
      const job = b && b.job;
      const working = job && job.state === 'work';
      if (u.lift) {
        const want = job && job.state !== 'custom' ? 1.15 : 0.3;
        v.lift += (want - v.lift) * Math.min(1, dt * 3);
        u.lift.position.y = v.lift;
      }
      if (u.mech) {
        const mb = u.mech.userData;
        if (working) {
          mb.armR.rotation.x = -1.2 + Math.sin(T * 14) * 0.6;
          mb.armL.rotation.x = -0.6 + Math.sin(T * 14 + 1) * 0.3;
          mb.body.position.y = Math.abs(Math.sin(T * 7)) * 0.08;
        } else {
          mb.armR.rotation.x *= 0.9; mb.armL.rotation.x *= 0.9;
          mb.body.position.y = Math.sin(T * 2 + id) * 0.02;
        }
      }
      if (u.brushes) for (const br of u.brushes) br.rotation.y += dt * (working ? 14 : 0.3);
      if (u.disc) u.disc.rotation.y += dt * (job && job.state === 'custom' ? 0.6 : 0.15);
      if (u.frame) u.frame.visible = !(this.saved && job && job.state === 'custom');
      if (u.flag) u.flag.rotation.y = Math.sin(T * 3 + id) * 0.25;
      if (u.cup) u.cup.rotation.y += dt * 0.6;
      if (u.jet) { u.jet.scale.y = 1 + Math.sin(T * 6) * 0.25; if (Math.random() < dt * 6) this.puff(v.g.position.clone().setY(2.1), '#bfeaff', 0.12, 1.2, 0.6); }
      if (u.neonSign) u.neonSign.material.emissiveIntensity = 1.1 + (Math.sin(T * 9) > 0.92 ? -0.8 : 0) + Math.sin(T * 2) * 0.15;
      if (working && b.type === 'lavajato' && Math.random() < dt * 14) {
        const p = v.g.position.clone();
        p.x += (Math.random() - 0.5) * 3; p.y = 1 + Math.random() * 1.5; p.z += (Math.random() - 0.5) * 2;
        this.puff(p, '#ffffff', 0.16 + Math.random() * 0.12, 0.6, 0.9);
      }
      if (working && b.type === 'elevador' && Math.random() < dt * 3) {
        const p = v.g.position.clone(); p.y = 1.2; p.x += 0.6;
        this.burst(p, '#ffd23d', 3, 2, 0.06, 2);
      }
      // Sujeira some conforme a lavagem avança.
      if (job && b.type === 'lavajato') {
        const cv = this.carViews.get(job.c.id);
        if (cv) cv.g.userData.setDirt(job.state === 'done' ? 0 : job.remaining / job.total);
      }
    }

    // Carros.
    const all = [...this.carViews.values(), ...this.leaving];
    for (const v of all) {
      const g = v.g, u = g.userData;
      let moving = false;
      if (v.path.length) {
        const p = v.path[0];
        const dx = p.x - g.position.x, dz = p.z - g.position.z;
        const dist = Math.hypot(dx, dz);
        const last = v.path.length === 1;
        const sp = last ? Math.min(v.speed, 1.5 + dist * 2.4) : v.speed;
        const step = sp * dt;
        if (dist > 0.001) {
          const want = Math.atan2(dx, dz) + (p.rev ? Math.PI : 0);
          v.heading = lerpAngle(v.heading, want, Math.min(1, dt * 9));
          g.rotation.y = v.heading;
        }
        if (step >= dist) {
          g.position.x = p.x; g.position.z = p.z;
          v.path.shift();
          if (!v.path.length && v.onDone) { const cb = v.onDone; v.onDone = null; cb(v); }
        } else {
          g.position.x += (dx / dist) * step;
          g.position.z += (dz / dist) * step;
        }
        moving = true;
        for (const w of u.wheels) w.rotation.x += (step / u.wheelR) * (p.rev ? -1 : 1);
      }
      // Suspensão balançando e quique ao parar.
      v.wob = moving ? Math.min(1, v.wob + dt * 4) : v.wob * Math.pow(0.02, dt);
      u.body.position.y = Math.sin(T * 18 + v.id) * 0.03 * v.wob;
      u.body.rotation.x = moving ? -0.03 : Math.sin(T * 10) * 0.04 * v.wob;
      if (v.pop !== undefined && v.pop < 1) {
        v.pop = Math.min(1, v.pop + dt * 3);
        const s = 0.8 + 0.2 * easeOutBack(v.pop);
        g.scale.set(s, s, s);
      }
      // Em cima do elevador ou do disco giratório.
      if (v.atBay && !v.path.length && this.carViews.has(v.id)) {
        const bv = this.buildViews.get(v.atBay);
        const b = byId.get(v.atBay);
        if (bv && b) {
          const bu = bv.g.userData;
          if (bu.lift) g.position.y = bv.lift - 0.08;
          else if (bu.disc) {
            g.position.y = 0.33;
            if (b.job && b.job.state === 'custom') g.rotation.y = bu.disc.rotation.y + Math.PI;
          } else g.position.y = 0.22;
        }
      }
      if (u.neon) u.neon.material.opacity = 0.75 + Math.sin(T * 4 + v.id) * 0.2;
      if (u.spec.broken && !v.atBay && !moving && Math.random() < dt * 2.5) {
        this.puff(g.position.clone().setY(1.4).add(new THREE.Vector3(Math.sin(v.heading) * 1.2, 0, Math.cos(v.heading) * 1.2)), '#9aa0aa', 0.25, 1.4, 1.4);
      }
    }

    // Partículas.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.scene.remove(p.m); this.particles.splice(i, 1); continue; }
      p.vy -= p.g * dt;
      p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      if (p.m.position.y < 0.05 && p.g) { p.m.position.y = 0.05; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; }
      const k = p.life / p.max;
      const s = p.grow ? p.s0 * (0.6 + (1 - k) * 0.9) * Math.min(1, k * 3) : p.s0 * Math.min(1, k * 2.5);
      p.m.scale.setScalar(Math.max(0.001, s));
      if (p.spin) { p.m.rotation.x += dt * 8; p.m.rotation.z += dt * 6; }
    }
    if (this.particles.length > 500) for (const p of this.particles.splice(0, this.particles.length - 500)) this.scene.remove(p.m);

    this.renderer.render(this.scene, this.camera);
  }
}
