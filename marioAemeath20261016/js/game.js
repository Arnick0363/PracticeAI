// 主逻辑：物理（马力学手感）、实体、关卡流程、存档、界面
'use strict';
(() => {
  const SOLID = new Uint8Array(32);
  [T.GROUND, T.DIRT, T.BRICK, T.QBLOCK, T.USED, T.STONE, T.PTL, T.PTR, T.PL, T.PR, T.CANNON].forEach(t => SOLID[t] = 1);
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  let RS = 1;
  const FORM_NAMES = ['普通形态', '共鸣形态', '星河形态'];
  const COMBO = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
  const MAX_LIVES_START = 5;

  // ================= 存档 =================
  const SAVE_KEY = 'aemeath_starruins_v1';
  let save = { medals: {}, best: {}, skin: 0, portrait: false, muted: false };
  try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } };
  Snd.muted = !!save.muted;

  // ================= 输入 =================
  const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyK: 'jump', ArrowDown: 'down', KeyS: 'down', ShiftLeft: 'dash', ShiftRight: 'dash', KeyX: 'dash', KeyL: 'dash', KeyZ: 'wave', KeyJ: 'wave', KeyF: 'wave' };
  const held = {}, press = {};
  addEventListener('keydown', e => {
    Snd.init();
    const k = KEYMAP[e.code];
    if (k) { if (!held[k]) press[k] = true; held[k] = true; if (G.state === 'play') e.preventDefault(); }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (G.state === 'play') pauseGame(); else if (G.state === 'pause') resumeGame(); }
    if (e.code === 'Enter') {
      if (G.state === 'title') $('btnStart').click();
      else if (G.state === 'clear') $('btnNext').click();
      else if (G.state === 'pause') resumeGame();
    }
    if (e.code === 'KeyM') toggleMute();
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) held[k] = false; });
  addEventListener('blur', () => { for (const k in held) held[k] = false; if (G.state === 'play') pauseGame(); });
  document.querySelectorAll('#touch [data-k]').forEach(b => {
    const k = b.dataset.k;
    const on = e => { e.preventDefault(); Snd.init(); if (!held[k]) press[k] = true; held[k] = true; b.classList.add('on'); };
    const off = e => { e.preventDefault(); held[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  });
  const isTouch = ('ontouchstart' in window) || matchMedia('(pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');

  // ================= 尺寸 =================
  function resize() {
    const s = Math.min(innerWidth / VW, innerHeight / VH);
    const wrap = $('wrap'); wrap.style.width = VW * s + 'px'; wrap.style.height = VH * s + 'px';
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(VW * s * dpr); canvas.height = Math.round(VH * s * dpr);
    RS = canvas.width / VW;
    $('ui').style.transform = `scale(${s})`;
    $('rotate').classList.toggle('show', isTouch && innerHeight > innerWidth);
  }
  addEventListener('resize', resize); resize();

  // ================= 游戏状态 =================
  const G = { state: 'title', lives: MAX_LIVES_START, coins: 0, score: 0, form: 0, idx: 0, frame: 0, timeLeft: 0, cp: false, medalsRun: [false, false, false], coinsGot: 0, bossOn: false, wonderT: 0, shake: 0, menuX: 0, tally: null };
  let L = null, ents = [], parts = [], plats = [], cannons = [], P = null, bumps = [];
  const cam = { x: 0, y: LH * TS - VH };

  const tileAt = (tx, ty) => (tx < 0 || tx >= L.W) ? T.STONE : (ty < 0 || ty >= LH) ? T.EMPTY : L.tiles[ty * L.W + tx];
  const setTile = (tx, ty, t) => { if (tx >= 0 && tx < L.W && ty >= 0 && ty < LH) L.tiles[ty * L.W + tx] = t; };
  const solid = (tx, ty) => SOLID[tileAt(tx, ty)] === 1;
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ================= 碰撞 =================
  function collideX(e) {
    const top = Math.floor(e.y / TS), bot = Math.floor((e.y + e.h - 0.01) / TS);
    if (e.vx > 0) { const tx = Math.floor((e.x + e.w) / TS); for (let ty = top; ty <= bot; ty++) if (solid(tx, ty)) { e.x = tx * TS - e.w; return true; } }
    else if (e.vx < 0) { const tx = Math.floor(e.x / TS); for (let ty = top; ty <= bot; ty++) if (solid(tx, ty)) { e.x = (tx + 1) * TS; return true; } }
    return false;
  }
  function collideY(e, prevBottom) {
    e.onGround = false;
    const l = Math.floor((e.x + 1) / TS), r = Math.floor((e.x + e.w - 1) / TS);
    if (e.vy >= 0) {
      const ty = Math.floor((e.y + e.h) / TS);
      for (let tx = l; tx <= r; tx++) {
        const t = tileAt(tx, ty);
        if (SOLID[t] || (t === T.CLOUD && prevBottom <= ty * TS + 0.5)) { e.y = ty * TS - e.h; e.vy = 0; e.onGround = true; return null; }
      }
    } else {
      const ty = Math.floor(e.y / TS);
      const hits = [];
      for (let tx = l; tx <= r; tx++) if (solid(tx, ty)) hits.push(tx);
      if (hits.length) {
        e.y = (ty + 1) * TS; e.vy = 0;
        const c = Math.floor((e.x + e.w / 2) / TS);
        return { tx: hits.includes(c) ? c : hits[0], ty };
      }
    }
    return null;
  }
  function moveEnt(e, grav = 0.5) {
    const pb = e.y + e.h;
    e.vy = Math.min(e.vy + grav, 10);
    e.x += e.vx; e.hitWall = collideX(e);
    e.y += e.vy; collideY(e, pb);
  }

  // ================= 粒子 =================
  function spark(x, y, n, col, sp = 3, life = 30, size = 3) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = Math.random() * sp; parts.push({ k: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life, max: life, col: col || `hsl(${Math.random() * 360},90%,75%)`, size: size * (0.5 + Math.random() * 0.8) }); }
  }
  function popText(x, y, txt, col = '#fff') { parts.push({ k: 'text', x, y, vx: 0, vy: -0.8, life: 50, max: 50, txt, col }); }
  function addScore(n, x, y) { G.score += n; if (x !== undefined) popText(x, y, String(n)); }
  function addCoin(x, y, bonus) {
    G.coins++; if (!bonus) G.coinsGot++; addScore(200); Snd.play('coin');
    if (x !== undefined) spark(x, y, 5, '#ffe68a', 2, 20, 2.5);
    if (G.coins >= 100) { G.coins -= 100; oneUp(x, y); }
  }
  function oneUp(x, y) { G.lives++; Snd.play('oneup'); if (x !== undefined) popText(x, y - 10, '1UP', '#7cffb0'); }

  // ================= 关卡构建 =================
  function spawnEnt(s) {
    const bx = s.tx * TS, by = (s.ty + 1) * TS;
    const E = (type, w, h, stompable) => ({ type, enemy: true, stompable, x: bx + (TS - w) / 2, y: by - h, w, h, vx: -0.9 * (s.spd || 1), vy: 0, spd: s.spd || 1, active: false, t: 0, state: 'walk' });
    switch (s.type) {
      case 'coin': return { type: 'coin', item: true, x: bx + 6, y: by - 28, w: 20, h: 24 };
      case 'medal': return { type: 'medal', id: s.id, x: bx + 2, y: by - 30, w: 28, h: 28, ghost: G.medalsRun[s.id] };
      case 'blob': return E('blob', 26, 24, true);
      case 'shell': return E('shell', 26, 28, true);
      case 'spiky': return E('spiky', 26, 24, false);
      case 'jumper': { const e = E('jumper', 22, 30, true); e.vx = 0; return e; }
      case 'flyer': { const e = E('flyer', 28, 28, true); e.baseY = e.y; e.vx = -0.6 * (s.spd || 1); return e; }
      case 'plant': return { type: 'plant', enemy: true, stompable: false, x: bx + 18, y: by, w: 28, h: 34, baseY: by, ph: 0, t: Math.floor(Math.random() * 90), active: false, behind: true };
      case 'spring': return { type: 'spring', obj: true, x: bx + 2, y: by - 22, w: 28, h: 22, comp: 0 };
      case 'checkpoint': return { type: 'checkpoint', obj: true, x: bx + 8, y: by - 72, w: 16, h: 72, on: G.cp };
      case 'flag': return { type: 'flag', obj: true, x: bx + 13, y: s.top * TS, w: 6, h: by - s.top * TS, top: s.top * TS, bottom: by, clothY: s.top * TS + 6 };
      case 'gate': return { type: 'gate', obj: true, x: bx, y: by - 96, w: 64, h: 96 };
      case 'boss': return { type: 'boss', enemy: true, stompable: true, x: bx - 14, y: by - 60, w: 60, h: 60, vx: 0, vy: 0, hp: s.hp, maxHp: s.hp, world: L.world, tier: L.world <= 9 ? L.world / 3 : 3 + (L.world - 9) * 0.1, inv: 0, t: 0, active: true, face: -1, waveDmg: 0 };
    }
    return null;
  }

  function loadLevel(idx, useCp) {
    L = buildLevel(idx);
    G.idx = idx; G.levelT = 0; G.bossOn = false; G.wonderT = 0; G.tally = null; G.shake = 0;
    ents = []; parts = []; bumps = [];
    for (const s of L.spawns) { const e = spawnEnt(s); if (e) ents.push(e); }
    plats = L.plats.map(p => ({ kind: p.kind, x: p.tx * TS, y: p.ty * TS, w: p.w * TS, h: 14, x0: p.tx * TS, x1: (p.x1 || 0) * TS, y0: p.ty * TS, y1: (p.top || 0) * TS, dir: 1, sp: p.speed || 1, dx: 0, dy: 0, fallT: -1, vy: 0, delay: Math.round(Math.max(14, 28 - Math.max(0, L.diff - 1) * 6)) }));
    cannons = L.cannons.map(c => ({ tx: c.tx, ty: c.ty, t: Math.floor(Math.random() * 120) }));
    const st = useCp && G.cp && L.checkpoint ? L.checkpoint : L.start;
    P = makePlayer(st.tx * TS, (st.ty + 1) * TS);
    G.timeLeft = L.time;
    cam.x = Math.max(0, Math.min(P.x - VW * 0.4, L.W * TS - VW));
    getAtlas(L.world); getBg(L.world);
  }
  function makePlayer(x, footY) {
    const big = G.form > 0, h = big ? 48 : 28, w = big ? 24 : 22;
    return { x: x + (TS - w) / 2, y: footY - h, w, h, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0, dashT: 0, dashCD: 0, airDash: true, inv: 0, starT: 0, speedT: 0, mode: 'normal', anim: 0, combo: 0, plat: null, prevY: 0, trail: [], waveCD: 0, t: 0, blink: 0, flag: null };
  }
  function setForm(f) {
    const oldH = P.h; G.form = f;
    P.h = f > 0 ? 48 : 28; P.w = f > 0 ? 24 : 22;
    P.y += oldH - P.h;
  }

  // ================= 方块 =================
  function hitBlock(tx, ty) {
    const t = tileAt(tx, ty), key = ty * L.W + tx, c = L.contents[key];
    let bumped = false;
    if (t === T.QBLOCK) {
      setTile(tx, ty, T.USED); bumped = true;
      release(c || { type: 'coin' }, tx, ty); delete L.contents[key];
    } else if (t === T.BRICK) {
      if (c && c.type === 'multi') {
        release({ type: 'coin' }, tx, ty); c.n--; bumped = true;
        if (c.n <= 0) { setTile(tx, ty, T.USED); delete L.contents[key]; }
      } else if (G.form > 0) {
        setTile(tx, ty, T.EMPTY); addScore(50); Snd.play('break');
        for (let i = 0; i < 4; i++) parts.push({ k: 'chunk', x: tx * TS + 8 + (i % 2) * 16, y: ty * TS + 8 + (i > 1 ? 16 : 0), vx: (i % 2 ? 2 : -2), vy: i > 1 ? -5 : -8, life: 60, max: 60, col: THEMES[L.world].brickA });
        spark(tx * TS + 16, ty * TS + 16, 6, '#ffd2ec', 3, 25);
      } else { bumped = true; Snd.play('bump'); }
    } else Snd.play('bump');
    if (bumped || tileAt(tx, ty) === T.EMPTY) {
      if (bumped) bumps.push({ tx, ty, t: 0 });
      const zone = { x: tx * TS, y: ty * TS - 6, w: TS, h: 8 };
      for (const e of ents) {
        if (e.enemy && !e.dying && e.type !== 'boss' && overlap(zone, e)) killEnemy(e, 'flip', 100);
        if (e.item && e.type !== 'coin' && overlap(zone, e)) { e.vy = -6; e.vx = (e.x + e.w / 2 < tx * TS + 16) ? -Math.abs(e.vx || 1.6) : Math.abs(e.vx || 1.6); }
        if (e.type === 'coin' && overlap(zone, e)) { e.dead = true; addCoin(e.x + 10, e.y); }
      }
    }
  }
  function release(c, tx, ty) {
    const x = tx * TS, y = ty * TS;
    if (c.type === 'coin' || c.type === 'multi') {
      parts.push({ k: 'coin', x: x + 16, y: y - 8, vx: 0, vy: -7, life: 26, max: 26 });
      addCoin(x + 16, y - 16); return;
    }
    let type = c.type;
    if (type === 'power' && G.form > 0) type = 'galaxy';
    const sz = { power: [24, 26], galaxy: [26, 28], speed: [26, 26], star: [28, 28], life: [26, 24], wonder: [30, 30] }[type] || [24, 24];
    ents.push({ type, item: true, x: x + (TS - sz[0]) / 2, y: y + 2, w: sz[0], h: sz[1], vx: 0, vy: 0, emerge: sz[1], tyTop: y - sz[1], dir: P.x < x ? 1 : 1 });
    Snd.play('appear');
  }

  // ================= 敌人 =================
  function killEnemy(e, how, pts) {
    if (e.dying) return;
    e.dying = how; e.t = 0;
    if (how === 'flip') { e.vy = -6; e.vx = (e.x < P.x ? -1.5 : 1.5); Snd.play('kick'); }
    if (pts) addScore(pts, e.x + e.w / 2, e.y);
    spark(e.x + e.w / 2, e.y + e.h / 2, 8, null, 3, 25);
  }
  function comboScore(x, y) {
    const i = P.combo++;
    if (i >= COMBO.length) { oneUp(x, y); return 0; }
    addScore(COMBO[i], x, y); return COMBO[i];
  }
  function stomp(e) {
    P.vy = held.jump ? -10.5 : -7;
    P.onGround = false;
    if (e.type === 'boss') { bossHit(e); P.vy = -10.5; return; }
    comboScore(e.x + e.w / 2, e.y);
    Snd.play('stomp');
    spark(e.x + e.w / 2, e.y, 6, '#ffffff', 2.5, 20, 2.5);
    switch (e.type) {
      case 'blob': case 'jumper': e.dying = 'squash'; e.t = 0; break;
      case 'shell':
        if (e.state === 'walk') { e.state = 'shell'; e.y += e.h - 22; e.h = 22; e.vx = 0; e.t = 0; }
        else if (e.state === 'spin') { e.state = 'shell'; e.vx = 0; e.t = 0; }
        else { kickShell(e); }
        break;
      default: e.dying = 'flip'; e.vy = -3; e.vx = 0; e.t = 0;
    }
  }
  function kickShell(e) {
    e.state = 'spin'; e.vx = (P.x + P.w / 2 < e.x + e.w / 2) ? 7.5 : -7.5; e.kickGrace = 14; e.t = 0;
    Snd.play('kick'); addScore(400, e.x + 13, e.y);
  }
  function bossHit(e) {
    if (e.inv > 0 || e.dying) return;
    e.hp--; e.inv = 80; G.shake = 14; Snd.play('bosshit');
    e.vx = (e.x + e.w / 2 > P.x + P.w / 2 ? 1 : -1) * 4;
    spark(e.x + e.w / 2, e.y + 10, 16, '#ff9ac8', 4, 35, 4);
    if (e.hp <= 0) {
      e.dying = 'flip'; e.vy = -8; e.t = 0; Snd.play('bossdie'); Snd.musicStop();
      addScore(10000, e.x + e.w / 2, e.y);
      for (const o of ents) if (o.type === 'orb') o.dead = true;
      const ax = (L.arena.x0 + 13) * TS;
      ents.push({ type: 'trophy', item: true, x: ax - 22, y: 3 * TS, w: 44, h: 44, vx: 0, vy: 0, float: true });
    }
  }
  function updEnemy(e) {
    if (!e.active) {
      if (e.x < cam.x + VW + 64) e.active = true; else return;
    }
    if (e.dying) {
      e.t++;
      if (e.dying === 'squash') { if (e.t > 30) e.dead = true; }
      else { e.vy += 0.4; e.x += e.vx; e.y += e.vy; if (e.y > LH * TS + 80) e.dead = true; }
      return;
    }
    if (G.wonderT > 0 && e.type !== 'boss' && e.x > cam.x - 32 && e.x < cam.x + VW + 32) {
      // 奇想时间：屏幕内怪物化为音符
      e.dead = true; spark(e.x + e.w / 2, e.y + e.h / 2, 8, '#ffe68a', 3, 25);
      ents.push({ type: 'coin', item: true, bonus: true, x: e.x + e.w / 2 - 10, y: e.y, w: 20, h: 24 });
      return;
    }
    e.t++;
    switch (e.type) {
      case 'blob': case 'spiky': moveEnt(e); if (e.hitWall) e.vx = -e.vx; break;
      case 'shell':
        if (e.state === 'walk') {
          if (e.onGround) {
            const fx = Math.floor((e.vx > 0 ? e.x + e.w + 1 : e.x - 1) / TS), fy = Math.floor((e.y + e.h + 2) / TS);
            const t = tileAt(fx, fy); if (!SOLID[t] && t !== T.CLOUD) e.vx = -e.vx;
          }
          moveEnt(e); if (e.hitWall) e.vx = -e.vx;
        } else if (e.state === 'shell') {
          e.vx = 0; moveEnt(e);
          if (e.t > 480) { e.state = 'walk'; e.y -= 28 - e.h; e.h = 28; e.vx = (P.x < e.x ? -0.9 : 0.9) * e.spd; }
        } else {
          if (e.kickGrace > 0) e.kickGrace--;
          moveEnt(e); if (e.hitWall) { e.vx = -e.vx; Snd.play('bump'); }
          for (const o of ents) if (o !== e && o.enemy && !o.dying && o.active && o.type !== 'boss' && overlap(e, o)) killEnemy(o, 'flip', COMBO[Math.min(7, (e.chain = (e.chain || 0) + 1) + 1)]);
          if (e.x < cam.x - 300 || e.x > cam.x + VW + 300) e.dead = true;
        }
        break;
      case 'flyer': {
        e.x += e.vx; collideX(e) && (e.vx = -e.vx);
        if (e.t % 240 === 0) e.vx = -e.vx;
        e.y = e.baseY + Math.sin(e.t * 0.045) * 38;
        break;
      }
      case 'jumper':
        if (e.onGround) { e.vx *= 0.7; if (e.t > 55 + (e.x % 30)) { e.vy = -8.5; e.vx = Math.sign(P.x - e.x || -1) * 1.8 * e.spd; e.t = 0; } }
        moveEnt(e, 0.4); if (e.hitWall) e.vx = -e.vx;
        break;
      case 'plant': {
        const near = Math.abs(P.x + P.w / 2 - (e.x + e.w / 2)) < 48;
        e.ph = e.ph || 0;
        if (e.ph === 0) { if (e.t > 90 && !near) { e.ph = 1; e.t = 0; } }
        else if (e.ph === 1) { e.y = e.baseY - e.h * Math.min(1, e.t / 30); if (e.t >= 30) { e.ph = 2; e.t = 0; } }
        else if (e.ph === 2) { if (e.t > 70) { e.ph = 3; e.t = 0; } }
        else { e.y = e.baseY - e.h * Math.max(0, 1 - e.t / 30); if (e.t >= 30) { e.ph = 0; e.t = 0; } }
        break;
      }
      case 'bullet': e.x += e.vx; if (e.x < cam.x - 200 || e.x > cam.x + VW + 200) e.dead = true; break;
      case 'orb': {
        e.vy += 0.3; e.x += e.vx; e.y += e.vy;
        const tx = Math.floor((e.x + e.w / 2) / TS), ty = Math.floor((e.y + e.h) / TS);
        if (solid(tx, ty)) { e.dead = true; spark(e.x + e.w / 2, e.y + e.h, 8, '#d080ff', 3, 22); }
        break;
      }
      case 'boss': updBoss(e); break;
    }
    if (e.y > LH * TS + 64) e.dead = true;
  }
  function updBoss(e) {
    if (e.inv > 0) e.inv--;
    if (!G.bossOn) { moveEnt(e); return; }
    const lost = e.maxHp - e.hp;
    const sp = Math.min(4, 1.1 + e.tier * 0.25 + lost * 0.3);
    const dir = Math.sign(P.x - e.x) || -1;
    e.face = dir;
    if (e.inv < 50) e.vx += (dir * sp - e.vx) * 0.06;
    else e.vx *= 0.95;
    const jumpEvery = Math.max(70, Math.round(140 - e.tier * 15 - lost * 10));
    if (e.onGround && e.t % jumpEvery === jumpEvery - 1) e.vy = -10 - e.tier * 0.5;
    const throwEvery = Math.max(55, Math.round(130 - e.tier * 15 - lost * 10));
    if (e.t % throwEvery === 0 && e.t > 60) {
      const n = e.tier >= 4 ? 3 : e.tier >= 2 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const vx = Math.max(-5, Math.min(5, (P.x - e.x) / 60)) * (i ? 0.6 : 1);
        ents.push({ type: 'orb', enemy: true, stompable: false, x: e.x + e.w / 2 - 10, y: e.y + 10, w: 20, h: 20, vx, vy: -7 - i * 2, active: true, t: 0 });
      }
      Snd.play('cannon');
    }
    moveEnt(e, 0.45);
    if (e.hitWall) e.vx = -e.vx * 0.5;
  }

  // ================= 玩家 =================
  function hurt() {
    if (P.inv > 0 || P.starT > 0 || P.mode !== 'normal') return;
    if (G.form > 0) {
      setForm(G.form === 2 ? 1 : 0); P.inv = 120; Snd.play('hurt'); G.shake = 6;
      spark(P.x + P.w / 2, P.y + P.h / 2, 10, '#ff9ac8', 3, 25);
    } else die();
  }
  function die() {
    if (P.mode === 'dead') return;
    P.mode = 'dead'; P.vy = -9; P.vx = 0; P.t = 0; P.dashT = 0;
    Snd.play('die');
  }
  function updPlayer() {
    const p = P;
    p.t++; p.anim += Math.abs(p.vx) * 0.12 + 0.02;
    if (p.blink > 0) p.blink--; else if (Math.random() < 0.006) p.blink = 7;
    if (p.mode === 'dead') {
      p.vy += 0.45; p.y += p.vy;
      if (p.t > 150) afterDeath();
      return;
    }
    if (p.mode === 'flag') return updFlagSlide();
    if (p.mode === 'walk') {
      p.vx = 2.2; p.face = 1; const pb = p.y + p.h; p.vy = Math.min(p.vy + 0.6, 10);
      p.x += p.vx; collideX(p); p.y += p.vy; collideY(p, pb);
      const gate = ents.find(e => e.type === 'gate');
      if (gate && p.x > gate.x + 20) { p.mode = 'gone'; startTally(); }
      return;
    }
    if (p.mode === 'gone' || p.mode === 'win') return;

    if (p.inv > 0) p.inv--;
    if (p.starT > 0) { p.starT--; if (G.frame % 3 === 0) spark(p.x + Math.random() * p.w, p.y + Math.random() * p.h, 1, null, 1, 20, 2.5); }
    if (p.speedT > 0) p.speedT--;
    if (p.dashCD > 0) p.dashCD--;
    if (p.waveCD > 0) p.waveCD--;

    // 平台带动
    if (p.plat) {
      const pl = p.plat;
      if (p.x + p.w > pl.x - pl.dx && p.x < pl.x + pl.w - pl.dx) { p.x += pl.dx; p.y = pl.y - p.h; }
      else p.plat = null;
    }
    p.prevY = p.y;
    const prevBottom = p.y + p.h;

    const L_ = held.left, R_ = held.right;
    const maxSp = p.speedT > 0 ? 4.9 : 3.4;
    if (p.dashT > 0) {
      p.dashT--; p.vx = p.face * 9.5; p.vy = 0;
      if (G.frame % 2 === 0) p.trail.push({ x: p.x, y: p.y, f: p.face, life: 14 });
    } else {
      const ice = p.onGround && WORLDS[L.world].ice;
      const ax = ice ? 0.09 : p.onGround ? 0.24 : 0.15, skid = ice ? 0.04 : 0.2;
      if (L_ && !R_) { p.vx -= ax; if (p.vx > 0 && p.onGround) p.vx -= skid; p.face = -1; }
      else if (R_ && !L_) { p.vx += ax; if (p.vx < 0 && p.onGround) p.vx += skid; p.face = 1; }
      else { p.vx *= ice ? 0.975 : p.onGround ? 0.8 : 0.96; if (Math.abs(p.vx) < 0.05) p.vx = 0; }
      if (ice && Math.abs(p.vx) > 1.5 && G.frame % 5 === 0) spark(p.x + p.w / 2, p.y + p.h, 1, '#e8fbff', 1, 14, 2);
      if (Math.abs(p.vx) > maxSp) p.vx = Math.sign(p.vx) * Math.max(maxSp, Math.abs(p.vx) * 0.9);
    }
    if (p.speedT > 0 && G.frame % 3 === 0 && Math.abs(p.vx) > 2) p.trail.push({ x: p.x, y: p.y, f: p.face, life: 10 });

    // 跳跃（土狼时间 + 输入缓冲 + 可变跳高）
    if (p.onGround) { p.coyote = 7; p.combo = 0; p.airDash = true; } else p.coyote--;
    if (press.jump) p.jumpBuf = 8; else p.jumpBuf--;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -(9.4 + Math.abs(p.vx) * 0.28); p.jumpBuf = 0; p.coyote = 0; p.onGround = false; p.plat = null;
      Snd.play('jump');
    }
    if (p.dashT <= 0) {
      const lowG = G.wonderT > 0 ? 0.6 : 1;
      const g = (p.vy < 0 && held.jump) ? 0.3 : 0.62;
      p.vy = Math.min(p.vy + g * lowG, 10.5);
    }
    // 冲刺
    if (press.dash && p.dashCD <= 0 && (p.onGround || p.airDash)) {
      if (L_ && !R_) p.face = -1; else if (R_ && !L_) p.face = 1;
      p.dashT = 11; p.dashCD = 40; if (!p.onGround) p.airDash = false;
      Snd.play('dash'); spark(p.x + p.w / 2, p.y + p.h / 2, 8, '#8ff0ff', 2.5, 18, 2.5);
    }
    // 声波（星河形态）
    if (press.wave && G.form === 2 && p.waveCD <= 0 && ents.filter(e => e.type === 'wave').length < 2) {
      ents.push({ type: 'wave', x: p.x + (p.face > 0 ? p.w : -14), y: p.y + p.h * 0.35, w: 14, h: 14, vx: p.face * 6.5, vy: 1, life: 110, active: true });
      p.waveCD = 14; Snd.play('wave');
    }

    // 移动与碰撞
    p.x += p.vx;
    if (collideX(p)) { if (p.dashT > 0) p.dashT = 0; p.vx = 0; }
    if (p.x < cam.x && G.bossOn) p.x = cam.x;
    p.y += p.vy;
    const hit = collideY(p, prevBottom);
    if (hit) hitBlock(hit.tx, hit.ty);
    if (p.onGround) p.plat = null;
    if (!p.onGround && p.vy >= 0) {
      for (const pl of plats) {
        if (p.x + p.w > pl.x && p.x < pl.x + pl.w && prevBottom <= pl.y + Math.max(0, pl.dy) + 1 && p.y + p.h >= pl.y) {
          p.y = pl.y - p.h; p.vy = 0; p.onGround = true; p.plat = pl;
          if (pl.kind === 'fall' && pl.fallT < 0) pl.fallT = 0;
          break;
        }
      }
    }
    // 危险地形
    const l = Math.floor((p.x + 3) / TS), r = Math.floor((p.x + p.w - 3) / TS), tTop = Math.floor(p.y / TS), tBot = Math.floor((p.y + p.h - 1) / TS);
    for (let tx = l; tx <= r; tx++) for (let ty = tTop; ty <= tBot; ty++) {
      const t = tileAt(tx, ty);
      if (t === T.SPIKE && p.y + p.h > ty * TS + 12) { if (p.inv <= 0 && p.starT <= 0) { hurt(); p.vy = -7; } }
      if (t === T.NOISE && p.y + p.h > ty * TS + 10) die();
    }
    if (p.y > LH * TS + 20) die();
    for (const tr of p.trail) tr.life--;
    p.trail = p.trail.filter(tr => tr.life > 0);
  }

  function updFlagSlide() {
    const p = P, f = p.flag;
    if (p.flagPhase === 0) {
      p.y += 4; f.clothY = Math.min(f.bottom - 30, f.clothY + 4);
      if (p.y + p.h >= f.bottom) { p.y = f.bottom - p.h; }
      if (p.y + p.h >= f.bottom && f.clothY >= f.bottom - 30) { p.flagPhase = 1; p.t = 0; }
    } else if (++p.t > 24) {
      p.x = f.x + f.w / 2 + 18; p.mode = 'walk'; p.vy = 0;
      Snd.play('clear');
    }
  }
  function grabFlag(f) {
    const p = P; if (p.mode !== 'normal') return;
    p.mode = 'flag'; p.flag = f; p.flagPhase = 0; p.vx = 0; p.vy = 0; p.dashT = 0; p.face = 1;
    p.x = f.x + f.w / 2 - p.w - 2;
    const frac = 1 - Math.max(0, Math.min(1, (p.y + p.h - f.top) / (f.bottom - f.top)));
    const pts = frac > 0.92 ? 5000 : frac > 0.7 ? 2000 : frac > 0.45 ? 800 : frac > 0.2 ? 400 : 100;
    addScore(pts, p.x, p.y);
    if (frac > 0.92) { oneUp(p.x, p.y - 20); }
    Snd.musicStop(); Snd.play('flag');
  }

  // ================= 主循环 step =================
  function step() {
    G.frame++;
    if (G.state === 'play') G.levelT++;
    if (G.state !== 'play') { G.menuX += 0.7; for (const k in press) press[k] = false; return; }
    if (G.tally) { updTally(); for (const k in press) press[k] = false; updParts(); return; }

    // 计时
    if (P.mode === 'normal' && G.frame % 60 === 0) {
      G.timeLeft--;
      if (G.timeLeft === 100) { Snd.play('warn'); toast('⏳ 时间不多了！'); }
      if (G.timeLeft <= 0) { G.timeLeft = 0; die(); }
    }
    if (G.wonderT > 0) {
      G.wonderT--;
      if (G.frame % 10 === 0) ents.push({ type: 'fcoin', item: true, x: cam.x + 40 + Math.random() * (VW - 80), y: -20, w: 20, h: 24, vx: 0, vy: 1, life: 400 });
      if (G.wonderT === 0) { toast('奇想时间结束'); Snd.musicStart(L.world, L.boss); }
    }
    if (G.shake > 0) G.shake--;

    // 移动平台
    for (const pl of plats) {
      const ox = pl.x, oy = pl.y;
      if (pl.kind === 'h') { pl.x += pl.dir * pl.sp; if (pl.x > pl.x1) { pl.x = pl.x1; pl.dir = -1; } if (pl.x < pl.x0) { pl.x = pl.x0; pl.dir = 1; } }
      else if (pl.kind === 'v') { pl.y -= pl.dir * pl.sp; if (pl.y < pl.y1) { pl.y = pl.y1; pl.dir = -1; } if (pl.y > pl.y0) { pl.y = pl.y0; pl.dir = 1; } }
      else if (pl.fallT >= 0) { pl.fallT++; if (pl.fallT > pl.delay) { pl.vy = Math.min(pl.vy + 0.35, 9); pl.y += pl.vy; } else pl.x = pl.x0 + (pl.fallT % 4 < 2 ? 1 : -1); }
      pl.dx = pl.x - ox; pl.dy = pl.y - oy;
      if (pl.kind === 'fall' && pl.fallT > pl.delay) pl.dx = 0;
    }
    plats = plats.filter(pl => pl.y < LH * TS + 64);

    updPlayer();

    // 炮台
    for (const c of cannons) {
      const cx = c.tx * TS;
      if (cx < cam.x - 32 || cx > cam.x + VW + 32) continue;
      c.t++;
      const dd = Math.min(L.diff, 1), dx2 = Math.max(0, L.diff - 1), iv = Math.max(70, 200 - dd * 80 - dx2 * 25);
      if (c.t > iv && Math.abs(P.x - cx) > 72 && G.levelT > 150) {
        c.t = 0; const d = P.x < cx ? -1 : 1;
        ents.push({ type: 'bullet', enemy: true, stompable: true, x: cx + (d > 0 ? 32 : -28), y: c.ty * TS + 4, w: 28, h: 24, vx: d * (2.4 + dd * 1.6 + dx2 * 0.5), vy: 0, active: true, t: 0 });
        Snd.play('cannon');
      }
    }

    // 实体
    for (const e of ents) {
      if (e.dead) continue;
      if (e.enemy || e.dying) updEnemy(e);
      else if (e.type === 'wave') updWave(e);
      else if (e.item) updItem(e);
      else if (e.type === 'spring' && e.comp > 0) e.comp--;
    }
    // 怪物互相碰撞转向
    const walkers = ents.filter(e => e.active && e.enemy && !e.dying && (e.type === 'blob' || e.type === 'spiky' || (e.type === 'shell' && e.state === 'walk')));
    for (let i = 0; i < walkers.length; i++) for (let j = i + 1; j < walkers.length; j++) {
      const a = walkers[i], b = walkers[j];
      if (overlap(a, b)) { const l = a.x < b.x ? a : b, r = l === a ? b : a; l.vx = -Math.abs(l.vx); r.vx = Math.abs(r.vx); }
    }

    if (P.mode === 'normal') playerInteract();
    if (P.mode === 'normal' && L.arena && !G.bossOn && P.x > (L.arena.x0 + 2) * TS) {
      G.bossOn = true;
      for (let y = L.arena.gy - 9; y < L.arena.gy; y++) setTile(L.arena.x0 - 1, y, T.STONE);
      Snd.musicStart(L.world, true);
      const b = ents.find(e => e.type === 'boss');
      $('bossName').textContent = BOSS_NAMES[L.world];
      $('bossbar').classList.add('show');
      toast(`⚠ ${BOSS_NAMES[L.world]} 出现了！踩它的头 ${b ? b.maxHp : 3} 次！`);
    }

    ents = ents.filter(e => !e.dead);
    for (const b of bumps) b.t++;
    bumps = bumps.filter(b => b.t < 10);
    updParts();
    updCamera();
    for (const k in press) press[k] = false;
  }

  function updWave(e) {
    e.vy += 0.45; e.x += e.vx; e.life--;
    if (collideX(e)) { e.dead = true; spark(e.x, e.y + 7, 6, '#8ff0ff', 2, 15); return; }
    const pb = e.y + e.h; e.y += e.vy; collideY(e, pb);
    if (e.onGround) e.vy = -4.6;
    if (e.life <= 0 || e.y > LH * TS) e.dead = true;
    if (G.frame % 2 === 0) parts.push({ k: 'ring', x: e.x + 7, y: e.y + 7, vx: 0, vy: 0, life: 12, max: 12, col: '#8ff0ff' });
    for (const o of ents) {
      if (!o.enemy || o.dying || !o.active || !overlap(e, o)) continue;
      if (o.type === 'boss') { if (++o.waveDmg >= 4) { o.waveDmg = 0; bossHit(o); } else { spark(e.x, e.y, 5, '#fff', 2, 15); o.inv = Math.max(o.inv, 6); } }
      else if (o.type === 'orb') { o.dead = true; }
      else killEnemy(o, 'flip', 200);
      e.dead = true; break;
    }
  }
  function updItem(e) {
    if (e.emerge > 0) { e.y -= 1; e.emerge--; if (e.emerge === 0) { e.vx = ['power', 'speed', 'life', 'star'].includes(e.type) ? 1.7 : 0; if (e.type === 'star') e.vy = -6; } return; }
    if (e.type === 'coin' || e.type === 'medal') return;
    if (e.type === 'trophy') { if (e.y < (L.arena.gy - 4) * TS) e.y += 1.5; return; }
    if (e.type === 'fcoin') { e.vy = Math.min(e.vy + 0.15, 4); e.y += e.vy; if (--e.life <= 0 || e.y > LH * TS) e.dead = true; return; }
    if (e.type === 'galaxy' || e.type === 'wonder') { moveEnt(e, 0.4); return; }
    moveEnt(e, e.type === 'star' ? 0.35 : 0.45);
    if (e.hitWall) e.vx = -e.vx;
    if (e.type === 'star' && e.onGround) e.vy = -7;
    if (e.y > LH * TS + 40) e.dead = true;
  }
  function pickup(e) {
    const cx = e.x + e.w / 2, cy = e.y;
    switch (e.type) {
      case 'coin': case 'fcoin': e.dead = true; addCoin(cx, cy, e.type === 'fcoin' || e.bonus); return;
      case 'power': if (G.form === 0) setForm(1); addScore(1000, cx, cy); Snd.play('power'); toast('获得「共鸣晶核」→ 共鸣形态（可顶碎音符砖）'); break;
      case 'galaxy': if (G.form === 0) setForm(1); G.form = 2; addScore(1000, cx, cy); Snd.play('power'); toast(isTouch ? '获得「星河之花」→ 星河形态：点「波」发射声波！' : '获得「星河之花」→ 星河形态：按 Z / J 发射声波！'); break;
      case 'speed': P.speedT = 600; addScore(1000, cx, cy); Snd.play('power'); toast('获得「星光音符」→ 10 秒加速！'); break;
      case 'star': P.starT = 540; addScore(1000, cx, cy); Snd.play('power'); toast('获得「回响能量」→ 短暂无敌！'); break;
      case 'life': oneUp(cx, cy); break;
      case 'wonder': G.wonderT = 600; addScore(1000, cx, cy); Snd.play('wonder'); Snd.musicStart(1, false); toast('✨ 奇想时间！重力减弱、怪物化为音符、音符雨降临！'); flash(); break;
      case 'medal':
        if (!e.ghost) { G.medalsRun[e.id] = true; addScore(2000, cx, cy); Snd.play('medal'); spark(cx, e.y + 14, 14, '#8ff0ff', 3, 30, 3); }
        else { Snd.play('coin'); }
        break;
      case 'trophy': e.dead = true; P.mode = 'win'; Snd.play('clear'); spark(cx, e.y + 20, 30, null, 5, 50, 4); setTimeout(startTally, 900); return;
    }
    e.dead = true;
    spark(cx, e.y + e.h / 2, 10, null, 3, 25);
  }
  function playerInteract() {
    const p = P;
    for (const e of ents) {
      if (e.dead || !overlap(p, e)) continue;
      if (e.item) { if (!(e.emerge > 0)) pickup(e); continue; }
      if (e.type === 'medal') { pickup(e); continue; }
      if (e.type === 'spring') {
        if (p.vy > 0 && p.prevY + p.h <= e.y + 10) { p.y = e.y - p.h; p.vy = held.jump ? -15.5 : -12.5; e.comp = 10; p.airDash = true; Snd.play('spring'); }
        continue;
      }
      if (e.type === 'checkpoint') { if (!e.on) { e.on = true; G.cp = true; Snd.play('checkpoint'); toast('✦ 星灯已点亮：中途存档点'); spark(e.x + 8, e.y + 8, 16, '#8ff0ff', 3, 30); } continue; }
      if (e.type === 'flag') { grabFlag(e); return; }
      if (!e.enemy || e.dying || !e.active) continue;
      if (e.type === 'plant' && e.ph === 0) continue;
      if (p.starT > 0) {
        if (e.type === 'boss') bossHit(e);
        else killEnemy(e, 'flip', COMBO[Math.min(7, p.combo++)]);
        continue;
      }
      if (e.type === 'shell' && e.state === 'shell') {
        kickShell(e);
        if (p.vy > 0 && p.prevY + p.h <= e.y + 10) p.vy = -7;
        continue;
      }
      const fromAbove = p.vy > 0 && p.prevY + p.h <= e.y + 10 + Math.max(0, e.vy || 0);
      if (fromAbove && e.stompable) { stomp(e); continue; }
      if (e.kickGrace > 0) continue;
      if (e.type === 'boss' && e.inv > 0) continue;
      if (p.dashT > 0 && e.type !== 'boss' && e.type !== 'spiky' && e.type !== 'plant' && e.type !== 'orb') {
        // 冲刺撞击
        killEnemy(e, 'flip', 200); continue;
      }
      hurt();
    }
  }

  function updParts() {
    for (const q of parts) {
      q.life--; q.x += q.vx; q.y += q.vy;
      if (q.k === 'star' || q.k === 'chunk') q.vy += q.k === 'chunk' ? 0.4 : 0.08;
      if (q.k === 'coin') q.vy += 0.5;
    }
    parts = parts.filter(q => q.life > 0);
    if (parts.length > 500) parts.splice(0, parts.length - 500);
  }
  function updCamera() {
    let target;
    if (G.bossOn) target = L.arena.x0 * TS - (VW - (L.arena.x1 - L.arena.x0 + 1) * TS) / 2;
    else target = P.x + P.w / 2 - VW * 0.42 + P.face * 30;
    target = Math.max(0, Math.min(target, L.W * TS - VW));
    if (P.mode !== 'dead') cam.x += (target - cam.x) * (G.bossOn ? 0.06 : 0.14);
  }

  // ================= 通关 / 死亡 =================
  function startTally() {
    if (G.tally) return;
    G.tally = { t: 0, phase: 0 };
    $('bossbar').classList.remove('show');
  }
  function updTally() {
    const tl = G.tally; tl.t++;
    if (G.frame % 4 === 0) spark(cam.x + 100 + Math.random() * (VW - 200), 80 + Math.random() * 200, 10, null, 4, 40, 3);
    if (tl.phase === 0) {
      if (G.timeLeft > 0) { const d = Math.min(G.timeLeft, 3); G.timeLeft -= d; G.score += d * 50; if (G.frame % 3 === 0) Snd.tone(1400, 0.03, 'square', 0.05); }
      else if (tl.t > 40) { tl.phase = 1; showClear(); }
    }
  }
  function afterDeath() {
    G.lives--;
    setForm(0); G.form = 0;
    $('bossbar').classList.remove('show');
    if (G.lives <= 0) { gameOver(); return; }
    showIntro(true);
  }

  // ================= 渲染 =================
  function render() {
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    if (!L || G.state === 'title' || G.state === 'skins' || G.state === 'select') {
      drawBackground(ctx, Math.floor(G.menuX / 2400) % WORLDS.length, G.menuX, G.frame);
      return;
    }
    const sx = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0, sy = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
    drawBackground(ctx, L.world, cam.x, G.frame);
    if (G.wonderT > 0) { ctx.fillStyle = `hsla(${G.frame * 2 % 360},90%,70%,0.12)`; ctx.fillRect(0, 0, VW, VH); }
    const cx = Math.round((cam.x + sx) * RS) / RS, cy = cam.y + sy;
    ctx.setTransform(RS, 0, 0, RS, -cx * RS, -cy * RS);
    const f = G.frame;
    // 管道植物（在管道后）
    for (const e of ents) if (e.behind && e.active && !e.dead) drawEnemy(ctx, e, f);
    // 图块
    const A = getAtlas(L.world);
    const x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(L.W - 1, Math.floor((cx + VW) / TS) + 1);
    const bumpMap = {}; for (const b of bumps) bumpMap[b.ty * L.W + b.tx] = Math.sin(b.t / 10 * Math.PI) * 8;
    for (let ty = 0; ty < LH; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = L.tiles[ty * L.W + tx];
      if (!t) continue;
      const k = ty * L.W + tx, oy = bumpMap[k] || 0;
      if (t === T.NOISE) {
        const wv = Math.sin(f * 0.1 + tx) * 3;
        ctx.fillStyle = '#5a1a6a'; ctx.fillRect(tx * TS, ty * TS + 8 + wv, TS, TS - 8 - wv);
        ctx.fillStyle = `rgba(255,90,200,${0.5 + Math.sin(f * 0.2 + tx) * 0.3})`; ctx.fillRect(tx * TS, ty * TS + 6 + wv, TS, 3);
        continue;
      }
      if (A[t]) ctx.drawImage(A[t], tx * TS, ty * TS - oy, TS, TS);
      if (t === T.QBLOCK) { ctx.globalAlpha = 0.25 + Math.sin(f * 0.1 + tx) * 0.2; ctx.fillStyle = '#ffffff'; rrect(ctx, tx * TS + 2, ty * TS + 2 - oy, 28, 28, 5); ctx.fill(); ctx.globalAlpha = 1; }
    }
    // 平台
    for (const pl of plats) {
      const gr = ctx.createLinearGradient(0, pl.y, 0, pl.y + pl.h);
      if (pl.kind === 'fall') { gr.addColorStop(0, '#ffd0a0'); gr.addColorStop(1, '#c0607a'); }
      else { gr.addColorStop(0, '#c8f8ff'); gr.addColorStop(1, '#6a7ad8'); }
      ctx.fillStyle = gr; rrect(ctx, pl.x, pl.y, pl.w, pl.h, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = pl.kind === 'fall' ? '#fff3c0' : '#ff9ac8';
      for (let i = 16; i < pl.w; i += 32) { star4(ctx, pl.x + i, pl.y + 7, 3.5); ctx.fill(); }
      if (pl.kind === 'fall' && pl.fallT >= 0) { ctx.strokeStyle = 'rgba(80,20,40,0.6)'; ctx.beginPath(); ctx.moveTo(pl.x + pl.w / 2, pl.y); ctx.lineTo(pl.x + pl.w / 2 - 4, pl.y + pl.h); ctx.stroke(); }
    }
    const vis = e => e.x + (e.w || 0) > cx - 40 && e.x < cx + VW + 40;
    for (const e of ents) if (e.obj && vis(e)) drawObject(ctx, e, f);
    for (const e of ents) if ((e.item || e.type === 'medal') && vis(e)) drawItem(ctx, e, f);
    for (const e of ents) if ((e.enemy || e.dying) && !e.behind && vis(e) && (e.active || e.dying)) drawEnemy(ctx, e, f);
    for (const e of ents) if (e.type === 'wave') {
      ctx.strokeStyle = '#8ff0ff'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = 1 - i * 0.3; ctx.beginPath(); ctx.arc(e.x + 7 - Math.sign(e.vx) * i * 5, e.y + 7, 5 + i * 2, -1, 1); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; star4(ctx, e.x + 7, e.y + 7, 5); ctx.fill();
    }
    drawPlayer();
    // 粒子
    for (const q of parts) {
      const a = Math.max(0, q.life / q.max);
      ctx.globalAlpha = a;
      if (q.k === 'star') { ctx.fillStyle = q.col; star4(ctx, q.x, q.y, q.size); ctx.fill(); }
      else if (q.k === 'chunk') { ctx.fillStyle = q.col; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.life * 0.3); ctx.fillRect(-5, -5, 10, 10); ctx.restore(); }
      else if (q.k === 'coin') drawNote(ctx, q.x, q.y, 24, q.life * 0.4);
      else if (q.k === 'ring') { ctx.strokeStyle = q.col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, (1 - a) * 12 + 2, 0, TAU); ctx.stroke(); }
      else if (q.k === 'text') {
        ctx.font = 'bold 14px "ZCOOL KuaiLe", "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(80,20,60,0.85)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y);
      }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    if (WORLDS[L.world].cave) { const vg = ctx.createRadialGradient(VW / 2, VH / 2, 200, VW / 2, VH / 2, 620); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,0,20,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH); }
    updHud();
  }
  function drawPlayer() {
    const p = P; if (!p || p.mode === 'gone') return;
    const sk = SKINS[save.skin] || SKINS[0];
    const s = G.form > 0 ? 1.22 : 0.8;
    const pose = p.mode === 'dead' ? 'dead' : p.mode === 'flag' ? 'jump' : !p.onGround ? 'jump' : Math.abs(p.vx) > 0.3 ? 'run' : 'stand';
    const o = { pose, t: p.anim, skin: sk, form: G.form, blink: p.blink > 0, portrait: save.portrait };
    for (const tr of p.trail) {
      ctx.globalAlpha = tr.life / 20;
      ctx.save(); if (ctx.filter !== undefined) ctx.filter = 'hue-rotate(160deg) brightness(1.3)';
      drawAemeath(ctx, tr.x + p.w / 2, tr.y + p.h, s, tr.f, o);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (p.inv > 0 && Math.floor(p.inv / 4) % 2 === 0) return;
    ctx.save();
    if (p.starT > 0 && ctx.filter !== undefined) ctx.filter = `hue-rotate(${(G.frame * 12) % 360}deg) saturate(1.6)`;
    if (p.starT > 0 || G.form === 2) {
      ctx.fillStyle = p.starT > 0 ? 'rgba(255,240,150,0.25)' : 'rgba(140,240,255,0.16)';
      ell(ctx, p.x + p.w / 2, p.y + p.h / 2, p.w, p.h * 0.7); ctx.fill();
    }
    let py = p.y + p.h;
    if (p.dashT > 0) { ctx.translate(p.x + p.w / 2, py); ctx.rotate(p.face * 0.15); ctx.translate(-(p.x + p.w / 2), -py); }
    drawAemeath(ctx, p.x + p.w / 2, py, s, p.face, o);
    ctx.restore();
  }

  // ================= HUD =================
  const hudCache = {};
  function hudSet(id, val, prop = 'textContent') {
    if (hudCache[id] === val) return; hudCache[id] = val;
    if (prop === 'styleWidth') $(id).style.width = val; else $(id)[prop] = val;
  }
  function updHud() {
    if (!L) return;
    const hearts = G.lives <= 6 ? '❤'.repeat(Math.max(0, G.lives)) : '❤ ×' + G.lives;
    hudSet('hudLives', hearts);
    hudSet('hudForm', FORM_NAMES[G.form]);
    hudSet('hudCoins', String(G.coins).padStart(2, '0'));
    hudSet('hudGot', `${G.coinsGot}/${L.coinTotal}`);
    hudSet('hudMedals', G.medalsRun.map(m => m ? '★' : '☆').join(''));
    hudSet('hudLevel', L.name);
    hudSet('hudScore', String(G.score).padStart(7, '0'));
    hudSet('hudTime', String(Math.max(0, G.timeLeft)));
    const prog = Math.max(0, Math.min(1, (P.x - L.start.tx * TS) / ((L.goalX - L.start.tx) * TS)));
    const pv = (prog * 100).toFixed(1) + '%';
    if (hudCache.prog !== pv) { hudCache.prog = pv; $('hudProg').style.width = pv; $('hudProgDot').style.left = pv; }
    const buffs = [];
    if (P.speedT > 0) buffs.push(`<span class="buff spd">⚡ 加速 ${Math.ceil(P.speedT / 60)}s</span>`);
    if (P.starT > 0) buffs.push(`<span class="buff inv">✦ 无敌 ${Math.ceil(P.starT / 60)}s</span>`);
    if (G.wonderT > 0) buffs.push(`<span class="buff won">✿ 奇想 ${Math.ceil(G.wonderT / 60)}s</span>`);
    hudSet('hudBuffs', buffs.join(''), 'innerHTML');
    $('hudTime').parentElement.classList.toggle('hurry', G.timeLeft <= 100);
    const b = G.bossOn && ents.find(e => e.type === 'boss');
    if (b) hudSet('bossFill', (Math.max(0, b.hp) / b.maxHp * 100) + '%', 'styleWidth');
    $('tcWave').classList.toggle('hide', G.form !== 2);
  }

  // ================= 界面流程 =================
  const screens = ['title', 'skins', 'select', 'intro', 'pause', 'clear', 'over', 'win', 'help'];
  function show(id) { for (const s of screens) $(s).classList.toggle('show', s === id); $('hud').classList.toggle('show', ['play', 'pause', 'intro'].includes(G.state) && !!L); }
  function setState(s, scr) { G.state = s; show(scr === undefined ? s : scr); $('touch').classList.toggle('show', s === 'play'); }
  let toastTimer = null; const toastQ = [];
  function toast(msg) {
    toastQ.push(msg);
    if (!toastTimer) nextToast();
  }
  function nextToast() {
    const el = $('toast');
    if (!toastQ.length) { el.classList.remove('show'); toastTimer = null; return; }
    el.textContent = toastQ.shift(); el.classList.add('show');
    toastTimer = setTimeout(() => { el.classList.remove('show'); toastTimer = setTimeout(nextToast, 250); }, 2600);
  }
  function clearToasts() { toastQ.length = 0; clearTimeout(toastTimer); toastTimer = null; $('toast').classList.remove('show'); }
  function flash() { const el = $('flash'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }

  // 标题
  $('btnStart').onclick = () => { Snd.init(); Snd.play('select'); buildSkins(); setState('skins'); };
  $('btnHelp').onclick = () => { Snd.init(); Snd.play('select'); setState('help'); };
  $('btnHelpBack').onclick = () => { Snd.play('select'); setState('title'); };
  $('btnTitleSelect').onclick = () => { Snd.init(); Snd.play('select'); buildSelect(); setState('select'); };
  // 皮肤
  function buildSkins() {
    const box = $('skinList'); box.innerHTML = '';
    SKINS.forEach((sk, i) => {
      const d = document.createElement('button');
      d.className = 'skin' + (i === save.skin ? ' sel' : '');
      d.innerHTML = `<div class="sk-img"><img src="${sk.img}" alt=""></div><canvas width="120" height="96"></canvas><b>${sk.name}</b><small>${sk.desc}</small>`;
      d.onclick = () => { save.skin = i; persist(); Snd.play('select'); document.querySelectorAll('.skin').forEach((n, j) => n.classList.toggle('sel', j === i)); };
      box.appendChild(d);
    });
    $('portraitToggle').checked = !!save.portrait;
  }
  $('portraitToggle').onchange = e => { save.portrait = e.target.checked; persist(); };
  function animSkins() {
    if (G.state !== 'skins') return;
    document.querySelectorAll('.skin canvas').forEach((c, i) => {
      const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 120, 96);
      const run = i === save.skin;
      drawAemeath(g, 60, 88, 1.75, 1, { pose: run ? 'run' : 'stand', t: G.frame * (run ? 0.25 : 0.1), skin: SKINS[i], form: 0, blink: (G.frame + i * 40) % 220 < 7, portrait: save.portrait });
    });
  }
  $('btnSkinOk').onclick = () => { Snd.play('select'); buildSelect(); setState('select'); };
  $('btnSkinBack').onclick = () => { Snd.play('select'); setState('title'); };
  // 选关
  let selWorld = 0;
  function buildSelect() {
    // 全部关卡开放：默认停在第一个还没通关的世界
    let first = 0; while (first < LEVEL_COUNT && save.best[first]) first++;
    selWorld = Math.min(WORLDS.length - 1, Math.floor(first / 10));
    renderSelect();
  }
  function renderSelect() {
    const ch = Math.floor(selWorld / 10);
    const chTabs = $('chapterTabs'); chTabs.innerHTML = '';
    CHAPTERS.forEach((n, c) => {
      let done = 0; for (let i = c * 100; i < c * 100 + 100; i++) if (save.best[i]) done++;
      const b = document.createElement('button'); b.className = 'ctab c' + c + (c === ch ? ' sel' : '');
      b.innerHTML = `${n}<small>${c * 100 + 1}–${c * 100 + 100} 关 · 已通关 ${done}/100</small>`;
      b.onclick = () => { selWorld = c * 10; Snd.play('select'); renderSelect(); };
      chTabs.appendChild(b);
    });
    const tabs = $('worldTabs'); tabs.innerHTML = '';
    for (let w = ch * 10; w < ch * 10 + 10; w++) {
      const b = document.createElement('button'); b.className = 'wtab' + (w === selWorld ? ' sel' : '');
      b.innerHTML = `<i>${w + 1}</i>${WORLD_NAMES[w]}`; b.onclick = () => { selWorld = w; Snd.play('select'); renderSelect(); };
      tabs.appendChild(b);
    }
    const grid = $('levelGrid'); grid.innerHTML = '';
    for (let i = selWorld * 10; i < selWorld * 10 + 10; i++) {
      const b = document.createElement('button');
      const md = save.medals[i] || [0, 0, 0];
      b.className = 'lv' + (i % 10 === 9 ? ' boss' : '') + (save.best[i] ? ' done' : '');
      b.innerHTML = `<span class="no">第 ${i + 1} 关</span><span class="n">${Math.floor(i / 10) + 1}-${i % 10 + 1}</span>${i % 10 === 9 ? '<span class="tag">首领</span>' : ''}<span class="md">${md.map(m => m ? '★' : '☆').join('')}</span>`;
      b.onclick = () => { Snd.play('select'); newRun(i); };
      grid.appendChild(b);
    }
    let total = 0; for (const k in save.medals) total += save.medals[k].filter(Boolean).length;
    let cleared = 0; for (let i = 0; i < LEVEL_COUNT; i++) if (save.best[i]) cleared++;
    $('selStats').textContent = `全部 ${LEVEL_COUNT} 关已开放 · 已通关 ${cleared}/${LEVEL_COUNT} · 星声徽章 ${total}/${LEVEL_COUNT * 3}`;
  }
  $('btnSelBack').onclick = () => { Snd.play('select'); setState('title'); };
  $('btnSelSkin').onclick = () => { Snd.play('select'); buildSkins(); setState('skins'); };

  function newRun(idx) {
    G.lives = MAX_LIVES_START; G.score = 0; G.coins = 0; G.form = 0;
    startLevel(idx);
  }
  function startLevel(idx) {
    G.idx = idx; G.cp = false; G.medalsRun = [false, false, false]; G.coinsGot = 0;
    showIntro(false);
  }
  function showIntro(retry) {
    Snd.musicStop(); clearToasts();
    loadLevel(G.idx, retry);
    if (!retry) G.coinsGot = 0;
    const sk = SKINS[save.skin];
    $('introImg').src = sk.img; $('hudPortrait').src = sk.img;
    $('introWorld').textContent = `WORLD ${L.world + 1} · ${WORLD_NAMES[L.world]}`;
    $('introName').textContent = `${L.world + 1}-${L.stage + 1}${L.boss ? '  首领战' : ''}`;
    $('introLives').textContent = '× ' + G.lives;
    $('introSub').textContent = L.boss ? `守关首领：${BOSS_NAMES[L.world]}` : (retry && G.cp ? '从星灯存档点继续' : WORLDS[L.world].sub);
    setState('intro');
    setTimeout(() => {
      if (G.state !== 'intro') return;
      setState('play');
      Snd.musicStart(L.world, false);
      if (!retry) {
        if (L.idx === 0) toast(isTouch ? '点右下角 ◀ ▶ 移动，「跳」跳跃，「冲」冲刺' : '← → 移动 · 空格/↑ 跳跃（长按跳更高）· Shift/X 冲刺');
        if (L.idx === 0) toast('顶一顶 ♪ 方块，踩扁星噪团子！收集 3 枚星声徽章');
        if (L.idx === 2) toast('有一个 ♪ 方块里藏着「奇想星花」，找找看！');
        if (L.idx === 100) toast('第二章 · 暮光篇开启！怪物更快、坑更宽、道具更少');
        if (L.idx === 200) toast('第三章 · 终焉篇开启！每一步都是考验');
        if (L.stage === 0 && L.world > 0) {
          const wf = WORLDS[L.world];
          if (wf.ice) toast('新世界：冰面会打滑，提前松开方向键减速！');
          else if (wf.noise) toast('新世界：坑底是噪音浪潮，掉下去会直接失败！');
          else if (wf.cave) toast('新世界：头顶是星晶穹顶，视野变暗了');
          else if (wf.rail) toast('新世界：星轨平台和碎星平台变多了！');
          else if (wf.cloudy) toast('新世界：云朵平台与移动平台变多了！');
        }
        for (const t of L.tips) toast('新发现：' + t);
      }
    }, 1700);
  }
  function pauseGame() {
    if (G.state !== 'play') return;
    G.state = 'pause'; show('pause'); $('touch').classList.remove('show'); Snd.play('pause');
    if (Snd.ac) Snd.ac.suspend && Snd.ac.suspend();
    $('pauseInfo').textContent = `${L.name} · 音符 ${G.coinsGot}/${L.coinTotal} · 徽章 ${G.medalsRun.filter(Boolean).length}/3`;
  }
  function resumeGame() {
    if (G.state !== 'pause') return;
    if (Snd.ac && Snd.ac.resume) Snd.ac.resume();
    for (const k in held) held[k] = false;
    setState('play');
  }
  $('btnPause').onclick = () => { Snd.init(); pauseGame(); };
  $('btnResume').onclick = resumeGame;
  $('btnRestart').onclick = () => { if (Snd.ac && Snd.ac.resume) Snd.ac.resume(); G.form = 0; G.cp = false; startLevel(G.idx); };
  $('btnQuit').onclick = () => { if (Snd.ac && Snd.ac.resume) Snd.ac.resume(); Snd.musicStop(); clearToasts(); L = null; buildSelect(); setState('select'); };
  function toggleMute() { save.muted = !save.muted; persist(); Snd.setMuted(save.muted); syncMute(); }
  function syncMute() { const t = save.muted ? '🔇' : '🔊'; $('btnMute').textContent = t; $('btnMute2').textContent = t + (save.muted ? ' 声音：关' : ' 声音：开'); }
  $('btnMute').onclick = () => { Snd.init(); toggleMute(); };
  $('btnMute2').onclick = () => { Snd.init(); toggleMute(); };
  syncMute();

  function showClear() {
    const idx = G.idx;
    const prevMd = save.medals[idx] || [false, false, false];
    save.medals[idx] = prevMd.map((m, i) => !!(m || G.medalsRun[i]));
    save.best[idx] = Math.max(save.best[idx] || 0, G.score);
    persist();
    Snd.musicStop();
    if (idx === LEVEL_COUNT - 1) { showWin(); return; }
    G.state = 'clear'; show('clear'); $('touch').classList.remove('show');
    $('clearTitle').textContent = idx % 100 === 99 ? `${CHAPTERS[L.chapter]} 完结！` : L.boss ? `击败 ${BOSS_NAMES[L.world]}！` : `${L.world + 1}-${L.stage + 1} 通关！`;
    $('clearImg').src = SKINS[save.skin].img;
    $('clearStats').innerHTML =
      `<div><span>闪光音符</span><b>${G.coinsGot} / ${L.coinTotal}</b></div>` +
      `<div><span>星声徽章</span><b class="md">${save.medals[idx].map((m, i) => G.medalsRun[i] ? '★' : m ? '<i>★</i>' : '☆').join('')}</b></div>` +
      `<div><span>剩余生命</span><b>❤ × ${G.lives}</b></div>` +
      `<div><span>当前分数</span><b>${G.score}</b></div>`;
    const lines = ['爱弥斯的歌声让遗迹重新闪耀！', '星光在指尖跳跃~', '下一段旋律在等你！', '噪音退散，星空回响！'];
    $('clearLine').textContent = idx % 100 === 99 ? `击败了 ${BOSS_NAMES[L.world]}，${CHAPTERS[L.chapter + 1]} 在等你！` : lines[(idx * 7) % lines.length];
  }
  $('btnNext').onclick = () => { Snd.play('select'); if (G.idx + 1 < LEVEL_COUNT) startLevel(G.idx + 1); };
  $('btnReplay').onclick = () => { Snd.play('select'); startLevel(G.idx); };
  $('btnClearSel').onclick = () => { Snd.play('select'); L = null; buildSelect(); setState('select'); };

  function gameOver() {
    Snd.play('gameover');
    G.state = 'over'; show('over'); $('touch').classList.remove('show');
    const w0 = Math.floor(G.idx / 10) * 10;
    $('overInfo').textContent = `止步于 ${Math.floor(G.idx / 10) + 1}-${G.idx % 10 + 1} · 最终得分 ${G.score}`;
    $('btnOverRetry').textContent = `从 ${Math.floor(w0 / 10) + 1}-1 重新出发`;
    $('btnOverRetry').onclick = () => { Snd.play('select'); newRun(w0); };
  }
  $('btnOverLevel').onclick = () => { Snd.play('select'); newRun(G.idx); };
  $('btnOverSel').onclick = () => { Snd.play('select'); L = null; buildSelect(); setState('select'); };

  function showWin() {
    G.state = 'win'; show('win'); $('touch').classList.remove('show');
    let total = 0; for (const k in save.medals) total += save.medals[k].filter(Boolean).length;
    $('winStats').textContent = `最终得分 ${G.score} · 星声徽章 ${total}/${LEVEL_COUNT * 3}`;
    $('winImgs').innerHTML = SKINS.map(s => `<img src="${s.img}" alt="">`).join('');
    Snd.play('clear');
  }
  $('btnWinBack').onclick = () => { Snd.play('select'); L = null; setState('title'); };

  // 标题页皮肤拼贴
  $('titleSkins').innerHTML = SKINS.map((s, i) => `<img src="${s.img}" style="--i:${i}" alt="">`).join('');

  // ================= 启动 =================
  let last = performance.now(), acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.1) dt = 0.1;
    if (G.state === 'pause') { render(); return; }
    acc += dt;
    while (acc >= 1 / 60) { step(); acc -= 1 / 60; }
    render();
    if (G.state === 'skins') animSkins();
  }
  setState('title');
  requestAnimationFrame(loop);
  window.__G = { G, get L() { return L; }, get P() { return P; }, get ents() { return ents; }, loadLevel, newRun };
})();
