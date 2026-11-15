#!/usr/bin/env node
/**
 * Open Graph / Twitter images, 1200x630, one per language (SPEC §12).
 * Rendered locally with Playwright using the site's own fonts and committed to public/og/,
 * because the CI build has no browser and sharp's SVG renderer has no access to the fonts.
 * Re-run after changing the name, the tagline or the research lines:  npm run og
 */
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const ui = JSON.parse(await readFile(path.join(root, 'content/ui-strings.json'), 'utf8'));
const { sections, projects } = JSON.parse(await readFile(path.join(root, 'content/projects.json'), 'utf8'));
// Fonts are inlined: a page set with setContent() cannot load file:// fonts.
const font = async (f) => `data:font/woff2;base64,${(await readFile(path.join(root, 'public/fonts', f))).toString('base64')}`;
const fontB = await font('bricolage-grotesque-latin-opsz-normal.woff2');
const fontM = await font('ibm-plex-mono-latin-400-normal.woff2');
const OUT = path.join(root, 'public/og');

// Same mapping as src/lib/spectrum.ts
function wl(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else { r = 1; }
  return `rgb(${[r, g, b].map((v) => Math.round(255 * Math.pow(v, 0.8))).join(',')})`;
}
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function particles() {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let out = '';
  for (let i = 0; i < 260; i++) {
    const x = rnd() * 1200, y = rnd() * 560, nm = 440 + rnd() * 230;
    // Brighter, excited particles on the right, as after a pulse.
    const d = Math.hypot(x - 880, y - 250);
    const e = Math.max(0, 1 - d / 330) ** 1.5;
    const r = 1.2 + e * 2.6, a = 0.16 + e * 0.84;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${wl(nm)}" fill-opacity="${a.toFixed(2)}"/>`;
    if (e > 0.25) out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 5).toFixed(1)}" fill="${wl(nm)}" fill-opacity="${(e * 0.12).toFixed(2)}"/>`;
  }
  return out;
}

function html(lang) {
  const lines = sections.research.map((id) => projects[id].spectrumWavelengthNm).map((nm) => {
    const left = ((nm - 420) / 260) * 100;
    return `<i style="left:${left}%;background:${wl(nm)};box-shadow:0 0 10px ${wl(nm)},0 0 22px ${wl(nm)}"></i>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:B;src:url(${fontB}) format('woff2');font-weight:200 800}
  @font-face{font-family:M;src:url(${fontM}) format('woff2');font-weight:400}
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;overflow:hidden;background:radial-gradient(ellipse at 70% 40%,#0f1a24 0%,#090E13 70%);color:#E9EFF2;font-family:B,sans-serif;position:relative}
  svg.f{position:absolute;inset:0}
  .ring{position:absolute;left:880px;top:250px;width:520px;height:520px;margin:-260px 0 0 -260px;border-radius:50%;border:1.5px solid rgba(25,216,232,.35)}
  .t{position:absolute;left:80px;top:150px;width:760px}
  .t::before{content:"";position:absolute;inset:-80px -200px -80px -120px;z-index:-1;background:radial-gradient(ellipse at 30% 50%,rgba(9,14,19,.85) 0%,rgba(9,14,19,.5) 45%,transparent 72%)}
  h1{font-size:118px;font-weight:800;line-height:.9;letter-spacing:-.035em}
  p{margin-top:28px;font-size:44px;font-weight:500;color:#19D8E8}
  .band{position:absolute;left:80px;right:80px;bottom:78px;height:34px}
  .band b{position:absolute;inset:0;border-radius:3px;opacity:.18;background:linear-gradient(90deg,#4b1d8f 0%,#2a3cff 14%,#00a3ff 28%,#00d9a0 42%,#8fe03a 54%,#ffe23a 64%,#ff9a1f 76%,#ff3b1f 88%,#7a0a0a 100%)}
  .band i{position:absolute;top:0;width:3px;height:100%;margin-left:-1.5px;opacity:.9}
  .u{position:absolute;left:80px;bottom:34px;font:400 22px M,monospace;color:#8696a1}
  .u span{color:#FFB45E}
  </style></head><body>
  <svg class="f" viewBox="0 0 1200 630" width="1200" height="630" style="mix-blend-mode:screen">${particles()}</svg>
  <div class="ring"></div>
  <div class="t"><h1>${esc(site.person.name)}</h1><p>${esc(ui[lang]['hero.tag'])}</p></div>
  <div class="band"><b></b>${lines}</div>
  <div class="u">${esc(site.person.siteUrl.replace(/^https?:\/\//, ''))}/<span>${lang}</span></div>
  </body></html>`;
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const lang of ['en', 'pt']) {
    await page.setContent(html(lang), { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      if (![...document.fonts].every((f) => f.status === 'loaded')) throw new Error('og: a font failed to load');
    });
    const png = await page.screenshot({ type: 'png' });
    const file = path.join(OUT, `${lang}.png`);
    await sharp(png).png({ compressionLevel: 9, effort: 10 }).toFile(file);
    console.log(`og: ${path.relative(root, file)}`);
  }
} finally {
  await browser.close();
}
