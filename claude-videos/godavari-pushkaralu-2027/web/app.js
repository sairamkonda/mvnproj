// Page entry: exposes window.api for the recorder (render.mjs).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { W, H } from './kit.js';
import { Overlay } from './overlay.js';
import { SCENES } from './scenes.js';

const glCanvas = document.getElementById('gl');
const out = document.getElementById('out');
const ctx = out.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const overlay = new Overlay(ctx);
let data = {}, cur = null;
const v = new THREE.Vector3();

function project(p) {
  v.copy(p).project(cur.camera);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, behind: v.z > 1 };
}

function dispose(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
  });
}

window.api = {
  async load() {
    const get = (p) => fetch(p).then((r) => r.json());
    [data.spec, data.timeline, data.plan, data.map] = await Promise.all([get('/scenes.json'), get('/build/timeline.json'), get('/build/plan.json'), get('/data/map.json')]);
    await Promise.all(['400 40px Anton', '600 20px Inter', '700 20px Inter', '800 20px Inter', '700 40px "Noto Sans Telugu"']
      .map((f) => document.fonts.load(f, f.includes('Telugu') ? 'తెలుగు' : 'Aa')));
    return data.plan.scenes.map((s) => s.id);
  },
  setScene(id) {
    if (cur) dispose(cur.scene);
    const spec = data.spec.scenes.find((s) => s.id === id);
    const plan = data.plan.scenes.find((s) => s.id === id);
    const tl = data.timeline.scenes.find((s) => s.id === id);
    const words = tl.words.map((w) => ({ ...w, start: w.start + plan.lead, end: w.end + plan.lead }));
    const helpers = {
      spec, dur: plan.dur, map: data.map,
      word: (i) => words[Math.min(i, words.length - 1)].start,
      wordEnd: (i) => words[Math.min(i, words.length - 1)].end,
      speechEnd: plan.lead + tl.speech,
    };
    cur = SCENES[id](helpers);
    cur.camera.aspect = W / H; cur.camera.updateProjectionMatrix();
    if (cur.env) { cur.scene.environment = envTex; cur.scene.environmentIntensity = cur.env; }
    overlay.setScene(spec, tl.words, plan.lead, cur);
    return plan.frames;
  },
  frame(t, quality = 0.92) {
    cur.update(t);
    renderer.render(cur.scene, cur.camera);
    ctx.drawImage(glCanvas, 0, 0);
    overlay.draw(t, cur.camera, project);
    if (cur.intro) {
      const a = 1 - Math.min(1, t / cur.intro.dur);
      if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = cur.intro.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    }
    return out.toDataURL('image/jpeg', quality);
  },
};
window.ready = true;
