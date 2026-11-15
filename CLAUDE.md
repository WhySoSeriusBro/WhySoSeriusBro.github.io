# CLAUDE.md

Personal site of Cristiano Barata, served by GitHub Pages at https://whysoseriusbro.github.io (user site, so the base path is `/`).

This repository starts as a handoff: the spec, the content and a working prototype exist, the code does not. Build it phase by phase from `docs/PLAN.md`.

## Read first, in this order
1. `docs/SPEC.md`: what the site is and how every part behaves.
2. `docs/PLAN.md`: phases, tasks and acceptance criteria. Work one phase at a time.
3. `reference/prototype.html`: the approved visual and interaction reference (single-file prototype). Port behaviour and look from it; do not paste it into the site.
4. `content/*.json`: all copy and data, in English and European Portuguese. The site renders from these files.
5. `docs/SCREENSHOTS.md` and `content/screens.json`: how the real app screenshots on the workbench are captured and processed.
6. `docs/DECISIONS.md`: why things are the way they are, and the facts that were verified.

## Working with Cristiano
- Talk to him in European Portuguese. Code, comments, commit messages and technical docs in English.
- Ask before acting on anything ambiguous. Put the question in one message with your recommendation first.
- Prefer targeted diffs over rewrites when changing existing files.
- He manages version numbers himself. Never bump `version` in `package.json` or tag releases.
- Portuguese copy follows the 1990 Orthographic Agreement, European variant: "projeto", "atual", "ação", "espetáculo", "atores". Never Brazilian forms.
- Facts about him only come from `content/`. If a sentence needs a fact that is not there, ask. Never invent results, numbers, dates or awards. Entries with a `todo` field are known gaps: render nothing for that field, and list the open todos for him at the end of each phase.

## Stack (decided)
- Astro, static output, with client-side islands only where interaction needs them.
- Three.js is optional: the hero and the spectrum work on Canvas 2D in the prototype and that is fine. Only reach for Three.js if a phase in the plan says so.
- GSAP + ScrollTrigger for scroll-linked motion; Lenis only if it measurably improves the feel, and never when `prefers-reduced-motion` is set.
- Plain CSS with custom properties (tokens in SPEC §3). No CSS framework.
- Deploy: the official Astro GitHub Action to GitHub Pages, on push to `main`.
- At scaffold time, use the current stable versions and pin them exactly in `package.json`. Use Node LTS and set it in `.nvmrc` and in the workflow.

## Non-negotiables
- Every section renders as real HTML without JavaScript. Canvas, 3D and animation are progressive enhancement.
- `prefers-reduced-motion`: no drifting particles, no smooth scroll, no camera tweens; interactions still work.
- Keyboard: everything clickable is focusable, has a visible focus ring, and opens with Enter/Space. Escape closes the case-study panel and returns focus.
- Performance budget on mobile: Lighthouse performance ≥ 90, LCP < 2.5 s, CLS < 0.1, INP < 200 ms; JavaScript before first interaction ≤ 200 KB gzip.
- No external requests at runtime except Google Fonts (or self-host the fonts, preferred).
- No personal data beyond what `content/site.json` lists. Never publish a home address, phone number, or anything from a real user account in a screenshot.

## Commands
- `npm run dev`, `npm run build`, `npm run preview`
- `npm run screens`: process raw screenshots (see SCREENSHOTS.md; added in Phase 5)
- `npm run check`: Astro type check (link check and Lighthouse CI to be added)

## Definition of done for a phase
Build passes, the acceptance criteria in PLAN.md for that phase are checked off in the file, both languages render, mobile (390 px) and desktop (1440 px) were looked at, and a short summary in Portuguese is given to Cristiano with any open questions.
