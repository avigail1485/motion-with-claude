/* POP! engine, scoped so it doesn't touch the guide page's globals */
window.POPV = (() => {
let READY_ = false;

// ============================================================
//  POP! — retro rubber-hose kinetic typography (1080x1920 @30fps)
//  Stateless procedural canvas engine: render(t) draws any frame.
// ============================================================
const W = 1080, H = 1920, CX = W / 2, CY = H / 2;
const DURATION = 77.6;
const cv = document.getElementById('popCanvas');
const MAIN = cv.getContext('2d');
let ctx = MAIN;
const FONT = 'Drak';
const INK = '#16110e', CREAM = '#fff3dc', BLUE = '#3123c6', PINK = '#ff8fd6', YELLOW = '#ffcc2e',
  RED = '#ff4a2b', ORANGE = '#ff8a1f', SHADE = '#f2d7a2', DEEP = '#1a0f06';

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outQuint: t => 1 - Math.pow(1 - t, 5),
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inCubic: t => t * t * t,
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
  outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
};
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ---------- sprites ----------
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const SP = 300;
function blurCopy(src, b) { const c = mk(src.width, src.height), g = c.getContext('2d'); g.filter = `blur(${b}px)`; g.drawImage(src, 0, 0); return c; }
function cloudLumps(seed, n = 8) {
  const r = rng(seed), L = [{ x: 0, y: 0, r: 74 }];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (r() - .5) * .4, d = 64 + r() * 10; L.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * .9, r: 38 + r() * 12 }); }
  return L;
}
function paintCloud(g, L, lw, fill = CREAM, shade = SHADE) {
  g.fillStyle = INK; L.forEach(l => { g.beginPath(); g.arc(l.x, l.y, l.r + lw, 0, 7); g.fill(); });
  g.fillStyle = fill; L.forEach(l => { g.beginPath(); g.arc(l.x, l.y, l.r, 0, 7); g.fill(); });
  g.fillStyle = shade;
  L.forEach((l, i) => { if (i && l.y > -10) { g.beginPath(); g.arc(l.x + l.r * .18, l.y + l.r * .2, l.r * .72, 0, 7); g.fill(); } });
  g.fillStyle = fill; g.beginPath(); g.arc(-10, -10, 66, 0, 7); g.fill();
  g.strokeStyle = INK; g.lineWidth = lw * .55; g.lineCap = 'round';
  L.slice(1, 5).forEach(l => { g.beginPath(); g.arc(l.x * .55, l.y * .55, l.r * .45, .3, 1.4); g.stroke(); });
}
function makePop(seed) {
  const c = mk(SP, SP), g = c.getContext('2d'); g.translate(SP / 2, SP / 2); g.scale(1.05, 1.05);
  paintCloud(g, cloudLumps(seed + 4), 9);
  return c;
}
function kernelPath(g) {
  g.beginPath(); g.moveTo(0, -112);
  g.bezierCurveTo(58, -112, 86, -50, 76, 8); g.bezierCurveTo(66, 64, 28, 108, 0, 116);
  g.bezierCurveTo(-28, 108, -66, 64, -76, 8); g.bezierCurveTo(-86, -50, -58, -112, 0, -112); g.closePath();
}
function paintKernel(g, lw) {
  kernelPath(g); g.fillStyle = YELLOW; g.fill();
  g.save(); kernelPath(g); g.clip();
  g.fillStyle = '#f29a12'; g.beginPath(); g.ellipse(52, 30, 60, 110, -.2, 0, 7); g.fill();
  g.fillStyle = CREAM; g.beginPath(); g.ellipse(0, 112, 40, 34, 0, 0, 7); g.fill();
  g.restore();
  g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = 'round'; kernelPath(g); g.stroke();
  g.strokeStyle = '#fff'; g.lineWidth = lw * .9; g.lineCap = 'round';
  g.beginPath(); g.arc(-8, -20, 62, 3.5, 4.25); g.stroke();
}
function makeKernel() { const c = mk(SP, SP), g = c.getContext('2d'); g.translate(SP / 2, SP / 2); g.scale(1.05, 1.05); paintKernel(g, 10); return c; }
function makeHalftone(col, a) {
  const c = mk(28, 28), g = c.getContext('2d'); g.fillStyle = col; g.globalAlpha = a;
  g.beginPath(); g.arc(7, 7, 3.2, 0, 7); g.arc(21, 21, 3.2, 0, 7); g.fill(); return c;
}
function makeGrain() {
  const c = mk(512, 512), g = c.getContext('2d'), id = g.createImageData(512, 512), r = rng(5);
  for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
}
const POP = [], POPB = [], KER = [], KERB = [];
let GRAIN, BUF, BCTX, HT = {};
function buildSprites() {
  for (let i = 0; i < 8; i++) { const p = makePop(i * 17 + 2); POP.push(p); POPB.push(blurCopy(p, 12)); }
  const k = makeKernel(); KER.push(k); KERB.push(blurCopy(k, 10));
  GRAIN = makeGrain();
  BUF = mk(W, H); BCTX = BUF.getContext('2d');
  HT.ink = MAIN.createPattern(makeHalftone(INK, .09), 'repeat');
  HT.cream = MAIN.createPattern(makeHalftone(CREAM, .1), 'repeat');
  HT.pink = MAIN.createPattern(makeHalftone(PINK, .35), 'repeat');
  HT.yellow = MAIN.createPattern(makeHalftone('#b86e00', .22), 'repeat');
}
function spr(img, x, y, s, rot = 0, a = 1) {
  if (a <= .003 || s <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); if (rot) ctx.rotate(rot);
  ctx.drawImage(img, -SP / 2 * s, -SP / 2 * s, SP * s, SP * s); ctx.restore();
}

// ---------- backgrounds & graphic devices ----------
function flat(col, ht) { ctx.fillStyle = col; ctx.fillRect(-300, -300, W + 600, H + 600); if (ht) { ctx.fillStyle = HT[ht]; ctx.fillRect(-300, -300, W + 600, H + 600); } }
function sunburst(cx, cy, n, rot, col, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = col;
  for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = a0 + Math.PI / n; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * 2600, Math.sin(a0) * 2600); ctx.lineTo(Math.cos(a1) * 2600, Math.sin(a1) * 2600); ctx.fill(); }
  ctx.restore();
}
function rings(cx, cy, n, gap, col, lw, phase = 0, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.lineWidth = lw;
  const ph = ((phase % 1) + 1) % 1;
  for (let i = 0; i < n; i++) { const r = (i + ph) * gap; if (r <= 0) continue; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }
  ctx.restore();
}
function spiky(cx, cy, r, n, inner, rot, fill, lw = 12, stroke = INK) {
  if (r <= 0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r * inner * (0.9 + hash(i) * .2) : r * (0.88 + hash(i + 9) * .24); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.restore();
}
function star(cx, cy, r, rot, fill = YELLOW, lw = 6) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * .42 : r; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function ground(y, col = INK, lw = 9) { ctx.fillStyle = col; ctx.fillRect(-300, y, W + 600, lw); }
function shadowBlob(x, y, w, a = .18) { ctx.save(); ctx.fillStyle = `rgba(22,17,14,${a})`; ctx.beginPath(); ctx.ellipse(x, y, w, w * .16, 0, 0, 7); ctx.fill(); ctx.restore(); }

// ---------- type ----------
const PAINT = {
  cream: { fill: CREAM, ext: INK, d: .075 },
  yellow: { fill: YELLOW, ext: INK, d: .085 },
  pink: { fill: PINK, ext: INK, d: .085 },
  blue: { fill: BLUE, ext: INK, d: .075 },
  red: { fill: RED, ext: INK, d: .085 },
  white: { fill: '#ffffff', ext: INK, d: .075 },
  ink: { fill: INK, d: 0 },
};
function setFont(px) { ctx.font = `700 ${px}px ${FONT}`; }
const mCache = new Map();
function measure(str, size) {
  const key = str + '|' + size; if (mCache.has(key)) return mCache.get(key);
  setFont(size); const chars = [...str]; const ws = chars.map(c => ctx.measureText(c).width);
  const r = { chars, ws, w: ws.reduce((a, b) => a + b, 0) }; mCache.set(key, r); return r;
}
function glyph(ch, size, paint) {
  const P = PAINT[paint] || PAINT.cream;
  setFont(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const d = P.d * size;
  if (P.ext && d > 0) {
    ctx.fillStyle = P.ext; ctx.strokeStyle = P.ext; ctx.lineWidth = size * .07;
    const steps = Math.ceil(d / 2.4);
    for (let k = steps; k >= 1; k--) { const f = k / steps; ctx.strokeText(ch, d * .55 * f, d * f); }
    ctx.fillText(ch, d * .55, d);
    ctx.strokeText(ch, 0, 0);
  }
  ctx.fillStyle = P.fill; ctx.fillText(ch, 0, 0);
}
function enterT(style, lt, i, n, size, w) {
  const T = { dx: 0, dy: 0, s: 1, sx: 1, sy: 1, r: 0, a: 1 };
  const l = lt - i * (w.stagger ?? .035);
  switch (style) {
    case 'slam': { const p = clamp(l / .24), e = E.outExpo(p); T.s = lerp(3.6, 1, e); T.a = clamp(p * 16); T.r = (1 - e) * (hash(i + n) - .5) * .6; if (p >= 1) { const q = clamp((l - .24) / .3); T.sy *= 1 - Math.sin(q * Math.PI) * .12 * (1 - q); T.sx *= 1 + Math.sin(q * Math.PI) * .1 * (1 - q); } break; }
    case 'drop': { const p = clamp(l / .65); T.dy = -(1 - E.outBounce(p)) * size * 1.6; T.a = clamp(p * 5); T.sy = p < .3 ? 1.25 : 1; break; }
    case 'stiff': { const p = clamp(l / .32), q = Math.floor(p * 4) / 4; T.dy = (1 - q) * size * .7; T.a = p > 0 ? 1 : 0; break; }
    case 'rise': { const p = clamp(l / .5), e = E.outQuint(p); T.dy = (1 - e) * size * .8; T.a = clamp(p * 2.5); T.sy = lerp(1.35, 1, e); T.sx = lerp(.8, 1, e); break; }
    case 'flip': { const p = clamp(l / .5); T.sy = Math.cos((1 - E.outBack(p, 2.4)) * Math.PI * .5); T.a = clamp(p * 3); break; }
    case 'roll': { const p = clamp((lt - (n - 1 - i) * .04) / .6), e = E.outBack(p, 1.3); T.dx = -(1 - e) * 1000; T.r = -(1 - e) * Math.PI * 4; T.a = clamp(p * 3); break; }
    case 'burst': { const p = clamp(l / .6), e = E.outBack(p, 1.8), a = hash(i * 5 + 1) * 6.28; T.dx = Math.cos(a) * (1 - e) * 600; T.dy = Math.sin(a) * (1 - e) * 600; T.s = Math.max(0, e); T.r = (1 - e) * 3; T.a = clamp(p * 3); break; }
    case 'zoomin': { const p = clamp(l / .45), e = E.outCubic(p); T.s = lerp(.05, 1, e); T.a = clamp(p * 2); break; }
    case 'fly': { const p = clamp(l / .42), e = E.outExpo(p); T.dy = (1 - e) * 1000; T.sy = 1 + (1 - e) * 1.4; T.sx = 1 - (1 - e) * .45; T.a = clamp(p * 3); break; }
    case 'type': { T.a = l > 0 ? 1 : 0; T.s = l > 0 ? 1 + Math.max(0, .22 - l) * 2 : 0; break; }
    case 'puff': { const p = clamp(l / .75); T.s = E.outElastic(p); T.a = clamp(p * 4); break; }
    case 'swing': { const p = clamp(l / .8); T.r = Math.sin(p * 12) * (1 - p) * .9; T.dy = -(1 - E.outCubic(p)) * size * .3; T.a = clamp(p * 4); break; }
    default: { const p = clamp(l / .4), e = E.outBack(p, 2.4); T.s = Math.max(0, e); T.dy = (1 - E.outExpo(p)) * size * .35; T.r = (1 - p) * (hash(i * 3 + n) - .5) * .8; T.a = clamp(p * 4); }
  }
  return T;
}
function contT(T, fx, t, i, n, size, lt) {
  if (!fx) return;
  if (fx.includes('wave')) T.dy += Math.sin(t * 5 - i * .6) * size * .06;
  if (fx.includes('jitter')) { T.dx += noise1(t * 30 + i * 7) * size * .035; T.dy += noise1(t * 33 + i * 5) * size * .035; T.r += noise1(t * 20 + i) * .07; }
  if (fx.includes('vibrate')) { T.dx += noise1(t * 70 + i * 9) * size * .055; T.dy += noise1(t * 75 + i * 3) * size * .055; T.r += noise1(t * 50 + i) * .1; }
  if (fx.includes('crazy')) { T.r += Math.sin(t * 9 + i * 1.7) * .25; T.dy += Math.sin(t * 7 + i * 2.3) * size * .09; }
  if (fx.includes('climb')) { T.dy -= (n - 1 - i) * size * .1 * E.outCubic(clamp(lt / .8)); T.dy -= Math.max(0, lt - .5) * 30; }
  if (fx.includes('heat')) { T.dx += Math.sin(t * 6 + i * .9) * size * .035; T.sy *= 1 + Math.sin(t * 8 + i * 1.3) * .1; }
  if (fx.includes('squish')) { const k = Math.sin(lt * 7) * Math.exp(-lt * .8) * .3 + Math.sin(t * 3) * .04; T.sy *= 1 - k; T.sx *= 1 + k; T.dy += k * size * .3; }
  if (fx.includes('bob')) T.dy += Math.sin(t * 2.4 + i * .35) * size * .035;
  if (fx.includes('robot')) { const q = Math.floor(t * 4); T.r += (hash(q + i) - .5) * .12; }
}

// ---------- beats (word-synced kinetic type) ----------
const BEATS = [];
function beat(s, e, lines, o = {}) { BEATS.push({ s, e, lines: lines.map(l => ({ y: l[0], size: l[1], style: l[2], paint: l[3], words: l[4].map(w => ({ text: w[0], t: w[1], ...(w[2] || {}) })), fx: l[5] || '' })), ...o }); }

beat(0.0, 2.38, [
  [420, 250, 'slam', 'pink', [['תשמע,', 0.02]]],
  [660, 120, 'pop', 'ink', [['בוא', 0.60], ['נדבר', 0.76], ['רגע', 1.02]]],
  [800, 96, 'rise', 'blue', [['ביני', 1.30], ['לבין', 1.42], ['עצמנו.', 1.52]], 'bob'],
]);
beat(2.46, 3.30, [[460, 220, 'drop', 'blue', [['הייתי', 2.46], ['שם,', 2.80]]]], { exit: 'zoom' });
beat(3.44, 4.40, [
  [800, 270, 'zoomin', 'pink', [['עמוק', 3.44]]],
  [1080, 270, 'zoomin', 'yellow', [['בפנים,', 3.80]]],
], { exit: 'zoom' });
beat(4.46, 6.05, [
  [430, 140, 'pop', 'cream', [['מוקף', 4.46], ['בקליפה', 4.70]]],
  [690, 340, 'slam', 'yellow', [['קשה,', 5.30]], 'jitter'],
]);
beat(6.10, 8.12, [
  [420, 270, 'flip', 'yellow', [['צהובה,', 6.10]]],
  [610, 130, 'stiff', 'cream', [['ודי', 6.64]]],
  [800, 260, 'stiff', 'cream', [['נוקשה.', 7.22, { stagger: .09 }]], 'robot'],
]);
beat(8.28, 9.40, [
  [380, 140, 'pop', 'cream', [['חברים', 8.28], ['שלי', 8.48]]],
  [540, 140, 'pop', 'yellow', [['אמרו', 8.68], ['לי:', 8.90]]],
]);
beat(9.44, 10.20, [[600, 190, 'drop', 'pink', [['"עזוב', 9.44], ['אותך,', 9.62]]]], { bubble: [600, 300, -1] });
beat(10.24, 11.36, [
  [520, 150, 'pop', 'ink', [['תישאר', 10.24]]],
  [700, 210, 'drop', 'pink', [['באריזה,', 10.72]]],
], { bubble: [610, 440, 1] });
beat(11.40, 12.18, [[600, 180, 'stiff', 'blue', [['הכי', 11.40], ['בטוח', 11.58], ['פה,', 11.86]]]], { bubble: [600, 290, -1] });
beat(12.22, 13.00, [[600, 200, 'rise', 'pink', [['שקט', 12.22], ['ונעים,', 12.44]], 'wave']], { bubble: [600, 300, 1] });
beat(13.04, 14.36, [
  [520, 160, 'pop', 'ink', [['אף', 13.04], ['אחד', 13.16], ['לא', 13.30]]],
  [710, 200, 'pop', 'pink', [['נוגע', 13.42], ['בך."', 13.64]]],
], { bubble: [615, 450, -1] });
beat(14.44, 15.58, [
  [400, 150, 'pop', 'cream', [['אבל', 14.44]]],
  [630, 290, 'slam', 'pink', [['בינינו?', 14.72]]],
], { tilt: -.07 });
beat(15.62, 18.18, [
  [380, 130, 'rise', 'cream', [['הרגשתי', 15.62], ['שאם', 16.12]]],
  [570, 200, 'pop', 'cream', [['אני', 16.28], ['לא', 16.50], ['זז', 16.78]]],
  [740, 64, 'type', 'yellow', [['טיפה,', 17.20, { stagger: .06 }]], 'bob'],
]);
beat(18.22, 20.08, [
  [360, 140, 'pop', 'cream', [['אני', 18.22], ['אשאר', 18.40]]],
  [600, 310, 'slam', 'yellow', [['תקוע', 18.76]], 'jitter'],
  [830, 140, 'rise', 'cream', [['באותו', 19.20], ['מקום', 19.64]]],
]);
beat(20.12, 21.40, [[440, 300, 'rise', 'pink', [['לנצח.', 20.12]]]]);
beat(21.48, 22.38, [[760, 120, 'type', 'cream', [['ואז,', 21.48, { stagger: .1 }]]]], { exit: 'zoom' });
beat(22.42, 23.30, [
  [700, 430, 'slam', 'yellow', [['בום', 22.42]], 'vibrate'],
  [1080, 430, 'slam', 'cream', [['טראח!', 22.58]], 'vibrate'],
], { exit: 'blow', chroma: true });
beat(23.30, 24.78, [
  [330, 140, 'pop', 'cream', [['פתאום', 23.30]]],
  [530, 260, 'slam', 'yellow', [['החום', 23.44]]],
  [720, 140, 'pop', 'cream', [['התחיל', 23.74]]],
  [900, 230, 'rise', 'yellow', [['לעלות,', 24.06]], 'climb'],
]);
beat(24.82, 26.04, [
  [480, 200, 'pop', 'cream', [['המשטח', 24.82]]],
  [720, 270, 'rise', 'yellow', [['התחמם,', 25.18]], 'heat'],
]);
beat(26.08, 27.92, [
  [380, 130, 'pop', 'cream', [['ואיזה', 26.08], ['קול', 26.44]]],
  [590, 240, 'swing', 'pink', [['פנימי', 26.80]], 'wave'],
  [780, 130, 'pop', 'cream', [['אמר', 27.00], ['לי:', 27.34]]],
]);
beat(27.96, 28.42, [[600, 340, 'slam', 'yellow', [['"יאללה,', 27.96]]]], { exit: 'zoom' });
beat(28.46, 30.15, [
  [380, 160, 'pop', 'cream', [['זה', 28.46], ['הזמן', 28.74], ['שלך', 29.00]]],
  [650, 340, 'slam', 'yellow', [['לפרוץ!"', 29.26, { frame: true }]], 'jitter'],
]);
beat(30.20, 32.76, [
  [330, 130, 'pop', 'cream', [['הרגשתי', 30.20], ['שאני', 30.52]]],
  [530, 240, 'rise', 'cream', [['מתמלא', 30.68, { fill: true }]]],
  [740, 230, 'slam', 'yellow', [['באנרגיה', 31.14]], 'jitter'],
  [940, 230, 'pop', 'pink', [['משוגעת,', 31.96]], 'crazy'],
]);
beat(32.80, 34.54, [
  [380, 140, 'pop', 'cream', [['התחלתי', 32.80]]],
  [610, 310, 'slam', 'pink', [['לרעוד', 33.14]], 'vibrate'],
  [830, 150, 'pop', 'cream', [['מרוב', 33.62], ['התרגשות,', 33.90]], 'jitter'],
]);
beat(34.58, 35.72, [
  [420, 200, 'rise', 'cream', [['ובשנייה', 34.58]]],
  [650, 290, 'slam', 'yellow', [['אחת –', 35.16]]],
]);
beat(35.76, 37.50, [
  [420, 150, 'pop', 'cream', [['פשוט', 35.76]]],
  [660, 330, 'fly', 'yellow', [['עפתי', 36.16]]],
  [920, 260, 'fly', 'pink', [['באוויר!', 36.82]]],
], { exit: 'up' });
beat(37.58, 38.18, [[560, 260, 'pop', 'cream', [['התהפכתי,', 37.58, { spin: true }]]]]);
beat(38.22, 39.08, [[560, 260, 'roll', 'yellow', [['התגלגלתי,', 38.22, { pile: 38.50 }]]]], { exit: 'none' });
beat(39.10, 41.62, [
  [400, 280, 'burst', 'blue', [['ונפתחתי', 39.10]]],
  [620, 200, 'pop', 'cream', [['לעולם', 40.08], ['כולו', 40.68]]],
]);
beat(41.68, 43.15, [
  [420, 240, 'puff', 'cream', [['בענן', 41.68]]],
  [670, 290, 'puff', 'white', [['לבן,', 42.16]], 'bob'],
]);
beat(43.20, 43.90, [[560, 440, 'puff', 'cream', [['רך,', 43.20]], 'squish']]);
beat(43.94, 45.82, [
  [250, 120, 'pop', 'ink', [['ענן', 43.94], ['של', 44.24]]],
  [1260, 170, 'slam', 'blue', [['צרוף', 45.28]]],
]);
beat(45.86, 47.62, [
  [250, 120, 'pop', 'ink', [['ושל', 45.86]]],
  [1260, 190, 'slam', 'blue', [['מתפרצת.', 46.62]], 'jitter'],
], { exit: 'blow' });
beat(47.92, 51.28, [
  [330, 110, 'rise', 'ink', [['מסתבר', 47.92], ['שכל', 48.28], ['מה', 48.78]]],
  [460, 110, 'rise', 'ink', [['שהייתי', 48.98], ['צריך', 49.20]]],
  [610, 150, 'rise', 'blue', [['כדי', 49.56], ['לגלות', 49.80]]],
  [790, 190, 'pop', 'ink', [['מי', 50.22], ['אני', 50.56]]],
  [1000, 270, 'slam', 'pink', [['באמת,', 50.76, { underline: true }]]],
]);
beat(51.34, 53.80, [
  [340, 150, 'pop', 'ink', [['זה', 51.34], ['לא', 51.50]]],
  [560, 300, 'slam', 'pink', [['לפחד', 51.64]]],
  [770, 130, 'rise', 'ink', [['לעשות', 52.30], ['את', 52.66]]],
  [940, 200, 'drop', 'blue', [['הצעד', 52.86], ['הזה,', 53.22]]],
]);
beat(53.86, 55.94, [
  [420, 290, 'slam', 'pink', [['להעיז', 53.86]]],
  [680, 230, 'rise', 'blue', [['להיפתח', 54.68, { open: true }]]],
  [890, 170, 'pop', 'ink', [['עד', 55.06], ['הסוף,', 55.46]]],
]);
beat(55.98, 57.84, [
  [380, 160, 'pop', 'ink', [['ולתת', 55.98], ['לעצמי', 56.64]]],
  [640, 280, 'slam', 'pink', [['להתפוצץ', 57.18]], 'vibrate'],
], { exit: 'shatter' });
beat(58.22, 59.40, [
  [520, 230, 'pop', 'blue', [['מרוב', 58.22]]],
  [780, 320, 'slam', 'pink', [['שמחה!', 58.52]], 'wave'],
]);
beat(59.46, 60.28, [[460, 250, 'pop', 'cream', [['אז', 59.46], ['כן,', 59.66]]]]);
beat(60.32, 61.96, [
  [300, 140, 'rise', 'cream', [['לפעמים', 60.32]]],
  [500, 250, 'slam', 'pink', [['השינוי', 60.60]]],
  [700, 180, 'pop', 'cream', [['הכי', 61.12], ['טוב', 61.46], ['בחיים', 61.62]]],
]);
beat(62.00, 64.84, [
  [300, 150, 'pop', 'cream', [['מגיע', 62.00], ['בדיוק', 62.32]]],
  [470, 160, 'rise', 'cream', [['כשאתה', 63.00]]],
  [670, 210, 'slam', 'yellow', [['הכי', 63.52], ['לא', 63.82], ['מוכן', 63.96]], 'jitter'],
  [840, 150, 'pop', 'cream', [['לו,', 64.28]]],
]);
beat(64.88, 67.98, [
  [290, 130, 'rise', 'cream', [['והופך', 64.88], ['אותך', 65.28], ['למשהו', 65.52]]],
  [440, 150, 'pop', 'cream', [['הרבה', 65.90], ['יותר', 66.32]]],
  [1080, 230, 'burst', 'yellow', [['מדהים', 67.26]], 'wave'],
]);
beat(68.04, 70.70, [
  [310, 150, 'pop', 'cream', [['ממה', 68.04], ['שאי', 68.42], ['פעם', 68.78]]],
  [520, 290, 'slam', 'pink', [['דמיינת', 68.96]]],
  [730, 220, 'rise', 'cream', [['שיכול', 69.30], ['להיות.', 69.76]]],
]);
beat(70.84, 73.48, [
  [320, 140, 'rise', 'cream', [['מסתבר', 70.84], ['שכל', 71.16], ['מה', 71.60]]],
  [490, 170, 'pop', 'cream', [['שצריך', 71.74]]],
  [670, 160, 'rise', 'cream', [['כדי', 72.10]]],
  [880, 280, 'slam', 'yellow', [['להצליח,', 72.34, { underline: true }]]],
]);
beat(73.52, 77.60, [
  [250, 140, 'pop', 'ink', [['זה', 73.52], ['פשוט', 73.66]]],
  [420, 200, 'slam', 'blue', [['לא', 73.96], ['לפחד', 74.10]]],
], { exit: 'none' });

const EXIT_D = .24;
function drawBeats(t) {
  for (const b of BEATS) {
    if (t < b.s - .05 || t > b.e + .02) continue;
    const et = t - (b.e - EXIT_D);
    if (b.bubble) drawBubbleFor(b, t, et);
    for (const L of b.lines) drawLine(L, b, t, et);
  }
}
function drawBubbleFor(b, t, et) {
  const [cy, h, side] = b.bubble;
  const p = E.outBack(clamp((t - b.s + .04) / .3), 2), q = et > 0 ? 1 - E.inCubic(clamp(et / EXIT_D)) : 1;
  const s = p * q; if (s <= 0) return;
  ctx.save(); ctx.translate(CX, cy); ctx.scale(s, s); ctx.rotate(side * .025);
  const w = 920, path = () => {
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 90);
    const tx = side * 250; ctx.moveTo(tx - 60, h / 2 - 6); ctx.lineTo(tx + side * 120, h / 2 + 170); ctx.lineTo(tx + 60, h / 2 - 6);
  };
  ctx.save(); ctx.translate(16, 22); path(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = CREAM; ctx.fill('nonzero'); ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = CREAM; ctx.fillRect(side * 250 - 54, h / 2 - 14, 108, 18);
  ctx.restore();
}
function drawLine(L, b, t, et) {
  let size = L.size;
  let widths = L.words.map(w => measure(w.text, size).w);
  let total = widths.reduce((a, c) => a + c, 0) + size * .26 * (L.words.length - 1);
  if (total > 960) { size = Math.floor(size * 960 / total); widths = L.words.map(w => measure(w.text, size).w); total = widths.reduce((a, c) => a + c, 0) + size * .26 * (L.words.length - 1); }
  let xr = CX + total / 2;
  L.words.forEach((w, wi) => { if (t >= w.t - .001) drawWord(w, xr, L.y, size, L, b, t, et); xr -= widths[wi] + size * .26; });
}
function exitT(T, b, et, i, n, size) {
  if (et <= 0 || b.exit === 'none' || b.exit === 'shatter') return;
  const p = clamp(et / EXIT_D);
  switch (b.exit) {
    case 'zoom': { const e = E.inExpo(p); T.s *= 1 + e * 3; T.a *= 1 - e; break; }
    case 'blow': { const e = E.inCubic(p); T.s *= 1 + e * 1.6; T.a *= 1 - e; T.r += e * (hash(i) - .5); break; }
    case 'up': { const e = E.inCubic(p); T.dy -= e * 1500; T.sy *= 1 + e; T.a *= 1 - p * .6; break; }
    default: { const q = clamp((et - i * .012) / EXIT_D), e = E.inCubic(q); T.dy -= e * size * .5; T.a *= 1 - e; T.s *= 1 - e * .2; }
  }
}
// pile: letters tumble into a heap at bottom-left (reference: stacked type)
function pileSlot(i, size) {
  const r = rng(700 + i), perRow = [4, 3, 2, 1]; let row = 0, k = i;
  while (row < perRow.length - 1 && k >= perRow[row]) { k -= perRow[row]; row++; }
  return { x: 130 + k * size * .74 + row * size * .32 + (r() - .5) * 20, y: 1840 - row * size * .8 - size * .42, r: (r() - .5) * 1.3 + (r() < .25 ? Math.PI / 2 : 0) };
}
function drawWord(w, xr, y, size, L, b, t, et) {
  const m = measure(w.text, size), n = m.chars.length, lt = t - w.t;
  const wcx = xr - m.w / 2;
  ctx.save();
  ctx.translate(wcx, y);
  if (b.tilt) ctx.rotate(b.tilt * E.outBack(clamp(lt / .5)));
  if (w.spin) { const p = clamp(lt / .55); ctx.rotate((1 - E.outBack(p, 1.3)) * -Math.PI * 2); const s = Math.max(0, E.outBack(p)); ctx.scale(s, s); }
  ctx.translate(-wcx, -y);
  if (w.frame) drawBreakFrame(wcx, y, m.w + 120, size * 1.25, t, w.t + .04);
  if (w.fill) { drawFillWord(m, xr, y, size, t, w.t, et); ctx.restore(); return; }
  const shatterT = b.exit === 'shatter' ? b.e - .3 : null;
  let x = xr;
  for (let i = 0; i < n; i++) {
    const cw = m.ws[i], cx = x - cw / 2; x -= cw;
    const T = enterT(L.style, lt, i, n, size, w);
    contT(T, L.fx, t, i, n, size, lt);
    exitT(T, b, et, i, n, size);
    if (w.open) T.dx += ((n - 1) / 2 - i) * size * .18 * E.outCubic(clamp((lt - .3) / 1.1));
    if (w.pile && t > w.pile) {
      const f = clamp((t - w.pile - (n - 1 - i) * .02) / .34), slot = pileSlot(n - 1 - i, size);
      T.dx = lerp(T.dx, slot.x - cx, E.outCubic(f)); T.dy = lerp(T.dy, slot.y - y, E.outBounce(f)); T.r = lerp(T.r, slot.r, E.outCubic(f));
    }
    if (shatterT && t > shatterT) {
      const st = t - shatterT, a = hash(i * 7 + 2) * 6.28, sp = 1000 + hash(i) * 900;
      T.dx += Math.cos(a) * sp * st; T.dy += Math.sin(a) * sp * st + 1400 * st * st; T.r += (hash(i + 4) - .5) * 14 * st; T.a *= clamp(1 - st * 3);
    }
    if (T.a <= .01 || T.s <= .001) continue;
    const drawOne = (TT, alpha) => {
      ctx.save(); ctx.globalAlpha *= TT.a * alpha;
      ctx.translate(cx + TT.dx, y + TT.dy); if (TT.r) ctx.rotate(TT.r);
      ctx.scale(TT.s * TT.sx, TT.s * TT.sy);
      if (b.chroma && lt < .5) {
        const o = (1 - lt / .5) * 22; setFont(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = PINK; ctx.fillText(m.chars[i], -o, -o * .5); ctx.fillStyle = BLUE; ctx.fillText(m.chars[i], o, o * .5);
      }
      glyph(m.chars[i], size, L.paint);
      ctx.restore();
    };
    drawOne(T, 1);
  }
  if (w.underline) {
    const p = E.outExpo(clamp((lt - .25) / .5)), uw = m.w * 1.05 * p, uy = y + size * .6;
    if (uw > 1) {
      ctx.save(); ctx.globalAlpha *= clamp(1 - Math.max(0, et) / EXIT_D);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(wcx + m.w * .525 - uw + 8, uy + 10, uw, size * .1, size * .05); ctx.fill();
      ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.roundRect(wcx + m.w * .525 - uw, uy, uw, size * .1, size * .05); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    }
  }
  if (shatterT) burst(t, shatterT, wcx, y, 34, 4242, { speed: 1500, g: 1700, life: 2.2, smin: .25, smax: .6, drag: .8, dof: true });
  ctx.restore();
}
function drawFillWord(m, xr, y, size, t, t0, et) {
  const lt = t - t0, a = clamp(lt / .3) * clamp(1 - Math.max(0, et) / EXIT_D);
  const pad = size * .25, w = m.w + pad * 2, h = size * 1.5;
  const off = mk(Math.ceil(w), Math.ceil(h)), g = off.getContext('2d');
  g.font = `700 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  let x = w - pad;
  for (let i = 0; i < m.chars.length; i++) { const cw = m.ws[i]; g.fillStyle = CREAM; g.fillText(m.chars[i], x - cw / 2, h / 2); x -= cw; }
  const level = h * .82 - E.inOut(clamp((lt - .1) / 1.6)) * h * .72;
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = YELLOW; g.beginPath(); g.moveTo(0, h);
  for (let px = 0; px <= w; px += 10) g.lineTo(px, level + Math.sin(px * .025 + t * 9) * 12 + Math.sin(px * .07 - t * 6) * 5);
  g.lineTo(w, h); g.closePath(); g.fill();
  ctx.save(); ctx.globalAlpha *= a;
  setFont(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = size * .07;
  const d = size * .075;
  x = xr; for (let i = 0; i < m.chars.length; i++) { const cw = m.ws[i]; for (let k = 1; k <= 7; k++) ctx.strokeText(m.chars[i], x - cw / 2 + d * .55 * k / 7, y + d * k / 7); ctx.strokeText(m.chars[i], x - cw / 2, y); x -= cw; }
  ctx.drawImage(off, xr - w + pad, y - h / 2);
  ctx.restore();
}
function drawBreakFrame(cx, cy, w, h, t, t0) {
  const lt = t - t0; if (lt < -.6) return;
  ctx.save(); ctx.lineWidth = 16; ctx.strokeStyle = CREAM; ctx.lineCap = 'round';
  if (lt < 0) { ctx.globalAlpha *= clamp((lt + .6) / .2); ctx.strokeRect(cx - w / 2, cy - h / 2, w, h); ctx.restore(); return; }
  for (let i = 0; i < 16; i++) {
    const side = i % 4, k = Math.floor(i / 4) / 4; let x0, y0, x1, y1;
    if (side === 0) { x0 = cx - w / 2 + k * w; y0 = cy - h / 2; x1 = x0 + w / 4; y1 = y0; }
    else if (side === 1) { x0 = cx - w / 2 + k * w; y0 = cy + h / 2; x1 = x0 + w / 4; y1 = y0; }
    else if (side === 2) { x0 = cx - w / 2; y0 = cy - h / 2 + k * h; x1 = x0; y1 = y0 + h / 4; }
    else { x0 = cx + w / 2; y0 = cy - h / 2 + k * h; x1 = x0; y1 = y0 + h / 4; }
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, a = Math.atan2(my - cy, mx - cx), sp = 1300 + hash(i) * 900;
    ctx.save(); ctx.globalAlpha *= clamp(1 - lt / .8); ctx.translate(mx + Math.cos(a) * sp * lt, my + Math.sin(a) * sp * lt + 1500 * lt * lt); ctx.rotate((hash(i + 3) - .5) * 12 * lt);
    ctx.beginPath(); ctx.moveTo(x0 - mx, y0 - my); ctx.lineTo(x1 - mx, y1 - my); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

// ---------- TEXT TUNNEL (reference: HOLE poster) ----------
const GC = new Map();
function glyphImg(ch, col) {
  const key = ch + col; if (GC.has(key)) return GC.get(key);
  const c = mk(160, 160), g = c.getContext('2d');
  g.font = `700 100px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(ch, 80, 80);
  GC.set(key, c); return c;
}
function tunnel(t, t0, str, o) {
  flat(o.bg);
  const R0 = 1700, q = .8, N = 17, lt = t - t0, off = o.travel(lt), vp = o.vp;
  const ms = measure(str, 100);
  for (let k = N; k >= -3; k--) {
    const d = k - (off % 1), r = R0 * Math.pow(q, d);
    if (r < 26 || r * q > 2000) continue;
    const band = r * (1 - q), size = band * 1.02, rm = r - band * .5;
    const kk = k + Math.floor(off), near = clamp(r / R0);
    const cx = lerp(vp[0], CX, Math.pow(near, .6)), cy = lerp(vp[1], CY, Math.pow(near, .6));
    const circ = 2 * Math.PI * rm, Ls = ms.w * size / 100;
    const reps = Math.max(1, Math.round(circ / Ls)), f = circ / (reps * Ls);
    const rot = (kk % 2 ? 1 : -1) * lt * o.spin + kk * .9;
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = o.fg; setFont(100); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const sc = size / 100;
    ctx.globalAlpha = clamp(r / 70);
    let ang = rot; const base = ctx.getTransform();
    for (let rep = 0; rep < reps; rep++) for (let i = 0; i < ms.chars.length; i++) {
      const cw = ms.ws[i] * size / 100 * f, a = ang - cw / 2 / rm;
      const ca = Math.cos(a), sa = Math.sin(a), sx = f * sc, sy = sc; ctx.setTransform(base.a * ca * sx + base.c * sa * sx, base.b * ca * sx + base.d * sa * sx, -base.a * sa * sy + base.c * ca * sy, -base.b * sa * sy + base.d * ca * sy, base.e + base.a * (sa * rm) + base.c * (-ca * rm), base.f + base.b * (sa * rm) + base.d * (-ca * rm)); ctx.drawImage(glyphImg(ms.chars[i], o.fg), -80, -80);
      ang -= cw / rm;
    }
    ctx.restore();
  }
  const g = ctx.createRadialGradient(vp[0], vp[1], 0, vp[0], vp[1], 240);
  g.addColorStop(0, o.bg); g.addColorStop(1, 'rgba(22,17,14,0)');
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
}

// ---------- TEXT RIBBON (reference: snake ribbon over giant numerals) ----------
function ribbonPoints(o, t) {
  const pts = [];
  for (let i = 0; i <= 260; i++) {
    const s = i / 260, w = s * Math.PI * 2 * o.loops + o.phase + t * (o.drift || 0);
    pts.push([lerp(-260, W + 260, s) + Math.sin(w) * o.ax, o.cy + Math.cos(w) * o.ay + (s - .5) * o.tilt]);
  }
  return pts;
}
function ribbon(t, t0, str, o) {
  const lt = t - t0; if (lt < 0) return;
  const pts = ribbonPoints(o, t), cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const Lt = cum[cum.length - 1];
  const reveal = E.inOut(clamp(lt / (o.drawOn || .9))) * Lt;
  const out = o.out ? E.inCubic(clamp((t - o.out) / .45)) * Lt : 0;
  const size = o.size || 66, ms = measure(str, size), Ls = ms.w;
  const scroll = (lt * (o.speed || 240)) % Ls;
  const glyphs = []; let pos = Lt + scroll, j = 0;
  while (pos > -Ls) { const i = j % ms.chars.length, cw = ms.ws[i]; glyphs.push([pos - cw / 2, ms.chars[i]]); pos -= cw; j++; }
  const chunk = 6;
  let gi = glyphs.length - 1; // glyphs sorted descending by position → walk from the end
  for (let c = 0; c < pts.length - 1; c += chunk) {
    const ce = Math.min(pts.length - 1, c + chunk), a0 = cum[c], a1 = cum[ce];
    if (a0 > reveal) break;
    if (a1 < out) continue;
    ctx.beginPath(); let started = false;
    for (let i = c; i <= ce; i++) { if (cum[i] > reveal + 2) break; if (cum[i] < out) continue; started ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); started = true; }
    ctx.strokeStyle = o.col; ctx.lineWidth = o.width || 150; ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = o.text; setFont(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [gp, ch] of glyphs) {
      if (gp < a0 || gp >= a1 || gp > reveal - 30 || gp < out + 30) continue;
      let i = c; while (i < ce - 1 && cum[i + 1] < gp) i++;
      const f = (gp - cum[i]) / Math.max(1e-3, cum[i + 1] - cum[i]);
      const x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f);
      const ang = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillText(ch, 0, 0); ctx.restore();
    }
  }
}
function giant(t, t0, str, cy, size, col, o = {}) {
  const lt = t - t0; if (lt < 0) return;
  const m = measure(str, size); let x = CX + m.w / 2;
  const out = o.out ? E.inCubic(clamp((t - o.out) / .4)) : 0;
  for (let i = 0; i < m.chars.length; i++) {
    const cw = m.ws[i], p = clamp((lt - i * .06) / .7), e = E.outElastic(p);
    ctx.save(); ctx.translate(x - cw / 2, cy + (1 - e) * 400 + out * 1600 + Math.sin(t * 1.5 + i) * 10); ctx.rotate((1 - e) * (hash(i) - .5) + Math.sin(t + i) * .02);
    ctx.globalAlpha *= clamp(p * 4);
    if (o.paint) glyph(m.chars[i], size, o.paint); else { setFont(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(m.chars[i], 0, 0); }
    ctx.restore();
    if (o.pops) burst(t, t0 + i * .06 + .1, x - cw / 2, cy, 4, 300 + i, { speed: 900, g: 1600, life: 1.5, smin: .16, smax: .3, drag: 1.2 });
    x -= cw;
  }
}

// ---------- particles ----------
function burst(t, t0, cx, cy, n, seed, o) {
  const dt = t - t0; if (dt < 0 || dt > o.life) return;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = (o.dir ?? -Math.PI / 2) + (r() - .5) * (o.spread ?? Math.PI * 2), sp = o.speed * (.3 + r() * .9);
    const k = o.drag || 0, f = k ? (1 - Math.exp(-k * dt)) / k : dt;
    const x = cx + Math.cos(a) * sp * f, y = cy + Math.sin(a) * sp * f + .5 * (o.g || 0) * dt * dt;
    const rot = r() * 6.28 + (r() - .5) * 9 * dt; let s = lerp(o.smin, o.smax, r());
    const al = clamp((o.life - dt) / .4), v = Math.floor(r() * 8), dof = o.dof && r() < .25, isK = o.kernel && r() < o.kernel;
    if (dof) s *= 1.8;
    if (isK) spr(dof ? KERB[0] : KER[0], x, y, s * .7, rot, al);
    else spr(dof ? POPB[v] : POP[v], x, y, s, rot, al);
  }
}
function confetti(t, t0, cx, cy, n, seed, o) {
  const dt = t - t0; if (dt < 0 || dt > o.life) return;
  const r = rng(seed), cols = [YELLOW, PINK, CREAM, BLUE];
  for (let i = 0; i < n; i++) {
    const a = (o.dir ?? -Math.PI / 2) + (r() - .5) * (o.spread ?? 6.28), sp = o.speed * (.3 + r());
    const x = cx + Math.cos(a) * sp * dt, y = cy + Math.sin(a) * sp * dt + .5 * (o.g || 0) * dt * dt;
    const rot = r() * 6 + dt * 8 * (r() - .5), isStar = r() < .35, sz = 16 + r() * 14;
    ctx.save(); ctx.globalAlpha = clamp((o.life - dt) / .4); ctx.translate(x, y); ctx.rotate(rot);
    if (isStar) star(0, 0, sz, 0, cols[i % 4], 4);
    else { ctx.fillStyle = cols[i % 4]; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-14, -6, 28, 12, 6); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
}
function ring(t, t0, cx, cy, maxR, col, lw, d = .7) {
  const p = (t - t0) / d; if (p < 0 || p > 1) return;
  ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - p) + 2;
  ctx.beginPath(); ctx.arc(cx, cy, E.outExpo(p) * maxR, 0, 7); ctx.stroke(); ctx.restore();
}
function fountain(t, t0, t1, cx, cy, rate, seed, o) {
  const N = Math.ceil((t1 - t0) * rate);
  for (let i = 0; i < N; i++) {
    const ts = t0 + i / rate + hash(i + seed) / rate, dt = t - ts; if (dt < 0 || dt > o.life) continue;
    const h1 = hash(i * 3.3 + seed), h2 = hash(i * 7.1 + seed), h3 = hash(i * 1.9 + seed), h4 = hash(i * 5.7 + seed);
    const x = cx + (h4 - .5) * o.w + (h1 - .5) * o.vx * dt, y = cy - o.vy * (.6 + h2 * .6) * dt + .5 * o.g * dt * dt;
    const blur = h3 > .87, s = lerp(o.smin, o.smax, h3) * (blur ? 1.7 : 1);
    spr(blur ? POPB[i % 8] : POP[i % 8], x, y, s, h1 * 6.28 + (h2 - .5) * 5 * dt, clamp(dt / .06));
  }
}
function floaters(t, n, seed, a = 1) {
  for (let i = 0; i < n; i++) {
    const z = hash(i * 2.9 + seed), s = lerp(.2, .55, z), blur = z > .85;
    const x = hash(i * 7.3 + seed) * (W + 200) - 100 + noise1(t * .3 + i) * 50;
    const y = ((hash(i * 5.1 + seed) * (H + 500) - t * (40 + z * 90)) % (H + 500) + H + 500) % (H + 500) - 250;
    spr(blur ? POPB[i % 8] : POP[i % 8], x, y, blur ? s * 1.6 : s, noise1(t * .25 + i * 3) * 2 + i, a);
  }
}
function speedLines(t, amt, col = CREAM) {
  if (amt <= 0) return;
  ctx.save(); ctx.globalAlpha = amt; ctx.fillStyle = col;
  for (let i = 0; i < 34; i++) { const x = hash(i * 3.7) * W, len = 220 + hash(i) * 600, sp = 3200 + hash(i * 2) * 3000, y = ((hash(i * 9.1) * (H + len) + t * sp) % (H + len)) - len; ctx.beginPath(); ctx.roundRect(x, y, 8 + hash(i * 5) * 8, len, 6); ctx.fill(); }
  ctx.restore();
}
function bolt(x, y, ang, len, seed, fill = YELLOW) {
  const r = rng(seed), pts = []; let px = 0;
  for (let i = 0; i <= 5; i++) { pts.push([px, (i % 2 ? 1 : -1) * (14 + r() * 26)]); px += len / 5; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] - 14) : ctx.moveTo(p[0], p[1] - 14));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] - 8, pts[i][1] + 14);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}

// ============================================================
//  THE CHARACTER — rubber-hose popcorn (kernel before the pop)
// ============================================================
const BASE = { x: CX, y: 1380, s: 1.6, rot: 0, body: 'kernel', sq: 0, lh: [-112, 50], rh: [112, 50], lf: [-40, 178], rf: [40, 178], look: [0, 0], eyes: 'open', mouth: 'smile', brow: 'none', glove: ['mitt', 'mitt'], blink: 0, grey: 0, cheeks: 0, a: 1, noLegs: 0, noArms: 0, eyesOnly: 0, sweat: 0, bendL: 1, bendR: 1 };
function K(t, p, d = .3) { return { t, p, d }; }
function poseAt(keys, t) {
  let cur = { ...BASE }, target = { ...BASE };
  for (const k of keys) {
    if (t < k.t) break;
    target = { ...target, ...k.p };
    const u = E.inOut(clamp((t - k.t) / k.d)), nx = {};
    for (const key in target) {
      const a = cur[key], b = target[key];
      if (Array.isArray(b)) nx[key] = typeof b[0] === 'number' ? b.map((v, i) => lerp(a[i], v, u)) : (u > .5 ? b : a);
      else if (typeof b === 'number') nx[key] = lerp(a, b, u);
      else nx[key] = u > .5 ? b : a;
    }
    cur = nx;
  }
  return cur;
}
function walkMod(p, t, speed = 2.2, amp = 1) {
  const ph = t * speed * Math.PI * 2;
  p.lf = [p.lf[0] + Math.sin(ph) * 34 * amp, p.lf[1] - Math.max(0, Math.cos(ph)) * 34 * amp];
  p.rf = [p.rf[0] + Math.sin(ph + Math.PI) * 34 * amp, p.rf[1] - Math.max(0, Math.cos(ph + Math.PI)) * 34 * amp];
  p.lh = [p.lh[0] - Math.sin(ph) * 22 * amp, p.lh[1] + Math.cos(ph) * 10 * amp];
  p.rh = [p.rh[0] + Math.sin(ph) * 22 * amp, p.rh[1] - Math.cos(ph) * 10 * amp];
  p.y -= Math.abs(Math.sin(ph)) * 14 * amp * p.s; p.rot += Math.sin(ph) * .04 * amp;
  return p;
}
function hose(x0, y0, x1, y1, bend, lw = 15) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const cx = mx - dy / L * bend, cy = my + dx / L * bend;
  ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
  return Math.atan2(y1 - cy, x1 - cx);
}
function glove(x, y, ang, type) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.fillStyle = '#fff'; ctx.lineJoin = 'round';
  if (type === 'open') { for (const fy of [-15, 0, 15]) { ctx.beginPath(); ctx.ellipse(55, fy, 14, 8, fy * .02, 0, 7); ctx.fill(); ctx.stroke(); } }
  if (type === 'point') { ctx.beginPath(); ctx.ellipse(58, -4, 21, 9, 0, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(30, 0, 25, 23, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(24, -24, 9, 12, -.5, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-4, -17, 16, 34, 7); ctx.fill(); ctx.stroke();
  if (type !== 'open') { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(30, -8); ctx.lineTo(42, -8); ctx.moveTo(30, 6); ctx.lineTo(42, 6); ctx.stroke(); }
  ctx.restore();
}
function shoe(x, y, side) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(side * 16, 8, 38, 21, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(side * 30, -1, 10, 5, side * -.3, 0, 7); ctx.fill();
  ctx.restore();
}
function blinkAt(t) { const p = (t + 1.1) % 3.1; return p < .14 ? Math.sin(p / .14 * Math.PI) : 0; }
function face(p, t, Kb) {
  const ey = Kb ? -30 : -18, ex = 27, lk = p.look;
  for (const side of [-1, 1]) {
    const x = side * ex, wink = p.eyes === 'wink' && side === 1;
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round';
    if (p.eyes === 'happy' || wink) { ctx.beginPath(); ctx.arc(x, ey + 10, 15, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); continue; }
    if (p.eyes === 'closed') { ctx.beginPath(); ctx.arc(x, ey - 2, 15, .2, Math.PI - .2); ctx.stroke(); continue; }
    const wide = p.eyes === 'wide', rx = wide ? 21 : 17, ry = wide ? 31 : 26;
    const bl = Math.max(p.blink, wide ? 0 : blinkAt(t));
    ctx.save(); ctx.translate(x, ey); ctx.scale(1, Math.max(.1, 1 - bl));
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
    const px = lk[0] * 6, py = lk[1] * 9 + 3, pw = wide ? 8 : 10, ph = wide ? 12 : 16;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(px, py, pw, ph, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px + 1, py - 2); ctx.lineTo(px + pw * .7, py - ph * .95); ctx.lineTo(px - pw * .15, py - ph); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const x = side * ex, y = ey - 42;
    ctx.beginPath();
    if (p.brow === 'up') ctx.arc(x, y + 8, 16, Math.PI * 1.2, Math.PI * 1.8);
    else if (p.brow === 'down') { ctx.moveTo(x + side * 14, y - 4); ctx.lineTo(x - side * 12, y + 8); }
    else if (p.brow === 'worried') { ctx.moveTo(x + side * 14, y + 8); ctx.lineTo(x - side * 12, y - 4); }
    else continue;
    ctx.stroke();
  }
  const my = Kb ? 24 : 32;
  ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.fillStyle = INK;
  switch (p.mouth) {
    case 'none': break;
    case 'grin': {
      ctx.beginPath(); ctx.moveTo(-30, my - 4); ctx.quadraticCurveTo(0, my + 4, 30, my - 4); ctx.quadraticCurveTo(26, my + 44, 0, my + 44); ctx.quadraticCurveTo(-26, my + 44, -30, my - 4); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = RED; ctx.beginPath(); ctx.ellipse(4, my + 42, 18, 14, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.stroke(); break;
    }
    case 'o': ctx.beginPath(); ctx.ellipse(0, my + 12, 12, 17, 0, 0, 7); ctx.fill(); ctx.fillStyle = RED; ctx.beginPath(); ctx.ellipse(0, my + 20, 7, 6, 0, 0, 7); ctx.fill(); break;
    case 'flat': ctx.beginPath(); ctx.moveTo(-18, my + 8); ctx.lineTo(18, my + 8); ctx.stroke(); break;
    case 'worried': ctx.beginPath(); ctx.moveTo(-22, my + 12); ctx.quadraticCurveTo(-11, my + 2, 0, my + 10); ctx.quadraticCurveTo(11, my + 18, 22, my + 8); ctx.stroke(); break;
    case 'sly': ctx.beginPath(); ctx.arc(10, my - 6, 20, .35, Math.PI * .75); ctx.stroke(); break;
    default: ctx.beginPath(); ctx.arc(0, my - 8, 22, .25, Math.PI - .25); ctx.stroke();
  }
  if (p.cheeks) { ctx.fillStyle = `rgba(255,120,150,${.55 * p.cheeks})`; ctx.beginPath(); ctx.ellipse(-54, my + 6, 13, 8, 0, 0, 7); ctx.ellipse(54, my + 6, 13, 8, 0, 0, 7); ctx.fill(); }
}
const HERO_LUMPS = cloudLumps(91, 9);
function drawChar(p, t) {
  if (p.a <= 0 || p.s <= .01) return;
  ctx.save(); ctx.globalAlpha *= p.a;
  ctx.translate(p.x, p.y); ctx.rotate(p.rot);
  ctx.scale(p.s * (1 + p.sq * .45), p.s * (1 - p.sq * .45));
  if (p.grey > .01) ctx.filter = `grayscale(${p.grey})`;
  const Kb = p.body === 'kernel';
  if (p.eyesOnly) { face({ ...p, mouth: 'none' }, t, Kb); ctx.restore(); return; }
  const hx = Kb ? 26 : 34, hy = Kb ? 82 : 90, shx = Kb ? 62 : 84, shy = Kb ? 6 : 14;
  if (!p.noLegs) {
    hose(-hx, hy, p.lf[0], p.lf[1] - 10, -12); hose(hx, hy, p.rf[0], p.rf[1] - 10, 12);
    shoe(p.lf[0], p.lf[1], -1); shoe(p.rf[0], p.rf[1], 1);
  }
  if (Kb) paintKernel(ctx, 9); else paintCloud(ctx, HERO_LUMPS, 9);
  face(p, t, Kb);
  if (!p.noArms) {
    const al = hose(-shx, shy, p.lh[0], p.lh[1], 26 * p.bendL), ar = hose(shx, shy, p.rh[0], p.rh[1], -26 * p.bendR);
    glove(p.lh[0], p.lh[1], al, p.glove[0]); glove(p.rh[0], p.rh[1], ar, p.glove[1]);
  }
  if (p.sweat > .01) {
    for (let i = 0; i < 3; i++) {
      const ph = ((t * 1.6 + i / 3) % 1), sx = (i - 1) * 70 + (i - 1) * ph * 60, sy = -130 - ph * 60 + ph * ph * 120;
      ctx.save(); ctx.globalAlpha *= (1 - ph) * p.sweat; ctx.translate(sx, sy); ctx.rotate((i - 1) * .5);
      ctx.fillStyle = '#9fd8ff'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(12, 4, 0, 10); ctx.quadraticCurveTo(-12, 4, 0, -16); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
  ctx.filter = 'none';
  ctx.restore();
}
function motionMarks(x, y, s, t, amt) {
  if (amt <= 0) return;
  ctx.save(); ctx.strokeStyle = CREAM; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.globalAlpha *= amt;
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const yy = y - 60 * s + i * 50 * s, xx = x + side * (140 * s + Math.sin(t * 40 + i) * 6);
    ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + side * 40, yy - 8); ctx.stroke();
  }
  ctx.restore();
}

// ---------- props ----------
function drawBox(cx, baseY, w, h, t, inside) {
  const tw = w, bw = w * .8, top = baseY - h;
  ctx.fillStyle = '#7a1a12'; ctx.beginPath(); ctx.ellipse(cx, top, tw / 2, 44, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.stroke();
  inside(top);
  ctx.save();
  const body = () => { ctx.beginPath(); ctx.moveTo(cx - tw / 2, top); ctx.quadraticCurveTo(cx, top + 50, cx + tw / 2, top); ctx.lineTo(cx + bw / 2, baseY); ctx.lineTo(cx - bw / 2, baseY); ctx.closePath(); };
  body(); ctx.save(); ctx.clip();
  for (let i = 0; i < 9; i++) { const a0 = i / 9, a1 = (i + 1) / 9; ctx.fillStyle = i % 2 ? CREAM : RED; ctx.beginPath(); ctx.moveTo(cx - tw / 2 + tw * a0, top - 60); ctx.lineTo(cx - tw / 2 + tw * a1, top - 60); ctx.lineTo(cx - bw / 2 + bw * a1, baseY); ctx.lineTo(cx - bw / 2 + bw * a0, baseY); ctx.fill(); }
  ctx.fillStyle = 'rgba(22,17,14,.18)'; ctx.fillRect(cx + tw * .28, top - 60, tw, h + 80);
  ctx.restore();
  body(); ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.translate(cx, top + h * .5);
  spiky(0, 0, 150, 16, .86, t * .2, YELLOW, 9);
  ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(0, 0, 108, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.stroke();
  setFont(60); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = CREAM; ctx.fillText('גרעינים', 0, -6);
  setFont(30); ctx.fillStyle = YELLOW; ctx.fillText('★ ★ ★', 0, 46);
  ctx.restore();
}
function cage(cx, cy, w, h, t, t0, a = 1) {
  const n = 7;
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < n; i++) {
    const p = clamp((t - t0 - i * .04) / .5), e = E.outBounce(p); if (p <= 0) continue;
    const x = cx - w / 2 + (i + .5) * w / n, top = cy - h / 2 - (1 - e) * 1400;
    ctx.fillStyle = CREAM; ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(x - 13, top, 26, h, 13); ctx.fill(); ctx.stroke();
  }
  if (t > t0 + .35) {
    const e = E.outBack(clamp((t - t0 - .35) / .3)); ctx.fillStyle = YELLOW; ctx.strokeStyle = INK; ctx.lineWidth = 8;
    for (const yy of [cy - h / 2 - 16, cy + h / 2 - 16]) { ctx.beginPath(); ctx.roundRect(cx - (w / 2 + 20) * e, yy, (w + 40) * e, 32, 16); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
function hotplate(t, cx, cy, heat) {
  ctx.save();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(cx, cy + 26, 520, 120, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3a2a24'; ctx.beginPath(); ctx.ellipse(cx, cy, 500, 108, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.stroke();
  for (let i = 1; i <= 4; i++) { const pulse = .5 + .5 * Math.sin(t * 6 + i); ctx.strokeStyle = i % 2 ? RED : YELLOW; ctx.globalAlpha = .35 + heat * .65 * pulse; ctx.lineWidth = 14; ctx.beginPath(); ctx.ellipse(cx, cy, 104 * i, 22 * i, 0, 0, 7); ctx.stroke(); }
  ctx.restore();
}
function heatWaves(t, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = CREAM; ctx.lineWidth = 9; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const bx = 110 + i * 145, off = (t * 260 + i * 300) % 900;
    ctx.beginPath(); for (let y = 0; y < 300; y += 15) { const yy = 1700 - off - y, x = bx + Math.sin(yy * .03 + i) * 20; y ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
  }
  ctx.restore();
}
function thermometer(x, y, h, p) {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.roundRect(x - 30, y - h, 60, h, 30); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y + 18, 50, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = RED; ctx.beginPath(); ctx.roundRect(x - 16, y - h * p, 32, h * p + 20, 16); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y + 18, 36, 0, 7); ctx.fill();
  ctx.lineWidth = 6; for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x + 30, y - h * i / 8); ctx.lineTo(x + 50, y - h * i / 8); ctx.stroke(); }
  ctx.restore();
}
function stopwatch(cx, cy, r, p, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = CREAM; ctx.strokeStyle = INK; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.roundRect(cx - 34, cy - r - 70, 68, 50, 12); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r - 20, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 6; for (let i = 0; i < 12; i++) { const an = i / 12 * 6.28; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * (r - 14), cy + Math.sin(an) * (r - 14)); ctx.lineTo(cx + Math.cos(an) * (r - 40), cy + Math.sin(an) * (r - 40)); ctx.stroke(); }
  const ha = -Math.PI / 2 + p * Math.PI * 2; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * (r - 50), cy + Math.sin(ha) * (r - 50)); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.fill();
  ctx.restore();
}
function spotlight(cx, a) {
  ctx.save(); ctx.globalAlpha = a * .16; ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.moveTo(cx - 80, -20); ctx.lineTo(cx + 80, -20); ctx.lineTo(cx + 440, 1700); ctx.lineTo(cx - 440, 1700); ctx.fill();
  ctx.globalAlpha = a * .28; ctx.beginPath(); ctx.ellipse(cx, 1690, 440, 80, 0, 0, 7); ctx.fill();
  ctx.restore();
}
function cloudPuffs(t, t0) {
  const N = 26;
  for (let i = 0; i < N; i++) {
    const a = i / N * 6.28 + hash(i) * .3;
    const x = CX + Math.cos(a) * 640 + noise1(t * .5 + i) * 18, y = CY + Math.sin(a) * 1050 + noise1(t * .5 + i + 40) * 18;
    const e = E.outElastic(clamp((t - t0 - hash(i) * .3) / .9)), s = (1.4 + hash(i * 3) * 1.2) * e;
    spr(POP[i % 8], x, y, s, i + t * .1);
  }
}
function stairs(x0, y0, n, w, h, p) {
  ctx.save(); ctx.fillStyle = YELLOW; ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) { const e = E.outBack(clamp(p * n - i)); if (e <= 0) continue; ctx.beginPath(); ctx.rect(x0 + i * w, y0 - (i + 1) * h * e, w, (i + 1) * h * e + 2); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function thought(cx, cy, s, t) {
  if (s <= 0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = CREAM; ctx.strokeStyle = INK; ctx.lineWidth = 9;
  [[-150, 230, 18], [-110, 170, 28]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); });
  paintCloud(ctx, cloudLumps(55, 9).map(l => ({ x: l.x * 1.9, y: l.y * 1.2, r: l.r * 1.5 })), 9, CREAM, CREAM);
  for (let i = 0; i < 5; i++) star(Math.cos(i * 1.3 + t) * 90, Math.sin(i * 1.7 + t * 1.3) * 50, 24, t * 2 + i, i % 2 ? YELLOW : PINK, 5);
  ctx.restore();
}

// ============================================================
//  SCENES
// ============================================================
function creamStage(t) { flat(CREAM, 'ink'); rings(CX, 1380, 14, 120, INK, 4, t * .4, .12); ground(1690); shadowBlob(CX, 1694, 170); }
function sc1(t) {
  creamStage(t);
  const p = poseAt([
    K(0, { x: 1350, look: [-1, 0], mouth: 'smile' }),
    K(.02, { rh: [140, -150], glove: ['mitt', 'open'], mouth: 'grin', brow: 'up', cheeks: 1 }, .25),
    K(1.0, { look: [0, 0] }),
    K(1.25, { rh: [112, 50], lh: [-40, 4], glove: ['open', 'mitt'], look: [1, -.3], mouth: 'sly', brow: 'up', cheeks: 0 }, .3),
  ], t);
  p.x = lerp(1350, CX, E.outCubic(clamp(t / 1.0)));
  if (t < 1.0) walkMod(p, t, 2.6, 1 - clamp((t - .7) / .3));
  if (t > .1 && t < 1.2) p.rh = [p.rh[0] + Math.sin(t * 16) * 26, p.rh[1]];
  drawChar(p, t);
}
function sc2(t) {
  if (t < 3.30) {
    creamStage(t);
    drawChar(poseAt([K(0, {}), K(2.42, { rh: [96, 150], glove: ['mitt', 'point'], look: [.4, 1], mouth: 'smile', brow: 'up' }, .25)], t), t);
    return;
  }
  if (t < 4.42) {
    tunnel(t, 3.30, 'עמוק בפנים • ', { bg: INK, fg: CREAM, vp: [CX, 1040], spin: .6, travel: lt => lt * 1.2 + lt * lt * 2.6 });
    const f = E.inCubic(clamp((t - 3.30) / 1.1));
    drawChar({ ...BASE, x: CX, y: lerp(1300, 1040, f), s: lerp(1.6, .05, f), rot: f * 7, eyes: 'wide', mouth: 'o', lh: [-140, -120], rh: [140, -120], glove: ['open', 'open'], lf: [-60, 160], rf: [60, 160] }, t);
    return;
  }
  // inside the shell: yellow walls closing in
  flat(DEEP);
  const sq = E.inOut(clamp((t - 4.4) / 3.7)), sx = lerp(5.4, 4.6, sq), sy = lerp(7.4, 6.6, sq);
  ctx.save(); ctx.beginPath(); ctx.rect(-300, -300, W + 600, H + 600);
  ctx.save(); ctx.translate(CX, 1000); ctx.scale(sx, sy);
  ctx.moveTo(0, -112); ctx.bezierCurveTo(-58, -112, -86, -50, -76, 8); ctx.bezierCurveTo(-66, 64, -28, 108, 0, 116); ctx.bezierCurveTo(28, 108, 66, 64, 76, 8); ctx.bezierCurveTo(86, -50, 58, -112, 0, -112);
  ctx.restore(); ctx.fillStyle = YELLOW; ctx.fill('evenodd'); ctx.restore();
  ctx.save(); ctx.fillStyle = HT.yellow; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
  ctx.save(); ctx.translate(CX, 1000); ctx.scale(sx, sy); ctx.lineWidth = 2.8; ctx.strokeStyle = INK; kernelPath(ctx); ctx.stroke();
  ctx.globalAlpha = .5; ctx.lineWidth = 1.5; for (let i = 1; i < 4; i++) { ctx.save(); ctx.scale(1 + i * .06, 1 + i * .045); kernelPath(ctx); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  if (t > 5.3) {
    const cp = E.outExpo(clamp((t - 5.3) / .25));
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineJoin = 'round';
    for (let i = 0; i < 7; i++) { const r = rng(i + 50), a = i / 7 * 6.28 + r(); let x = CX + Math.cos(a) * 430, y = 1000 + Math.sin(a) * 760; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += Math.cos(a) * 60 * cp + (r() - .5) * 60; y += Math.sin(a) * 60 * cp + (r() - .5) * 60; ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.restore();
  }
  const p = poseAt([
    K(4.4, { y: 1330, s: 1.45, lh: [-36, 66], rh: [36, 66], lf: [-18, 176], rf: [18, 176], mouth: 'worried', brow: 'worried', look: [0, -1], bendL: 2, bendR: 2 }, .2),
    K(5.30, { sq: .28, eyes: 'closed' }, .08), K(5.55, { sq: 0, eyes: 'open', look: [-1, -.4] }, .3),
    K(6.10, { look: [1, -.4] }, .4), K(6.6, { look: [-1, 0] }, .3),
    K(7.22, { lh: [-70, 140], rh: [70, 140], bendL: 0, bendR: 0, mouth: 'flat', brow: 'down', look: [0, 0] }, .15),
  ], t);
  if (t > 7.22) p.rot = (Math.floor(t * 4) % 2 ? .06 : -.06);
  drawChar(p, t);
}
function sc3(t) {
  flat(BLUE, 'cream');
  sunburst(CX, 1500, 18, t * .05, 'rgba(255,255,255,.05)');
  const rise = E.outBack(clamp((t - 8.2) / .6), 1.2), baseY = lerp(2600, 1990, rise);
  const bi = BEATS.filter(b => b.bubble).findIndex(b => t >= b.s && t < b.e), speaking = bi < 0 ? -1 : bi % 2;
  drawBox(CX, baseY, 860, 660, t, top => {
    [-300, -175, 175, 300].forEach((x, i) => {
      const talk = speaking >= 0 && (i % 2 === speaking) && Math.sin(t * 22 + i) > 0;
      drawChar({ ...BASE, x: CX + x, y: top + 10 + Math.sin(t * 2.6 + i * 1.3) * 8, s: .62, rot: (hash(i) - .5) * .3, noLegs: 1, noArms: 1, mouth: talk ? 'o' : 'smile', look: [clamp(-x / 160, -1, 1), 0], brow: talk ? 'up' : 'none' }, t + i * .7);
    });
    drawChar(poseAt([
      K(8.2, { x: CX, y: top - 40, s: .95, noLegs: 1, lh: [-120, 70], rh: [120, 70], look: [0, 0], mouth: 'smile' }),
      K(9.44, { look: [-1, 0], mouth: 'flat' }, .25), K(10.24, { look: [1, 0] }, .25), K(11.4, { look: [0, -1], brow: 'worried' }, .3),
      K(12.22, { eyes: 'closed', mouth: 'flat' }, .3), K(13.04, { eyes: 'open', look: [0, 0], brow: 'down', mouth: 'worried' }, .25),
    ], t), t);
  });
}
function sc4(t) {
  if (t >= 20.12) {
    const f = E.inOut(clamp((t - 20.12) / 1.3));
    tunnel(t, 20.12, 'לנצח • לנצח • ', { bg: INK, fg: CREAM, vp: [CX, 1180], spin: .25, travel: lt => lt * .7 });
    ctx.save(); ctx.translate(CX, lerp(1400, 1180, f)); const k = lerp(1, .32, f); ctx.scale(k, k); ctx.translate(-CX, -1400);
    drawChar({ ...BASE, y: 1400, s: 1.5, grey: f, lh: [-96, -10], rh: [96, -10], mouth: 'worried', brow: 'worried', look: [0, 1] }, t);
    cage(CX, 1400, 400, 560, t, 18.76);
    ctx.restore();
    return;
  }
  flat(INK);
  spotlight(CX, clamp((t - 14.4) / .4));
  const p = poseAt([
    K(14.4, { y: 1400, s: 1.5, look: [0, 0] }),
    K(14.44, { lh: [-46, 4], glove: ['open', 'mitt'], look: [-.8, 0], mouth: 'sly', brow: 'up' }, .25),
    K(14.72, { look: [0, 0], eyes: 'wink', cheeks: .6 }, .2),
    K(15.62, { lh: [-130, -40], rh: [130, -40], glove: ['open', 'open'], mouth: 'worried', brow: 'worried', eyes: 'open', cheeks: 0, bendL: -1, bendR: -1 }, .3),
    K(17.2, { rh: [70, -70], glove: ['mitt', 'point'], lh: [-112, 50], look: [1, -.7], bendL: 1, bendR: 1, mouth: 'smile' }, .25),
    K(18.22, { look: [0, 0], mouth: 'o', rh: [112, 50], glove: ['mitt', 'mitt'] }, .25),
    K(18.9, { lh: [-96, -10], rh: [96, -10], mouth: 'worried', brow: 'worried', sweat: 1 }, .2),
  ], t);
  const jit = t > 18.9 ? noise1(t * 30) * 8 : 0;
  if (t > 18.9) { p.x += jit; p.lh = [p.lh[0], p.lh[1] + Math.sin(t * 30) * 10]; p.rh = [p.rh[0], p.rh[1] - Math.sin(t * 30) * 10]; }
  drawChar(p, t);
  if (t > 18.76) cage(CX + jit, 1400, 400, 560, t, 18.76);
}
function sc5(t) {
  if (t < 22.42) {
    flat(INK);
    drawChar({ ...BASE, y: 1320, s: 1.6, eyesOnly: 1, look: [Math.sin(t * 3) > 0 ? 1 : -1, 0], eyes: 'wide', brow: 'worried' }, t);
    return;
  }
  const lt = t - 22.42;
  flat(RED);
  sunburst(CX, 900, 14, lt * .6, ORANGE);
  spiky(CX, 900, 620 * E.outElastic(clamp(lt / .6)), 14, .66, lt * .2, YELLOW, 16);
  spiky(CX, 900, 420 * E.outElastic(clamp((lt - .06) / .6)), 12, .62, -lt * .3, CREAM, 12);
  ring(t, 22.42, CX, 900, 1500, CREAM, 60, .8); ring(t, 22.58, CX, 900, 1300, INK, 30, .8);
  burst(t, 22.42, CX, 1000, 30, 777, { speed: 2600, g: 900, life: 1.6, smin: .2, smax: .5, drag: 1.4, kernel: .5, dof: true });
  confetti(t, 22.42, CX, 950, 40, 3, { speed: 1800, g: 900, life: 1.4 });
  const up = E.outCubic(clamp(lt / .8));
  drawChar({ ...BASE, x: CX + lt * 200, y: lerp(1450, 250, up), s: 1.3, rot: lt * 8, eyes: 'wide', mouth: 'o', brow: 'up', lh: [-150, -110], rh: [150, -110], glove: ['open', 'open'], lf: [-90, 150], rf: [90, 150] }, t);
}
function sc6(t) {
  const lt = t - 23.3, heat = clamp(lt / 3);
  flat(ORANGE, 'ink');
  rings(CX, 1700, 16, 120, RED, 34, t * .8, .45);
  heatWaves(t, .35 + heat * .4);
  hotplate(t, CX, 1700, heat);
  thermometer(110, 1350, 700, lerp(.12, .96, E.inOut(clamp(lt / 6.5))));
  const p = poseAt([
    K(23.3, { y: 1450, s: 1.55, mouth: 'o', eyes: 'wide', lh: [-140, -60], rh: [140, -60], glove: ['open', 'open'] }),
    K(23.8, { mouth: 'grin', eyes: 'open', brow: 'worried', sweat: 1, lh: [-120, 20], rh: [120, 20] }, .3),
    K(26.08, { lh: [-74, -70], glove: ['open', 'mitt'], look: [-1, -1], mouth: 'o', brow: 'up', sweat: 0 }, .3),
    K(27.96, { rh: [96, -200], glove: ['mitt', 'mitt'], lh: [-112, 50], brow: 'down', mouth: 'grin', look: [0, -.5] }, .15),
    K(29.26, { lh: [-130, -170], rh: [130, -170], glove: ['open', 'open'], eyes: 'happy', cheeks: 1 }, .15),
  ], t);
  p.y = lerp(-400, 1450, E.outBounce(clamp(lt / .5)));
  if (lt > .5 && t < 26.08) { const hop = Math.sin(t * 22); p.lf = [p.lf[0], p.lf[1] - Math.max(0, hop) * 46]; p.rf = [p.rf[0], p.rf[1] - Math.max(0, -hop) * 46]; p.y -= Math.abs(hop) * 14; }
  if (t > 27.96 && t < 28.6) p.y -= Math.sin((t - 27.96) / .64 * Math.PI) * 160;
  p.x += noise1(t * 30) * heat * 5;
  shadowBlob(CX, 1700, 150, .3);
  drawChar(p, t);
  if (t > 26.0 && t < 27.95) for (let k = 0; k < 3; k++) { const ph = ((t - 26) * 1.4 + k / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - ph; ctx.strokeStyle = CREAM; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(CX - 200, 1380, 40 + ph * 120, Math.PI * .75, Math.PI * 1.25); ctx.stroke(); ctx.restore(); }
  if (t > 29.26) { burst(t, 29.3, CX, 650, 22, 31, { speed: 1600, g: 1400, life: 1.4, smin: .14, smax: .3, drag: 1, kernel: 1 }); confetti(t, 29.3, CX, 650, 30, 12, { speed: 1400, g: 900, life: 1.2 }); }
}
function sc7(t) {
  const lt = t - 30.18, energy = clamp(lt / 3);
  const frozen = t > 34.9 && t < 35.76, tt = frozen ? 34.9 : t;
  flat(BLUE, 'pink');
  sunburst(CX, 1400, 20, tt * .4, 'rgba(255,143,214,.18)');
  const launch = t > 36.16 ? E.inExpo(clamp((t - 36.16) / .45)) : 0, ky = 1420 - launch * 2000;
  if (!frozen && t < 36.3) for (let i = 0; i < 6; i++) { const f = Math.floor(t * 12); if (hash(f * 7 + i) > .3 + energy * .5) continue; const a = i / 6 * 6.28 + hash(f + i) * .8; bolt(CX + Math.cos(a) * 210, ky + Math.sin(a) * 260, a, 200 + hash(i + f) * 140, f * 10 + i, i % 2 ? YELLOW : PINK); }
  if (t < 36.16) for (let k = 0; k < 3; k++) { const ph = ((tt * 1.3 + k / 3) % 1); ctx.save(); ctx.globalAlpha = (1 - ph) * energy; ctx.strokeStyle = PINK; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(CX, ky, 200 + ph * 400, 0, 7); ctx.stroke(); ctx.restore(); }
  if (t > 34.58 && t < 35.76) stopwatch(CX, 1420, 320, E.outCubic(clamp((t - 34.58) / 1.0)), clamp((t - 34.58) / .15) * clamp((35.76 - t) / .12));
  const p = poseAt([
    K(30.18, { y: 1420, s: 1.6, lh: [-120, 80], rh: [120, 80], brow: 'down', mouth: 'grin', look: [0, 0], bendL: -1, bendR: -1 }, .3),
    K(32.8, { eyes: 'wide' }, .2),
    K(34.58, { sq: .3, lf: [-80, 178], rf: [80, 178], lh: [-110, 20], rh: [110, 20], eyes: 'open', look: [0, -1], brow: 'down', mouth: 'flat', bendL: 1, bendR: 1 }, .3),
    K(35.76, { sq: -.15, lh: [-60, -190], rh: [60, -190], mouth: 'grin', eyes: 'happy', lf: [-30, 190], rf: [30, 190] }, .3),
  ], tt);
  const vib = frozen ? 0 : (t > 32.8 && t < 34.6 ? 16 : 5 * energy);
  p.x += noise1(tt * 60) * vib; p.y = ky + noise1(tt * 55 + 3) * vib; p.sq -= launch * .4;
  drawChar(p, tt);
  if (!frozen && t < 36.1) motionMarks(p.x, p.y, p.s, t, clamp(vib / 10));
  if (frozen) { ctx.save(); ctx.fillStyle = 'rgba(22,17,14,.22)'; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore(); }
  speedLines(t, launch * .7 + (t > 36.6 ? .3 : 0));
  if (t > 36.16) confetti(t, 36.16, CX, 1450, 30, 77, { speed: 900, g: 1200, life: 1.2, dir: Math.PI / 2, spread: 2.5 });
}
function sc8(t) {
  const popT = 39.10;
  if (t < popT) {
    flat(BLUE, 'cream');
    rings(CX, 1300, 12, 140, CREAM, 6, -t, .12);
    const fall = E.outBounce(clamp((t - 37.52) / .7));
    let p;
    if (t < 38.22) {
      p = { ...BASE, y: lerp(-400, 1350, fall), s: 1.5, rot: (1 - fall) * 9, eyes: t > 37.9 ? 'wide' : 'closed', mouth: 'o', lh: [-140, -80], rh: [140, -80], glove: ['open', 'open'] };
      if (t > 37.9) for (let i = 0; i < 4; i++) star(CX + Math.cos(t * 6 + i * 1.6) * 160, 1080 + Math.sin(t * 6 + i * 1.6) * 40, 26, t * 3, YELLOW, 5);
    } else {
      const rp = E.inOut(clamp((t - 38.22) / .85));
      p = { ...BASE, x: lerp(CX + 420, CX, rp), y: 1420, s: 1.35, rot: -rp * Math.PI * 4, lh: [-40, 70], rh: [40, 70], lf: [-20, 140], rf: [20, 140], eyes: 'closed', mouth: 'grin', bendL: 2, bendR: 2 };
    }
    if (t > 38.85) p.sq = Math.sin((t - 38.85) * 40) * .15;
    drawChar(p, t);
    return;
  }
  const lt = t - popT;
  if (t < 43.94) {
    flat(PINK, 'cream');
    sunburst(CX, 1300, 16, t * .1, 'rgba(255,243,220,.35)');
    cloudPuffs(t, popT);
    floaters(t, 12, 21);
    const p = poseAt([
      K(39.1, { body: 'pop', y: 1330, lh: [-160, -150], rh: [160, -150], glove: ['open', 'open'], mouth: 'grin', eyes: 'happy', cheeks: 1, lf: [-50, 190], rf: [50, 190] }, .01),
      K(40.08, { eyes: 'open', look: [-1, -.5] }, .3), K(40.68, { look: [1, -.5] }, .3),
      K(41.68, { look: [0, 0], lh: [-150, 40], rh: [150, 40], eyes: 'happy' }, .4),
      K(43.20, { lh: [-74, 20], rh: [74, 20], glove: ['mitt', 'mitt'], mouth: 'smile' }, .2),
    ], t);
    p.s = 2.0 * E.outElastic(clamp(lt / 1.0)); p.y += Math.sin(t * 2) * 20;
    if (t > 43.2) p.sq = Math.sin((t - 43.2) * 9) * Math.exp(-(t - 43.2) * 1.5) * .35;
    else if (lt < .8) p.sq = Math.sin(lt * 14) * Math.exp(-lt * 4) * .4;
    drawChar(p, t);
    if (lt < .6) {
      const e = E.outExpo(clamp(lt / .35)); ctx.save(); ctx.globalAlpha = 1 - clamp((lt - .3) / .3);
      spiky(CX, 1300, 1500 * e, 18, .75, lt, CREAM, 18); spiky(CX, 1300, 900 * e, 14, .7, -lt, YELLOW, 14);
      setFont(Math.max(1, 330 * e)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PINK; ctx.strokeStyle = INK; ctx.lineWidth = 24; ctx.lineJoin = 'round'; ctx.strokeText('פופ!', CX, 1300); ctx.fillText('פופ!', CX, 1300); ctx.restore();
    }
    burst(t, popT, CX, 1300, 30, 123, { speed: 2200, g: 700, life: 2.4, smin: .2, smax: .5, drag: 1.5, dof: true });
    return;
  }
  flat(CREAM, 'pink');
  const out = 47.25, swap = t >= 45.86;
  giant(t, swap ? 45.86 : 44.78, swap ? 'שמחה' : 'אושר', 760, 470, PINK, { out: swap ? out : 45.66 });
  ribbon(t, 44.0, 'אושר צרוף • שמחה מתפרצת • ', { col: BLUE, text: CREAM, cy: 780, ax: 230, ay: 330, loops: 2.2, phase: .6, tilt: 600, drift: .25, speed: 260, size: 64, width: 150, drawOn: 1.0, out });
  const p = { ...BASE, body: 'pop', y: 1540, s: 1.2, eyes: 'happy', mouth: 'grin', cheeks: 1, glove: ['open', 'open'] }, ph = t * 4.2;
  p.lh = [-150 + Math.sin(ph) * 30, -120 + Math.cos(ph) * 50]; p.rh = [150 + Math.sin(ph + 1) * 30, -120 - Math.cos(ph) * 50];
  p.lf = [-50, 190 - Math.max(0, Math.sin(ph)) * 40]; p.rf = [50, 190 - Math.max(0, -Math.sin(ph)) * 40];
  p.rot = Math.sin(ph) * .12; p.y -= Math.abs(Math.sin(ph)) * 30;
  if (t > out) p.y += E.inCubic(clamp((t - out) / .4)) * 900;
  shadowBlob(CX, 1770, 150);
  drawChar(p, t);
  if (t > 46.62) { burst(t, 46.62, CX, 1400, 26, 555, { speed: 1800, g: 1300, life: 1.8, smin: .18, smax: .4, drag: 1 }); confetti(t, 46.62, CX, 1300, 40, 8, { speed: 1600, g: 1100, life: 1.6 }); }
}
function sc9(t) {
  flat(CREAM, 'ink');
  const gy = 1740;
  ground(gy);
  const walking = (t < 50.7) || (t > 52.86 && t < 53.86);
  ctx.save(); ctx.fillStyle = INK; const scrollX = Math.min(t, 50.7) * 260 + clamp(t - 52.86, 0, 1) * 260; for (let i = 0; i < 12; i++) { const x = ((i * 120 - scrollX) % 1440 + 1440) % 1440 - 180; ctx.fillRect(x, gy + 30, 60, 8); } ctx.restore();
  const climb = t > 52.86 ? clamp((t - 52.86) / .9) : 0;
  if (t > 52.7 && t < 54.1) stairs(CX - 210, gy, 3, 140, 70, clamp((t - 52.7) / .35) * (t > 53.8 ? 1 - clamp((t - 53.8) / .3) : 1));
  const p = poseAt([
    K(47.7, { body: 'pop', y: 1535, s: 1.25, mouth: 'smile', look: [0, 0], lh: [-118, 40], rh: [118, 40] }),
    K(50.76, { lh: [-40, 20], look: [0, 0], cheeks: .5 }, .3),
    K(51.64, { brow: 'down', rh: [100, -60], lh: [-118, 40], mouth: 'flat', cheeks: 0 }, .2),
    K(52.86, { brow: 'none', mouth: 'smile', rh: [118, 40] }, .3),
    K(53.86, { brow: 'down', lh: [-110, -150], rh: [110, -150], mouth: 'grin' }, .15),
    K(54.68, { lh: [-210, -30], rh: [210, -30], glove: ['open', 'open'], eyes: 'happy', brow: 'none', cheeks: 1, bendL: .2, bendR: .2 }, .35),
    K(56.64, { lh: [-118, 40], rh: [118, 40], eyes: 'open', glove: ['mitt', 'mitt'], bendL: 1, bendR: 1, mouth: 'smile' }, .3),
    K(57.18, { eyes: 'wide', mouth: 'o', lh: [-150, -130], rh: [150, -130] }, .15),
    K(58.22, { eyes: 'happy', mouth: 'grin', glove: ['open', 'open'] }, .2),
  ], t);
  if (walking) walkMod(p, t, 1.8, .9);
  const stepH = t < 53.86 ? E.inOut(climb) * 210 : 210 * (1 - E.inOut(clamp((t - 53.9) / .5)));
  p.y -= stepH;
  if (t > 57.18 && t < 57.8) p.y -= Math.sin((t - 57.18) / .62 * Math.PI) * 220;
  if (t > 58.22) { const j = Math.abs(Math.sin((t - 58.22) * 5)); p.y -= j * 140; p.sq = (1 - j) * .2; }
  if (t > 54.68 && t < 56.6) { ctx.save(); ctx.translate(CX, p.y); ctx.rotate(t * .3); ctx.strokeStyle = PINK; ctx.lineWidth = 14; ctx.lineCap = 'round'; for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, -330); ctx.lineTo(0, -400 - Math.sin(t * 6 + i) * 30); ctx.stroke(); } ctx.restore(); }
  shadowBlob(CX, gy, 140);
  drawChar(p, t);
  if (t > 57.55) { burst(t, 57.56, CX, 640, 34, 999, { speed: 1900, g: 1400, life: 2.0, smin: .2, smax: .5, drag: .9, dof: true }); confetti(t, 57.56, CX, 640, 40, 4, { speed: 1600, g: 900, life: 1.6 }); }
  if (t > 58.52) fountain(t, 58.52, 59.4, CX, 1400, 22, 77, { life: 1.8, vx: 900, vy: 1800, g: 1700, w: 100, smin: .16, smax: .34 });
}
function sc10(t) {
  flat(BLUE, 'pink');
  sunburst(CX, 1300, 24, t * .08, 'rgba(255,243,220,.06)');
  floaters(t, 10, 66, .9);
  if (t > 66.62) giant(t, 66.62, 'גדול', 760, 560, PINK, { pops: true, out: 67.95 });
  const p = poseAt([
    K(59.42, { body: 'pop', y: 1480, s: 1.3, lh: [-80, 70], rh: [80, 70], bendL: -2.4, bendR: -2.4, mouth: 'smile', look: [0, 0] }, .25),
    K(62.0, { look: [1, 0], mouth: 'flat' }, .3),
    K(63.52, { eyes: 'wide', mouth: 'o', brow: 'up', lh: [-150, -140], rh: [150, -140], glove: ['open', 'open'], bendL: 1, bendR: 1, sweat: 1, look: [0, 0] }, .12),
    K(64.88, { eyes: 'open', mouth: 'smile', brow: 'none', sweat: 0, lh: [-118, 40], rh: [118, 40], glove: ['mitt', 'mitt'] }, .3),
    K(66.62, { s: 1.75, eyes: 'happy', mouth: 'grin', cheeks: 1, lh: [-170, -120], rh: [170, -120], glove: ['open', 'open'] }, .5),
    K(68.04, { s: 1.55, eyes: 'open', look: [.6, -1], mouth: 'smile', lh: [-22, 64], rh: [22, 64], glove: ['mitt', 'mitt'], bendL: 1.6, bendR: 1.6, cheeks: .6 }, .4),
  ], t);
  if (t > 59.46 && t < 60.3) p.y += Math.abs(Math.sin((t - 59.46) * 8)) * 18;
  if (t > 63.52 && t < 64.1) p.y -= Math.sin((t - 63.52) / .58 * Math.PI) * 160;
  if (t > 66.62 && t < 67.5) p.sq = Math.sin((t - 66.62) * 14) * Math.exp(-(t - 66.62) * 3) * .3;
  drawChar(p, t);
  if (t > 67.26 && t < 68.0) for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + t, r = 300 + Math.sin(t * 5 + i) * 40; star(CX + Math.cos(a) * r, 1300 + Math.sin(a) * r * .7, 30 + 10 * Math.sin(t * 8 + i), t * 3 + i, i % 2 ? YELLOW : CREAM, 6); }
  if (t > 68.3) thought(820, 1000, E.outBack(clamp((t - 68.3) / .5)), t);
  if (t > 69.76) { confetti(t, 69.76, CX, 900, 50, 33, { speed: 1600, g: 900, life: 1.8 }); burst(t, 69.76, CX, 1000, 24, 34, { speed: 1800, g: 1300, life: 1.8, smin: .2, smax: .4, drag: 1 }); }
}
function sc11(t) {
  if (t < 73.52) {
    flat(BLUE, 'pink');
    sunburst(CX, 1300, 24, t * .08, 'rgba(255,243,220,.06)');
    floaters(t, 10, 66, .9);
    const p = poseAt([
      K(70.8, { body: 'pop', y: 1480, s: 1.45, look: [0, 0], mouth: 'smile', lh: [-118, 40], rh: [100, -170], glove: ['mitt', 'point'], brow: 'up' }, .3),
      K(72.34, { eyes: 'happy', mouth: 'grin', cheeks: 1 }, .2),
    ], t);
    p.rh = [p.rh[0], p.rh[1] + Math.sin(t * 7) * 10];
    drawChar(p, t);
    if (t > 72.34) burst(t, 72.34, CX, 880, 26, 63, { speed: 1800, g: 1300, life: 1.8, smin: .18, smax: .4, drag: 1 });
    return;
  }
  flat(CREAM, 'pink');
  sunburst(CX, 1100, 20, t * .15, 'rgba(255,143,214,.25)');
  ribbon(t, 73.6, 'לא לפחד להשתנות • ', { col: BLUE, text: CREAM, cy: 1000, ax: 190, ay: 280, loops: 1.6, phase: 2.4, tilt: -500, drift: .2, speed: 240, size: 62, width: 140, drawOn: 1.1 });
  if (t > 74.36) giant(t, 74.36, 'להשתנות', 1000, 250, PINK, { pops: true, paint: 'pink' });
  const p = poseAt([
    K(73.5, { body: 'pop', y: 1540, s: 1.3, eyes: 'happy', mouth: 'grin', cheeks: 1, lh: [-160, -140], rh: [160, -140], glove: ['open', 'open'] }, .2),
    K(75.6, { lh: [-118, 40], rh: [140, -150], glove: ['mitt', 'open'], eyes: 'open', look: [0, 0] }, .4),
    K(76.4, { rot: .2, eyes: 'happy' }, .4),
  ], t);
  if (t < 75.6) { const j = Math.abs(Math.sin((t - 73.5) * 4.5)); p.y -= j * 120; p.sq = (1 - j) * .2; }
  else p.rh = [p.rh[0] + Math.sin(t * 14) * 26, p.rh[1]];
  shadowBlob(CX, 1800, 140);
  drawChar(p, t);
  if (t > 74.36) { ring(t, 74.36, CX, 1000, 1300, PINK, 50, .9); confetti(t, 74.36, CX, 1000, 70, 91, { speed: 1900, g: 900, life: 2.6 }); fountain(t, 74.4, 77.6, CX, 1500, 12, 5, { life: 2.2, vx: 1100, vy: 1700, g: 1500, w: 200, smin: .18, smax: .4 }); }
}
const SCENES = [
  { s: 0, e: 2.42, draw: sc1 }, { s: 2.42, e: 8.20, draw: sc2 }, { s: 8.20, e: 14.40, draw: sc3, tr: 'iris' },
  { s: 14.40, e: 21.42, draw: sc4, tr: 'wipe' }, { s: 21.42, e: 23.30, draw: sc5 }, { s: 23.30, e: 30.18, draw: sc6 },
  { s: 30.18, e: 37.52, draw: sc7, tr: 'wipe' }, { s: 37.52, e: 47.70, draw: sc8 }, { s: 47.70, e: 59.42, draw: sc9, tr: 'wipe' },
  { s: 59.42, e: 70.80, draw: sc10, tr: 'iris' }, { s: 70.80, e: 99, draw: sc11 },
];

// ---------- camera events ----------
const SHAKES = [[0.02, 10, .4], [5.30, 26, .5], [7.22, 8, .3], [22.42, 70, .9], [22.58, 60, .9], [27.96, 30, .5], [29.26, 40, .6], [39.10, 55, .8], [53.86, 22, .4], [57.56, 45, .7], [66.62, 30, .6], [69.76, 24, .5], [74.36, 40, .8]];
const FLASH = [[22.42, .22, .9, CREAM], [39.10, .2, .9, '#ffffff'], [57.56, .15, .5, CREAM], [74.36, .25, .7, '#ffffff']];
const PUNCH = [[0.0, .06], [2.46, .05], [8.28, .05], [14.44, .05], [22.42, .14], [27.96, .08], [29.26, .1], [37.58, .06], [39.10, .12], [47.92, .04], [53.86, .07], [57.56, .1], [59.46, .05], [64.88, .05], [66.62, .08], [70.84, .05], [74.36, .12]];
function shakeAt(t) {
  let x = 0, y = 0, r = 0;
  for (const [t0, a, d] of SHAKES) { const dt = t - t0; if (dt < 0 || dt > d) continue; const k = Math.pow(1 - dt / d, 2) * a; x += noise1(dt * 38 + t0) * k; y += noise1(dt * 41 + t0 + 9) * k; r += noise1(dt * 30 + t0 + 3) * k * .0012; }
  const tr = (t > 32.7 && t < 34.6 ? 9 : 0) + (t > 21.5 && t < 22.42 ? (t - 21.5) * 10 : 0);
  x += noise1(t * 55) * tr; y += noise1(t * 61 + 4) * tr;
  return { x, y, r };
}
function punchAt(t) { let z = 0; for (const [t0, a] of PUNCH) { const dt = t - t0; if (dt >= 0 && dt < .5) z += a * (1 - E.outCubic(dt / .5)); } return z; }

function overlays(t, frame) {
  let fl = 0, fc = CREAM; for (const [t0, d, a, c] of FLASH) { const dt = t - t0; if (dt >= 0 && dt < d && a * (1 - dt / d) > fl) { fl = a * (1 - dt / d); fc = c; } }
  if (fl > 0) { ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = fc; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const vg = ctx.createRadialGradient(CX, CY, 600, CX, CY, 1250);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(22,17,14,.28)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .07; ctx.globalCompositeOperation = 'overlay';
  const ox = Math.floor(hash(frame) * 512), oy = Math.floor(hash(frame + 7) * 512);
  for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(GRAIN, x, y);
  ctx.restore();
  const fade = Math.max(clamp(1 - t / .25), clamp((t - (DURATION - .9)) / .9));
  if (fade > 0) { ctx.fillStyle = `rgba(22,17,14,${fade})`; ctx.fillRect(0, 0, W, H); }
}
function drawScene(sc, t) {
  const lt = t - sc.s, enter = 1 - E.outExpo(clamp(lt / .35)), z = 1 + lt * .004 + enter * .1;
  const sh = shakeAt(t), pz = punchAt(t);
  ctx.save(); ctx.translate(CX + sh.x, CY + sh.y); ctx.rotate(sh.r); ctx.scale(z + pz, z + pz); ctx.translate(-CX, -CY);
  sc.draw(t); ctx.restore();
}
function render(t) {
  const frame = Math.round(t * 30);
  ctx = MAIN;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  const i = SCENES.findIndex(s => t >= s.s && t < s.e), sc = SCENES[i < 0 ? SCENES.length - 1 : i], lt = t - sc.s;
  if (sc.tr && lt < .4 && i > 0) {
    ctx = BCTX; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; drawScene(SCENES[i - 1], t); ctx = MAIN;
    ctx.drawImage(BUF, 0, 0);
    const p = E.inOut(clamp(lt / .4));
    const shape = () => { ctx.beginPath(); if (sc.tr === 'iris') ctx.arc(CX, 1300, Math.max(1, p * 2300), 0, 7); else { ctx.moveTo(-300, -300); ctx.lineTo(W + 300, -300); ctx.lineTo(W + 300, -300 + p * 2900); ctx.lineTo(-300, -300 + p * 2900 - 500); ctx.closePath(); } };
    ctx.save(); shape(); ctx.clip(); drawScene(sc, t); ctx.restore();
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 26; shape(); ctx.stroke(); ctx.restore();
  } else drawScene(sc, t);
  const sh = shakeAt(t), pz = punchAt(t);
  ctx.save(); ctx.translate(CX + sh.x * 1.2, CY + sh.y * 1.2); ctx.rotate(sh.r); ctx.scale(1 + pz * .6, 1 + pz * .6); ctx.translate(-CX, -CY);
  drawBeats(t);
  ctx.restore();
  overlays(t, frame);
}
(async () => {
  await document.fonts.load(`700 100px ${FONT}`);
  await document.fonts.ready;
  buildSprites();
  render(0);
  READY_ = true;
})();


return { render, DURATION, ready: () => READY_ };
})();
