// Cena 3D: câmera isométrica, terreno expansível, rua viva, dia/noite, construções, carros, pista e efeitos.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TILE, GRID_H, MAX_W, BUILDINGS, CAR_TYPES, PARTS, LAND, CHARACTERS } from './data.js';
import {
  buildCar, buildBuilding, buildTree, buildHouse, buildPerson, buildScaffold, buildSaleSign, buildTrack, makeTrackPath,
  animatePerson, mat, mesh, rbox, sph, box, cyl, ghostify, NIGHT, BAY_SPOT, STAFF_PATH,
} from './models.js';
export { LOT_D_EXPORT as LOT_D };
import { laneTiles, canPlace, QUEUE_SLOTS } from './logic.js';
import { stepVehicles, bodyOf, personBody, hit } from './traffic.js';
import { City, grassTexture } from './city.js';

const LOT_D = GRID_H * TILE;
const LOT_D_EXPORT = LOT_D;
const MAX_LOT_W = MAX_W * TILE;
const QUEUE_Z = LOT_D + 3.2; // vagas de espera, coladas na calçada
const PASS_Z = LOT_D + 6.4; // mão para a direita: clientes chegando e indo embora
const TRAFFIC_Z = LOT_D + 9.2; // mão para a esquerda: trânsito da cidade
const MID_UT = (PASS_Z + TRAFFIC_Z) / 2; // meio do retorno
const SLOT_HALF = 2.2; // meia vaga (carro + folga)
const SLOT_GAP = 5.6; // distância mínima entre centros de vagas (espaço para manobrar)
let SERIAL = 0; // ordem de chegada: quem chegou antes tem a preferência
const CAM_DIR = new THREE.Vector3(1, 1.25, 1).normalize();
const DAY_LEN = 360; // segundos para um dia completo
export const TRACK_PATH = makeTrackPath(MAX_LOT_W / 2, -24, 15, 9);

export const lerpAngle = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
const easeOutBack = (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

export function tileCenter(type, x, z) {
  const d = BUILDINGS[type];
  return new THREE.Vector3((x + d.w / 2) * TILE, 0, (z + d.d / 2) * TILE);
}

export function baySpot(b) {
  const p = tileCenter(b.type, b.x, b.z);
  const off = BAY_SPOT[b.type] || [0, 0];
  return p.add(new THREE.Vector3(off[0], 0, off[1]));
}

function nightFactor(p) {
  if (p < 0.58) return 0;
  if (p < 0.68) return (p - 0.58) / 0.1;
  if (p < 0.9) return 1;
  return 1 - (p - 0.9) / 0.1;
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
    this.skyDay = new THREE.Color('#8fd3f2');
    this.skyNight = new THREE.Color('#15214a');
    this.skyDusk = new THREE.Color('#f7a46b');
    this.skyRain = new THREE.Color('#7d8ea3');
    this.scene.background = this.skyDay.clone();
    this.target = new THREE.Vector3(14.5, 0, LOT_D / 2 - 1.5);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
    this.viewH = 30;
    this.zoom = 1;
    this.zoomTarget = 1;
    this.focusTween = null;
    this.followCam = null;

    this.hemi = new THREE.HemisphereLight('#d6eeff', '#8a7a55', 1.25);
    this.scene.add(this.hemi);
    const sun = new THREE.DirectionalLight('#fff0d6', 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -38; sc.right = 38; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 140;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    this.sun = sun;
    this.scene.add(sun, sun.target);

    this.buildViews = new Map();
    this.carViews = new Map();
    this.leaving = [];
    this.particles = [];
    this.traffic = [];
    this.walkers = [];
    this.swaying = [];
    this.time = 0;
    this.dayT = 0.08 * DAY_LEN; // começa de manhã
    this.night = -1;
    this.lanesGroup = new THREE.Group();
    this.lotGroup = new THREE.Group();
    this.scene.add(this.lanesGroup, this.lotGroup);
    this.trackGroup = null;
    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.ghost = null;
    this.trafficIn = 2;
    this.walkerIn = 1;

    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.staffViews = [];
    this.rainK = 0;
    this.initRain();
    this.buildTerrain();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  // ---------- cenário fixo ----------
  buildTerrain() {
    const S = this.scene;
    const grassM = new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 });
    grassM.envMapIntensity = 0.12;
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), grassM);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(MAX_LOT_W / 2, -0.02, 0);
    grass.receiveShadow = true;
    S.add(grass);

    const side = new THREE.Mesh(new THREE.BoxGeometry(200, 0.24, 1.6), mat('#e4e1da'));
    side.position.set(MAX_LOT_W / 2, 0.0, LOT_D + 0.8);
    side.receiveShadow = true;
    S.add(side);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 8.6), mat('#4a4f5c', { r: 0.95 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(MAX_LOT_W / 2, 0.01, LOT_D + 5.9);
    road.receiveShadow = true;
    S.add(road);
    for (let x = -90; x < 140; x += 4) mesh(box(2, 0.02, 0.22), mat('#ffffff'), x, 0.03, (PASS_Z + TRAFFIC_Z) / 2, S).castShadow = false;
    mesh(box(230, 0.02, 0.12), mat('#e6e6e6'), 25, 0.03, QUEUE_Z + 1.55, S).castShadow = false; // faixa das vagas
    this.slotMarks = new THREE.Group();
    S.add(this.slotMarks);
    const side2 = new THREE.Mesh(new THREE.BoxGeometry(200, 0.24, 1.6), mat('#e4e1da'));
    side2.position.set(MAX_LOT_W / 2, 0, LOT_D + 11);
    side2.receiveShadow = true;
    S.add(side2);
    // Postes da rua (acendem à noite).
    for (let x = -20; x < 90; x += 16) {
      const p = buildBuilding('poste');
      p.position.set(x, 0, LOT_D + 11.4);
      S.add(p);
      this.streetLights = (this.streetLights || []).concat(p.userData.lights || []);
    }

    // A cidade (praça, lojas, parque, campinho, árvores…) fica em city.js.
    this.city = new City(S, { lotD: LOT_D, maxW: MAX_LOT_W, track: TRACK_PATH });
    let built = false;
    const go = () => { if (!built) { built = true; this.city.build(); } };
    (document.fonts?.ready || Promise.resolve()).then(go);
    setTimeout(go, 2500);
  }

  setLot(state) {
    const G = this.lotGroup;
    G.clear();
    this.buildLotInto(G, state.lotW);
    const W = state.lotW * TILE;
    this.placeSaleAndTrack(state, G, W);
  }

  buildLotInto(G, lotW) {
    const W = lotW * TILE;
    const tex = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = '#d9dde3'; g.fillRect(0, 0, 128, 128);
      g.strokeStyle = '#c4c9d1'; g.lineWidth = 4; g.strokeRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(lotW, GRID_H);
      return t;
    })();
    const lot = new THREE.Mesh(new THREE.BoxGeometry(W, 0.2, LOT_D), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    lot.position.set(W / 2, -0.08, LOT_D / 2);
    lot.receiveShadow = true;
    G.add(lot);
    const curb = mat('#b8bec8');
    mesh(box(W + 0.6, 0.35, 0.3), curb, W / 2, 0.05, -0.15, G);
    mesh(box(0.3, 0.35, LOT_D), curb, -0.15, 0.05, LOT_D / 2, G);
    mesh(box(0.3, 0.35, LOT_D), curb, W + 0.15, 0.05, LOT_D / 2, G);
    const hedge = mat('#3fa63f', { flat: true });
    mesh(rbox(W + 2, 1.1, 1, 0.4), hedge, W / 2, 0.55, -1.0, G);
    mesh(rbox(1, 1.1, LOT_D + 1, 0.4), hedge, -1.0, 0.55, LOT_D / 2 - 0.5, G);
    mesh(rbox(1, 1.1, LOT_D + 1, 0.4), hedge, W + 1.0, 0.55, LOT_D / 2 - 0.5, G);
  }

  placeSaleAndTrack(state, G, W) {
    // Próximo terreno à venda: cerquinha de corda + placa.
    const next = LAND[state.land.length];
    this.saleSign = null;
    if (next) {
      const x0 = W + 2, x1 = W + next.cols * TILE;
      const post = mat('#c98a4b'), rope = mat('#f2e3c4');
      for (let x = x0; x <= x1; x += 2) for (const z of [0.5, LOT_D - 0.5]) mesh(cyl(0.08, 0.08, 0.9, 6), post, x, 0.45, z, G);
      for (let z = 0.5; z <= LOT_D - 0.5; z += 2) mesh(cyl(0.08, 0.08, 0.9, 6), post, x1, 0.45, z, G);
      for (const z of [0.5, LOT_D - 0.5]) mesh(box(x1 - x0, 0.05, 0.05), rope, (x0 + x1) / 2, 0.75, z, G);
      mesh(box(0.05, 0.05, LOT_D - 1), rope, x1, 0.75, LOT_D / 2, G);
      const s = buildSaleSign('À VENDA', `Nível ${next.lvl}`);
      s.position.set((W + x1) / 2 + 1, 0, LOT_D / 2);
      s.rotation.y = Math.PI / 4;
      s.userData.pick = { kind: 'land' };
      G.add(s);
      this.saleSign = s;
    }
    // Pista: de terra antes da compra, asfalto depois.
    if (this.trackGroup) this.scene.remove(this.trackGroup);
    if (state.track) {
      this.trackGroup = buildTrack(TRACK_PATH);
      this.trackSign = null;
    } else {
      this.trackGroup = new THREE.Group();
      this.trackGroup.add(buildTrack(TRACK_PATH, 5.2, true));
      const s = buildSaleSign('PISTA', 'Nível 6');
      s.position.set(TRACK_PATH.cx, 0, TRACK_PATH.cz + 2);
      s.rotation.y = Math.PI / 4;
      s.scale.setScalar(1.4);
      s.userData.pick = { kind: 'track' };
      this.trackGroup.add(s);
      this.trackSign = s;
    }
    this.scene.add(this.trackGroup);
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
    this.sun.position.copy(this.target).add(new THREE.Vector3(-22, 40, -6));
    this.sun.target.position.copy(this.target);
  }

  // ---------- câmera ----------
  groundAt(sx, sy) {
    const ndc = new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.ground, p) ? p : null;
  }

  pan(fromX, fromY, toX, toY) {
    if (this.focusTween || this.followCam) return;
    const a = this.groundAt(fromX, fromY), b = this.groundAt(toX, toY);
    if (!a || !b) return;
    this.target.add(a.sub(b));
    this.clampTarget();
    this.updateCamera();
  }

  clampTarget() {
    this.target.x = Math.max(-34, Math.min(MAX_LOT_W + 34, this.target.x));
    this.target.z = Math.max(-44, Math.min(LOT_D + 30, this.target.z));
  }

  zoomBy(f) {
    if (this.focusTween || this.followCam) return;
    this.zoomTarget = Math.max(0.5, Math.min(2.6, this.zoomTarget * f));
  }

  // offset: sobe o alvo na tela (abre espaço embaixo); side: empurra o alvo para a esquerda da tela.
  focus(pos, zoom = 2.3, dur = 0.7, offset = 0.17, side = 0) {
    this.saved = this.saved || { target: this.target.clone(), zoom: this.zoomTarget };
    const t = pos.clone().add(new THREE.Vector3(1, 0, 1).normalize().multiplyScalar((this.viewH / zoom) * offset));
    if (side) t.add(new THREE.Vector3(1, 0, -1).normalize().multiplyScalar((this.viewH * this.aspect / zoom) * side));
    this.focusTween = { from: this.target.clone(), to: t, z0: this.zoom, z1: zoom, t: 0, dur };
  }

  unfocus() {
    this.followCam = null;
    if (!this.saved) return;
    const s = this.saved;
    this.saved = null;
    this.focusTween = { from: this.target.clone(), to: s.target, z0: this.zoom, z1: s.zoom, t: 0, dur: 0.6 };
  }

  panTo(pos, zoom = this.zoomTarget) {
    this.focusTween = { from: this.target.clone(), to: pos.clone(), z0: this.zoom, z1: zoom, t: 0, dur: 0.8 };
    this.zoomTarget = zoom;
  }

  follow(pos, zoom) {
    this.saved = this.saved || { target: this.target.clone(), zoom: this.zoomTarget };
    this.followCam = { pos, zoom };
  }

  toScreen(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, visible: p.z < 1 && p.x > -1.2 && p.x < 1.2 && p.y > -1.2 && p.y < 1.2 };
  }

  pick(sx, sy) {
    const ndc = new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const roots = [...this.buildViews.values()].map((v) => v.g).concat([...this.carViews.values()].map((v) => v.g));
    if (this.saleSign) roots.push(this.saleSign);
    if (this.trackSign) roots.push(this.trackSign);
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
      if (v && (v.level !== b.level || v.x !== b.x || v.z !== b.z || v.uniform !== state.uniform)) {
        if (v.level !== b.level) popId = b.id;
        this.removeView(b.id);
        v = null;
      }
      if (!v) {
        const g = buildBuilding(b.type, b.level, state.uniform);
        g.position.copy(tileCenter(b.type, b.x, b.z));
        g.userData.pick = { kind: 'building', id: b.id };
        this.scene.add(g);
        v = { g, type: b.type, level: b.level, x: b.x, z: b.z, uniform: state.uniform, pop: b.id === popId ? 0 : 1, lift: 0.3, walk: { i: 0, wait: 0 } };
        this.buildViews.set(b.id, v);
        if (b.id === popId) { this.burst(g.position, '#e9dcc4', 22, 4, 0.25, 1.2); this.confetti(g.position, 24); }
        if (b.job && !this.carViews.has(b.job.c.id)) {
          const cv = this.addCar(b.job.c, baySpot(b), Math.PI);
          cv.atBay = b.id;
          cv.parked = true;
        }
      }
      if (b.build && !v.scaffold) {
        const d = BUILDINGS[b.type];
        v.scaffold = buildScaffold(d.w, d.d);
        v.scaffold.position.copy(v.g.position);
        v.scaffold.userData.pick = { kind: 'building', id: b.id };
        this.scene.add(v.scaffold);
        if (!b.build.up) v.g.visible = false;
      }
      if (b.type === 'showroom') this.syncShowroom(v, state);
    }
    for (const id of [...this.buildViews.keys()]) if (!ids.has(id)) this.removeView(id);
    this.drawLanes(state);
    this.layoutSlots(state);
    this.syncStaff(state);
  }

  removeView(id) {
    const v = this.buildViews.get(id);
    if (!v) return;
    this.scene.remove(v.g);
    if (v.scaffold) this.scene.remove(v.scaffold);
    this.buildViews.delete(id);
  }

  syncShowroom(v, state) {
    const cars = state.garage.slice(0, 3);
    const sig = JSON.stringify(cars.map((c) => [c.id, c.type, c.color, c.wheels, c.spoiler, c.neon, c.decal]));
    if (v.showSig === sig) return;
    v.showSig = sig;
    if (v.display) v.g.remove(v.display);
    v.display = new THREE.Group();
    cars.forEach((c, i) => {
      const sl = v.g.userData.slots[i];
      const car = buildCar(c, { driver: false });
      car.position.set(sl.x, 0.44, sl.z);
      car.rotation.y = sl.r * Math.PI;
      car.scale.setScalar(0.72);
      v.display.add(car);
    });
    v.g.add(v.display);
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
      const wide = b.type === 'posto' ? TILE - 0.2 + 1.2 : d.w * TILE - 0.5;
      mesh(box(wide, 0.06, len), asphalt, cx, 0.03, z0 + len / 2, this.lanesGroup).castShadow = false;
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
        lane = new THREE.Mesh(new THREE.PlaneGeometry(type === 'posto' ? TILE : d.w * TILE - 0.5, 1), new THREE.MeshBasicMaterial({ color: '#ffd23d', transparent: true, opacity: 0.35, depthWrite: false }));
        lane.rotation.x = -Math.PI / 2;
        holder.add(lane);
      }
      this.scene.add(holder);
      this.ghost = { type, holder, model: g, pad, lane, ok: null };
    }
    const gh = this.ghost;
    const ok = canPlace(state, type, x, z, moveId);
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

  // ---------- carros de clientes ----------
  addCar(c, pos, heading) {
    const ch = c.char ? CHARACTERS.find((x) => x.id === c.char) : null;
    const g = buildCar(c.car, { face: ch ? ch.face : null });
    g.position.copy(pos);
    g.rotation.y = heading;
    g.userData.pick = { kind: 'car', id: c.id };
    this.scene.add(g);
    const v = { g, id: c.id, path: [], speed: 11, cur: 0, heading, wob: 0, onDone: null, hop: 0, prio: ++SERIAL, slot: null, parked: false };
    this.carViews.set(c.id, v);
    return v;
  }

  // Vagas de espera: nunca na frente da entrada de um box (assim ninguém precisa atravessar um carro parado).
  layoutSlots(state) {
    const ways = [];
    for (const b of state.buildings) {
      const d = BUILDINGS[b.type];
      if (!d.service) continue;
      const cx = (b.x + d.w / 2) * TILE;
      const half = (b.type === 'posto' ? TILE + 1 : d.w * TILE - 0.5) / 2 + 1.3; // folga para o carro sair do box manobrando
      ways.push([cx - half, cx + half]);
    }
    const sig = state.lotW + '|' + ways.map((w) => w[0].toFixed(2)).join(',');
    if (sig === this.slotSig) return;
    this.slotSig = sig;
    const free = (x) => ways.every(([a, b]) => x + SLOT_HALF <= a || x - SLOT_HALF >= b);
    const W = state.lotW * TILE, mid = Math.min(W / 2, 17);
    const old = this.slots || [];
    const next = new Array(QUEUE_SLOTS).fill(null);
    const busy = new Set([...this.carViews.values()].filter((v) => v.slot != null).map((v) => v.slot));
    for (let i = 0; i < QUEUE_SLOTS; i++) if (busy.has(i) && old[i] != null && free(old[i])) next[i] = old[i];
    const cands = [];
    for (let x = -14; x <= W + 14; x += 0.25) if (free(x)) cands.push(x);
    cands.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
    for (let i = 0; i < QUEUE_SLOTS; i++) {
      if (next[i] != null) continue;
      next[i] = cands.find((x) => next.every((y) => y == null || Math.abs(y - x) >= SLOT_GAP)) ?? -20 - i * 6;
    }
    this.slots = next;
    this.slotMarks.clear();
    const paint = mat('#e6e6e6');
    for (const x of next) for (const dx of [-SLOT_HALF - 0.2, SLOT_HALF + 0.2]) mesh(box(0.12, 0.02, 2.8), paint, x + dx, 0.03, QUEUE_Z, this.slotMarks).castShadow = false;
    // Carro esperando numa vaga que virou entrada de box: manobra para a vaga nova.
    for (const v of this.carViews.values()) {
      if (v.slot == null || next[v.slot] === old[v.slot]) continue;
      const st = this.startOnRoad(v);
      v.parked = false;
      this.drive(v, [...st.pts, ...this.routeToSlot(st.x, next[v.slot])], () => { v.parked = true; });
    }
  }

  slotX(i) {
    return this.slots && this.slots[i] != null ? this.slots[i] : 5 + i * 5.5;
  }

  // Ponto na rua onde o carro começa a manobra (saindo do box, da vaga ou já rodando).
  startOnRoad(v) {
    const q = v.g.position;
    // Saindo do box de ré: só começa quando a boca da entrada está livre.
    if (q.z < LOT_D + 0.8) return { pts: [[q.x, QUEUE_Z, true, false, () => this.mouthBusy(q.x, v)], [q.x + 2.2, PASS_Z - 0.6], [q.x + 4.6, PASS_Z]], x: q.x + 4.6 };
    if (q.z > QUEUE_Z + 1.4) return { pts: [[q.x + 2.5, PASS_Z]], x: q.x + 2.5 };
    return { pts: [[q.x + 2.0, QUEUE_Z + 1.3, false, true, null, 1], [q.x + 5.0, PASS_Z]], x: q.x + 5.0 };
  }

  // Retorno: da mão da direita para a mão da esquerda (manobra larga: os outros guardam distância).
  uturn(u) {
    const clear = (v) => this.areaBusy({ x: u + 1.2, z: MID_UT, ux: 1, uz: 0, hl: 3.4, hw: 2.0 }, v);
    return [[u, PASS_Z], [u + 2.1, MID_UT, false, false, clear, -1, true], [u, TRAFFIC_Z, false, false, null, -1, true]];
  }

  routeToSlot(x0, sx) {
    // Só estaciona quando a vaga está vazia de verdade (o cliente anterior pode ainda estar saindo).
    const free = (v) => this.areaBusy({ x: sx, z: QUEUE_Z, ux: 1, uz: 0, hl: SLOT_HALF + 0.3, hw: 1.3 }, v);
    const park = [[sx - 2.2, QUEUE_Z + 0.4, false, true, free], [sx, QUEUE_Z, false, true]];
    if (sx - 4.6 >= x0 + 0.5) return [[sx - 4.6, PASS_Z], ...park];
    const u = Math.max(x0 + 1, sx + 6);
    return [...this.uturn(u), [sx + 4.6, TRAFFIC_Z], [sx + 2.2, QUEUE_Z + 0.4, false, true], [sx, QUEUE_Z, false, true]];
  }

  routeToBay(x0, b, v) {
    const p = baySpot(b);
    const front = (b.z + BUILDINGS[b.type].d) * TILE;
    // Só entra quando a entrada do box está livre (o carro anterior já saiu).
    const hold = () => this.drivewayBusy(p, v);
    const tail = [[p.x, QUEUE_Z + 0.3, false, false, hold], [p.x, front + 0.5], [p.x, p.z]];
    if (p.x - 4.2 >= x0 + 0.5) return [[p.x - 4.2, PASS_Z], ...tail];
    const u = Math.max(x0 + 1, p.x + 5.5);
    return [...this.uturn(u), [p.x + 4.2, TRAFFIC_Z], ...tail];
  }

  mouthBusy(x, self) {
    return this.areaBusy({ x, z: LOT_D + 4.0, ux: 1, uz: 0, hl: 2.4, hw: 1.9 }, self);
  }

  // Algum carro (fora das vagas) dentro desta área?
  areaBusy(area, self) {
    for (const o of [...this.carViews.values(), ...this.leaving, ...this.traffic]) {
      if (o === self || o.parked || !o.body) continue;
      if (hit(area, o.body)) return true;
    }
    return false;
  }

  drivewayBusy(p, self) {
    for (const o of [...this.carViews.values(), ...this.leaving]) {
      if (o === self) continue;
      const q = o.g.position;
      if (Math.abs(q.x - p.x) < 2.4 && q.z > p.z - 1.5 && q.z < LOT_D + 5.4) return true;
    }
    return false;
  }

  // Lugar livre na rua para um carro novo aparecer (ninguém nasce em cima de outro).
  spawnX(x, z, dir) {
    const all = [...this.carViews.values(), ...this.leaving, ...this.traffic];
    for (let k = 0; k < 12; k++, x += dir * 6) if (!all.some((o) => Math.abs(o.g.position.x - x) < 5.5 && Math.abs(o.g.position.z - z) < 1.6)) return x;
    return x;
  }

  carArrive(c) {
    const x = this.spawnX(-40, PASS_Z, -1);
    const v = this.addCar(c, new THREE.Vector3(x, 0, PASS_Z), Math.PI / 2);
    v.slot = c.slot;
    v.cur = v.speed;
    this.drive(v, this.routeToSlot(x, this.slotX(c.slot)), () => { v.hop = 1; v.parked = true; });
  }

  carToBay(c, b, onArrive) {
    let v = this.carViews.get(c.id);
    let st;
    if (!v) {
      const x = this.spawnX(-40, PASS_Z, -1);
      v = this.addCar(c, new THREE.Vector3(x, 0, PASS_Z), Math.PI / 2);
      v.cur = v.speed;
      st = { pts: [], x };
    } else st = this.startOnRoad(v);
    v.slot = null;
    v.parked = false;
    v.atBay = b.id;
    this.drive(v, [...st.pts, ...this.routeToBay(st.x, b, v)], (cv) => { v.parked = true; if (onArrive) onArrive(cv); });
  }

  carLeave(id, fromBay, happy = true) {
    const v = this.carViews.get(id);
    if (!v) return;
    this.carViews.delete(id);
    v.g.userData.pick = null;
    v.g.position.y = 0;
    const st = this.startOnRoad(v);
    v.slot = null;
    v.parked = false;
    v.atBay = null;
    v.hop = happy ? 1 : 0;
    this.drive(v, [...st.pts, [140, PASS_Z]], () => { this.scene.remove(v.g); this.leaving.splice(this.leaving.indexOf(v), 1); });
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

  // Pontos: [x, z, ré?, manobra de vaga?, espera(v)?]
  drive(v, points, onDone) {
    const lane = (z) => (Math.abs(z - PASS_Z) < 0.8 ? 1 : Math.abs(z - TRAFFIC_Z) < 0.8 ? -1 : 0);
    let prevZ = v.g.position.z, entering = 0;
    v.path = points.map(([x, z, rev, soft, hold, over, wide]) => {
      const ln = over ?? lane(z);
      const laneZ = ln === 1 ? PASS_Z : ln === -1 ? TRAFFIC_Z : z;
      let watch = null;
      // Só o primeiro trecho de cada entrada vigia; depois de começar, o carro não para no meio da manobra.
      if (ln && Math.abs(prevZ - laneZ) > 0.6 && entering !== ln) {
        // Mão da direita (vindo da vaga ou do box): vigia a faixa e quem também está saindo atrás.
        watch = ln === 1 ? { dir: 1, lo: QUEUE_Z - 0.3, hi: PASS_Z + 1.0 } : { dir: -1, lo: TRAFFIC_Z - 1.0, hi: TRAFFIC_Z + 1.0 };
        entering = ln;
      } else if (Math.abs(prevZ - TRAFFIC_Z) < 0.8 && z < PASS_Z - 0.8) {
        // Saindo da mão da esquerda para um box: cruza a mão da direita.
        watch = { dir: 1, lo: PASS_Z - 1.0, hi: PASS_Z + 1.0 };
      }
      // Enquanto entra na faixa, o carro reserva um pedaço dela (claim) e quem vem atrás para antes.
      const claim = entering ? { dir: entering, z: entering === 1 ? PASS_Z : TRAFFIC_Z, first: !!watch } : null;
      if (Math.abs(z - laneZ) < 0.05 || !ln) entering = 0;
      prevZ = z;
      return { x, z, rev: !!rev, soft: !!soft, hold: hold || null, watch, wide: !!wide, claim };
    });
    v.onDone = onDone || null;
  }

  // ---------- carros da corrida ----------
  addRaceCar(spec) {
    const g = buildCar(spec);
    this.scene.add(g);
    return g;
  }

  removeObject(o) {
    this.scene.remove(o);
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

  coins3d(pos, n = 8) {
    const m = mat('#ffcc33', { m: 0.8, r: 0.25, e: '#ff9900', ei: 0.3 });
    for (let i = 0; i < n; i++) {
      const p = mesh(cyl(0.22, 0.22, 0.06, 14), m, pos.x, (pos.y || 0) + 1, pos.z, this.scene);
      p.rotation.x = Math.PI / 2;
      const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 2.5;
      this.particles.push({ m: p, vx: Math.cos(a) * s, vy: 6 + Math.random() * 3, vz: Math.sin(a) * s, life: 1.1, max: 1.1, g: 14, spin: true, s0: 1 });
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
      const p = mesh(box(0.22, 0.04, 0.14), mat(cols[i % cols.length]), pos.x, (pos.y || 0) + 1.5, pos.z, this.scene);
      p.castShadow = false;
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
      this.particles.push({ m: p, vx: Math.cos(a) * s, vy: 5 + Math.random() * 5, vz: Math.sin(a) * s, life: 1.6, max: 1.6, g: 9, spin: true, s0: 1 });
    }
  }

  // ---------- vida na rua ----------
  updateStreet(dt) {
    this.trafficIn -= dt;
    if (this.trafficIn <= 0 && this.traffic.length < 5 && !this.trafficPaused) {
      this.trafficIn = rnd(3, 8);
      const spec = { type: pickOne(CAR_TYPES).id, color: pickOne(PARTS.color).id, wheels: pickOne(['padrao', 'padrao', 'esportiva']), spoiler: 'nenhum', neon: 'nenhum', decal: Math.random() < 0.2 ? 'listras' : 'nenhum' };
      const g = buildCar(spec);
      g.position.set(this.spawnX(120, TRAFFIC_Z, 1), 0, TRAFFIC_Z);
      g.rotation.y = -Math.PI / 2;
      this.scene.add(g);
      const sp = rnd(8, 13);
      const t = { g, path: [], speed: sp, cur: sp, heading: -Math.PI / 2, prio: ++SERIAL, traffic: true };
      this.drive(t, [[-60, TRAFFIC_Z]], () => { this.scene.remove(g); const i = this.traffic.indexOf(t); if (i >= 0) this.traffic.splice(i, 1); });
      this.traffic.push(t);
    }
    for (let i = 0; i < this.traffic.length; i++) {
      const t = this.traffic[i], u = t.g.userData;
      for (const w of u.wheels) w.rotation.x += (t.step || 0) / u.wheelR;
      u.body.position.y = Math.sin(this.time * 16 + t.prio) * 0.02 * Math.min(1, (t.cur || 0) / 4);
    }
    this.walkerIn -= dt;
    if (this.walkerIn <= 0 && this.walkers.length < 9) {
      this.walkerIn = rnd(2, 6);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const z = Math.random() < 0.55 ? LOT_D + 0.8 : LOT_D + 11;
      const p = buildPerson({
        shirt: pickOne(['#e8473c', '#2f7bea', '#46c35a', '#ffc93c', '#ff6fb5', '#8a5cf0', '#ffffff', '#ff8a2a']),
        pants: pickOne(['#26344f', '#3a3d48', '#6b4a2c', '#2f7bea']),
        skin: pickOne(['#f1c09a', '#c98a5e', '#8a5a3a', '#f6d2b4']),
        hair: pickOne(['#3a2a1e', '#1f1f24', '#c98a2a', '#e8e0d0']),
        hat: Math.random() < 0.25 ? pickOne(['#e8473c', '#2f7bea', '#ffffff']) : null,
      });
      p.scale.setScalar(0.85);
      // Cada um anda do seu lado da calçada para ninguém trombar de frente.
      p.position.set(dir > 0 ? -40 : 110, 0.12, z - dir * 0.32 + rnd(-0.1, 0.1));
      p.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(p);
      this.walkers.push({ p, dir, v: rnd(1.3, 2), ph: rnd(0, 6) });
    }
    const carBodies = this.carBodies || [];
    for (let i = this.walkers.length - 1; i >= 0; i--) {
      const w = this.walkers[i];
      const q = w.p.position;
      // Para se tiver carro atravessando a calçada ou alguém mais lento logo à frente.
      const ahead = { x: q.x + w.dir * 0.75, z: q.z, ux: 1, uz: 0, hl: 0.42, hw: 0.3 };
      w.waiting = carBodies.some((b) => hit(ahead, b)) ||
        this.walkers.some((o) => o !== w && o.dir === w.dir && Math.abs(o.p.position.z - q.z) < 0.45 && (o.p.position.x - q.x) * w.dir > 0 && (o.p.position.x - q.x) * w.dir < 0.9);
      if (!w.waiting) q.x += w.dir * w.v * dt;
      animatePerson(w.p, w.waiting ? this.time + w.ph : this.time * (w.v / 1.6) + w.ph, w.waiting ? 'idle' : 'walk');
      if (w.p.position.x > 115 || w.p.position.x < -45) { this.scene.remove(w.p); this.walkers.splice(i, 1); }
    }
  }

  // ---------- dia e noite ----------
  updateSky(dt) {
    this.dayT = (this.dayT + dt) % DAY_LEN;
    const p = this.dayT / DAY_LEN;
    const n = nightFactor(p);
    const dusk = Math.max(0, 1 - Math.abs(p - 0.62) / 0.05) + Math.max(0, 1 - Math.abs(p - 0.95) / 0.04);
    this.scene.background.copy(this.skyDay).lerp(this.skyDusk, Math.min(1, dusk) * 0.6).lerp(this.skyNight, n);
    const rk = this.rainK;
    this.scene.background.lerp(this.skyRain, rk * 0.65 * (1 - n));
    this.sun.intensity = 2.4 * (1 - n * 0.8) * (1 - rk * 0.62);
    this.sun.color.set('#fff0d6').lerp(new THREE.Color('#ff9a5a'), Math.min(1, dusk) * 0.7).lerp(new THREE.Color('#8aa0ff'), n);
    this.hemi.intensity = 1.25 * (1 - n * 0.5) * (1 - rk * 0.32);
    this.hemi.color.set('#d6eeff').lerp(new THREE.Color('#5a6ab0'), n);
    if (Math.abs(n - this.night) > 0.01) {
      this.night = n;
      for (const m of NIGHT) {
        const d = m.userData.night;
        m.emissive.lerpColors(d.dayE, d.nightE, n);
        m.emissiveIntensity = d.dayI + (d.nightI - d.dayI) * n;
      }
      const set = (l) => { l.intensity = (l.userData.max || 10) * n; };
      for (const v of this.buildViews.values()) for (const l of v.g.userData.lights || []) set(l);
      for (const l of this.streetLights || []) set(l);
    }
    return n;
  }

  setDayTime(p) { this.dayT = p * DAY_LEN; this.night = -1; }

  // ---------- quadro a quadro ----------
  update(dt, state) {
    this.time += dt;
    const T = this.time;
    this.updateRain(dt, !!state.weather?.rain && !this.visit);
    const night = this.updateSky(dt);
    this.updateStreet(dt);
    this.updateStaff(dt);
    this.city.update(dt, Math.max(0, this.night));
    for (let i = 0; i < this.swaying.length; i++) this.swaying[i].rotation.z = Math.sin(T * 1.2 + i) * 0.03;

    if (this.followCam) {
      const f = this.followCam;
      this.target.lerp(f.pos, Math.min(1, dt * 4));
      this.zoom += (f.zoom - this.zoom) * Math.min(1, dt * 3);
      this.zoomTarget = this.zoom;
      this.updateCamera();
    } else if (this.focusTween) {
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

    const byId = new Map(state.buildings.map((b) => [b.id, b]));
    for (const [id, v] of this.buildViews) {
      const b = byId.get(id);
      if (!b) continue;
      if (v.pop < 1) {
        v.pop = Math.min(1, v.pop + dt * 2.2);
        const s = easeOutBack(v.pop);
        v.g.scale.set(s, s, s);
      }
      // Obra: andaime com operário martelando.
      if (v.scaffold) {
        if (b.build) {
          animatePerson(v.scaffold.userData.worker, T, 'work');
          if (Math.random() < dt * 3) this.puff(v.g.position.clone().setY(0.5), '#e9dcc4', 0.25, 1, 0.8);
        } else {
          this.scene.remove(v.scaffold);
          v.scaffold = null;
          v.g.visible = true;
          v.pop = 0;
          this.burst(v.g.position, '#e9dcc4', 20, 4, 0.25, 1.2);
          this.confetti(v.g.position, 30);
        }
      }
      const u = v.g.userData;
      const job = b.build ? null : b.job;
      const working = job && job.state === 'work';
      if (u.lift) {
        const want = job && job.state !== 'custom' ? 1.15 : 0.3;
        v.lift += (want - v.lift) * Math.min(1, dt * 3);
        u.lift.position.y = v.lift;
      }
      if (u.mech) this.updateStaff(v, b, working, dt, T);
      if (u.brushes) for (const br of u.brushes) br.rotation.y += dt * (working ? 14 : 0.3);
      if (u.disc) u.disc.rotation.y += dt * (job && job.state === 'custom' ? 0.6 : 0.15);
      if (u.frame) u.frame.visible = !(this.saved && job && job.state === 'custom');
      if (u.flag) u.flag.rotation.y = Math.sin(T * 3 + id) * 0.25;
      if (u.cup) u.cup.rotation.y += dt * 0.6;
      if (u.crown) u.crown.rotation.z = Math.sin(T * 1.3 + id) * 0.04;
      if (u.blink) u.blink.visible = Math.sin(T * 4) > 0;
      if (u.beacon) {
        u.beacon.visible = !!state.towCall && Math.sin(T * 10) > 0;
        if (u.truck) u.truck.visible = !this.towing;
      }
      if (u.jet) { u.jet.scale.y = 1 + Math.sin(T * 6) * 0.25; if (Math.random() < dt * 6) this.puff(v.g.position.clone().setY(2.1), '#bfeaff', 0.12, 1.2, 0.6); }
      if (u.neonSign) u.neonSign.material.emissiveIntensity = (1.1 + night) + (Math.sin(T * 9) > 0.92 ? -0.8 : 0);
      if (v.display) for (const c of v.display.children) c.rotation.y += dt * 0.3;
      if (working && b.type === 'lavajato' && Math.random() < dt * 14) {
        const p = v.g.position.clone();
        p.x += (Math.random() - 0.5) * 3; p.y = 1 + Math.random() * 1.5; p.z += (Math.random() - 0.5) * 2;
        this.puff(p, '#ffffff', 0.16 + Math.random() * 0.12, 0.6, 0.9);
      }
      if (working && (b.type === 'elevador' || b.type === 'restauracao') && Math.random() < dt * 3) {
        const p = v.g.position.clone(); p.y = 1.2; p.x += (Math.random() - 0.5) * 1.5;
        this.burst(p, b.type === 'restauracao' ? '#ff9a3a' : '#ffd23d', 3, 2, 0.06, 2);
      }
      if (working && b.type === 'posto' && Math.random() < dt * 2) this.puff(baySpot(b).setY(1.6), '#d8f5ff', 0.12, 0.8, 0.6);
      if (job) {
        const cv = this.carViews.get(job.c.id);
        if (cv && !cv.path.length) {
          const left = job.state === 'done' ? 0 : job.remaining / job.total;
          if (b.type === 'lavajato') cv.g.userData.setDirt(left);
          if (b.type === 'restauracao' || (b.type === 'elevador' && job.c.car.rust)) cv.g.userData.setRust(left);
        }
      }
    }

    // Carros: primeiro o trânsito decide quem pode andar (ninguém atravessa ninguém), depois a animação.
    const cust = [...this.carViews.values(), ...this.leaving];
    const people = [];
    for (const w of this.walkers) if (!w.waiting) people.push(personBody(w.p.position.x, w.p.position.z));
    for (const sv of this.staffViews) if (sv.goal && !sv.waiting && sv.p.visible) people.push(personBody(sv.p.position.x, sv.p.position.z));
    stepVehicles([...cust, ...this.traffic], dt, {
      people,
      lerpAngle,
      // Durante o guincho a avenida é do minijogo: carros de clientes na pista esperam escondidos.
      frozen: (v) => !!this.towing && !v.traffic && v.g.position.z > LOT_D + 4.3,
    });
    this.carBodies = cust.filter((v) => v.path.length && !v.frozen).map((v) => v.body);
    for (const v of cust) {
      const g = v.g, u = g.userData;
      g.visible = !this.visit && !v.frozen;
      // Estacionado na vaga: endireita o carro paralelo à calçada.
      if (v.parked && v.slot != null && !v.path.length) {
        const to = Math.sin(v.heading) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        v.heading = lerpAngle(v.heading, to, Math.min(1, dt * 5));
        g.rotation.y = v.heading;
      }
      const moving = v.step > 0.0005;
      if (moving) {
        for (const w of u.wheels) w.rotation.x += (v.step / u.wheelR) * (v.rev ? -1 : 1);
        if (Math.random() < dt * 8) this.puff(g.position.clone().setY(0.3).add(new THREE.Vector3(-Math.sin(v.heading) * u.length * 0.55, 0, -Math.cos(v.heading) * u.length * 0.55)), '#cfd3da', 0.12, 0.6, 0.6);
      }
      v.wob = moving ? Math.min(1, v.wob + dt * 4) : v.wob * Math.pow(0.02, dt);
      u.body.position.y = Math.sin(T * 18 + v.id) * 0.03 * v.wob;
      u.body.rotation.x = moving ? -0.03 : Math.sin(T * 10) * 0.04 * v.wob;
      // Pulinho de alegria (chegada e saída feliz).
      if (v.hop > 0) {
        v.hop = Math.max(0, v.hop - dt * 2.2);
        const k = 1 - v.hop;
        u.body.position.y += Math.sin(k * Math.PI) * 0.45;
        u.body.scale.set(1 + Math.sin(k * Math.PI * 2) * 0.06, 1 - Math.sin(k * Math.PI * 2) * 0.06, 1);
      }
      if (v.pop !== undefined && v.pop < 1) {
        v.pop = Math.min(1, v.pop + dt * 3);
        const s = 0.8 + 0.2 * easeOutBack(v.pop);
        g.scale.set(s, s, s);
      }
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
      if (u.neon) {
        u.neon.material.opacity = 0.75 + Math.sin(T * 4 + v.id) * 0.2;
        if (u.neon.userData.rainbow) u.neon.material.color.setHSL((T * 0.25 + v.id * 0.1) % 1, 1, 0.6);
      }
      if (u.spec.broken && !v.atBay && !moving && Math.random() < dt * 2.5) {
        this.puff(g.position.clone().setY(1.4).add(new THREE.Vector3(Math.sin(v.heading) * 1.2, 0, Math.cos(v.heading) * 1.2)), '#9aa0aa', 0.25, 1.4, 1.4);
      }
    }

    if (this.trackGroup) {
      const tg = this.trackGroup.userData;
      if (tg.flags) tg.flags.forEach((f, i) => (f.rotation.y = Math.sin(T * 3 + i) * 0.3));
      if (tg.crowd) {
        tg.crowd.forEach((c, i) => {
          if (c.userData.y0 === undefined) c.userData.y0 = c.position.y;
          c.position.y = c.userData.y0 + (this.raceHype ? Math.abs(Math.sin(T * 9 + i)) * 0.14 : 0);
        });
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

  // Mecânico anda em volta do carro, para e trabalha; sem serviço, volta ao lugar.
  updateStaff(v, b, working, dt, T) {
    const m = v.g.userData.mech;
    const home = m.userData.home;
    const path = STAFF_PATH[b.type];
    const w = v.walk;
    let goal;
    if (working && path) {
      if (w.wait > 0) {
        w.wait -= dt;
        animatePerson(m, T, 'work');
        const spot = BAY_SPOT[b.type] || [0, 0];
        m.rotation.y = lerpAngle(m.rotation.y, Math.atan2(spot[0] - m.position.x, spot[1] - m.position.z), Math.min(1, dt * 8));
        return;
      }
      goal = path[w.i % path.length];
    } else if (working) {
      animatePerson(m, T, 'work');
      return;
    } else {
      goal = [home.x, home.z];
    }
    const dx = goal[0] - m.position.x, dz = goal[1] - m.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) {
      if (working) { w.wait = 1.4 + Math.random() * 1.6; w.i++; }
      else { m.rotation.y = lerpAngle(m.rotation.y, home.r, Math.min(1, dt * 5)); animatePerson(m, T, b.job && b.job.state === 'done' ? 'cheer' : 'idle'); }
      return;
    }
    const step = Math.min(d, 1.8 * dt);
    m.position.x += (dx / d) * step;
    m.position.z += (dz / d) * step;
    m.rotation.y = lerpAngle(m.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10));
    animatePerson(m, T, 'walk');
  }
}


// ===================== Atualização 3: chuva, equipe, visita =====================
World.prototype.initRain = function () {
  const n = 2600;
  const pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) this.resetDrop(pos, i, true);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  this.rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#eef5ff', transparent: true, opacity: 0, depthWrite: false }));
  this.rain.frustumCulled = false;
  this.rain.visible = false;
  this.scene.add(this.rain);
  this.rainN = n;
};

World.prototype.resetDrop = function (pos, i, anyY) {
  const t = this.target || new THREE.Vector3(16, 0, 9);
  const x = t.x + (Math.random() - 0.5) * 80, z = t.z + (Math.random() - 0.5) * 80;
  const y = anyY ? Math.random() * 28 : 24 + Math.random() * 6;
  pos.set([x, y, z, x - 0.18, y - 1.5, z - 0.08], i * 6);
};

World.prototype.updateRain = function (dt, on) {
  this.rainK += ((on ? 1 : 0) - this.rainK) * Math.min(1, dt * 0.8);
  const vis = this.rainK > 0.02;
  this.rain.visible = vis;
  if (!vis) return;
  this.rain.material.opacity = 0.9 * this.rainK;
  const pos = this.rain.geometry.attributes.position.array;
  const fall = 34 * dt;
  for (let i = 0; i < this.rainN; i++) {
    const k = i * 6;
    pos[k + 1] -= fall; pos[k + 4] -= fall;
    pos[k] -= fall * 0.13; pos[k + 3] -= fall * 0.13;
    if (pos[k + 4] < 0) {
      if (Math.random() < 0.02 * this.rainK) this.puff(new THREE.Vector3(pos[k], 0.15, pos[k + 2]), '#dfe9ff', 0.08, 0.6, 0.25);
      this.resetDrop(pos, i, false);
    }
  }
  this.rain.geometry.attributes.position.needsUpdate = true;
};

// Funcionários contratados circulando pela oficina com o uniforme.
World.prototype.syncStaff = function (state) {
  this.staffState = state;
  const want = (state.staff || []).map((m) => m.role + ':' + m.name + ':' + state.uniform).join('|');
  if (want === this.staffSig) return;
  this.staffSig = want;
  for (const sv of this.staffViews) this.scene.remove(sv.p);
  this.staffViews = (state.staff || []).map((m, i) => {
    const p = buildPerson({ shirt: state.uniform, pants: '#26344f', skin: m.skin, hair: m.hair, hat: i % 2 ? state.uniform : null, tool: true });
    p.position.set(4 + i * 3, 0.12, LOT_D - 2);
    this.scene.add(p);
    return { p, goal: null, wait: Math.random() * 2, ph: Math.random() * 6 };
  });
};

World.prototype.updateStaff = function (dt) {
  const st = this.staffState;
  if (!st || this.visit) { for (const sv of this.staffViews) sv.p.visible = !this.visit; return; }
  for (const sv of this.staffViews) {
    const p = sv.p;
    p.visible = true;
    if (sv.wait > 0) { sv.wait -= dt; animatePerson(p, this.time + sv.ph, 'idle'); continue; }
    if (!sv.goal) {
      for (let k = 0; k < 10; k++) {
        const x = Math.floor(Math.random() * st.lotW), z = Math.floor(Math.random() * GRID_H);
        // Só para em lugar livre (fora das entradas dos boxes, onde os carros passam).
        if (canPlace(st, 'arvore', x, z)) { sv.goal = { x: (x + 0.5) * TILE, z: (z + 0.5) * TILE }; break; }
      }
      if (!sv.goal) { sv.wait = 1; continue; }
    }
    const dx = sv.goal.x - p.position.x, dz = sv.goal.z - p.position.z, d = Math.hypot(dx, dz);
    if (d < 0.1) { sv.goal = null; sv.wait = 1.5 + Math.random() * 3; continue; }
    // Espera o carro passar antes de cruzar a frente dele.
    const ahead = { x: p.position.x + (dx / d) * 0.7, z: p.position.z + (dz / d) * 0.7, ux: dx / d, uz: dz / d, hl: 0.4, hw: 0.3 };
    sv.waiting = (this.carBodies || []).some((b) => hit(ahead, b));
    if (sv.waiting) { animatePerson(p, this.time + sv.ph, 'idle'); continue; }
    const step = Math.min(d, 1.6 * dt);
    p.position.x += (dx / d) * step; p.position.z += (dz / d) * step;
    p.rotation.y = lerpAngle(p.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 8));
    animatePerson(p, this.time * 1.1 + sv.ph, 'walk');
  }
};

// Modo visita: mostra a oficina de outro jogador no lugar da sua.
World.prototype.enterVisit = function (snap) {
  this.exitVisit();
  this.visit = new THREE.Group();
  const lotW = Math.max(16, Math.min(MAX_W, snap.lotW || 16));
  this.buildLotInto(this.visit, lotW);
  for (const b of snap.buildings || []) {
    if (!BUILDINGS[b.type]) continue;
    const g = buildBuilding(b.type, Math.max(1, Math.min(5, b.level || 1)), snap.uniform || null);
    g.position.copy(tileCenter(b.type, b.x, b.z));
    this.visit.add(g);
    if (b.type === 'showroom' && g.userData.slots) {
      (snap.cars || []).slice(0, 3).forEach((c, i) => {
        const sl = g.userData.slots[i];
        const car = buildCar(c, { driver: false });
        car.position.set(sl.x, 0.44, sl.z);
        car.rotation.y = sl.r * Math.PI;
        car.scale.setScalar(0.72);
        g.add(car);
      });
    }
  }
  // Os carros da garagem do amigo ficam estacionados na frente.
  (snap.cars || []).slice(0, 4).forEach((c, i) => {
    const car = buildCar(c, { driver: false });
    car.position.set(5 + i * 5.5, 0, LOT_D + 3.2);
    car.rotation.y = Math.PI / 2;
    this.visit.add(car);
  });
  const own = [this.lotGroup, this.lanesGroup, this.trackGroup, ...[...this.buildViews.values()].flatMap((v) => [v.g, v.scaffold].filter(Boolean)), ...[...this.carViews.values()].map((v) => v.g), ...this.leaving.map((v) => v.g)];
  this.hiddenForVisit = own.filter((o) => o && o.visible);
  for (const o of this.hiddenForVisit) o.visible = false;
  if (snap.track) { const t = buildTrack(TRACK_PATH); this.visit.add(t); }
  this.scene.add(this.visit);
  this.saved = this.saved || { target: this.target.clone(), zoom: this.zoomTarget };
  this.panTo(new THREE.Vector3(lotW, 0, LOT_D / 2 - 1), 0.85);
};

World.prototype.exitVisit = function () {
  if (!this.visit) return;
  this.scene.remove(this.visit);
  this.visit = null;
  for (const o of this.hiddenForVisit || []) o.visible = true;
  this.hiddenForVisit = null;
  this.unfocus();
};

World.prototype.clearTraffic = function () {
  for (const t of this.traffic) this.scene.remove(t.g);
  this.traffic = [];
};
