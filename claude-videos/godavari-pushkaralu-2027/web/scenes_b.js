// Scenes 8-13
import * as THREE from 'three';
import {
  W, H, C, SKIES, SAREE, clamp, ease, seg, lerp, rng, v3, mat, mesh, box, glowMat, metal, makeWater, makeGlows, makeGopuram, makeMandapam,
  makeGhat, makeTree, makeDiya, makeDiyaField, makePerson, makeCrowd, makeLota, makeGarland, makeTerrain, noise2, mix, shade, canvasTexture,
} from './kit.js';
import { base, aimSun, kf, look, farShore, buildMap, flatLabel, makeSea, calendarSet, scatterPetals, proj } from './common.js';
import { formatIndian } from './overlay.js';

// land behind a ghat whose top platform is at height `top`, starting at z = edge and going back
function townBehind(S, { edge = -19, top = 2.2, seed = 4, width = 300, trees = 40 } = {}) {
  const r = rng(seed);
  const hfn = (x, z) => top - 0.05 + Math.max(0, edge - 25 - z) / 40 * 9 * (0.6 + 0.4 * noise2(x * 0.3, z * 0.3, seed)) + 0.15 * noise2(x, z, seed);
  S.scene.add(makeTerrain({ w: width, d: 160, seg: 90, z: edge - 80 + 1, height: hfn, color: (x, y) => (y > top + 3 ? mix(0x6f8f58, 0x89a06a, r()) : mix(C.grass, 0xb7a274, r() * 0.5)) }));
  for (let i = 0; i < trees; i++) {
    const x = (r() - 0.5) * width * 0.5, z = edge - 4 - r() * 30;
    const t = makeTree(r, { scale: 1 + r() * 0.6 }); t.position.set(x, hfn(x, z) - 0.1, z); S.scene.add(t);
  }
  return hfn;
}

function pose(p, kind) {
  if (kind === 'folded') { p.armL.rotation.set(-1.2, 0, 0.55); p.armR.rotation.set(-1.2, 0, -0.55); }
  if (kind === 'raised') { p.armL.rotation.set(0, 0, Math.PI - 0.32); p.armR.rotation.set(0, 0, -(Math.PI - 0.32)); }
  if (kind === 'pour') {
    p.armR.rotation.set(-2.5, 0, -0.2); p.armL.rotation.set(-1.0, 0, 0.4);
    const l = makeLota(); l.position.set(0, -0.62, 0); l.rotation.x = 2.2; p.armR.add(l);
  }
  return p;
}

const S8 = (h) => {
  const S = base('golden', { shadowSize: 34 });
  aimSun(S.world, v3(0, 1, -4), 60);
  S.add(makeWater({ w: 170, d: 120, seg: 130, z: 32, amp: 0.045, freq: 1.7 }));
  const ghat = makeGhat({ length: 44, steps: 10, rise: 0.26, run: 0.62, top: 2.2, platform: 12 });
  ghat.position.z = -7; S.scene.add(ghat);
  townBehind(S, { edge: -19, top: 2.2, seed: 6 });
  const gop = makeGopuram({ w: 7, d: 4.5, tiers: 7, seed: 12 }); gop.position.set(0.5, 2.2, -32); gop.scale.setScalar(1.35); S.scene.add(gop);
  const m1 = makeMandapam({ w: 4, d: 3.5, h: 2.2, cols: 3, rows: 2 }); m1.position.set(-9, 2.2, -14); S.scene.add(m1);
  const m2 = makeMandapam({ w: 4, d: 3.5, h: 2.2, cols: 3, rows: 2 }); m2.position.set(9.5, 2.2, -15); S.scene.add(m2);
  const stepY = (i) => 2.2 - (i + 1) * 0.26, stepZ = (i) => -7 + i * 0.62 + 0.31;
  const r = rng(8);
  const people = [];
  const put = (x, i, kind, o = {}) => {
    const p = pose(makePerson(r, o), kind);
    p.position.set(x, o.y ?? stepY(i), o.z ?? stepZ(i));
    p.rotation.y = o.ry ?? (r() - 0.5) * 0.5;
    S.scene.add(p); people.push(p); return p;
  };
  put(-3.3, 3, 'folded', { color: C.saffron, female: true });
  put(-1.5, 5, 'pour', { female: false, dhoti: true });
  put(1.3, 4, 'folded', { color: 0xd81b60, female: true });
  put(3.0, 6, 'none', { color: 0x43a047, female: true });
  put(-4.9, 6, 'raised', { female: false, dhoti: true });
  put(5.4, 2, 'folded', { color: 0x8e24aa, female: true });
  put(-6.6, 1, 'none', { color: 0xfdd835, female: true });
  put(7.2, 0, 'none', { female: false, color: 0x1e88e5 });
  const dipper = put(0.4, 0, 'folded', { color: 0xfdd835, female: true, y: -0.75, z: -0.4 });
  put(-2.4, 0, 'raised', { female: false, dhoti: true, y: -0.8, z: 0.7 });
  put(3.7, 0, 'pour', { color: 0xe53935, female: true, y: -0.7, z: 0.2 });
  for (let i = 0; i < 6; i++) { const l = makeLota(); l.position.set(-6 + r() * 12, stepY(2 + Math.floor(r() * 5)), stepZ(3)); l.scale.setScalar(1.3); S.scene.add(l); }
  [-7.5, -2.5, 2.5, 7.5].forEach((x) => S.scene.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.4, 6), mat(0xc8a26a), { pos: [x, 3.9, -7.3] })));
  for (let k = 0; k < 3; k++) {
    const x0 = -7.5 + k * 5;
    S.scene.add(makeGarland(v3(x0, 5.5, -7.3), v3(x0 + 5, 5.5, -7.3), { sag: 0.9, count: 46 }));
    S.scene.add(makeGarland(v3(x0, 5.2, -7.3), v3(x0 + 5, 5.2, -7.3), { sag: 0.5, count: 40, colors: [0xffd54f, 0xff8f00] }));
  }
  const dl = [];
  for (let i = 0; i < 18; i++) dl.push({ p: v3(-8 + i * 0.95, stepY(1), stepZ(1) + 0.15), scale: 1.5 });
  S.add(makeDiyaField(dl, { glow: 1.6 }));
  const petals = new THREE.InstancedMesh(new THREE.CircleGeometry(0.09, 5).rotateX(-Math.PI / 2), mat(0xffffff), 160);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < 160; i++) { m4.makeTranslation(-8 + r() * 16, 0.12, -1.2 + r() * 6); petals.setMatrixAt(i, m4); petals.setColorAt(i, c.set(i % 2 ? C.marigoldDeep : C.marigold)); }
  S.scene.add(petals);
  const dipT = h.word(4);
  return {
    ...S, env: 0.4,
    update(t) {
      S.tick(t);
      const k = seg(t, dipT - 0.4, dipT + 1.3);
      dipper.position.y = -0.75 - 1.35 * Math.sin(Math.PI * ease.inOut(k));
      petals.position.x = Math.sin(t * 0.4) * 0.3;
      const x = lerp(-1.8, 1.8, ease.inOut(seg(t, 0, h.dur)));
      look(S.camera, v3(x, 0.55, lerp(8.2, 7.4, seg(t, 0, h.dur))), v3(x * 0.4, 2.3, -6));
    },
  };
};

const S9 = (h) => {
  const S = base('sunset', { shadowSize: 20, fogNear: 30, fogFar: 170 });
  aimSun(S.world, v3(0, 1, 0), 60);
  S.add(makeWater({ w: 400, d: 300, seg: 80, y: -3, z: -90, amp: 0.08 }));
  farShore(S, { edge: -58, seed: 15, hill: 12 });
  const ghat = makeGhat({ length: 80, steps: 8, top: -1.2, platform: 6 });
  ghat.position.set(0, 0, -60); S.scene.add(ghat);
  const r = rng(3), spots = [];
  for (let i = 0; i < 900; i++) spots.push({ p: v3(-38 + r() * 76, -1.2, -66 + r() * 5.5) });
  S.scene.add(makeCrowd(spots, { seed: 4 }));
  const pages = [10, 11, 12, 13, 14].map((d) => ({ m: 7, d, y: 2015 }));
  const cal = calendarSet(S, { pages, band: '#8e1b1b', calX: 0 });
  const d1 = makeDiya({ scale: 1.8 }); d1.position.set(-2.4, 0.08, 1.4); S.add(d1);
  const d2 = makeDiya({ scale: 1.8 }); d2.position.set(2.5, 0.08, 1.5); S.add(d2);
  S.scene.add(makeGarland(v3(-3.6, 0.12, 2.0), v3(3.6, 0.12, 2.1), { sag: -0.1, count: 60 }));
  return {
    ...S, env: 0.4,
    update(t) {
      S.tick(t);
      cal.setFlip(4 * ease.inOut(seg(t, 0.25, 2.2)));
      look(S.camera, kf(t, [[0, v3(0, 2.7, 14.2)], [h.dur, v3(0, 2.6, 13.1)]]), v3(0, 1.65, 0));
    },
  };
};

const S10 = (h) => {
  const S = base('golden', { shadowSize: 140, fogNear: 60, fogFar: 330 });
  aimSun(S.world, v3(0, 0, -40), 120);
  S.add(makeWater({ w: 60, d: 420, seg: 60, z: -100, amp: 0.08 }));
  const top = 2.4, run = 0.8, steps = 8;
  const gl = makeGhat({ length: 240, steps, rise: 0.32, run, top, platform: 18 }); gl.rotation.y = Math.PI / 2; gl.position.set(-15.2, 0, -80); S.scene.add(gl);
  const gr = makeGhat({ length: 240, steps, rise: 0.32, run, top, platform: 18 }); gr.rotation.y = -Math.PI / 2; gr.position.set(15.2, 0, -80); S.scene.add(gr);
  const r = rng(10);
  const spots = [];
  const stepYAt = (d) => { const i = Math.floor(d / run); return i < 0 ? top : top - (i + 1) * 0.32; };
  for (let i = 0; i < 7600; i++) {
    const side = r() < 0.5 ? -1 : 1;
    const z = 40 - Math.pow(r(), 0.8) * 230;
    const u = r();
    let x, y;
    if (u < 0.55) { const d = r() * steps * run; x = side * (15.2 - d); y = stepYAt(d); }
    else if (u < 0.85) { const d = -r() * 16; x = side * (15.2 - d); y = top; }
    else { x = side * (8.8 - r() * 3.5); y = -0.65; }
    spots.push({ p: v3(x, y, z) });
  }
  S.scene.add(makeCrowd(spots, { seed: 11 }));
  const um = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 0.5, 8), mat(0xffffff), 140);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < 140; i++) { const side = r() < 0.5 ? -1 : 1; m4.makeTranslation(side * (16 + r() * 12), top + 2.1, 30 - r() * 200); um.setMatrixAt(i, m4); um.setColorAt(i, c.set(SAREE[i % SAREE.length])); }
  S.scene.add(um);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 70; i++) {
      const hgt = 3 + r() * 5, z = 30 - i * 3.4;
      const b = box(4 + r() * 3, hgt, 3, mat(mix(0xf3e0c0, [0xf6c0a0, 0xc8e0f0, 0xf0e6a0, 0xe8c8e8][i % 4], 0.6)), { pos: [side * (36 + r() * 6), top + hgt / 2, z] });
      S.scene.add(b);
    }
    for (let i = 0; i < 30; i++) { const t = makeTree(r, { scale: 1.3 }); t.position.set(side * (46 + r() * 20), top, 30 - r() * 220); S.scene.add(t); }
  }
  S.scene.add(makeTerrain({ w: 400, d: 500, seg: 40, z: -120, height: (x) => (Math.abs(x) > 33 ? top - 0.05 : -5), color: () => 0xb9a67e }));
  const tC0 = 0.4, tC1 = Math.max(h.wordEnd(4), 2.6);
  return {
    ...S,
    update(t) {
      S.tick(t);
      const k = ease.inOut(seg(t, 0, h.dur));
      look(S.camera, v3(0, lerp(7, 40, k), lerp(26, 44, k)), v3(0, 0, lerp(-6, -40, k)));
    },
    drawBelow(ctx, t) {
      const k = ease.out(seg(t, tC0, tC1));
      if (t < tC0) return;
      const n = Math.round(100000000 * k);
      const txt = formatIndian(n) + (k >= 1 ? '+' : '');
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '132px Anton';
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 24;
      const g = ctx.createLinearGradient(0, 620, 0, 760); g.addColorStop(0, '#ffe7a0'); g.addColorStop(1, '#ffa62b');
      ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(30,14,0,0.85)'; ctx.lineJoin = 'round'; ctx.strokeText(txt, W / 2, 690);
      ctx.fillStyle = g; ctx.fillText(txt, W / 2, 690);
      ctx.font = '800 34px Inter'; ctx.letterSpacing = '6px'; ctx.fillStyle = '#fff'; ctx.shadowBlur = 12; ctx.fillText('HOLY DIPS IN 12 DAYS', W / 2, 785);
      ctx.restore();
    },
  };
};

const S11 = (h) => {
  const S = base('dusk', { shadow: false, fogNear: 30, fogFar: 160 });
  S.add(makeWater({ w: 300, d: 200, seg: 100, z: 60, amp: 0.05, color: 0x2a3d6a, specular: 0x9a8acf, shininess: 50 }));
  const steps = 9, rise = 0.26, run = 0.62, top = 2.4;
  const ghat = makeGhat({ length: 80, steps, rise, run, top, platform: 8, color: 0xb8a088 });
  ghat.position.z = -2; S.scene.add(ghat);
  townBehind(S, { edge: -10, top, seed: 21, trees: 30 });
  const gop = makeGopuram({ w: 7, d: 4.5, tiers: 7, seed: 5, color: 0xa89078, accent: 0x7a5a48 }); gop.position.set(-2, top, -18); gop.scale.setScalar(1.3); S.scene.add(gop);
  const r = rng(12), dl = [], refl = [];
  for (let i = 0; i < 8; i++) {
    const y = top - (i + 1) * rise; if (y < 0.05) continue;
    for (let x = -30; x <= 30; x += 0.62) {
      const p = v3(x + (r() - 0.5) * 0.08, y, -2 + i * run + 0.36);
      dl.push({ p, scale: 1.25 });
      if (i >= 4) refl.push({ p: v3(p.x, -y - 0.1, p.z + 1.2 + (top - y) * 0.4), size: 1.0, color: 0xc07030, phase: x });
    }
  }
  for (let x = -30; x <= 30; x += 0.9) dl.push({ p: v3(x, top, -2.6), scale: 1.25 });
  S.add(makeDiyaField(dl, { glow: 1.5 }));
  S.add(makeGlows(refl, { flicker: 0.6 }));
  const fl = [];
  for (let i = 0; i < 22; i++) { const d = makeDiya({ scale: 1.6, leaf: true }); d.userData = { x: -12 + r() * 24, z: 4 + r() * 6, ph: r() * 6 }; S.add(d); fl.push(d); }
  return {
    ...S,
    update(t) {
      S.tick(t);
      fl.forEach((d) => { const u = d.userData; d.position.set(u.x + t * 0.15, 0.05 + 0.04 * Math.sin(t + u.ph), u.z); });
      const x = lerp(-3.2, 3.2, ease.inOut(seg(t, 0, h.dur)));
      look(S.camera, v3(x, 2.4, 13), v3(x, 1.3, -1));
    },
  };
};

const S12 = (h) => {
  const S = base({ ...SKIES.sunrise, sunDir: [0.35, 0.18, -1] }, { shadowSize: 20, fogNear: 30, fogFar: 170 });
  aimSun(S.world, v3(0, 1, 0), 60);
  S.add(makeWater({ w: 400, d: 300, seg: 80, y: -3, z: -90, amp: 0.08 }));
  farShore(S, { edge: -58, seed: 16, hill: 14 });
  const pages = [22, 23, 24, 25].map((d) => ({ m: 6, d, y: 2027 })).concat([{ m: 6, d: 26, y: 2027, marigold: true }]);
  const cal = calendarSet(S, { pages, band: '#e8711c', calX: 0 });
  const ch = cal.userData.h;
  S.scene.add(makeGarland(v3(-1.75, ch + 0.4, 0.0), v3(1.75, ch + 0.4, 0.0), { sag: 0.7, count: 44, size: 0.1 }));
  for (const x of [-3.6, 3.6]) S.scene.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 6, 6), mat(0xc8a26a), { pos: [x, 3, -1.5] }));
  S.scene.add(makeGarland(v3(-3.6, 5.8, -1.5), v3(3.6, 5.8, -1.5), { sag: 1.1, count: 70 }));
  S.scene.add(makeGarland(v3(-3.6, 5.4, -1.5), v3(3.6, 5.4, -1.5), { sag: 0.7, count: 64, colors: [0xffd54f, 0xff8f00] }));
  for (const x of [-2.5, -1.8, 1.9, 2.6]) { const d = makeDiya({ scale: 1.7 }); d.position.set(x, 0.08, 1.5 + Math.abs(x) * 0.05); S.add(d); }
  scatterPetals(S, { n: 140, area: [-5, 5, -1, 3], top: 7 });
  return {
    ...S, env: 0.4,
    update(t) {
      S.tick(t);
      cal.setFlip(4 * ease.inOut(seg(t, 0.25, 2.2)));
      look(S.camera, kf(t, [[0, v3(0, 2.7, 14.2)], [h.dur, v3(0, 2.6, 13.1)]]), v3(0, 1.65, 0));
    },
  };
};

const S13 = (h) => {
  const S = base('golden', { shadowSize: 20 });
  makeSea(S);
  const M = buildMap(h.map, { heights: { Telangana: 0.7 }, colors: { Telangana: 0xf39a45 }, defaultH: 0.12 });
  S.add(M.group);
  const riverMat = new THREE.MeshStandardMaterial({ color: 0x6fd0ff, emissive: 0x2aa8ff, emissiveIntensity: 1.4, flatShading: true });
  S.scene.add(new THREE.Mesh(new THREE.TubeGeometry(M.riverCurve, 900, 0.06, 6, false), riverMat));
  const lab = flatLabel('TELANGANA', { w: 2.4, h: 0.4 }); lab.position.copy(M.placeOnMap(79.1, 17.5, 0.01)); S.scene.add(lab);
  const tg = M.regionAt(...proj(79, 18));
  const along = [];
  for (let i = 0; i <= 2000; i++) { const p = M.riverCurve.getPointAt(i / 2000); if (M.inPoly(p.x, p.z, tg.ring)) along.push({ p, u: i / 2000 }); }
  const r = rng(13), N = 96;
  const [dx, dz] = proj(...h.map.places.Dharmapuri);
  const pinGeo = new THREE.ConeGeometry(0.035, 0.18, 5).rotateX(Math.PI).translate(0, 0.09, 0);
  const headGeo = new THREE.SphereGeometry(0.045, 6, 4).translate(0, 0.2, 0);
  const pins = [];
  for (let i = 0; i < N; i++) {
    const a = along[Math.floor(((i + 0.5) / N) * along.length)];
    const q = M.riverCurve.getTangentAt(a.u); const side = (i % 2 ? 1 : -1) * (0.07 + r() * 0.08);
    const pos = a.p.clone().add(v3(-q.z * side, 0, q.x * side)); pos.y = 0.7;
    const g = new THREE.Group(); g.position.copy(pos);
    const col = i % 3 === 0 ? 0xffe082 : 0xff5a36;
    g.add(new THREE.Mesh(pinGeo, glowMat(col, 0.9)), new THREE.Mesh(headGeo, glowMat(col, 1.2)));
    S.scene.add(g); pins.push({ g, t: 0 });
  }
  const dp = new THREE.Group(); dp.position.set(dx, 0.7, dz);
  dp.add(new THREE.Mesh(pinGeo, glowMat(0xffd27a, 1.5)), new THREE.Mesh(headGeo, glowMat(0xffd27a, 2))); dp.scale.setScalar(1.9); S.scene.add(dp);
  const tP0 = 0.35, tP1 = Math.max(h.wordEnd(4), 2.4);
  pins.forEach((p, i) => { p.t = lerp(tP0, tP1, i / N); });
  const crowdStart = h.word(5), M2 = 420, travellers = [];
  const box3 = tg.ring.reduce((b, [x, z]) => [Math.min(b[0], x), Math.max(b[1], x), Math.min(b[2], z), Math.max(b[3], z)], [1e9, -1e9, 1e9, -1e9]);
  while (travellers.length < M2) {
    const x = lerp(box3[0], box3[1], r()), z = lerp(box3[2], box3[3], r());
    if (!M.inPoly(x, z, tg.ring)) continue;
    const target = pins[Math.floor(r() * N)].g.position;
    travellers.push({ a: v3(x, 0.78, z), b: target.clone().add(v3(0, 0.08, 0)), d: r() * 1.2 });
  }
  const tv = makeGlows(travellers.map((q) => ({ p: q.a, size: 0.28, color: 0xfff1c4 })), { flicker: 0.3 });
  S.add(tv);
  const tp = tv.geometry.attributes.position, ts = tv.geometry.attributes.psize;
  const gl = makeGlows([{ p: v3(dx, 1.2, dz), size: 2.2, color: 0xffd27a }], { flicker: 0.2 }); S.add(gl);
  const [cx, cz] = proj(79.15, 17.85);
  return {
    ...S,
    update(t) {
      S.tick(t);
      pins.forEach((p) => { const k = ease.outBack(seg(t, p.t, p.t + 0.3)); p.g.scale.setScalar(Math.max(0.001, k)); p.g.visible = k > 0.001; });
      const kd = ease.outBack(seg(t, tP0 + 0.4, tP0 + 0.8)); dp.scale.setScalar(Math.max(0.001, 1.9 * kd)); gl.visible = kd > 0.01;
      travellers.forEach((q, i) => {
        const k = ease.inOut(seg(t, crowdStart + q.d, crowdStart + q.d + 1.8));
        const p = q.a.clone().lerp(q.b, k); p.y += Math.sin(k * Math.PI) * 0.25;
        tp.setXYZ(i, p.x, p.y, p.z); ts.array[i] = t < crowdStart + q.d ? 0 : 0.32 * (1 - 0.6 * k);
      });
      tp.needsUpdate = true; ts.needsUpdate = true;
      const k = ease.inOut(seg(t, 0, h.dur));
      S.camera.up.set(0, 0, -1);
      S.camera.position.set(cx, lerp(10.5, 8.2, k), cz + lerp(6.2, 4.6, k));
      S.camera.lookAt(v3(cx, 0, cz - 0.35));
    },
  };
};

export const SCENES_B = { 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13 };
