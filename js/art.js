/* ============================================================
 * 溯世行 v3.5 — 美术渲染模块（大幅增强版）
 * ------------------------------------------------------------
 * 多层视差背景 | 云层飞鸟 | 天体光效 | 角色精细动画
 * 天气粒子 | 草地花木 | 泛光后处理 | 氛围光效
 * ========================================================== */

// ─── 画布初始化 ───
const ca = document.getElementById('c');
const cx = ca.getContext('2d');
ca.width = W; ca.height = H;

// roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
  };
}

// ─── 颜色工具 ───
function mixCol(base, over, ratio) {
  if (ratio <= 0) return base;
  if (ratio >= 1) return over;
  function hr(c) {
    // 处理 rgb() 格式
    const rgbMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    // 处理 hex 格式
    let cl = c.replace('#', '');
    if (cl.length === 3) cl = cl[0] + cl[0] + cl[1] + cl[1] + cl[2] + cl[2];
    return [parseInt(cl.substring(0, 2), 16), parseInt(cl.substring(2, 4), 16), parseInt(cl.substring(4, 6), 16)];
  }
  const b = hr(base), o = hr(over);
  return `rgb(${Math.round(b[0] + (o[0] - b[0]) * Math.min(1, ratio))},${Math.round(b[1] + (o[1] - b[1]) * Math.min(1, ratio))},${Math.round(b[2] + (o[2] - b[2]) * Math.min(1, ratio))})`;
}

function hexRgb(hex) {
  // 处理 rgb() 格式
  const rgbMatch = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  // 处理 hex 格式
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)];
}

// ─── 天空渲染（增强：天光渐变 + 星云 + 天体光晕） ───
function drawSky(dv) {
  const sg = cx.createLinearGradient(0, 0, 0, GY);
  sg.addColorStop(0, dv.colors.sky);
  sg.addColorStop(0.35, dv.colors.skyMid || dv.colors.fog);
  sg.addColorStop(0.7, mixCol(dv.colors.fog, dv.colors.skyMid || '#888', 0.3));
  sg.addColorStop(1, dv.colors.fog);
  cx.fillStyle = sg;
  cx.fillRect(0, 0, W, GY);

  // 天光过渡带（地平线光）
  const hzGlow = cx.createLinearGradient(0, GY - 120, 0, GY);
  hzGlow.addColorStop(0, 'rgba(255,220,170,0)');
  hzGlow.addColorStop(1, `rgba(255,210,150,${dv.horizonGlow || 0.08})`);
  cx.fillStyle = hzGlow;
  cx.fillRect(0, GY - 120, W, 120);

  // 星空
  if (dv.celestial === 'moon' || dv.celestial === 'stars') {
    for (let i = 0; i < 80; i++) {
      const sx = (i * 173 + 37) % W;
      const sy = (i * 97 + 13) % (GY * 0.5);
      const tw = 0.2 + Math.sin(fc * 0.018 + i * 1.7) * 0.18;
      const sz = 0.5 + (i % 4) * 0.45;
      cx.fillStyle = `rgba(255,255,240,${tw})`;
      cx.beginPath(); cx.arc(sx, sy, sz, 0, Math.PI * 2); cx.fill();
      // 大星星的光晕
      if (i % 12 === 0) {
        const gl = cx.createRadialGradient(sx, sy, 0, sx, sy, sz * 6);
        gl.addColorStop(0, `rgba(255,255,230,${tw * 0.25})`);
        gl.addColorStop(1, 'rgba(255,255,230,0)');
        cx.fillStyle = gl;
        cx.fillRect(sx - sz * 6, sy - sz * 6, sz * 12, sz * 12);
      }
    }
  }

  // 星云
  if (dv.celestial === 'stars') {
    for (let i = 0; i < 4; i++) {
      const nx = (i * 320 + 150) % W;
      const ny = 60 + i * 80;
      const neb = cx.createRadialGradient(nx, ny, 0, nx, ny, 160);
      const hue = 220 + i * 30;
      neb.addColorStop(0, `hsla(${hue},70%,60%,0.06)`);
      neb.addColorStop(0.5, `hsla(${hue + 20},60%,50%,0.025)`);
      neb.addColorStop(1, `hsla(${hue},70%,60%,0)`);
      cx.fillStyle = neb;
      cx.fillRect(nx - 160, ny - 160, 320, 320);
    }
    // 流星
    if (fc % 280 < 30) {
      const mx = (fc * 7) % (W + 300) - 150;
      const my = 50 + Math.sin(fc * 0.03) * 60;
      const mg = cx.createLinearGradient(mx, my, mx + 120, my + 40);
      mg.addColorStop(0, 'rgba(255,255,255,0.6)');
      mg.addColorStop(1, 'rgba(255,255,255,0)');
      cx.strokeStyle = mg;
      cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(mx + 120, my + 40); cx.stroke();
    }
  }

  // 天体
  const celX = W * 0.72 + Math.sin(fc * 0.003) * 15;
  const celY = 110 + Math.cos(fc * 0.002) * 8;

  if (dv.celestial === 'sun') {
    // 外层光晕
    const glow3 = cx.createRadialGradient(celX, celY, 5, celX, celY, 280);
    glow3.addColorStop(0, 'rgba(255,230,170,0.22)');
    glow3.addColorStop(0.5, 'rgba(255,210,130,0.06)');
    glow3.addColorStop(1, 'rgba(255,200,100,0)');
    cx.fillStyle = glow3;
    cx.fillRect(celX - 280, celY - 280, 560, 560);
    // 中层
    const glow = cx.createRadialGradient(celX, celY, 8, celX, celY, 160);
    glow.addColorStop(0, 'rgba(255,235,180,0.5)');
    glow.addColorStop(0.35, 'rgba(255,215,140,0.15)');
    glow.addColorStop(1, 'rgba(255,200,100,0)');
    cx.fillStyle = glow;
    cx.fillRect(celX - 160, celY - 160, 320, 320);
    // 太阳本体
    cx.fillStyle = dv.celestialColor;
    cx.beginPath(); cx.arc(celX, celY, 30, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,0.35)';
    cx.beginPath(); cx.arc(celX, celY, 15, 0, Math.PI * 2); cx.fill();
    // 光芒
    cx.save();
    cx.globalAlpha = 0.12;
    for (let r = 0; r < 8; r++) {
      const ra = r * Math.PI / 4 + fc * 0.003;
      cx.strokeStyle = '#fff';
      cx.lineWidth = 1.5;
      cx.beginPath();
      cx.moveTo(celX + Math.cos(ra) * 32, celY + Math.sin(ra) * 32);
      cx.lineTo(celX + Math.cos(ra) * (70 + Math.sin(fc * 0.02 + r) * 15), celY + Math.sin(ra) * (70 + Math.sin(fc * 0.02 + r) * 15));
      cx.stroke();
    }
    cx.restore();
  } else if (dv.celestial === 'moon') {
    // 月光晕
    const glow = cx.createRadialGradient(celX, celY, 5, celX, celY, 180);
    glow.addColorStop(0, 'rgba(200,215,255,0.3)');
    glow.addColorStop(0.5, 'rgba(180,200,255,0.08)');
    glow.addColorStop(1, 'rgba(200,210,240,0)');
    cx.fillStyle = glow;
    cx.fillRect(celX - 180, celY - 180, 360, 360);
    // 月亮
    cx.fillStyle = dv.celestialColor;
    cx.beginPath(); cx.arc(celX, celY, 22, 0, Math.PI * 2); cx.fill();
    // 月面纹理
    cx.fillStyle = 'rgba(180,190,210,0.15)';
    cx.beginPath(); cx.arc(celX - 5, celY - 5, 6, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(celX + 7, celY + 4, 4, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(celX - 2, celY + 8, 3, 0, Math.PI * 2); cx.fill();
    // 月牙阴影
    cx.fillStyle = dv.colors.sky;
    cx.beginPath(); cx.arc(celX + 8, celY - 3, 17, 0, Math.PI * 2); cx.fill();
  }
}

// ─── 云层系统（新增） ───
let cloudPuffs = [];
function drawClouds(dv) {
  if (cloudPuffs.length === 0) {
    for (let i = 0; i < 8; i++) {
      cloudPuffs.push({
        x: Math.random() * W * 1.4 - W * 0.2,
        y: 40 + Math.random() * (GY * 0.38),
        w: 120 + Math.random() * 200,
        h: 30 + Math.random() * 25,
        speed: 0.08 + Math.random() * 0.18,
        alpha: 0.04 + Math.random() * 0.08,
        puffs: Array.from({ length: 4 + Math.floor(Math.random() * 3) }, (_, j) => ({
          ox: (j - 2) * (25 + Math.random() * 30),
          oy: Math.random() * 15 - 7,
          r: 22 + Math.random() * 28
        }))
      });
    }
  }
  const tint = dv.cloudTint || 'rgba(255,255,255,1)';
  for (const c of cloudPuffs) {
    c.x -= c.speed + dst * 0.002;
    if (c.x < -c.w - 60) c.x = W + c.w + Math.random() * 100;
    cx.save();
    cx.globalAlpha = c.alpha;
    cx.fillStyle = tint;
    for (const p of c.puffs) {
      cx.beginPath();
      cx.arc(c.x + p.ox, c.y + p.oy, p.r, 0, Math.PI * 2);
      cx.fill();
    }
    cx.restore();
  }
}

// ─── 飞鸟（新增） ───
let birds = [];
function drawBirds(dv) {
  if (birds.length === 0) {
    for (let i = 0; i < 5; i++) {
      birds.push({
        x: Math.random() * W,
        y: 80 + Math.random() * 200,
        speed: 0.4 + Math.random() * 0.6,
        flapPhase: Math.random() * Math.PI * 2,
        size: 4 + Math.random() * 4,
        alpha: 0.12 + Math.random() * 0.12
      });
    }
  }
  for (const b of birds) {
    b.x -= b.speed + dst * 0.004;
    b.y += Math.sin(fc * 0.008 + b.flapPhase) * 0.3;
    if (b.x < -30) { b.x = W + 30; b.y = 80 + Math.random() * 200; }
    const flap = Math.sin(fc * 0.12 + b.flapPhase) * 0.6;
    cx.save();
    cx.globalAlpha = b.alpha;
    cx.strokeStyle = dv.colors.ink;
    cx.lineWidth = 1.2;
    cx.beginPath();
    cx.moveTo(b.x - b.size, b.y - b.size * flap * 0.4);
    cx.quadraticCurveTo(b.x, b.y + b.size * 0.2, b.x + b.size, b.y - b.size * flap * 0.4);
    cx.stroke();
    cx.restore();
  }
}

// ─── 多层视差山脉（增强：雪山顶 + 树线 + 雾气） ───
function drawMountains(dv) {
  const mTint = dv.mountainTint || dv.colors.ink;
  // 远景
  drawMtnLayer(dst * 0.008, GY - 180, 105, mixCol(mTint, dv.colors.fog, 0.7), 1.0, dv);
  drawMistBand(GY - 200, 80, dv.colors.fog, 0.14);
  // 中景
  drawMtnLayer(dst * 0.022, GY - 120, 115, mixCol(mTint, dv.colors.fog, 0.4), 1.7, dv);
  drawMistBand(GY - 148, 55, dv.colors.fog, 0.1);
  // 近景
  drawMtnLayer(dst * 0.05, GY - 60, 80, mixCol(mTint, dv.colors.fog, 0.12), 2.4, dv);
  drawMistBand(GY - 82, 40, dv.colors.fog, 0.06);
}

function drawMtnLayer(scrollX, baseY, amp, color, seed, dv) {
  cx.fillStyle = color;
  cx.globalAlpha = 0.32;
  cx.beginPath();
  cx.moveTo(0, GY + 50);
  const points = [];
  for (let x = 0; x <= W; x += 5) {
    const nx = (x + scrollX) * 0.0035;
    const y = baseY
      - Math.sin(nx * seed) * amp
      - Math.sin(nx * seed * 2.1 + 1.3) * amp * 0.45
      - Math.sin(nx * seed * 0.6 + 2.8) * amp * 0.3
      - Math.sin(nx * seed * 3.7 + 0.5) * amp * 0.12;
    points.push([x, y]);
    cx.lineTo(x, y);
  }
  cx.lineTo(W, GY + 50);
  cx.closePath();
  cx.fill();

  // 山脊线高光
  cx.globalAlpha = 0.12;
  cx.strokeStyle = mixCol(color, '#fff', 0.3);
  cx.lineWidth = 1;
  cx.beginPath();
  for (let i = 0; i < points.length; i++) {
    i === 0 ? cx.moveTo(points[i][0], points[i][1]) : cx.lineTo(points[i][0], points[i][1]);
  }
  cx.stroke();

  // 雪山顶（远山）
  if (seed < 1.5) {
    cx.globalAlpha = 0.15;
    cx.fillStyle = '#fff';
    for (let i = 0; i < points.length - 1; i++) {
      const [px, py] = points[i];
      if (py < baseY - amp * 0.75) {
        cx.beginPath();
        cx.arc(px, py + 3, 6 + Math.sin(px * 0.1) * 3, 0, Math.PI * 2);
        cx.fill();
      }
    }
  }
  cx.globalAlpha = 1;
}

function drawMistBand(y, height, color, alpha) {
  const [r, g, b] = hexRgb(color);
  const mg = cx.createLinearGradient(0, y, 0, y + height);
  mg.addColorStop(0, `rgba(${r},${g},${b},0)`);
  mg.addColorStop(0.5, `rgba(${r},${g},${b},${alpha})`);
  mg.addColorStop(1, `rgba(${r},${g},${b},0)`);
  cx.fillStyle = mg;
  cx.fillRect(0, y, W, height);
}

// ─── 中景剪影装饰（朝代特色，增强细节） ───
function drawMidDecor(dv) {
  const scrollX = dst * 0.12;
  const spacing = 300;
  const offset = scrollX % spacing;
  cx.save();
  cx.globalAlpha = 0.2;
  cx.fillStyle = dv.colors.ink;
  for (let i = -1; i < 6; i++) {
    const x = i * spacing - offset + ((i * 137 + 50) % 80);
    const y = GY - 12 - ((i * 73 + 30) % 35);
    const s = 0.8 + ((i * 31 + 10) % 50) / 100;
    drawDecor(dv.decorType, x, y, s);
    // 前后两层装饰（增加层次）
    if (i % 2 === 0) {
      cx.globalAlpha = 0.12;
      drawDecor(dv.decorType, x + 140, y + 8, s * 0.7);
      cx.globalAlpha = 0.2;
    }
  }
  cx.restore();
}

function drawDecor(type, x, y, s) {
  cx.beginPath();
  switch (type) {
    case 'pagoda':
      for (let t = 0; t < 3; t++) {
        const tw = (32 - t * 8) * s, th = 13 * s, ty = y - t * th * 1.35;
        cx.moveTo(x - tw, ty); cx.lineTo(x - tw * 0.55, ty - th);
        cx.lineTo(x + tw * 0.55, ty - th); cx.lineTo(x + tw, ty);
      }
      cx.moveTo(x - 2 * s, y - 56 * s); cx.lineTo(x, y - 68 * s); cx.lineTo(x + 2 * s, y - 56 * s);
      break;
    case 'cave':
      cx.moveTo(x - 44 * s, y); cx.lineTo(x - 34 * s, y - 40 * s);
      cx.lineTo(x, y - 55 * s); cx.lineTo(x + 34 * s, y - 40 * s); cx.lineTo(x + 44 * s, y);
      cx.closePath();
      cx.moveTo(x - 13 * s, y); cx.arc(x, y - 8 * s, 13 * s, Math.PI, 0); cx.lineTo(x + 13 * s, y);
      break;
    case 'greatwall':
      cx.moveTo(x - 58 * s, y); cx.lineTo(x - 58 * s, y - 30 * s);
      for (let j = 0; j < 10; j++) cx.lineTo(x - 58 * s + j * 12.8 * s, y - 30 * s - (j % 2) * 8 * s);
      cx.lineTo(x + 58 * s, y - 30 * s); cx.lineTo(x + 58 * s, y);
      // 烽火台
      cx.moveTo(x - 8 * s, y - 30 * s); cx.lineTo(x - 8 * s, y - 52 * s);
      cx.lineTo(x + 8 * s, y - 52 * s); cx.lineTo(x + 8 * s, y - 30 * s);
      break;
    case 'palace':
      cx.moveTo(x - 50 * s, y); cx.lineTo(x - 50 * s, y - 20 * s);
      cx.quadraticCurveTo(x - 58 * s, y - 26 * s, x - 44 * s, y - 30 * s);
      cx.lineTo(x - 28 * s, y - 48 * s); cx.lineTo(x, y - 58 * s); cx.lineTo(x + 28 * s, y - 48 * s);
      cx.lineTo(x + 44 * s, y - 30 * s); cx.quadraticCurveTo(x + 58 * s, y - 26 * s, x + 50 * s, y - 20 * s);
      cx.lineTo(x + 50 * s, y);
      // 柱子
      cx.moveTo(x - 18 * s, y); cx.lineTo(x - 18 * s, y - 38 * s);
      cx.moveTo(x + 18 * s, y); cx.lineTo(x + 18 * s, y - 38 * s);
      break;
    case 'city':
      for (let j = 0; j < 6; j++) {
        const bx = x - 45 * s + j * 17 * s, bw = 12 * s, bh = (24 + ((j * 19) % 40)) * s;
        cx.rect(bx, y - bh, bw, bh);
        // 窗户
        if (bh > 30 * s) {
          cx.rect(bx + 3 * s, y - bh + 8 * s, 3 * s, 3 * s);
          cx.rect(bx + 7 * s, y - bh + 8 * s, 3 * s, 3 * s);
        }
      }
      break;
    case 'bamboo':
      for (let j = 0; j < 5; j++) {
        const bx = x - 25 * s + j * 12 * s;
        cx.rect(bx, y - 70 * s, 3.5 * s, 70 * s);
        // 竹节
        cx.moveTo(bx, y - 50 * s); cx.lineTo(bx + 3.5 * s, y - 50 * s);
        cx.moveTo(bx, y - 30 * s); cx.lineTo(bx + 3.5 * s, y - 30 * s);
        // 竹叶
        cx.moveTo(bx + 3.5 * s, y - 55 * s); cx.lineTo(bx + 18 * s, y - 64 * s); cx.lineTo(bx + 3.5 * s, y - 60 * s);
        cx.moveTo(bx, y - 42 * s); cx.lineTo(bx - 14 * s, y - 50 * s); cx.lineTo(bx, y - 47 * s);
      }
      break;
    case 'ruins':
      cx.rect(x - 30 * s, y - 42 * s, 10 * s, 42 * s);
      cx.rect(x - 6 * s, y - 24 * s, 10 * s, 24 * s);
      cx.rect(x + 18 * s, y - 48 * s, 10 * s, 48 * s);
      cx.moveTo(x - 36 * s, y); cx.lineTo(x - 24 * s, y - 42 * s); cx.lineTo(x - 12 * s, y);
      // 柱头装饰
      cx.moveTo(x - 32 * s, y - 42 * s); cx.lineTo(x - 28 * s, y - 48 * s); cx.lineTo(x - 24 * s, y - 42 * s);
      cx.moveTo(x + 16 * s, y - 48 * s); cx.lineTo(x + 20 * s, y - 54 * s); cx.lineTo(x + 24 * s, y - 48 * s);
      break;
    case 'desert':
      cx.moveTo(x - 58 * s, y); cx.quadraticCurveTo(x - 20 * s, y - 35 * s, x + 14 * s, y - 16 * s);
      cx.quadraticCurveTo(x + 40 * s, y - 5 * s, x + 58 * s, y);
      // 沙丘线条
      cx.moveTo(x - 30 * s, y - 8 * s); cx.quadraticCurveTo(x, y - 18 * s, x + 25 * s, y - 6 * s);
      break;
    case 'ship':
      cx.moveTo(x - 35 * s, y); cx.lineTo(x - 28 * s, y - 12 * s);
      cx.lineTo(x + 28 * s, y - 12 * s); cx.lineTo(x + 35 * s, y); cx.closePath();
      cx.moveTo(x, y - 12 * s); cx.lineTo(x, y - 65 * s);
      cx.moveTo(x, y - 65 * s); cx.lineTo(x + 25 * s, y - 30 * s); cx.lineTo(x, y - 30 * s);
      // 旗帜
      cx.moveTo(x, y - 62 * s); cx.lineTo(x + 12 * s, y - 58 * s); cx.lineTo(x, y - 54 * s);
      break;
    case 'space':
      cx.moveTo(x - 42 * s, y - 20 * s); cx.lineTo(x, y - 42 * s); cx.lineTo(x + 42 * s, y - 20 * s);
      cx.lineTo(x + 24 * s, y - 14 * s); cx.lineTo(x - 24 * s, y - 14 * s); cx.closePath();
      cx.moveTo(x - 14 * s, y - 32 * s); cx.lineTo(x, y - 48 * s); cx.lineTo(x + 14 * s, y - 32 * s);
      // 光柱
      cx.moveTo(x - 8 * s, y - 20 * s); cx.lineTo(x - 8 * s, y);
      cx.moveTo(x + 8 * s, y - 20 * s); cx.lineTo(x + 8 * s, y);
      break;
    case 'camp':
      cx.moveTo(x - 30 * s, y); cx.lineTo(x, y - 40 * s); cx.lineTo(x + 30 * s, y); cx.closePath();
      cx.moveTo(x, y - 40 * s); cx.lineTo(x, y - 62 * s);
      cx.lineTo(x + 16 * s, y - 55 * s); cx.lineTo(x, y - 48 * s);
      // 篝火
      cx.moveTo(x - 6 * s, y); cx.quadraticCurveTo(x - 3 * s, y - 12 * s, x, y - 16 * s);
      cx.quadraticCurveTo(x + 3 * s, y - 12 * s, x + 6 * s, y);
      break;
    case 'bronze':
      cx.moveTo(x - 22 * s, y); cx.lineTo(x - 18 * s, y - 30 * s);
      cx.quadraticCurveTo(x, y - 42 * s, x + 18 * s, y - 30 * s); cx.lineTo(x + 22 * s, y);
      // 耳
      cx.moveTo(x - 18 * s, y - 24 * s); cx.lineTo(x - 26 * s, y - 28 * s);
      cx.moveTo(x + 18 * s, y - 24 * s); cx.lineTo(x + 26 * s, y - 28 * s);
      break;
    default:
      cx.moveTo(x - 40 * s, y); cx.quadraticCurveTo(x, y - 45 * s, x + 40 * s, y);
  }
  cx.fill();
}

// ─── 地面渲染（增强：草地花木 + 碎石 + 边缘光效） ───
function drawGround(dv, weather) {
  const gg = cx.createLinearGradient(0, GY, 0, H);
  gg.addColorStop(0, dv.colors.ground);
  gg.addColorStop(0.3, mixCol(dv.colors.ground, '#000000', 0.12));
  gg.addColorStop(0.7, mixCol(dv.colors.ground, '#000000', 0.35));
  gg.addColorStop(1, mixCol(dv.colors.ground, '#000000', 0.55));
  cx.fillStyle = gg;
  cx.fillRect(0, GY, W, H - GY);

  // 地面边缘高光（更明亮）
  cx.strokeStyle = mixCol(dv.colors.ground, dv.colors.accent, 0.45);
  cx.lineWidth = 2.5;
  cx.globalAlpha = 0.45;
  cx.beginPath();
  cx.moveTo(0, GY);
  for (let x = 0; x <= W; x += 3) {
    cx.lineTo(x, GY + Math.sin((x + dst * 2) * 0.03) * 2.5 + Math.sin(x * 0.08 + 1) * 1.8);
  }
  cx.stroke();
  // 边缘光晕
  cx.globalAlpha = 0.12;
  cx.lineWidth = 8;
  cx.stroke();
  cx.globalAlpha = 1;

  // 草丛（近景，更多更密）
  const grassCol = mixCol(dv.colors.ground, dv.colors.accent, 0.25);
  const grassLight = mixCol(dv.colors.ground, dv.colors.accent, 0.35);
  for (let i = 0; i < 50; i++) {
    const gx = ((i * 53 + dst * 1.5) % (W + 40)) - 20;
    const gh = 6 + (i * 37 % 14);
    const sway = Math.sin(fc * 0.025 + i * 0.9) * 3.5;
    cx.strokeStyle = i % 3 === 0 ? grassLight : grassCol;
    cx.globalAlpha = 0.2 + (i % 3) * 0.08;
    cx.lineWidth = 1 + (i % 2) * 0.5;
    cx.beginPath();
    cx.moveTo(gx, GY + 2);
    cx.quadraticCurveTo(gx + sway * 0.5, GY - gh * 0.5, gx + sway, GY - gh);
    cx.stroke();
    // 多根草叶
    if (i % 3 === 0) {
      cx.beginPath();
      cx.moveTo(gx + 2, GY + 2);
      cx.quadraticCurveTo(gx + 2 + sway * 0.3, GY - gh * 0.4, gx + 3 + sway * 0.8, GY - gh * 0.8);
      cx.stroke();
    }
  }
  cx.globalAlpha = 1;

  // 地层纹理（更有层次）
  for (let i = 1; i <= 6; i++) {
    cx.globalAlpha = 0.06 + i * 0.012;
    cx.strokeStyle = i % 2 === 0 ? dv.colors.ink : mixCol(dv.colors.ground, dv.colors.accent, 0.15);
    cx.lineWidth = 1 + (i % 2);
    const gy = GY + 10 + i * 20;
    cx.beginPath();
    cx.moveTo(0, gy);
    for (let x = 0; x <= W; x += 12) {
      cx.lineTo(x, gy + Math.sin((x + dst * 0.8) * 0.012 + i * 0.7) * 3.5 + Math.cos(x * 0.008 + i) * 2);
    }
    cx.stroke();
  }
  cx.globalAlpha = 1;

  // 小石子
  for (let i = 0; i < 12; i++) {
    const sx = ((i * 211 + dst * 1.2) % (W + 60)) - 30;
    const sy = GY + 8 + (i * 43 % 35);
    const sz = 1.5 + (i * 23 % 3);
    cx.fillStyle = mixCol(dv.colors.ground, '#fff', 0.12);
    cx.globalAlpha = 0.35;
    cx.beginPath();
    cx.ellipse(sx, sy, sz, sz * 0.6, i * 0.5, 0, Math.PI * 2);
    cx.fill();
    cx.strokeStyle = mixCol(dv.colors.ground, '#000', 0.15);
    cx.lineWidth = 0.5;
    cx.stroke();
    cx.globalAlpha = 1;
  }

  // 天气地面效果
  if (weather === 'rain') {
    cx.fillStyle = 'rgba(160,190,220,0.06)';
    cx.fillRect(0, GY, W, H - GY);
    for (let i = 0; i < 6; i++) {
      const px = ((i * 280 + dst * 1.2) % (W + 200)) - 100;
      cx.fillStyle = 'rgba(140,170,210,0.1)';
      cx.beginPath();
      cx.ellipse(px, GY + 8 + i * 12, 45, 5, 0, 0, Math.PI * 2);
      cx.fill();
    }
  } else if (weather === 'snow') {
    cx.fillStyle = 'rgba(255,255,255,0.12)';
    cx.fillRect(0, GY, W, H - GY);
    for (let i = 0; i < 8; i++) {
      const px = ((i * 190 + dst * 0.6) % (W + 100)) - 50;
      cx.fillStyle = 'rgba(255,255,255,0.15)';
      cx.beginPath();
      cx.ellipse(px, GY + 2, 28 + (i * 7) % 22, 5, 0, 0, Math.PI * 2);
      cx.fill();
    }
  } else if (weather === 'sand') {
    cx.fillStyle = 'rgba(200,180,130,0.07)';
    cx.fillRect(0, GY, W, H - GY);
    // 沙丘纹理
    for (let i = 0; i < 5; i++) {
      const px = ((i * 300 + dst * 0.4) % (W + 100)) - 50;
      cx.strokeStyle = 'rgba(200,180,130,0.08)';
      cx.lineWidth = 1;
      cx.beginPath();
      cx.moveTo(px - 60, GY + 15 + i * 10);
      cx.quadraticCurveTo(px, GY + 8 + i * 10, px + 60, GY + 15 + i * 10);
      cx.stroke();
    }
  }
}

// ─── 角色渲染（大幅增强：衣褶光影 + 发丝飘动 + 脚步尘土 + 气劲光环） ───
let scarfTrail = [];

function drawPlayerShadow() {
  const hAbove = GY - pl.y;
  const shadowScale = Math.max(0.3, 1 - hAbove / 250);
  cx.save();
  cx.globalAlpha = 0.28 * shadowScale;
  cx.fillStyle = '#000';
  cx.beginPath();
  cx.ellipse(pl.x, GY + 3, 24 * shadowScale, 5.5 * shadowScale, 0, 0, Math.PI * 2);
  cx.fill();
  // 影子内部渐变
  cx.globalAlpha = 0.12 * shadowScale;
  cx.fillStyle = '#000';
  cx.beginPath();
  cx.ellipse(pl.x, GY + 3, 16 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
  cx.fill();
  cx.restore();
}

function drawPlayer(dv) {
  const al = pl.inv ? 0.5 + Math.sin(fc * 0.5) * 0.3 : 1;
  cx.save();
  cx.globalAlpha = al;

  // 残影
  for (const t of pl.trails) {
    cx.save();
    cx.globalAlpha = t.a * 0.35;
    drawPlayerBody(t.x, t.y, t.w, t.h, t.sl, t.bs, dv, fc);
    cx.restore();
  }

  // 飘带（在角色后面绘制）
  drawScarf();
  drawPlayerBody(pl.x, pl.y, pl.w, pl.h, pl.sliding, pl.bs, dv, fc);

  // 脚步尘土效果
  if (!pl.sliding && !pl.jumping && fc % 4 === 0) {
    cx.fillStyle = 'rgba(160,140,110,0.25)';
    for (let i = 0; i < 3; i++) {
      const dx = pl.x - 10 + Math.random() * 20;
      const dy = GY + 1 - Math.random() * 3;
      cx.beginPath();
      cx.arc(dx, dy, 1 + Math.random() * 2, 0, Math.PI * 2);
      cx.fill();
    }
  }

  // 气劲光环（奔跑时）
  if (!pl.sliding && sp > BS * 1.1) {
    const auraAlpha = Math.min(0.15, (sp - BS * 1.1) * 0.02);
    const aura = cx.createRadialGradient(pl.x, pl.y - 30, 5, pl.x, pl.y - 30, 55);
    aura.addColorStop(0, `rgba(255,220,150,${auraAlpha})`);
    aura.addColorStop(1, 'rgba(255,220,150,0)');
    cx.fillStyle = aura;
    cx.fillRect(pl.x - 55, pl.y - 85, 110, 110);
  }

  cx.restore();
}

function drawScarf() {
  scarfTrail.unshift({ x: pl.x - 10, y: pl.y - 14 });
  if (scarfTrail.length > 22) scarfTrail.pop();
  if (scarfTrail.length < 3) return;
  for (let i = 1; i < scarfTrail.length; i++) {
    scarfTrail[i].y += Math.sin(fc * 0.1 + i * 0.5) * 0.3;
    scarfTrail[i].x -= 0.3 + i * 0.08;
  }
  // 主飘带
  for (let pass = 0; pass < 2; pass++) {
    cx.beginPath();
    cx.moveTo(scarfTrail[0].x, scarfTrail[0].y);
    for (let i = 1; i < scarfTrail.length - 1; i++) {
      const xc = (scarfTrail[i].x + scarfTrail[i + 1].x) / 2;
      const yc = (scarfTrail[i].y + scarfTrail[i + 1].y) / 2;
      cx.quadraticCurveTo(scarfTrail[i].x, scarfTrail[i].y, xc, yc);
    }
    const tail = scarfTrail[scarfTrail.length - 1];
    const grad = cx.createLinearGradient(scarfTrail[0].x, scarfTrail[0].y, tail.x, tail.y);
    if (pass === 0) {
      grad.addColorStop(0, 'rgba(220,60,50,0.85)');
      grad.addColorStop(0.4, 'rgba(200,45,40,0.5)');
      grad.addColorStop(1, 'rgba(180,40,35,0)');
      cx.lineWidth = 5.5;
    } else {
      grad.addColorStop(0, 'rgba(255,120,100,0.3)');
      grad.addColorStop(1, 'rgba(255,120,100,0)');
      cx.lineWidth = 2.5;
    }
    cx.strokeStyle = grad;
    cx.lineCap = 'round';
    cx.stroke();
  }
  // 飘带尾端光点
  const tail = scarfTrail[scarfTrail.length - 1];
  cx.fillStyle = 'rgba(255,100,80,0.2)';
  cx.beginPath();
  cx.arc(tail.x, tail.y, 4, 0, Math.PI * 2);
  cx.fill();
}

function drawPlayerBody(x, y, w, h, sl, bs, dv, frame) {
  const runPhase = frame * 0.22;
  const legSwing = Math.sin(runPhase) * 0.55;
  const armSwing = Math.sin(runPhase + Math.PI) * 0.35;
  const bodyBob = Math.abs(Math.sin(runPhase)) * 2.5;
  const hairWave = Math.sin(frame * 0.12) * 2;
  const hairWave2 = Math.sin(frame * 0.1 + 1) * 2.5;

  const skinCol = mixCol('#f5deb3', '#cc0000', bs * 0.3);
  const robeCol = mixCol('#f0e8d8', '#cc0000', bs);
  const sashCol = mixCol('#cc3333', '#880000', bs);
  const darkRobe = mixCol('#d8c8b0', '#880000', bs);
  const hairCol = mixCol('#1a1a2e', '#440000', bs * 0.5);
  const robeLight = mixCol(robeCol, '#fff', 0.15);
  const robeDark = mixCol(robeCol, '#000', 0.12);

  if (sl) {
    // 滑铲姿态（增强）
    cx.fillStyle = robeCol;
    cx.beginPath();
    cx.ellipse(x, y + 12, w * 0.55, h * 0.32, 0, 0, Math.PI * 2);
    cx.fill();
    // 衣褶
    cx.strokeStyle = robeDark;
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(x - 12, y + 8);
    cx.quadraticCurveTo(x, y + 14, x + 12, y + 8);
    cx.stroke();
    cx.fillStyle = skinCol;
    cx.beginPath(); cx.arc(x + 12, y - 2, 9, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = hairCol;
    cx.beginPath(); cx.arc(x + 12, y - 10, 6, 0, Math.PI * 2); cx.fill();
    // 飘动发丝
    cx.strokeStyle = hairCol; cx.lineWidth = 2;
    for (let hi = 0; hi < 3; hi++) {
      cx.beginPath();
      cx.moveTo(x + 8 + hi * 2, y - 10);
      cx.quadraticCurveTo(x - 2 + hi, y - 8 + hairWave + hi, x - 18 + hi * 3, y - 4 + hairWave * 2 + hi);
      cx.stroke();
    }
    // 滑铲火花
    if (fc % 3 === 0) {
      cx.fillStyle = 'rgba(255,200,100,0.4)';
      for (let i = 0; i < 4; i++) {
        const fx = x - 5 + Math.random() * 15;
        const fy = y + 18 + Math.random() * 3;
        cx.beginPath();
        cx.arc(fx, fy, 1 + Math.random() * 1.5, 0, Math.PI * 2);
        cx.fill();
      }
    }
    return;
  }

  const by = y - bodyBob;

  // 左腿（带衣褶阴影）
  cx.save();
  cx.translate(x - 7, by + h * 0.52);
  cx.rotate(legSwing);
  cx.fillStyle = darkRobe;
  cx.fillRect(-4, 0, 8, h * 0.22);
  // 腿部高光
  cx.fillStyle = mixCol(darkRobe, '#fff', 0.08);
  cx.fillRect(-3, 0, 3, h * 0.22);
  cx.save();
  cx.translate(0, h * 0.22);
  cx.rotate(Math.max(0, -legSwing) * 0.8);
  cx.fillRect(-3.5, 0, 7, h * 0.22);
  // 靴子（带高光）
  cx.fillStyle = mixCol('#3a2a1a', '#440000', bs);
  cx.fillRect(-3, h * 0.2, 11, 5);
  cx.fillStyle = mixCol('#3a2a1a', '#fff', 0.1);
  cx.fillRect(-3, h * 0.2, 11, 1.5);
  cx.restore();
  cx.restore();

  // 右腿
  cx.save();
  cx.translate(x + 7, by + h * 0.52);
  cx.rotate(-legSwing);
  cx.fillStyle = darkRobe;
  cx.fillRect(-4, 0, 8, h * 0.22);
  cx.fillStyle = mixCol(darkRobe, '#fff', 0.08);
  cx.fillRect(-3, 0, 3, h * 0.22);
  cx.save();
  cx.translate(0, h * 0.22);
  cx.rotate(Math.max(0, legSwing) * 0.8);
  cx.fillRect(-3.5, 0, 7, h * 0.22);
  cx.fillStyle = mixCol('#3a2a1a', '#440000', bs);
  cx.fillRect(-3, h * 0.2, 11, 5);
  cx.fillStyle = mixCol('#3a2a1a', '#fff', 0.1);
  cx.fillRect(-3, h * 0.2, 11, 1.5);
  cx.restore();
  cx.restore();

  // 身体（长袍）— 带光影渐变
  const robeGrad = cx.createLinearGradient(x - 14, by - 8, x + 14, by + h * 0.5);
  robeGrad.addColorStop(0, robeLight);
  robeGrad.addColorStop(0.5, robeCol);
  robeGrad.addColorStop(1, robeDark);
  cx.fillStyle = robeGrad;
  cx.beginPath();
  cx.moveTo(x - 13, by + h * 0.52);
  cx.lineTo(x - 11, by - 6);
  cx.quadraticCurveTo(x, by - 14, x + 11, by - 6);
  cx.lineTo(x + 13, by + h * 0.52);
  cx.closePath();
  cx.fill();
  cx.strokeStyle = mixCol(robeCol, '#000', 0.18);
  cx.lineWidth = 1;
  cx.stroke();

  // 衣褶纹路
  cx.strokeStyle = robeDark;
  cx.lineWidth = 0.8;
  cx.globalAlpha = 0.3;
  for (let fi = 0; fi < 3; fi++) {
    cx.beginPath();
    cx.moveTo(x - 8 + fi * 6, by + h * 0.1);
    cx.quadraticCurveTo(x - 5 + fi * 5, by + h * 0.3, x - 7 + fi * 6, by + h * 0.5);
    cx.stroke();
  }
  cx.globalAlpha = 1;

  // 腰带（带光泽）
  cx.strokeStyle = sashCol;
  cx.lineWidth = 3.5;
  cx.beginPath(); cx.moveTo(x - 12, by + 6); cx.lineTo(x + 12, by + 6); cx.stroke();
  cx.strokeStyle = mixCol(sashCol, '#fff', 0.15);
  cx.lineWidth = 1.5;
  cx.beginPath(); cx.moveTo(x - 12, by + 5); cx.lineTo(x + 12, by + 5); cx.stroke();
  // 腰带垂饰
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(x + 12, by + 6);
  cx.quadraticCurveTo(x + 17 + hairWave, by + 15, x + 15 + hairWave * 2, by + 26);
  cx.stroke();
  cx.lineWidth = 1;
  cx.strokeStyle = mixCol(sashCol, '#fff', 0.2);
  cx.beginPath();
  cx.moveTo(x - 12, by + 6);
  cx.quadraticCurveTo(x - 16 + hairWave * 0.5, by + 14, x - 14 + hairWave, by + 22);
  cx.stroke();

  // 左臂
  cx.save();
  cx.translate(x - 11, by - 2);
  cx.rotate(armSwing);
  const armGrad = cx.createLinearGradient(-5, 0, 5, 18);
  armGrad.addColorStop(0, robeLight);
  armGrad.addColorStop(1, robeCol);
  cx.fillStyle = armGrad;
  cx.beginPath(); cx.moveTo(-3.5, 0); cx.lineTo(-5.5, 18); cx.lineTo(3.5, 18); cx.lineTo(3.5, 0); cx.closePath(); cx.fill();
  cx.fillStyle = skinCol;
  cx.beginPath(); cx.arc(-1, 20, 3.5, 0, Math.PI * 2); cx.fill();
  cx.restore();

  // 右臂
  cx.save();
  cx.translate(x + 11, by - 2);
  cx.rotate(-armSwing);
  const armGrad2 = cx.createLinearGradient(-3, 0, 5, 18);
  armGrad2.addColorStop(0, robeCol);
  armGrad2.addColorStop(1, robeDark);
  cx.fillStyle = armGrad2;
  cx.beginPath(); cx.moveTo(-3.5, 0); cx.lineTo(-3.5, 18); cx.lineTo(5.5, 18); cx.lineTo(3.5, 0); cx.closePath(); cx.fill();
  cx.fillStyle = skinCol;
  cx.beginPath(); cx.arc(1, 20, 3.5, 0, Math.PI * 2); cx.fill();
  cx.restore();

  // 头（带光影）
  const headGrad = cx.createRadialGradient(x - 3, by - 20, 2, x, by - 18, 11);
  headGrad.addColorStop(0, mixCol(skinCol, '#fff', 0.08));
  headGrad.addColorStop(1, skinCol);
  cx.fillStyle = headGrad;
  cx.beginPath(); cx.arc(x, by - 18, 10, 0, Math.PI * 2); cx.fill();
  // 面部阴影
  cx.fillStyle = 'rgba(0,0,0,0.06)';
  cx.beginPath(); cx.arc(x + 3, by - 16, 8, -0.5, 1.5); cx.fill();

  // 眼睛（微小亮点）
  cx.fillStyle = 'rgba(0,0,0,0.6)';
  cx.beginPath(); cx.arc(x + 3, by - 19, 1.2, 0, Math.PI * 2); cx.fill();
  cx.beginPath(); cx.arc(x + 7, by - 19, 1.2, 0, Math.PI * 2); cx.fill();

  // 发型（更丰富）
  cx.fillStyle = hairCol;
  cx.beginPath(); cx.arc(x, by - 24, 8, Math.PI, 0); cx.fill();
  cx.fillRect(x - 8, by - 28, 16, 5);
  cx.beginPath(); cx.arc(x, by - 30, 5.5, 0, Math.PI * 2); cx.fill();

  // 发丝飘动（多缕）
  cx.strokeStyle = hairCol;
  cx.lineWidth = 1.5;
  for (let hi = 0; hi < 4; hi++) {
    cx.beginPath();
    cx.moveTo(x - 5 + hi * 3, by - 28);
    cx.quadraticCurveTo(
      x - 3 + hi * 2 + hairWave,
      by - 22 - hi * 2 + hairWave2 * 0.5,
      x - 8 + hi * 4 + hairWave * 2,
      by - 16 - hi + hairWave2
    );
    cx.stroke();
  }

  // 发簪（带光泽）
  cx.strokeStyle = '#8b6914'; cx.lineWidth = 1.5;
  cx.beginPath(); cx.moveTo(x - 7, by - 32); cx.lineTo(x + 7, by - 28); cx.stroke();
  cx.strokeStyle = '#b8901a'; cx.lineWidth = 0.8;
  cx.beginPath(); cx.moveTo(x - 6, by - 31.5); cx.lineTo(x + 6, by - 28); cx.stroke();
  // 簪头宝石
  cx.fillStyle = '#c22';
  cx.beginPath(); cx.arc(x - 7, by - 32, 1.8, 0, Math.PI * 2); cx.fill();

  // 发带（飘逸）
  cx.strokeStyle = sashCol; cx.lineWidth = 2.2;
  cx.beginPath();
  cx.moveTo(x, by - 34);
  cx.quadraticCurveTo(x + 6 + hairWave, by - 43, x + 12 + hairWave * 2, by - 48);
  cx.stroke();
  cx.beginPath();
  cx.moveTo(x, by - 34);
  cx.quadraticCurveTo(x - 4 + hairWave * 0.7, by - 41, x - 10 + hairWave * 1.5, by - 44);
  cx.stroke();
}

// ─── 英灵渲染（增强：光环效果） ───
function drawSpirits(dv) {
  if (!pl.spiritActive || pl.spirits.length === 0) return;
  for (const sp of pl.spirits) {
    cx.save();
    // 多层光晕
    for (let gl = 0; gl < 3; gl++) {
      const radius = 25 + gl * 15;
      const alpha = 0.4 - gl * 0.12;
      const glow = cx.createRadialGradient(sp.x, sp.y - 16, 2, sp.x, sp.y - 16, radius);
      glow.addColorStop(0, `rgba(240,220,180,${alpha})`);
      glow.addColorStop(1, 'rgba(240,220,180,0)');
      cx.fillStyle = glow;
      cx.fillRect(sp.x - radius, sp.y - 16 - radius, radius * 2, radius * 2);
    }
    // 灵体
    cx.globalAlpha = sp.alpha * 0.75;
    cx.fillStyle = '#f0e8d0';
    cx.beginPath(); cx.arc(sp.x, sp.y - 16, 7, 0, Math.PI * 2); cx.fill();
    // 内核
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(sp.x, sp.y - 16, 3, 0, Math.PI * 2); cx.fill();
    // 双重光环
    cx.strokeStyle = 'rgba(240,220,180,0.5)';
    cx.lineWidth = 1.5;
    cx.beginPath(); cx.arc(sp.x, sp.y - 16, 13 + Math.sin(fc * 0.08 + sp.phase) * 3, 0, Math.PI * 2); cx.stroke();
    cx.strokeStyle = 'rgba(240,220,180,0.2)';
    cx.lineWidth = 1;
    cx.beginPath(); cx.arc(sp.x, sp.y - 16, 18 + Math.sin(fc * 0.06 + sp.phase + 1) * 4, 0, Math.PI * 2); cx.stroke();
    cx.restore();
  }
}

// ─── 平行时空残影 ───
function drawGhosts() {
  for (const gh of ghosts) {
    cx.save();
    cx.globalAlpha = gh.alpha * 0.35;
    drawPlayerBody(gh.x, gh.y, pl.w, pl.h, false, 0, DYNASTY_VIS[LEVELS[curLevel].dyn], fc + gh.phase * 20);
    cx.restore();
  }
}

// ─── 障碍物渲染（大幅增强：更多细节 + 发光 + 动态） ───
function drawObstacle(o) {
  const dv = DYNASTY_VIS[o.dyI];
  const pulse = Math.sin(o.pt) * 0.2 + 0.8;
  cx.save();
  cx.globalAlpha = o.a;

  // 投影
  if (!o.isCol()) {
    cx.fillStyle = 'rgba(0,0,0,0.18)';
    cx.beginPath();
    cx.ellipse(o.x, GY + 2, o.w * 0.55, 5, 0, 0, Math.PI * 2);
    cx.fill();
  }

  switch (o.type) {
    case 'rock': {
      // 岩石主体（渐变 + 棱角感）
      const grd = cx.createRadialGradient(o.x - 3, o.y - o.h * 0.6, 2, o.x, o.y - o.h * 0.3, o.w * 0.65);
      grd.addColorStop(0, mixCol(dv.colors.ground, '#fff', 0.18));
      grd.addColorStop(0.4, dv.colors.ink);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = grd;
      cx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const r = o.w * 0.5 * (0.6 + Math.sin(i * 3.7) * 0.35);
        const px = o.x + Math.cos(a) * r;
        const py = o.y - o.h * 0.4 - Math.abs(Math.sin(a)) * o.h * 0.5;
        i === 0 ? cx.moveTo(px, py) : cx.lineTo(px, py);
      }
      cx.closePath();
      cx.fill();
      cx.strokeStyle = mixCol(dv.colors.ink, '#fff', 0.1);
      cx.lineWidth = 2;
      cx.stroke();
      // 岩石纹理
      cx.strokeStyle = mixCol(dv.colors.ink, '#fff', 0.06);
      cx.lineWidth = 1;
      for (let li = 0; li < 3; li++) {
        cx.beginPath();
        cx.moveTo(o.x - o.w * 0.2 + li * 8, o.y - o.h * 0.6);
        cx.quadraticCurveTo(o.x + li * 4, o.y - o.h * 0.35, o.x - o.w * 0.15 + li * 10, o.y - o.h * 0.15);
        cx.stroke();
      }
      // 苔藓/纹理点
      cx.fillStyle = mixCol(dv.colors.ground, dv.colors.accent, 0.15);
      cx.globalAlpha = o.a * 0.3;
      for (let mi = 0; mi < 4; mi++) {
        cx.beginPath();
        cx.arc(o.x - o.w * 0.2 + mi * 9, o.y - o.h * 0.3 - mi * 5, 2 + mi, 0, Math.PI * 2);
        cx.fill();
      }
      cx.globalAlpha = o.a;
      break;
    }
    case 'spear':
      // 矛杆
      cx.fillStyle = o.dyI <= 1 ? '#6a8a3a' : '#5a5a5a';
      cx.fillRect(o.x - 3, o.y - o.h, 6, o.h);
      // 杆上纹理
      cx.strokeStyle = mixCol(o.dyI <= 1 ? '#6a8a3a' : '#5a5a5a', '#fff', 0.1);
      cx.lineWidth = 0.5;
      for (let si = 0; si < o.h; si += 12) {
        cx.beginPath();
        cx.moveTo(o.x - 3, o.y - si);
        cx.lineTo(o.x + 3, o.y - si);
        cx.stroke();
      }
      // 矛头（带光泽）
      const spearTip = cx.createLinearGradient(o.x - 10, o.y - o.h - 18, o.x + 10, o.y - o.h + 6);
      spearTip.addColorStop(0, '#e8e8e0');
      spearTip.addColorStop(0.5, '#d0d0c8');
      spearTip.addColorStop(1, '#a0a098');
      cx.fillStyle = spearTip;
      cx.beginPath();
      cx.moveTo(o.x, o.y - o.h - 18);
      cx.lineTo(o.x - 10, o.y - o.h + 5);
      cx.lineTo(o.x + 10, o.y - o.h + 5);
      cx.closePath();
      cx.fill();
      cx.strokeStyle = '#888';
      cx.lineWidth = 1;
      cx.stroke();
      // 矛头高光
      cx.fillStyle = 'rgba(255,255,255,0.3)';
      cx.beginPath();
      cx.moveTo(o.x, o.y - o.h - 16);
      cx.lineTo(o.x - 3, o.y - o.h);
      cx.lineTo(o.x, o.y - o.h + 2);
      cx.closePath();
      cx.fill();
      break;
    case 'fire':
      // 火焰（更多层次 + 动态）
      for (let i = 4; i >= 0; i--) {
        const sc = 1 - i * 0.13, al = 0.25 + i * 0.18;
        const flicker = Math.sin(fc * 0.15 + i * 1.2) * 3;
        cx.fillStyle = i === 0 ? `rgba(255,240,120,${al})`
          : i === 1 ? `rgba(255,200,30,${al})`
          : i === 2 ? `rgba(255,120,10,${al})`
          : i === 3 ? `rgba(255,60,5,${al})`
          : `rgba(200,20,0,${al})`;
        cx.beginPath();
        cx.moveTo(o.x, o.y);
        cx.quadraticCurveTo(o.x - 18 * sc * pulse + flicker, o.y - 44 * sc, o.x + flicker * 0.5, o.y - 62 * sc);
        cx.quadraticCurveTo(o.x + 18 * sc * pulse + flicker, o.y - 44 * sc, o.x, o.y);
        cx.fill();
      }
      // 火光晕
      const fireGlow = cx.createRadialGradient(o.x, o.y - 28, 5, o.x, o.y - 28, 65);
      fireGlow.addColorStop(0, 'rgba(255,150,30,0.18)');
      fireGlow.addColorStop(0.5, 'rgba(255,100,10,0.06)');
      fireGlow.addColorStop(1, 'rgba(255,150,30,0)');
      cx.fillStyle = fireGlow;
      cx.fillRect(o.x - 65, o.y - 95, 130, 130);
      // 火星飞溅
      if (fc % 3 === 0) {
        cx.fillStyle = 'rgba(255,200,80,0.5)';
        for (let ei = 0; ei < 3; ei++) {
          const ex = o.x + Math.sin(fc * 0.1 + ei * 2) * 12;
          const ey = o.y - 40 - Math.random() * 30;
          cx.beginPath();
          cx.arc(ex, ey, 1 + Math.random() * 1.5, 0, Math.PI * 2);
          cx.fill();
        }
      }
      break;
    case 'wall':
      // 墙体（带纹理和装饰）
      const wallGrad = cx.createLinearGradient(o.x - o.w * 0.5, o.y - o.h, o.x + o.w * 0.5, o.y);
      wallGrad.addColorStop(0, mixCol(dv.colors.ground, '#fff', 0.1));
      wallGrad.addColorStop(1, mixCol(dv.colors.ground, '#000', 0.15));
      cx.fillStyle = wallGrad;
      cx.fillRect(o.x - o.w * 0.5, o.y - o.h, o.w, o.h);
      // 砖块纹理
      cx.strokeStyle = mixCol(dv.colors.ground, '#000', 0.2);
      cx.lineWidth = 1;
      for (let j = 1; j < 5; j++) {
        cx.beginPath();
        cx.moveTo(o.x - o.w * 0.5, o.y - o.h + j * o.h / 5);
        cx.lineTo(o.x + o.w * 0.5, o.y - o.h + j * o.h / 5);
        cx.stroke();
      }
      // 竖线
      cx.beginPath();
      cx.moveTo(o.x, o.y - o.h);
      cx.lineTo(o.x, o.y);
      cx.stroke();
      // 边框装饰
      cx.strokeStyle = dv.colors.accent;
      cx.lineWidth = 2.5;
      cx.strokeRect(o.x - o.w * 0.5, o.y - o.h, o.w, o.h);
      cx.beginPath();
      cx.arc(o.x, o.y - o.h * 0.5, 8, 0, Math.PI * 2);
      cx.stroke();
      // 符文装饰
      cx.fillStyle = dv.colors.accent;
      cx.globalAlpha = o.a * 0.4;
      cx.font = '10px "STKaiti","楷体"';
      cx.textAlign = 'center';
      cx.fillText('镇', o.x, o.y - o.h * 0.5 + 4);
      cx.globalAlpha = o.a;
      break;
    case 'gold_plate': {
      // 金牌（增强发光）
      for (let gl = 0; gl < 3; gl++) {
        const radius = 30 + gl * 12;
        const alpha = 0.6 - gl * 0.15;
        const gl = cx.createRadialGradient(o.x, o.y, 2, o.x, o.y, radius);
        gl.addColorStop(0, `rgba(255,215,0,${alpha * pulse})`);
        gl.addColorStop(1, 'rgba(255,215,0,0)');
        cx.fillStyle = gl;
        cx.beginPath(); cx.arc(o.x, o.y, radius * pulse, 0, Math.PI * 2); cx.fill();
      }
      // 金牌本体（渐变）
      const plateGrad = cx.createLinearGradient(o.x - 12, o.y - 16, o.x + 12, o.y + 16);
      plateGrad.addColorStop(0, '#fff0a0');
      plateGrad.addColorStop(0.3, '#ffe060');
      plateGrad.addColorStop(0.6, '#ffd700');
      plateGrad.addColorStop(1, '#b8860b');
      cx.fillStyle = plateGrad;
      cx.beginPath();
      cx.roundRect(o.x - 12, o.y - 16, 24, 32, 3);
      cx.fill();
      cx.strokeStyle = '#8b6914';
      cx.lineWidth = 2;
      cx.stroke();
      // 高光
      cx.fillStyle = 'rgba(255,255,255,0.25)';
      cx.beginPath();
      cx.roundRect(o.x - 10, o.y - 14, 8, 12, 2);
      cx.fill();
      // 文字
      cx.fillStyle = '#6b3410';
      cx.font = 'bold 14px "STKaiti","楷体"';
      cx.textAlign = 'center';
      cx.fillText('敕', o.x, o.y + 6);
      break;
    }
    case 'memory_shard': {
      // 记忆碎片（增强水晶效果）
      for (let gl = 0; gl < 3; gl++) {
        const radius = 22 + gl * 10;
        const alpha = 0.7 - gl * 0.18;
        const sg = cx.createRadialGradient(o.x, o.y, 1, o.x, o.y, radius);
        sg.addColorStop(0, `rgba(200,220,255,${alpha})`);
        sg.addColorStop(0.5, `rgba(150,180,255,${alpha * 0.4})`);
        sg.addColorStop(1, 'rgba(100,140,255,0)');
        cx.fillStyle = sg;
        cx.beginPath(); cx.arc(o.x, o.y, radius * pulse, 0, Math.PI * 2); cx.fill();
      }
      // 水晶体（多面体）
      const shardGrad = cx.createLinearGradient(o.x - 10, o.y - 12, o.x + 10, o.y + 12);
      shardGrad.addColorStop(0, '#e0f0ff');
      shardGrad.addColorStop(0.5, '#c8e0ff');
      shardGrad.addColorStop(1, '#8899cc');
      cx.fillStyle = shardGrad;
      cx.beginPath();
      cx.moveTo(o.x, o.y - 12);
      cx.lineTo(o.x + 10, o.y - 1);
      cx.lineTo(o.x + 2, o.y + 10);
      cx.lineTo(o.x - 9, o.y + 3);
      cx.closePath();
      cx.fill();
      cx.strokeStyle = '#8899cc';
      cx.lineWidth = 1;
      cx.stroke();
      // 内部面
      cx.fillStyle = 'rgba(255,255,255,0.35)';
      cx.beginPath();
      cx.moveTo(o.x - 1, o.y - 7);
      cx.lineTo(o.x + 5, o.y - 1);
      cx.lineTo(o.x, o.y + 2);
      cx.closePath();
      cx.fill();
      // 边缘光
      cx.fillStyle = 'rgba(255,255,255,0.5)';
      cx.beginPath();
      cx.moveTo(o.x, o.y - 12);
      cx.lineTo(o.x + 10, o.y - 1);
      cx.lineTo(o.x + 7, o.y - 2);
      cx.lineTo(o.x, o.y - 10);
      cx.closePath();
      cx.fill();
      break;
    }
  }
  cx.restore();
}

// ─── 天气粒子（增强：更多数量 + 更好效果） ───
function drawWeather(wt) {
  for (const w of wptsA) {
    if (wt === 'rain') {
      // 雨滴（带光晕）
      cx.strokeStyle = `rgba(180,200,230,${w.a})`;
      cx.lineWidth = 1.2;
      cx.beginPath();
      cx.moveTo(w.x, w.y);
      cx.lineTo(w.x - 3, w.y + w.sz * 6);
      cx.stroke();
      // 雨滴头部亮点
      cx.fillStyle = `rgba(200,220,255,${w.a * 0.4})`;
      cx.beginPath();
      cx.arc(w.x, w.y, 1, 0, Math.PI * 2);
      cx.fill();
    } else if (wt === 'snow') {
      // 雪花（更晶莹）
      const sway = Math.sin(fc * 0.02 + w.x * 0.01) * 3;
      cx.fillStyle = `rgba(255,255,255,${w.a})`;
      cx.beginPath();
      cx.arc(w.x + sway, w.y, w.sz, 0, Math.PI * 2);
      cx.fill();
      // 雪花光晕
      cx.fillStyle = `rgba(255,255,255,${w.a * 0.15})`;
      cx.beginPath();
      cx.arc(w.x + sway, w.y, w.sz * 2.5, 0, Math.PI * 2);
      cx.fill();
    } else if (wt === 'sand') {
      cx.fillStyle = `rgba(200,180,140,${w.a})`;
      cx.fillRect(w.x, w.y, w.sz * 3, w.sz * 0.5);
    }
  }
  // 雨天地面积水飞溅（增强）
  if (wt === 'rain') {
    for (let i = 0; i < 12; i++) {
      const sx = (i * 127 + fc * 7) % W;
      const phase = (fc * 0.15 + i * 1.3) % (Math.PI * 2);
      const sr = Math.abs(Math.sin(phase)) * 8;
      if (sr > 0.5) {
        cx.strokeStyle = `rgba(180,200,230,${0.3 * (1 - sr / 8)})`;
        cx.lineWidth = 1.2;
        cx.beginPath();
        cx.ellipse(sx, GY + 1, sr, sr * 0.25, 0, 0, Math.PI * 2);
        cx.stroke();
        // 飞溅水滴
        if (sr > 4) {
          cx.fillStyle = `rgba(180,200,230,${0.2 * (1 - sr / 8)})`;
          cx.beginPath();
          cx.arc(sx + Math.sin(i) * 5, GY - sr * 0.3, 1, 0, Math.PI * 2);
          cx.fill();
        }
      }
    }
  }
}

// ─── 粒子渲染 ───
function drawParticles(ctx) {
  for (const p of pts) {
    ctx.globalAlpha = p.life / p.ml;
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─── 氛围粒子（增强：飘尘/萤火/光斑） ───
let ambientPts = [];
function updateAmbient() {
  while (ambientPts.length < 35) {
    ambientPts.push({
      x: Math.random() * W, y: Math.random() * GY,
      vx: -0.15 - Math.random() * 0.4,
      vy: -0.05 + Math.random() * 0.15,
      sz: 1 + Math.random() * 3,
      a: 0.04 + Math.random() * 0.14,
      life: 300 + Math.random() * 500,
      type: Math.random() > 0.7 ? 'firefly' : 'dust'
    });
  }
  for (let i = ambientPts.length - 1; i >= 0; i--) {
    const p = ambientPts[i];
    p.x += p.vx + Math.sin(fc * 0.01 + p.y * 0.01) * 0.25;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0 || p.x < -10 || p.y < -10 || p.y > GY + 10) ambientPts.splice(i, 1);
  }
}
function drawAmbient(dv) {
  const col = dv.ambientColor || '#c8a860';
  for (const p of ambientPts) {
    cx.save();
    if (p.type === 'firefly') {
      // 萤火虫（带闪烁光晕）
      const twinkle = 0.3 + Math.sin(fc * 0.06 + p.x * 0.1) * 0.5;
      cx.globalAlpha = p.a * twinkle * Math.min(1, p.life / 300);
      const glow = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz * 4);
      glow.addColorStop(0, `rgba(255,240,150,${0.5 * twinkle})`);
      glow.addColorStop(1, 'rgba(255,240,150,0)');
      cx.fillStyle = glow;
      cx.fillRect(p.x - p.sz * 4, p.y - p.sz * 4, p.sz * 8, p.sz * 8);
      cx.fillStyle = '#fff';
      cx.beginPath();
      cx.arc(p.x, p.y, p.sz * 0.7, 0, Math.PI * 2);
      cx.fill();
    } else {
      // 普通飘尘
      cx.globalAlpha = p.a * Math.min(1, p.life / 300);
      cx.fillStyle = col;
      cx.beginPath();
      cx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
      cx.fill();
    }
    cx.restore();
  }
}

// ─── 光线效果（新增：丁达尔光柱） ───
function drawLightRays(dv) {
  if (!dv.lightRays) return;
  cx.save();
  cx.globalAlpha = 0.035;
  for (let i = 0; i < 5; i++) {
    const rx = W * 0.15 + i * W * 0.18 + Math.sin(fc * 0.003 + i) * 30;
    const rayGrad = cx.createLinearGradient(rx, 0, rx + 40, GY);
    rayGrad.addColorStop(0, 'rgba(255,240,200,0.5)');
    rayGrad.addColorStop(0.5, 'rgba(255,230,180,0.15)');
    rayGrad.addColorStop(1, 'rgba(255,220,160,0)');
    cx.fillStyle = rayGrad;
    cx.beginPath();
    cx.moveTo(rx, -20);
    cx.lineTo(rx + 25, -20);
    cx.lineTo(rx + 65, GY + 20);
    cx.lineTo(rx - 15, GY + 20);
    cx.closePath();
    cx.fill();
  }
  cx.restore();
}

// ─── 时空涟漪效果 ───
function drawRipple(dv) {
  if (ripple <= 0) return;
  if (ripple > 0.3) {
    const tc = Math.floor(ripple * 8);
    for (let i = 0; i < tc; i++) {
      const ty = Math.random() * H;
      cx.save();
      cx.globalAlpha = 0.12 + ripple * 0.25;
      cx.fillStyle = '#fff';
      cx.fillRect(0, ty, W, 1 + Math.random() * 3);
      cx.restore();
    }
  }
  if (ripple > 0.5) {
    cx.save();
    cx.globalAlpha = Math.sin(fc * 0.1) * ripple * 0.25;
    cx.fillStyle = '#f00';
    cx.fillRect(0, 0, 5, H);
    cx.fillRect(W - 5, 0, 5, H);
    cx.restore();
  }
  if (ripple > 0.7) {
    cx.save();
    cx.globalAlpha = ripple * 0.06;
    const og = cx.getImageData(0, 0, W, H);
    cx.putImageData(og, -3, 0);
    cx.putImageData(og, 3, 0);
    cx.restore();
  }
  if (ripple > 0.85) {
    cx.save();
    cx.globalAlpha = 0.04;
    for (let i = 0; i < 3; i++) {
      cx.fillStyle = `hsl(${(fc + i * 60) % 360},50%,50%)`;
      cx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 100, 2);
    }
    cx.restore();
  }
}

// ─── 后处理效果（增强：泛光 + 色差 + 动态光效） ───
function drawPostFX(dv) {
  // 暗角（更自然）
  const vg = cx.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.9);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(0.55, 'rgba(0,0,0,0.04)');
  vg.addColorStop(0.8, 'rgba(0,0,0,0.12)');
  vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  cx.fillStyle = vg;
  cx.fillRect(0, 0, W, H);

  // 上下渐变氛围
  const topGrad = cx.createLinearGradient(0, 0, 0, H * 0.25);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.12)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = topGrad;
  cx.fillRect(0, 0, W, H * 0.25);

  // 速度线（高速时）
  if (sp > BS * 1.2) {
    const intensity = Math.min(1, (sp - BS * 1.2) / (MS - BS * 1.2));
    cx.save();
    cx.globalAlpha = intensity * 0.13;
    cx.strokeStyle = '#fff';
    cx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const ly = (i * 53 + fc * 5) % H;
      const lx = Math.random() * W;
      const len = 80 + Math.random() * 220;
      cx.beginPath();
      cx.moveTo(lx, ly);
      cx.lineTo(lx - len, ly + (Math.random() - 0.5) * 5);
      cx.stroke();
    }
    cx.restore();
  }

  // 朝代色调叠加
  if (dv.hue !== 0) {
    cx.save();
    cx.globalCompositeOperation = 'overlay';
    cx.globalAlpha = 0.06;
    cx.fillStyle = dv.hue > 0 ? `rgb(${200 + dv.hue},180,160)` : `rgb(160,${180 - dv.hue},200)`;
    cx.fillRect(0, 0, W, H);
    cx.restore();
  }

  // 轻微泛光效果（屏幕中心微光）
  cx.save();
  cx.globalCompositeOperation = 'screen';
  cx.globalAlpha = 0.02;
  const bloom = cx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, H * 0.6);
  bloom.addColorStop(0, 'rgba(255,250,230,1)');
  bloom.addColorStop(1, 'rgba(255,250,230,0)');
  cx.fillStyle = bloom;
  cx.fillRect(0, 0, W, H);
  cx.restore();
}

// ─── 标题画面背景（增强） ───
function drawTitleBG() {
  const gg = cx.createLinearGradient(0, 0, 0, H);
  gg.addColorStop(0, '#08060a');
  gg.addColorStop(0.3, '#100e18');
  gg.addColorStop(0.6, '#1a1422');
  gg.addColorStop(1, '#2a1a14');
  cx.fillStyle = gg;
  cx.fillRect(0, 0, W, H);

  // 远山（更多层）
  for (let m = 0; m < 3; m++) {
    cx.fillStyle = `rgba(${20 + m * 8},${20 + m * 8},${30 + m * 8},${0.6 + m * 0.15})`;
    cx.beginPath();
    cx.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) {
      const amp = 80 + m * 30;
      cx.lineTo(x, H * (0.42 + m * 0.1) + Math.sin(x * 0.003 + fc * 0.002 + m) * amp + Math.sin(x * 0.009 + m * 2) * amp * 0.5);
    }
    cx.lineTo(W, H);
    cx.closePath();
    cx.fill();
  }

  // 云雾层
  for (let ci = 0; ci < 4; ci++) {
    const cy = H * 0.35 + ci * 60;
    const cg = cx.createLinearGradient(0, cy - 30, 0, cy + 30);
    cg.addColorStop(0, 'rgba(100,90,120,0)');
    cg.addColorStop(0.5, `rgba(100,90,120,${0.03 + ci * 0.01})`);
    cg.addColorStop(1, 'rgba(100,90,120,0)');
    cx.fillStyle = cg;
    cx.fillRect(0, cy - 30, W, 60);
  }

  // 飘浮墨点（更多）
  for (let i = 0; i < 35; i++) {
    const mx = (Math.sin(fc * 0.002 + i * 2.3) * 320 + W / 2 + i * 45) % W;
    const my = 160 + Math.cos(fc * 0.0015 + i * 1.6) * 180;
    const sz = 2 + Math.abs(Math.sin(i * 1.3)) * 5;
    cx.fillStyle = `rgba(180,150,100,${0.08 + Math.sin(fc * 0.008 + i) * 0.06})`;
    cx.beginPath();
    cx.arc(mx, my, sz, 0, Math.PI * 2);
    cx.fill();
    // 光晕
    cx.fillStyle = `rgba(180,150,100,${0.02 + Math.sin(fc * 0.008 + i) * 0.015})`;
    cx.beginPath();
    cx.arc(mx, my, sz * 3, 0, Math.PI * 2);
    cx.fill();
  }

  // 飘浮汉字（更大更清晰）
  const chars = ['道', '德', '仁', '义', '礼', '天', '地', '人', '命', '时'];
  for (let i = 0; i < 10; i++) {
    const bx = (Math.sin(fc * 0.001 + i * 2.8) * 380 + W / 2 + i * 130) % W;
    const by = 120 + Math.cos(fc * 0.0008 + i * 2.1) * 220;
    cx.save();
    cx.globalAlpha = 0.04 + Math.sin(fc * 0.005 + i * 1.1) * 0.03;
    cx.fillStyle = '#c8a860';
    cx.font = `${40 + i * 8}px "STKaiti","楷体",serif`;
    cx.textAlign = 'center';
    cx.fillText(chars[i], bx, by);
    cx.restore();
  }

  // 星星
  for (let i = 0; i < 30; i++) {
    const sx = (i * 197 + 43) % W;
    const sy = (i * 89 + 17) % (H * 0.4);
    const tw = 0.15 + Math.sin(fc * 0.02 + i) * 0.12;
    cx.fillStyle = `rgba(255,255,240,${tw})`;
    cx.beginPath();
    cx.arc(sx, sy, 0.5 + (i % 3) * 0.5, 0, Math.PI * 2);
    cx.fill();
  }

  // 地面
  const gg2 = cx.createLinearGradient(0, GY, 0, H);
  gg2.addColorStop(0, '#1a1208');
  gg2.addColorStop(1, '#0a0806');
  cx.fillStyle = gg2;
  cx.fillRect(0, GY, W, H - GY);
  cx.strokeStyle = '#3a2a18';
  cx.lineWidth = 1;
  cx.beginPath();
  cx.moveTo(0, GY);
  cx.lineTo(W, GY);
  cx.stroke();

  // 暗角
  const vg = cx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 0.92);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(0.6, 'rgba(0,0,0,0.1)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  cx.fillStyle = vg;
  cx.fillRect(0, 0, W, H);
}
