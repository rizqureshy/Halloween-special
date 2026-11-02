#!/usr/bin/env node
// Turn a raw image-to-3D GLB (Tripo, Meshy, Hunyuan: typically 1-2 million
// faces and 60+ MB) into a web-sized public/avatar.glb: simplify the mesh,
// shrink the textures to WebP, quantize and meshopt-compress. The site's
// loader has the meshopt decoder built in. Usage:
//   node scripts/pack-avatar.mjs <in.glb> [out.glb] [--ratio 0.12] [--texture 2048]
import { execFileSync } from 'node:child_process';
import { statSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const input = positional[0];
const out = positional[1] || 'public/avatar.glb';
const ratio = Number(opt('ratio', 0.12));
const texture = Number(opt('texture', 2048));
if (!input) { console.error('Usage: node scripts/pack-avatar.mjs <in.glb> [out.glb] [--ratio 0.12] [--texture 2048]'); process.exit(2); }

const cli = resolve(dirname(new URL(import.meta.url).pathname), '..', 'node_modules', '.bin', 'gltf-transform');
const mb = (p) => (statSync(p).size / 1e6).toFixed(1);
const work = `${tmpdir()}/pack-avatar-${process.pid}`;
mkdirSync(work, { recursive: true });
const run = (step, ...a) => { console.log(`${step}: gltf-transform ${a.join(' ')}`); execFileSync(cli, a, { stdio: ['ignore', 'inherit', 'inherit'] }); };

console.log(`in ${input} (${mb(input)} MB)`);
run('simplify', 'simplify', input, `${work}/1.glb`, '--ratio', String(ratio), '--error', '0.0005', '--lock-border');
run('textures', 'resize', `${work}/1.glb`, `${work}/2.glb`, '--width', String(texture), '--height', String(texture));
run('webp', 'webp', `${work}/2.glb`, `${work}/3.glb`, '--quality', '85');
run('compress', 'meshopt', `${work}/3.glb`, `${work}/4.glb`, '--level', 'medium');
mkdirSync(dirname(out), { recursive: true });
copyFileSync(`${work}/4.glb`, out);
rmSync(work, { recursive: true, force: true });
console.log(`out ${out} (${mb(out)} MB)`);
console.log('Set <meta name="avatar-glb" content="avatar.glb"> in index.html (and avatar-glb-throne="included" if the chair is part of the model), then npm run build:docs.');
