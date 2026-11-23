// Helpers shared by the scene files.
import * as THREE from 'three';
import {
  W, H, C, SKIES, clamp, ease, seg, lerp, rng, v3, mat, mesh, box, glowMat, setupWorld, makeTerrain, noise2, mix, shade,
  makeTree, makeWater, makeGlows, makeRevealTube, makeCalendar, makeDiya, makeGarland, makeLota, canvasTexture, metal,
} from './kit.js';

export function base(preset, opts = {}) {
  const scene = new THREE.Scene();
  const world = setupWorld(scene, preset, opts);
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 50, W / H, 0.1, 2500);
  const ups = [];
  const add = (o, parent = scene) => { parent.add(o); if (o.update) ups.push(o); return o; };
  const tick = (t) => ups.forEach((o) => o.update(t));
  return { scene, world, camera, add, tick, ups };
}

export function aimSun(world, focus, dist = 70) {
  const d = v3(...world.preset.sunDir).normalize();
  world.sun.target.position.copy(focus);
  world.sun.position.copy(focus).add(d.multiplyScalar(dist));
  world.sun.position.y = Math.max(world.sun.position.y, focus.y + 28);
}

// Piecewise eased keyframes. keys: [[time, Vector3|number], ...]
export function kf(t, keys, easing = ease.inOut) {
  if (t <= keys[0][0]) return clone(keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) {
      const u = (Array.isArray(easing) ? easing[i] : easing)(seg(t, t0, t1));
      return typeof a === 'number' ? lerp(a, b, u) : a.clone().lerp(b, u);
    }
  }
  return clone(keys[keys.length - 1][1]);
}
const clone = (x) => (typeof x === 'number' ? x : x.clone());

export function look(camera, pos, target, roll = 0) {
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(target);
  if (roll) camera.rotateZ(roll);
}

// Far river bank with beach, fields, hills and trees. Shore edge runs along x at z = edge.
export function farShore(S, { edge = -60, seed = 1, width = 700, hill = 10, trees = 70, depth = 170, sandColor = C.sand, treeBand = [4, 26], dark = 0 } = {}) {
  const r = rng(seed);
  const h = (x, z) => {
    const d = edge - z;
    if (d < 0) return -1.2;
    const beach = d < 3 ? -0.35 + d * 0.15 : 0.1 + Math.min(1, (d - 3) / 6) * 0.9;
    const hills = Math.max(0, d - 22) / 45 * hill * (0.55 + 0.45 * noise2(x * 0.35, z * 0.35, seed));
    return beach + hills + 0.35 * noise2(x * 0.8, z * 0.8, seed + 3) * Math.min(1, d / 8);
  };
  const terr = makeTerrain({
    w: width, d: depth, seg: 110, x: 0, z: edge - depth / 2 + 4, height: h,
    color: (x, y, z) => {
      const d = edge - z;
      const base = d < 3.5 ? sandColor : y > hill * 0.55 ? mix(0x6f8f58, 0x8aa070, r() * 0.5) : mix(C.grass, C.grassDark, r() * 0.7);
      return dark ? shade(base, 1 - dark) : base;
    },
  });
  S.scene.add(terr);
  for (let i = 0; i < trees; i++) {
    const x = (r() - 0.5) * width * 0.7, d = treeBand[0] + r() * (treeBand[1] - treeBand[0]), z = edge - d;
    const tr = makeTree(r, { scale: 0.9 + r() * 0.8 });
    tr.position.set(x, h(x, z) - 0.1, z);
    S.scene.add(tr);
  }
  return h;
}

export function addBirds(S, { n = 6, seed = 5, y = 14, z = -30, speed = 2.2, x0 = -30 } = {}) {
  const r = rng(seed);
  const birds = [];
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0.6, 0, 0.15, 0.05, 0, -0.2]), 3));
  wingGeo.computeVertexNormals();
  const m = new THREE.MeshBasicMaterial({ color: 0x2a2030, side: THREE.DoubleSide, fog: true });
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    const L = new THREE.Mesh(wingGeo, m), R = new THREE.Mesh(wingGeo, m);
    R.scale.x = -1; g.add(L, R);
    g.userData = { off: v3(r() * 6, r() * 3, r() * 5), ph: r() * 6 };
    S.scene.add(g); birds.push({ g, L, R });
  }
  return {
    update(t) {
      birds.forEach(({ g, L, R }, i) => {
        const o = g.userData.off;
        g.position.set(x0 + t * speed + o.x - i * 1.4, y + o.y + Math.sin(t * 0.8 + i) * 0.3, z + o.z);
        const f = Math.sin(t * 9 + g.userData.ph) * 0.6;
        L.rotation.z = f; R.rotation.z = -f;
      });
    },
  };
}

// ---------- logo frame with the wave-and-diya sketch (scenes 1 and 4) ----------
export function makeLogoFrame({ size = 4.6 } = {}) {
  const g = new THREE.Group();
  const half = size / 2, r = 0.5;
  const sh = new THREE.Shape();
  sh.moveTo(-half + r, -half); sh.lineTo(half - r, -half); sh.quadraticCurveTo(half, -half, half, -half + r);
  sh.lineTo(half, half - r); sh.quadraticCurveTo(half, half, half - r, half); sh.lineTo(-half + r, half);
  sh.quadraticCurveTo(-half, half, -half, half - r); sh.lineTo(-half, -half + r); sh.quadraticCurveTo(-half, -half, -half + r, -half);
  const pts = sh.getSpacedPoints(200).slice(0, -1).map((p) => v3(p.x, p.y, 0));
  const frameCurve = new THREE.CatmullRomCurve3(pts, true);
  const mats = [];
  const reg = (m) => { m.transparent = true; mats.push(m); return m; };
  const frameMat = reg(new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffa726, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.35, flatShading: true }));
  g.add(mesh(new THREE.TubeGeometry(frameCurve, 240, 0.1, 6, true), frameMat, { shadow: false }));
  const panelMat = reg(new THREE.MeshBasicMaterial({ color: 0x0a1630, opacity: 0.5, depthWrite: false }));
  panelMat.userData.base = 0.5;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(size - 0.15, size - 0.15), panelMat);
  panel.position.z = -0.05; g.add(panel);
  const glows = makeGlows(Array.from({ length: 28 }, (_, i) => ({ p: frameCurve.getPointAt(i / 28), size: 1.4, color: 0xffb347, phase: i })), { flicker: 0.5 });
  g.add(glows);

  const curves = [];
  for (let k = 0; k < 3; k++) {
    const y = -0.62 - k * 0.42, p = [];
    for (let i = 0; i <= 40; i++) { const x = -1.5 + (i / 40) * 3; p.push(v3(x, y + 0.13 * Math.sin(x * Math.PI * 1.25 + k * 0.7), 0.05)); }
    curves.push(new THREE.CatmullRomCurve3(p));
  }
  const bowl = [];
  for (let i = 0; i <= 24; i++) { const th = Math.PI + (i / 24) * Math.PI; bowl.push(v3(1.15 * Math.cos(th), 0.08 + 0.52 * Math.sin(th), 0.05)); }
  bowl.push(v3(1.5, 0.24, 0.05), v3(0.6, 0.12, 0.05), v3(-0.4, 0.1, 0.05), v3(-1.15, 0.08, 0.05));
  curves.push(new THREE.CatmullRomCurve3(bowl));
  curves.push(new THREE.CatmullRomCurve3([v3(0, 0.3, 0.05), v3(0.42, 0.62, 0.05), v3(0.3, 1.1, 0.05), v3(0, 1.62, 0.05), v3(-0.3, 1.1, 0.05), v3(-0.42, 0.62, 0.05)], true));
  const cols = [C.riverLight, C.riverLight, C.riverLight, C.saffron, 0xffd54f];
  const tubes = curves.map((c, i) => {
    const m = reg(new THREE.MeshStandardMaterial({ color: cols[i], emissive: cols[i], emissiveIntensity: 1.5, flatShading: true }));
    const t = makeRevealTube(c, { radius: 0.07, segments: 160, radial: 6, material: m });
    t.castShadow = false; g.add(t); return t;
  });

  // pencil: tip at origin, body along +y
  const pencil = new THREE.Group();
  const pb = new THREE.Group();
  pb.add(mesh(new THREE.ConeGeometry(0.04, 0.12, 6).rotateX(Math.PI).translate(0, 0.06, 0), mat(0x333333)));
  pb.add(mesh(new THREE.ConeGeometry(0.1, 0.32, 6).rotateX(Math.PI).translate(0, 0.28, 0), mat(0xe8c39e)));
  pb.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.9, 6).translate(0, 1.39, 0), mat(0xffc107)));
  pb.add(mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.16, 8).translate(0, 2.42, 0), metal(0xc0c0c0)));
  pb.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8).translate(0, 2.6, 0), mat(0xf48fb1)));
  pb.rotation.set(0.45, 0, -0.55);
  pencil.add(pb); g.add(pencil);

  g.setSketch = (p) => tubes.forEach((tb, i) => tb.reveal(clamp(p - i)));
  g.pencilAt = (p) => {
    const i = Math.min(4, Math.floor(clamp(p, 0, 4.999)));
    return tubes[i].curve.getPointAt(clamp(p - i));
  };
  g.pencil = pencil;
  g.setOpacity = (a) => mats.forEach((m) => { m.opacity = a * (m.userData.base ?? 1); });
  g.glows = glows;
  g.update = (t) => glows.update(t);
  g.sketchPoints = () => curves.flatMap((c) => c.getSpacedPoints(30)).concat(frameCurve.getSpacedPoints(60));
  return g;
}

// ---------- maps ----------
export const LON0 = 78.2, LAT0 = 18.5, COSL = Math.cos((18.5 * Math.PI) / 180);
export const proj = (lon, lat) => [(lon - LON0) * COSL, -(lat - LAT0)];

function inPoly(x, z, ring) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins;
  }
  return ins;
}

export function buildMap(map, { heights = {}, colors = {}, defaultH = 0.14, defaultColor = 0xdccdb0, borders = true, seed = 2 } = {}) {
  const g = new THREE.Group();
  const r = rng(seed);
  const regions = [];
  const extrude = (ring, h, color) => {
    const pr = ring.map(([lo, la]) => proj(lo, la));
    const shape = new THREE.Shape(pr.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const m = mesh(geo, mat(color, { roughness: 0.9 }));
    g.add(m);
    if (borders) {
      const lg = new THREE.BufferGeometry().setFromPoints(pr.map(([x, z]) => v3(x, h + 0.004, z)));
      g.add(new THREE.LineLoop(lg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })));
    }
    return { ring: pr, h, mesh: m };
  };
  map.india.forEach((ring) => regions.push({ name: 'India', ...extrude(ring, 0.06, 0xcbbd9c), prio: 0 }));
  for (const [name, rings] of Object.entries(map.states)) {
    const h = heights[name] ?? defaultH;
    const c = colors[name] ?? mix(defaultColor, 0xc9b896, r() * 0.6);
    rings.forEach((ring) => regions.push({ name, ...extrude(ring, h, c), prio: heights[name] ? 2 : 1 }));
  }
  regions.sort((a, b) => b.prio - a.prio);
  const regionAt = (x, z) => regions.find((rg) => inPoly(x, z, rg.ring));
  const heightAt = (x, z) => regionAt(x, z)?.h ?? 0;

  // river: densify, lift onto surface, smooth
  const raw = map.godavari.map(([lo, la]) => proj(lo, la));
  const dense = [];
  for (let i = 0; i < raw.length - 1; i++) {
    const [x0, z0] = raw[i], [x1, z1] = raw[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.04));
    for (let k = 0; k < n; k++) dense.push([lerp(x0, x1, k / n), lerp(z0, z1, k / n)]);
  }
  dense.push(raw[raw.length - 1]);
  const hs = dense.map(([x, z]) => heightAt(x, z));
  const sm = hs.map((_, i) => { let s = 0, c = 0; for (let k = -3; k <= 3; k++) { const j = i + k; if (j >= 0 && j < hs.length) { s += hs[j]; c++; } } return s / c; });
  const riverPts = dense.map(([x, z], i) => v3(x, Math.max(sm[i], hs[i]) + 0.035, z));
  const riverCurve = new THREE.CatmullRomCurve3(riverPts, false, 'centripetal');
  const placeOnMap = (lon, lat, lift = 0) => { const [x, z] = proj(lon, lat); return v3(x, heightAt(x, z) + lift, z); };
  const riverFraction = (p) => {
    let best = 0, bd = 1e9;
    for (let i = 0; i <= 600; i++) { const q = riverCurve.getPointAt(i / 600); const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (d < bd) { bd = d; best = i / 600; } }
    return best;
  };
  return { group: g, heightAt, regionAt, riverCurve, riverPts, placeOnMap, riverFraction, inPoly };
}

export function flatLabel(text, { w = 2.6, h = 0.5, color = 'rgba(255,255,255,0.85)', font = '800', family = 'Inter' } = {}) {
  const tex = canvasTexture(1024, Math.round((1024 * h) / w), (ctx, cw, ch) => {
    ctx.font = `${font} ${ch * 0.6}px ${family}`; ctx.letterSpacing = `${ch * 0.08}px`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 8;
    ctx.fillText(text, cw / 2, ch / 2);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

export function makeSea(S, { y = -0.03, color = 0x1d5f8f } = {}) {
  const w = makeWater({ w: 80, d: 80, seg: 60, color, amp: 0.012, y, freq: 3, specular: 0x9fd0ff, shininess: 40 });
  S.add(w);
  return w;
}

// ---------- calendar on a ledge (scenes 3, 9, 12) ----------
export function calendarSet(S, { pages, band, marigold = false, calX = -0.5, calW = 3.0 } = {}) {
  const ledge = box(16, 0.5, 5, mat(0xb88a5e), { pos: [0, -0.25, 0.5] });
  S.scene.add(ledge);
  S.scene.add(box(16, 0.12, 5.2, mat(0xd2a679), { pos: [0, 0.02, 0.5] }));
  const cal = makeCalendar(pages, { band, marigold, w: calW });
  const ch = cal.userData.h;
  cal.position.set(calX, ch + 0.27, -0.3);
  cal.rotation.x = -0.1;
  S.scene.add(cal);
  return cal;
}

export function scatterPetals(S, { n = 120, seed = 9, area = [-6, 6, -2, 4], top = 8, colors = [C.marigoldDeep, C.marigold, 0xff6f00] } = {}) {
  const r = rng(seed);
  const geo = new THREE.CircleGeometry(0.07, 5);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.8 }), n);
  const c = new THREE.Color(), data = [];
  for (let i = 0; i < n; i++) {
    im.setColorAt(i, c.set(colors[i % colors.length]));
    data.push({ x: lerp(area[0], area[1], r()), z: lerp(area[2], area[3], r()), ph: r() * 10, sp: 0.6 + r() * 0.6, off: r() * top });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = v3(1, 1, 1);
  im.update = (t) => {
    data.forEach((d, i) => {
      const y = top - ((d.off + t * d.sp) % top);
      e.set(t * 2 + d.ph, t * 1.3 + d.ph, 0); q.setFromEuler(e);
      m4.compose(v3(d.x + Math.sin(t * 1.5 + d.ph) * 0.4, y, d.z), q, s);
      im.setMatrixAt(i, m4);
    });
    im.instanceMatrix.needsUpdate = true;
  };
  im.update(0);
  return S.add(im);
}

export { THREE };
