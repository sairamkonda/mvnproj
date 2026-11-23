// Low-poly building blocks shared by all scenes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const W = 1080, H = 1920, FPS = 30;

export const C = {
  saffron: 0xff9933, deepSaffron: 0xf57c00, marigold: 0xffb300, marigoldDeep: 0xff8f00,
  gold: 0xf4c430, brass: 0xc9a227, silver: 0xc0c7d0, bronze: 0xc07a3a,
  river: 0x2378b5, riverDeep: 0x0f4f80, riverLight: 0x63b6e6,
  sand: 0xe2b57e, stone: 0xd9b48a, stoneDark: 0xb98c5e, stoneLight: 0xf0d2a8,
  clay: 0xa65a2e, leaf: 0x4f8a3c, grass: 0x86a95a, grassDark: 0x5f8a45, earth: 0xb8875a,
  cream: 0xfff3dc, white: 0xffffff, ink: 0x1b2340, red: 0xc62828, maroon: 0x8e1b1b,
};
export const SAREE = [0xe53935, 0xff9800, 0xfdd835, 0x43a047, 0x8e24aa, 0xd81b60, 0x1e88e5, 0xffffff, 0xf4511e, 0x00897b, 0xc2185b, 0xffb300];

// ---------- math helpers ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  sine: (x) => 0.5 - 0.5 * Math.cos(Math.PI * x),
};
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- materials ----------
const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!o.unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...o });
  delete m.unique;
  if (!o.unique) matCache.set(key, m);
  return m;
}
export const metal = (color, o = {}) => mat(color, { metalness: 0.85, roughness: 0.28, ...o });
export const glowMat = (color, intensity = 2) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, flatShading: true });

export function mesh(geo, material, { pos, rot, scale, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale) typeof scale === 'number' ? m.scale.setScalar(scale) : m.scale.set(...scale);
  m.castShadow = shadow; m.receiveShadow = shadow;
  return m;
}
export const box = (w, h, d, color, o) => mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? mat(color) : color, o);

// ---------- sky & lighting ----------
export const SKIES = {
  sunrise: { top: 0x4f73a8, mid: 0xf0a868, horizon: 0xffdca3, sun: 0xfff0c8, sunDir: [-0.55, 0.12, -1], fog: 0xf3c99a,
    light: 0xffc98a, lightI: 2.6, hemiSky: 0xffe2b8, hemiGround: 0x46607a, hemiI: 1.0 },
  golden: { top: 0x5d8fc7, mid: 0xf5c58a, horizon: 0xffe6b8, sun: 0xfff3d6, sunDir: [0.6, 0.25, -1], fog: 0xf7d9b0,
    light: 0xffd49a, lightI: 2.8, hemiSky: 0xfff0d0, hemiGround: 0x52708a, hemiI: 1.1 },
  sunset: { top: 0x3b3f82, mid: 0xe9744c, horizon: 0xffb066, sun: 0xffd9a0, sunDir: [0.5, 0.08, -1], fog: 0xe89a6e,
    light: 0xff9e62, lightI: 2.4, hemiSky: 0xffb48a, hemiGround: 0x3a3e6a, hemiI: 0.9 },
  dusk: { top: 0x161d48, mid: 0x5b4486, horizon: 0xd9876f, sun: 0xffb08a, sunDir: [0.3, 0.02, -1], fog: 0x6e5486,
    light: 0xa89ad8, lightI: 0.7, hemiSky: 0x7a6ab0, hemiGround: 0x1d2140, hemiI: 0.7 },
  night: { top: 0x040818, mid: 0x0b1638, horizon: 0x243064, sun: 0x000000, sunDir: [0, 0.5, -1], fog: 0x121b3e,
    light: 0x7f98ff, lightI: 0.35, hemiSky: 0x33407a, hemiGround: 0x0a0c18, hemiI: 0.45 },
};

export function makeSky(preset) {
  const p = typeof preset === 'string' ? SKIES[preset] : preset;
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(p.top) }, mid: { value: new THREE.Color(p.mid) },
      horizon: { value: new THREE.Color(p.horizon) }, sunCol: { value: new THREE.Color(p.sun) },
      sunDir: { value: new THREE.Vector3(...p.sunDir).normalize() },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 top, mid, horizon, sunCol, sunDir; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float h = d.y;
        vec3 c = mix(horizon, mid, smoothstep(0.0, 0.16, h)); c = mix(c, top, smoothstep(0.14, 0.75, h));
        c = mix(horizon*0.8, c, smoothstep(-0.2, 0.0, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunCol * (smoothstep(0.9985, 0.9992, s) * 1.6 + pow(s, 40.0) * 0.45 + pow(s, 6.0) * 0.18);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(geo, m);
  sky.frustumCulled = false; sky.renderOrder = -10;
  return sky;
}

export function setupWorld(scene, preset, { shadow = true, shadowSize = 60, lightPos, fogNear = 40, fogFar = 220 } = {}) {
  const p = typeof preset === 'string' ? SKIES[preset] : preset;
  scene.add(makeSky(p));
  scene.fog = new THREE.Fog(p.fog, fogNear, fogFar);
  const hemi = new THREE.HemisphereLight(p.hemiSky, p.hemiGround, p.hemiI);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(p.light, p.lightI);
  const d = new THREE.Vector3(...p.sunDir).normalize();
  sun.position.copy(lightPos ? v3(...lightPos) : d.clone().multiplyScalar(60).setY(Math.max(18, d.y * 60)));
  if (shadow) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = shadowSize / 2;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 200 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  }
  scene.add(sun); scene.add(sun.target);
  return { hemi, sun, preset: p };
}

// ---------- glow points (diyas, sparkles, stars) ----------
export function makeGlows(items, { additive = true, flicker = 1 } = {}) {
  const n = items.length;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
  const c = new THREE.Color();
  items.forEach((it, i) => {
    pos.set([it.p.x, it.p.y, it.p.z], i * 3);
    c.set(it.color ?? 0xffb347); col.set([c.r, c.g, c.b], i * 3);
    size[i] = it.size ?? 1; phase[i] = it.phase ?? i * 1.7;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('pcolor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('psize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { time: { value: 0 }, scale: { value: H / (2 * Math.tan((50 * Math.PI) / 360)) }, flicker: { value: flicker }, opacity: { value: 1 } },
    vertexShader: `attribute float psize; attribute float phase; attribute vec3 pcolor; uniform float time, scale, flicker;
      varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0);
        float f = 1.0 - flicker*(0.12 + 0.1*sin(time*8.0+phase) + 0.06*sin(time*21.0+phase*2.3));
        gl_PointSize = min(psize*f*scale/(-mv.z), 900.0); gl_Position = projectionMatrix*mv; vC = pcolor; vA = f; }`,
    fragmentShader: `uniform float opacity; varying vec3 vC; varying float vA;
      void main(){ vec2 d = gl_PointCoord-0.5; float r = length(d)*2.0; if(r>1.0) discard;
        float core = exp(-r*r*18.0); float halo = exp(-r*r*3.5)*0.55;
        float a = (core + halo) * smoothstep(1.0, 0.7, r) * vA * opacity;
        gl_FragColor = vec4(mix(vC, vec3(1.0,0.97,0.9), core*0.7)*a, a); }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.update = (t) => { m.uniforms.time.value = t; };
  pts.setFov = (fov) => { m.uniforms.scale.value = H / (2 * Math.tan((fov * Math.PI) / 360)); };
  return pts;
}

export function makeStars(n = 1500, seed = 7) {
  const r = rng(seed), items = [];
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI * 2, y = 0.05 + r() * 0.95, rr = Math.sqrt(1 - y * y);
    items.push({ p: v3(Math.cos(th) * rr * 600, y * 600, Math.sin(th) * rr * 600), size: 2 + r() * 5 * (r() < 0.06 ? 2.5 : 1),
      color: r() < 0.2 ? 0xffe2b0 : 0xdfe8ff, phase: r() * 50 });
  }
  return makeGlows(items, { flicker: 0.8 });
}

// ---------- water ----------
export function makeWater({ w = 200, d = 200, seg = 90, color = C.river, amp = 0.12, y = 0, x = 0, z = 0, freq = 1, speed = 1, opacity = 1, specular = 0xffe0b0, shininess = 70 } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, seg, Math.max(2, Math.round(seg * d / w))).toNonIndexed();
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const material = new THREE.MeshPhongMaterial({ color, specular, shininess, flatShading: true, transparent: opacity < 1, opacity });
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.receiveShadow = true;
  const pos = geo.attributes.position;
  m.update = (t) => {
    const a = pos.array;
    for (let i = 0; i < a.length; i += 3) {
      const px = base[i] + x, pz = base[i + 2] + z;
      a[i + 1] = amp * (Math.sin(px * 0.33 * freq + t * 1.3 * speed) + 0.7 * Math.cos(pz * 0.47 * freq + t * 0.9 * speed) + 0.35 * Math.sin((px + pz) * 0.9 * freq + t * 2.1 * speed));
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  };
  m.update(0);
  return m;
}

// ---------- terrain ----------
export function makeTerrain({ w = 200, d = 80, seg = 60, x = 0, z = 0, height = () => 0, color = () => C.grass } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, seg, Math.max(2, Math.round(seg * d / w)));
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i) + x, p.getZ(i) + z));
  const g2 = geo.toNonIndexed();
  const q = g2.attributes.position, cols = new Float32Array(q.count * 3), c = new THREE.Color();
  for (let i = 0; i < q.count; i += 3) {
    const cx = (q.getX(i) + q.getX(i + 1) + q.getX(i + 2)) / 3 + x, cy = (q.getY(i) + q.getY(i + 1) + q.getY(i + 2)) / 3, cz = (q.getZ(i) + q.getZ(i + 1) + q.getZ(i + 2)) / 3 + z;
    c.set(color(cx, cy, cz));
    for (let k = 0; k < 3; k++) cols.set([c.r, c.g, c.b], (i + k) * 3);
  }
  g2.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g2.computeVertexNormals();
  const m = new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  m.position.set(x, 0, z); m.receiveShadow = true; m.castShadow = true;
  return m;
}
export function noise2(x, z, seed = 0) {
  return Math.sin(x * 0.21 + seed) * Math.cos(z * 0.17 + seed * 1.3) + 0.5 * Math.sin(x * 0.47 + z * 0.31 + seed * 2.1) + 0.25 * Math.sin(x * 1.1 - z * 0.9 + seed);
}
export const shade = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();
export const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();

// ---------- trees ----------
export function makeTree(r, { scale = 1, kind } = {}) {
  const g = new THREE.Group();
  const k = kind ?? (r() < 0.45 ? 'palm' : 'round');
  if (k === 'palm') {
    const h = 3.2 + r() * 1.5;
    const trunk = mesh(new THREE.CylinderGeometry(0.1, 0.16, h, 5), mat(0x8a6a4a), { pos: [0, h / 2, 0] });
    trunk.rotation.z = (r() - 0.5) * 0.25;
    g.add(trunk);
    for (let i = 0; i < 7; i++) {
      const leaf = mesh(new THREE.ConeGeometry(0.28, 2.0, 3), mat(mix(C.leaf, 0x7cae4a, r())), { pos: [0, h, 0] });
      leaf.geometry = leaf.geometry.clone().translate(0, 1.0, 0);
      leaf.rotation.set(1.25 + r() * 0.3, (i / 7) * Math.PI * 2, 0, 'YXZ');
      g.add(leaf);
    }
  } else {
    const h = 1.2 + r() * 0.8;
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.18, h, 5), mat(0x7a5a3a), { pos: [0, h / 2, 0] }));
    const rad = 1.0 + r() * 0.7;
    g.add(mesh(new THREE.IcosahedronGeometry(rad, 0), mat(mix(0x4d8a3a, 0x8fb55a, r())), { pos: [0, h + rad * 0.7, 0] }));
    if (r() < 0.6) g.add(mesh(new THREE.IcosahedronGeometry(rad * 0.7, 0), mat(mix(0x5d9a40, 0x9fc060, r())), { pos: [rad * 0.6, h + rad * 0.5, 0.2] }));
  }
  g.scale.setScalar(scale);
  return g;
}

// ---------- ghat steps ----------
// Steps run along X, descending toward +Z, from y=top down past the water line.
export function makeGhat({ length = 30, steps = 9, rise = 0.24, run = 0.6, top = 1.6, color = C.stone, platform = 4, x = 0, z = 0 } = {}) {
  const g = new THREE.Group();
  const light = mat(mix(color, 0xffffff, 0.18)), dark = mat(shade(color, 0.86));
  g.add(box(length, 1.2, platform, light, { pos: [0, top - 0.6, -platform / 2] }));
  for (let i = 0; i < steps; i++) {
    const y = top - (i + 1) * rise;
    const hgt = y + 3;
    g.add(box(length, hgt, run, i % 2 ? light : dark, { pos: [0, y - hgt / 2, i * run + run / 2] }));
  }
  g.position.set(x, 0, z);
  g.userData = { topY: top, stepY: (i) => top - (i + 1) * rise, stepZ: (i) => i * run + run / 2, depth: steps * run };
  return g;
}

// ---------- gopuram (temple gateway tower) ----------
export function makeGopuram({ w = 7, d = 4.5, base = 3.2, tiers = 6, tierH = 1.25, shrink = 0.85, color = C.stoneLight, accent = C.deepSaffron, seed = 3 } = {}) {
  const g = new THREE.Group(), r = rng(seed);
  const stone = mat(color), stone2 = mat(shade(color, 0.9)), acc = mat(accent), dark = mat(0x3a2414);
  g.add(box(w * 1.08, 0.4, d * 1.08, stone2, { pos: [0, 0.2, 0] }));
  g.add(box(w, base, d, stone, { pos: [0, 0.4 + base / 2, 0] }));
  g.add(box(w * 0.26, base * 0.72, 0.2, dark, { pos: [0, 0.4 + base * 0.36, d / 2 + 0.01], shadow: false }));
  let y = 0.4 + base, cw = w, cd = d;
  const pil = new THREE.BoxGeometry(0.16, 1, 0.12);
  for (let i = 0; i < tiers; i++) {
    cw *= shrink; cd *= shrink * 0.97;
    const th = tierH * Math.pow(0.94, i);
    g.add(box(cw * 1.1, 0.18, cd * 1.1, i % 2 ? acc : stone2, { pos: [0, y + 0.09, 0] }));
    g.add(box(cw, th, cd, i % 2 ? stone : stone2, { pos: [0, y + 0.18 + th / 2, 0] }));
    const n = Math.max(3, Math.round(cw / 0.7));
    for (let k = 0; k < n; k++) {
      const px = -cw / 2 + (k + 0.5) * (cw / n);
      const ph = th * (0.55 + r() * 0.25);
      const p = mesh(pil, k % 2 ? acc : stone, { pos: [px, y + 0.18 + ph / 2 + 0.05, cd / 2 + 0.05], scale: [1, ph, 1] });
      g.add(p);
      const p2 = p.clone(); p2.position.z = -cd / 2 - 0.05; g.add(p2);
    }
    y += th + 0.18;
  }
  const vault = mesh(new THREE.CylinderGeometry(cd * 0.55, cd * 0.55, cw * 0.95, 8, 1, false, 0, Math.PI), acc, { pos: [0, y, 0], rot: [0, 0, Math.PI / 2] });
  vault.rotation.set(0, 0, Math.PI / 2); vault.rotateX(-Math.PI / 2);
  g.add(vault);
  const gold = metal(C.gold, { emissive: 0x6b4a00, emissiveIntensity: 0.4 });
  const nk = Math.max(3, Math.round(cw / 0.9));
  for (let k = 0; k < nk; k++) {
    const px = -cw * 0.4 + (k / (nk - 1)) * cw * 0.8;
    g.add(mesh(new THREE.SphereGeometry(0.16, 6, 4), gold, { pos: [px, y + cd * 0.55 + 0.1, 0] }));
    g.add(mesh(new THREE.ConeGeometry(0.1, 0.45, 6), gold, { pos: [px, y + cd * 0.55 + 0.4, 0] }));
  }
  g.userData.height = y + cd * 0.55 + 0.7;
  return g;
}

export function makeMandapam({ w = 6, d = 5, h = 2.6, cols = 4, rows = 3, color = C.stoneLight } = {}) {
  const g = new THREE.Group();
  const s = mat(color), s2 = mat(shade(color, 0.88));
  g.add(box(w + 0.6, 0.5, d + 0.6, s2, { pos: [0, 0.25, 0] }));
  const pg = new THREE.CylinderGeometry(0.16, 0.18, h, 8);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = -w / 2 + 0.3 + (i / (cols - 1)) * (w - 0.6), z = -d / 2 + 0.3 + (j / (rows - 1)) * (d - 0.6);
    g.add(mesh(pg, s, { pos: [x, 0.5 + h / 2, z] }));
    g.add(box(0.5, 0.18, 0.5, s2, { pos: [x, 0.5 + h - 0.05, z] }));
  }
  g.add(box(w + 0.9, 0.3, d + 0.9, s2, { pos: [0, 0.5 + h + 0.15, 0] }));
  g.add(box(w + 0.4, 0.35, d + 0.4, s, { pos: [0, 0.5 + h + 0.47, 0] }));
  g.userData.roofY = 0.5 + h + 0.65;
  return g;
}

// ---------- diyas ----------
const diyaProfile = [[0, 0], [0.09, 0.0], [0.15, 0.04], [0.17, 0.09], [0.15, 0.1], [0.11, 0.06], [0, 0.06]].map(([x, y]) => new THREE.Vector2(x, y));
export const diyaGeo = new THREE.LatheGeometry(diyaProfile, 8);
export const flameGeo = new THREE.ConeGeometry(0.035, 0.12, 5).translate(0, 0.06, 0);
export function makeDiya({ scale = 1, glow = 1.6, leaf = false } = {}) {
  const g = new THREE.Group();
  g.add(mesh(diyaGeo, mat(C.clay), { shadow: false }));
  const f = mesh(flameGeo, glowMat(0xffc04d, 3), { pos: [0.07, 0.08, 0], shadow: false });
  g.add(f);
  if (leaf) g.add(mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.04, 7), mat(C.leaf), { pos: [0, -0.02, 0], scale: [1, 1, 0.7], shadow: false }));
  const gl = makeGlows([{ p: v3(0.07, 0.15, 0), size: glow, color: 0xffa640 }]);
  g.add(gl);
  g.scale.setScalar(scale);
  g.update = (t) => { gl.update(t); f.scale.y = 1 + 0.15 * Math.sin(t * 13 + g.id); };
  return g;
}
// Many diyas at once (instanced).
export function makeDiyaField(list, { glow = 1.5, glowColor = 0xffa640 } = {}) {
  const g = new THREE.Group();
  const bowls = new THREE.InstancedMesh(diyaGeo, mat(C.clay), list.length);
  const flames = new THREE.InstancedMesh(flameGeo, glowMat(0xffc04d, 3), list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  const glows = [];
  list.forEach((d, i) => {
    const sc = d.scale ?? 1;
    m4.compose(d.p, q, s.setScalar(sc)); bowls.setMatrixAt(i, m4);
    m4.compose(d.p.clone().add(v3(0.07 * sc, 0.08 * sc, 0)), q, s.setScalar(sc)); flames.setMatrixAt(i, m4);
    glows.push({ p: d.p.clone().add(v3(0.07 * sc, 0.16 * sc, 0)), size: glow * sc, color: d.color ?? glowColor, phase: i * 2.3 });
  });
  g.add(bowls, flames);
  const gl = makeGlows(glows);
  g.add(gl);
  g.update = (t) => gl.update(t);
  g.glows = gl;
  return g;
}

// ---------- people ----------
const bodyGeoF = mergeGeometries([new THREE.ConeGeometry(0.3, 1.0, 7).translate(0, 0.5, 0), new THREE.CylinderGeometry(0.15, 0.2, 0.5, 7).translate(0, 1.18, 0)]);
const bodyGeoM = mergeGeometries([new THREE.CylinderGeometry(0.2, 0.24, 0.9, 7).translate(0, 0.45, 0), new THREE.CylinderGeometry(0.2, 0.2, 0.55, 7).translate(0, 1.18, 0)]);
const headGeo = new THREE.IcosahedronGeometry(0.15, 0);
export function makePerson(r, { color, top, skin, female, scale = 1, dhoti = false } = {}) {
  const g = new THREE.Group();
  female = female ?? r() < 0.55;
  color = color ?? SAREE[Math.floor(r() * SAREE.length)];
  skin = skin ?? mix(0x7a4a2a, 0xb07850, r());
  const cloth = mat(color);
  if (female) {
    g.add(mesh(new THREE.ConeGeometry(0.3, 1.0, 7).translate(0, 0.5, 0), cloth));
    g.add(mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.5, 7).translate(0, 1.18, 0), mat(top ?? mix(color, 0xffffff, 0.25))));
  } else {
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.9, 7).translate(0, 0.45, 0), mat(dhoti ? 0xfaf3e0 : color)));
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 7).translate(0, 1.18, 0), mat(top ?? (dhoti ? skin : mix(color, 0xffffff, 0.4)))));
  }
  const head = mesh(headGeo, mat(skin), { pos: [0, 1.6, 0] });
  g.add(head);
  g.add(mesh(new THREE.IcosahedronGeometry(0.155, 0), mat(0x18120e), { pos: [0, 1.66, -0.03], scale: [1, 0.75, 1] }));
  if (female) g.add(mesh(new THREE.IcosahedronGeometry(0.08, 0), mat(0x18120e), { pos: [0, 1.6, -0.15] }));
  const arm = (side) => {
    const pivot = new THREE.Group(); pivot.position.set(side * 0.22, 1.4, 0);
    pivot.add(mesh(new THREE.BoxGeometry(0.09, 0.55, 0.09).translate(0, -0.27, 0), mat(female ? skin : (dhoti ? skin : mix(color, 0xffffff, 0.4)))));
    pivot.rotation.z = side * 0.12;
    g.add(pivot); return pivot;
  };
  g.armL = arm(-1); g.armR = arm(1);
  g.scale.setScalar(scale);
  return g;
}

export function makeCrowd(spots, { seed = 1, colors = SAREE } = {}) {
  const r = rng(seed), n = spots.length;
  const g = new THREE.Group();
  const bodies = new THREE.InstancedMesh(bodyGeoF, mat(0xffffff), n);
  const bodiesM = new THREE.InstancedMesh(bodyGeoM, mat(0xffffff), n);
  const heads = new THREE.InstancedMesh(headGeo, mat(0x8a5a3a), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = v3(1, 1, 1), c = new THREE.Color();
  let nf = 0, nm = 0;
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  spots.forEach((sp, i) => {
    const sc = (sp.scale ?? 1) * (0.88 + r() * 0.2);
    q.setFromAxisAngle(v3(0, 1, 0), r() * 6.28); s.setScalar(sc);
    m4.compose(sp.p, q, s);
    const fem = r() < 0.55;
    c.set(sp.color ?? colors[Math.floor(r() * colors.length)]);
    if (fem) { bodies.setMatrixAt(nf, m4); bodies.setColorAt(nf, c); nf++; }
    else { bodiesM.setMatrixAt(nm, m4); bodiesM.setColorAt(nm, c.set(r() < 0.5 ? 0xfaf3e0 : c.getHex())); nm++; }
    m4.compose(sp.p.clone().add(v3(0, 1.6 * sc, 0)), q, s); heads.setMatrixAt(i, m4);
    heads.setColorAt(i, c.set(mix(0x5a3520, 0x9a6a45, r())));
  });
  for (let i = nf; i < n; i++) bodies.setMatrixAt(i, hidden);
  for (let i = nm; i < n; i++) bodiesM.setMatrixAt(i, hidden);
  bodies.count = nf; bodiesM.count = nm;
  [bodies, bodiesM, heads].forEach((im) => { im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; });
  g.add(bodies, bodiesM, heads);
  return g;
}

// ---------- props ----------
export function makeLota(color = C.brass) {
  const prof = [[0, 0], [0.12, 0], [0.18, 0.08], [0.2, 0.18], [0.15, 0.3], [0.09, 0.36], [0.12, 0.42], [0.1, 0.43]].map(([x, y]) => new THREE.Vector2(x, y));
  return mesh(new THREE.LatheGeometry(prof, 8), metal(color, { emissive: 0x3a2a00, emissiveIntensity: 0.25 }));
}
export function makeGarland(a, b, { sag = 0.6, count = 40, size = 0.09, colors = [C.marigoldDeep, C.marigold] } = {}) {
  const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(size, 0), mat(0xffffff), count);
  const m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    m4.makeTranslation(curve.getPoint(i / (count - 1)));
    im.setMatrixAt(i, m4); im.setColorAt(i, c.set(colors[i % colors.length]));
  }
  im.castShadow = true;
  return im;
}
export function makeBell() {
  const prof = [[0, 0.5], [0.06, 0.5], [0.1, 0.42], [0.14, 0.2], [0.22, 0.02], [0.22, 0], [0, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.Group();
  g.add(mesh(new THREE.LatheGeometry(prof, 8), metal(C.brass)));
  g.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4), mat(0x3a3a3a), { pos: [0, 0.8, 0] }));
  return g;
}
export function makeTrophy(color) {
  const g = new THREE.Group();
  const m = metal(color, { emissive: color, emissiveIntensity: 0.12 });
  const cup = [[0, 0], [0.35, 0], [0.35, 0.08], [0.1, 0.12], [0.08, 0.5], [0.15, 0.6], [0.4, 0.8], [0.45, 1.25], [0.4, 1.25], [0.35, 0.85], [0, 0.7]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(mesh(new THREE.LatheGeometry(cup, 10), m));
  for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.2, 0.04, 5, 10, Math.PI), m, { pos: [s * 0.45, 1.0, 0], rot: [0, 0, s * -Math.PI / 2] }));
  return g;
}

// ---------- canvas text ----------
export function canvasTexture(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
export function textPlane(text, { w = 4, h = 1, px = 512, font = 'Anton', color = '#fff', bg = null, stroke = null, weight = '' } = {}) {
  const cw = px, ch = Math.round(px * h / w);
  const tex = canvasTexture(cw, ch, (ctx) => {
    if (bg) { ctx.fillStyle = bg; roundRect(ctx, 0, 0, cw, ch, ch * 0.2); ctx.fill(); }
    let size = ch * 0.72;
    ctx.font = `${weight} ${size}px ${font}`;
    while (ctx.measureText(text).width > cw * 0.9 && size > 8) { size -= 2; ctx.font = `${weight} ${size}px ${font}`; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineWidth = size * 0.12; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(text, cw / 2, ch / 2 + size * 0.04); }
    ctx.fillStyle = color; ctx.fillText(text, cw / 2, ch / 2 + size * 0.04);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  return m;
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- calendar ----------
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
export function calendarPageTexture({ m, d, y, band = '#e8711c', marigold = false }) {
  return canvasTexture(640, 760, (ctx, w, h) => {
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = band; ctx.fillRect(0, 0, w, 190);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let s = 96; ctx.font = `${s}px Anton`;
    while (ctx.measureText(MONTHS[m - 1]).width > w * 0.86) { s -= 4; ctx.font = `${s}px Anton`; }
    ctx.fillText(MONTHS[m - 1], w / 2, 100);
    ctx.fillStyle = '#1b2340'; ctx.font = '330px Anton'; ctx.fillText(String(d), w / 2, 430);
    ctx.fillStyle = '#c2410c'; ctx.font = '96px Anton'; ctx.fillText(String(y), w / 2, 660);
    if (marigold) {
      for (let i = 0; i < 64; i++) {
        const t = i / 64, per = 2 * (w + h);
        let x, yy, L = t * per;
        if (L < w) { x = L; yy = 0; } else if (L < w + h) { x = w; yy = L - w; } else if (L < 2 * w + h) { x = w - (L - w - h); yy = h; } else { x = 0; yy = h - (L - 2 * w - h); }
        ctx.fillStyle = i % 2 ? '#ff8f00' : '#ffc107';
        ctx.beginPath(); ctx.arc(x, yy, 26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e65100'; ctx.beginPath(); ctx.arc(x, yy, 9, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6);
    }
  });
}
// pages: list of {m,d,y}; the last one is the date that stays on screen.
export function makeCalendar(pages, { band, marigold = false, w = 3.2 } = {}) {
  const h = w * 760 / 640;
  const g = new THREE.Group();
  const board = box(w + 0.3, h + 0.35, 0.12, mat(0x6d4c41), { pos: [0, -h / 2 - 0.05, -0.08] });
  g.add(board);
  const leg = box(0.15, h * 1.05, 0.12, mat(0x5d4037), { pos: [0, -h / 2 - 0.1, -0.9], rot: [-0.45, 0, 0] });
  g.add(leg);
  for (let i = 0; i < 9; i++) g.add(mesh(new THREE.TorusGeometry(0.07, 0.022, 4, 8), metal(0x9e9e9e), { pos: [-w / 2 + 0.3 + i * (w - 0.6) / 8, 0.02, 0.0], rot: [0, Math.PI / 2, 0] }));
  const geo = new THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0);
  const flips = [];
  // stack: index 0 is the first page shown (on top), last is the final date.
  pages.forEach((p, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, 0.02 + (pages.length - i) * 0.004);
    const tex = calendarPageTexture({ ...p, band: p.band ?? band, marigold: p.marigold ?? marigold });
    const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf3eadb, roughness: 0.9, side: THREE.BackSide }));
    front.receiveShadow = true; front.castShadow = true;
    pivot.add(front, back);
    g.add(pivot); flips.push(pivot);
  });
  // progress in [0, pages.length-1]: how many pages have flipped away
  g.setFlip = (progress) => {
    flips.forEach((pv, i) => {
      if (i === flips.length - 1) return;
      const k = clamp(progress - i);
      pv.rotation.x = -ease.inOut(k) * Math.PI * 0.96;
      pv.visible = k < 0.999;
    });
  };
  g.setFlip(0);
  g.userData.h = h;
  return g;
}

export function makeClock({ r = 1 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.25, 24), metal(C.brass), { rot: [Math.PI / 2, 0, 0] }));
  const face = canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b2340'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '64px Anton';
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.fillText(String(i), 256 + Math.sin(a) * 195, 256 - Math.cos(a) * 195); }
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, l = i % 5 ? 10 : 22; ctx.fillRect(0, 0, 0, 0);
      ctx.save(); ctx.translate(256, 256); ctx.rotate(a); ctx.fillRect(-2, -250, 4, l); ctx.restore(); }
  });
  g.add(mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshStandardMaterial({ map: face, roughness: 0.8 }), { pos: [0, 0, 0.13], shadow: false }));
  const hand = (len, wid, col, z) => { const p = new THREE.Group(); p.position.z = z; p.add(mesh(new THREE.BoxGeometry(wid, len, 0.03).translate(0, len / 2 - 0.08, 0), mat(col), { shadow: false })); g.add(p); return p; };
  const hh = hand(r * 0.55, 0.09, 0x1b2340, 0.16), mh = hand(r * 0.82, 0.06, 0x1b2340, 0.18);
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8), metal(C.gold), { pos: [0, 0, 0.2], rot: [Math.PI / 2, 0, 0] }));
  g.setTime = (hours) => { mh.rotation.z = -(hours % 1) * Math.PI * 2; hh.rotation.z = -((hours % 12) / 12) * Math.PI * 2; };
  g.setTime(5);
  return g;
}

export function makeEnvelope() {
  const g = new THREE.Group();
  g.add(box(1.4, 0.9, 0.05, mat(0xfff8e7)));
  const s = new THREE.Shape(); s.moveTo(-0.7, 0.45); s.lineTo(0.7, 0.45); s.lineTo(0, -0.1); s.closePath();
  g.add(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }), mat(0xf2e3c6), { pos: [0, 0, 0.026] }));
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 10), mat(C.red), { pos: [0, -0.08, 0.05], rot: [Math.PI / 2, 0, 0] }));
  return g;
}

// ---------- tube that can be revealed progressively ----------
export function makeRevealTube(curve, { radius = 0.05, segments = 300, radial = 6, material } = {}) {
  const geo = new THREE.TubeGeometry(curve, segments, radius, radial, false);
  const m = new THREE.Mesh(geo, material);
  const total = geo.index.count;
  m.reveal = (f) => { geo.setDrawRange(0, Math.floor((total * clamp(f)) / (radial * 6)) * radial * 6); m.visible = f > 0.001; };
  m.curve = curve;
  m.reveal(1);
  return m;
}

// ---------- camera helper ----------
export function camLook(cam, pos, target) { cam.position.copy(pos); cam.lookAt(target); }
export { THREE };
