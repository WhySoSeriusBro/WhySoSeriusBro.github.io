/**
 * Processed screenshots (scripts/screens.mjs output) for the workbench and project pages.
 * Build-time only. Missing ids simply have no entry; callers fall back to the mocks.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Lang } from './content';

interface ManifestEntry {
  id: string;
  project: string;
  device: string;
  lang: Lang;
  width: number;
  height: number;
  page: { width: number; height: number };
  files: { '1x': string; '2x': string; page: string };
  dominant: string | null;
}

export interface Shot {
  id: string;
  device: string;
  src: string;
  src2x: string;
  width: number;
  height: number;
  page: { src: string; width: number; height: number };
  dominant: string | null;
}

// Vite emits each file and returns its final, hashed URL.
const urls = import.meta.glob<string>('/assets/screens/out/*.webp', { eager: true, query: '?url', import: 'default' });
const url = (file: string) => urls[`/assets/screens/out/${file}`];

const manifestPath = path.resolve('assets/screens/out/manifest.json');
const entries: ManifestEntry[] = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')).screens : [];

/** Screenshots for one language: the .pt capture when it exists, else the English one. */
export function shotsFor(lang: Lang): Record<string, Shot> {
  const out: Record<string, Shot> = {};
  for (const e of entries) {
    if (e.lang !== lang && !(e.lang === 'en' && !out[e.id])) continue;
    if (out[e.id] && e.lang !== lang) continue;
    const src = url(e.files['1x']), src2x = url(e.files['2x']), page = url(e.files.page);
    if (!src || !src2x || !page) continue;
    out[e.id] = { id: e.id, device: e.device, src, src2x, width: e.width, height: e.height, page: { src: page, width: e.page.width, height: e.page.height }, dominant: e.dominant };
  }
  return out;
}

/** The main screenshot of a project (first screen listed for it), if any. */
export function projectShot(lang: Lang, project: string): Shot | undefined {
  const shots = shotsFor(lang);
  return entries.filter((e) => e.project === project).map((e) => shots[e.id]).find(Boolean);
}
