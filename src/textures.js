// Canvas-drawn textures: everything glowing in the room is painted here at
// runtime, so the site ships no image files.
import * as THREE from 'three';

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const tex = (c) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};
const rand = (seed) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

export const ORANGE = '#ff8a2a';
export const BLUE = '#5fd0ff';
export const VIOLET = '#a46bff';

/** Orthogonal glowing traces on black, used as the coat's emissive map. */
export function circuitTexture(color = ORANGE, seed = 7, size = 512) {
  const c = canvas(size, size);
  const x = c.getContext('2d');
  const r = rand(seed);
  x.fillStyle = '#000';
  x.fillRect(0, 0, size, size);
  x.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    let px = r() * size, py = r() * size;
    x.strokeStyle = color;
    x.globalAlpha = 0.55 + r() * 0.45;
    x.lineWidth = 1.5 + r() * 2;
    x.beginPath();
    x.moveTo(px, py);
    for (let k = 0; k < 4 + Math.floor(r() * 4); k++) {
      const horiz = r() > 0.5;
      const len = 20 + r() * 90;
      if (horiz) px += (r() > 0.5 ? 1 : -1) * len; else py += (r() > 0.5 ? 1 : -1) * len;
      x.lineTo(px, py);
    }
    x.stroke();
    x.beginPath();
    x.arc(px, py, 3 + r() * 3, 0, Math.PI * 2);
    x.fillStyle = color;
    x.fill();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The chest emblem: a glowing hexagon holding a tree of circuits. */
export function emblemTexture() {
  const s = 256;
  const c = canvas(s, s);
  const x = c.getContext('2d');
  x.fillStyle = '#000';
  x.fillRect(0, 0, s, s);
  x.strokeStyle = ORANGE;
  x.lineWidth = 6;
  x.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const px = s / 2 + Math.cos(a) * 110, py = s / 2 + Math.sin(a) * 110;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.closePath();
  x.stroke();
  x.lineWidth = 5;
  x.lineCap = 'round';
  const branch = (bx, by, len, ang, depth) => {
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    x.beginPath(); x.moveTo(bx, by); x.lineTo(ex, ey); x.stroke();
    x.beginPath(); x.arc(ex, ey, 4, 0, Math.PI * 2); x.fillStyle = ORANGE; x.fill();
    if (depth > 0) { branch(ex, ey, len * 0.66, ang - 0.6, depth - 1); branch(ex, ey, len * 0.66, ang + 0.6, depth - 1); }
  };
  branch(s / 2, s / 2 + 70, 50, -Math.PI / 2, 3);
  return tex(c);
}

/** A carved pumpkin face: the colour map and the glowing cut-outs. */
export function pumpkinTextures() {
  const w = 512, h = 256;
  const face = (ctx) => {
    ctx.beginPath(); ctx.moveTo(190, 90); ctx.lineTo(240, 125); ctx.lineTo(170, 125); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(322, 90); ctx.lineTo(342, 125); ctx.lineTo(272, 125); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(150, 165);
    for (let i = 0; i <= 8; i++) ctx.lineTo(150 + i * 26.5, 165 + (i % 2 ? 22 : 0));
    ctx.lineTo(362, 195); ctx.lineTo(150, 195); ctx.closePath(); ctx.fill();
  };
  const cm = canvas(w, h); let x = cm.getContext('2d');
  x.fillStyle = '#e8691b'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 10;
  for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo((i * w) / 8, 0); x.lineTo((i * w) / 8, h); x.stroke(); }
  x.fillStyle = '#120600'; face(x);
  const em = canvas(w, h); x = em.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#ffb347'; face(x);
  return { map: tex(cm), emissiveMap: tex(em) };
}

/** Icons for the agent nodes: simple vector glyphs on a dark disc. */
export function iconTexture(kind, color = BLUE) {
  const s = 128;
  const c = canvas(s, s);
  const x = c.getContext('2d');
  x.clearRect(0, 0, s, s);
  x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 7; x.lineCap = 'round'; x.lineJoin = 'round';
  x.font = 'bold 54px "Segoe UI", Helvetica, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const m = s / 2;
  switch (kind) {
    case 'code': x.fillText('</>', m, m + 2); break;
    case 'chart': [28, 54, 40, 80].forEach((hgt, i) => x.fillRect(26 + i * 22, 100 - hgt, 14, hgt)); break;
    case 'globe':
      x.beginPath(); x.arc(m, m, 40, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.ellipse(m, m, 16, 40, 0, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.moveTo(24, m); x.lineTo(104, m); x.stroke(); break;
    case 'palette':
      x.beginPath(); x.arc(m, m, 40, 0.4, Math.PI * 2 - 0.4); x.stroke();
      [[48, 46], [72, 40], [90, 60]].forEach(([px, py]) => { x.beginPath(); x.arc(px, py, 7, 0, Math.PI * 2); x.fill(); }); break;
    case 'mail':
      x.strokeRect(22, 36, 84, 56); x.beginPath(); x.moveTo(22, 36); x.lineTo(m, 72); x.lineTo(106, 36); x.stroke(); break;
    case 'gear':
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; x.beginPath(); x.moveTo(m + Math.cos(a) * 30, m + Math.sin(a) * 30); x.lineTo(m + Math.cos(a) * 46, m + Math.sin(a) * 46); x.stroke(); }
      x.beginPath(); x.arc(m, m, 28, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(m, m, 10, 0, Math.PI * 2); x.stroke(); break;
    case 'cube':
      x.beginPath(); x.moveTo(m, 24); x.lineTo(104, 46); x.lineTo(104, 90); x.lineTo(m, 112); x.lineTo(24, 90); x.lineTo(24, 46); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(24, 46); x.lineTo(m, 68); x.lineTo(104, 46); x.moveTo(m, 68); x.lineTo(m, 112); x.stroke(); break;
    case 'flask':
      x.beginPath(); x.moveTo(52, 22); x.lineTo(52, 56); x.lineTo(28, 104); x.lineTo(100, 104); x.lineTo(76, 56); x.lineTo(76, 22); x.closePath(); x.stroke();
      x.fillRect(40, 84, 48, 14); break;
    case 'list':
      [40, 64, 88].forEach((py) => { x.beginPath(); x.arc(32, py, 6, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(50, py); x.lineTo(100, py); x.stroke(); }); break;
    case 'brain':
      x.beginPath(); x.arc(m - 14, m, 30, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(m + 14, m, 30, 0, Math.PI * 2); x.stroke(); break;
    default: x.fillText('?', m, m);
  }
  return tex(c);
}

/**
 * The floating screens. Each returns a texture and an update(t) that redraws
 * the moving parts so the room never sits still.
 */
export function panelTexture(kind, seed = 3) {
  const w = 512, h = 320;
  const c = canvas(w, h);
  const x = c.getContext('2d');
  const r = rand(seed);
  const t = tex(c);
  const base = () => {
    x.fillStyle = '#060a16'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(95,208,255,0.12)'; x.lineWidth = 1;
    for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
    for (let i = 0; i < h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    x.fillStyle = 'rgba(95,208,255,0.9)'; x.font = '600 14px "Segoe UI", Helvetica, Arial, sans-serif'; x.textBaseline = 'top';
  };
  const lines = Array.from({ length: 40 }, () => ({ w: 60 + r() * 300, i: Math.floor(r() * 4), c: ['#5fd0ff', '#ff8a2a', '#a46bff', '#8de39c'][Math.floor(r() * 4)] }));
  const bars = Array.from({ length: 14 }, () => 0.3 + r() * 0.7);
  const blips = Array.from({ length: 30 }, () => ({ x: r(), y: 0.2 + r() * 0.6, p: r() * 6 }));
  const update = (time = 0) => {
    base();
    if (kind === 'code') {
      x.fillText('BUILD  //  main.js  //  all green, obviously', 14, 10);
      const off = (time * 18) % 24;
      for (let i = 0; i < 12; i++) {
        const L = lines[(i + Math.floor(time * 0.75)) % lines.length];
        x.fillStyle = L.c; x.globalAlpha = 0.85;
        x.fillRect(16 + L.i * 20, 44 + i * 24 - off, L.w, 10);
        x.globalAlpha = 1;
      }
    } else if (kind === 'chart') {
      x.fillText('METRICS  //  interruptions per hour', 14, 10);
      bars.forEach((b, i) => {
        const v = b + Math.sin(time * 1.3 + i) * 0.08;
        const bh = v * 220;
        x.fillStyle = i % 3 ? '#5fd0ff' : '#ff8a2a';
        x.fillRect(22 + i * 34, 300 - bh, 22, bh);
      });
      x.strokeStyle = '#a46bff'; x.lineWidth = 3; x.beginPath();
      bars.forEach((b, i) => { const v = 300 - (0.4 + 0.3 * Math.sin(time * 0.6 + i * 0.7)) * 220; i ? x.lineTo(33 + i * 34, v) : x.moveTo(33, v); });
      x.stroke();
    } else if (kind === 'map') {
      x.fillText('WORLD  //  where the threads go', 14, 10);
      x.strokeStyle = 'rgba(95,208,255,0.35)'; x.lineWidth = 2;
      x.beginPath(); x.ellipse(w / 2, h / 2 + 10, 220, 110, 0, 0, Math.PI * 2); x.stroke();
      blips.forEach((b) => {
        const a = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + b.p));
        x.fillStyle = `rgba(255,138,42,${a})`;
        x.beginPath(); x.arc(40 + b.x * 430, 60 + b.y * 220, 4, 0, Math.PI * 2); x.fill();
      });
    } else if (kind === 'flow') {
      x.fillText('PIPELINE  //  think, build, ship, sigh', 14, 10);
      const steps = ['think', 'build', 'ship', 'sigh'];
      const on = Math.floor(time * 0.8) % 4;
      steps.forEach((s, i) => {
        const px = 40 + i * 120, py = 130;
        x.fillStyle = i === on ? '#ff8a2a' : '#1a2a44'; x.strokeStyle = '#5fd0ff'; x.lineWidth = 2;
        x.fillRect(px, py, 90, 60); x.strokeRect(px, py, 90, 60);
        x.fillStyle = '#fff'; x.font = '600 18px "Segoe UI", Helvetica, Arial, sans-serif'; x.fillText(s, px + 14, py + 20);
        x.font = '600 14px "Segoe UI", Helvetica, Arial, sans-serif';
        if (i < 3) { x.strokeStyle = '#a46bff'; x.beginPath(); x.moveTo(px + 90, py + 30); x.lineTo(px + 120, py + 30); x.stroke(); }
      });
      x.fillStyle = '#8de39c'; x.fillText('✓ 31 tasks closed   ✓ 0 bugs (mine)   ✗ 4 bugs (yours)', 14, 240);
    } else if (kind === 'castle') {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a0f4a'); g.addColorStop(1, '#0a0516');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#ffb347'; x.beginPath(); x.arc(380, 90, 48, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#12061e';
      [[60, 200, 50, 120], [130, 160, 70, 160], [220, 120, 80, 200], [320, 170, 60, 150], [400, 210, 50, 110]].forEach(([px, py, pw, ph]) => { x.fillRect(px, py, pw, ph); x.beginPath(); x.moveTo(px - 6, py); x.lineTo(px + pw / 2, py - 40); x.lineTo(px + pw + 6, py); x.closePath(); x.fill(); });
      x.fillStyle = `rgba(255,179,71,${0.5 + 0.5 * Math.abs(Math.sin(time * 2))})`;
      [[150, 200], [250, 170], [340, 210]].forEach(([px, py]) => x.fillRect(px, py, 10, 16));
      for (let i = 0; i < 5; i++) { const bx = (120 + i * 70 + time * 30) % w, by = 60 + Math.sin(time * 2 + i) * 20; x.fillStyle = '#000'; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx - 12, by - 8); x.lineTo(bx - 4, by); x.lineTo(bx + 4, by); x.lineTo(bx + 12, by - 8); x.closePath(); x.fill(); }
      x.fillStyle = 'rgba(255,255,255,0.8)'; x.font = '600 14px "Segoe UI", Helvetica, Arial, sans-serif'; x.fillText('MOOD BOARD  //  seasonal, allegedly', 14, 10);
    } else if (kind === 'chat') {
      x.fillText('INBOX  //  do not disturb (ignored)', 14, 10);
      const msgs = ['Quick question?', 'Got a sec?', 'Can you look at this', 'URGENT (it is not)', 'ping', 'One more thing'];
      msgs.forEach((mm, i) => {
        const on = Math.floor(time * 0.7) % msgs.length === i;
        x.fillStyle = on ? 'rgba(255,138,42,0.25)' : 'rgba(95,208,255,0.08)';
        x.fillRect(14, 40 + i * 44, 484, 36);
        x.fillStyle = '#5fd0ff'; x.beginPath(); x.arc(36, 58 + i * 44, 12, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#e9f3ff'; x.fillText(mm, 60, 50 + i * 44);
      });
    } else if (kind === 'blueprint') {
      x.fillText('MODEL  //  the community, again', 14, 10);
      x.strokeStyle = '#5fd0ff'; x.lineWidth = 2;
      const s = 1 + Math.sin(time * 0.5) * 0.04;
      x.save(); x.translate(w / 2, h / 2 + 20); x.scale(s, s);
      for (let i = 0; i < 5; i++) { const bw = 40 + i * 12, bh = 60 + (i * 37) % 90; x.strokeRect(-200 + i * 85, -bh / 2, bw, bh); for (let j = 0; j < 4; j++) { x.beginPath(); x.moveTo(-200 + i * 85, -bh / 2 + (j + 1) * bh / 5); x.lineTo(-200 + i * 85 + bw, -bh / 2 + (j + 1) * bh / 5); x.stroke(); } }
      x.restore();
    }
    t.needsUpdate = true;
  };
  update(0);
  return { texture: t, update };
}

/** A soft radial puff for the floor fog. */
export function fogTexture() {
  const s = 256;
  const c = canvas(s, s);
  const x = c.getContext('2d');
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(120,140,200,0.35)');
  g.addColorStop(1, 'rgba(120,140,200,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  return tex(c);
}
