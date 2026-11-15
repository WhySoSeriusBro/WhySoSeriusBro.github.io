#!/usr/bin/env node
/**
 * Raw screenshot capture with Playwright (docs/SCREENSHOTS.md).
 * Captures entries of content/screens.json whose source is `url-public`, `url-login`,
 * or `url-or-manual` with a URL, into assets/screens/raw/<id>[.pt].png.
 *
 * Usage:
 *   npm run capture                 # every capturable entry
 *   npm run capture -- purepolis-citizen planner-board
 *
 * Credentials for `url-login` come only from a local, gitignored `.env.screens`:
 *   SCREEN_PUREPOLIS_CITIZEN_USER=...
 *   SCREEN_PUREPOLIS_CITIZEN_PASS=...
 * Nothing is persisted: no cookies, no storage state, no traces.
 *
 * Optional per-entry "capture" settings in screens.json:
 *   "capture": {
 *     "waitFor": "css selector to wait for before the shot",
 *     "delayMs": 500,
 *     "login": { "url": "...", "user": "selector", "pass": "selector", "submit": "selector", "after": "selector" },
 *     "langs": { "en": { "click": "selector" | null, "url": "..." }, "pt": { ... } }
 *   }
 * Without "langs", one capture is saved as <id>.png.
 */
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(root, 'assets/screens/raw');
const envFile = path.join(root, '.env.screens');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const { screens } = JSON.parse(await readFile(path.join(root, 'content/screens.json'), 'utf8'));
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));

const capturable = screens.filter(
  (s) => s.url && (s.source === 'url-public' || s.source === 'url-login' || s.source === 'url-or-manual') && (!only.length || only.includes(s.id)),
);
const unknown = only.filter((id) => !screens.some((s) => s.id === id));
if (unknown.length) throw new Error(`Unknown screen ids: ${unknown.join(', ')}`);

const envKey = (id, what) => `SCREEN_${id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${what}`;

async function settle(page, s) {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  if (s.capture?.waitFor) await page.waitForSelector(s.capture.waitFor, { timeout: 30_000 });
  await page.waitForTimeout(s.capture?.delayMs ?? 400);
}

async function login(page, s) {
  const user = process.env[envKey(s.id, 'USER')];
  const pass = process.env[envKey(s.id, 'PASS')];
  if (!user || !pass) throw new Error(`${s.id}: set ${envKey(s.id, 'USER')} and ${envKey(s.id, 'PASS')} in .env.screens (demo account only)`);
  const L = s.capture?.login ?? {};
  await page.goto(L.url ?? s.url, { waitUntil: 'domcontentloaded' });
  await page.fill(L.user ?? 'input[type=email], input[name=email], input[name=username], input[autocomplete=username]', user);
  await page.fill(L.pass ?? 'input[type=password]', pass);
  if (L.submit) await page.click(L.submit);
  else await page.press(L.pass ?? 'input[type=password]', 'Enter');
  if (L.after) await page.waitForSelector(L.after, { timeout: 30_000 });
  else await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
}

if (!capturable.length) {
  console.log('capture: nothing to capture (no entries with a URL and a url-* source).');
  process.exit(0);
}

await mkdir(RAW, { recursive: true });
const browser = await chromium.launch();
const failures = [];
try {
  for (const s of capturable) {
    const [width, height] = s.viewport;
    // A fresh context per screen: no state is shared or kept.
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale: 'en-GB' });
    const page = await context.newPage();
    try {
      if (s.source === 'url-login') await login(page, s);
      const langs = s.capture?.langs ?? { en: {} };
      for (const [lang, how] of Object.entries(langs)) {
        await page.goto(how.url ?? s.url, { waitUntil: 'domcontentloaded' });
        await settle(page, s);
        if (how.click) {
          await page.click(how.click);
          await settle(page, s);
        }
        const file = path.join(RAW, lang === 'en' ? `${s.id}.png` : `${s.id}.${lang}.png`);
        await page.screenshot({ path: file });
        console.log(`capture: ${path.relative(root, file)}`);
      }
    } catch (err) {
      failures.push(s.id);
      console.error(`capture: ${s.id} failed: ${err instanceof Error ? err.message.split('\n')[0] : err}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(`capture: failed: ${failures.join(', ')}`);
  process.exitCode = 1;
}
