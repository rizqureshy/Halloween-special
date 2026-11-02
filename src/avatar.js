// Rizwan, Halloween edition: a seated holographic figure built from primitives,
// half man, half machine. Dark coat with orange circuit traces, glasses, short
// beard, a chrome endoskeleton plate over one side of the face with a red
// optic, an exposed mechanical forearm, a neural headset the threads plug
// into, and a villain's floating throne sized to him, not the other way round.
// The head and eyes track a target; moods change the pose, including a villain
// laugh. A GLB (see README) can replace the body; the throne, threads and moods
// stay.
import * as THREE from 'three';
import { circuitTexture, emblemTexture, ORANGE, BLUE } from './textures.js';

const V = THREE.Vector3;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

export function createAvatar() {
  const group = new THREE.Group();
  group.name = 'avatar';
  const parts = {};
  const interactive = [];

  // ---- Materials ------------------------------------------------------------
  const skin = new THREE.MeshStandardMaterial({ color: 0xb27a55, roughness: 0.75 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x17120f, roughness: 0.9 });
  const coat = new THREE.MeshStandardMaterial({ color: 0x1c1e2a, roughness: 0.55, metalness: 0.25, emissive: new THREE.Color(ORANGE), emissiveMap: circuitTexture(ORANGE, 11), emissiveIntensity: 0.7 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x0f1014, roughness: 0.85 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8d939c, metalness: 0.9, roughness: 0.3 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: 0.95, roughness: 0.22 });
  const endo = new THREE.MeshStandardMaterial({ color: 0x5a5f68, metalness: 0.95, roughness: 0.35 });
  const glow = (color, intensity = 2) => new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: intensity, roughness: 0.4 });
  const blueGlow = glow(BLUE, 1.2);
  const orangeGlow = glow(ORANGE, 1.3);
  const redGlow = new THREE.MeshStandardMaterial({ color: 0x3a0000, emissive: new THREE.Color(0xff1e1e), emissiveIntensity: 2.0, roughness: 0.4 });
  const frames = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0.6, roughness: 0.35 });
  const throneMat = new THREE.MeshStandardMaterial({ color: 0x0c0d12, roughness: 0.5, metalness: 0.5 });
  const holo = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

  const mesh = (geo, mat, pos = [0, 0, 0], name = '', kind = 'self') => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.name = name;
    m.castShadow = false;
    m.userData.kind = kind;
    interactive.push(m);
    return m;
  };

  // ---- Throne: tall, winged, spiked, lit from below -------------------------------
  const throne = new THREE.Group();
  throne.name = 'throne';
  const seat = mesh(new THREE.BoxGeometry(1.1, 0.12, 0.9), throneMat, [0, 0.85, 0.15], 'seat', 'throne');
  const back = mesh(new THREE.BoxGeometry(1.0, 1.8, 0.16), throneMat, [0, 1.75, -0.32], 'back', 'throne');
  const crest = mesh(new THREE.ConeGeometry(0.28, 0.5, 4), throneMat, [0, 2.88, -0.32], 'crest', 'throne');
  crest.rotation.y = Math.PI / 4; crest.scale.z = 0.4;
  const wingL = mesh(new THREE.BoxGeometry(0.3, 1.3, 0.14), throneMat, [-0.7, 2.05, -0.28], 'wing', 'throne');
  const wingR = mesh(new THREE.BoxGeometry(0.3, 1.3, 0.14), throneMat, [0.7, 2.05, -0.28], 'wing', 'throne');
  wingL.rotation.z = -0.16; wingR.rotation.z = 0.16;
  const spike = (x) => { const s = mesh(new THREE.ConeGeometry(0.1, 0.45, 6), throneMat, [x, 2.9, -0.28], 'spike', 'throne'); s.rotation.z = x < 0 ? -0.16 : 0.16; return s; };
  const restL = mesh(new THREE.BoxGeometry(0.18, 0.14, 0.78), throneMat, [-0.62, 1.1, 0.2], 'arm', 'throne');
  const restR = mesh(new THREE.BoxGeometry(0.18, 0.14, 0.78), throneMat, [0.62, 1.1, 0.2], 'arm', 'throne');
  const supL = mesh(new THREE.BoxGeometry(0.12, 0.25, 0.12), throneMat, [-0.62, 0.92, 0.5], 'sup', 'throne');
  const supR = mesh(new THREE.BoxGeometry(0.12, 0.25, 0.12), throneMat, [0.62, 0.92, 0.5], 'sup', 'throne');
  const pedestal = mesh(new THREE.CylinderGeometry(0.36, 0.52, 0.3, 24), throneMat, [0, 0.64, 0.1], 'pedestal', 'throne');
  const ring = mesh(new THREE.TorusGeometry(0.6, 0.035, 12, 48), orangeGlow, [0, 0.46, 0.1], 'ring', 'throne');
  ring.rotation.x = Math.PI / 2;
  const ring2 = mesh(new THREE.TorusGeometry(0.82, 0.015, 8, 56), blueGlow, [0, 0.4, 0.1], 'ring2', 'throne');
  ring2.rotation.x = Math.PI / 2;
  const ring3 = mesh(new THREE.TorusGeometry(0.45, 0.02, 8, 48), redGlow, [0, 0.52, 0.1], 'ring3', 'throne');
  ring3.rotation.x = Math.PI / 2;
  // light strips on the throne
  const strip = (w, h, d, pos, mat = orangeGlow) => mesh(new THREE.BoxGeometry(w, h, d), mat, pos, 'strip', 'throne');
  strip(0.03, 1.7, 0.03, [-0.5, 1.75, -0.23]); strip(0.03, 1.7, 0.03, [0.5, 1.75, -0.23]);
  strip(0.03, 0.03, 0.78, [-0.52, 1.18, 0.2], blueGlow); strip(0.03, 0.03, 0.78, [0.52, 1.18, 0.2], blueGlow);
  strip(0.6, 0.03, 0.03, [0, 2.63, -0.23], redGlow);
  strip(0.03, 1.2, 0.03, [-0.84, 2.05, -0.2], redGlow).rotation.z = -0.16;
  strip(0.03, 1.2, 0.03, [0.84, 2.05, -0.2], redGlow).rotation.z = 0.16;
  throne.add(seat, back, crest, wingL, wingR, spike(-0.7), spike(0.7), restL, restR, supL, supR, pedestal, ring, ring2, ring3);
  interactive.filter((m) => m.userData.kind === 'throne' && m.name === 'strip').forEach((m) => throne.add(m));
  group.add(throne);
  parts.ring = ring; parts.ring2 = ring2; parts.ring3 = ring3; parts.throne = throne;

  // ---- Body: scaled up so he owns the chair ------------------------------------
  const BODY_SCALE = 1.18;
  const body = new THREE.Group();
  body.name = 'body';
  body.scale.setScalar(BODY_SCALE);
  body.position.y = -0.105; // thighs rest on the seat
  group.add(body);
  parts.body = body;

  const torso = mesh(new THREE.CapsuleGeometry(0.3, 0.42, 6, 20), coat, [0, 1.32, 0.02], 'torso');
  torso.scale.set(1.05, 1, 0.68);
  const belly = mesh(new THREE.SphereGeometry(0.3, 24, 18), coat, [0, 1.1, 0.12], 'belly');
  belly.scale.set(1.0, 0.7, 0.75);
  const collar = mesh(new THREE.CylinderGeometry(0.31, 0.25, 0.22, 24, 1, true), coat, [0, 1.68, -0.03], 'collar');
  collar.material = coat.clone(); collar.material.side = THREE.DoubleSide;
  const collarEdge = mesh(new THREE.TorusGeometry(0.31, 0.01, 8, 32), orangeGlow, [0, 1.79, -0.03], 'collar-edge');
  collarEdge.rotation.x = Math.PI / 2;
  const shoulderL = mesh(new THREE.SphereGeometry(0.14, 20, 14), coat, [-0.36, 1.55, 0], 'shoulder');
  const shoulderR = mesh(new THREE.SphereGeometry(0.14, 20, 14), coat, [0.36, 1.55, 0], 'shoulder');
  // chrome pauldron on the machine side
  const pauldron = mesh(new THREE.SphereGeometry(0.16, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), chrome, [-0.37, 1.56, 0], 'pauldron');
  pauldron.rotation.z = 0.5;
  const emblem = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: emblemTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  emblem.position.set(0, 1.36, 0.225);
  emblem.rotation.x = -0.15;
  body.add(torso, belly, collar, collarEdge, shoulderL, shoulderR, pauldron, emblem);
  parts.torso = torso; parts.emblem = emblem;
  // neck cables from the collar up to the headset
  const cable = (dx, color) => {
    const curve = new THREE.CatmullRomCurve3([new V(dx, 1.74, -0.2), new V(dx * 1.3, 1.86, -0.3), new V(dx * 0.6, 1.98, -0.28)]);
    const c = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.014, 6, false), color);
    body.add(c);
  };
  cable(0.08, metal); cable(-0.08, blueGlow); cable(0.0, endo);

  // lap and legs, seated, knees forward
  const hip = (x) => {
    const thigh = mesh(new THREE.CapsuleGeometry(0.12, 0.38, 6, 16), cloth, [x, 0.98, 0.3], 'thigh');
    thigh.rotation.x = Math.PI / 2 - 0.1;
    const knee = mesh(new THREE.SphereGeometry(0.13, 18, 14), cloth, [x, 0.96, 0.55], 'knee');
    const shin = mesh(new THREE.CapsuleGeometry(0.1, 0.4, 6, 16), cloth, [x, 0.66, 0.6], 'shin');
    shin.rotation.x = 0.15;
    const boot = mesh(new THREE.BoxGeometry(0.2, 0.14, 0.34), frames, [x, 0.4, 0.68], 'boot');
    const bootGlow = mesh(new THREE.BoxGeometry(0.21, 0.02, 0.1), x < 0 ? redGlow : blueGlow, [x, 0.4, 0.8], 'boot-glow');
    body.add(thigh, knee, shin, boot, bootGlow);
  };
  hip(-0.17); hip(0.17);

  // arms: pivots at the shoulders. The left one is exposed endoskeleton.
  const arm = (side, machine) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.38 * side, 1.52, 0);
    const upper = mesh(new THREE.CapsuleGeometry(0.095, 0.3, 6, 16), coat, [0, -0.2, 0], 'upper-arm');
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.4, 0);
    if (machine) {
      const core = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.34, 10), endo, [0, -0.2, 0], 'endo-core');
      const piston = (dx, dz) => mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8), chrome, [dx, -0.2, dz], 'piston');
      const seam = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 10), redGlow, [0, -0.1, 0], 'seam');
      const seam2 = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 10), redGlow, [0, -0.3, 0], 'seam');
      const cuff = mesh(new THREE.CylinderGeometry(0.1, 0.095, 0.08, 14), chrome, [0, -0.03, 0], 'cuff');
      const wrist = mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.06, 12), chrome, [0, -0.37, 0], 'wrist');
      const hand = mesh(new THREE.SphereGeometry(0.08, 18, 14), endo, [0, -0.42, 0], 'hand');
      hand.scale.set(1, 1.15, 0.8);
      const knuckles = mesh(new THREE.BoxGeometry(0.1, 0.02, 0.05), redGlow, [0, -0.46, 0.04], 'knuckles');
      elbow.add(core, piston(0.06, 0.03), piston(-0.05, 0.045), piston(0.0, -0.06), seam, seam2, cuff, wrist, hand, knuckles);
    } else {
      const fore = mesh(new THREE.CapsuleGeometry(0.085, 0.28, 6, 16), coat, [0, -0.2, 0], 'forearm');
      const gauntlet = mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), metal, [0, -0.2, 0], 'gauntlet');
      const gl1 = mesh(new THREE.BoxGeometry(0.21, 0.025, 0.06), blueGlow, [0, -0.12, 0.08], 'gauntlet-glow');
      const gl2 = mesh(new THREE.BoxGeometry(0.21, 0.025, 0.06), blueGlow, [0, -0.28, 0.08], 'gauntlet-glow');
      const hand = mesh(new THREE.SphereGeometry(0.08, 18, 14), skin, [0, -0.42, 0], 'hand');
      hand.scale.set(1, 1.15, 0.8);
      elbow.add(fore, gauntlet, gl1, gl2, hand);
    }
    pivot.add(upper, elbow);
    body.add(pivot);
    return { pivot, elbow, side, elbowAim: new V(), handAim: new V() };
  };
  const armR = arm(1, false);   // hand to chin
  const armLft = arm(-1, true); // the machine arm, resting, typing
  parts.armR = armR; parts.armL = armLft;
  // Poses are points in body space: where the elbow and the hand should aim.
  const POSES = {
    idle:    { R: [[0.4, 1.32, 0.36], [0.1, 1.88, 0.3]],   L: [[-0.52, 1.18, 0.22], [-0.24, 1.14, 0.52]] },
    helping: { R: [[0.5, 1.22, 0.36], [0.5, 1.5, 0.8]],   L: [[-0.52, 1.18, 0.22], [-0.24, 1.14, 0.52]] },
    dragged: { R: [[0.8, 1.7, 0.1], [1.05, 2.05, 0.35]],   L: [[-0.8, 1.7, 0.1], [-1.05, 2.05, 0.35]] },
    laugh:   { R: [[0.62, 1.72, 0.2], [0.5, 2.25, 0.3]],   L: [[-0.56, 1.2, 0.2], [-0.62, 1.12, 0.5]] },
  };
  const DOWN = new V(0, -1, 0);
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), dir = new V(), elbowPos = new V();
  const poseArm = (a, elbowAim, handAim) => {
    dir.copy(elbowAim).sub(a.pivot.position).normalize();
    qa.setFromUnitVectors(DOWN, dir);
    a.pivot.quaternion.copy(qa);
    elbowPos.copy(a.pivot.position).addScaledVector(dir, 0.4);
    dir.copy(handAim).sub(elbowPos).normalize();
    qb.setFromUnitVectors(DOWN, dir);
    a.elbow.quaternion.copy(qa).invert().multiply(qb);
  };
  armR.elbowAim.fromArray(POSES.idle.R[0]); armR.handAim.fromArray(POSES.idle.R[1]);
  armLft.elbowAim.fromArray(POSES.idle.L[0]); armLft.handAim.fromArray(POSES.idle.L[1]);
  poseArm(armR, armR.elbowAim, armR.handAim);
  poseArm(armLft, armLft.elbowAim, armLft.handAim);
  const aimTmp = new V();

  // neck and head
  const neck = mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.18, 16), skin, [0, 1.72, 0.02], 'neck');
  body.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 1.97, 0.02);
  body.add(head);
  parts.head = head;
  const skull = mesh(new THREE.SphereGeometry(0.26, 32, 24), skin, [0, 0, 0], 'skull');
  skull.scale.set(0.95, 1.08, 0.95);
  const hairCap = mesh(new THREE.SphereGeometry(0.27, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.46), hair, [0, 0.02, -0.03], 'hair');
  hairCap.scale.set(0.96, 1.06, 0.98);
  const beard = mesh(new THREE.SphereGeometry(0.262, 32, 16, -Math.PI * 0.55, Math.PI * 1.1, Math.PI * 0.64, Math.PI * 0.36), hair, [0, 0, 0.005], 'beard');
  beard.rotation.y = Math.PI / 2;
  beard.scale.set(0.95, 1.06, 0.95);
  // the chrome endoskeleton showing through on his left (the viewer's right)
  const plate = mesh(new THREE.SphereGeometry(0.268, 32, 24, 0.12, 1.35, 0.5, 1.55), chrome, [0, 0, 0], 'plate');
  plate.scale.set(0.95, 1.08, 0.95);
  const plateEdge = mesh(new THREE.SphereGeometry(0.272, 10, 7, 0.1, 1.4, 0.48, 1.6), orangeGlow, [0, 0, 0], 'plate-edge');
  plateEdge.scale.set(0.95, 1.08, 0.95);
  plateEdge.material = plateEdge.material.clone(); plateEdge.material.wireframe = true; plateEdge.material.emissiveIntensity = 1.2; plateEdge.material.transparent = true; plateEdge.material.opacity = 0.5;
  const nose = mesh(new THREE.SphereGeometry(0.045, 12, 10), skin, [0, -0.03, 0.25], 'nose');
  nose.scale.set(0.8, 1, 1.1);
  const ear = (s) => mesh(new THREE.SphereGeometry(0.05, 12, 10), s < 0 ? chrome : skin, [0.25 * s, -0.01, 0], 'ear');
  head.add(skull, hairCap, beard, plate, plateEdge, nose, ear(1), ear(-1));
  // orange circuit traces on the chrome cheek
  const trace = (pos, rotz, len) => { const t = mesh(new THREE.BoxGeometry(0.012, len, 0.006), orangeGlow, pos, 'trace'); t.rotation.z = rotz; t.lookAt(pos[0] * 4, pos[1], pos[2] * 4); t.rotateZ(rotz); head.add(t); };
  trace([-0.19, -0.05, 0.16], 0.4, 0.09); trace([-0.21, -0.12, 0.13], -0.5, 0.07); trace([-0.16, -0.14, 0.19], 0.1, 0.06);
  // eyes: a human one and a red optic
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.2 });
  const eye = (s) => {
    const optic = s < 0;
    const e = mesh(new THREE.SphereGeometry(optic ? 0.05 : 0.045, 16, 12), optic ? redGlow : eyeMat, [0.095 * s, 0.03, 0.215], optic ? 'optic' : 'eye');
    const p = mesh(new THREE.SphereGeometry(0.02, 12, 10), optic ? frames : pupilMat, [0, 0, optic ? 0.042 : 0.036], 'pupil');
    e.add(p);
    if (optic) { const r = mesh(new THREE.TorusGeometry(0.055, 0.008, 8, 24), chrome, [0.095 * s, 0.03, 0.22], 'optic-ring'); head.add(r); }
    head.add(e);
    return { eye: e, pupil: p, optic };
  };
  parts.eyes = [eye(1), eye(-1)];
  parts.optic = parts.eyes[1].eye;
  // brows
  const brow = (s) => { const b = mesh(new THREE.BoxGeometry(0.1, 0.016, 0.02), s < 0 ? chrome : hair, [0.095 * s, 0.095, 0.235], 'brow'); b.rotation.z = -0.12 * s; head.add(b); return b; };
  parts.brows = [brow(1), brow(-1)];
  // glasses
  const lens = (s) => { const l = mesh(new THREE.TorusGeometry(0.072, 0.008, 8, 28), frames, [0.098 * s, 0.03, 0.245], 'glasses'); l.scale.set(1.15, 0.9, 1); head.add(l); const glass = mesh(new THREE.CircleGeometry(0.068, 24), holo, [0.098 * s, 0.03, 0.247], 'lens'); glass.scale.set(1.15, 0.9, 1); head.add(glass); };
  lens(1); lens(-1);
  head.add(mesh(new THREE.BoxGeometry(0.05, 0.012, 0.012), frames, [0, 0.035, 0.25], 'bridge'));
  const temple = (s) => { const t = mesh(new THREE.BoxGeometry(0.012, 0.012, 0.26), frames, [0.185 * s, 0.035, 0.12], 'temple'); head.add(t); };
  temple(1); temple(-1);
  // neural headset
  const band = mesh(new THREE.TorusGeometry(0.285, 0.016, 10, 48, Math.PI), metal, [0, 0.0, -0.02], 'band');
  band.scale.set(1, 1.08, 1);
  const earCup = (s) => { const c = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 20), metal, [0.275 * s, -0.01, -0.02], 'earcup'); c.rotation.z = Math.PI / 2; head.add(c); const r = mesh(new THREE.TorusGeometry(0.05, 0.008, 8, 24), s < 0 ? redGlow : blueGlow, [0.3 * s, -0.01, -0.02], 'earcup-glow'); r.rotation.y = Math.PI / 2; head.add(r); };
  earCup(1); earCup(-1);
  const port = mesh(new THREE.SphereGeometry(0.035, 12, 10), blueGlow, [0, 0.29, -0.03], 'port');
  head.add(band, port);
  parts.port = port;
  // mouth
  const mouth = mesh(new THREE.BoxGeometry(0.07, 0.012, 0.01), new THREE.MeshStandardMaterial({ color: 0x5a2d22, roughness: 0.9 }), [0, -0.1, 0.245], 'mouth');
  head.add(mouth);
  parts.mouth = mouth;

  // holographic keyboard on the lap
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), holo.clone());
  keys.position.set(-0.12, 1.1, 0.48);
  keys.rotation.x = -Math.PI / 2 + 0.35;
  const keyGrid = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.5, 0.2, 10, 4)), new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.5 }));
  keys.add(keyGrid);
  body.add(keys);
  parts.keys = keys;

  // ---- Wireframe ("mesh") mode ------------------------------------------------
  const wire = new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: 0.55 });
  const wireOrange = new THREE.MeshBasicMaterial({ color: ORANGE, wireframe: true, transparent: true, opacity: 0.7 });
  const wireRed = new THREE.MeshBasicMaterial({ color: 0xff3a3a, wireframe: true, transparent: true, opacity: 0.8 });
  const originals = new Map();
  group.traverse((o) => { if (o.isMesh) originals.set(o, o.material); });
  let meshed = false;
  const wireFor = (mat) => (mat === redGlow ? wireRed : mat === orangeGlow || mat === coat || mat === collar.material ? wireOrange : wire);
  const setMeshed = (on) => {
    meshed = on;
    originals.forEach((mat, o) => { o.material = on ? (o.userData.wire || wireFor(mat)) : mat; });
  };
  /** A loaded GLB joins the wireframe toggle and the hologram tint. */
  const registerModel = (model) => {
    model.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) { if (m.emissive) { m.emissive = new THREE.Color(0x0b2a44); m.emissiveIntensity = 0.55; } }
      o.userData.wire = wire;
      o.userData.kind = 'self';
      originals.set(o, o.material);
      interactive.push(o);
    });
    if (meshed) setMeshed(true);
  };

  // ---- Motion state ----------------------------------------------------------
  const home = new V(0, -0.35, 0);
  group.position.copy(home);
  const state = {
    mood: 'idle',       // idle | annoyed | helping | laughing | dragged | returning
    moodUntil: 0,
    aim: null,          // world position to look at
    aimUntil: 0,
    yaw: 0, pitch: 0,
    dragging: false,
    returnFrom: null, returnStart: 0,
    laughStart: 0,
  };
  const tmp = new V();
  const headWorld = new V();
  let clockNow = 0; // the scene clock, so timers and the animation agree

  const lookAt = (worldPos, seconds = 3) => { state.aim = worldPos.clone(); state.aimUntil = clockNow + seconds; };
  const setMood = (mood, seconds = 2.5) => { state.mood = mood; state.moodUntil = clockNow + seconds; if (mood === 'laughing') state.laughStart = clockNow; };
  const beginDrag = () => { state.dragging = true; state.mood = 'dragged'; };
  const endDrag = () => { state.dragging = false; state.mood = 'returning'; state.returnFrom = group.position.clone(); state.returnStart = clockNow; };
  const moveTo = (p) => { group.position.copy(p); };

  const update = (t, dt, pointerWorld) => {
    const now = t;
    clockNow = t;
    if (state.mood !== 'dragged' && state.mood !== 'returning' && now > state.moodUntil && state.mood !== 'idle') state.mood = 'idle';
    const laughing = state.mood === 'laughing';
    // returning home after a drag
    if (state.mood === 'returning') {
      const k = clamp((now - state.returnStart) / 2.2, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      group.position.lerpVectors(state.returnFrom, home, e);
      if (k >= 1) state.mood = 'idle';
    }
    // float and bob; the laugh rocks the whole throne
    if (!state.dragging && state.mood !== 'returning') {
      group.position.x = lerp(group.position.x, home.x, 0.1);
      group.position.z = lerp(group.position.z, home.z, 0.1);
      group.position.y = home.y + Math.sin(now * 0.9) * 0.05 + (laughing ? Math.abs(Math.sin(now * 11)) * 0.035 : 0);
    }
    const rollTarget = state.dragging ? 0.12 : Math.sin(now * 0.5) * 0.015 + (laughing ? Math.sin(now * 9) * 0.02 : 0);
    const pitchTarget = state.dragging ? -0.15 : laughing ? -0.09 : 0;
    group.rotation.z = lerp(group.rotation.z, rollTarget, 0.1);
    group.rotation.x = lerp(group.rotation.x, pitchTarget, 0.08);
    parts.ring.scale.setScalar(1 + Math.sin(now * 3) * 0.04);
    parts.ring2.rotation.z = now * 0.4;
    parts.ring3.rotation.z = -now * 0.7;
    parts.ring.material.emissiveIntensity = 1.3 + Math.sin(now * 3) * 0.35;
    parts.ring3.material.emissiveIntensity = laughing ? 3.5 + Math.sin(now * 20) * 1.2 : 2.2 + Math.sin(now * 2.1) * 0.5;
    // breathing
    torso.scale.y = 1 + Math.sin(now * 1.4) * 0.012;
    parts.emblem.material.opacity = 0.75 + Math.sin(now * 2.2) * 0.25;
    parts.port.material.emissiveIntensity = 1.2 + Math.sin(now * 5) * 0.5;
    // the optic: a slow scan, a hard flare when he laughs or is annoyed
    const flare = laughing ? 3.6 + Math.sin(now * 24) * 1.2 : state.mood === 'annoyed' ? 3.2 : 1.9 + Math.sin(now * 1.7) * 0.4;
    parts.optic.material.emissiveIntensity = lerp(parts.optic.material.emissiveIntensity, flare, 0.2);

    // head aim: a target, else the pointer, else forward with a slow look-around
    let target = null;
    if (state.aim && now < state.aimUntil) target = state.aim;
    else if (pointerWorld && state.mood !== 'dragged') target = pointerWorld;
    head.getWorldPosition(headWorld);
    let yaw = Math.sin(now * 0.3) * 0.15, pitch = Math.sin(now * 0.23) * 0.06 - 0.05;
    if (target) {
      tmp.copy(target).sub(headWorld);
      const flat = Math.hypot(tmp.x, tmp.z);
      yaw = clamp(Math.atan2(tmp.x, tmp.z) - group.rotation.y, -0.75, 0.75);
      pitch = clamp(-Math.atan2(tmp.y, flat), -0.45, 0.4);
    }
    if (state.mood === 'dragged') { yaw = Math.sin(now * 6) * 0.25; pitch = -0.2; }
    if (state.mood === 'annoyed') { pitch -= 0.05; }
    if (laughing) { pitch = -0.38 + Math.sin(now * 14) * 0.04; yaw *= 0.3; }
    state.yaw = lerp(state.yaw, yaw, 1 - Math.pow(0.001, dt));
    state.pitch = lerp(state.pitch, pitch, 1 - Math.pow(0.001, dt));
    head.rotation.set(state.pitch, state.yaw, state.mood === 'annoyed' ? 0.12 : laughing ? Math.sin(now * 7) * 0.06 : lerp(head.rotation.z, 0, 0.1));
    // eyes lead the head
    for (const { pupil } of parts.eyes) { pupil.position.x = lerp(pupil.position.x, (yaw - state.yaw) * 0.04, 0.2); pupil.position.y = lerp(pupil.position.y, -(pitch - state.pitch) * 0.03, 0.2); }
    // brows: raised when annoyed, high when laughing, flat when helping
    const browLift = state.mood === 'annoyed' ? 0.03 : state.mood === 'dragged' ? 0.045 : laughing ? 0.05 : 0;
    parts.brows.forEach((b, i) => { b.position.y = lerp(b.position.y, 0.095 + browLift * (i === 0 ? 1.4 : 0.6), 0.15); });
    // mouth: open wide for the laugh
    parts.mouth.scale.y = lerp(parts.mouth.scale.y, laughing ? 3.5 + Math.abs(Math.sin(now * 16)) * 2.5 : 1, 0.25);
    parts.mouth.scale.x = lerp(parts.mouth.scale.x, laughing ? 1.3 : 1, 0.2);

    // arms: ease the elbow and hand aims toward the pose for the mood
    const poseKey = state.mood === 'dragged' ? 'dragged' : laughing ? 'laugh' : state.mood === 'helping' ? 'helping' : 'idle';
    const ease = 1 - Math.pow(0.002, dt);
    for (const [a, key] of [[armR, 'R'], [armLft, 'L']]) {
      const [eAim, hAim] = POSES[poseKey][key];
      aimTmp.fromArray(eAim);
      if (poseKey === 'dragged') aimTmp.y += Math.sin(now * 7 + (key === 'R' ? 0 : 1.5)) * 0.12;
      a.elbowAim.lerp(aimTmp, ease);
      aimTmp.fromArray(hAim);
      if (poseKey === 'dragged') aimTmp.y += Math.sin(now * 7 + (key === 'R' ? 0.4 : 1.9)) * 0.2;
      if (poseKey === 'laugh' && key === 'R') { aimTmp.y += Math.sin(now * 11) * 0.06; aimTmp.x += Math.sin(now * 5.5) * 0.04; }
      if (poseKey === 'idle' && key === 'L' && state.mood === 'idle') { aimTmp.y -= Math.abs(Math.sin(now * 9)) * 0.05; aimTmp.x += Math.sin(now * 4.5) * 0.06; }
      if (poseKey === 'idle' && key === 'R') aimTmp.y += Math.sin(now * 1.1) * 0.01;
      a.handAim.lerp(aimTmp, ease);
      poseArm(a, a.elbowAim, a.handAim);
    }
    parts.keys.material.opacity = 0.12 + Math.abs(Math.sin(now * 9)) * 0.12;
  };

  /** Where the neural threads start, in world space. */
  const portWorld = (out) => parts.port.getWorldPosition(out);

  return { group, parts, interactive, home, state, update, lookAt, setMood, beginDrag, endDrag, moveTo, setMeshed, isMeshed: () => meshed, registerModel, portWorld, BODY_SCALE };
}
