#!/usr/bin/env node
/**
 * Screenshot pipeline (docs/SCREENSHOTS.md).
 *   assets/screens/raw/<id>[.pt].png  ->  assets/screens/out/<id>[.pt][@2x|.page].webp + manifest.json
 *
 * Missing raw files are a warning, never an error: the workbench falls back to the
 * illustrated mock for those ids.
 *
 * Usage: node scripts/screens.mjs [--force]
 */
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'assets/screens/raw');
const OUT = path.join(root, 'assets/screens/out');
const force = process.argv.includes('--force');

const { screens } = JSON.parse(await readFile(path.join(root, 'content/screens.json'), 'utf8'));
const faces = JSON.parse(await readFile(path.join(root, 'src/lib/screen-faces.json'), 'utf8'));

/** Larger variant for the project pages: the screenshot at this width at most, viewport aspect. */
const PAGE_MAX_W = 960;
const PAPER = { r: 0xfb, g: 0xfb, b: 0xf8 };
const PIPELINE_VERSION = 1; // bump to force a rebuild of every output when the processing changes

/** Step 1: blur declared rectangles (raw-image pixels) before anything else. */
async function redact(input, rects) {
  if (!rects?.length) return input;
  const meta = await sharp(input).metadata();
  const overlays = [];
  for (const [x, y, w, h] of rects) {
    const left = Math.max(0, Math.round(x)), top = Math.max(0, Math.round(y));
    const width = Math.min(Math.round(w), meta.width - left), height = Math.min(Math.round(h), meta.height - top);
    if (width <= 0 || height <= 0) continue;
    const patch = await sharp(input).extract({ left, top, width, height }).blur(12).toBuffer();
    overlays.push({ input: patch, left, top });
  }
  return sharp(input).composite(overlays).png().toBuffer();
}

/** Step 3: light normalisation so every app sits in one family. */
const normalise = (img) => img.modulate({ saturation: 0.92 }).linear(1.02, -2);

/** E-ink: greyscale, 4-level posterise, faint paper grain generated in code. */
async function eink(buf, w, h) {
  const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
  const levels = [0x22, 0x6e, 0xb0, 0xe4];
  let seed = 0x9e3779b9;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff);
  const outData = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < outData.length; i++) {
    const v = data[i * info.channels];
    const q = levels[Math.min(3, Math.floor((v / 256) * 4))];
    outData[i] = Math.max(0, Math.min(255, q + Math.round((rand() - 0.5) * 10)));
  }
  return sharp(outData, { raw: { width: info.width, height: info.height, channels: 1 } }).resize(w, h);
}

/** Paper: greyscale ink multiplied onto an off-white sheet. */
async function paper(buf, w, h) {
  const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const k = data[i * info.channels] / 255;
    out[i * 3] = Math.round(PAPER.r * k);
    out[i * 3 + 1] = Math.round(PAPER.g * k);
    out[i * 3 + 2] = Math.round(PAPER.b * k);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).resize(w, h);
}

/** Encode WebP q80; e-ink and paper use lossless when that is smaller. */
async function encode(img, device) {
  const lossy = await img.clone().webp({ quality: 80 }).toBuffer();
  if (device !== 'eink-800x480' && device !== 'paper-a4') return lossy;
  const lossless = await img.clone().webp({ lossless: true }).toBuffer();
  return lossless.length < lossy.length ? lossless : lossy;
}

/** Render one size: crop to the target aspect anchored at the top, then the device treatment. */
async function render(redacted, device, w, h) {
  const cropped = await normalise(sharp(redacted).resize(w, h, { fit: 'cover', position: 'top' })).sharpen({ sigma: 0.5 }).png().toBuffer();
  if (device === 'eink-800x480') return encode(await eink(cropped, w, h), device);
  if (device === 'paper-a4') return encode(await paper(cropped, w, h), device);
  return encode(sharp(cropped), device);
}

async function dominant(buf) {
  const { dominant: d } = await sharp(buf).stats();
  return `#${[d.r, d.g, d.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

async function newer(src, outs) {
  if (force) return true;
  const s = (await stat(src)).mtimeMs;
  for (const o of outs) if (!existsSync(o) || (await stat(o)).mtimeMs < s) return true;
  return false;
}

await mkdir(OUT, { recursive: true });
const rawFiles = existsSync(RAW) ? new Set(await readdir(RAW)) : new Set();
const previous = existsSync(path.join(OUT, 'manifest.json')) ? JSON.parse(await readFile(path.join(OUT, 'manifest.json'), 'utf8')) : null;
const rebuildAll = force || previous?.pipelineVersion !== PIPELINE_VERSION;

const entries = [];
const missing = [];

for (const s of screens) {
  const face = faces[s.id];
  if (!face) throw new Error(`src/lib/screen-faces.json has no face size for "${s.id}"`);
  const [fw, fh] = face;
  const [vw, vh] = s.viewport;
  let found = false;

  for (const lang of ['en', 'pt']) {
    const rawName = lang === 'en' ? `${s.id}.png` : `${s.id}.pt.png`;
    if (!rawFiles.has(rawName)) continue;
    found = true;
    const src = path.join(RAW, rawName);
    const base = lang === 'en' ? s.id : `${s.id}.pt`;
    const files = { '1x': `${base}.webp`, '2x': `${base}@2x.webp`, page: `${base}.page.webp` };
    const outs = Object.values(files).map((f) => path.join(OUT, f));

    const redacted = await redact(await readFile(src), lang === 'pt' && s.redactPt ? s.redactPt : s.redact);
    const meta = await sharp(redacted).metadata();
    const pageW = Math.min(PAGE_MAX_W, meta.width);
    const pageH = Math.round((pageW * vh) / vw);

    if (rebuildAll || (await newer(src, outs))) {
      await writeFile(outs[0], await render(redacted, s.device, fw, fh));
      await writeFile(outs[1], await render(redacted, s.device, fw * 2, fh * 2));
      await writeFile(outs[2], await render(redacted, s.device, pageW, pageH));
      console.log(`screens: ${base} processed`);
    }
    const spill = s.device === 'eink-800x480' || s.device === 'paper-a4' || s.device === 'print-card' ? null : await dominant(outs[0]);
    entries.push({ id: s.id, project: s.project, device: s.device, lang, width: fw, height: fh, page: { width: pageW, height: pageH }, files, dominant: spill });
  }
  if (!found) missing.push(s.id);
}

await writeFile(
  path.join(OUT, 'manifest.json'),
  JSON.stringify({ pipelineVersion: PIPELINE_VERSION, screens: entries, missing }, null, 2) + '\n',
);

const have = new Set(entries.map((e) => e.id)).size;
console.log(`screens: ${have}/${screens.length} screens ready`);
if (missing.length) console.warn(`screens: WARNING missing raw captures (illustrated fallback will be used): ${missing.join(', ')}`);
