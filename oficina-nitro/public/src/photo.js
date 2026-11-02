// Estúdio de fotos: o carro num cenário caprichado, pronto para salvar ou mandar ao concurso.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildCar, mat } from './models.js';

export const BACKDROPS = [
  { id: 'estudio', name: 'Estúdio' },
  { id: 'sol', name: 'Pôr do sol' },
  { id: 'neon', name: 'Noite neon' },
  { id: 'pista', name: 'Pista' },
];
export const ANGLES = [
  { id: 'frente', name: '3/4 frente', dir: [1, 0.55, 1.25] },
  { id: 'lado', name: 'Lateral', dir: [1, 0.25, 0.05] },
  { id: 'tras', name: '3/4 traseira', dir: [0.9, 0.55, -1.25] },
  { id: 'cima', name: 'De cima', dir: [0.4, 1.6, 0.6] },
];

function gradient(stops, w = 512, h = 512, extra) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([p, col]) => grd.addColorStop(p, col));
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  extra?.(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class PhotoStudio {
  init() {
    if (this.r) return;
    this.r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.r.setPixelRatio(1);
    this.r.toneMapping = THREE.ACESFilmicToneMapping;
    this.r.toneMappingExposure = 1.1;
    this.r.shadowMap.enabled = true;
    this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    const pm = new THREE.PMREMGenerator(this.r);
    this.env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.cam = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  }

  scene(bg) {
    const s = new THREE.Scene();
    s.environment = this.env;
    s.add(new THREE.HemisphereLight('#ffffff', '#8a90a8', bg === 'neon' ? 0.6 : 1.3));
    const sun = new THREE.DirectionalLight(bg === 'sol' ? '#ffb27a' : '#fff4e0', bg === 'neon' ? 0.8 : 2.4);
    sun.position.set(5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6;
    s.add(sun);
    let floorMat;
    if (bg === 'estudio') {
      s.background = gradient([[0, '#eaf4ff'], [1, '#bcd6f5']]);
      floorMat = mat('#f4f7fb', { r: 0.4 });
    } else if (bg === 'sol') {
      s.background = gradient([[0, '#3a2a6a'], [0.45, '#ff6f91'], [0.75, '#ffb36e'], [1, '#ffe2a0']], 512, 512, (g, w, h) => {
        g.fillStyle = 'rgba(255,240,180,.9)'; g.beginPath(); g.arc(w * 0.5, h * 0.72, 70, 0, 7); g.fill();
      });
      floorMat = mat('#4a3a5a', { r: 0.6 });
    } else if (bg === 'neon') {
      s.background = gradient([[0, '#0c0620'], [0.7, '#2a0f4a'], [1, '#ff2fa8']], 512, 512, (g, w, h) => {
        g.strokeStyle = 'rgba(255,80,220,.5)'; g.lineWidth = 2;
        for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, h * 0.62 + i * 14); g.lineTo(w, h * 0.62 + i * 14); g.stroke(); }
        for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(Math.random() * w, Math.random() * h * 0.5, 2, 2); }
      });
      floorMat = mat('#1a0f30', { r: 0.2, m: 0.5 });
      for (const [x, c] of [[-4, '#ff4fd8'], [4, '#36b8ff']]) { const l = new THREE.PointLight(c, 30, 14, 1.6); l.position.set(x, 2.5, 2); s.add(l); }
    } else {
      s.background = gradient([[0, '#8fd3f2'], [1, '#d8f0ff']]);
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d');
      for (let i = 0; i < 16; i++) for (let k = 0; k < 16; k++) { g.fillStyle = (i + k) % 2 ? '#2b2d36' : '#f4f4f4'; g.fillRect(i * 16, k * 16, 16, 16); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
      floorMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
    }
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    s.add(floor);
    return s;
  }

  render(spec, { bg = 'estudio', angle = 'frente', title = '', subtitle = '', size = 1080 } = {}) {
    this.init();
    this.r.setSize(size, size, false);
    const s = this.scene(bg);
    const car = buildCar({ ...spec, dirt: 0, rust: 0, broken: false }, { driver: false });
    car.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    s.add(car);
    const a = ANGLES.find((x) => x.id === angle) || ANGLES[0];
    const sph = new THREE.Box3().setFromObject(car).getBoundingSphere(new THREE.Sphere());
    const dist = (sph.radius * 1.25) / Math.sin((this.cam.fov * Math.PI) / 360);
    this.cam.position.copy(sph.center).addScaledVector(new THREE.Vector3(...a.dir).normalize(), dist);
    this.cam.lookAt(sph.center.clone().add(new THREE.Vector3(0, -0.15, 0)));
    this.cam.updateProjectionMatrix();
    this.r.render(s, this.cam);
    // Moldura com o nome do carro e a marca da oficina.
    const out = document.createElement('canvas');
    out.width = out.height = size;
    const g = out.getContext('2d');
    g.drawImage(this.r.domElement, 0, 0);
    const k = size / 1080;
    g.fillStyle = 'rgba(29,43,79,.78)';
    g.beginPath(); g.roundRect(30 * k, size - 150 * k, size - 60 * k, 120 * k, 28 * k); g.fill();
    g.fillStyle = '#ffffff';
    g.font = `${54 * k}px "Lilita One", sans-serif`;
    g.textBaseline = 'middle';
    g.fillText(title, 64 * k, size - 108 * k);
    g.fillStyle = '#ffd23d';
    g.font = `${32 * k}px "Lilita One", sans-serif`;
    g.fillText(subtitle, 64 * k, size - 60 * k);
    g.fillStyle = '#ff8a2a';
    g.textAlign = 'right';
    g.font = `${40 * k}px "Lilita One", sans-serif`;
    g.fillText('OFICINA NITRO', size - 64 * k, size - 90 * k);
    return out.toDataURL('image/png');
  }
}
