// Renders the video: node render.mjs [plan|stills|video|audio|all] [--scenes 1,2] [--at 0.1,0.5,0.9] [--workers 2]
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(ROOT, 'build');
const FPS = 30;
const args = process.argv.slice(2);
const mode = args[0] && !args[0].startsWith('--') ? args[0] : 'all';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };

function makePlan() {
  const tl = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
  let start = 0;
  const scenes = tl.scenes.map((s) => {
    const lead = s.id === 1 ? 0.15 : 0.3;
    const tail = s.id === 19 ? 1.6 : s.id === 4 ? 0.25 : 0.4;
    // keep short scenes readable, and the email in scene 3 on screen for 3.5 s (it appears 0.55 s after its first word)
    let minDur = 3.2;
    if (s.id === 3 && s.words[6]) minDur = lead + s.words[6].start + 0.55 + 3.5;
    const frames = Math.round(Math.max(lead + s.speech + tail, minDur) * FPS);
    const e = { id: s.id, lead, dur: frames / FPS, frames, start };
    start += e.dur;
    return e;
  });
  const plan = { fps: FPS, total: start, scenes };
  fs.writeFileSync(path.join(BUILD, 'plan.json'), JSON.stringify(plan, null, 1));
  console.log(`plan: ${scenes.length} scenes, ${start.toFixed(2)} s`);
  return plan;
}

function serve() {
  const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/web/index.html';
    if (!p.startsWith('/node_modules') && !p.startsWith('/build') && !p.startsWith('/data') && !p.startsWith('/web') && p !== '/scenes.json') p = '/web' + p;
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(d);
    });
  }).listen(0);
  return new Promise((r) => srv.on('listening', () => r(srv)));
}

async function openPage(port) {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!t.includes('GPU stall')) console.error('console:', t); } });
  await page.goto(`http://localhost:${port}/web/index.html`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  await page.evaluate(() => window.api.load());
  return { browser, page };
}

const b64 = (u) => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');

async function stills(plan, ids, ats) {
  const srv = await serve();
  const { browser, page } = await openPage(srv.address().port);
  const dir = path.join(BUILD, 'stills'); fs.mkdirSync(dir, { recursive: true });
  for (const id of ids) {
    const sc = plan.scenes.find((s) => s.id === id);
    await page.evaluate((id) => window.api.setScene(id), id);
    for (const a of ats) {
      const t = Math.min(sc.dur - 1 / FPS, a <= 1 ? a * sc.dur : a);
      // run a few frames up to t so per-frame state settles
      const u = await page.evaluate((t) => window.api.frame(t, 0.85), t);
      const f = path.join(dir, `s${String(id).padStart(2, '0')}_${t.toFixed(2)}.jpg`);
      fs.writeFileSync(f, b64(u));
      console.log(f);
    }
  }
  await browser.close(); srv.close();
}

async function renderSegments(plan, ids, workers) {
  const srv = await serve();
  const dir = path.join(BUILD, 'seg'); fs.mkdirSync(dir, { recursive: true });
  const queue = [...ids];
  const t0 = Date.now();
  async function worker(w) {
    const { browser, page } = await openPage(srv.address().port);
    while (queue.length) {
      const id = queue.shift();
      const sc = plan.scenes.find((s) => s.id === id);
      const out = path.join(dir, `scene_${String(id).padStart(2, '0')}.mp4`);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
      await page.evaluate((id) => window.api.setScene(id), id);
      const ts = Date.now();
      for (let f = 0; f < sc.frames; f++) {
        const u = await page.evaluate((t) => window.api.frame(t, 0.94), f / FPS);
        if (!ff.stdin.write(b64(u))) await new Promise((r) => ff.stdin.once('drain', r));
      }
      ff.stdin.end();
      await new Promise((r) => ff.on('close', r));
      console.log(`[w${w}] scene ${id}: ${sc.frames} frames in ${((Date.now() - ts) / 1000).toFixed(0)} s (total ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    await browser.close();
  }
  await Promise.all(Array.from({ length: workers }, (_, i) => worker(i)));
  srv.close();
}

function concat(plan) {
  const list = plan.scenes.map((s) => `file '${path.join(BUILD, 'seg', `scene_${String(s.id).padStart(2, '0')}.mp4`)}'`).join('\n');
  fs.writeFileSync(path.join(BUILD, 'seg', 'list.txt'), list);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(BUILD, 'seg', 'list.txt'), '-c', 'copy', path.join(BUILD, 'video_only.mp4')], { stdio: 'inherit' });
}

function mux(outFile) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(BUILD, 'video_only.mp4'), '-i', path.join(BUILD, 'audio', 'mix.wav'),
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', outFile], { stdio: 'inherit' });
  console.log('wrote', outFile);
}

// Watermark on the scenes, crossfade into the end card, mux the soundtrack.
// Needs build/brand/{watermark,endcard}.png (tools/brand.py) and a mix.wav built with OUTRO=2.2.
function final(plan, outFile) {
  const fade = 0.4, endDur = 2.6, off = (plan.total - fade).toFixed(3);
  const fc = [
    `[1:v]scale=2160:3840,zoompan=z='1+0.12*pow(1-min(on/40\\,1)\\,3)':d=${Math.round(endDur * FPS)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},format=yuv420p,setsar=1,settb=AVTB[end]`,
    `[0:v][2:v]overlay=W-w-28:106,fps=${FPS},format=yuv420p,setsar=1,settb=AVTB[main]`,
    `[main][end]xfade=transition=fade:duration=${fade}:offset=${off}[v]`,
  ].join(';');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(BUILD, 'video_only.mp4'), '-i', path.join(BUILD, 'brand', 'endcard.png'),
    '-i', path.join(BUILD, 'brand', 'watermark.png'), '-i', path.join(BUILD, 'audio', 'mix.wav'), '-filter_complex', fc,
    '-map', '[v]', '-map', '3:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', outFile], { stdio: 'inherit' });
  console.log('wrote', outFile);
}

const plan = makePlan();
const ids = opt('scenes') ? opt('scenes').split(',').map(Number) : plan.scenes.map((s) => s.id);
if (mode === 'stills') await stills(plan, ids, (opt('at') || '0.15,0.5,0.95').split(',').map(Number));
if (mode === 'video' || mode === 'all') {
  await renderSegments(plan, ids, Number(opt('workers', 2)));
  if (!opt('scenes')) {
    concat(plan);
    if (fs.existsSync(path.join(BUILD, 'audio', 'mix.wav'))) mux(path.join(ROOT, opt('out', 'godavari-pushkaralu-2027.mp4')));
  }
}
if (mode === 'mux') { concat(plan); mux(path.join(ROOT, opt('out', 'godavari-pushkaralu-2027.mp4'))); }
if (mode === 'final' || ((mode === 'video' || mode === 'all') && !opt('scenes') && fs.existsSync(path.join(BUILD, 'brand', 'endcard.png')))) {
  if (mode === 'final') concat(plan);
  final(plan, path.join(ROOT, opt('out', 'godavari-pushkaralu-2027.mp4')));
}
