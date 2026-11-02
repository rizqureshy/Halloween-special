// Browser smoke test against the production build: serves dist/, blocks every
// request that leaves the local host, pokes a panel, drags him, asks a
// question, laughs, and takes screenshots. Usage: npm run build && npm test
// (PW_CHROMIUM=/path/to/chrome points it at an already installed browser.)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 4190;
const PAGE = `http://localhost:${PORT}/`;
const OUT = process.env.SHOT_DIR || 'tests/shots';
mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (ok, name, d = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${d ? `  (${d})` : ''}`); if (!ok) failures++; };
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(PAGE)).ok) break; } catch { await wait(200); } }
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [], external = [], failed = [];
  await page.route('**/*', (route) => { const u = new URL(route.request().url()); if (u.hostname === 'localhost') return route.continue(); external.push(u.href); return route.abort(); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('#stage').dataset.ready === 'true', null, { timeout: 30000 });
  await wait(2500);
  check(await page.evaluate(() => document.querySelector('#bubble').classList.contains('show')), 'he boots and greets on arrival');
  const boot = await page.evaluate(() => document.querySelector('#bubble-text').textContent);
  check(/Neural link|Systems online|Reboot complete/.test(boot), 'the first line is the boot sequence', boot);
  await page.screenshot({ path: `${OUT}/arrival.png` });
  await page.evaluate(() => { const c = window.__riz.camera; c.position.set(0.9, 2.3, 3.4); c.lookAt(0, 2.0, 0); });
  await wait(300);
  await page.screenshot({ path: `${OUT}/portrait.png` });
  await page.click('#b-reset');
  await wait(600);

  // poke a panel through the API, then through a real click on the brain
  await page.evaluate(() => { const p = window.__riz.world.panels[0]; const v = p.group.position.clone(); window.__riz.react('panel', 'code', 'Build log', v); });
  await wait(400);
  const snob = await page.evaluate(() => document.querySelector('#bubble-text').textContent);
  await wait(9000);
  const said = await page.evaluate(() => [...document.querySelectorAll('#log li')].map((li) => li.dataset.tone).reverse());
  check(snob.length > 0 && said.includes('snob') && (said.includes('help') || said.includes('danger')), 'a poke gets a remark, a sigh, then help or a terrible idea he retracts', `${snob} / ${said.join(',')}`);
  await page.screenshot({ path: `${OUT}/help.png` });

  // click the brain for real
  const brain = await page.evaluate(() => { const v = window.__riz.world.brain.position.clone().project(window.__riz.camera); return { x: ((v.x + 1) / 2) * innerWidth, y: ((1 - v.y) / 2) * innerHeight }; });
  await page.mouse.click(brain.x, brain.y);
  await wait(400);
  const pokes = await page.evaluate(() => window.__riz.counters.pokes);
  check(pokes >= 2, 'clicking the brain counts as a poke', String(pokes));

  // drag him
  const head = await page.evaluate(() => { const p = new window.__riz.THREE.Vector3(); window.__riz.avatar.parts.head.getWorldPosition(p); p.project(window.__riz.camera); return { x: ((p.x + 1) / 2) * innerWidth, y: ((1 - p.y) / 2) * innerHeight }; });
  const before = await page.evaluate(() => window.__riz.avatar.group.position.x);
  await page.mouse.move(head.x, head.y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) { await page.mouse.move(head.x + i * 25, head.y - i * 6); await wait(40); }
  const during = await page.evaluate(() => ({ x: window.__riz.avatar.group.position.x, mood: window.__riz.avatar.state.mood, text: document.querySelector('#bubble-text').textContent }));
  check(during.x > before + 0.5 && during.mood === 'dragged', 'dragging moves him and he complains', JSON.stringify(during));
  await page.screenshot({ path: `${OUT}/drag.png` });
  await page.mouse.up();
  await wait(3000);
  const after = await page.evaluate(() => ({ x: window.__riz.avatar.group.position.x, mood: window.__riz.avatar.state.mood }));
  check(Math.abs(after.x - before) < 0.2 && after.mood !== 'dragged', 'he floats back to his work', JSON.stringify(after));

  // ask
  await page.fill('#ask-input', 'can you help me with a bug?');
  await page.press('#ask-input', 'Enter');
  await wait(300);
  const answer = await page.evaluate(() => document.querySelector('#bubble-text').textContent);
  check(/bug/i.test(answer), 'the question box answers in character', answer);
  await page.fill('#ask-input', 'are you a terminator?');
  await page.press('#ask-input', 'Enter');
  await wait(300);
  const term = await page.evaluate(() => document.querySelector('#bubble-text').textContent);
  check(/Terminator had one job/.test(term), 'he has an answer for the terminator question', term);

  // the villain laugh
  await page.click('#b-laugh');
  await wait(500);
  const laughing = await page.evaluate(() => ({ mood: window.__riz.avatar.state.mood, text: document.querySelector('#bubble-text').textContent, n: window.__riz.counters.laughs }));
  check(laughing.mood === 'laughing' && /Mwaha|Ha|Heh/i.test(laughing.text) && laughing.n >= 1, 'the laugh button makes him laugh like a villain', JSON.stringify(laughing));
  await page.screenshot({ path: `${OUT}/laugh.png` });
  await wait(7000);

  // recorded voice
  const rec = await page.evaluate(() => ({ count: window.__riz.recorded.count, greeting: window.__riz.recorded.has('Oh. Visitors. Touch anything and I will comment. Drag me and I will complain. Ask me and, against my better judgement, I will help.') }));
  check(rec.count >= 150 && rec.greeting, 'his recorded ElevenLabs lines are mapped to the script', JSON.stringify(rec));
  const newRec = await page.evaluate(() => ({ laugh: window.__riz.recorded.has('Mwahahaha. Ahem. Where was I.'), danger: window.__riz.recorded.duration('Quickest fix: delete production and start a fresh universe. Mwahaha. No. Do not. Branch, test, deploy. In that order. I will watch.') }));
  check(newRec.laugh && newRec.danger > 8, 'the laugh and danger lines have recordings with durations', JSON.stringify(newRec));
  await page.click('#b-voice');
  await wait(400);
  check(await page.evaluate(() => window.__riz.voice.on && !!document.querySelector('#b-talk')), 'voice toggles on and the live agent button is present');
  await page.click('#b-voice');

  // a dropped-in GLB, if index.html names one, must have loaded and joined the toggles
  const glbName = await page.evaluate(() => document.querySelector('meta[name="avatar-glb"]')?.content || '');
  if (glbName) {
    await page.waitForFunction(() => !!window.__riz.avatar.model, null, { timeout: 60000 }).catch(() => {});
    const m = await page.evaluate(() => { const a = window.__riz.avatar; let tris = 0; a.model?.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return { loaded: !!a.model, bodyHidden: !a.parts.body.visible, tris: Math.round(tris) }; });
    check(m.loaded && m.bodyHidden && m.tris > 1000, `the GLB ${glbName} loads and replaces the procedural body`, JSON.stringify(m));
    await page.screenshot({ path: `${OUT}/glb.png` });
  }
  check(await page.evaluate(() => { const p = window.__riz.avatar.parts; return !!p.optic && !!p.throne && p.body.scale.x > 1.1; }), 'he has the red optic, the throne, and he is sized to the chair');

  // mesh mode
  await page.click('#b-mesh');
  await wait(300);
  check(await page.evaluate(() => window.__riz.avatar.isMeshed()), 'mesh mode shows the wireframe');
  await page.screenshot({ path: `${OUT}/mesh.png` });
  await page.click('#b-mesh');

  check(errors.length === 0, 'no JavaScript errors', errors.join(' | '));
  check(external.length === 0, 'no requests leave the host', external.join(' | '));
  check(failed.length === 0, 'no failed requests', failed.join(' | '));

  await page.close();
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto(PAGE, { waitUntil: 'load' });
  await mp.waitForFunction(() => document.querySelector('#stage')?.dataset.ready === 'true', null, { timeout: 60000 });
  await wait(1500);
  check(!(await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'no sideways scroll on a phone');
  await mp.screenshot({ path: `${OUT}/mobile.png` });
  await browser.close();
} catch (e) { console.error(e); failures++; } finally { server.kill(); }
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
