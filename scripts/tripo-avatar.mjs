#!/usr/bin/env node
// Regenerate public/avatar.glb from the reference image with Tripo3D's hosted
// image-to-model API (H series, v3.1). Needs TRIPO_API_KEY from
// https://platform.tripo3d.ai. Usage:
//   TRIPO_API_KEY=tsk_... node scripts/tripo-avatar.mjs [image] [out.glb]
// Defaults: image = assets/reference-figure.png, out = public/avatar.glb. The raw
// download is kept at assets/avatar-raw.glb (ignored by git) and packed for
// the web with scripts/pack-avatar.mjs.
// Costs Tripo credits (texture_quality "detailed" and pbr cost more than
// "standard"). Nothing else leaves the machine.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const API = 'https://openapi.tripo3d.ai/v3';
const key = process.env.TRIPO_API_KEY;
const image = process.argv[2] || 'assets/reference-figure.png';
const out = process.argv[3] || 'public/avatar.glb';
if (!key) { console.error('Set TRIPO_API_KEY (https://platform.tripo3d.ai, API keys).'); process.exit(2); }

const auth = { Authorization: `Bearer ${key}` };
const call = async (path, init = {}) => {
  const r = await fetch(`${API}${path}`, { ...init, headers: { ...auth, ...(init.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.code !== 0) throw new Error(`${path}: HTTP ${r.status} ${JSON.stringify(j)}`);
  return j.data;
};

console.log(`Uploading ${image}`);
const bytes = await readFile(image);
const type = /\.png$/i.test(image) ? 'image/png' : /\.webp$/i.test(image) ? 'image/webp' : 'image/jpeg';
const form = new FormData();
form.append('file', new Blob([bytes], { type }), basename(image));
const { file_token } = await call('/files', { method: 'POST', body: form });
console.log(`file_token ${file_token}`);

const body = {
  input: file_token,
  model: process.env.TRIPO_MODEL || 'v3.1-20260211',
  texture: true,
  pbr: true,
  texture_quality: process.env.TRIPO_TEXTURE_QUALITY || 'detailed',
  geometry_quality: 'detailed',
  texture_alignment: 'original_image',
  orientation: 'align_image',
  face_limit: Number(process.env.TRIPO_FACE_LIMIT || 300000),
  enable_image_autofix: true,
};
const { task_id } = await call('/generation/image-to-model', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
console.log(`task ${task_id}`);

const terminal = new Set(['success', 'failed', 'cancelled', 'banned', 'expired']);
let task;
for (;;) {
  task = await call(`/tasks/${task_id}`);
  process.stdout.write(`\r${task.status} ${task.progress ?? 0}%   `);
  if (terminal.has(task.status)) break;
  await new Promise((r) => setTimeout(r, 5000));
}
console.log();
if (task.status !== 'success') { console.error(`Task ${task.status}: ${task.error_code || ''} ${task.error_message || ''}`); process.exit(1); }

const url = task.output?.model_url || task.output?.pbr_model || task.output?.model;
if (!url) { console.error('No model URL in output', task.output); process.exit(1); }
console.log(`Downloading ${url}`);
const glb = Buffer.from(await (await fetch(url)).arrayBuffer());
const raw = 'assets/avatar-raw.glb';
await mkdir(dirname(raw), { recursive: true });
await writeFile(raw, glb);
console.log(`Wrote ${raw} (${(glb.length / 1e6).toFixed(1)} MB). Credits consumed: ${task.credits_consumed ?? 'n/a'}.`);
execFileSync(process.execPath, [new URL('./pack-avatar.mjs', import.meta.url).pathname, raw, out], { stdio: 'inherit' });
if (task.output?.rendered_image_url) console.log(`Preview: ${task.output.rendered_image_url}`);
