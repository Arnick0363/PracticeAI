// 关卡生成器：300 个关卡（三章 × 10 大世界 × 10 关，每世界第 10 关为首领战）
// 难度系数 d = idx / 99：第 100 关为 1，之后继续上升到第 300 关的约 3。
// 设计借鉴马力欧“引入-练习-应用-变奏”四段式：每个新机制首次出现时会被优先安排在关卡前段。
'use strict';

const TILE = { EMPTY: 0, GROUND: 1, DIRT: 2, BRICK: 3, QBLOCK: 4, USED: 5, STONE: 6, PTL: 7, PTR: 8, PL: 9, PR: 10, CLOUD: 11, SPIKE: 12, CANNON: 13, NOISE: 15 };
const LH = 17;
// 世界特性：cloudy 云朵/移动平台更多 · cave 星晶穹顶+暗角 · noise 坑底噪音浪潮 · ice 地面打滑 · rail 星轨平台更多
const WORLDS = [
  { name: '星海草原', sub: '跟着闪光音符前进吧！' },
  { name: '云端遗迹', sub: '云端的路要跳得更准哦', cloudy: true },
  { name: '深空晶洞', sub: '晶洞幽暗，小心脚下', cave: true },
  { name: '珊瑚星湾', sub: '星海的潮声在耳边回响', cloudy: true },
  { name: '极光冰原', sub: '冰面很滑，提前松手减速！', ice: true },
  { name: '落日钟楼', sub: '跟上钟摆的节拍', rail: true },
  { name: '月影花园', sub: '月光下的花园里藏着残象', cave: true },
  { name: '银河列车', sub: '跳上星轨，穿越银河！', rail: true, cloudy: true },
  { name: '熔星火山', sub: '坑底翻涌着噪音浪潮', noise: true },
  { name: '噪音王城', sub: '最终之城，噪音翻涌', noise: true, cave: true },
  // 第二章 · 暮光篇
  { name: '暮星荒原', sub: '暮光篇开幕：怪物更快更凶了！' },
  { name: '雷鸣云海', sub: '云层里雷声隆隆', cloudy: true },
  { name: '回响矿脉', sub: '矿脉深处回响着噪音', cave: true },
  { name: '深潮星渊', sub: '潮水之下暗流涌动', cloudy: true, noise: true },
  { name: '永冬冰川', sub: '冰川上寸步难行', ice: true },
  { name: '逆时钟塔', sub: '齿轮倒转，平台飞驰', rail: true },
  { name: '荆棘月庭', sub: '荆棘缠绕的月下庭院', cave: true },
  { name: '幽灵星轨', sub: '幽灵列车在星轨上疾驰', rail: true, cloudy: true },
  { name: '炎狱火山口', sub: '噪音浪潮更加汹涌', noise: true },
  { name: '噪音要塞', sub: '噪音大军的前线要塞', noise: true, cave: true },
  // 第三章 · 终焉篇
  { name: '终焉星原', sub: '终焉篇：真正的考验开始了', noise: true },
  { name: '破碎天穹', sub: '天穹碎裂成漂浮的残片', cloudy: true, noise: true },
  { name: '虚空晶核', sub: '虚空中只剩晶核的微光', cave: true, noise: true },
  { name: '沉没星海', sub: '整片星海都沉入了噪音', cloudy: true, noise: true },
  { name: '绝对零度', sub: '冰面之下是无尽噪音', ice: true, noise: true },
  { name: '时之尽头', sub: '时间尽头，平台转瞬即逝', rail: true, noise: true },
  { name: '枯萎花冢', sub: '凋零的花园里危机四伏', cave: true, noise: true },
  { name: '断裂银河', sub: '银河断裂，只剩星轨相连', rail: true, cloudy: true, noise: true },
  { name: '熔核深渊', sub: '星球熔核在脚下翻滚', ice: true, cave: true, noise: true },
  { name: '终焉舞台', sub: '最终舞台：用歌声终结噪音！', noise: true, cave: true },
];
const CHAPTERS = ['第一章 · 星空篇', '第二章 · 暮光篇', '第三章 · 终焉篇'];
const D_SPAN = 99;
const WORLD_NAMES = WORLDS.map(w => w.name);
const LEVEL_COUNT = WORLDS.length * 10;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 每种关卡片段的解锁难度（d = idx/99）与教学提示
const SEG_DEFS = {
  flat:     { min: 0,    w: 2 },
  blocks:   { min: 0,    w: 3 },
  pipes:    { min: 0,    w: 2 },
  gap:      { min: 0,    w: 2 },
  hill:     { min: 0,    w: 1.4 },
  stairs:   { min: 0.04, w: 1.4 },
  spring:   { min: 0.1,  w: 0.9, tip: '踩上音符弹簧可以跳到高处的云朵！' },
  floating: { min: 0.08, w: 1.5, tip: '粉色云朵平台可以从下方穿过跳上去' },
  gauntlet: { min: 0.1,  w: 1.4 },
  spikes:   { min: 0.18, w: 1.4, tip: '小心星晶尖刺，碰到会受伤！' },
  moving:   { min: 0.25, w: 1.5, tip: '站上移动的星轨平台，它会载着你前进' },
  cannon:   { min: 0.3,  w: 1.2, tip: '流星炮台会发射流星弹，可以踩掉它' },
  falling:  { min: 0.45, w: 1.2, tip: '碎星平台被踩后会坠落，快速通过！' },
  fallgap:  { min: 1.05, w: 1.3, tip: '深渊上的碎星平台，头顶还有音符怪巡逻！' },
  lowroof:  { min: 1.4,  w: 1.2, tip: '低矮的音符天花板压低了跳跃，小心脚下尖刺！' },
};
const HARD_SEGS = new Set(['gap', 'spikes', 'cannon', 'falling', 'moving', 'gauntlet', 'fallgap', 'lowroof']);
const HARD_ENEMIES = ['spiky', 'jumper', 'flyer', 'shell'];
const ENEMY_DEFS = [
  { type: 'blob',   min: 0 },
  { type: 'shell',  min: 0.06, tip: '星壳龟被踩后缩成星壳，再碰一下就能踢飞它' },
  { type: 'flyer',  min: 0.14, tip: '漂浮音符怪在空中上下浮动，看准时机踩下去' },
  { type: 'spiky',  min: 0.28, tip: '星刺球不能踩！用声波、星壳或星光无敌消灭它' },
  { type: 'jumper', min: 0.34, tip: '跳跳音叉会追着你蹦，踩一下它就跳不动了' },
];

function buildLevel(idx) {
  const world = Math.floor(idx / 10), stage = idx % 10, boss = stage === 9;
  const d = idx / D_SPAN;
  const dPrev = (idx - 1) / D_SPAN;
  const over = Math.max(0, d - 1); // 超过第 100 关的额外难度
  const R = mulberry32(idx * 7919 + 2026);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = arr => arr[Math.floor(R() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const len = boss ? 70 + Math.min(world, 9) * 12 + Math.max(0, world - 9) * 6
    : Math.round(110 + Math.min(d, 1) * 160 + over * 55 + ri(0, 20));
  const W = len + 90;
  const tiles = new Uint8Array(W * LH);
  const L = {
    idx, world, stage, boss, W, H: LH, tiles, contents: {}, spawns: [], plats: [], cannons: [],
    name: `${world + 1}-${stage + 1}  ${WORLD_NAMES[world]}${boss ? ' · 首领战' : ''}`,
    tips: [], coinTotal: 0, diff: d, chapter: Math.floor(world / 10),
  };
  const medalSpots = [];
  const set = (x, y, t) => { if (x >= 0 && x < W && y >= 0 && y < LH) tiles[y * W + x] = t; };
  const ground = (x0, x1, top) => { for (let x = x0; x < x1; x++) for (let y = top; y < LH; y++) set(x, y, y === top ? TILE.GROUND : TILE.DIRT); };
  const spawn = (type, tx, ty, extra) => L.spawns.push(Object.assign({ type, tx, ty }, extra || {}));
  const content = (x, y, c) => { L.contents[y * W + x] = c; };
  const coin = (tx, ty) => { spawn('coin', tx, ty); L.coinTotal++; };
  const coinLine = (x0, n, ty) => { for (let i = 0; i < n; i++) coin(x0 + i, ty); };
  const coinArc = (x0, n, ty) => { for (let i = 0; i < n; i++) { const k = i / Math.max(1, n - 1); coin(x0 + i, ty - Math.round(Math.sin(k * Math.PI) * 2)); } };

  const enemyPool = ENEMY_DEFS.filter(e => d >= e.min).map(e => e.type);
  for (const e of ENEMY_DEFS) if (e.tip && d >= e.min && dPrev < e.min) L.tips.push(e.tip);
  const enemyChance = Math.min(0.97, 0.3 + d * 0.55);
  const spd = 0.6 + Math.min(d, 1) * 0.8 + over * 0.22;
  const enemyAt = (tx, gy, forced) => {
    const t = forced || (over > 0 && R() < Math.min(0.55, over * 0.3) ? pick(HARD_ENEMIES) : pick(enemyPool));
    if (t === 'flyer') spawn('flyer', tx, gy - 3 - ri(0, 1), { spd });
    else spawn(t, tx, gy - 1, { spd });
  };
  const blockContent = () => {
    // 第 100 关之后道具变少、音符变多
    const r = Math.max(0, R() - Math.min(0.18, over * 0.09));
    if (r < 0.62) return { type: 'coin' };
    if (r < 0.78) return { type: 'power' };
    if (r < 0.85) return { type: 'speed' };
    if (r < 0.9) return { type: 'star' };
    if (r < 0.95 && d > 0.15) return { type: 'galaxy' };
    if (d > 0.08) return { type: 'life' };
    return { type: 'coin' };
  };

  let gy = 14;
  ground(0, 14, gy);
  L.start = { tx: 3, ty: gy - 1 };
  let x = 14;

  const S = {};
  S.flat = () => {
    const n = ri(6, 10); ground(x, x + n, gy);
    if (R() < enemyChance) enemyAt(x + ri(3, n - 1), gy);
    if (R() < 0.5) coinLine(x + 2, ri(3, 5), gy - 3);
    return x + n;
  };
  S.blocks = () => {
    const n = ri(10, 13); ground(x, x + n, gy);
    const bx = x + ri(2, 3), cnt = ri(3, 5), row = gy - 4;
    let hasQ = false;
    for (let i = 0; i < cnt; i++) {
      const q = R() < 0.45 || (i === cnt - 1 && !hasQ);
      if (q) {
        hasQ = true; set(bx + i, row, TILE.QBLOCK);
        content(bx + i, row, idx === 0 && i === 1 ? { type: 'power' } : blockContent());
        if (L.contents[row * W + bx + i].type === 'coin') L.coinTotal++;
      } else {
        set(bx + i, row, TILE.BRICK);
        if (R() < 0.12) { content(bx + i, row, { type: 'multi', n: 6 }); L.coinTotal += 6; }
      }
    }
    if (R() < 0.45) {
      const ux = bx + 1, un = Math.min(cnt - 1, ri(1, 3));
      for (let i = 0; i < un; i++) { set(ux + i, gy - 8, i === 0 ? TILE.QBLOCK : TILE.BRICK); if (i === 0) content(ux, gy - 8, blockContent()); }
      coinLine(ux, un, gy - 9);
    }
    medalSpots.push({ tx: bx + cnt, ty: gy - 6, w: 2 });
    if (R() < enemyChance) enemyAt(x + ri(4, n - 2), gy);
    return x + n;
  };
  S.gap = () => {
    ground(x, x + 2, gy);
    let maxW = Math.min(d > 1.3 ? 5 : 4, 2 + Math.floor(d * 3) + (R() < 0.3 ? 1 : 0));
    const w = ri(d > 2 ? 3 : 2, maxW);
    const gy2 = clamp(gy + pick([0, 0, -1, 1]), 11, 14);
    coinArc(x + 1, w + 2, Math.min(gy, gy2) - 3);
    medalSpots.push({ tx: x + 2 + Math.floor(w / 2), ty: Math.min(gy, gy2) - 6, w: 3 });
    gy = gy2;
    ground(x + 2 + w, x + 5 + w, gy);
    return x + 5 + w;
  };
  S.pipes = () => {
    const count = ri(1, 3); let px = x + 2; const list = [];
    for (let i = 0; i < count; i++) { list.push({ px, h: ri(2, Math.min(4, 2 + Math.floor(d * 3))) }); px += 2 + ri(3, 5); }
    const n = px - x + 1; ground(x, x + n, gy);
    for (const p of list) {
      const top = gy - p.h;
      set(p.px, top, TILE.PTL); set(p.px + 1, top, TILE.PTR);
      for (let y = top + 1; y < gy; y++) { set(p.px, y, TILE.PL); set(p.px + 1, y, TILE.PR); }
      if (d > 0.1 && R() < 0.55) spawn('plant', p.px, top - 1);
      else if (R() < 0.5) coin(p.px, top - 2), coin(p.px + 1, top - 2);
    }
    if (list.length > 1 && R() < enemyChance) enemyAt(list[0].px + 3, gy);
    medalSpots.push({ tx: list[list.length - 1].px, ty: gy - list[list.length - 1].h - 4, w: 1 });
    return x + n;
  };
  S.stairs = () => {
    const h = ri(3, Math.min(6, 3 + Math.floor(d * 4)));
    const g = d > 0.2 && R() < 0.6 ? ri(1, 2) + (d > 0.5 ? 1 : 0) : 0;
    const total = 1 + h + 1 + g + h + 2;
    ground(x, x + total, gy);
    for (let c = 0; c < h; c++) for (let j = 0; j <= c; j++) set(x + 1 + c, gy - 1 - j, TILE.STONE);
    for (let j = 0; j < h; j++) set(x + 1 + h, gy - 1 - j, TILE.STONE);
    for (let c = 0; c < g; c++) for (let y = gy; y < LH; y++) set(x + 2 + h + c, y, TILE.EMPTY);
    for (let c = 0; c < h; c++) for (let j = 0; j < h - c; j++) set(x + 2 + h + g + c, gy - 1 - j, TILE.STONE);
    medalSpots.push({ tx: x + 1 + h, ty: gy - h - 3, w: 2 });
    coinLine(x + 1 + h, 1 + g, gy - h - 2);
    return x + total;
  };
  S.hill = () => {
    const dir = gy <= 11 ? 1 : gy >= 14 ? -1 : pick([-1, 1]);
    gy = clamp(gy + dir * ri(1, 2), 11, 14);
    const n = ri(5, 8); ground(x, x + n, gy);
    if (R() < 0.5) coinLine(x + 1, n - 2, gy - 2);
    if (R() < enemyChance * 0.7) enemyAt(x + n - 2, gy);
    return x + n;
  };
  S.floating = () => {
    ground(x, x + 2, gy);
    let px = x + 2, row = gy - ri(1, 3), best = null;
    const count = ri(3, 5);
    for (let i = 0; i < count; i++) {
      const w = ri(2, 4);
      for (let k = 0; k < w; k++) set(px + k, row, TILE.CLOUD);
      if (R() < 0.6) coinLine(px, w, row - 1);
      if (!best || row < best.ty) best = { tx: px + 1, ty: row - 3, w: 2 };
      if (d > 0.2 && R() < 0.3) enemyAt(px + w, row + 1, enemyPool.includes('flyer') ? 'flyer' : undefined);
      px += w + ri(2, 3);
      row = clamp(row + pick([-2, -1, 0, 1, 2]), Math.max(4, gy - 5), gy - 1);
    }
    medalSpots.push(best);
    ground(px, px + 3, gy);
    return px + 3;
  };
  S.moving = () => {
    ground(x, x + 2, gy);
    if (R() < 0.4) {
      // 垂直升降平台 + 高台
      L.plats.push({ kind: 'v', tx: x + 2, ty: gy - 1, w: 3, top: gy - 7, speed: 0.8 + Math.min(d, 1) * 0.6 + over * 0.3 });
      for (let c = x + 5; c < x + 10; c++) { for (let y = gy - 5; y < gy; y++) set(c, y, TILE.STONE); }
      ground(x + 5, x + 12, gy);
      coinLine(x + 5, 5, gy - 6);
      medalSpots.push({ tx: x + 7, ty: gy - 8, w: 2 });
      return x + 12;
    }
    const n = ri(7, 10);
    L.plats.push({ kind: 'h', tx: x + 2, ty: gy - 1, w: 3, x1: x + 2 + n - 3, speed: 1 + Math.min(d, 1) * 0.8 + over * 0.4 });
    coinLine(x + 3, n - 2, gy - 4);
    ground(x + 2 + n, x + 5 + n, gy);
    return x + 5 + n;
  };
  S.spring = () => {
    ground(x, x + 12, gy);
    spawn('spring', x + 3, gy - 1);
    for (let c = x + 5; c < x + 10; c++) set(c, gy - 9, TILE.CLOUD);
    coinLine(x + 5, 5, gy - 10);
    medalSpots.push({ tx: x + 7, ty: gy - 11, w: 3 });
    return x + 12;
  };
  S.spikes = () => {
    const groups = over > 0.5 ? ri(2, 4) : ri(1, 3); let px = x + 3;
    const list = [];
    for (let g = 0; g < groups; g++) { const w = ri(1, Math.min(3, 1 + Math.floor(d * 3))); list.push([px, w]); px += w + ri(3, 4); }
    ground(x, px + 1, gy);
    for (const [sx, w] of list) { for (let k = 0; k < w; k++) set(sx + k, gy - 1, TILE.SPIKE); coinLine(sx, w, gy - 4); }
    if (d > 0.5 && R() < 0.5) { const [sx, w] = list[0]; for (let k = -1; k <= w; k++) set(sx + k, gy - 6, TILE.BRICK); }
    return px + 1;
  };
  S.cannon = () => {
    const many = over > 0.8;
    const n = ri(11, 14) + (many ? 6 : 0); ground(x, x + n, gy);
    const cnt = ri(1, many ? 3 : 2);
    for (let c = 0; c < cnt; c++) {
      const cx = x + 3 + c * 6, h = ri(1, 2);
      for (let j = 0; j < h - 1; j++) set(cx, gy - 1 - j, TILE.STONE);
      set(cx, gy - h, TILE.CANNON);
      L.cannons.push({ tx: cx, ty: gy - h });
    }
    if (R() < enemyChance) enemyAt(x + n - 2, gy);
    return x + n;
  };
  S.falling = () => {
    ground(x, x + 2, gy);
    let px = x + 2, row = gy - 1; const cnt = ri(3, over > 0.5 ? 7 : 5);
    for (let i = 0; i < cnt; i++) {
      L.plats.push({ kind: 'fall', tx: px, ty: row, w: 2 });
      coin(px, row - 2);
      px += 2 + ri(1, 2);
      row = clamp(row + pick([-1, 0, 1]), gy - 3, gy - 1);
    }
    ground(px, px + 3, gy);
    return px + 3;
  };
  S.gauntlet = () => {
    const n = ri(14, 18); ground(x, x + n, gy);
    const kMax = 3 + Math.floor(d * 3);
    const k = ri(2, over > 0 ? Math.min(kMax, Math.floor((n - 6) / 1.6)) : kMax);
    for (let i = 0; i < k; i++) enemyAt(x + 4 + Math.floor(i * (n - 6) / k), gy);
    const bx = x + ri(3, 6);
    for (let i = 0; i < 3; i++) set(bx + i, gy - 4, i === 1 ? TILE.QBLOCK : TILE.BRICK);
    content(bx + 1, gy - 4, R() < 0.5 ? { type: 'power' } : blockContent());
    medalSpots.push({ tx: bx + 1, ty: gy - 7, w: 2 });
    return x + n;
  };

  S.fallgap = () => {
    ground(x, x + 2, gy);
    let px = x + 2; const cnt = ri(4, 6);
    for (let i = 0; i < cnt; i++) {
      const row = gy - 1 - (i % 2);
      L.plats.push({ kind: 'fall', tx: px, ty: row, w: 2 });
      if (i % 2 === 1) spawn('flyer', px, row - 4, { spd });
      else coin(px, row - 2);
      px += 2 + ri(1, 2);
    }
    medalSpots.push({ tx: x + 2 + Math.floor((px - x - 2) / 2), ty: gy - 7, w: 2 });
    ground(px, px + 3, gy);
    return px + 3;
  };
  S.lowroof = () => {
    const n = ri(14, 18); ground(x, x + n, gy);
    for (let c = x + 1; c < x + n - 1; c++) set(c, gy - 5, TILE.BRICK);
    let px = x + 4;
    while (px < x + n - 4) { const w = ri(1, 2); for (let k = 0; k < w; k++) set(px + k, gy - 1, TILE.SPIKE); px += w + ri(3, 4); }
    coinLine(x + 2, n - 4, gy - 3);
    enemyAt(x + n - 3, gy);
    return x + n;
  };

  // 本关新出现的片段优先安排（教学）
  const avail = Object.keys(SEG_DEFS).filter(k => d >= SEG_DEFS[k].min);
  const queue = [];
  for (const k of avail) if (dPrev < SEG_DEFS[k].min && SEG_DEFS[k].min > 0) { queue.push(k); if (SEG_DEFS[k].tip) L.tips.push(SEG_DEFS[k].tip); }
  if (idx === 0) queue.push('flat', 'blocks', 'pipes', 'gap', 'flat', 'blocks', 'stairs', 'hill', 'gap', 'blocks');
  const WF = WORLDS[world];
  const segW = k => SEG_DEFS[k].w * (k === 'gap' ? 1 + d : 1)
    * (WF.cloudy && (k === 'floating' || k === 'moving') ? 2 : 1)
    * (WF.rail && (k === 'moving' || k === 'falling') ? 2.5 : 1)
    * (WF.ice && (k === 'gauntlet' || k === 'hill') ? 1.6 : 1)
    * (over > 0 && HARD_SEGS.has(k) ? 1 + over * 0.9 : 1)
    * (over > 0 && (k === 'flat' || k === 'hill') ? 1 / (1 + over) : 1);
  const totalW = avail.reduce((s, k) => s + segW(k), 0);
  const choose = () => {
    if (queue.length) return queue.shift();
    let r = R() * totalW;
    for (const k of avail) { r -= segW(k); if (r <= 0) return k; }
    return 'flat';
  };

  let cpDone = boss && over === 0; // 第 100 关之后的首领关路途更长，也给一个存档点
  while (x < len) {
    if (!cpDone && x > len * 0.5) {
      ground(x, x + 6, gy); spawn('checkpoint', x + 3, gy - 1); L.checkpoint = { tx: x + 3, ty: gy - 1 };
      x += 6; cpDone = true; continue;
    }
    x = S[choose()]();
    const b = ri(1, 3); ground(x, x + b, gy); x += b;
  }

  if (!boss) {
    ground(x, x + 3, gy); x += 3;
    const h = Math.min(3 + Math.floor(d * 5), 7);
    ground(x, x + h + 1, gy);
    for (let c = 0; c < h; c++) for (let j = 0; j <= c; j++) set(x + c, gy - 1 - j, TILE.STONE);
    for (let j = 0; j < h; j++) set(x + h, gy - 1 - j, TILE.STONE);
    x += h + 1;
    ground(x, W, gy);
    const fx = x + 3;
    set(fx, gy - 1, TILE.STONE);
    spawn('flag', fx, gy - 2, { top: Math.max(gy - 12, 2) });
    spawn('gate', fx + 7, gy - 1);
    L.goalX = fx;
  } else {
    ground(x, x + 3, gy); x += 3;
    const x0 = x, aw = 26;
    ground(x0, x0 + aw, gy);
    for (let i = 0; i < 3; i++) { set(x0 + 5 + i, gy - 4, TILE.STONE); set(x0 + aw - 8 + i, gy - 4, TILE.STONE); }
    for (let y = 0; y < gy; y++) set(x0 + aw, y, TILE.STONE);
    ground(x0 + aw, W, gy);
    L.arena = { x0, x1: x0 + aw, gy };
    spawn('boss', x0 + 18, gy - 1, { hp: world < 10 ? 3 + Math.floor(world / 2) : Math.min(12, 7 + Math.floor((world - 9) / 3)) });
    L.goalX = x0 + aw - 3;
  }

  // 世界特色后处理
  if (WF.cave) { for (let c = 0; c < W; c++) { set(c, 0, TILE.STONE); set(c, 1, TILE.STONE); } }
  if (WF.noise) { for (let c = 0; c < W; c++) if (tiles[16 * W + c] === TILE.EMPTY) set(c, 16, TILE.NOISE); }

  // 第 100 关之后：额外的空中巡逻音符怪，密度随难度继续上升
  if (over > 0) {
    const endX = boss ? L.arena.x0 - 4 : L.goalX - 10;
    // 危险度保底：怪物 + 尖刺/2 + 炮台×3 + 碎星平台，每百格不低于随关卡上升的下限
    const ENEMY = new Set(['blob', 'shell', 'flyer', 'spiky', 'jumper', 'plant']);
    let danger = L.spawns.filter(s => ENEMY.has(s.type)).length + L.cannons.length * 3 + L.plats.filter(p => p.kind === 'fall').length;
    for (let k = 0; k < tiles.length; k++) if (tiles[k] === TILE.SPIKE) danger += 0.5;
    const floor = (6 + over * 4.2) * W / 100;
    const extra = Math.max(Math.round((endX - 20) / 100 * (over * 1.4 + over * over * 0.5)), Math.ceil(floor - danger));
    for (let i = 0; i < extra; i++) {
      const tx = 20 + Math.floor((i + 0.5) * (endX - 20) / extra);
      let top = 4; while (top < LH && tiles[top * W + tx] === TILE.EMPTY) top++;
      spawn('flyer', tx, Math.max(3, Math.min(top, 14) - 4), { spd });
    }
  }

  // 星声徽章 ×3（分散在关卡前中后段）
  const spots = medalSpots.filter(Boolean).filter(s => s.ty >= 2);
  const chosen = [];
  if (spots.length >= 3) { for (const f of [0.15, 0.5, 0.85]) chosen.push(spots[Math.min(spots.length - 1, Math.floor(f * spots.length))]); }
  while (chosen.length < 3) chosen.push({ tx: 20 + chosen.length * Math.floor(len / 3), ty: 9 });
  const used = new Set();
  chosen.forEach((s, i) => {
    let tx = s.tx; while (used.has(tx)) tx += 2; used.add(tx);
    // 避免嵌在实心砖块里
    let ty = s.ty; while (ty > 2 && tiles[ty * W + tx] !== TILE.EMPTY) ty--;
    spawn('medal', tx, ty, { id: i });
  });

  // 致敬《惊奇》：从 1-3 起，每个普通关卡藏有一朵“奇想星花”
  if (!boss && idx >= 2) {
    const keys = Object.keys(L.contents).filter(k => tiles[k] === TILE.QBLOCK && L.contents[k].type !== 'coin');
    const all = keys.length ? keys : Object.keys(L.contents).filter(k => tiles[k] === TILE.QBLOCK);
    if (all.length) {
      const k = all[Math.floor(R() * all.length)];
      if (L.contents[k].type === 'coin') L.coinTotal--;
      L.contents[k] = { type: 'wonder' };
    }
  }

  L.time = Math.round(150 + len * (0.95 - Math.min(0.25, over * 0.12)));
  return L;
}

if (typeof module !== 'undefined') module.exports = { buildLevel, TILE, LH, LEVEL_COUNT, WORLDS, CHAPTERS };
