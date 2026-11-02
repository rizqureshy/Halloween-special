// Wiring: scene, camera, pointer, the bubble he speaks through, the drag,
// the question box and the header controls.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createAvatar } from './avatar.js';
import { createWorld } from './world.js';
import { say, SIGHS, TOUCH, HELP, DRAG, RETURN, IDLE, GREETING, ASK, ASK_DEFAULT, LAUGHS, LINGO, DANGER, BOOT, AFTER_LAUGH } from './quips.js';
import { voice, ambience } from './voice.js';
import { recorded } from './lines-audio.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
// a little studio environment so chrome and metal have something to reflect
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;
pmrem.dispose();
const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
camera.position.set(0, 2.2, 6.9);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.95, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 14;
controls.minPolarAngle = 0.9;
controls.maxPolarAngle = 1.75;
controls.minAzimuthAngle = -1.1;
controls.maxAzimuthAngle = 1.1;
controls.autoRotate = !reduced;
controls.autoRotateSpeed = 0.25;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.5, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const world = createWorld(scene);
const avatar = createAvatar();
avatar.group.scale.setScalar(1.2);
scene.add(avatar.group);

// A real model of him, if one has been dropped in (see README): the meta tag
// names the file in public/, the procedural body steps aside, the threads and
// moods stay. If the model already includes his chair, a second meta tag hides
// the procedural throne too.
const glb = document.querySelector('meta[name="avatar-glb"]')?.content?.trim();
const glbThrone = document.querySelector('meta[name="avatar-glb-throne"]')?.content?.trim() || 'procedural';
const glbYaw = Number(document.querySelector('meta[name="avatar-glb-yaw"]')?.content || 0) * Math.PI / 180;
if (glb) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder); // scripts/pack-avatar.mjs compresses with meshopt
  loader.load(`./${glb}`, (gltf) => {
    const model = gltf.scene;
    model.rotation.y = glbYaw; // image-to-3D models often face sideways; the meta tag turns him to the camera
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    // body only: the procedural throne stays and he sits on it; seat: the model brings its own seat
    // and the throne's back, wings and rings frame it; included: the model is the whole chair.
    const targetHeight = glbThrone === 'procedural' ? 2.3 : glbThrone === 'seat' ? 2.75 : 3.1;
    const s = targetHeight / Math.max(size.y, 0.01);
    model.scale.setScalar(s);
    box.setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    const floor = glbThrone === 'procedural' ? 0.92 : glbThrone === 'seat' ? 0.56 : 0.3;
    model.position.set(-c.x, floor - box.min.y, (glbThrone === 'procedural' ? 0.15 : 0.1) - c.z);
    avatar.parts.body.visible = false;
    avatar.setThroneMode(glbThrone);
    avatar.registerModel(model);
    avatar.group.add(model);
    avatar.model = model;
    // the bubble hangs above the model's head
    box.setFromObject(model);
    avatar.modelTop = new THREE.Vector3(0, box.max.y - avatar.group.position.y, box.getCenter(new THREE.Vector3()).z - avatar.group.position.z);
    interactive.push(...avatar.interactive.filter((o) => !interactive.includes(o)));
  }, undefined, () => speak('The model did not load. You get the hologram. Lucky you.', { tone: 'snob' }));
}
const interactive = [...world.interactive, ...avatar.interactive];

const resize = () => {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
};
addEventListener('resize', resize);
resize();

// ---- Speech ------------------------------------------------------------------------
const bubble = $('bubble');
const bubbleText = $('bubble-text');
const counters = { pokes: 0, sighs: 0, helps: 0, laughs: 0 };
const paintCounters = () => { $('c-pokes').textContent = counters.pokes; $('c-sighs').textContent = counters.sighs; $('c-helps').textContent = counters.helps; $('c-laughs').textContent = counters.laughs; };
let bubbleTimer = null;
const chain = [];
/** How long a line holds the bubble: the recording's length when voice is on, else reading time. */
const holdFor = (text) => {
  const rec = voice.on ? recorded.duration(text) : 0;
  return rec ? rec * 1000 + 350 : Math.max(2400, Math.min(9000, 1400 + text.length * 48));
};
const speak = (text, { hold, tone = 'snob' } = {}) => {
  bubbleText.textContent = text;
  bubble.dataset.tone = tone;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), hold ?? holdFor(text));
  if (voice.on) { if (!recorded.play(text)) voice.say(text); }
  log(text, tone);
};
/** Say several lines one after another, each when the previous one has finished. */
const speakAll = (lines) => {
  chain.forEach(clearTimeout); chain.length = 0;
  let at = 0;
  for (const l of lines) {
    const hold = l.hold ?? holdFor(l.text);
    chain.push(setTimeout(() => { speak(l.text, { tone: l.tone, hold }); if (l.mood) avatar.setMood(l.mood, hold / 1000 + 0.3); l.then?.(); }, at));
    at += hold + (l.gap ?? 250);
  }
  return at;
};
const logEl = $('log');
const log = (text, tone) => {
  const li = document.createElement('li');
  li.dataset.tone = tone;
  li.textContent = text;
  logEl.prepend(li);
  while (logEl.children.length > 8) logEl.lastChild.remove();
};

/** Snobby line now, a sigh, sometimes a terrible idea he takes straight back, then the help. */
const react = (kind, id, label, worldPos) => {
  counters.pokes += 1;
  avatar.lookAt(worldPos, 4);
  avatar.setMood('annoyed', 2.2);
  const key = TOUCH[id] ? id : TOUCH[kind] ? kind : 'any';
  const snob = Math.random() < 0.6 && TOUCH[key] !== TOUCH.any ? say(key, TOUCH[key]) : say('any', TOUCH.any);
  const helpKey = HELP[id] ? id : HELP[kind] ? kind : 'any';
  const lines = [{ text: snob, tone: 'snob', mood: 'annoyed' }];
  if (Math.random() < 0.4) lines.push({ text: say('lingo', LINGO), tone: 'lingo', mood: 'helping' });
  lines.push({ text: say('sigh', SIGHS), tone: 'snob', gap: 150, then: () => { counters.sighs += 1; paintCounters(); } });
  if (Math.random() < 0.35) {
    lines.push({ text: say('danger', DANGER), tone: 'danger', mood: 'laughing', then: () => { counters.helps += 1; counters.laughs += 1; paintCounters(); } });
  } else {
    lines.push({ text: say(`help-${helpKey}`, HELP[helpKey]).replace(/^Fine\. /, ''), tone: 'help', mood: 'helping', then: () => { counters.helps += 1; paintCounters(); } });
    if (Math.random() < 0.3) lines.push({ text: say('laugh', LAUGHS), tone: 'laugh', mood: 'laughing', then: () => { counters.laughs += 1; paintCounters(); } });
  }
  speakAll(lines);
  paintCounters();
  flash(worldPos);
};
/** The villain laugh on demand. */
const laugh = () => {
  counters.laughs += 1;
  paintCounters();
  avatar.lookAt(camera.position, 4);
  speakAll([{ text: say('laugh', LAUGHS), tone: 'laugh', mood: 'laughing' }, { text: say('afterlaugh', AFTER_LAUGH), tone: 'help', mood: 'helping' }]);
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
    chain.forEach(clearTimeout); chain.length = 0;
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
    if (!bubble.classList.contains('show') && !dragging) { const lingo = Math.random() < 0.45; speak(lingo ? say('lingo', LINGO) : say('idle', IDLE), { tone: lingo ? 'lingo' : 'idle' }); }
  }
};

// ---- Controls --------------------------------------------------------------------
$('b-voice').addEventListener('click', (e) => {
  recorded.unlock();
  voice.on = !voice.on;
  e.currentTarget.setAttribute('aria-pressed', String(voice.on));
  if (voice.on) speak('Voice on. Do not get used to it.', { tone: 'snob' }); else { recorded.stop(); voice.stop(); }
});
// The live him: an ElevenLabs conversational agent, loaded only when asked for.
const AGENT = 'agent_5201m6eq1ew0erk908bj3v1nyd89';
$('b-talk').addEventListener('click', (e) => {
  const host = $('talk-host');
  if (host.dataset.mounted) { host.hidden = !host.hidden; e.currentTarget.setAttribute('aria-pressed', String(!host.hidden)); return; }
  host.dataset.mounted = 'true';
  host.hidden = false;
  e.currentTarget.setAttribute('aria-pressed', 'true');
  const widget = document.createElement('elevenlabs-convai');
  widget.setAttribute('agent-id', AGENT);
  host.appendChild(widget);
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
  script.async = true;
  script.type = 'text/javascript';
  document.body.appendChild(script);
  speak('Oh, you want to talk. Fine. Press the button. I will sigh first.', { tone: 'snob', hold: 5000 });
  avatar.setMood('helping', 5);
});
$('b-laugh').addEventListener('click', () => laugh());
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
  const answer = rule ? rule[1] : say('askd', ASK_DEFAULT);
  if (/Mwaha|Ha!|Heh/.test(answer)) { counters.laughs += 1; paintCounters(); avatar.setMood('laughing', 3); setTimeout(() => avatar.setMood('helping', 4), 3000); }
  speak(answer, { tone: /Mwaha/.test(answer) ? 'danger' : 'help' });
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
  if (avatar.modelTop) { headScreen.copy(avatar.modelTop); headScreen.y += 0.35; avatar.group.localToWorld(headScreen); }
  else { avatar.parts.head.getWorldPosition(headScreen); headScreen.y += 0.55; }
  headScreen.project(camera);
  const r = canvas.getBoundingClientRect();
  bubble.style.left = `${r.left + ((headScreen.x + 1) / 2) * r.width}px`;
  bubble.style.top = `${r.top + ((1 - headScreen.y) / 2) * r.height}px`;
  idle(t);
  composer.render();
  requestAnimationFrame(tick);
};
tick();
setTimeout(() => speakAll([{ text: say('boot', BOOT), tone: 'lingo', hold: 3800 }, { text: GREETING, tone: 'help', hold: 9000, mood: 'helping' }]), 1200);
paintCounters();
$('stage').dataset.ready = 'true';

window.__riz = { avatar, world, scene, camera, counters, react, speak, speakAll, laugh, THREE, recorded, voice };
