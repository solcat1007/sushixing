/* ============================================================
 * 溯世行 v3 — 主控模块
 * ------------------------------------------------------------
 * 游戏启动/重开/结局判定/初始化
 * ========================================================== */

// ─── 游戏控制 ───
function start() {
  pl = {
    x: PX, y: GY, vy: 0, w: 36, h: 60, jumping: false, sliding: false, canDJ: true,
    slideT: 0, inv: false, invT: 0, trails: [], rf: 0, rt: 0, bs: 0, alive: true,
    skCd: { rewind: 0, danxin: 0, move: 0, rewrite: 0, unseal: 0 },
    spiritActive: false, spiritT: 0, spirits: [], extraObs: 0, painTimer: 0
  };
  obs = []; pts = []; wptsA = []; bges = []; ghosts = [];
  ambientPts = []; scarfTrail = [];
  sp = BS; dst = 0; sc = 0; fc = 0;
  curLevel = 0; levelDist = 0; narrIdx = 0; narrShowing = false; narrT = 0;
  obsT = 0; obsIv = 85; colShards = 0; goldPlates = 0;
  rw = 0; dh = 0; sh = 0; wn = 0; tm = 0; totalAlters = 0; ripple = 0; fateLock = 0; slowPenalty = 0;
  transPhase = 0; transTimer = 0;
  gs = ST.PLAYING;
  document.getElementById('ts').style.display = 'none';
  document.getElementById('gos').style.display = 'none';
  document.getElementById('ol').classList.remove('active');
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('sb').style.display = 'flex';
  const pb = document.getElementById('pb');
  if (pb) pb.style.display = 'block';
  updateSkillBar();
}

function triggerGameOver() {
  gs = ST.GAMEOVER;
  pl.alive = false;
  let et, es, esd = '';
  if (totalAlters === 0) {
    et = '顺命者';
    es = '历史自有它的轨迹，我只是一个过客。';
    esd = '全程未使用任何改命技能';
  } else if (totalAlters >= 10) {
    et = '逆命者';
    es = '我试图改变一切，最终却一无所有。';
    esd = `共改命 ${totalAlters} 次 · 时空彻底崩溃`;
  } else if (colShards >= 3) {
    et = '见证者';
    es = '我见证了历史，也理解了历史。这就够了。';
    esd = `收集 ${colShards} 枚记忆碎片 · 改命 ${totalAlters} 次`;
  } else if (totalAlters > 0 && totalAlters < 10) {
    et = '溯时者';
    es = '山河无恙，国泰民安。这，就是对所有逝去的人，最好的告慰。';
    esd = `改命 ${totalAlters} 次 · 奔行 ${Math.floor(dst)} 丈`;
  } else {
    et = '历史的温度';
    es = '他们没有消失。他们活在了我们的心里。活在了这片土地上。';
    esd = `收集 ${colShards} 枚记忆碎片`;
  }
  showEndScreen(`奔行了 ${Math.floor(dst)} 丈 · ${et}`, es, esd);
}

function triggerVictory() {
  gs = ST.GAMEOVER;
  pl.alive = false;
  let et, es, esd = '';
  const td = Math.floor(dst / 10);
  if (totalAlters === 0) {
    et = '时之守望者';
    es = '十八朝风霜历尽，未曾改过一丝天命。历史向你展示了它的全部面目，而你选择了沉默的见证。';
    esd = `零改命通关 · 见证十八朝兴衰`;
  } else if (totalAlters <= 5 && colShards >= 5) {
    et = '命运织者';
    es = '你轻触历史的琴弦，每一次拨动都恰到好处。不多一分，不少一毫。历史记住了你的名字。';
    esd = `改命 ${totalAlters} 次 · 收集 ${colShards} 枚记忆碎片 · 完美平衡`;
  } else if (totalAlters >= 15) {
    et = '逆命狂徒';
    es = '历史在你手下千疮百孔。平行时空摇摇欲坠。但——也许这才是真正的历史？没有人知道。';
    esd = `改命 ${totalAlters} 次 · 时空濒临崩溃 · 奔行 ${td} 里`;
  } else if (goldPlates >= 10) {
    et = '精忠义士';
    es = '十二金牌之后，你理解了岳飞的选择。有些事情，明知不可为而为之——这才是人的尊严。';
    esd = `收集 ${goldPlates} 枚金牌 · 改命 ${totalAlters} 次`;
  } else {
    et = '溯世行者';
    es = '从鸿蒙初开到星辰大海，你走完了五千年的沧桑。历史不是一条路，而是一棵树。你的每一次选择，都让这棵树更加茂盛。';
    esd = `十八朝通关 · 改命 ${totalAlters} 次 · 奔行 ${td} 里`;
  }
  showEndScreen(`溯世之旅 · ${et}`, es, esd);
}

function showEndScreen(title, quote, detail) {
  document.getElementById('fs').textContent = title;
  document.getElementById('et').textContent = quote;
  document.getElementById('esd').textContent = detail;
  document.getElementById('gos').style.display = 'flex';
  document.getElementById('ol').classList.add('active');
  document.getElementById('hud').style.display = 'none';
  document.getElementById('sb').style.display = 'none';
  const pb = document.getElementById('pb');
  if (pb) pb.style.display = 'none';
}

function restart() { start(); }

// ─── 画布触控支持 ───
ca.addEventListener('touchstart', e => { e.preventDefault(); if (gs === ST.PLAYING) doJump(); });
ca.addEventListener('click', () => { if (gs === ST.PLAYING) doJump(); });

// ─── 初始化 ───
for (let i = 0; i < 40; i++) {
  wptsA.push({
    x: Math.random() * W, y: Math.random() * H * .7,
    vy: 1 + Math.random() * 2, vx: 0,
    sz: 2 + Math.random() * 3, a: .2 + Math.random() * .3,
    life: 100 + Math.random() * 300
  });
}

requestAnimationFrame(loop);
console.log('溯世行 v3 — 美术重构版 | 多层视差 | 角色动画 | 18关完整版');
console.log('E=寸光回溯 Q=丹心护体 R=山河移步 T=妄念改写 Y=天命解封');
