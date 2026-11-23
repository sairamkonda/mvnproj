// Scenes 1-7
import * as THREE from 'three';
import {
  W, H, C, SKIES, clamp, ease, seg, lerp, rng, v3, mat, mesh, box, glowMat, metal, makeWater, makeGlows, makeStars, makeGopuram,
  makeGhat, makeTree, makeDiya, makeTrophy, textPlane, canvasTexture, makeClock, makeEnvelope, makeLota, makeGarland, mix, makeRevealTube, roundRect,
} from './kit.js';
import { base, aimSun, kf, look, farShore, addBirds, makeLogoFrame, buildMap, flatLabel, makeSea, calendarSet, scatterPetals, proj } from './common.js';

// Shared sunrise river (scenes 1, 4 and the sunset version in 18)
export function riverMorning(S, { seed = 11, preset } = {}) {
  const water = S.add(makeWater({ w: 420, d: 320, seg: 110, z: -70, amp: 0.1 }));
  farShore(S, { edge: -75, seed, hill: 14, trees: 90 });
  const gop = makeGopuram({ w: 5, d: 3.4, tiers: 6, seed: 4 });
  gop.position.set(-26, 0.8, -86); gop.scale.setScalar(1.5); S.scene.add(gop);
  const gop2 = makeGopuram({ w: 3.5, d: 2.6, tiers: 4, seed: 6 });
  gop2.position.set(30, 0.6, -95); gop2.scale.setScalar(1.3); S.scene.add(gop2);
  return water;
}

const SUNRISE_IN_FRAME = { ...SKIES.sunrise, sunDir: [-0.24, 0.1, -1] };
const S1 = (h) => {
  const S = base(SUNRISE_IN_FRAME, { shadow: false });
  riverMorning(S);
  S.ups.push(addBirds(S, { y: 16, z: -40, x0: -24 }));
  const frame = makeLogoFrame({ size: 4.6 });
  frame.position.set(0, 6.4, 0);
  S.add(frame);
  frame.setSketch(0);
  const reflect = makeGlows([{ p: v3(0, 0.05, 1.5), size: 9, color: 0xff9a3c }], { flicker: 0.2 });
  S.add(reflect);

  // coin burst on "gelisthe"
  const tb = h.word(8) - 0.05;
  const r = rng(21), N = 70;
  const coinGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 14);
  const coins = new THREE.InstancedMesh(coinGeo, metal(0xffc531, { roughness: 0.22, emissive: 0x7a4a00, emissiveIntensity: 0.35 }), N);
  const cd = Array.from({ length: N }, () => ({ v: v3((r() - 0.5) * 9, 2 + r() * 6, 1.5 + r() * 5), ax: v3(r(), r(), r()).normalize(), w: 6 + r() * 10, d: r() * 0.12 }));
  S.scene.add(coins);
  const flash = makeGlows([{ p: v3(0, 6.4, 0.5), size: 1, color: 0xffd27a }], { flicker: 0 });
  S.add(flash);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = v3();

  const tSketch0 = 0.55, tSketch1 = Math.max(h.wordEnd(7), 3.5);
  return {
    ...S, env: 0.5,
    update(t) {
      S.tick(t);
      const p = 5 * ease.inOut(seg(t, tSketch0, tSketch1));
      frame.setSketch(p);
      const pv = seg(t, 0.35, 0.6) * (1 - seg(t, tSketch1 + 0.1, tSketch1 + 0.45));
      frame.pencil.visible = pv > 0.01;
      frame.pencil.position.copy(frame.pencilAt(p)).add(v3(0, 0, 0.1));
      frame.pencil.scale.setScalar(Math.max(0.001, ease.outBack(pv)));
      frame.rotation.y = Math.sin(t * 0.6) * 0.06;
      frame.position.y = 6.4 + Math.sin(t * 1.2) * 0.06;
      // coins
      const ct = t - tb;
      for (let i = 0; i < N; i++) {
        const c = cd[i], tt = ct - c.d;
        if (tt <= 0) { m4.makeScale(0, 0, 0); coins.setMatrixAt(i, m4); continue; }
        const pos = v3(c.v.x * tt, 6.4 + c.v.y * tt - 4.9 * tt * tt, 0.3 + c.v.z * tt);
        q.setFromAxisAngle(c.ax, c.w * tt);
        m4.compose(pos, q, sc.setScalar(Math.min(1, tt * 6)));
        coins.setMatrixAt(i, m4);
      }
      coins.instanceMatrix.needsUpdate = true;
      flash.geometry.attributes.psize.array[0] = ct > 0 ? 14 * Math.exp(-ct * 3.5) : 0;
      flash.geometry.attributes.psize.needsUpdate = true;
      // camera: fast push-in, then settle
      const shake = ct > 0 ? Math.exp(-ct * 5) * 0.12 : 0;
      const pos = kf(t, [[0, v3(0, 9.5, 42)], [1.1, v3(0, 6.9, 13.8)], [h.dur, v3(0.5, 6.75, 12.2)]], [ease.outExpo, ease.inOut]);
      pos.x += Math.sin(t * 40) * shake; pos.y += Math.cos(t * 37) * shake;
      look(S.camera, pos, v3(0, 6.15, 0));
    },
    callouts: [{ kind: 'badge', text: 'RS 1,00,000', at: { x: W / 2, y: 1235 }, show: [tb + 0.12, 1e9], size: 112 }],
  };
};

const S2 = (h) => {
  const S = base('golden', { shadowSize: 30 });
  aimSun(S.world, v3(0, 0, -2), 70);
  S.add(makeWater({ w: 400, d: 300, seg: 100, z: -80, amp: 0.08 }));
  farShore(S, { edge: -70, seed: 3, hill: 12 });
  const ghat = makeGhat({ length: 60, steps: 10, top: 1.6, platform: 16 });
  ghat.rotation.y = Math.PI; ghat.position.z = -4; S.scene.add(ghat);
  const gop = makeGopuram({ w: 7, d: 4.5, tiers: 7, seed: 8 }); gop.position.set(-16, 0.6, -64); gop.scale.setScalar(1.6); S.scene.add(gop);
  const podiums = [
    { x: -3.4, h: 2.3, n: '1', amount: 'RS 1,00,000', col: C.gold, at: h.word(2) },
    { x: 0, h: 1.65, n: '2', amount: 'RS 50,000', col: 0xd4dae2, at: h.word(5) },
    { x: 3.4, h: 1.15, n: '3', amount: 'RS 25,000', col: 0xcd7f32, at: h.word(9) },
  ];
  const labels = [];
  podiums.forEach((p, i) => {
    const g = new THREE.Group(); g.position.set(p.x, 1.6, -1);
    g.add(box(2.6, p.h, 2.2, mat(C.stoneLight), { pos: [0, p.h / 2, 0] }));
    g.add(box(2.75, 0.16, 2.35, mat(C.deepSaffron), { pos: [0, p.h + 0.08, 0] }));
    g.add(box(2.75, 0.16, 2.35, mat(C.stoneDark), { pos: [0, 0.08, 0] }));
    const num = canvasTexture(256, 256, (ctx) => {
      ctx.fillStyle = '#8e1b1b'; ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 10; ctx.stroke();
      ctx.fillStyle = '#ffd27a'; ctx.font = '170px Anton'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.n, 128, 138);
    });
    g.add(mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ map: num, transparent: true, roughness: 0.6 }), { pos: [0, p.h * 0.5, 1.11], shadow: false }));
    const tr = makeTrophy(p.col); tr.position.y = p.h + 0.16; tr.scale.setScalar(0.95 - i * 0.07); g.add(tr);
    const lab = textPlane(p.amount, { w: 2.9, h: 0.75, px: 1024, color: '#ffd54f', stroke: '#3a1500' });
    lab.position.set(0, p.h + 1.7, 0.2); g.add(lab); labels.push({ lab, p });
    const glow = makeGlows([{ p: v3(0, p.h + 0.9, 0), size: 4, color: p.col }], { flicker: 0.2 });
    g.add(glow); S.ups.push(glow);
    S.scene.add(g);
  });
  const rangoli = canvasTexture(1024, 1024, (ctx) => {
    const cols = ['#e53935', '#ff9800', '#fdd835', '#43a047', '#1e88e5', '#d81b60', '#ffffff'];
    ctx.translate(512, 512);
    for (let ring = 7; ring >= 1; ring--) {
      const rr = ring * 68, n = 8 + ring * 4;
      ctx.fillStyle = cols[ring % cols.length];
      for (let i = 0; i < n; i++) { ctx.save(); ctx.rotate((i / n) * Math.PI * 2); ctx.beginPath(); ctx.ellipse(0, -rr + 30, 22, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = cols[(ring + 3) % cols.length]; ctx.beginPath(); ctx.arc(0, 0, rr - 34, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff3dc'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
  });
  const rg = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshStandardMaterial({ map: rangoli, roughness: 0.95 }));
  rg.rotation.x = -Math.PI / 2; rg.position.set(0, 1.605, 4.2); rg.receiveShadow = true; S.scene.add(rg);
  scatterPetals(S, { n: 150, area: [-8, 8, -3, 4], top: 9 });
  for (let i = 0; i < 4; i++) { const d = makeDiya({ scale: 1.6 }); d.position.set(-6 + i * 4, 1.6, 2.3); S.add(d); }
  return {
    ...S, env: 0.6,
    update(t) {
      S.tick(t);
      const x = kf(t, [[0, -4.2], [h.word(2), -3.0], [h.word(5), 0], [h.word(9), 3.0], [h.dur, 3.9]], ease.inOut);
      look(S.camera, v3(x, 7.4, 12.4), v3(x * 0.96, 3.6, -1));
      S.camera.updateMatrixWorld();
      labels.forEach(({ lab, p }, i) => {
        const k = ease.outBack(seg(t, p.at - 0.1, p.at + 0.35));
        lab.scale.setScalar(Math.max(0.001, k)); lab.visible = k > 0.001;
        lab.position.y = p.h + 1.7 + Math.sin(t * 2 + i) * 0.08;
        lab.lookAt(S.camera.position);
      });
    },
  };
};

const S3 = (h) => {
  const S = base('golden', { shadowSize: 20, fogNear: 25, fogFar: 140 });
  aimSun(S.world, v3(0, 1, 0), 60);
  S.add(makeWater({ w: 400, d: 300, seg: 80, y: -3, z: -90, amp: 0.08 }));
  farShore(S, { edge: -60, seed: 5, hill: 12 });
  const pages = [26, 27, 28, 29, 30].map((d) => ({ m: 11, d, y: 2026 }));
  const cal = calendarSet(S, { pages, band: '#e8711c', calX: -0.55, calW: 3.0 });
  const clock = makeClock({ r: 0.82 });
  clock.position.set(1.75, 1.05, 0.75); clock.rotation.y = -0.38; S.scene.add(clock);
  S.scene.add(box(0.5, 0.25, 0.5, mat(0x6d4c41), { pos: [1.75, 0.12, 0.75] }));
  const lota = makeLota(); lota.position.set(-2.6, 0.08, 1.2); lota.scale.setScalar(1.4); S.scene.add(lota);
  const d1 = makeDiya({ scale: 1.8 }); d1.position.set(2.7, 0.08, 1.6); S.add(d1);
  S.scene.add(makeGarland(v3(-3.4, 0.12, 1.9), v3(-1.2, 0.12, 2.2), { sag: -0.05, count: 22 }));
  const env = makeEnvelope(); env.visible = false; S.scene.add(env);
  const te = h.word(6) - 0.15;
  const target = new THREE.Vector3();
  return {
    ...S, env: 0.5,
    update(t) {
      S.tick(t);
      cal.setFlip(4 * ease.inOut(seg(t, 0.25, 2.3)));
      clock.setTime(lerp(9, 17, ease.inOut(seg(t, 0.4, 2.6))));
      look(S.camera, kf(t, [[0, v3(0, 2.7, 14.4)], [h.dur, v3(0, 2.6, 13.3)]]), v3(0.35, 1.6, 0));
      // envelope flies from the calendar toward the email card
      S.camera.updateMatrixWorld();
      target.set(0, 1 - (2 * 1290) / H, 0.5).unproject(S.camera).sub(S.camera.position).normalize().multiplyScalar(3.2).add(S.camera.position);
      const k = seg(t, te, te + 0.85);
      env.visible = k > 0 && k < 1;
      if (env.visible) {
        const a = v3(-0.4, 2.0, 0.6), b = v3(-1.6, 3.6, 3.0);
        const p = new THREE.QuadraticBezierCurve3(a, b, target).getPoint(ease.inOut(k));
        env.position.copy(p); env.rotation.set(0.3 * Math.sin(k * 6), 0.5 - k, 0.4 * Math.sin(k * 4));
        env.scale.setScalar(0.8 * (1 - 0.6 * k));
      }
    },
    callouts: [{ kind: 'email', text: 'godavaripushkaralutg@gmail.com', at: { x: W / 2, y: 1290 }, show: [te + 0.7, 1e9] }],
  };
};

const S4 = (h) => {
  const S = base(SUNRISE_IN_FRAME, { shadow: false });
  const water = riverMorning(S);
  water.material.side = THREE.DoubleSide;
  const frame = makeLogoFrame({ size: 4.6 });
  frame.position.set(0.0, 6.4, 0); frame.setSketch(5); frame.pencil.visible = false;
  S.add(frame);
  const r = rng(4);
  const pts = frame.sketchPoints();
  const parts = pts.map((p) => ({ p: p.clone().add(frame.position), v: v3((r() - 0.5) * 1.5, -1 - r() * 2.5, (r() - 0.5) * 1.5), d: r() * 0.8, color: r() < 0.5 ? 0xffc04d : 0x7fd3ff }));
  const glows = makeGlows(parts.map((q) => ({ p: q.p, size: 0.6, color: q.color })), { flicker: 0.3 });
  S.add(glows);
  const ripples = makeGlows(parts.filter((_, i) => i % 6 === 0).map((q) => ({ p: v3(q.p.x, 0.05, q.p.z), size: 0, color: 0xbfe9ff })), { flicker: 0 });
  S.add(ripples);
  const dive = h.word(8) - 0.35;
  const camKeys = [[0, v3(0.5, 6.75, 12.2)], [dive, v3(0, 5.6, 8.5)], [h.dur - 0.05, v3(0, -1.6, -5)]];
  const tgtKeys = [[0, v3(0, 6.15, 0)], [dive, v3(0, 2.5, -6)], [h.dur - 0.05, v3(0, -5, -12)]];
  let camY = 6;
  const pa = glows.geometry.attributes.position, ps = glows.geometry.attributes.psize, rs = ripples.geometry.attributes.psize;
  return {
    ...S, env: 0.5,
    update(t) {
      S.tick(t);
      const k = seg(t, 0.35, 2.4);
      frame.setOpacity(1 - ease.inOut(k));
      frame.visible = k < 1;
      parts.forEach((q, i) => {
        const tt = Math.max(0, t - 0.35 - q.d);
        const y = Math.max(0.05, q.p.y + q.v.y * tt - 1.6 * tt * tt);
        pa.setXYZ(i, q.p.x + q.v.x * tt, y, q.p.z + q.v.z * tt);
        ps.array[i] = tt <= 0 ? 0 : y <= 0.06 ? 0 : 0.7;
      });
      pa.needsUpdate = true; ps.needsUpdate = true;
      for (let i = 0; i < rs.count; i++) { const q = parts[i * 6]; const tt = t - 0.35 - q.d - 1.9; rs.array[i] = tt > 0 && tt < 1.2 ? 3 * Math.sin((tt / 1.2) * Math.PI) : 0; }
      rs.needsUpdate = true;
      const pos = kf(t, camKeys, [ease.inOut, ease.in]);
      camY = pos.y;
      look(S.camera, pos, kf(t, tgtKeys, [ease.inOut, ease.in]));
    },
    drawAbove(ctx, t) {
      const u = clamp((0.5 - camY) / 1.6);
      if (u > 0) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgba(70,170,220,${0.75 * u})`); g.addColorStop(1, `rgba(8,60,110,${0.95 * u})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const r2 = rng(3);
        ctx.fillStyle = `rgba(255,255,255,${0.5 * u})`;
        for (let i = 0; i < 40; i++) { const x = r2() * W, y = (r2() * H - t * 900 * (0.5 + r2())) % H; ctx.beginPath(); ctx.arc(x, (y + H) % H, 4 + r2() * 10, 0, Math.PI * 2); ctx.fill(); }
      }
      const s = 1 - Math.abs(camY - 0.3) / 0.6;
      if (s > 0) { ctx.fillStyle = `rgba(255,255,255,${0.6 * s})`; ctx.fillRect(0, 0, W, H); }
    },
  };
};

const S5 = (h) => {
  const S = base({ ...SKIES.sunrise, sunDir: [-0.1, 0.09, -1] }, { shadowSize: 80 });
  aimSun(S.world, v3(0, 0, -40), 90);
  S.add(makeWater({ w: 420, d: 320, seg: 120, z: -60, amp: 0.09 }));
  const hgt = farShore(S, { edge: -46, seed: 12, hill: 16, trees: 90, treeBand: [9, 34] });
  const ghat = makeGhat({ length: 70, steps: 9, top: 1.8, platform: 8 });
  ghat.position.z = -46 - 0.6; S.scene.add(ghat);
  const gop = makeGopuram({ w: 8, d: 5, tiers: 7, tierH: 1.4, seed: 2 });
  gop.position.set(6, 1.8, -60); gop.scale.setScalar(1.25); S.scene.add(gop);
  const gop2 = makeGopuram({ w: 4, d: 3, tiers: 4, seed: 9 }); gop2.position.set(-12, 1.8, -54); gop2.scale.setScalar(1.2); S.scene.add(gop2);
  const r = rng(31), diyas = [];
  for (let i = 0; i < 46; i++) {
    const d = makeDiya({ scale: 2.2, leaf: true, glow: 1.8 });
    d.userData = { x: (r() - 0.5) * 22, z: -34 + r() * 40, ph: r() * 6 };
    S.add(d); diyas.push(d);
  }
  S.ups.push(addBirds(S, { y: 13, z: -30, x0: -22, n: 7 }));
  return {
    ...S, intro: { color: '#cfeeff', dur: 0.45 },
    update(t) {
      S.tick(t);
      diyas.forEach((d) => { const u = d.userData; d.position.set(u.x + t * 0.25, 0.06 + 0.06 * Math.sin(t * 1.4 + u.ph), u.z + t * 0.15); d.rotation.y = t * 0.2 + u.ph; });
      look(S.camera, kf(t, [[0, v3(0, 2.8, 19)], [h.dur, v3(0.5, 2.3, 11)]]), v3(1.5, 3.4, -45));
    },
  };
};

const ZODIAC = ['MESHA', 'VRISHABHA', 'MITHUNA', 'KARKATAKA', 'SIMHA', 'KANYA', 'TULA', 'VRISCHIKA', 'DHANUS', 'MAKARA', 'KUMBHA', 'MEENA'];
const S6 = (h) => {
  const S = base('night', { shadow: false });
  S.add(makeStars(1800));
  const R = 4.2, r0 = 3.05, step = Math.PI / 6;
  const theta = (i) => (75 * Math.PI) / 180 + (i - 4) * step; // Simha centred near the front
  const ring = new THREE.Group(); S.scene.add(ring);
  const sectorMats = [];
  ZODIAC.forEach((name, i) => {
    const a0 = theta(i) - step / 2 + 0.012, a1 = theta(i) + step / 2 - 0.012;
    const sh = new THREE.Shape();
    sh.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0); sh.absarc(0, 0, R, a0, a1, false); sh.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0); sh.absarc(0, 0, r0, a1, a0, true);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false, curveSegments: 6 });
    geo.rotateX(Math.PI / 2); // shape XY -> XZ (z = +y), extrude downward
    geo.translate(0, 0.22, 0);
    const m = new THREE.MeshStandardMaterial({ color: i % 2 ? 0x283a8a : 0x1f2d6e, emissive: 0x0d1440, emissiveIntensity: 0.6, flatShading: true, roughness: 0.6 });
    sectorMats.push(m);
    ring.add(new THREE.Mesh(geo, m));
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({
      map: canvasTexture(512, 128, (ctx) => { ctx.font = '800 64px Inter'; ctx.letterSpacing = '6px'; ctx.fillStyle = i === 4 ? '#ffd27a' : 'rgba(220,230,255,0.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, 256, 66); }),
      transparent: true, depthWrite: false,
    }));
    const mr = (R + r0) / 2;
    lab.position.set(Math.cos(theta(i)) * mr, 0.55, Math.sin(theta(i)) * mr); lab.scale.set(1.75, 0.44, 1);
    ring.add(lab);
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.05, 0.04, 6, 96), glowMat(0xffc04d, 1.2)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.2; ring.add(rim);
  const rim2 = rim.clone(); rim2.geometry = new THREE.TorusGeometry(r0 - 0.05, 0.03, 6, 96); ring.add(rim2);
  const core = makeGlows([{ p: v3(0, 0.3, 0), size: 6, color: 0x5a78ff }], { flicker: 0.1 }); S.add(core);
  const jt = canvasTexture(512, 256, (ctx) => {
    const bands = ['#e9d4b0', '#c99a6b', '#f1e2c6', '#b57f4f', '#e8cfa5', '#a86d43', '#efdcbc', '#c8946a', '#e6d0aa'];
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, (i * 256) / bands.length, 512, 256 / bands.length + 1); });
    ctx.fillStyle = '#b0503a'; ctx.beginPath(); ctx.ellipse(330, 165, 40, 20, 0, 0, Math.PI * 2); ctx.fill();
  });
  const jup = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), new THREE.MeshStandardMaterial({ map: jt, emissive: 0x6a4a2a, emissiveIntensity: 0.5, roughness: 0.7 }));
  ring.add(jup);
  const jglow = makeGlows([{ p: v3(), size: 5, color: 0xffd9a0 }], { flicker: 0.1 }); ring.add(jglow); S.ups.push(jglow);
  const key = new THREE.PointLight(0xfff0d0, 30, 20); ring.add(key);
  const tIn = h.word(5) + 0.2;
  const jupPos = new THREE.Vector3();
  return {
    ...S,
    update(t) {
      S.tick(t);
      const a = lerp(theta(3) - 0.05, theta(4), ease.inOut(seg(t, 0.3, tIn)));
      const mr = (R + r0) / 2;
      jupPos.set(Math.cos(a) * mr, 1.0 + Math.sin(t * 1.5) * 0.06, Math.sin(a) * mr);
      jup.position.copy(jupPos); jup.rotation.y = t * 0.8; jglow.position.copy(jupPos); key.position.copy(jupPos).add(v3(0, 1.5, 1.5));
      const lit = ease.out(seg(t, tIn - 0.6, tIn + 0.4));
      sectorMats[4].emissive.setHex(0xff8a1a); sectorMats[4].emissiveIntensity = 0.15 + 1.2 * lit;
      sectorMats[4].color.setHex(lit > 0.01 ? 0xffb347 : 0x1f2d6e);
      const phi = lerp(-0.42, 0.12, ease.inOut(seg(t, 0, h.dur)));
      const dist = 16.8;
      look(S.camera, v3(Math.sin(phi) * dist, 7.2, Math.cos(phi) * dist), v3(0, -0.2, 0.3));
    },
    callouts: [
      { kind: 'label', text: 'JUPITER', at: () => jupPos.clone().add(v3(0, 1.05, 0)), show: [0.5, 1e9], border: '#ffd27a' },
      { kind: 'label', text: 'SIMHA RAASI', at: () => v3(Math.cos(theta(4)) * (R + 0.9), 0.2, Math.sin(theta(4)) * (R + 0.9)), show: [h.word(2), 1e9], bg: 'rgba(245,124,0,0.92)', border: '#ffd27a' },
    ],
  };
};

const S7 = (h) => {
  const S = base('golden', { shadowSize: 30 });
  aimSun(S.world, v3(0, 0, 0), 50);
  makeSea(S);
  const M = buildMap(h.map, {
    heights: { Maharashtra: 0.42, Telangana: 0.62, 'Andhra Pradesh': 0.5 },
    colors: { Maharashtra: 0xe7b77a, Telangana: 0xf39a45, 'Andhra Pradesh': 0xd8c47c },
  });
  S.scene.add(M.group);
  const riverMat = new THREE.MeshStandardMaterial({ color: 0x6fd0ff, emissive: 0x2aa8ff, emissiveIntensity: 1.6, flatShading: true });
  const river = makeRevealTube(M.riverCurve, { radius: 0.075, segments: 900, radial: 6, material: riverMat });
  S.scene.add(river);
  const head = makeGlows([{ p: v3(), size: 1.6, color: 0x9be3ff }], { flicker: 0.2 }); S.add(head);
  [['MAHARASHTRA', 75.6, 19.9, 2.6], ['TELANGANA', 79.0, 17.75, 2.2], ['ANDHRA PRADESH', 79.4, 15.3, 2.8]].forEach(([n, lo, la, w]) => {
    const l = flatLabel(n, { w, h: w * 0.16 }); const p = M.placeOnMap(lo, la, 0.01); l.position.copy(p); S.scene.add(l);
  });
  const places = [['BASARA', 'Basara', 70], ['DHARMAPURI', 'Dharmapuri', 175, true], ['BHADRACHALAM', 'Bhadrachalam', 80], ['RAJAHMUNDRY', 'Rajahmundry', -95]];
  const tR0 = 0.3, tR1 = Math.max(h.wordEnd(6), 4.5);
  const pins = places.map(([label, key, lift, big]) => {
    const [lo, la] = h.map.places[key];
    const p = M.placeOnMap(lo, la);
    const f = M.riverFraction(p);
    const g = new THREE.Group(); g.position.copy(p);
    g.add(mesh(new THREE.ConeGeometry(big ? 0.09 : 0.06, big ? 0.45 : 0.32, 6).rotateX(Math.PI).translate(0, big ? 0.22 : 0.16, 0), glowMat(big ? 0xffd27a : 0xff7043, 1.2)));
    g.add(mesh(new THREE.SphereGeometry(big ? 0.11 : 0.075, 8, 6).translate(0, big ? 0.48 : 0.34, 0), glowMat(big ? 0xffd27a : 0xff7043, 1.5)));
    const gl = makeGlows([{ p: v3(0, 0.4, 0), size: big ? 2.4 : 1.2, color: big ? 0xffd27a : 0xff8a50 }], { flicker: 0.2 }); g.add(gl); S.ups.push(gl);
    S.scene.add(g);
    const tAt = lerp(tR0, tR1, Math.min(1, f + 0.01));
    return { label, g, p, f, lift, big, tAt, top: p.clone().add(v3(0, big ? 0.55 : 0.4, 0)) };
  });
  const [cx, cz] = [(-4.31 + 3.93) / 2, 0.25];
  return {
    ...S,
    update(t) {
      S.tick(t);
      const f = ease.inOut(seg(t, tR0, tR1));
      river.reveal(f);
      head.position.copy(M.riverCurve.getPointAt(Math.max(0.0005, Math.min(0.9995, f))));
      head.visible = f > 0 && f < 1;
      pins.forEach((p) => { const k = ease.outBack(seg(t, p.tAt, p.tAt + 0.35)); p.g.scale.setScalar(Math.max(0.001, k)); p.g.visible = k > 0.001; });
      const k = ease.inOut(seg(t, h.dur * 0.42, h.dur));
      const pos = v3(cx, lerp(19.5, 12.5, k), cz + lerp(0.6, 10.5, k));
      S.camera.up.set(0, 0, -1); S.camera.position.copy(pos); S.camera.lookAt(v3(cx, 0, cz - lerp(0, 0.8, k)));
    },
    callouts: pins.map((p) => ({ kind: 'pin', text: p.label, big: p.big, lift: p.lift, at: p.top, show: [p.tAt + 0.1, 1e9] })),
  };
};

export const SCENES_A = { 1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7 };
