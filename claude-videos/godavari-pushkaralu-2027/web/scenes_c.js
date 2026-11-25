// Scenes 14-19
import * as THREE from 'three';
import {
  W, H, C, SKIES, SAREE, clamp, ease, seg, lerp, rng, v3, mat, mesh, box, glowMat, metal, makeWater, makeGlows, makeGopuram, makeMandapam,
  makeGhat, makeTree, makeDiya, makeDiyaField, makePerson, makeCrowd, makeLota, makeGarland, makeBell, makeTerrain, noise2, mix, shade,
} from './kit.js';
import { base, aimSun, kf, look, farShore, addBirds } from './common.js';
import { riverMorning } from './scenes_a.js';

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function helmetWorker(r, x, y, z) {
  const p = makePerson(r, { female: false, color: 0xff6f00, top: 0xff8f00 });
  p.add(mesh(new THREE.SphereGeometry(0.19, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffd600), { pos: [0, 1.7, 0] }));
  p.position.set(x, y, z); p.rotation.y = r() * 6.28;
  return p;
}

function mobileCrane(color = 0xffc107) {
  const g = new THREE.Group();
  g.add(box(5, 1.2, 2.2, mat(color), { pos: [0, 1.1, 0] }));
  g.add(box(1.4, 1.3, 2.0, mat(0x37474f), { pos: [2.6, 1.6, 0] }));
  for (const x of [-1.6, 0, 1.6]) for (const z of [-1.05, 1.05]) g.add(mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 10), mat(0x212121), { pos: [x, 0.45, z], rot: [Math.PI / 2, 0, 0] }));
  const boom = new THREE.Group(); boom.position.set(-1.6, 1.9, 0); g.add(boom);
  boom.add(box(0.5, 0.5, 12, mat(color), { pos: [0, 0, -6] }));
  boom.rotation.x = 0.75;
  const hook = new THREE.Group(); g.add(hook);
  hook.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 5, 4), mat(0x333333), { pos: [0, -2.5, 0] }));
  hook.add(box(0.4, 0.4, 0.4, mat(0x455a64), { pos: [0, -5, 0] }));
  g.update = (t) => {
    g.userData.yaw = Math.sin(t * 0.35 + g.id) * 0.35;
    boom.rotation.y = g.userData.yaw;
    const tip = v3(0, 0, -12).applyEuler(new THREE.Euler(boom.rotation.x, boom.rotation.y, 0, 'YXZ')).add(boom.position);
    hook.position.copy(tip);
  };
  g.update(0);
  return g;
}

function towerCrane(h = 18, jib = 16) {
  const g = new THREE.Group();
  const y = mat(0xffc107);
  for (let i = 0; i < h; i += 2) {
    g.add(box(1.2, 2, 0.12, y, { pos: [0, i + 1, 0.6] })); g.add(box(1.2, 2, 0.12, y, { pos: [0, i + 1, -0.6] }));
    g.add(box(0.12, 2, 1.2, y, { pos: [0.6, i + 1, 0] })); g.add(box(0.12, 2, 1.2, y, { pos: [-0.6, i + 1, 0] }));
  }
  const head = new THREE.Group(); head.position.y = h; g.add(head);
  head.add(box(jib, 0.7, 0.9, y, { pos: [jib / 2 - 3, 0.6, 0] }));
  head.add(box(4, 1.2, 1.1, mat(0x9e9e9e), { pos: [-4.5, 0.4, 0] }));
  head.add(box(1.6, 1.6, 1.6, mat(0x37474f), { pos: [0, -0.5, 1.2] }));
  head.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 8, 4), mat(0x333333), { pos: [jib * 0.6, -3.6, 0] }));
  head.add(box(1.8, 0.5, 1.8, mat(0x8d6e63), { pos: [jib * 0.6, -7.7, 0] }));
  g.update = (t) => { head.rotation.y = 0.6 + Math.sin(t * 0.25 + g.id) * 0.5; };
  return g;
}

function tent(r, color) {
  const g = new THREE.Group();
  g.add(box(3, 1.4, 3, mat(color), { pos: [0, 0.7, 0] }));
  g.add(mesh(new THREE.ConeGeometry(2.4, 1.4, 4), mat(shade(color, 0.92)), { pos: [0, 2.1, 0], rot: [0, Math.PI / 4, 0] }));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), mat(0x795548), { pos: [0, 3.2, 0] }));
  g.add(box(0.5, 0.3, 0.02, mat(C.saffron), { pos: [0.25, 3.5, 0] }));
  return g;
}

function cctvPole() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 6), mat(0x9e9e9e), { pos: [0, 2.5, 0] }));
  g.add(box(0.6, 0.06, 0.06, mat(0x9e9e9e), { pos: [0.3, 5, 0] }));
  g.add(box(0.45, 0.25, 0.25, mat(0xeceff1), { pos: [0.6, 4.85, 0.1], rot: [0.3, 0.4, 0] }));
  const led = makeGlows([{ p: v3(0.75, 4.9, 0.25), size: 0.35, color: 0xff1744 }], { flicker: 0.9 });
  g.add(led); g.update = (t) => { led.update(t); led.material.uniforms.opacity.value = Math.sin(t * 6) > 0 ? 1 : 0.15; };
  return g;
}

function barricades(S, x0, x1, z, y) {
  const tex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#e53935'; x.fillRect(i * 32, 0, 32, 32); } return c; })());
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  for (let x = x0; x < x1; x += 2.2) {
    S.scene.add(box(2, 0.25, 0.08, m, { pos: [x, y + 0.85, z] }));
    S.scene.add(box(2, 0.2, 0.08, m, { pos: [x, y + 0.45, z] }));
    S.scene.add(box(0.08, 1.0, 0.5, mat(0x424242), { pos: [x - 0.95, y + 0.5, z] }));
  }
}

// ---------- 14: Dharmapuri, where the Godavari turns to flow south (Dakshina Vahini) ----------
// Built with the river's course mirrored, then flipped in x at the end: the water comes from the
// north (far), flows south toward the viewer past the ghat, then turns east (screen right).
const S14 = (h) => {
  const S = base({ ...SKIES.sunrise, sunDir: [-0.45, 0.14, -1] }, { shadowSize: 70 });
  aimSun(S.world, v3(4, 0, -8), 80);
  const center = new THREE.CatmullRomCurve3([v3(-110, 0, 15), v3(-45, 0, 14), v3(-20, 0, 12), v3(-7, 0, 7), v3(0, 0, -2), v3(3, 0, -14), v3(5, 0, -40), v3(9, 0, -90), v3(12, 0, -170)], false, 'centripetal');
  const samples = center.getSpacedPoints(500);
  const dist = (x, z) => { let b = 1e9; for (const p of samples) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
  const hw = 6.2;
  S.add(makeWater({ w: 320, d: 320, seg: 110, z: -60, amp: 0.07 }));
  const r = rng(14);
  const hf = (x, z) => { const d = dist(x, z); return -1.6 + 2.9 * smooth(hw - 0.5, hw + 3.5, d) + Math.max(0, d - 26) / 50 * 10 * (0.5 + 0.5 * noise2(x * 0.3, z * 0.3, 2)) + 0.25 * noise2(x, z, 5) * smooth(hw, hw + 6, d); };
  S.scene.add(makeTerrain({ w: 300, d: 300, seg: 150, z: -60, height: hf, color: (x, y) => (y < 0.35 ? C.sand : y > 6 ? mix(0x6f8f58, 0x86a06a, r()) : mix(C.grass, C.grassDark, r() * 0.7)) }));
  for (let i = 0; i < 150; i++) {
    const x = (r() - 0.5) * 160, z = 30 - r() * 170;
    const d = dist(x, z); if (d < hw + 5 || (x > 6 && x < 30 && z > -22 && z < 6)) continue;
    const t = makeTree(r, { scale: 1 + r() * 0.7 }); t.position.set(x, hf(x, z) - 0.1, z); S.scene.add(t);
  }
  const ghat = makeGhat({ length: 22, steps: 8, rise: 0.25, run: 0.6, top: 1.6, platform: 9 });
  ghat.rotation.y = -Math.PI / 2 + 0.1; ghat.position.set(12.4, 0, -8); S.scene.add(ghat);
  const gop = makeGopuram({ w: 7, d: 4.5, tiers: 7, seed: 21 }); gop.rotation.y = -Math.PI / 2 + 0.1; gop.position.set(24, 1.6, -9); gop.scale.setScalar(1.25); S.scene.add(gop);
  const md = makeMandapam({ w: 4, d: 4, h: 2.2, cols: 3, rows: 3 }); md.position.set(17.5, 1.6, 1.5); S.scene.add(md);
  // ghat local frame: L along its length, d down the steps (rotation -pi/2 + 0.1)
  const th = -Math.PI / 2 + 0.1, onGhat = (L, d, y) => v3(12.4 + L * Math.cos(th) + d * Math.sin(th), y, -8 - L * Math.sin(th) + d * Math.cos(th));
  const spots = [];
  for (let i = 0; i < 130; i++) {
    const L = -10 + r() * 20, step = Math.floor(r() * 6);
    spots.push({ p: onGhat(L, step * 0.6 + 0.3, 1.6 - (step + 1) * 0.25) });
  }
  for (let i = 0; i < 50; i++) spots.push({ p: onGhat(-10 + r() * 20, -0.5 - r() * 7, 1.6) });
  S.scene.add(makeCrowd(spots, { seed: 15 }));
  // flow chevrons: they run from the far (north) end toward the viewer, i.e. southward at the ghat
  const chevGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, -0.7); s.lineTo(1.1, 0.5); s.lineTo(0.75, 0.75); s.lineTo(0, 0); s.lineTo(-0.75, 0.75); s.lineTo(-1.1, 0.5); s.closePath(); const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI); return g; })();
  const NCH = 16, chev = new THREE.InstancedMesh(chevGeo, new THREE.MeshBasicMaterial({ color: 0x9be7ff, transparent: true, opacity: 0.85, depthWrite: false }), NCH);
  S.scene.add(chev);
  const sub = (u) => lerp(0.22, 0.62, u);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  const bend = v3(-1.6, 0.4, -7); // world coordinates, after the mirror
  const camKeys = [[0, v3(30, 17, 28)], [h.dur * 0.55, v3(12, 11, 16)], [h.dur, v3(7, 6.5, 12)]];
  const tgtKeys = [[0, v3(10, 0, 4)], [h.dur * 0.55, v3(-2, 0, -9)], [h.dur, v3(-14, 3.2, -8)]];
  const root = new THREE.Group(); root.scale.x = -1;
  [...S.scene.children].forEach((c) => root.add(c));
  S.scene.add(root);
  return {
    ...S,
    update(t) {
      S.tick(t);
      for (let i = 0; i < NCH; i++) {
        const u = (((i / NCH) - t * 0.05) % 1 + 1) % 1;
        const p = center.getPointAt(sub(u)), tg = center.getTangentAt(sub(u)).negate();
        q.setFromUnitVectors(v3(0, 0, -1), tg.setY(0).normalize());
        m4.compose(p.setY(0.18), q, v3(1, 1, 1).multiplyScalar(Math.sin(Math.PI * u) * 1.1));
        chev.setMatrixAt(i, m4);
      }
      chev.instanceMatrix.needsUpdate = true;
      look(S.camera, kf(t, camKeys), kf(t, tgtKeys));
    },
    callouts: [{ kind: 'label', text: 'DAKSHINA VAHINI', at: bend, show: [h.word(4) - 0.1, 1e9], bg: 'rgba(14,80,140,0.9)', border: '#9be7ff', size: 46 }],
  };
};

// ---------- 15: Sri Lakshmi Narasimha Swamy temple in lamplight ----------
const S15 = (h) => {
  const S = base('dusk', { shadowSize: 40, fogNear: 40, fogFar: 200 });
  S.world.sun.intensity = 0.5;
  S.scene.add(box(80, 0.4, 60, mat(0xc9a47a), { pos: [0, -0.2, -10] }));
  const gop = makeGopuram({ w: 9, d: 6, tiers: 8, tierH: 1.35, seed: 31, color: C.stoneLight, accent: C.deepSaffron });
  gop.position.set(0, 0, -12); gop.scale.setScalar(1.3); S.scene.add(gop);
  const wallL = box(20, 4, 1, mat(0xd8b48a), { pos: [-15, 2, -12] }), wallR = box(20, 4, 1, mat(0xd8b48a), { pos: [15, 2, -12] });
  S.scene.add(wallL, wallR);
  const md = makeMandapam({ w: 7, d: 5, h: 3.2, cols: 4, rows: 3 }); md.position.set(0, 0, -3.5); S.scene.add(md);
  for (const x of [-1.6, 0, 1.6]) { const b = makeBell(); b.position.set(x, 2.5, -1.6); b.scale.setScalar(1.1); S.scene.add(b); b.update = (t) => { b.rotation.z = Math.sin(t * 2.4 + x) * 0.12; }; S.ups.push(b); }
  for (let i = 0; i < 3; i++) S.scene.add(makeGarland(v3(-3.2 + i * 2.13, 3.6, -1.3), v3(-1.07 + i * 2.13, 3.6, -1.3), { sag: 0.6, count: 24 }));
  const ghat = makeGhat({ length: 20, steps: 10, rise: 0.3, run: 0.6, top: 0, platform: 1 }); ghat.position.z = 9; S.scene.add(ghat);
  S.add(makeWater({ w: 200, d: 100, seg: 60, y: -3.0, z: 60, amp: 0.05, color: 0x2a3d6a }));
  const lamps = [];
  for (let z = 7; z >= -1; z -= 2) for (const x of [-2.6, 2.6]) {
    S.scene.add(mesh(new THREE.CylinderGeometry(0.06, 0.14, 1.2, 6), metal(C.brass), { pos: [x, 0.6, z] }));
    lamps.push({ p: v3(x, 1.25, z), scale: 1.6 });
  }
  for (let i = 0; i < 14; i++) lamps.push({ p: v3(-6.2 + i * 0.95, 0.5, -0.7), scale: 1.4 });
  S.add(makeDiyaField(lamps, { glow: 1.8 }));
  for (const [x, z] of [[-2.5, 3], [2.5, 3], [0, -3]]) { const l = new THREE.PointLight(0xffa040, 22, 16, 1.6); l.position.set(x, 2.2, z); S.scene.add(l); }
  for (const x of [-5, 5]) {
    const sp = new THREE.SpotLight(0xffa850, 240, 60, 0.38, 0.6, 1.4); sp.position.set(x * 1.6, 0.5, -3); sp.target.position.set(x * 0.2, 16, -12);
    S.scene.add(sp, sp.target);
  }
  const r = rng(16), walkers = [];
  for (let i = 0; i < 14; i++) {
    const p = makePerson(r); p.userData = { x: (r() - 0.5) * 3.2, z0: 14 + r() * 4, sp: 0.55 + r() * 0.25, off: r() * 9 };
    p.rotation.y = Math.PI; S.scene.add(p); walkers.push(p);
  }
  return {
    ...S, env: 0.25,
    update(t) {
      S.tick(t);
      walkers.forEach((p) => {
        const u = p.userData; const z = u.z0 - ((u.off + t * u.sp) % 15);
        const d = z - 9; const y = d > 0 ? -Math.floor(d / 0.6 + 1) * 0.3 : 0;
        p.position.set(u.x, y + Math.abs(Math.sin(t * 6 + u.off)) * 0.04, z);
      });
      const k = ease.inOut(seg(t, 0.2, h.dur));
      look(S.camera, v3(0, lerp(1.9, 1.6, k), lerp(14.5, 13.5, k)), v3(0, lerp(3.4, 14, k), lerp(-4, -12, k)));
    },
  };
};

// ---------- 16: Rs 226 crore, 470 m of new ghats ----------
const S16 = (h) => {
  const S = base('golden', { shadowSize: 60 });
  aimSun(S.world, v3(0, 0, -2), 80);
  S.add(makeWater({ w: 300, d: 200, seg: 90, z: 80, amp: 0.07 }));
  const r = rng(17);
  S.scene.add(makeTerrain({ w: 300, d: 120, seg: 80, z: -62, height: (x, z) => 1.75 + Math.max(0, -20 - z) / 30 * 6 * (0.6 + 0.4 * noise2(x * 0.3, z * 0.3, 3)) + 0.1 * noise2(x, z, 1), color: () => mix(0xc8b07e, C.grass, r() * 0.6) }));
  S.scene.add(makeTerrain({ w: 300, d: 8, seg: 80, z: 1.5, height: (x, z) => -0.6 + (2 - z) * 0.55 + 0.15 * noise2(x, z, 4), color: () => mix(0x9c7b52, 0xb08a5a, r()) }));
  for (let i = 0; i < 40; i++) { const t = makeTree(r, { scale: 1.2 }); const x = -60 + r() * 120, z = -12 - r() * 25; t.position.set(x, 1.75, z); S.scene.add(t); }
  const NSEG = 34, segW = 2.4, x0 = -NSEG * segW / 2;
  const segs = [];
  for (let i = 0; i < NSEG; i++) {
    const g = makeGhat({ length: segW + 0.02, steps: 8, rise: 0.24, run: 0.55, top: 1.8, platform: 5, color: i % 2 ? 0xe5c39a : 0xdcb88c });
    g.position.set(x0 + (i + 0.5) * segW, 0, 0); S.scene.add(g); segs.push(g);
  }
  const tB0 = 0.2, tB1 = h.dur * 0.82;
  const segT = (i) => lerp(tB0, tB1, i / NSEG);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 2 });
  const line = mesh(new THREE.BoxGeometry(1, 0.16, 0.16), lineMat, { shadow: false }); S.scene.add(line);
  const ticks = [];
  for (let i = 0; i <= NSEG; i++) { const tk = mesh(new THREE.BoxGeometry(0.1, i % 5 === 0 ? 0.9 : 0.45, 0.1), lineMat, { shadow: false }); tk.position.set(x0 + i * segW, 3.0, 0.4); S.scene.add(tk); ticks.push(tk); }
  const head = makeGlows([{ p: v3(), size: 1.8, color: 0xffd54f }], { flicker: 0.2 }); S.add(head);
  const c1 = mobileCrane(); c1.position.set(-6, 1.8, -6); S.add(c1);
  const c2 = mobileCrane(0xffb300); c2.position.set(16, 1.8, -7); c2.rotation.y = 0.4; S.add(c2);
  for (let i = 0; i < 14; i++) S.scene.add(helmetWorker(r, -30 + r() * 60, 1.8, -1.5 - r() * 3));
  for (let i = 0; i < 16; i++) S.scene.add(mesh(new THREE.ConeGeometry(0.2, 0.55, 8), mat(0xff6d00), { pos: [-36 + i * 4.6, 2.07, -0.4] }));
  for (let i = 0; i < 5; i++) S.scene.add(mesh(new THREE.ConeGeometry(1.6, 1.2, 7), mat(0xc2a27a), { pos: [-28 + i * 14, 2.3, -9] }));
  const linePt = new THREE.Vector3();
  return {
    ...S,
    update(t) {
      S.tick(t);
      let headX = x0;
      segs.forEach((g, i) => { const k = ease.out(seg(t, segT(i), segT(i) + 0.5)); g.position.y = -3.2 * (1 - k); g.visible = k > 0.001; if (k > 0.5) headX = x0 + (i + 1) * segW; });
      line.scale.x = Math.max(0.01, headX - x0); line.position.set((headX + x0) / 2, 3.0, 0.4);
      ticks.forEach((tk, i) => { tk.visible = x0 + i * segW <= headX + 0.01; });
      head.position.set(headX, 3.0, 0.4);
      const x = lerp(-15, 13, ease.inOut(seg(t, 0, h.dur)));
      linePt.set(clamp(x + 1.5, x0, headX), 3.0, 0.4);
      look(S.camera, v3(x, 9.5, 21), v3(x + 1.5, 2.6, -2));
    },
    callouts: [{ kind: 'label', text: '470 M NEW GHATS', at: () => linePt.clone().add(v3(0, -1.9, 3.2)), show: [h.word(4) - 0.1, 1e9], bg: 'rgba(245,124,0,0.95)', border: '#ffe082', size: 48 }],
  };
};

// ---------- 17: Rs 1,000 crore works on Kumbh Mela lines ----------
const S17 = (h) => {
  const S = base('golden', { shadowSize: 90 });
  aimSun(S.world, v3(0, 0, -8), 90);
  S.add(makeWater({ w: 300, d: 200, seg: 90, z: 82, amp: 0.07 }));
  const r = rng(18);
  S.scene.add(makeTerrain({ w: 300, d: 140, seg: 70, z: -68, height: (x, z) => 1.75 + Math.max(0, -45 - z) / 30 * 7 * (0.6 + 0.4 * noise2(x * 0.3, z * 0.3, 7)), color: () => mix(0xcdb488, 0xb89c70, r()) }));
  const ghat = makeGhat({ length: 120, steps: 8, rise: 0.24, run: 0.55, top: 1.8, platform: 6 }); S.scene.add(ghat);
  barricades(S, -40, 40, -4.5, 1.8);
  for (let x = -36; x <= 36; x += 12) { const p = cctvPole(); p.position.set(x, 1.8, -5.2); S.add(p); }
  const tc = [0xffffff, 0xfff3e0, C.saffron, 0x90caf9];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) { const t = tent(r, tc[(i + j) % tc.length]); t.position.set(-34 + i * 7.5 + (j % 2) * 2, 1.8, -12 - j * 5.5); S.scene.add(t); }
  const t1 = towerCrane(20, 18); t1.position.set(-22, 1.8, -7.5); S.add(t1);
  const t2 = towerCrane(16, 14); t2.position.set(20, 1.8, -8); S.add(t2);
  const mc = mobileCrane(); mc.position.set(4, 1.8, -2.5); mc.rotation.y = -0.3; S.add(mc);
  for (let i = 0; i < 18; i++) S.scene.add(helmetWorker(r, -36 + r() * 72, 1.8, -1 - r() * 2.8));
  for (let i = 0; i < 4; i++) {
    const tr = new THREE.Group(); tr.add(box(3.2, 1.4, 1.8, mat(0x1e88e5), { pos: [0, 1.2, 0] })); tr.add(box(1.2, 1.4, 1.8, mat(0xeceff1), { pos: [2.2, 1.2, 0] }));
    for (const x of [-1, 1.8]) for (const z of [-0.9, 0.9]) tr.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8), mat(0x212121), { pos: [x, 0.4, z], rot: [Math.PI / 2, 0, 0] }));
    tr.position.set(-30 + i * 18, 1.8, -36); S.scene.add(tr);
  }
  for (let i = 0; i < 30; i++) { const t = makeTree(r, { scale: 1.2 }); t.position.set(-70 + r() * 140, 1.75, -40 - r() * 30); S.scene.add(t); }
  return {
    ...S,
    update(t) {
      S.tick(t);
      const x = lerp(-9, 9, ease.inOut(seg(t, 0, h.dur)));
      look(S.camera, v3(x, 10.5, 22), v3(x + 2.5, 1.5, -6));
    },
  };
};

// ---------- 18: sunset, a single diya floats away ----------
const S18 = (h) => {
  const S = base({ ...SKIES.sunset, sunDir: [0.16, 0.07, -1] }, { shadow: false });
  riverMorning(S, { seed: 11 });
  S.ups.push(addBirds(S, { y: 12, z: -45, x0: 18, speed: -1.8, n: 5 }));
  const d = makeDiya({ scale: 3.2, leaf: true, glow: 2.4 }); S.add(d);
  const refl = makeGlows([{ p: v3(), size: 6, color: 0xff7a2a }], { flicker: 0.4 }); refl.material.uniforms.opacity.value = 0.45; S.add(refl);
  return {
    ...S,
    update(t) {
      S.tick(t);
      const p = v3(Math.sin(t * 0.4) * 0.4, 0.05 + 0.05 * Math.sin(t * 1.3), 2 - t * 0.9);
      d.position.copy(p); d.rotation.y = t * 0.15;
      refl.position.set(p.x, -0.05, p.z + 0.9);
      const k = ease.inOut(seg(t, 0, h.dur));
      look(S.camera, v3(lerp(0.4, 0, k), lerp(1.3, 4.4, k), lerp(5.2, 16, k)), p.clone().add(v3(0, lerp(0.5, 1.6, k), -lerp(0.3, 2, k))));
    },
  };
};

// ---------- 19: Godavari Harathi at night ----------
function harathiLamp() {
  const g = new THREE.Group(), b = metal(C.brass, { emissive: 0x5a3a00, emissiveIntensity: 0.6 });
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6), b, { pos: [0, -0.35, 0] }));
  const glows = [];
  [[0.34, 0, 12], [0.25, 0.22, 9], [0.15, 0.42, 6]].forEach(([rad, y, n]) => {
    g.add(mesh(new THREE.CylinderGeometry(rad, rad * 0.8, 0.05, 12), b, { pos: [0, y, 0] }));
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; glows.push({ p: v3(Math.cos(a) * rad * 0.9, y + 0.1, Math.sin(a) * rad * 0.9), size: 0.7, color: 0xffb040, phase: i * 1.3 }); }
  });
  glows.push({ p: v3(0, 0.66, 0), size: 1.2, color: 0xffc860 });
  const gl = makeGlows(glows, { flicker: 0.8 }); g.add(gl);
  const big = makeGlows([{ p: v3(0, 0.3, 0), size: 4.5, color: 0xff8a20 }], { flicker: 0.5 }); big.material.uniforms.opacity.value = 0.55; g.add(big);
  g.update = (t) => { gl.update(t); big.update(t); };
  return g;
}

const S19 = (h) => {
  const S = base('night', { shadow: false, fogNear: 40, fogFar: 200 });
  S.add(makeWater({ w: 300, d: 200, seg: 110, z: 70, amp: 0.05, color: 0x1a2a55, specular: 0xffa040, shininess: 60 }));
  const top = 2.2, rise = 0.25, run = 0.6;
  const ghat = makeGhat({ length: 60, steps: 9, rise, run, top, platform: 10, color: 0xc8aa88 }); ghat.position.z = -4; S.scene.add(ghat);
  const gop = makeGopuram({ w: 8, d: 5, tiers: 8, seed: 41 }); gop.position.set(0, top, -20); gop.scale.setScalar(1.4); S.scene.add(gop);
  for (const x of [-6, 6]) { const sp = new THREE.SpotLight(0xffa850, 380, 70, 0.4, 0.6, 1.3); sp.position.set(x, top + 0.5, -12); sp.target.position.set(0, 18, -20); S.scene.add(sp, sp.target); }
  const r = rng(19);
  const stepY = (i) => top - (i + 1) * rise, stepZ = (i) => -4 + i * run + run / 2;
  const spots = [];
  for (let i = 0; i < 420; i++) { const st = Math.floor(r() * 4); spots.push({ p: v3((r() - 0.5) * 40, st < 0 ? top : stepY(st), stepZ(st) - (st === 0 ? r() * 6 : 0)), color: [0x6d4c41, 0x8d6e63, 0x5d4037, 0xa1887f, 0x795548][i % 5] }); }
  S.scene.add(makeCrowd(spots.filter((s) => Math.abs(s.p.x) > 1.5 || s.p.z < -2), { seed: 20 }));
  const priests = [];
  [-6, -3, 0, 3, 6].forEach((x, i) => {
    S.scene.add(box(1.5, 0.5, 1.5, mat(0xd7b890), { pos: [x, stepY(6) + 0.25, stepZ(6) + 0.2] }));
    const p = makePerson(r, { female: false, dhoti: true, top: C.saffron, skin: 0x9a6a45 });
    p.position.set(x, stepY(6) + 0.5, stepZ(6) + 0.2); S.scene.add(p);
    const lamp = harathiLamp(); S.add(lamp);
    const light = new THREE.PointLight(0xff9a40, 10, 9, 1.6); S.scene.add(light);
    priests.push({ p, lamp, light, ph: i * 0.35 });
  });
  const dl = [];
  for (let i = 0; i < 9; i++) if (i !== 6) for (let x = -28; x <= 28; x += 1.3) if (stepY(i) > 0.05) dl.push({ p: v3(x + (i % 2) * 0.6, stepY(i), stepZ(i) + 0.22), scale: 1.2 });
  S.add(makeDiyaField(dl, { glow: 1.4 }));
  const fl = [], refl = [];
  for (let i = 0; i < 70; i++) { const d = makeDiya({ scale: 1.6, leaf: true, glow: 1.6 }); d.userData = { x: -18 + r() * 36, z: 2.5 + r() * 14, ph: r() * 6 }; S.add(d); fl.push(d); refl.push({ p: v3(d.userData.x, -0.05, d.userData.z + 0.5), size: 2.4, color: 0xc05a20, phase: i }); }
  const rg = makeGlows(refl, { flicker: 0.6 }); rg.material.uniforms.opacity.value = 0.5; S.add(rg);
  return {
    ...S, env: 0.15,
    update(t) {
      S.tick(t);
      priests.forEach(({ p, lamp, light, ph }) => {
        const a = t * 1.6 + ph;
        const lp = p.position.clone().add(v3(0.25 + Math.sin(a) * 0.55, 1.85 + Math.cos(a) * 0.55, 0.55));
        lamp.position.copy(lp); light.position.copy(lp).add(v3(0, 0.4, 0.6));
        p.armR.rotation.set(-2.2 - Math.cos(a) * 0.45, 0, -0.35 + Math.sin(a) * 0.3);
        p.armL.rotation.set(-0.9, 0, 0.3);
      });
      fl.forEach((d) => { const u = d.userData; d.position.set(u.x + t * 0.12, 0.05 + 0.04 * Math.sin(t + u.ph), u.z); });
      const phi = lerp(-0.42, 0.32, ease.inOut(seg(t, 0, h.dur)));
      const R = 12.5;
      look(S.camera, v3(Math.sin(phi) * R, 3.3, 1 + Math.cos(phi) * R), v3(0, 2.6, -1.5));
    },
    lowerThird: { text: 'Logo contest - last date 30 Nov, 5 PM', at: 0.9 },
  };
};

export const SCENES_C = { 14: S14, 15: S15, 16: S16, 17: S17, 18: S18, 19: S19 };
