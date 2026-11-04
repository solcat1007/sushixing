/* ============================================================
 * 溯世行 v3 — 游戏引擎模块
 * ------------------------------------------------------------
 * 游戏状态 | 输入系统 | 物理引擎 | 技能系统 | 碰撞检测 | 主循环
 * 玩法逻辑完整保留，整合新美术渲染
 * ========================================================== */

// ─── 游戏状态 ───
const ST = { TITLE: 'title', PLAYING: 'playing', TRANSITION: 'transition', GAMEOVER: 'gameover' };
let gs = ST.TITLE;
let sp = BS, dst = 0, sc = 0, fc = 0;

// ─── 改命追踪 ───
let rw = 0, dh = 0, sh = 0, wn = 0, tm = 0;
let totalAlters = 0;
let ripple = 0;
let parUnstable = false;
let fateLock = 0;
let slowPenalty = 0;

// ─── 玩家 ───
let pl = {
  x: PX, y: GY, vy: 0, w: 36, h: 60, jumping: false, sliding: false, canDJ: true,
  slideT: 0, inv: false, invT: 0, trails: [], rf: 0, rt: 0, bs: 0, alive: true,
  skCd: { rewind: 0, danxin: 0, move: 0, rewrite: 0, unseal: 0 },
  spiritActive: false, spiritT: 0, spirits: [],
  extraObs: 0, painTimer: 0
};

let obs = [], obsT = 0, obsIv = 85;
let pts = [], wptsA = [], bges = [], ghosts = [];
let colShards = 0, goldPlates = 0;
let curLevel = 0, levelDist = 0, narrIdx = 0, narrShowing = false, narrT = 0;
let transPhase = 0, transTimer = 0;

// ─── 输入系统 ───
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = keys[e.code] = true;
  if ([' ', 'ArrowUp', 'ArrowDown', 'KeyE', 'KeyQ', 'KeyR', 'KeyT', 'KeyY', 'Shift'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key] = keys[e.code] = false; });

// ─── 工具函数 ───
function rc(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function spP(x, y, n, col, s) {
  for (let i = 0; i < n; i++) {
    pts.push({ x, y, vx: (Math.random() - .5) * s * 2, vy: -Math.random() * s * 3, life: 20 + Math.random() * 20, ml: 40, col, sz: 1 + Math.random() * 3 });
  }
}

function showHint(t) {
  const e = document.getElementById('sh');
  e.textContent = t;
  e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 2200);
}

function showNarr(name, text) {
  const nt = document.getElementById('nt'), ntn = document.getElementById('ntn'), ntt = document.getElementById('ntt');
  ntn.textContent = name;
  ntt.textContent = text;
  nt.classList.add('show');
  narrShowing = true;
  narrT = 180;
}

// ─── 障碍物 ───
class Obstacle {
  constructor(x, y, type, dyI) {
    this.x = x; this.y = y; this.type = type; this.dyI = dyI;
    this.passed = false; this.a = 1; this.pt = Math.random() * Math.PI * 2;
    switch (type) {
      case 'rock': this.w = 40 + Math.random() * 30; this.h = 40 + Math.random() * 30; break;
      case 'spear': this.w = 12; this.h = 60 + Math.random() * 40; break;
      case 'fire': this.w = 36; this.h = 50 + Math.random() * 20; break;
      case 'wall': this.w = 20; this.h = 80 + Math.random() * 60; break;
      case 'gold_plate': this.w = 24; this.h = 32; break;
      case 'memory_shard': this.w = 16; this.h = 20; break;
    }
  }
  up(s) { this.x -= s; this.pt += 0.05; }
  off() { return this.x < -80; }
  getHitbox() {
    if (this.type === 'gold_plate' || this.type === 'memory_shard') return { x: this.x - 14, y: this.y - 18, w: 28, h: 36 };
    return { x: this.x - this.w * .5, y: this.y - this.h, w: this.w, h: this.h };
  }
  isCol() { return this.type === 'gold_plate' || this.type === 'memory_shard'; }
}

// ─── 生成障碍物 ───
function spawnObs() {
  const lv = LEVELS[curLevel], pool = lv.obi;
  const type = pool[Math.floor(Math.random() * pool.length)];
  const isCol = (type === 'gold_plate' || type === 'memory_shard');
  if (!isCol && Math.random() < .12 && type !== 'gold_plate') {
    obs.push(new Obstacle(W + 50, GY - 70 - Math.random() * 80, 'memory_shard', lv.dyn));
  }
  const y = isCol ? GY - 60 - Math.random() * 80 : GY;
  obs.push(new Obstacle(W + 50, y, type, lv.dyn));
  // 山河移步代价
  if (pl.extraObs > 0 && Math.random() < .4) {
    pl.extraObs--;
    const t2 = pool.filter(t => t !== 'gold_plate' && t !== 'memory_shard')[0] || 'rock';
    obs.push(new Obstacle(W + 110, GY, t2, lv.dyn));
  }
  // 组合障碍
  if (!isCol && Math.random() < .3) {
    const filtered = pool.filter(t => t !== 'gold_plate' && t !== 'memory_shard');
    const t2 = filtered[Math.floor(Math.random() * Math.max(1, filtered.length))];
    if (t2) obs.push(new Obstacle(W + 50 + 60 + Math.random() * 40, GY, t2, lv.dyn));
  }
}

// ─── 五大技能 ───
function useRewind() {
  if (pl.skCd.rewind > 0) return;
  rw++; totalAlters++; pl.skCd.rewind = 300;
  pl.inv = true; pl.invT = 70;
  for (const o of obs) spP(o.x, o.y, 8, '#d0c0ff', 3);
  obs = []; obsT = 0;
  spP(PX, pl.y, 25, '#ffffff', 8);
  ripple = Math.min(1, totalAlters * .08);
  spawnGhost();
  showHint('寸光回溯 — 你失去了一段记忆');
  updateSkillBar();
}

function useDanxin() {
  if (pl.skCd.danxin > 0 || dh >= 3) return;
  dh++; totalAlters++; pl.skCd.danxin = 600;
  pl.spiritActive = true; pl.spiritT = 280;
  pl.spirits = [];
  for (let i = 0; i < 5; i++) {
    pl.spirits.push({ x: PX + (i - 2) * 25, y: pl.y - 30 - i * 5, alpha: .8, phase: i * 1.2 });
  }
  ripple = Math.min(1, totalAlters * .08);
  spawnGhost();
  showHint('丹心护体 — 历代英灵为你而战，但他们将永远消失');
  updateSkillBar();
}

function useMove() {
  if (pl.skCd.move > 0) return;
  sh++; totalAlters++; pl.skCd.move = 450;
  for (const o of obs) spP(o.x, o.y, 6, '#80ff80', 3);
  obs = []; obsT = 0;
  pl.extraObs += 3 + sh;
  ripple = Math.min(1, totalAlters * .08);
  spawnGhost();
  showHint('山河移步 — 此路已开，但别处将有更多险阻');
  updateSkillBar();
}

function useRewrite() {
  if (pl.skCd.rewrite > 0) return;
  wn++; totalAlters++; pl.skCd.rewrite = 500;
  slowPenalty += 0.5;
  pl.inv = true; pl.invT = 100;
  pl.painTimer = 120;
  spP(PX, pl.y, 20, '#ff4444', 6);
  ripple = Math.min(1, totalAlters * .08);
  spawnGhost();
  showHint('妄念改写 — 你改写了一个人的命运，代他承受痛苦');
  updateSkillBar();
}

function useUnseal() {
  if (pl.skCd.unseal > 0) return;
  tm++; totalAlters++; pl.skCd.unseal = 800;
  for (const o of obs) spP(o.x, o.y, 10, '#ff8800', 5);
  obs = []; obsT = 0;
  pl.inv = true; pl.invT = 150;
  fateLock = 2;
  spP(PX, pl.y, 40, '#ffffff', 10);
  ripple = Math.min(1, totalAlters * .08);
  spawnGhost();
  showHint('天命解封 — 历史规则暂时失效。但代价将在下一关显现');
  updateSkillBar();
}

function spawnGhost() {
  ghosts.push({
    x: PX + 80 + Math.random() * 400, y: pl.y,
    alpha: .5, life: 300, vy: 0, jumping: false,
    dir: Math.random() > .5 ? 1 : -1, phase: Math.random() * Math.PI * 2
  });
  if (ghosts.length > 8) ghosts.shift();
}

// ─── 碰撞处理 ───
function handleCollision(o) {
  if (o.isCol()) {
    if (o.type === 'memory_shard') { colShards++; spP(o.x, o.y, 10, '#c8e0ff', 4); }
    else if (o.type === 'gold_plate') { goldPlates++; pl.bs = Math.min(1, goldPlates / 12); spP(o.x, o.y, 20, '#ffd700', 6); }
    return true;
  }
  if (pl.inv) return false;
  if (pl.spiritActive && pl.spirits.length > 0) {
    pl.spirits.pop();
    spP(o.x, o.y, 12, '#f0d080', 5);
    return true;
  }
  if (fateLock > 0) { pl.bs += .3; }
  else { pl.bs = Math.min(1, pl.bs + .15); }
  if (pl.bs >= 1) { triggerGameOver(); return false; }
  pl.inv = true; pl.invT = 40;
  pl.vy = -8; pl.y = Math.min(pl.y, GY - 40);
  spP(pl.x, pl.y + 30, 15, '#cc2200', 5);
  return false;
}

// ─── 游戏主循环 ───
function loop() {
  if (gs === ST.TITLE) { drawTitleBG(); requestAnimationFrame(loop); return; }
  if (gs === ST.TRANSITION) { updateTransition(); requestAnimationFrame(loop); return; }

  fc++;
  const lv = LEVELS[curLevel], dv = DYNASTY_VIS[lv.dyn];

  // 速度计算
  let effSp = BS + dst * .0002;
  effSp -= slowPenalty;
  if (lv.weather === 'rain') effSp *= 1.08;
  if (lv.weather === 'snow') effSp *= .92;
  if (fateLock > 0) effSp *= .7;
  effSp = Math.min(MS, Math.max(BS * .4, effSp));
  sp = effSp;

  dst += sp * .1;
  sc = Math.floor(dst);
  levelDist += sp * .1;

  // 天命惩罚倒计时
  const lastAt = lv.narrative[lv.narrative.length - 1].at;
  if (fateLock > 0 && levelDist > lastAt * DIST_SCALE + 500) fateLock = 0;

  // 关卡切换检查
  if (curLevel < LEVELS.length - 1) {
    const lvNarr = lv.narrative;
    const lAt = lvNarr.length > 0 ? lvNarr[lvNarr.length - 1].at : 3000;
    if (levelDist > lAt * DIST_SCALE + 500 && narrIdx >= lvNarr.length) {
      startTransition(); return;
    }
  }

  // 最后一关通关检测
  if (curLevel === LEVELS.length - 1 && narrIdx >= lv.narrative.length) {
    const lAt = lv.narrative.length > 0 ? lv.narrative[lv.narrative.length - 1].at : 3000;
    if (levelDist > lAt * DIST_SCALE + 800) { triggerVictory(); return; }
  }

  // 叙事事件
  if (narrIdx < lv.narrative.length) {
    const ev = lv.narrative[narrIdx];
    if (levelDist > ev.at * DIST_SCALE && !narrShowing) {
      showNarr(ev.n, ev.t);
      narrIdx++;
    }
  }
  if (narrShowing) {
    narrT--;
    if (narrT <= 0) { document.getElementById('nt').classList.remove('show'); narrShowing = false; }
  }

  // 更新玩家
  updatePlayer();
  for (const k in pl.skCd) if (pl.skCd[k] > 0) pl.skCd[k]--;
  if (pl.spiritActive) { pl.spiritT--; if (pl.spiritT <= 0) { pl.spiritActive = false; pl.spirits = []; } }

  // 更新残影
  for (let i = ghosts.length - 1; i >= 0; i--) {
    const gh = ghosts[i];
    gh.x -= sp * .4 * gh.dir;
    gh.y += gh.vy;
    gh.vy += .2;
    if (gh.y >= GY) { gh.y = GY; gh.vy = -3 - Math.random() * 5; }
    gh.life--;
    if (gh.life <= 0) ghosts.splice(i, 1);
  }

  // 更新障碍物
  for (const o of obs) o.up(sp);
  obsT++;
  if (obsT > obsIv) { obsT = 0; spawnObs(); }

  // 碰撞检测
  const pb = pl.sliding
    ? { x: pl.x - pl.w * .4, y: pl.y - 5, w: pl.w * .8, h: 28 }
    : { x: pl.x - pl.w * .4, y: pl.y - 15, w: pl.w * .8, h: pl.h * .7 };
  for (let i = obs.length - 1; i >= 0; i--) {
    const o = obs[i];
    if (o.off()) { obs.splice(i, 1); continue; }
    if (rc(pb, o.getHitbox())) {
      if (handleCollision(o)) obs.splice(i, 1);
      else if (!pl.alive) return;
    }
    if (!o.passed && o.x + o.w < pl.x) { o.passed = true; if (!o.isCol()) sc += 10; }
  }

  // 更新粒子/天气/背景
  updateParticles();
  updateWeather(lv.weather);
  updateBGElements(lv.dyn);
  updateAmbient();
  handleInput();
  render();
  updateUI();

  requestAnimationFrame(loop);
}

function updatePlayer() {
  if (pl.y < GY) {
    pl.vy += G;
    pl.y += pl.vy;
    if (pl.y >= GY) { pl.y = GY; pl.vy = 0; pl.jumping = false; pl.canDJ = true; }
  }
  if (pl.sliding) {
    pl.slideT--;
    if (pl.slideT <= 0) { pl.sliding = false; pl.h = 60; pl.y = Math.min(GY, pl.y); }
  }
  if (pl.inv) { pl.invT--; if (pl.invT <= 0) pl.inv = false; }
  if (pl.painTimer > 0) pl.painTimer--;
  pl.rt++;
  if (pl.rt > 6) { pl.rt = 0; pl.rf = (pl.rf + 1) % 4; }
  if (fc % 3 === 0 && pl.jumping) {
    pl.trails.push({ x: pl.x, y: pl.y, a: .4, w: pl.w, h: pl.h, sl: pl.sliding, bs: pl.bs });
    if (pl.trails.length > 10) pl.trails.shift();
  }
  for (let i = pl.trails.length - 1; i >= 0; i--) {
    pl.trails[i].a -= .04;
    if (pl.trails[i].a <= 0) pl.trails.splice(i, 1);
  }
}

function handleInput() {
  if ((keys[' '] || keys['ArrowUp'] || keys['KeyW']) && !keys._ju) {
    keys._ju = true;
    doJump();
  } else if (!keys[' '] && !keys['ArrowUp'] && !keys['KeyW']) keys._ju = false;

  if ((keys['Shift'] || keys['ArrowDown'] || keys['KeyS']) && !keys._sl) {
    keys._sl = true;
    doSlide();
  } else if (!keys['Shift'] && !keys['ArrowDown'] && !keys['KeyS']) keys._sl = false;

  if ((keys['e'] || keys['KeyE']) && !keys._rw) { keys._rw = true; useRewind(); } else if (!keys['e'] && !keys['KeyE']) keys._rw = false;
  if ((keys['q'] || keys['KeyQ']) && !keys._dx) { keys._dx = true; useDanxin(); } else if (!keys['q'] && !keys['KeyQ']) keys._dx = false;
  if ((keys['r'] || keys['KeyR']) && !keys._mv) { keys._mv = true; useMove(); } else if (!keys['r'] && !keys['KeyR']) keys._mv = false;
  if ((keys['t'] || keys['KeyT']) && !keys._rwt) { keys._rwt = true; useRewrite(); } else if (!keys['t'] && !keys['KeyT']) keys._rwt = false;
  if ((keys['y'] || keys['KeyY']) && !keys._us) { keys._us = true; useUnseal(); } else if (!keys['y'] && !keys['KeyY']) keys._us = false;
}

function doJump() {
  if (pl.sliding) return;
  if (!pl.jumping) {
    pl.vy = -14;
    pl.jumping = true;
    pl.canDJ = true;
    spP(pl.x, pl.y + pl.h, 5, '#d0c0a0', 2);
  } else if (pl.canDJ) {
    pl.vy = -11;
    pl.canDJ = false;
    spP(pl.x, pl.y + pl.h, 8, '#f0d080', 3);
  }
}

function doSlide() {
  if (pl.jumping || pl.sliding) return;
  pl.sliding = true;
  pl.slideT = 25;
  pl.h = 28;
  pl.y = GY + 32;
  spP(pl.x, GY, 4, '#d0c0a0', 2);
}

// ─── 场景合成 ───
function render() {
  cx.clearRect(0, 0, W, H);
  const lv = LEVELS[curLevel], dv = DYNASTY_VIS[lv.dyn];

  // 1. 天空
  drawSky(dv);
  // 1.5 云层
  drawClouds(dv);
  // 2. 多层山脉
  drawMountains(dv);
  // 2.5 飞鸟
  drawBirds(dv);
  // 3. 中景剪影
  drawMidDecor(dv);
  // 3.5 光线效果
  drawLightRays(dv);
  // 4. 天气（在地面前）
  drawWeather(lv.weather);
  // 5. 地面
  drawGround(dv, lv.weather);
  // 6. 氛围粒子
  drawAmbient(dv);
  // 7. 平行时空残影
  drawGhosts();
  // 8. 障碍物
  for (const o of obs) drawObstacle(o);
  // 9. 玩家投影
  drawPlayerShadow();
  // 10. 玩家（含飘带）
  drawPlayer(dv);
  // 11. 英灵
  drawSpirits(dv);
  // 12. 粒子
  drawParticles(cx);
  // 13. 时空涟漪
  drawRipple(dv);

  // 14. 痛苦效果
  if (pl.painTimer > 0) {
    cx.save();
    cx.globalAlpha = .12;
    cx.fillStyle = '#ff0000';
    cx.fillRect(0, 0, W, H);
    cx.restore();
    ca.style.transform = `translate(${(Math.random() - .5) * 4}px,${(Math.random() - .5) * 4}px)`;
  } else { ca.style.transform = ''; }

  // 15. 天命惩罚标记
  if (fateLock > 0) {
    cx.save();
    cx.globalAlpha = .08;
    cx.fillStyle = '#ff4400';
    cx.fillRect(0, 0, W, H);
    cx.restore();
  }

  // 16. 十二金牌关金色光晕
  if (lv.special === 'SnowField' && levelDist > 2000) {
    const ga = Math.min(1, (levelDist - 2000) / 500) * .18;
    cx.save();
    cx.globalAlpha = ga;
    const gg = cx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 600);
    gg.addColorStop(0, 'rgba(255,215,0,0)');
    gg.addColorStop(1, 'rgba(255,215,0,.5)');
    cx.fillStyle = gg;
    cx.fillRect(0, 0, W, H);
    cx.restore();
  }

  // 17. 后处理
  drawPostFX(dv);
}

// ─── 天气/背景粒子更新 ───
function updateWeather(wt) {
  const maxParticles = wt === 'rain' ? 120 : wt === 'snow' ? 90 : wt === 'sand' ? 70 : 30;
  while (wptsA.length < maxParticles) {
    wptsA.push({
      x: Math.random() * W, y: Math.random() * H * .7,
      vy: wt === 'snow' ? 1 + Math.random() * 2 : wt === 'rain' ? 6 + Math.random() * 8 : wt === 'sand' ? 1 + Math.random() * 3 : 0,
      vx: wt === 'sand' ? sp * .3 + Math.random() * 2 : 0,
      sz: wt === 'snow' ? 2 + Math.random() * 4 : wt === 'rain' ? 1 + Math.random() * 1.5 : wt === 'sand' ? 3 + Math.random() * 5 : 0,
      a: .3 + Math.random() * .4, life: 200 + Math.random() * 400
    });
  }
  for (let i = wptsA.length - 1; i >= 0; i--) {
    const w = wptsA[i];
    w.y += w.vy; w.x -= w.vx; w.life--;
    if (w.life <= 0 || w.y > H || w.x < -20) wptsA.splice(i, 1);
  }
}

function updateBGElements(di) {
  const dv = DYNASTY_VIS[di];
  while (bges.length < 15) {
    bges.push({
      x: W + Math.random() * 400, y: 50 + Math.random() * 350,
      t: dv.bg, sz: .5 + Math.random() * 1.5, a: .15 + Math.random() * .3,
      sp: sp * (.1 + Math.random() * .2)
    });
  }
  for (let i = bges.length - 1; i >= 0; i--) {
    bges[i].x -= bges[i].sp;
    if (bges[i].x < -100) bges.splice(i, 1);
  }
}

function updateParticles() {
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    p.x += p.vx; p.y += p.vy; p.vy += .15; p.life--;
    if (p.life <= 0) pts.splice(i, 1);
  }
}

// ─── 过场动画 ───
function startTransition() {
  gs = ST.TRANSITION;
  transPhase = 0;
  transTimer = 0;
  document.getElementById('tsc').style.display = 'flex';
}

function updateTransition() {
  transTimer++;
  const tsc = document.getElementById('tsc'), tscn = document.getElementById('tscn'), tscs = document.getElementById('tscs'), tsct = document.getElementById('tsct');
  if (transPhase === 0) {
    tsc.style.opacity = Math.min(1, transTimer / 40);
    if (transTimer < 30) {
      const lv = LEVELS[curLevel];
      tscn.textContent = lv.name;
      tscs.textContent = lv.era;
      tsct.textContent = lv.quote || '';
    }
    if (transTimer > 60) { transPhase = 1; transTimer = 0; }
  } else if (transPhase === 1) {
    if (transTimer < 20) {
      const nlv = LEVELS[curLevel + 1];
      tscn.textContent = nlv.name;
      tscs.textContent = nlv.era;
      tsct.textContent = nlv.quote || '';
    }
    if (transTimer > 80) { transPhase = 2; transTimer = 0; }
  } else if (transPhase === 2) {
    tsc.style.opacity = Math.max(0, 1 - transTimer / 30);
    if (transTimer > 30) {
      curLevel++; levelDist = 0; narrIdx = 0; obs = []; obsT = 0;
      colShards = 0; goldPlates = 0;
      bges = []; ghosts = []; wptsA = []; ambientPts = []; scarfTrail = [];
      obsIv = Math.max(40, 85 - curLevel * 3);
      if (curLevel === 5) obsIv = 60;
      tsc.style.display = 'none';
      tsc.style.opacity = 0;
      gs = ST.PLAYING;
      transPhase = 0; transTimer = 0;
    }
  }
}

// ─── UI 更新 ───
function updateUI() {
  document.getElementById('sd').textContent = Math.floor(dst);
  document.getElementById('dd').textContent = LEVELS[curLevel].name;
  document.getElementById('frd').textContent = colShards;
  document.getElementById('rd').textContent = Math.floor(ripple * 100);

  // 血量条
  const hbf = document.getElementById('hbf');
  if (hbf) hbf.style.width = Math.round(pl.bs * 100) + '%';

  // 关卡进度条
  const lv = LEVELS[curLevel];
  const lastAt = lv.narrative[lv.narrative.length - 1].at * DIST_SCALE + 500;
  const pbf = document.getElementById('pbf');
  if (pbf) pbf.style.width = Math.min(100, (levelDist / lastAt) * 100).toFixed(1) + '%';

  updateSkillBar();
}

function updateSkillBar() {
  const ids = ['sk1', 'sk2', 'sk3', 'sk4', 'sk5'];
  const cds = [pl.skCd.rewind, pl.skCd.danxin, pl.skCd.move, pl.skCd.rewrite, pl.skCd.unseal];
  const spent = [rw >= 100, dh >= 3, false, wn >= 50, false];
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById(ids[i]);
    el.classList.remove('ready', 'used');
    if (spent[i]) el.classList.add('used');
    else if (cds[i] === 0) el.classList.add('ready');
  }
}
