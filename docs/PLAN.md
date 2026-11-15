# Implementation plan

Work one phase at a time. At the end of each phase: build passes, tick the boxes in this file, commit, push, and give Cristiano a short summary in Portuguese with open questions and any missing screenshots or content todos.

## Phase 0: scaffold and deploy pipeline
- [ ] Astro project at the repo root, static output, TypeScript strict, current stable versions pinned exactly. `.nvmrc` with Node LTS.
- [ ] `.gitignore` (node_modules, dist, `.env*`, `assets/screens/out/`).
- [ ] `.github/workflows/deploy.yml` with the official Astro GitHub Pages action, triggered on push to `main` and manually.
- [ ] Pages source set to "GitHub Actions". If the API call is not allowed from the session, give Cristiano the exact clicks (Settings → Pages → Source → GitHub Actions).
- [ ] A placeholder page deploys to https://whysoseriusbro.github.io.

Acceptance: a push to `main` publishes the site; the Actions run is green.

## Phase 1: content layer, routes, static HTML
- [ ] Typed loaders for `content/projects.json`, `ui-strings.json`, `site.json`, `screens.json` (zod or TS types; fail the build on a malformed entry).
- [ ] Routes from SPEC §2: `/`, `/en/`, `/pt/`, `/en/projects/<id>/`, `/pt/projects/<id>/`, `404`.
- [ ] Home page sections render as plain HTML from content, in both languages: hero text, research rows + publications, workbench fallback list, theatre playbill, contact.
- [ ] Language router at `/` and the PT/EN switch with hash preservation (SPEC §11).

Acceptance: with JavaScript disabled, every piece of content is readable in both languages; no hard-coded copy in components.

## Phase 2: design system and layout
- [ ] Tokens from SPEC §3 as CSS custom properties; self-hosted Bricolage Grotesque and IBM Plex Mono (WOFF2, latin + latin-ext).
- [ ] Top bar, section layout, buttons, focus ring, theatre styling, contact, footer, matching the prototype at 1440 px and 390 px.

Acceptance: side by side with `reference/prototype.html`, the static parts match; contrast AA everywhere.

## Phase 3: hero island
- [ ] Port the luminescence simulation and the instrument strip (SPEC §5) into an island component; constants in one config object.
- [ ] Offscreen and hidden-tab pause, DPR cap, touch path, reduced-motion path, single load pulse.

Acceptance: 60 fps on a mid laptop, no long tasks over 50 ms after load on a mid Android (DevTools CPU 4× slowdown), text legible at peak glow.

## Phase 4: spectrum and case-study panel
- [ ] Spectrum band, lines from wavelengths, rows with two-way highlight.
- [ ] Case-study panel (SPEC §9): side panel / bottom sheet, focus trap, Escape, language re-render, `#p-<id>` deep links.
- [ ] Project pages with the same content and JSON-LD `CreativeWork`.

Acceptance: keyboard-only user can open and close every case study; deep link opens the right panel.

## Phase 5: screenshot pipeline
- [ ] `scripts/capture.mjs` (Playwright) for `url-public` and `url-login` entries, credentials from `.env.screens` only.
- [ ] `scripts/screens.mjs` (sharp) implementing SCREENSHOTS.md, wired as `npm run screens` and into the build.
- [ ] Checklist in Portuguese for Cristiano with every capture he must provide.

Acceptance: running the pipeline with some raw files missing still builds and lists the missing ids; redaction rectangles are applied.

## Phase 6: workbench island
- [ ] CSS 3D mat, box builder, device builders, all 14 projects with the layout from the prototype.
- [ ] Screens use processed screenshots with glass overlay and light spill; fallback mocks when missing.
- [ ] Labels never occluded at the overview camera; hover lift per project; pills.
- [ ] Camera overview/focus with the desktop shift for the panel; mobile pill flow with bottom sheet.

Acceptance: every object and pill opens the right case study and focuses the camera; works with mouse, touch and keyboard; reduced motion jumps instead of animating; runs smoothly on a mid Android (if not, report numbers and options before switching to Three.js).

## Phase 7: SEO and sharing
- [ ] JSON-LD `Person`, OG/Twitter images per language, hreflang, canonical, sitemap, robots, 404.

Acceptance: Rich Results Test passes for `Person`; link previews show the right image and text in both languages.

## Phase 8: QA and handover
- [ ] Lighthouse mobile ≥ 90 on `/en/` and `/pt/`; axe with zero serious issues.
- [ ] Manual pass: keyboard only, screen reader smoke test (NVDA or TalkBack), reduced motion, 390 px, 768 px, 1440 px, Chrome, Firefox, Safari if available.
- [ ] Final list for Cristiano: open `todo` fields in projects.json, missing links in site.json, missing screenshots.

## Later (not now)
- Real case-study media (photos of the LUNA prototype, demo videos).
- Thesis result after 25 Nov 2026.
- A KiCad 3D render of the LUNA PCB on the bench.
