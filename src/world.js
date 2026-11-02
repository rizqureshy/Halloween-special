// The command centre around him: a dome of stars, floating screens, agent
// nodes on neural threads, the brain above, pumpkins and candles below, fog.
import * as THREE from 'three';
import { panelTexture, iconTexture, pumpkinTextures, fogTexture, ORANGE, BLUE, VIOLET } from './textures.js';

const V = THREE.Vector3;

export const PANELS = [
  { id: 'code', label: 'Build log', pos: [-5.6, 3.9, -2.8], w: 2.6 },
  { id: 'chart', label: 'Metrics', pos: [5.6, 4.0, -2.6], w: 2.6 },
  { id: 'map', label: 'World map', pos: [-6.0, 1.3, -1.4], w: 2.4 },
  { id: 'flow', label: 'Pipeline', pos: [6.0, 1.4, -1.3], w: 2.4 },
  { id: 'castle', label: 'Mood board', pos: [4.6, -0.6, -0.2], w: 2.0 },
  { id: 'chat', label: 'Inbox', pos: [-4.6, -0.5, -0.2], w: 2.0 },
  { id: 'blueprint', label: 'Community model', pos: [-2.6, 6.0, -5.0], w: 2.8 },
];

export const NODES = [
  { id: 'code', label: 'Code agent', pos: [-3.2, 4.2, -1.5] },
  { id: 'chart', label: 'Analyst agent', pos: [-1.2, 4.9, -2.2] },
  { id: 'globe', label: 'World agent', pos: [1.4, 5.0, -2.0] },
  { id: 'palette', label: 'Design agent', pos: [3.4, 4.3, -1.4] },
  { id: 'list', label: 'Planner agent', pos: [-4.2, 2.6, 0.2] },
  { id: 'cube', label: 'Builder agent', pos: [-3.8, 1.0, 1.6] },
  { id: 'flask', label: 'Research agent', pos: [-2.6, -0.2, 2.6] },
  { id: 'mail', label: 'Inbox agent', pos: [4.2, 2.5, 0.4] },
  { id: 'gear', label: 'Ops agent', pos: [3.8, 1.0, 1.7] },
];

export function createWorld(scene) {
  const interactive = [];
  const updaters = [];
  const glow = (color, intensity = 2) => new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: intensity, roughness: 0.5 });

  // ---- Stars and dome ---------------------------------------------------------
  const starCount = 1800;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 18 + Math.random() * 22, th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
    starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    starPos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) - 4;
    starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(starPos, 3)), new THREE.PointsMaterial({ color: 0x9fd8ff, size: 0.07, transparent: true, opacity: 0.8 }));
  scene.add(stars);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(16, 36, 18), new THREE.MeshBasicMaterial({ color: 0x1b2f55, wireframe: true, transparent: true, opacity: 0.12 }));
  dome.position.y = -2;
  scene.add(dome);
  const floor = new THREE.GridHelper(40, 40, 0x1f3a66, 0x12223d);
  floor.position.y = -1.2;
  floor.material.transparent = true; floor.material.opacity = 0.45;
  scene.add(floor);
  updaters.push((t) => { stars.rotation.y = t * 0.01; dome.rotation.y = -t * 0.004; });

  // ---- Lights ------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x5f7fbf, 0x120a1e, 0.55));
  const key = new THREE.DirectionalLight(0xbfd8ff, 1.2);
  key.position.set(3, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(ORANGE, 14, 12, 2);
  rim.position.set(0, 0.6, 0.2);
  scene.add(rim);
  const blueFill = new THREE.PointLight(BLUE, 10, 14, 2);
  blueFill.position.set(0, 4.5, -1);
  scene.add(blueFill);
  const face = new THREE.PointLight(0xffd2b0, 9, 7, 2);
  face.position.set(1, 2.6, 2.4);
  scene.add(face);

  // ---- The brain ------------------------------------------------------------------
  const brain = new THREE.Group();
  brain.position.set(0, 4.3, -1.1);
  const brainCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 2), new THREE.MeshStandardMaterial({ color: 0x2a1a5e, emissive: new THREE.Color(VIOLET), emissiveIntensity: 1.2, roughness: 0.3, transparent: true, opacity: 0.85 }));
  brainCore.userData = { kind: 'brain', id: 'brain', label: 'The brain' };
  const brainWire = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 3), new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: 0.35 }));
  brainWire.userData = { kind: 'brain', id: 'brain', label: 'The brain' };
  const brainHalo = new THREE.Mesh(new THREE.SphereGeometry(1.25, 24, 16), new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
  brain.add(brainCore, brainWire, brainHalo);
  scene.add(brain);
  interactive.push(brainCore, brainWire);
  updaters.push((t) => { brainCore.rotation.y = t * 0.25; brainWire.rotation.y = -t * 0.15; brainWire.rotation.x = t * 0.1; const p = 1 + Math.sin(t * 2.4) * 0.05; brainCore.scale.setScalar(p); brainCore.material.emissiveIntensity = 1.1 + Math.sin(t * 2.4) * 0.5; });

  // ---- Panels ---------------------------------------------------------------------
  const panels = PANELS.map((p) => {
    const g = new THREE.Group();
    g.position.set(...p.pos);
    const h = p.w * 0.625;
    const { texture, update } = panelTexture(p.id, p.pos[0] * 7 + 3);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(p.w, h), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
    screen.userData = { kind: 'panel', id: p.id, label: p.label };
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(p.w + 0.08, h + 0.08)), new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.7 }));
    const back = new THREE.Mesh(new THREE.PlaneGeometry(p.w + 0.08, h + 0.08), new THREE.MeshBasicMaterial({ color: 0x0a1024, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    back.position.z = -0.01;
    g.add(back, screen, frame);
    g.lookAt(0, 1.8, 0);
    scene.add(g);
    interactive.push(screen);
    const phase = Math.random() * 6;
    updaters.push((t) => { if (Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) update(t); g.position.y = p.pos[1] + Math.sin(t * 0.6 + phase) * 0.08; });
    return { ...p, group: g, screen, frame };
  });

  // ---- Agent nodes --------------------------------------------------------------
  const nodes = NODES.map((n) => {
    const g = new THREE.Group();
    g.position.set(...n.pos);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 32), glow(BLUE, 1.2));
    disc.material.transparent = true; disc.material.opacity = 0.75;
    const discRing = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.02, 8, 40), glow(BLUE, 2.5));
    discRing.rotation.x = Math.PI / 2;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b2a4a, emissive: new THREE.Color(BLUE), emissiveIntensity: 0.35, roughness: 0.4, transparent: true, opacity: 0.9 });
    const bot = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.22, 4, 12), bodyMat);
    bot.position.y = 0.32;
    const botHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), bodyMat);
    botHead.position.y = 0.66;
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), glow(VIOLET, 3));
    visor.position.set(0, 0.68, 0.11);
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(n.id), transparent: true, depthWrite: false }));
    icon.scale.set(0.5, 0.5, 1);
    icon.position.y = 1.15;
    [disc, discRing, bot, botHead, visor, icon].forEach((m) => { m.userData = { kind: 'node', id: n.id, label: n.label }; interactive.push(m); });
    g.add(disc, discRing, bot, botHead, visor, icon);
    scene.add(g);
    const phase = Math.random() * 6;
    updaters.push((t) => { g.position.y = n.pos[1] + Math.sin(t * 0.8 + phase) * 0.12; bot.rotation.y = Math.sin(t * 0.7 + phase) * 0.6; botHead.rotation.y = bot.rotation.y; visor.position.x = Math.sin(t * 0.7 + phase) * 0.6 * 0.11; discRing.rotation.z = t * 0.6; });
    return { ...n, group: g, disc, bot, botHead };
  });

  // ---- Neural threads ------------------------------------------------------------
  const threadMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const from = new V();
  const threads = nodes.map((n, i) => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), threadMat);
    mesh.frustumCulled = false;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), beadMat);
    scene.add(mesh, bead);
    return { mesh, bead, node: n, offset: i * 0.37, curve: null };
  });
  let stretch = 0;
  const rebuild = (portPos) => {
    for (const th of threads) {
      const to = th.node.group.position;
      const mid = new V().addVectors(portPos, to).multiplyScalar(0.5);
      mid.y += 0.6 + Math.abs(portPos.x - to.x) * 0.1;
      const dist = portPos.distanceTo(to);
      stretch = Math.max(stretch, dist);
      th.curve = new THREE.CatmullRomCurve3([portPos.clone(), mid, to.clone()]);
      const g = new THREE.TubeGeometry(th.curve, 24, 0.014 + Math.max(0, 0.02 - dist * 0.002), 6, false);
      th.mesh.geometry.dispose();
      th.mesh.geometry = g;
    }
  };
  const updateThreads = (t, portPos) => {
    if (!threads[0].curve || portPos.distanceToSquared(from) > 1e-6) { rebuild(portPos); from.copy(portPos); }
    for (const th of threads) { const k = (t * 0.25 + th.offset) % 1; th.curve.getPointAt(k, th.bead.position); }
    threadMat.opacity = 0.45 + Math.sin(t * 2) * 0.12;
  };

  // ---- Pumpkins and candles ----------------------------------------------------------
  const { map, emissiveMap } = pumpkinTextures();
  const pumpkinMat = new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: new THREE.Color(0xffb347), emissiveIntensity: 1.6, roughness: 0.6 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x2f4a1e, roughness: 0.9 });
  const pumpkins = [[-2.6, -1.0, 1.4, 0.5], [2.8, -1.0, 1.3, 0.55], [-4.4, -1.05, -0.6, 0.42], [4.2, -1.05, -0.8, 0.4]].map(([x, y, z, r]) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), pumpkinMat);
    body.scale.set(1.1, 0.85, 1.1);
    body.userData = { kind: 'pumpkin', id: 'pumpkin', label: 'A pumpkin' };
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.22, 8), stemMat);
    stem.position.y = r * 0.9;
    stem.rotation.z = 0.2;
    g.add(body, stem);
    g.lookAt(0, y, 0);
    const light = new THREE.PointLight(0xffa040, 2.5, 4, 2);
    light.position.set(0, 0.1, 0.4);
    g.add(light);
    scene.add(g);
    interactive.push(body);
    updaters.push((t) => { light.intensity = 2 + Math.sin(t * 11 + x) * 0.5 + Math.random() * 0.3; });
    return g;
  });
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xf1e8d6, roughness: 0.8 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95 });
  [[-1.9, -1.1, 2.0, 0.35], [-1.4, -1.1, 1.7, 0.22], [1.7, -1.1, 2.0, 0.3], [2.2, -1.1, 1.7, 0.2], [-3.6, -1.1, 0.4, 0.3], [3.6, -1.1, 0.3, 0.26]].forEach(([x, y, z, h], i) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, h, 12), waxMat);
    wax.position.y = h / 2;
    wax.userData = { kind: 'candle', id: 'candle', label: 'A candle' };
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 8), flameMat);
    flame.position.y = h + 0.07;
    g.add(wax, flame);
    if (i < 3) { const light = new THREE.PointLight(0xffc070, 1.6, 3, 2); light.position.y = h + 0.15; g.add(light); updaters.push((t) => { light.intensity = 1.3 + Math.sin(t * 13 + i) * 0.3 + Math.random() * 0.25; }); }
    scene.add(g);
    interactive.push(wax);
    updaters.push((t) => { flame.scale.set(1 + Math.sin(t * 15 + i) * 0.15, 1 + Math.sin(t * 11 + i) * 0.25, 1); flame.position.x = Math.sin(t * 9 + i) * 0.01; });
  });

  // ---- Floor fog -------------------------------------------------------------------
  const fogTex = fogTexture();
  const puffs = Array.from({ length: 14 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, transparent: true, opacity: 0.5, depthWrite: false }));
    s.position.set((Math.random() - 0.5) * 12, -1 + Math.random() * 0.4, (Math.random() - 0.5) * 8 + 1);
    s.scale.setScalar(3 + Math.random() * 3);
    s.userData.v = 0.1 + Math.random() * 0.15;
    s.userData.i = i;
    scene.add(s);
    return s;
  });
  updaters.push((t) => { for (const p of puffs) { p.position.x += p.userData.v * 0.016 * (p.userData.i % 2 ? 1 : -1); if (p.position.x > 8) p.position.x = -8; if (p.position.x < -8) p.position.x = 8; p.material.opacity = 0.35 + Math.sin(t * 0.4 + p.userData.i) * 0.12; } });

  scene.fog = new THREE.FogExp2(0x05060f, 0.028);
  scene.background = new THREE.Color(0x05060f);

  const update = (t, portPos) => { for (const u of updaters) u(t); updateThreads(t, portPos); };
  return { interactive, panels, nodes, threads, brain, pumpkins, update, rim, face };
}
