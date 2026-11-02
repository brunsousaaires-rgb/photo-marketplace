// Miniaturas 3D (peças, construções, carros) e o visualizador giratório da garagem.
import * as THREE from 'three';
import { buildCar, buildBuilding, buildWheelModel, mat } from './models.js';

const BASE_CAR = { type: 'esportivo', color: 'azul', wheels: 'padrao', spoiler: 'nenhum', neon: 'nenhum', decal: 'nenhum' };

function stage() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a90a8', 1.7));
  const d = new THREE.DirectionalLight('#fff4e0', 2.4);
  d.position.set(4, 8, 6);
  scene.add(d);
  return scene;
}

function renderer(opts = {}) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, ...opts });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.1;
  return r;
}

export class Thumbs {
  constructor() {
    this.cache = new Map();
    this.r = null;
  }

  init() {
    this.r = renderer({ preserveDrawingBuffer: true });
    this.r.setPixelRatio(1);
    this.scene = stage();
    this.cam = new THREE.PerspectiveCamera(26, 1, 0.1, 300);
  }

  shot(key, make, dir = [1, 0.8, 1], size = 168, pad = 1.04) {
    if (this.cache.has(key)) return this.cache.get(key);
    try {
      if (!this.r) this.init();
      const obj = make();
      this.r.setSize(size, size, false);
      this.scene.add(obj);
      const sph = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
      const dist = (sph.radius * pad) / Math.sin((this.cam.fov * Math.PI) / 360);
      this.cam.position.copy(sph.center).addScaledVector(new THREE.Vector3(...dir).normalize(), dist);
      this.cam.lookAt(sph.center);
      this.cam.updateProjectionMatrix();
      this.r.render(this.scene, this.cam);
      const url = this.r.domElement.toDataURL('image/png');
      this.scene.remove(obj);
      this.cache.set(key, url);
      return url;
    } catch {
      return '';
    }
  }

  building(type) {
    return this.shot('b:' + type, () => buildBuilding(type, 1), [1, 0.85, 1.15]);
  }

  part(kind, id) {
    switch (kind) {
      case 'wheels':
        return this.shot('w:' + id, () => buildWheelModel(id), [1, 0.3, 0.5], 128);
      case 'spoiler':
        return this.shot('s:' + id, () => buildCar({ ...BASE_CAR, spoiler: id }, { driver: false }), [0.9, 0.75, -1.35], 128);
      case 'neon':
        return this.shot('n:' + id, () => {
          const g = new THREE.Group();
          const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.05, 32), mat('#1d2b4f', { r: 0.9 }));
          g.add(disc, buildCar({ ...BASE_CAR, color: 'preto', neon: id }, { driver: false }));
          return g;
        }, [1, 1.0, 1.1], 128);
      case 'decal':
        return this.shot('d:' + id, () => buildCar({ ...BASE_CAR, decal: id }, { driver: false }), [1, 0.85, 0.55], 128);
      default:
        return '';
    }
  }

  car(spec) {
    const s = { type: spec.type, color: spec.color, wheels: spec.wheels, spoiler: spec.spoiler, neon: spec.neon, decal: spec.decal, rust: spec.rust || 0 };
    return this.shot('c:' + JSON.stringify(s), () => buildCar(s, { driver: false }), [1, 0.7, 1.25], 168);
  }
}

// Visualizador da garagem: carro girando num palco, arrastar para girar.
export class Viewer {
  constructor() {
    this.r = null;
    this.raf = 0;
  }

  mount(el, spec) {
    if (!this.r) {
      this.r = renderer();
      this.scene = stage();
      this.cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.3, 48), mat('#e9edf3', { r: 0.4 }));
      floor.position.y = -0.15;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.06, 6, 64), mat('#36b8ff', { e: '#36b8ff', ei: 1.5 }));
      ring.rotation.x = Math.PI / 2;
      this.turn = new THREE.Group();
      this.scene.add(floor, ring, this.turn);
      const c = this.r.domElement;
      let drag = null;
      c.addEventListener('pointerdown', (e) => { drag = e.clientX; c.setPointerCapture(e.pointerId); });
      c.addEventListener('pointermove', (e) => { if (drag != null) { this.turn.rotation.y += (e.clientX - drag) * 0.012; drag = e.clientX; this.idle = 2; } });
      c.addEventListener('pointerup', () => { drag = null; });
    }
    el.appendChild(this.r.domElement);
    this.el = el;
    this.setCar(spec);
    this.idle = 0;
    const loop = () => {
      const w = this.el.clientWidth, h = this.el.clientHeight;
      if (w && h && (w !== this.w || h !== this.h)) {
        this.w = w; this.h = h;
        this.r.setSize(w, h, false);
        this.r.domElement.style.width = '100%';
        this.r.domElement.style.height = '100%';
        this.cam.aspect = w / h;
        this.cam.position.set(5.4, 3.0, 6.4).multiplyScalar(w / h < 1.2 ? 1.25 : 1);
        this.cam.lookAt(0, 0.6, 0);
        this.cam.updateProjectionMatrix();
      }
      this.idle = Math.max(0, (this.idle || 0) - 1 / 60);
      if (!this.idle) this.turn.rotation.y += 0.008;
      if (this.car && this.car.userData.pop < 1) {
        this.car.userData.pop = Math.min(1, this.car.userData.pop + 0.06);
        const k = this.car.userData.pop;
        this.car.position.y = Math.sin(k * Math.PI) * 0.5;
      }
      this.r.render(this.scene, this.cam);
      this.raf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(this.raf);
    loop();
  }

  setCar(spec) {
    if (this.car) this.turn.remove(this.car);
    this.car = buildCar(spec, { driver: false });
    this.car.userData.pop = 0;
    this.turn.add(this.car);
  }

  unmount() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.r?.domElement.remove();
    this.el = null;
  }
}
