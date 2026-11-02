// Wiring: scene, camera, pointer, the bubble he speaks through, the drag,
// the question box and the header controls.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAvatar } from './avatar.js';
import { createWorld } from './world.js';
import { say, SIGHS, TOUCH, HELP, DRAG, RETURN, IDLE, GREETING, ASK, ASK_DEFAULT } from './quips.js';
import { voice, ambience } from './voice.js';

const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Scene -----------------------------------------------------------------------
const canvas = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
camera.position.set(0, 2.1, 8.2);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 3.5;
controls.maxDistance = 14;
controls.minPolarAngle = 0.9;
controls.maxPolarAngle = 1.75;
controls.minAzimuthAngle = -1.1;
controls.maxAzimuthAngle = 1.1;
controls.autoRotate = !reduced;
controls.autoRotateSpeed = 0.25;

const world = createWorld(scene);
const avatar = createAvatar();
avatar.group.scale.setScalar(1.2);
scene.add(avatar.group);

// A real model of him, if one has been dropped in (see README): the meta tag
// names the file in public/, the procedural body steps aside, the throne,
// threads and moods stay.
const glb = document.querySelector('meta[name="avatar-glb"]')?.content?.trim();
if (glb) {
  new GLTFLoader().load(`./${glb}`, (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const s = 2.1 / Math.max(size.y, 0.01);
    model.scale.setScalar(s);
    box.setFromObject(model);
    model.position.set(-box.getCenter(new THREE.Vector3()).x, 0.92 - box.min.y, 0.15 - box.getCenter(new THREE.Vector3()).z);
    avatar.parts.body.visible = false;
    avatar.group.add(model);
    avatar.model = model;
  }, undefined, () => speak('The model did not load. You get the hologram. Lucky you.', { tone: 'snob' }));
}
const interactive = [...world.interactive, ...avatar.interactive];

const resize = () => {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
};
addEventListener('resize', resize);
resize();

// ---- Speech ------------------------------------------------------------------------
const bubble = $('bubble');
const bubbleText = $('bubble-text');
const counters = { pokes: 0, sighs: 0, helps: 0 };
const paintCounters = () => { $('c-pokes').textContent = counters.pokes; $('c-sighs').textContent = counters.sighs; $('c-helps').textContent = counters.helps; };
let bubbleTimer = null;
let helpTimer = null;
const speak = (text, { hold = 5200, tone = 'snob' } = {}) => {
  bubbleText.textContent = text;
  bubble.dataset.tone = tone;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), hold);
  voice.say(text);
  log(text, tone);
};
const logEl = $('log');
const log = (text, tone) => {
  const li = document.createElement('li');
  li.dataset.tone = tone;
  li.textContent = text;
  logEl.prepend(li);
  while (logEl.children.length > 8) logEl.lastChild.remove();
};

/** Snobby line now, the sigh, then the help. */
const react = (kind, id, label, worldPos) => {
  counters.pokes += 1;
  avatar.lookAt(worldPos, 4);
  avatar.setMood('annoyed', 2.2);
  const key = TOUCH[id] ? id : TOUCH[kind] ? kind : 'any';
  const snob = Math.random() < 0.6 && TOUCH[key] !== TOUCH.any ? say(key, TOUCH[key]) : say('any', TOUCH.any);
  speak(`${snob}`, { tone: 'snob', hold: 3200 });
  clearTimeout(helpTimer);
  helpTimer = setTimeout(() => {
    counters.sighs += 1;
    const sigh = say('sigh', SIGHS);
    const helpKey = HELP[id] ? id : HELP[kind] ? kind : 'any';
    const help = say(`help-${helpKey}`, HELP[helpKey]);
    counters.helps += 1;
    avatar.setMood('helping', 4);
    speak(`${sigh} ${help.replace(/^Fine\. /, '')}`, { tone: 'help', hold: 9000 });
    paintCounters();
  }, 2600);
  paintCounters();
  flash(worldPos);
};

// a small ring of light where you touched
const flashMesh = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.08, 32), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
scene.add(flashMesh);
let flashAt = -10;
const flash = (p) => { flashMesh.position.copy(p); flashAt = clock.elapsedTime; };

// ---- Pointer --------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-9, -9);
const pointerWorld = new THREE.Vector3();
let hovered = null;
let pressed = null;
let pressAt = null;
let dragging = false;
const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const hit = new THREE.Vector3();
const setPointer = (e) => { const r = canvas.getBoundingClientRect(); pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
const pickAt = () => { raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(interactive, false); return hits[0] || null; };
const isAvatar = (o) => { let p = o; while (p) { if (p === avatar.group) return true; p = p.parent; } return false; };
const highlight = (o, on) => {
  if (!o) return;
  const m = o.material;
  if (!m) return;
  if (m.emissive && m.userData.base === undefined) m.userData.base = m.emissiveIntensity;
  if (m.emissive) m.emissiveIntensity = on ? (m.userData.base ?? 1) * 1.8 + 0.6 : m.userData.base ?? 1;
  else if ('opacity' in m && m.transparent) { if (m.userData.base === undefined) m.userData.base = m.opacity; m.opacity = on ? Math.min(1, m.userData.base + 0.25) : m.userData.base; }
};
let lastDragLine = 0;
let dragDist = 0;

canvas.addEventListener('pointermove', (e) => {
  setPointer(e);
  if (dragging) {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(dragPlane, hit)) { hit.sub(dragOffset); dragDist += hit.distanceTo(avatar.group.position); avatar.moveTo(hit); }
    const now = clock.elapsedTime;
    if (now - lastDragLine > 2.4 && dragDist > 0.6) { lastDragLine = now; speak(say('drag', DRAG), { tone: 'snob', hold: 2400 }); }
    return;
  }
  const h = pickAt();
  // where he looks when nothing is targeted: the pointer on a plane in front of him
  raycaster.ray.at(8, pointerWorld);
  const o = h ? h.object : null;
  if (o !== hovered) { highlight(hovered, false); hovered = o; highlight(hovered, true); }
  canvas.style.cursor = o ? (isAvatar(o) ? 'grab' : 'pointer') : '';
});
canvas.addEventListener('pointerdown', (e) => {
  setPointer(e);
  const h = pickAt();
  pressed = h ? h.object : null;
  pressAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  if (pressed && isAvatar(pressed)) {
    // begin a drag on the first real movement; a tap is a poke
    canvas.setPointerCapture(e.pointerId);
    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), avatar.group.position);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(dragPlane, hit);
    dragOffset.copy(hit).sub(avatar.group.position);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pressed || dragging || !pressAt) return;
  if (!isAvatar(pressed)) return;
  if (Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 8) {
    dragging = true;
    dragDist = 0;
    controls.enabled = false;
    canvas.style.cursor = 'grabbing';
    avatar.beginDrag();
    bubble.classList.remove('show');
    clearTimeout(helpTimer);
    speak(say('drag', DRAG), { tone: 'snob', hold: 2400 });
    lastDragLine = clock.elapsedTime;
    document.body.classList.add('dragging');
  }
});
const release = (e) => {
  if (dragging) {
    dragging = false;
    controls.enabled = true;
    canvas.style.cursor = 'grab';
    avatar.endDrag();
    document.body.classList.remove('dragging');
    counters.pokes += 1;
    counters.sighs += 1;
    paintCounters();
    setTimeout(() => speak(say('return', RETURN), { tone: 'help', hold: 3600 }), 900);
  } else if (pressed && pressAt && performance.now() - pressAt.t < 600) {
    const h = pickAt();
    if (h && h.object === pressed) {
      const d = h.object.userData || {};
      const kind = isAvatar(h.object) ? (d.kind || 'self') : d.kind;
      react(kind, d.id || kind, d.label || '', h.point.clone());
    }
  }
  pressed = null; pressAt = null;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('pointerleave', () => { if (!dragging) { highlight(hovered, false); hovered = null; pointer.set(-9, -9); } });

// ---- Idle chatter ------------------------------------------------------------------
let nextIdle = 14;
const idle = (t) => {
  if (t > nextIdle) {
    nextIdle = t + 16 + Math.random() * 14;
    if (!bubble.classList.contains('show') && !dragging) speak(say('idle', IDLE), { tone: 'idle', hold: 3600 });
  }
};

// ---- Controls --------------------------------------------------------------------
$('b-voice').addEventListener('click', (e) => {
  if (!voice.ready()) return speak('This browser has no voice. Imagine something dry.', { tone: 'snob' });
  voice.on = !voice.on;
  e.currentTarget.setAttribute('aria-pressed', String(voice.on));
  if (voice.on) speak('Voice on. Do not get used to it.', { tone: 'snob' }); else voice.stop();
});
$('b-sound').addEventListener('click', (e) => {
  if (ambience.on) ambience.stop(); else ambience.start();
  e.currentTarget.setAttribute('aria-pressed', String(ambience.on));
});
$('b-mesh').addEventListener('click', (e) => {
  avatar.setMeshed(!avatar.isMeshed());
  e.currentTarget.setAttribute('aria-pressed', String(avatar.isMeshed()));
  speak(avatar.isMeshed() ? 'Wireframe. You are looking at my mesh. Rude, but fine.' : 'Solid again. Better.', { tone: 'snob', hold: 3000 });
});
$('b-reset').addEventListener('click', () => {
  controls.reset();
  camera.position.set(0, 2.1, 8.2);
  controls.target.set(0, 1.8, 0);
  avatar.endDrag();
  speak('View reset. Me, unchanged.', { tone: 'idle', hold: 2500 });
});
$('ask').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('ask-input').value.trim();
  if (!q) return;
  $('ask-input').value = '';
  log(`You: ${q}`, 'you');
  const rule = ASK.find(([re]) => re.test(q));
  counters.pokes += 1; counters.helps += 1; paintCounters();
  avatar.setMood('helping', 4);
  avatar.lookAt(camera.position, 4);
  speak(rule ? rule[1] : say('askd', ASK_DEFAULT), { tone: 'help', hold: 8000 });
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') { bubble.classList.remove('show'); } });

// ---- Loop -----------------------------------------------------------------------------
const clock = new THREE.Clock();
const port = new THREE.Vector3();
const headScreen = new THREE.Vector3();
let last = 0;
const tick = () => {
  const t = clock.getElapsedTime();
  const dt = Math.min(0.05, t - last);
  last = t;
  controls.update();
  avatar.update(t, dt, pointer.x > -2 ? pointerWorld : null);
  avatar.portWorld(port);
  world.update(t, port);
  world.rim.position.copy(avatar.group.position).add(new THREE.Vector3(0, 0.7, 0.4));
  world.face.position.copy(avatar.group.position).add(new THREE.Vector3(1.0, 3.0, 2.4));
  // flash ring
  const age = t - flashAt;
  if (age < 0.8) { flashMesh.lookAt(camera.position); flashMesh.scale.setScalar(1 + age * 6); flashMesh.material.opacity = 0.9 * (1 - age / 0.8); } else flashMesh.material.opacity = 0;
  // bubble follows the head
  avatar.parts.head.getWorldPosition(headScreen);
  headScreen.y += 0.55;
  headScreen.project(camera);
  const r = canvas.getBoundingClientRect();
  bubble.style.left = `${r.left + ((headScreen.x + 1) / 2) * r.width}px`;
  bubble.style.top = `${r.top + ((1 - headScreen.y) / 2) * r.height}px`;
  idle(t);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};
tick();
setTimeout(() => speak(GREETING, { tone: 'help', hold: 9000 }), 1200);
paintCounters();
$('stage').dataset.ready = 'true';

window.__riz = { avatar, world, scene, camera, counters, react, speak, THREE };
