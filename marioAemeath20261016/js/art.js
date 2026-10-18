// 美术与音效：星空遗迹图块、视差背景、Q版爱弥斯、星空化怪物与道具、WebAudio 合成音效/音乐
'use strict';
const TAU = Math.PI * 2;
const TS = 32, VW = 960, VH = 540;
const T = TILE;

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function star4(g, x, y, r, inner = 0.38) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * inner : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
function star5(g, x, y, r, ri, rot = 0) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2 + rot, rr = i % 2 ? ri : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); }

// ================= 世界主题 =================
const THEMES = [
  { name: '星海草原', sky: ['#1a1242', '#5a2c7c', '#ff9ab4'], grassA: '#ff8db8', grassB: '#ffb46c', dirtA: '#a24c7e', dirtB: '#6a2c5e', stoneA: '#a693cc', stoneB: '#6f5c99', brickA: '#e070b0', brickB: '#a8407e', ruin: 'rgba(70,34,110,0.55)', ruin2: 'rgba(110,60,150,0.4)', cloud: '#ffd2e2', neb: ['rgba(255,140,190,0.32)', 'rgba(120,225,255,0.22)', 'rgba(255,190,120,0.25)'], boss: ['#6a4ac8', '#2a1a66'] },
  { name: '云端遗迹', sky: ['#2b3c92', '#8a6ccc', '#ffc9b2'], grassA: '#ffb2cc', grassB: '#ffd49c', dirtA: '#b97a9c', dirtB: '#86507a', stoneA: '#c2b4e6', stoneB: '#8a78b8', brickA: '#ee86bc', brickB: '#b45690', ruin: 'rgba(90,72,170,0.42)', ruin2: 'rgba(150,120,210,0.35)', cloud: '#fff2f8', neb: ['rgba(255,200,230,0.35)', 'rgba(140,235,255,0.28)', 'rgba(255,220,170,0.3)'], boss: ['#4aa8d8', '#1f4a8a'] },
  { name: '深空晶洞', sky: ['#05041a', '#1c1048', '#3c1f6c'], grassA: '#c994ff', grassB: '#ff9fd2', dirtA: '#4d2c7a', dirtB: '#2c1650', stoneA: '#7a66b0', stoneB: '#40306e', brickA: '#b066d6', brickB: '#6c3496', ruin: 'rgba(16,8,46,0.65)', ruin2: 'rgba(60,30,110,0.45)', cloud: '#dcbcff', neb: ['rgba(160,90,255,0.3)', 'rgba(90,230,255,0.25)', 'rgba(255,120,200,0.22)'], boss: ['#3ad0c8', '#1a4a6a'] },
  { name: '珊瑚星湾', sky: ['#0e2a5a', '#3a6aa8', '#ffb0b8'], grassA: '#ff9ab0', grassB: '#7ae8e0', dirtA: '#3a7a9a', dirtB: '#1e4a6e', stoneA: '#9ad0dc', stoneB: '#4a8aa6', brickA: '#ff8aa8', brickB: '#c0507a', ruin: 'rgba(20,50,100,0.5)', ruin2: 'rgba(60,110,160,0.38)', cloud: '#d8f6ff', neb: ['rgba(120,230,255,0.3)', 'rgba(255,150,190,0.28)', 'rgba(255,220,160,0.22)'], boss: ['#3ac8d8', '#163a6a'] },
  { name: '极光冰原', sky: ['#0a1838', '#2a5a8a', '#b8f0ff'], grassA: '#e8fbff', grassB: '#ffd0e8', dirtA: '#7ab0d8', dirtB: '#3a6a9e', stoneA: '#c8e4f6', stoneB: '#7aa0c8', brickA: '#a8d8ff', brickB: '#5a8ad0', ruin: 'rgba(30,60,110,0.5)', ruin2: 'rgba(110,170,220,0.32)', cloud: '#ffffff', neb: ['rgba(120,255,200,0.3)', 'rgba(160,130,255,0.28)', 'rgba(255,170,220,0.22)'], boss: ['#bfe8ff', '#4a6aa8'], planet: ['#ffffff', '#b8e8ff', '#6a8ad0'] },
  { name: '落日钟楼', sky: ['#3a1a4a', '#c8507a', '#ffc070'], grassA: '#ffb06a', grassB: '#ff7e9a', dirtA: '#9a5038', dirtB: '#62302a', stoneA: '#d8a888', stoneB: '#9a6a5a', brickA: '#e88a5a', brickB: '#a8503a', ruin: 'rgba(90,30,50,0.55)', ruin2: 'rgba(160,70,80,0.38)', cloud: '#ffd8b8', neb: ['rgba(255,170,100,0.35)', 'rgba(255,120,170,0.28)', 'rgba(140,220,255,0.18)'], boss: ['#e0904a', '#5a2a2a'], planet: ['#fff2c0', '#ffb060', '#e05a5a'] },
  { name: '月影花园', sky: ['#060a20', '#1a2050', '#4a3a7a'], grassA: '#9ae8b8', grassB: '#ffaad8', dirtA: '#2e4a5a', dirtB: '#1a2a3a', stoneA: '#8a9ab8', stoneB: '#4a5a7a', brickA: '#c88ad8', brickB: '#7a4a9a', ruin: 'rgba(10,16,40,0.65)', ruin2: 'rgba(40,60,100,0.45)', cloud: '#c8d8ff', neb: ['rgba(150,180,255,0.25)', 'rgba(200,120,255,0.22)', 'rgba(120,255,200,0.15)'], boss: ['#6a8a5a', '#1a2a2a'], planet: ['#ffffff', '#f0f0ff', '#a0a8d0'] },
  { name: '银河列车', sky: ['#04021a', '#2a1a6a', '#8a4ab0'], grassA: '#a8b8ff', grassB: '#ffd36e', dirtA: '#3a3a7a', dirtB: '#1e1a4a', stoneA: '#9a9ad8', stoneB: '#5a5a9a', brickA: '#8a7aff', brickB: '#4a3ab0', ruin: 'rgba(14,8,50,0.6)', ruin2: 'rgba(70,50,150,0.4)', cloud: '#e0d8ff', neb: ['rgba(140,120,255,0.35)', 'rgba(255,200,120,0.25)', 'rgba(120,230,255,0.28)'], boss: ['#8a7aff', '#2a1a6a'] },
  { name: '熔星火山', sky: ['#1a0610', '#5a1a20', '#ff7a4a'], grassA: '#ffa04a', grassB: '#ff5a7a', dirtA: '#5a2420', dirtB: '#2e1010', stoneA: '#8a5a50', stoneB: '#4a2a28', brickA: '#d8603a', brickB: '#8a2a20', ruin: 'rgba(40,8,10,0.65)', ruin2: 'rgba(110,30,30,0.45)', cloud: '#ffb08a', neb: ['rgba(255,120,60,0.32)', 'rgba(255,80,120,0.25)', 'rgba(255,210,120,0.22)'], boss: ['#ff6a3a', '#4a0e0e'], planet: ['#ffe0a0', '#ff6a3a', '#7a1010'] },
  { name: '噪音王城', sky: ['#10061a', '#3c0f30', '#7c2646'], grassA: '#ff7c98', grassB: '#ffa25c', dirtA: '#622244', dirtB: '#3a1028', stoneA: '#8a6a8c', stoneB: '#4c3050', brickA: '#cc5480', brickB: '#82284e', ruin: 'rgba(40,6,26,0.65)', ruin2: 'rgba(90,24,60,0.45)', cloud: '#ffb4c6', neb: ['rgba(255,90,130,0.3)', 'rgba(120,220,255,0.18)', 'rgba(255,160,80,0.25)'], boss: ['#e04a7a', '#4a0e2a'], planet: ['#ffd0b0', '#e0506a', '#5a1030'] },
];
// 暮光篇 / 终焉篇：在前 10 个世界的配色上整体变调，地面保留粉橙星光纹理
function shiftColor(c, dh, ks, kl) {
  let r, g, b, a = null, m;
  if ((m = /^#([0-9a-f]{6})$/i.exec(c))) { const n = parseInt(m[1], 16); r = n >> 16; g = n >> 8 & 255; b = n & 255; }
  else if ((m = /^rgba\(([\d.]+),([\d.]+),([\d.]+),([\d.]+)\)$/.exec(c.replace(/\s/g, '')))) { r = +m[1]; g = +m[2]; b = +m[3]; a = m[4]; }
  else return c;
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, sat = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn; sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
  }
  h = (h + dh + 360) % 360; sat = Math.min(1, sat * ks); l = Math.min(1, l * kl);
  const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p = 2 * l - q;
  const f = t => { t = (t + 360) % 360 / 360; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  const R = Math.round(f(h + 120) * 255), G2 = Math.round(f(h) * 255), B = Math.round(f(h - 120) * 255);
  return a === null ? '#' + ((1 << 24) | (R << 16) | (G2 << 8) | B).toString(16).slice(1) : `rgba(${R},${G2},${B},${a})`;
}
const CHAPTER_TONES = [null, { dh: -28, ks: 1.05, kl: 0.8 }, { dh: 22, ks: 1.15, kl: 0.62 }];
for (let ch = 1; ch < CHAPTER_TONES.length; ch++) for (let i = 0; i < 10; i++) {
  const base = THEMES[i], t = CHAPTER_TONES[ch], f = c => shiftColor(c, t.dh, t.ks, t.kl), o = {};
  for (const k in base) o[k] = (k === 'name' || k === 'grassA' || k === 'grassB') ? base[k] : Array.isArray(base[k]) ? base[k].map(f) : f(base[k]);
  THEMES.push(o);
}

// ================= 图块图集 =================
const atlasCache = {};
function getAtlas(w) { return atlasCache[w] || (atlasCache[w] = buildAtlas(THEMES[w], w)); }
function buildAtlas(th, w) {
  const A = [];
  const R = mulberry32(1234 + w);
  const tile = fn => { const c = mk(64, 64), g = c.getContext('2d'); g.scale(2, 2); fn(g); return c; };
  const dirt = g => {
    const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, th.dirtA); gr.addColorStop(1, th.dirtB);
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    g.fillStyle = 'rgba(255,215,240,0.25)';
    for (let i = 0; i < 4; i++) { star4(g, R() * 26 + 3, R() * 26 + 3, 1 + R() * 1.8); g.fill(); }
    g.fillStyle = 'rgba(140,235,255,0.25)'; g.fillRect(R() * 28, R() * 28, 1.4, 1.4);
    g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, 31.5); g.lineTo(32, 31.5); g.moveTo(31.5, 0); g.lineTo(31.5, 32); g.stroke();
  };
  A[T.DIRT] = tile(dirt);
  A[T.GROUND] = tile(g => {
    dirt(g);
    const gr = g.createLinearGradient(0, 0, 32, 0); gr.addColorStop(0, th.grassA); gr.addColorStop(0.5, th.grassB); gr.addColorStop(1, th.grassA);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(32, 0); g.lineTo(32, 11);
    for (let x = 32; x >= 0; x -= 4) g.lineTo(x, 11 + ((x / 4) % 2 ? 3.5 : 0));
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(0, 0, 32, 2.2);
    g.fillStyle = '#fff8d6'; star4(g, 9 + R() * 14, 5.5, 2.6); g.fill();
    g.fillStyle = 'rgba(150,240,255,0.9)'; g.beginPath(); g.arc(3 + R() * 26, 4 + R() * 4, 0.9, 0, TAU); g.fill();
  });
  A[T.BRICK] = tile(g => {
    const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, th.brickA); gr.addColorStop(1, th.brickB);
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    g.fillStyle = 'rgba(40,8,40,0.35)';
    g.fillRect(0, 15, 32, 2); g.fillRect(0, 30.5, 32, 1.5); g.fillRect(15, 0, 2, 15); g.fillRect(0, 17, 1.2, 14); g.fillRect(31, 17, 1, 14);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, 32, 1.5); g.fillRect(1, 17, 13, 1); g.fillRect(17, 0, 1, 15);
    g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,240,255,0.5)';
    g.fillText('♪', 8, 13); g.fillText('♫', 24, 29);
  });
  A[T.QBLOCK] = tile(g => {
    const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, '#ffe680'); gr.addColorStop(1, '#ff8c4c');
    g.fillStyle = gr; rrect(g, 1, 1, 30, 30, 5); g.fill();
    g.strokeStyle = '#b4502a'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(5, 4); g.lineTo(27, 4); g.stroke();
    g.fillStyle = '#fff3c4'; [[5, 5], [27, 5], [5, 27], [27, 27]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.4, 0, TAU); g.fill(); });
    g.font = 'bold 21px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 3; g.strokeStyle = '#c4582a'; g.strokeText('♪', 16, 17); g.fillStyle = '#ffffff'; g.fillText('♪', 16, 17);
    g.fillStyle = '#8ff0ff'; star4(g, 25, 9, 2.5); g.fill();
  });
  A[T.USED] = tile(g => {
    g.fillStyle = '#8c6a7c'; rrect(g, 1, 1, 30, 30, 4); g.fill();
    g.strokeStyle = '#563648'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#6c4a5c'; [[6, 6], [26, 6], [6, 26], [26, 26]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); });
  });
  A[T.STONE] = tile(g => {
    const gr = g.createLinearGradient(0, 0, 32, 32); gr.addColorStop(0, th.stoneA); gr.addColorStop(1, th.stoneB);
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, 32, 2); g.fillRect(0, 0, 2, 32);
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, 30, 32, 2); g.fillRect(30, 0, 2, 32);
    g.strokeStyle = 'rgba(255,230,255,0.28)'; g.lineWidth = 1; g.strokeRect(6.5, 6.5, 19, 19);
    g.fillStyle = 'rgba(160,240,255,0.45)'; star4(g, 16, 16, 4.5); g.fill();
  });
  const pipe = (g, off, top) => {
    g.translate(-off, 0);
    const gr = g.createLinearGradient(2, 0, 62, 0);
    gr.addColorStop(0, '#d8fdff'); gr.addColorStop(0.3, '#74e2f0'); gr.addColorStop(0.75, '#2f9fc6'); gr.addColorStop(1, '#1b6a90');
    g.fillStyle = gr; g.fillRect(4, 0, 56, 32);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(12, 0, 4, 32);
    g.fillStyle = '#134e6e'; g.fillRect(3, 0, 1.6, 32); g.fillRect(59.4, 0, 1.6, 32);
    if (top) {
      g.fillStyle = gr; rrect(g, 0.5, 0.5, 63, 14, 3); g.fill();
      g.strokeStyle = '#134e6e'; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(9, 2.5, 4, 10);
      g.fillStyle = '#ffb3d6'; star4(g, 32, 7.5, 3.2); g.fill();
    } else {
      g.fillStyle = 'rgba(255,180,220,0.35)'; star4(g, 40, 16, 2.6); g.fill();
    }
  };
  A[T.PTL] = tile(g => pipe(g, 0, true));
  A[T.PTR] = tile(g => pipe(g, 32, true));
  A[T.PL] = tile(g => pipe(g, 0, false));
  A[T.PR] = tile(g => pipe(g, 32, false));
  A[T.CLOUD] = tile(g => {
    g.fillStyle = 'rgba(190,100,160,0.45)'; g.fillRect(0, 12, 32, 5);
    g.fillStyle = th.cloud;
    [[5, 8, 6.5], [16, 6, 7.5], [27, 8, 6.5]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
    g.fillRect(0, 7, 32, 7.5);
    g.fillStyle = 'rgba(255,255,255,0.75)'; ell(g, 14, 3, 5, 1.6); g.fill();
    g.fillStyle = 'rgba(255,170,210,0.8)'; star4(g, 26, 9, 2); g.fill();
  });
  A[T.SPIKE] = tile(g => {
    const gr = g.createLinearGradient(0, 8, 0, 32); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, '#8ff0ff'); gr.addColorStop(1, '#c86ad8');
    g.fillStyle = gr; g.strokeStyle = '#7a3a9a'; g.lineWidth = 1;
    [[1, 13, 10], [10, 22, 4], [20, 31, 9]].forEach(([a, b, top]) => { g.beginPath(); g.moveTo(a, 32); g.lineTo((a + b) / 2, top); g.lineTo(b, 32); g.closePath(); g.fill(); g.stroke(); });
  });
  A[T.CANNON] = tile(g => {
    g.fillStyle = '#2c2352'; rrect(g, 1, 1, 30, 31, 6); g.fill();
    g.strokeStyle = '#120c2a'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#ff9a5a'; g.fillRect(1, 9, 30, 3);
    g.fillStyle = '#ffd36e'; star5(g, 16, 20, 6, 2.6); g.fill();
    g.fillStyle = '#0c0820'; ell(g, 3, 10, 2, 4); g.fill(); ell(g, 29, 10, 2, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(6, 3, 18, 2);
  });
  return A;
}

// ================= 视差背景 =================
const bgCache = {};
function getBg(w) { return bgCache[w] || (bgCache[w] = buildBg(THEMES[w], w)); }
function buildBg(th, w) {
  const R = mulberry32(77 + w * 13);
  const neb = mk(1920, VH), g = neb.getContext('2d');
  for (let i = 0; i < 9; i++) {
    const x = R() * 1920, y = R() * 380, r = 160 + R() * 260;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, th.neb[i % 3]); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // 远处星球
  const px = 1300, py = 120, pr = th.planet ? 80 : 62;
  const pg = g.createRadialGradient(px - pr * 0.4, py - pr * 0.4, 4, px, py, pr);
  const pc = th.planet || ['#fff2fa', '#ffb2d0', '#8a5cc0'];
  pg.addColorStop(0, pc[0]); pg.addColorStop(0.58, pc[1]); pg.addColorStop(1, pc[2]);
  g.fillStyle = pg; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(160,240,255,0.6)'; g.lineWidth = 3; ell(g, px, py, pr * 1.7, pr * 0.36, -0.3); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.8)'; ell(g, 380, 90, 26, 26); g.fill();
  g.fillStyle = th.sky[1]; ell(g, 392, 82, 24, 24); g.fill();

  const ruins = mk(1920, VH), r = ruins.getContext('2d');
  r.fillStyle = th.ruin2;
  for (let x = 0; x < 1920; x += 90 + R() * 80) { const h = 80 + R() * 140; r.fillRect(x, VH - h, 30 + R() * 30, h); }
  r.fillStyle = th.ruin;
  let x = 20;
  while (x < 1860) {
    const k = R();
    if (k < 0.4) { // 石柱
      const h = 140 + R() * 170, cw = 26 + R() * 14;
      r.fillRect(x, VH - h, cw, h); r.fillRect(x - 6, VH - h - 12, cw + 12, 12);
      if (R() < 0.5) { r.beginPath(); r.moveTo(x - 6, VH - h - 12); r.lineTo(x + cw * 0.6, VH - h - 30); r.lineTo(x + cw + 6, VH - h - 12); r.fill(); }
      x += cw + 40 + R() * 60;
    } else if (k < 0.7) { // 拱门
      const aw = 110 + R() * 70, h = 160 + R() * 120;
      r.fillRect(x, VH - h, 22, h); r.fillRect(x + aw - 22, VH - h, 22, h);
      r.lineWidth = 20; r.strokeStyle = th.ruin; r.beginPath(); r.arc(x + aw / 2, VH - h, aw / 2 - 11, Math.PI, 0); r.stroke();
      x += aw + 50 + R() * 60;
    } else { // 漂浮遗迹岛
      const iw = 90 + R() * 80, iy = 150 + R() * 140;
      r.beginPath(); r.moveTo(x, iy); r.lineTo(x + iw, iy); r.lineTo(x + iw * 0.7, iy + 40); r.lineTo(x + iw * 0.5, iy + 70); r.lineTo(x + iw * 0.3, iy + 38); r.closePath(); r.fill();
      r.fillRect(x + iw * 0.2, iy - 50, 14, 50); r.fillRect(x + iw * 0.65, iy - 34, 14, 34);
      x += iw + 60 + R() * 60;
    }
  }
  const clouds = mk(1920, VH), c = clouds.getContext('2d');
  c.fillStyle = th.cloud; c.globalAlpha = 0.28;
  for (let i = 0; i < 16; i++) {
    const cx = R() * 1920, cy = 380 + R() * 140, s = 40 + R() * 60;
    for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(cx + (k - 2) * s * 0.55, cy - Math.sin(k / 4 * Math.PI) * s * 0.35, s * 0.5, 0, TAU); c.fill(); }
  }
  const stars = [];
  for (let i = 0; i < 170; i++) stars.push({ x: R() * 1920, y: R() * 420, r: R() * 1.5 + 0.4, p: R() * TAU, c: R() < 0.2 ? '#9ff2ff' : R() < 0.3 ? '#ffc4dc' : '#ffffff' });
  return { neb, ruins, clouds, stars };
}
function drawBackground(g, w, camX, frame) {
  const th = THEMES[w], bg = getBg(w);
  const gr = g.createLinearGradient(0, 0, 0, VH);
  gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.55, th.sky[1]); gr.addColorStop(1, th.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
  const layer = (img, f) => { const o = -((camX * f) % 1920 + 1920) % 1920; g.drawImage(img, o, 0); if (o + 1920 < VW) g.drawImage(img, o + 1920, 0); };
  layer(bg.neb, 0.04);
  for (const s of bg.stars) {
    const x = ((s.x - camX * 0.08) % 1920 + 1920) % 1920;
    if (x > VW) continue;
    g.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.03 + s.p));
    g.fillStyle = s.c;
    if (s.r > 1.5) { star4(g, x, s.y, s.r * 2.4); g.fill(); } else g.fillRect(x, s.y, s.r, s.r);
  }
  g.globalAlpha = 1;
  // 流星
  const ph = frame % 420;
  if (ph < 40) {
    const sx = 900 - ph * 14 + (Math.floor(frame / 420) * 337) % 400, sy = 40 + ph * 5;
    const lg = g.createLinearGradient(sx, sy, sx + 90, sy - 32);
    lg.addColorStop(0, 'rgba(255,255,255,0.95)'); lg.addColorStop(1, 'rgba(255,180,220,0)');
    g.strokeStyle = lg; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 90, sy - 32); g.stroke();
  }
  layer(bg.ruins, 0.25);
  layer(bg.clouds, 0.45);
}

// ================= 音符金币精灵 =================
const noteSprite = (() => {
  const c = mk(64, 64), g = c.getContext('2d');
  g.translate(32, 32); g.scale(1.9, 1.9);
  g.shadowColor = 'rgba(255,220,120,0.9)'; g.shadowBlur = 8;
  const gr = g.createLinearGradient(0, -12, 0, 10); gr.addColorStop(0, '#fff6b0'); gr.addColorStop(1, '#ffa03c');
  g.fillStyle = gr; g.strokeStyle = '#ffffff'; g.lineWidth = 1.3;
  g.beginPath(); g.moveTo(1.8, 5); g.lineTo(1.8, -11); g.lineTo(4.2, -11); g.quadraticCurveTo(11, -7, 9, 0); g.quadraticCurveTo(8.5, -5, 4.2, -5.5); g.lineTo(4.2, 5); g.closePath(); g.fill(); g.stroke();
  ell(g, -1.5, 5.5, 5.4, 4, -0.45); g.fill(); g.stroke();
  g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,0.85)'; ell(g, -3, 4, 1.6, 1, -0.45); g.fill();
  return c;
})();
function drawNote(g, cx, cy, size, spin) {
  const sx = Math.max(0.18, Math.abs(Math.cos(spin)));
  g.drawImage(noteSprite, cx - size * sx / 2, cy - size / 2, size * sx, size);
}

// ================= Q版爱弥斯 =================
const SKINS = [
  { name: '星冠绒绒', desc: '星芒光环 · 元气初登场', img: 'assets/skins/p1.jpg', hairA: '#ff9cbc', hairB: '#ffb88e', fur: '#fff3f2', furB: '#ffc2d4', face: '#fff2ec', eye: 'star', acc: ['halo', 'wing'] },
  { name: '蓝铃项圈', desc: '蜜桃长发 · 歌姬项圈', img: 'assets/skins/p2.jpg', hairA: '#ffc6cc', hairB: '#ffd8aa', fur: '#fffaf6', furB: '#ffe6dc', face: '#fff6ef', eye: 'round', acc: ['collar', 'flower', 'wing', 'halo'] },
  { name: '海豹抱抱', desc: '窗边午后 · 抱着海豹', img: 'assets/skins/p3.jpg', hairA: '#ffaecb', hairB: '#ffc6a6', fur: '#fff8f8', furB: '#f6dcea', face: '#fff4f0', eye: 'star', acc: ['halo', 'seal', 'collar'] },
  { name: '团子软萌', desc: '头顶海豹 · 软糯团子', img: 'assets/skins/p4.jpg', hairA: '#f590ac', hairB: '#f8a8b4', fur: '#f48aa6', furB: '#fbd0dc', face: '#ffffff', eye: 'black', acc: ['sealHead', 'wing'], outline: true, chest: '#ffffff' },
  { name: '惊吓小虎牙', desc: '炸毛小虎牙 · 超有精神', img: 'assets/skins/p5.jpg', hairA: '#f27fb4', hairB: '#f9a0c8', fur: '#f4f0fa', furB: '#f1a2c4', face: '#fdfbff', eye: 'round', mouth: 'fang', acc: ['wing'], outline: true },
  { name: '无辜豆豆眼', desc: '光环海豹 · 豆豆眼凝视', img: 'assets/skins/p6.jpg', hairA: '#f487a6', hairB: '#f6a2b2', fur: '#f498b0', furB: '#ffffff', face: '#ffffff', eye: 'dot', acc: ['sealHead', 'halo', 'wing'], outline: true, chest: '#ffffff' },
];
const skinImgs = SKINS.map(s => { const i = new Image(); i.src = s.img; return i; });

function eyeDraw(g, x, y, style, blink) {
  if (blink) { g.strokeStyle = '#5a2a20'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 2.6, y); g.quadraticCurveTo(x, y + 1.6, x + 2.6, y); g.stroke(); return; }
  if (style === 'dot') { g.fillStyle = '#1a1018'; ell(g, x, y, 2.4, 3.3); g.fill(); return; }
  if (style === 'black') { g.fillStyle = '#1a1018'; ell(g, x, y, 3.2, 4); g.fill(); g.fillStyle = '#fff'; ell(g, x + 0.9, y - 1.5, 1.2, 1.4); g.fill(); ell(g, x - 1, y + 1.7, 0.6, 0.6); g.fill(); return; }
  const gr = g.createLinearGradient(0, y - 4, 0, y + 4);
  gr.addColorStop(0, '#7a3410'); gr.addColorStop(0.35, '#e0861e'); gr.addColorStop(1, '#ffd463');
  g.fillStyle = gr; ell(g, x, y, 2.9, 3.8); g.fill();
  g.strokeStyle = '#4a1e10'; g.lineWidth = 1.1; g.beginPath(); g.ellipse(x, y, 2.9, 3.8, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  if (style === 'star') { g.fillStyle = '#fff6c4'; star4(g, x, y + 0.5, 2.2, 0.36); g.fill(); g.fillStyle = '#fff'; ell(g, x - 1.2, y - 2, 0.8, 0.8); g.fill(); }
  else { g.fillStyle = '#fff'; ell(g, x - 0.9, y - 1.5, 1.15, 1.35); g.fill(); ell(g, x + 1, y + 1.6, 0.5, 0.5); g.fill(); }
}

function drawSeal(g, x, y, s, bow) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#ffffff'; ell(g, 0, 0, 7, 4.8); g.fill();
  g.strokeStyle = '#3a2434'; g.lineWidth = 0.9; g.stroke();
  g.fillStyle = '#1a1018'; ell(g, -2.4, -0.8, 0.8, 1); g.fill(); ell(g, 2.4, -0.8, 0.8, 1); g.fill();
  g.strokeStyle = '#1a1018'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-1, 1); g.quadraticCurveTo(0, 2, 1, 1); g.stroke();
  g.fillStyle = 'rgba(255,150,180,0.6)'; ell(g, -4.4, 0.8, 1.3, 0.7); g.fill(); ell(g, 4.4, 0.8, 1.3, 0.7); g.fill();
  if (bow) { g.fillStyle = bow; g.beginPath(); g.moveTo(0, 3.6); g.lineTo(-3.6, 1.8); g.lineTo(-3.6, 5.6); g.closePath(); g.moveTo(0, 3.6); g.lineTo(3.6, 1.8); g.lineTo(3.6, 5.6); g.closePath(); g.fill(); }
  g.restore();
}

// o: {pose:'stand'|'run'|'jump'|'dead'|'flag', t, skin, form, blink, portrait}
function drawAemeath(g, x, y, s, face, o) {
  try { drawAemeathInner(g, x, y, s, face, o); }
  catch (err) { drawFallbackHero(g, x, y, s, face); }
}
function drawAemeathInner(g, x, y, s, face, o) {
  const sk = o.skin, t = o.t || 0, pose = o.pose;
  const run = pose === 'run', air = pose === 'jump' || pose === 'dead';
  g.save(); g.translate(x, y); g.scale(face * s, s);
  const OL = sk.outline ? '#3a1f33' : null;
  const line = () => { if (OL) { g.strokeStyle = OL; g.lineWidth = 1.3; g.stroke(); } };
  const hairB = o.form === 2 ? '#94ecff' : sk.hairB;
  const hg = g.createLinearGradient(0, -42, 0, -4); hg.addColorStop(0, sk.hairA); hg.addColorStop(1, hairB);
  const bob = run ? Math.abs(Math.sin(t)) * 1.4 : Math.sin(t * 0.25) * 0.4;
  const sway = Math.sin(t * (run ? 1 : 0.35)) * 2;
  g.lineCap = 'round'; g.lineJoin = 'round';

  // 尾巴
  const tailY = air ? -25 : -19 + sway * 0.4;
  if (OL) { g.strokeStyle = OL; g.lineWidth = 8; g.beginPath(); g.moveTo(-8, -7); g.quadraticCurveTo(-22, -6, -19 + sway * 0.5, tailY); g.stroke(); }
  g.strokeStyle = sk.hairA; g.lineWidth = 5.6; g.beginPath(); g.moveTo(-8, -7); g.quadraticCurveTo(-22, -6, -19 + sway * 0.5, tailY); g.stroke();
  g.fillStyle = '#ffffff'; ell(g, -19 + sway * 0.5, tailY, 3.4, 3.4); g.fill(); line();

  // 马尾
  g.fillStyle = hg; g.beginPath(); g.moveTo(-4, -35);
  g.bezierCurveTo(-18, -40, -27 + sway, -27, -23 + sway, -9);
  g.bezierCurveTo(-20 + sway, -15, -15, -22, -6, -24); g.closePath(); g.fill(); line();
  if (o.form === 2) { g.strokeStyle = 'rgba(160,250,255,0.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-10, -33); g.quadraticCurveTo(-20 + sway, -26, -19 + sway, -14); g.stroke(); }

  g.translate(0, -bob);
  const st = run ? Math.sin(t) * 3.2 : 0;
  // 后爪
  g.fillStyle = sk.fur; ell(g, -4 - st, air ? -4.5 : -1.8, 4.3, 2.9); g.fill(); line();
  // 身体
  const bgd = g.createLinearGradient(0, -18, 0, 0); bgd.addColorStop(0, sk.fur); bgd.addColorStop(1, sk.furB);
  g.fillStyle = bgd; ell(g, 0, -8.5, 11, 9.2); g.fill(); line();
  g.fillStyle = sk.chest || '#ffffff';
  g.beginPath(); g.moveTo(-3, -15.5); g.lineTo(8.5, -15.5); g.lineTo(7.5, -6); g.lineTo(5, -8.5); g.lineTo(3, -4.5); g.lineTo(1, -8.5); g.lineTo(-2, -6); g.closePath(); g.fill();
  // 前爪
  g.fillStyle = sk.fur === '#f48aa6' || sk.fur === '#f498b0' ? '#ffffff' : sk.fur;
  ell(g, 5 + st, air ? -5.5 : -1.8, 4.5, 3); g.fill(); line();
  g.fillStyle = '#ff9ab8'; ell(g, 7 + st, air ? -5 : -1.4, 0.9, 0.8); g.fill();
  if (sk.acc.includes('seal')) drawSeal(g, 9, -6, 0.95, '#b48cff');
  if (sk.acc.includes('collar')) {
    g.fillStyle = '#26386e'; rrect(g, -6, -13.6, 15, 2.8, 1.2); g.fill();
    g.fillStyle = '#7cecff'; g.beginPath(); g.moveTo(1.5, -12); g.lineTo(3.4, -9.2); g.lineTo(1.5, -6.6); g.lineTo(-0.4, -9.2); g.closePath(); g.fill();
  }
  // 后侧鬓发
  g.fillStyle = hg; g.beginPath(); g.moveTo(-11, -30); g.quadraticCurveTo(-16, -18, -12.5, -6); g.quadraticCurveTo(-9.5, -12, -7, -22); g.closePath(); g.fill(); line();

  if (o.portrait && skinImgs[SKINS.indexOf(sk)] && skinImgs[SKINS.indexOf(sk)].naturalWidth) {
    // 原画头像模式
    g.save(); g.scale(face, 1);
    g.beginPath(); g.arc(1.5 * face, -24, 14, 0, TAU); g.closePath();
    g.fillStyle = '#ffd1e2'; g.fill(); g.save(); g.clip();
    g.drawImage(skinImgs[SKINS.indexOf(sk)], 1.5 * face - 14, -38, 28, 28);
    g.restore();
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.stroke();
    g.strokeStyle = '#ff9ac0'; g.lineWidth = 0.8; g.stroke();
    g.restore();
    g.restore();
    return;
  }

  // 头
  g.fillStyle = sk.face; ell(g, 1.5, -23.5, 12.5, 11.5); g.fill(); line();
  // 耳朵
  const ear = (bx, tipx, tipy, ex) => {
    g.fillStyle = sk.hairA; g.beginPath(); g.moveTo(bx - 6, -31); g.lineTo(tipx, tipy); g.lineTo(bx + 6, -32 + ex); g.closePath(); g.fill(); line();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(bx - 3.2, -32); g.lineTo(tipx * 0.9 + bx * 0.1, tipy + 4); g.lineTo(bx + 3.2, -32.5 + ex); g.closePath(); g.fill();
  };
  const et = air ? -1.5 : Math.sin(t * 0.2) * 0.6;
  ear(-6, -10, -43 + et, 1);
  ear(9, 13, -44 + et, -1);
  // 刘海+发顶
  g.fillStyle = hg; g.beginPath(); g.moveTo(-11.5, -21);
  g.bezierCurveTo(-13.5, -39, 16.5, -41, 14.8, -20);
  g.lineTo(12.2, -25); g.lineTo(10.8, -20.5); g.lineTo(7.8, -26.5); g.lineTo(4.8, -21); g.lineTo(1.8, -27); g.lineTo(-1.2, -21.5); g.lineTo(-4.4, -27); g.lineTo(-7.4, -22); g.lineTo(-9.4, -26.5); g.closePath(); g.fill(); line();
  g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 1.2; g.beginPath(); g.arc(2, -27, 9, Math.PI * 1.15, Math.PI * 1.45); g.stroke();
  // 呆毛
  g.strokeStyle = sk.hairA; g.lineWidth = 1.8; g.beginPath(); g.moveTo(1, -35); g.quadraticCurveTo(-2, -42, 4.5, -41.5); g.stroke();
  // 前侧鬓发
  g.fillStyle = hg; g.beginPath(); g.moveTo(11.5, -28); g.quadraticCurveTo(16.5, -18, 14.5, -7); g.quadraticCurveTo(11.5, -12, 9.5, -21); g.closePath(); g.fill(); line();
  // 眼睛
  if (pose === 'dead') {
    g.strokeStyle = '#5a2a20'; g.lineWidth = 1.3;
    [[-3, -18.5], [6.5, -18.5]].forEach(([ex, ey]) => { g.beginPath(); g.moveTo(ex - 2.4, ey - 2); g.lineTo(ex + 2.4, ey + 2); g.moveTo(ex + 2.4, ey - 2); g.lineTo(ex - 2.4, ey + 2); g.stroke(); });
  } else {
    eyeDraw(g, -3, -18.3, sk.eye, o.blink);
    eyeDraw(g, 6.6, -18.3, sk.eye, o.blink);
  }
  // 腮红+嘴
  g.fillStyle = 'rgba(255,120,150,0.45)'; ell(g, -6.8, -15, 2.6, 1.3); g.fill(); ell(g, 10.5, -15, 2.6, 1.3); g.fill();
  if (sk.mouth === 'fang' || pose === 'dead') {
    g.fillStyle = '#a62a40'; ell(g, 2, -13.4, 2.3, 1.8); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0.4, -15); g.lineTo(1.4, -15); g.lineTo(0.9, -13.6); g.closePath(); g.fill();
  } else {
    g.strokeStyle = '#a04a5a'; g.lineWidth = 0.9; g.beginPath();
    g.moveTo(-0.4, -14.4); g.quadraticCurveTo(0.8, -12.9, 2, -14.2); g.quadraticCurveTo(3.2, -12.9, 4.4, -14.4); g.stroke();
  }
  // 配饰
  const sealHead = sk.acc.includes('sealHead');
  if (sk.acc.includes('wing')) {
    g.fillStyle = '#b8e8ff'; g.strokeStyle = '#ffffff'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(11, -27); g.quadraticCurveTo(15, -35, 20, -32); g.quadraticCurveTo(16.5, -30, 18.5, -27); g.quadraticCurveTo(15.5, -26.5, 11, -24); g.closePath(); g.fill(); g.stroke();
  }
  if (sk.acc.includes('flower')) {
    g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; ell(g, 11 + Math.cos(a) * 2, -30 + Math.sin(a) * 2, 1.6, 1.6); g.fill(); }
    g.fillStyle = '#ffd36e'; ell(g, 11, -30, 1, 1); g.fill();
  }
  if (sealHead) drawSeal(g, 2, -37.5, 0.95, sk.acc.includes('halo') ? '#e8a4ff' : null);
  if (sk.acc.includes('halo')) {
    const hy = sealHead ? -46 : -42 + Math.sin(t * 0.1) * 0.6;
    g.strokeStyle = 'rgba(140,240,255,0.35)'; g.lineWidth = 3.2; ell(g, 2, hy, 11, 2.8, -0.08); g.stroke();
    g.strokeStyle = '#a6f4ff'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#ff9cc6'; star4(g, 2, hy - 3.2, 2.8); g.fill();
    g.fillStyle = '#7ad8ff'; ell(g, -8.6, hy + 0.8, 1.1, 1.1); g.fill(); ell(g, 12.6, hy - 0.8, 1.1, 1.1); g.fill();
  }
  g.restore();
}
// 兜底：粉橙渐变几何人形
function drawFallbackHero(g, x, y, s, face) {
  g.save(); g.translate(x, y); g.scale(face * s, s);
  const gr = g.createLinearGradient(0, -40, 0, 0); gr.addColorStop(0, '#ff8fc0'); gr.addColorStop(1, '#ffb066');
  g.fillStyle = gr; rrect(g, -9, -18, 18, 18, 6); g.fill();
  g.beginPath(); g.arc(0, -26, 10, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(-9, -31); g.lineTo(-6, -42); g.lineTo(-1, -34); g.moveTo(9, -31); g.lineTo(6, -42); g.lineTo(1, -34); g.fill();
  g.fillStyle = '#ffffff'; ell(g, 4, -26, 2, 2.6); g.fill();
  g.strokeStyle = '#8ff0ff'; g.lineWidth = 1.5; ell(g, 0, -42, 9, 2.4); g.stroke();
  g.restore();
}

// ================= 怪物 =================
function drawEnemy(g, e, f) {
  const cx = e.x + e.w / 2, by = e.y + e.h;
  g.save();
  if (e.dying === 'flip') { g.translate(cx, e.y + e.h / 2); g.rotate(Math.PI); g.translate(-cx, -(e.y + e.h / 2)); }
  switch (e.type) {
    case 'blob': {
      g.translate(cx, by); if (e.dying === 'squash') g.scale(1.2, 0.35);
      const wob = Math.sin(f * 0.25 + e.x * 0.1) * 1.5;
      g.fillStyle = '#24123c'; ell(g, -7 + wob, -2, 5.5, 3); g.fill(); ell(g, 7 - wob, -2, 5.5, 3); g.fill();
      const gr = g.createRadialGradient(-4, -18, 2, 0, -12, 18); gr.addColorStop(0, '#8a64d8'); gr.addColorStop(1, '#2e1760');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-14, -4); g.quadraticCurveTo(-16, -26, 0, -26); g.quadraticCurveTo(16, -26, 14, -4); g.closePath(); g.fill();
      g.strokeStyle = '#ffd36e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -26); g.lineTo(3, -31); g.stroke();
      g.fillStyle = '#ffd36e'; star4(g, 3.5, -33, 4.2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-9, -21, 1.5, 1.5); g.fillRect(8, -18, 1.2, 1.2); g.fillRect(-4, -8, 1.2, 1.2);
      const d = Math.sign(e.vx) || -1;
      g.fillStyle = '#fff'; ell(g, -5, -14, 3.4, 4.4); g.fill(); ell(g, 5, -14, 3.4, 4.4); g.fill();
      g.fillStyle = '#ff4f9a'; ell(g, -5 + d * 1.2, -13.5, 1.8, 2.6); g.fill(); ell(g, 5 + d * 1.2, -13.5, 1.8, 2.6); g.fill();
      g.strokeStyle = '#120820'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-9, -20); g.lineTo(-2, -18); g.moveTo(9, -20); g.lineTo(2, -18); g.stroke();
      break;
    }
    case 'shell': {
      g.translate(cx, by);
      const d = Math.sign(e.vx) || -1;
      if (e.state === 'walk') {
        g.scale(-d, 1);
        g.fillStyle = '#ffe2cc'; ell(g, -12, -20, 6.5, 6.5); g.fill();
        g.fillStyle = '#1a1018'; ell(g, -14, -21, 1.4, 2); g.fill();
        g.fillStyle = '#ffe2cc'; const st = Math.sin(f * 0.3) * 2.5; ell(g, -6 + st, -2, 3.5, 2.5); g.fill(); ell(g, 6 - st, -2, 3.5, 2.5); g.fill();
        g.translate(0, -4);
      }
      const rot = e.state === 'spin' ? f * 0.5 : 0;
      const gr = g.createLinearGradient(0, -22, 0, 0); gr.addColorStop(0, '#9ff4ff'); gr.addColorStop(1, '#2a80b4');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-12, -2); g.quadraticCurveTo(-13, -22, 0, -22); g.quadraticCurveTo(13, -22, 12, -2); g.closePath(); g.fill();
      g.strokeStyle = '#1a4a72'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#fff4a6'; star5(g, 0, -11, 6.5, 2.8, rot); g.fill();
      g.fillStyle = '#ffd0ea'; g.fillRect(-12, -4, 24, 3);
      if (e.state === 'shell' && e.t > 360 && f % 10 < 5) { g.fillStyle = '#1a1018'; ell(g, -4, -5, 1.2, 1.2); g.fill(); ell(g, 4, -5, 1.2, 1.2); g.fill(); }
      break;
    }
    case 'flyer': {
      g.translate(cx, e.y + e.h / 2 + 2);
      const fl = Math.sin(f * 0.4) * 4;
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath(); g.moveTo(6, -12); g.quadraticCurveTo(16, -24 - fl, 20, -12); g.quadraticCurveTo(14, -14, 6, -8); g.fill();
      const gr = g.createLinearGradient(0, -16, 0, 12); gr.addColorStop(0, '#d48cff'); gr.addColorStop(1, '#7a3ad0');
      g.fillStyle = gr; g.fillRect(5, -16, 3.5, 21);
      g.beginPath(); g.moveTo(8.5, -16); g.quadraticCurveTo(16, -12, 13, -4); g.quadraticCurveTo(12, -9, 8.5, -10); g.fill();
      ell(g, -1, 5, 10, 8, -0.3); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = '#fff'; ell(g, -5, 3, 2.6, 3.2); g.fill(); ell(g, 2, 2, 2.6, 3.2); g.fill();
      g.fillStyle = '#2a0a3a'; ell(g, -5, 4, 1.3, 1.8); g.fill(); ell(g, 2, 3, 1.3, 1.8); g.fill();
      g.strokeStyle = '#2a0a3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(-3, 8.5); g.quadraticCurveTo(-1.5, 7, 0, 8.5); g.stroke();
      break;
    }
    case 'spiky': {
      g.translate(cx, by - 12);
      g.rotate((e.x * 0.06) % TAU);
      g.fillStyle = '#ffd2ec';
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(Math.cos(a - 0.3) * 9, Math.sin(a - 0.3) * 9); g.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); g.lineTo(Math.cos(a + 0.3) * 9, Math.sin(a + 0.3) * 9); g.fill(); }
      const gr = g.createRadialGradient(-3, -3, 1, 0, 0, 11); gr.addColorStop(0, '#ff6aa6'); gr.addColorStop(1, '#5a1238');
      g.fillStyle = gr; ell(g, 0, 0, 11, 11); g.fill();
      g.rotate(-((e.x * 0.06) % TAU));
      g.fillStyle = '#fff'; ell(g, -4, -1, 2.4, 3); g.fill(); ell(g, 4, -1, 2.4, 3); g.fill();
      g.fillStyle = '#1a0610'; ell(g, -4, -0.5, 1.2, 1.8); g.fill(); ell(g, 4, -0.5, 1.2, 1.8); g.fill();
      break;
    }
    case 'jumper': {
      g.translate(cx, by); if (e.dying === 'squash') g.scale(1.2, 0.35);
      const sq = e.onGround && e.t > 40 ? 0.85 : 1; g.scale(1 / sq, sq);
      g.strokeStyle = '#efdcff'; g.lineWidth = 4.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-7, -28); g.lineTo(-7, -16); g.quadraticCurveTo(-7, -10, 0, -10); g.quadraticCurveTo(7, -10, 7, -16); g.lineTo(7, -28); g.stroke();
      g.strokeStyle = '#9a7cd8'; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = '#ff9ac8'; ell(g, 0, -6, 8, 6); g.fill();
      g.fillStyle = '#c0408a'; g.fillRect(-2, -1, 4, 1);
      g.fillStyle = '#fff'; ell(g, -3, -7, 2, 2.4); g.fill(); ell(g, 3, -7, 2, 2.4); g.fill();
      g.fillStyle = '#300'; ell(g, -3, -6.5, 1, 1.4); g.fill(); ell(g, 3, -6.5, 1, 1.4); g.fill();
      g.fillStyle = '#8ff0ff'; star4(g, -7, -31, 3); g.fill(); star4(g, 7, -31, 3); g.fill();
      break;
    }
    case 'plant': {
      const top = e.y;
      g.fillStyle = '#3ab8a8'; g.fillRect(cx - 2.5, top + 16, 5, e.h);
      g.fillStyle = '#5ee0c0'; ell(g, cx - 7, top + 24, 6, 2.6, -0.5); g.fill(); ell(g, cx + 7, top + 24, 6, 2.6, 0.5); g.fill();
      const open = Math.abs(Math.sin(f * 0.12)) * 6;
      const gr = g.createRadialGradient(cx, top + 10, 2, cx, top + 10, 14); gr.addColorStop(0, '#ffb6e0'); gr.addColorStop(1, '#b82a7a');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(cx - 13, top + 10); g.quadraticCurveTo(cx - 12, top - 4 - open * 0.3, cx, top - 3 - open * 0.3); g.quadraticCurveTo(cx + 12, top - 4 - open * 0.3, cx + 13, top + 10); g.lineTo(cx, top + 10 - open); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(cx - 13, top + 10); g.quadraticCurveTo(cx, top + 24, cx + 13, top + 10); g.lineTo(cx, top + 10 + open * 0.2); g.closePath(); g.fill();
      g.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 4 - 1.5, top + 10); g.lineTo(cx + i * 4, top + 13); g.lineTo(cx + i * 4 + 1.5, top + 10); g.fill(); }
      g.fillStyle = '#8ff0ff'; star4(g, cx, top - 2, 3); g.fill();
      break;
    }
    case 'bullet': {
      const d = Math.sign(e.vx);
      g.translate(cx, e.y + e.h / 2); g.scale(-d, 1);
      for (let i = 1; i <= 3; i++) { g.fillStyle = `rgba(255,${150 + i * 25},120,${0.5 - i * 0.12})`; ell(g, 10 + i * 8, 0, 9 - i * 2, 7 - i * 1.6); g.fill(); }
      const gr = g.createRadialGradient(-3, -3, 1, 0, 0, 12); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(0.5, '#ff8a5a'); gr.addColorStop(1, '#c0306a');
      g.fillStyle = gr; ell(g, 0, 0, 12, 11); g.fill();
      g.fillStyle = '#fff'; ell(g, -5, -2, 2.6, 3); g.fill();
      g.fillStyle = '#300'; ell(g, -6, -1.6, 1.3, 1.8); g.fill();
      g.strokeStyle = '#300'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-9, -6); g.lineTo(-3, -4.5); g.stroke();
      break;
    }
    case 'orb': {
      g.translate(cx, e.y + e.h / 2); g.rotate(f * 0.2);
      g.fillStyle = 'rgba(200,80,255,0.35)'; ell(g, 0, 0, 13, 13); g.fill();
      g.fillStyle = '#5a1a8a'; star5(g, 0, 0, 10, 6); g.fill();
      g.fillStyle = '#ff7ae0'; ell(g, 0, 0, 4, 4); g.fill();
      break;
    }
    case 'boss': drawBoss(g, e, f); break;
  }
  g.restore();
}
const BOSS_NAMES = ['无音区·聒噪魔像', '云端·失谐鸣兽', '晶洞·破音晶蟹', '星湾·暗潮海妖', '冰原·寂静雪魔', '钟楼·乱拍时针', '花园·荆棘夜莺', '列车·脱轨列车长', '火山·熔噪巨像', '噪音君主·终焉之喉',
  '暮光·荒原噪兽', '雷云·轰鸣巨鲸', '矿脉·回响石魔', '星渊·深潮之主', '冰川·永冬骑士', '钟塔·逆时齿轮王', '月庭·荆棘女伶', '星轨·幽灵车掌', '炎狱·焚音巨像', '要塞·噪音将军',
  '终焉·星原吞噬者', '天穹·碎空巨鸟', '虚空·晶核之眼', '沉海·无光海皇', '零度·冰封之心', '时尽·终末时钟', '花冢·枯萎女王', '断河·星轨裂魔', '熔核·深渊之炎', '终焉之噪·无声女王'];
function drawBoss(g, e, f) {
  const th = THEMES[e.world];
  const cx = e.x + e.w / 2, by = e.y + e.h;
  g.translate(cx, by);
  if (e.inv > 0 && f % 6 < 3) g.globalAlpha = 0.45;
  const d = e.face || -1;
  const breath = Math.sin(f * 0.1) * 1.5;
  // 脚
  g.fillStyle = '#1a0a2a'; ell(g, -16, -4, 10, 5); g.fill(); ell(g, 16, -4, 10, 5); g.fill();
  // 手
  const arm = Math.sin(f * 0.15) * 4;
  g.fillStyle = th.boss[1]; ell(g, -32, -26 + arm, 8, 10); g.fill(); ell(g, 32, -26 - arm, 8, 10); g.fill();
  // 身体
  const gr = g.createRadialGradient(-10, -44, 4, 0, -30, 40); gr.addColorStop(0, th.boss[0]); gr.addColorStop(1, th.boss[1]);
  g.fillStyle = gr; g.beginPath(); g.moveTo(-30, -6); g.quadraticCurveTo(-34, -62 - breath, 0, -62 - breath); g.quadraticCurveTo(34, -62 - breath, 30, -6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.stroke();
  // 晶体裂纹
  g.strokeStyle = 'rgba(160,240,255,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-18, -14); g.lineTo(-10, -24); g.lineTo(-14, -32); g.moveTo(16, -12); g.lineTo(10, -22); g.lineTo(18, -30); g.stroke();
  // 皇冠
  g.fillStyle = '#ffd36e'; g.beginPath(); g.moveTo(-16, -60 - breath); g.lineTo(-14, -76); g.lineTo(-6, -66); g.lineTo(0, -80); g.lineTo(6, -66); g.lineTo(14, -76); g.lineTo(16, -60 - breath); g.closePath(); g.fill();
  g.fillStyle = '#ff4f9a'; ell(g, 0, -68, 2.6, 2.6); g.fill(); g.fillStyle = '#7cecff'; ell(g, -10, -66, 2, 2); g.fill(); ell(g, 10, -66, 2, 2); g.fill();
  // 眼
  g.fillStyle = '#ffffff'; ell(g, -10 + d * 3, -40, 7, 8); g.fill(); ell(g, 10 + d * 3, -40, 7, 8); g.fill();
  g.fillStyle = e.inv > 0 ? '#ffffff' : '#ff3a7a'; ell(g, -10 + d * 5, -39, 3.5, 5); g.fill(); ell(g, 10 + d * 5, -39, 3.5, 5); g.fill();
  g.strokeStyle = '#100018'; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, -52); g.lineTo(-4, -46); g.moveTo(20, -52); g.lineTo(4, -46); g.stroke();
  // 嘴（噪音声波）
  g.fillStyle = '#100018'; rrect(g, -12, -26, 24, 9, 4); g.fill();
  g.fillStyle = '#fff'; for (let i = -10; i < 10; i += 5) { g.beginPath(); g.moveTo(i, -26); g.lineTo(i + 2.5, -22); g.lineTo(i + 5, -26); g.fill(); }
  g.strokeStyle = 'rgba(255,90,180,0.5)'; g.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const r = 16 + ((f * 0.8 + i * 10) % 30); g.globalAlpha = Math.max(0, 1 - r / 46) * (e.inv > 0 && f % 6 < 3 ? 0.45 : 1); g.beginPath(); g.arc(d * 12, -22, r, d > 0 ? -0.6 : Math.PI - 0.6, d > 0 ? 0.6 : Math.PI + 0.6); g.stroke(); }
  g.globalAlpha = 1;
}

// ================= 道具与物件 =================
function drawItem(g, e, f) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  switch (e.type) {
    case 'coin': case 'fcoin': drawNote(g, cx, cy, 26, f * 0.08 + e.x * 0.05); break;
    case 'power': {
      g.save(); g.translate(cx, cy + Math.sin(f * 0.1) * 1);
      const gr = g.createLinearGradient(0, -12, 0, 12); gr.addColorStop(0, '#ffe0f0'); gr.addColorStop(0.5, '#ff8ab8'); gr.addColorStop(1, '#ff9a4c');
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, -13); g.lineTo(10, -2); g.lineTo(0, 13); g.lineTo(-10, -2); g.closePath(); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = 'rgba(140,240,255,0.9)'; g.lineWidth = 1.6; ell(g, 0, 0, 14, 4, f * 0.05); g.stroke();
      g.fillStyle = '#fff'; ell(g, -3, -4, 1.6, 2.4); g.fill(); ell(g, 3, -4, 1.6, 2.4); g.fill();
      g.restore(); break;
    }
    case 'galaxy': {
      g.save(); g.translate(cx, cy);
      g.fillStyle = '#3ab8a8'; g.fillRect(-1.5, 2, 3, 12);
      g.fillStyle = '#5ee0c0'; ell(g, -5, 10, 5, 2, -0.5); g.fill(); ell(g, 5, 10, 5, 2, 0.5); g.fill();
      g.rotate(f * 0.03);
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5; g.fillStyle = i % 2 ? '#9ff0ff' : '#c9b8ff'; ell(g, Math.cos(a) * 7, -2 + Math.sin(a) * 7, 5.5, 3.5, a); g.fill(); }
      g.fillStyle = '#ffd36e'; star5(g, 0, -2, 5.5, 2.4); g.fill();
      g.restore(); break;
    }
    case 'speed': {
      g.save(); g.translate(cx, cy);
      g.strokeStyle = 'rgba(160,240,255,0.7)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-14 - (f % 10), -6 + i * 6); g.lineTo(-6 - (f % 10), -6 + i * 6); g.stroke(); }
      g.fillStyle = '#8ff0ff'; g.strokeStyle = '#fff'; g.lineWidth = 1.4;
      g.fillRect(-3, -10, 2.5, 14); g.fillRect(6, -12, 2.5, 14); g.fillRect(-3, -12, 11.5, 4);
      ell(g, -5.5, 4.5, 4, 3, -0.4); g.fill(); g.stroke(); ell(g, 3.5, 2.5, 4, 3, -0.4); g.fill(); g.stroke();
      g.fillStyle = '#fff'; star4(g, 9, -12, 3); g.fill();
      g.restore(); break;
    }
    case 'star': {
      g.save(); g.translate(cx, cy);
      g.fillStyle = `hsla(${(f * 8) % 360},90%,70%,0.35)`; ell(g, 0, 0, 16, 16); g.fill();
      g.fillStyle = `hsl(${(f * 8 + 40) % 360},95%,68%)`; star5(g, 0, 0, 13, 6, Math.sin(f * 0.1) * 0.2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#2a1030'; ell(g, -3, -1, 1.2, 2); g.fill(); ell(g, 3, -1, 1.2, 2); g.fill();
      g.restore(); break;
    }
    case 'life': {
      g.save(); g.translate(cx, cy);
      g.fillStyle = '#ff6aa0'; g.beginPath(); g.moveTo(0, 11); g.bezierCurveTo(-16, 0, -10, -14, 0, -6); g.bezierCurveTo(10, -14, 16, 0, 0, 11); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#fff'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillText('1UP', 0, 3);
      g.restore(); break;
    }
    case 'wonder': {
      g.save(); g.translate(cx, cy);
      g.fillStyle = 'rgba(255,255,255,0.3)'; ell(g, 0, 0, 17 + Math.sin(f * 0.2) * 2, 17 + Math.sin(f * 0.2) * 2); g.fill();
      g.rotate(f * 0.05);
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.fillStyle = `hsl(${i * 60 + f * 3},90%,72%)`; ell(g, Math.cos(a) * 8, Math.sin(a) * 8, 6, 3.6, a); g.fill(); }
      g.fillStyle = '#fff'; star4(g, 0, 0, 6); g.fill();
      g.restore(); break;
    }
    case 'medal': {
      g.save(); g.translate(cx, cy + Math.sin(f * 0.07 + e.id) * 2);
      if (e.ghost) g.globalAlpha = 0.35;
      g.scale(Math.max(0.2, Math.abs(Math.cos(f * 0.04))), 1);
      g.fillStyle = 'rgba(140,240,255,0.35)'; ell(g, 0, 0, 18, 18); g.fill();
      const gr = g.createLinearGradient(0, -14, 0, 14); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(1, '#ff9a4c');
      g.fillStyle = gr; ell(g, 0, 0, 14, 14); g.fill();
      g.strokeStyle = '#8ff0ff'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#ff7ab0'; star5(g, 0, 0, 9, 4); g.fill();
      g.fillStyle = '#fff'; star4(g, 7, -7, 3); g.fill();
      g.restore(); break;
    }
    case 'trophy': {
      g.save(); g.translate(cx, cy + Math.sin(f * 0.08) * 3);
      g.fillStyle = 'rgba(255,230,140,0.35)'; ell(g, 0, 0, 30, 30); g.fill();
      g.rotate(f * 0.02);
      g.fillStyle = '#ffd36e'; star5(g, 0, 0, 22, 10); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      g.rotate(-f * 0.02);
      g.fillStyle = '#ff6aa0'; g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', 0, 1);
      g.restore(); break;
    }
  }
}
function drawObject(g, e, f) {
  switch (e.type) {
    case 'spring': {
      const c = e.comp > 0 ? 8 : 0;
      g.fillStyle = '#ff7ab0'; rrect(g, e.x, e.y + e.h - 6, e.w, 6, 2); g.fill();
      g.strokeStyle = '#8ff0ff'; g.lineWidth = 3; g.beginPath();
      const top = e.y + 6 + c, bot = e.y + e.h - 6;
      for (let i = 0; i <= 4; i++) g.lineTo(e.x + (i % 2 ? 8 : e.w - 8), top + (bot - top) * i / 4);
      g.stroke();
      g.fillStyle = '#ffd36e'; rrect(g, e.x - 2, top - 6, e.w + 4, 7, 3); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('♪', e.x + e.w / 2, top);
      break;
    }
    case 'checkpoint': {
      const x = e.x + e.w / 2;
      g.fillStyle = '#c8b8ff'; g.fillRect(x - 2, e.y + 10, 4, e.h - 10);
      g.fillStyle = '#6a5aa0'; g.fillRect(x - 7, e.y + e.h - 6, 14, 6);
      const lit = e.on;
      g.fillStyle = lit ? 'rgba(140,240,255,0.45)' : 'rgba(255,255,255,0.12)'; ell(g, x, e.y + 8, 14 + (lit ? Math.sin(f * 0.15) * 2 : 0), 14); g.fill();
      g.fillStyle = lit ? '#8ff0ff' : '#8a7aa8'; star5(g, x, e.y + 8, 9, 4, lit ? f * 0.04 : 0); g.fill();
      if (lit) { g.fillStyle = '#ff9ac8'; g.beginPath(); g.moveTo(x + 2, e.y + 20); g.lineTo(x + 22, e.y + 26); g.lineTo(x + 2, e.y + 32); g.fill(); }
      break;
    }
    case 'flag': {
      const x = e.x + e.w / 2;
      const gr = g.createLinearGradient(x - 3, 0, x + 3, 0); gr.addColorStop(0, '#e8fdff'); gr.addColorStop(1, '#5ac8e0');
      g.fillStyle = gr; g.fillRect(x - 3, e.top, 6, e.bottom - e.top);
      g.fillStyle = 'rgba(255,215,110,0.4)'; ell(g, x, e.top - 6, 14, 14); g.fill();
      g.fillStyle = '#ffd36e'; star5(g, x, e.top - 6, 10, 4.5, f * 0.03); g.fill();
      const fy = e.clothY, wv = Math.sin(f * 0.15) * 3;
      g.fillStyle = '#ff8ab8'; g.beginPath(); g.moveTo(x - 3, fy); g.quadraticCurveTo(x - 20, fy + 6 + wv, x - 36, fy + 4 + wv); g.lineTo(x - 30, fy + 15); g.lineTo(x - 36, fy + 26 - wv); g.quadraticCurveTo(x - 20, fy + 24 - wv, x - 3, fy + 30); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', x - 17, fy + 15);
      break;
    }
    case 'gate': {
      const x = e.x, y = e.y, w = e.w, h = e.h;
      g.fillStyle = '#7a66b0'; g.fillRect(x, y + 24, 14, h - 24); g.fillRect(x + w - 14, y + 24, 14, h - 24);
      g.fillStyle = '#a693cc'; g.fillRect(x - 3, y + 18, 20, 8); g.fillRect(x + w - 17, y + 18, 20, 8);
      g.strokeStyle = '#a693cc'; g.lineWidth = 10; g.beginPath(); g.arc(x + w / 2, y + 26, w / 2 - 7, Math.PI, 0); g.stroke();
      const pg = g.createRadialGradient(x + w / 2, y + h * 0.6, 4, x + w / 2, y + h * 0.6, 40);
      pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.4, 'rgba(255,170,215,0.9)'); pg.addColorStop(1, 'rgba(120,220,255,0.6)');
      g.fillStyle = pg; g.beginPath(); g.moveTo(x + 14, y + h); g.lineTo(x + 14, y + 26); g.arc(x + w / 2, y + 26, w / 2 - 14, Math.PI, 0); g.lineTo(x + w - 14, y + h); g.closePath(); g.fill();
      g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { const a = f * 0.05 + i * TAU / 4; star4(g, x + w / 2 + Math.cos(a) * 14, y + 56 + Math.sin(a) * 18, 2.5); g.fill(); }
      g.fillStyle = '#ffd36e'; star5(g, x + w / 2, y - 2, 9, 4); g.fill();
      break;
    }
  }
}

// ================= 音效与音乐（WebAudio 合成） =================
const Snd = {
  ac: null, master: null, sfxG: null, musG: null, muted: false, musicOn: true, noiseBuf: null,
  seq: null, step: 0, nextT: 0, timer: null,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.55; this.master.connect(this.ac.destination);
      this.sfxG = this.ac.createGain(); this.sfxG.gain.value = 0.6; this.sfxG.connect(this.master);
      this.musG = this.ac.createGain(); this.musG.gain.value = 0.22; this.musG.connect(this.master);
      const n = this.ac.sampleRate * 0.5; this.noiseBuf = this.ac.createBuffer(1, n, this.ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ac = null; }
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.55; },
  tone(f, d, type = 'square', v = 0.2, f2 = null, delay = 0, out = null) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay, o = this.ac.createOscillator(), gn = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(gn); gn.connect(out || this.sfxG); o.start(t); o.stop(t + d + 0.02);
  },
  noise(d, v = 0.3, freq = 1200, delay = 0) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay, s = this.ac.createBufferSource(), fl = this.ac.createBiquadFilter(), gn = this.ac.createGain();
    s.buffer = this.noiseBuf; fl.type = 'bandpass'; fl.frequency.value = freq;
    gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(fl); fl.connect(gn); gn.connect(this.sfxG); s.start(t); s.stop(t + d);
  },
  arp(notes, step, type = 'square', v = 0.15, len = null) { notes.forEach((n, i) => this.tone(n, len || step * 1.2, type, v, null, i * step)); },
  play(n) {
    if (!this.ac) return;
    const m = x => 440 * Math.pow(2, (x - 69) / 12);
    switch (n) {
      case 'jump': this.tone(520, 0.15, 'square', 0.1, 900); break;
      case 'coin': this.tone(m(83), 0.06, 'square', 0.1); this.tone(m(88), 0.25, 'square', 0.1, null, 0.06); break;
      case 'stomp': this.tone(420, 0.12, 'triangle', 0.35, 110); break;
      case 'bump': this.tone(150, 0.08, 'triangle', 0.35, 90); break;
      case 'break': this.noise(0.18, 0.4, 900); this.tone(220, 0.12, 'triangle', 0.25, 60); break;
      case 'appear': this.arp([m(60), m(67), m(72), m(64), m(71), m(76)], 0.04, 'triangle', 0.18); break;
      case 'power': this.arp([m(72), m(76), m(79), m(84), m(88), m(91), m(96)], 0.05, 'square', 0.09); break;
      case 'hurt': this.tone(600, 0.35, 'sawtooth', 0.12, 140); break;
      case 'oneup': this.arp([m(76), m(79), m(88), m(84), m(86), m(91)], 0.09, 'square', 0.1); break;
      case 'dash': this.noise(0.2, 0.25, 2400); this.tone(300, 0.15, 'sine', 0.15, 900); break;
      case 'wave': this.tone(880, 0.12, 'sine', 0.2, 1760); this.tone(1320, 0.1, 'triangle', 0.08, 2640, 0.03); break;
      case 'kick': this.tone(260, 0.07, 'square', 0.18, 520); break;
      case 'medal': this.arp([m(84), m(88), m(91), m(96), m(100)], 0.06, 'triangle', 0.22, 0.3); break;
      case 'spring': this.tone(260, 0.3, 'sine', 0.3, 1100); break;
      case 'checkpoint': this.arp([m(79), m(84), m(88), m(91)], 0.08, 'triangle', 0.22, 0.4); break;
      case 'cannon': this.noise(0.25, 0.35, 400); this.tone(120, 0.2, 'triangle', 0.3, 50); break;
      case 'bosshit': this.tone(180, 0.3, 'square', 0.2, 60); this.noise(0.2, 0.3, 600); break;
      case 'bossdie': for (let i = 0; i < 6; i++) { this.noise(0.25, 0.3, 300 + i * 200, i * 0.12); } this.arp([m(60), m(64), m(67), m(72), m(76), m(79), m(84)], 0.1, 'triangle', 0.2, 0.4); break;
      case 'flag': this.arp([m(91), m(88), m(84), m(79), m(76), m(72), m(67), m(64)], 0.06, 'square', 0.08); break;
      case 'clear': this.arp([m(67), m(72), m(76), m(79), m(84), m(88)], 0.11, 'square', 0.1, 0.18); this.arp([m(84), m(86), m(88), m(91)], 0.14, 'triangle', 0.18, 0.4); break;
      case 'die': this.musicStop(); this.arp([m(71), m(77), m(77), m(77), m(76), m(74), m(72)], 0.14, 'square', 0.1); break;
      case 'gameover': this.musicStop(); this.arp([m(72), m(67), m(64), m(69), m(71), m(69), m(68), m(70), m(68), m(67)], 0.2, 'triangle', 0.25, 0.3); break;
      case 'wonder': this.arp([m(72), m(79), m(84), m(91), m(96), m(91), m(84), m(88), m(96)], 0.07, 'sine', 0.25, 0.3); break;
      case 'pause': this.tone(m(88), 0.08, 'square', 0.1); this.tone(m(76), 0.12, 'square', 0.1, null, 0.08); break;
      case 'warn': this.arp([m(84), m(84), m(84)], 0.12, 'square', 0.1); break;
      case 'select': this.tone(m(84), 0.08, 'triangle', 0.25); break;
    }
  },
  // ---- 星空歌姬 BGM 序列 ----
  musicStart(world, boss) {
    if (!this.ac) return;
    this.musicStop();
    if (!this.musicOn) return;
    const root = [60, 62, 57, 64, 59, 62, 57, 60, 55, 55][world % 10] + (boss ? -2 : 0);
    const minor = [2, 4, 6, 8, 9].includes(world % 10) || boss || world >= 20;
    const fix = n => { if (!minor) return n; const pc = ((n % 12) + 12) % 12; return (pc === 4 || pc === 9 || pc === 11) ? n - 1 : n; };
    const melA = [12, null, 16, 19, 21, 19, 16, null, 14, 16, 12, null, 9, 12, 14, null, 12, null, 16, 19, 24, 23, 21, 19, 16, 19, 21, 19, 16, 14, 12, null];
    const melB = [19, 21, 23, 24, null, 23, 21, 19, 16, null, 19, 21, 19, 16, 14, null, 12, 14, 16, 19, null, 16, 19, 21, 24, 23, 21, 19, 21, null, 24, null];
    const melBoss = [12, 12, 15, 12, 17, 12, 18, 17, 12, 12, 15, 12, 19, 18, 17, 15, 12, 12, 15, 12, 17, 12, 18, 17, 20, 19, 18, 17, 15, 14, 12, null];
    const mel = boss ? melBoss : melA.concat(melB);
    const chords = boss ? [0, 0, -4, -2] : [0, -3, -7, -5, 0, -3, -5, -5];
    this.seq = { root, mel, chords, fix, tempo: (boss ? 0.12 : 0.15 - (world % 10) * 0.003) - Math.floor(world / 10) * 0.008 };
    this.step = 0; this.nextT = this.ac.currentTime + 0.05;
    this.timer = setInterval(() => this.tick(), 25);
  },
  tick() {
    if (!this.ac || !this.seq) return;
    const s = this.seq, m = x => 440 * Math.pow(2, (x - 69) / 12);
    while (this.nextT < this.ac.currentTime + 0.12) {
      const i = this.step % s.mel.length, n = s.mel[i];
      if (n !== null) {
        this.tone(m(s.root + s.fix(n)), s.tempo * 1.6, 'square', 0.16, null, this.nextT - this.ac.currentTime, this.musG);
        this.tone(m(s.root + 12 + s.fix(n)), s.tempo * 0.8, 'sine', 0.05, null, this.nextT - this.ac.currentTime, this.musG);
      }
      if (i % 2 === 0) {
        const c = s.chords[Math.floor(i / 8) % s.chords.length];
        const bn = s.root - 24 + c + ((i % 4 === 0) ? 0 : 7);
        this.tone(m(bn), s.tempo * 1.8, 'triangle', 0.32, null, this.nextT - this.ac.currentTime, this.musG);
      }
      if (i % 4 === 2) this.noise(0.04, 0.08, 6000, this.nextT - this.ac.currentTime);
      this.nextT += s.tempo; this.step++;
    }
  },
  musicStop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.seq = null; },
};
