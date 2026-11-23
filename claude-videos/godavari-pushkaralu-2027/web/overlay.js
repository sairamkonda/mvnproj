// 2D text layer drawn over each 3D frame: tag, kicker, title, Telugu title,
// word-by-word captions, callouts and lower third.
import { W, H, clamp, ease, seg, roundRect } from './kit.js';

const ORANGE = '#ff8a1a', SAFFRON = '#ff9933', DEEP = '#f57c00', INK = 'rgba(14,18,38,0.92)', GOLD = '#ffd27a';
const CAP_FONT = (s) => `${s}px Ramabhadra, Inter`;
const CAP_SIZE = 70, CAP_Y = 1445, CAP_MAX_W = 940;

function fitFont(ctx, text, font, max, start, min) {
  let s = start;
  ctx.font = font(s);
  while (ctx.measureText(text).width > max && s > min) { s -= 2; ctx.font = font(s); }
  return s;
}

function strokeFill(ctx, text, x, y, fill, stroke, lw) {
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y); }
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

export class Overlay {
  constructor(ctx) { this.ctx = ctx; }

  setScene(spec, words, lead, extras = {}) {
    this.spec = spec; this.extras = extras; this.lead = lead;
    this.words = words.map((w) => ({ ...w, text: w.show ?? w.text, start: w.start + lead, end: w.end + lead }));
    this.layoutTitle();
    this.layoutCaptions();
  }

  layoutTitle() {
    const ctx = this.ctx, title = this.spec.title;
    const font = (s) => `${s}px Anton`;
    let size = fitFont(ctx, title, font, 980, 124, 60);
    let lines = [title];
    if (size < 96 && title.includes(' ')) {
      const words = title.split(' ');
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
        ctx.font = font(100);
        // prefer breaking right after a dash ("96 LOCATIONS - / 8 CRORE DEVOTEES")
        const m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width) * (words[i - 1] === '-' ? 0.8 : 1);
        if (!best || m < best.m) best = { m, a, b };
      }
      lines = [best.a, best.b];
      size = Math.min(118, Math.min(...lines.map((l) => fitFont(ctx, l, font, 980, 124, 60))));
    }
    this.title = { lines, size };
  }

  layoutCaptions() {
    const ctx = this.ctx; ctx.font = CAP_FONT(CAP_SIZE);
    const space = ctx.measureText(' ').width + 18;
    const chunks = []; let cur = [];
    const width = (ws) => ws.reduce((s, w) => s + ctx.measureText(w.text).width, 0) + space * (ws.length - 1);
    this.words.forEach((w, i) => {
      if (cur.length && (cur.length >= 4 || width([...cur, w]) > CAP_MAX_W)) { chunks.push(cur); cur = []; }
      cur.push(w);
      const prev = this.words[i + 1];
      if (/[,.?!]$/.test(w.text) || (prev && prev.start - w.end > 0.22)) { chunks.push(cur); cur = []; }
    });
    if (cur.length) chunks.push(cur);
    this.chunks = chunks.map((ws) => {
      let x = (W - width(ws)) / 2;
      const items = ws.map((w) => { const wd = ctx.measureText(w.text).width; const it = { ...w, x, wd }; x += wd + space; return it; });
      return { items, start: ws[0].start };
    });
  }

  draw(t, camera, project) {
    const ctx = this.ctx, ex = this.extras;
    this.scrims();
    if (ex.drawBelow) ex.drawBelow(ctx, t);
    (ex.callouts || []).forEach((c) => this.callout(c, t, project));
    this.tag(t);
    this.header(t);
    if (ex.lowerThird) this.lowerThird(ex.lowerThird, t);
    this.captions(t);
    if (ex.drawAbove) ex.drawAbove(ctx, t);
  }

  scrims() {
    const ctx = this.ctx;
    let g = ctx.createLinearGradient(0, 0, 0, 760);
    g.addColorStop(0, 'rgba(8,10,28,0.62)'); g.addColorStop(0.55, 'rgba(8,10,28,0.28)'); g.addColorStop(1, 'rgba(8,10,28,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 760);
    g = ctx.createLinearGradient(0, 1230, 0, H);
    g.addColorStop(0, 'rgba(8,10,28,0)'); g.addColorStop(0.45, 'rgba(8,10,28,0.38)'); g.addColorStop(1, 'rgba(8,10,28,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 1230, W, H - 1230);
    g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  tag(t) {
    const ctx = this.ctx, text = this.spec.tag;
    if (!text) return;
    ctx.save();
    ctx.globalAlpha = 0.9 * ease.out(seg(t, 0.05, 0.4));
    ctx.font = '600 25px Inter'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 56;
    ctx.fillStyle = 'rgba(10,12,30,0.5)'; roundRect(ctx, 40, 132, w, 46, 23); ctx.fill();
    ctx.fillStyle = SAFFRON; ctx.beginPath(); ctx.arc(64, 155, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillText(text, 80, 156);
    ctx.restore();
  }

  header(t) {
    const ctx = this.ctx, sp = this.spec;
    let y = 236;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (sp.kicker) {
      const a = ease.out(seg(t, 0.05, 0.35));
      ctx.globalAlpha = a;
      ctx.font = '800 34px Inter'; ctx.letterSpacing = '5px';
      const w = ctx.measureText(sp.kicker).width + 64, x = W / 2 - w / 2, yy = y - 10 * (1 - a);
      const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, DEEP); g.addColorStop(1, SAFFRON);
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
      ctx.fillStyle = g; roundRect(ctx, x, yy, w, 62, 31); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#fff'; ctx.fillText(sp.kicker, W / 2 + 2, yy + 33);
      ctx.letterSpacing = '0px';
      y += 92;
    } else y += 30;
    ctx.globalAlpha = 1;
    const { lines, size } = this.title;
    ctx.font = `${size}px Anton`;
    let wi = 0;
    lines.forEach((line, li) => {
      const ly = y + size * 0.55 + li * size * 1.06;
      const words = line.split(' ');
      const space = ctx.measureText(' ').width;
      const total = ctx.measureText(line).width;
      let x = W / 2 - total / 2;
      words.forEach((w) => {
        const ww = ctx.measureText(w).width;
        const k = seg(t, 0.12 + wi * 0.07, 0.45 + wi * 0.07);
        if (k > 0) {
          ctx.save();
          ctx.translate(x + ww / 2, ly); const s = 0.55 + 0.45 * ease.outBack(k); ctx.scale(s, s);
          ctx.globalAlpha = clamp(k * 3);
          ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 5;
          strokeFill(ctx, w, 0, 0, '#ffffff', 'rgba(20,16,40,0.85)', size * 0.1);
          ctx.restore();
        }
        x += ww + space; wi++;
      });
    });
    y += lines.length * size * 1.06 + 8;
    if (sp.title_te) {
      const a = ease.out(seg(t, 0.4, 0.8));
      ctx.globalAlpha = a;
      const s = fitFont(ctx, sp.title_te, (s) => `${s}px Ramabhadra`, 980, 60, 34);
      ctx.font = `${s}px Ramabhadra`;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14;
      strokeFill(ctx, sp.title_te, W / 2, y + s * 0.7 + 12 * (1 - a), GOLD, 'rgba(20,16,40,0.85)', 9);
    }
    ctx.restore();
  }

  captions(t) {
    const ctx = this.ctx;
    let chunk = null;
    for (const c of this.chunks) if (t >= c.start - 0.02) chunk = c;
    if (!chunk) return;
    ctx.save(); ctx.font = CAP_FONT(CAP_SIZE); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    const items = chunk.items;
    let curIdx = -1;
    items.forEach((w, i) => { if (t >= w.start - 0.02) curIdx = i; });
    const lastWord = this.words[this.words.length - 1];
    const finished = t > lastWord.end + 0.15;
    items.forEach((w, i) => {
      if (t < w.start - 0.02) return;
      const k = seg(t, w.start - 0.02, w.start + 0.1);
      const current = i === curIdx && !finished;
      const s = (0.75 + 0.25 * ease.outBack(k)) * (current ? 1.08 : 1);
      ctx.save(); ctx.translate(w.x + w.wd / 2, CAP_Y); ctx.scale(s, s);
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      if (current) strokeFill(ctx, w.text, 0, 0, ORANGE, '#ffffff', 11);
      else strokeFill(ctx, w.text, 0, 0, '#ffffff', INK, 11);
      ctx.restore();
    });
    ctx.restore();
  }

  lowerThird(lt, t) {
    const ctx = this.ctx;
    const a = ease.out(seg(t, lt.at ?? 0.8, (lt.at ?? 0.8) + 0.45));
    if (a <= 0) return;
    ctx.save();
    ctx.font = '700 36px Inter'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(lt.text).width + 90, x = 40 - (1 - a) * (w + 60), y = lt.y ?? 1262;
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(12,16,40,0.82)'; roundRect(ctx, x, y, w, 72, 14); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = SAFFRON; roundRect(ctx, x, y, 14, 72, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(lt.text, x + 44, y + 38);
    ctx.restore();
  }

  callout(c, t, project) {
    const [t0, t1] = c.show ?? [0, 1e9];
    if (t < t0 || t > t1) return;
    const ctx = this.ctx;
    const k = ease.outBack(seg(t, t0, t0 + 0.35));
    const fade = 1 - seg(t, t1 - 0.25, t1);
    let p = typeof c.at === 'function' ? c.at(t) : c.at;
    if (p && p.isVector3) p = project(p);
    if (!p || p.behind) return;
    ctx.save(); ctx.globalAlpha = clamp(k * 2) * fade; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const kind = c.kind ?? 'label';
    if (kind === 'badge') {
      const size = c.size ?? 104;
      ctx.font = `${size}px Anton`;
      const w = ctx.measureText(c.text).width + size * 0.9, h = size * 1.35;
      ctx.translate(p.x, p.y); ctx.scale(0.4 + 0.6 * k, 0.4 + 0.6 * k);
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#ffe08a'); g.addColorStop(0.5, '#ffc233'); g.addColorStop(1, '#f08c00');
      ctx.shadowColor = 'rgba(255,170,40,0.75)'; ctx.shadowBlur = 50;
      ctx.fillStyle = g; roundRect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; roundRect(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, h / 2 - 6); ctx.stroke();
      ctx.fillStyle = '#5a2600'; ctx.fillText(c.text, 0, size * 0.05);
    } else if (kind === 'email') {
      const size = c.size ?? 46;
      ctx.font = `800 ${size}px Inter`;
      const w = Math.min(1010, ctx.measureText(c.text).width + 80), h = 150;
      ctx.translate(p.x, p.y); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fffaf0'; roundRect(ctx, -w / 2, -h / 2, w, h, 26); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = DEEP; roundRect(ctx, -w / 2, -h / 2, w, 44, 22); ctx.fill(); ctx.fillRect(-w / 2, -h / 2 + 22, w, 22);
      ctx.fillStyle = '#fff'; ctx.font = '800 26px Inter'; ctx.letterSpacing = '4px'; ctx.fillText(c.header ?? 'SEND YOUR ENTRY TO', 0, -h / 2 + 23); ctx.letterSpacing = '0px';
      ctx.fillStyle = '#1b2340'; ctx.font = `800 ${size}px Inter`; ctx.fillText(c.text, 0, 26);
    } else if (kind === 'pin') {
      const big = !!c.big, size = c.size ?? (big ? 46 : 32), lift = c.lift ?? (big ? 120 : 84);
      ctx.font = `${big ? 800 : 700} ${size}px Inter`; ctx.letterSpacing = '2px';
      const w = ctx.measureText(c.text).width + 40, h = size * 1.55;
      const ly = p.y - lift * k;
      ctx.strokeStyle = big ? '#ffd27a' : 'rgba(255,255,255,0.9)'; ctx.lineWidth = big ? 5 : 3;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x, ly + h / 2); ctx.stroke();
      ctx.fillStyle = big ? '#ffd27a' : '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, big ? 10 : 7, 0, Math.PI * 2); ctx.fill();
      const lx = clamp(p.x, w / 2 + 24, W - w / 2 - 24);
      ctx.shadowColor = big ? 'rgba(255,190,60,0.9)' : 'rgba(0,0,0,0.4)'; ctx.shadowBlur = big ? 36 : 14;
      if (big) { const g = ctx.createLinearGradient(0, ly - h / 2, 0, ly + h / 2); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#f59e0b'); ctx.fillStyle = g; }
      else ctx.fillStyle = 'rgba(12,16,40,0.85)';
      roundRect(ctx, lx - w / 2, ly - h / 2, w, h, h / 2); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = big ? '#4a1d00' : '#fff'; ctx.fillText(c.text, lx + 1, ly + 2);
      ctx.letterSpacing = '0px';
    } else {
      const size = c.size ?? 44;
      ctx.font = `800 ${size}px Inter`; ctx.letterSpacing = '3px';
      const w = ctx.measureText(c.text).width + 46, h = size * 1.6;
      ctx.translate(p.x, p.y); ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
      ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20;
      ctx.fillStyle = c.bg ?? 'rgba(12,16,40,0.8)'; roundRect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 3; ctx.strokeStyle = c.border ?? SAFFRON; roundRect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.stroke();
      ctx.fillStyle = c.color ?? '#fff'; ctx.fillText(c.text, 1, 2);
      ctx.letterSpacing = '0px';
    }
    ctx.restore();
  }
}

export function formatIndian(n) {
  const s = String(Math.floor(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3), rest = s.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}
