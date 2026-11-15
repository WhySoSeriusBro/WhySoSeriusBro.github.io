# Site specification

Approved direction: a hybrid of two concepts. **Luminescence** (the hero is a luminescent sample the visitor excites with the cursor, and research projects are emission lines on a spectrum) and **Workbench** (every project is a realistic object on a 3D cutting mat; software projects appear on the device they run on, showing a real screenshot).

The single source of visual truth is `reference/prototype.html`. Open it in a browser while building. Where this spec and the prototype disagree, this spec wins.

---

## 1. Audience and job

Three audiences at once: recruiters, industry, academia. Within 30 seconds a visitor must know who Cristiano is, what he builds, and how to verify it. The interactive parts are the hook; the evidence (projects, papers, CV, contact) must stay one click away at all times.

## 2. Information architecture

```
/              language router (see §11)
/en/           single long page: hero, research, workbench, theatre, contact
/pt/           same page in European Portuguese
/en/projects/<id>/   one static page per project (SEO, sharing, no-JS fallback)
/pt/projects/<id>/
/404.html
```

Section anchors on the home page: `#top`, `#research`, `#bench`, `#theatre`, `#contact`. A case study can be opened by hash: `#p-<id>` (for example `/en/#p-luna`). On load, if the hash names a project, open its panel (and focus the bench camera if the project is on the bench).

## 3. Design tokens

Colours

| Token | Value | Use |
|---|---|---|
| `--deep` | `#090E13` | page background |
| `--graphite` | `#111820` | panels, case-study drawer |
| `--paper` | `#E9EFF2` | primary text |
| `--steel` | `#8696A1` | secondary text, captions |
| `--cyan` | `#19D8E8` | primary action, focus ring, excitation rings |
| `--amber` | `#FFB45E` | instrument readouts, awards, bench labels |
| `--mat` | `#1F3D36` | cutting mat |

Spectrum colours are computed from wavelength (`wl()` in the prototype), never hard-coded.

Type
- Display and body: **Bricolage Grotesque** (variable, weights 400/500/700/800, opsz axis).
- Data and readouts: **IBM Plex Mono** 400/500, only for real data (instrument readouts, dates, stack tags).
- Self-host both as WOFF2 subsets (latin + latin-ext for Portuguese). `font-display: swap`.
- Scale: h1 `clamp(3rem, 8vw, 7rem)`, line-height .9, tracking -0.035em; h2 `clamp(1.9rem, 3.6vw, 2.8rem)`; body 1.05–1.12rem, line-height 1.5; max line length 34–38rem.

Spacing: section padding `96px var(--pad)` with `--pad: clamp(20px, 4vw, 56px)`.

Avoid: all-caps labels, gradient text, one-word colour accents in headlines, decorative numbering.

## 4. Top bar

Sticky, translucent `--deep` with blur. Left: CB monogram (SVG in the prototype). Right: nav (Research, Workbench, Theatre, Contact), **CV (PDF)** as the only filled button, then the PT/EN switch. Under 860 px wide, only the CV button and the language switch stay visible.

The CV button and the contact links only render when `content/site.json → person.links` has a value. No placeholder hrefs in production.

## 5. Hero: the luminescent sample

Full-bleed canvas behind the name and text, filling the first viewport (min-height `calc(100vh - bar)`, 88vh on mobile).

Physics (port from the prototype, keep the numbers):
- Particles: count `min(W·H/1900, 700)` on pointer devices, cap 260 on touch. Device pixel ratio capped at 2.
- Each particle has a wavelength uniformly drawn from 440–670 nm and the colour `wl(nm)`.
- Slow drift, ±5 px/s, wrapping at the edges.
- Excitation: the mouse is a 365 nm source with radius 120 px. A particle inside gains `e += dt·5·(1 − d/120)`, capped at 1.
- Decay: `e *= exp(−dt/τ)` with **τ = 0.6 s**. This is the point: the glow decays with a real exponential lifetime.
- Pulse: click or tap fires an excitation ring (cyan, expands at 850 px/s to 400 px) and sets `e = max(e, 1 − d/400)` within 320 px.
- One orchestrated pulse 700 ms after load, at 68% / 42% of the canvas, so touch visitors see the effect once. No other autoplay.
- Rendering: trail by painting `rgba(9,14,19,.38)` each frame, additive blending for particles, glow halo when `e > .25`.

Instrument strip at the bottom of the hero:
- Trace canvas: the summed emission `Σe` over the last 220 frames, amber line, auto-scaled with a floor of 30.
- Readout (hidden on mobile): source 365 nm, emission counts `round(Σe·100)`, τ 0.60 s.
- One-line hint, different for mouse and touch (strings in `ui-strings.json`).

Legibility: the text column sits on a radial dark scrim (see `.intro::before` in the prototype) plus a soft text-shadow. Pointer events pass through the text, except the two buttons.

Behaviour:
- Pause the animation loop when the hero is off screen (IntersectionObserver) and when the tab is hidden.
- `prefers-reduced-motion`: no drift, no load pulse; hover and click still excite and decay (the user caused it).
- No JavaScript: the name, tagline, text and buttons render on the dark gradient; nothing is missing.

## 6. Research and work: the spectrum

- Heading, subheading, then a 420–680 nm band (gradient at 16% opacity).
- Each project in `sections.research` is an emission line at its `spectrumWavelengthNm`, with a glow in its own colour.
- Under the band, one row per project: colour swatch, name, hook, meta. Hovering or focusing a row lights its line and the other way round.
- Clicking a line or a row opens the case-study panel (§9). Rows are real `<button>`s; lines are decorative duplicates (`tabindex=-1`, `aria-hidden`).
- Under the rows: "Papers and talks" from `site.json → publications`.
- Mobile: rows collapse to two lines (name + hook, then meta) with the swatch on the left.

## 7. Workbench

A cutting mat (1800 × 1000 mat units, 50-unit major grid, 10-unit minor grid) seen in perspective (`rotateX(52deg) rotateZ(-16deg)`), built with CSS 3D transforms like the prototype. CSS 3D is the default; Three.js is not needed here unless CSS proves too slow on mid-range Android (measure first, then ask).

Objects: every project in `sections.workbench` is one or more boxes. A box is six faces (top + four sides) with side faces darkened from the body colour. Positions and shapes are in `buildBench()` of the prototype: treat those coordinates as the layout source of truth.

Device mapping (what each project looks like):

| Project | Objects |
|---|---|
| luna | Laser pointer on a printed sleeve, optics module (open, beam, glowing cuvette, BPW21), electronics module (open: breadboard, ESP32-WROOM-32E, blue ADS1115, LM6142, resistors, jumpers), USB power bank, phone with the ESP32 dashboard |
| twins | Monitor with the dataspace dashboard, three dev boards: ESP32-C6, ESP8266 (press), ESP32-S2 (water) |
| gestures | Raspberry Pi 5 with active cooler, ribbon cable, camera module on a stand, Govee bulb glowing |
| trmnl | Standing 7.5" e-ink display |
| p30 | Phone on a desk stand, landscape |
| tigtag | Phone + two NFC tags (tag-01, tag-02) |
| arvore | Printed card with the QR and voxel tree |
| planner | Large monitor |
| gerador | Monitor + printed newsletter page on the mat |
| cir4fun | Laptop |
| homehunter | Laptop |
| purepolis | Phone |
| lusonutri | Tablet, portrait |
| expo | Tablet, landscape |

Screens: every device screen shows the processed **real screenshot** for that project (`assets/screens/out/<id>[.pt].webp`, see SCREENSHOTS.md), placed as an `<img>` inside the face, `object-fit: cover`, `object-position: top`, with the device's glass overlay on top. If a screenshot is missing, render the illustrated mock from the prototype (the `scrXxx()` functions) so the bench is never empty, and log the missing id at build time.

Labels: amber tag on the mat in front of each project (`22px` mat units, bold, dark text). Labels must never be hidden behind tall objects at the overview camera; adjust positions if they are.

Camera:
- Overview: scale `min(stageW/2120, stageH/880)`, slight tilt following the pointer (±4°, desktop only, off with reduced motion).
- Focus: clicking an object or its pill animates the mat so the project's bounding box is centred and zoomed (`translate` in mat space, then scale up to 1.6, 700 ms ease). On desktop the camera shifts left by up to 260 px so the open panel does not cover the object. Closing the panel returns to the overview.
- Hover lifts all objects of the same project by 18 units.

Stage height: `clamp(420px, 58vw, 720px)`; 340 px on mobile. On mobile the pills under the stage are the primary way in: tapping one scrolls the stage into view, focuses the camera and opens the panel as a bottom sheet so the object stays visible above it.

No JavaScript: the bench is replaced by a plain list of project cards with the screenshot, name and hook, each linking to the project page.

## 8. Theatre ("On stage" / "Em palco")

Two columns: intro text + the FATAL note on the left; a playbill on the right, built from `site.json → theatre`: year, title, "after Macbeth" line, role, award badge; then a row of the plays he wrote and directed. Warm amber spotlight from the top right. Never list the items in `doNotList`.

## 9. Case-study panel

Fields, in order: category (mono, small), name, status badge, "My role", "The problem", "What I built", "Result", stack tags, links, plus a link "Open project page".
- Desktop: right side panel, 520 px, slides in 350 ms. Light scrim (12%) when opened from the bench, darker (50%) otherwise.
- Mobile (< 860 px): bottom sheet, 62vh, rounded top corners.
- Dialog semantics: `role="dialog"`, `aria-modal`, labelled by the title, focus moves to Close, focus is trapped, Escape closes, focus returns to the trigger.
- Switching language while open re-renders the open project.
- Fields that only have a `todo` are omitted (the label too).
- Links render only when a URL exists. The `links` arrays in projects.json are labels for now; Cristiano will supply URLs (add a `urls` map next to them when he does).

## 10. Contact and footer

Heading, one sentence, then link buttons for each non-null link in `site.json → person.links` plus GitHub. Footer line with © year and "Built with Astro" in mono. No contact form.

## 11. Languages

- Two complete trees, `/en/` and `/pt/`, generated from the same components and the same JSON.
- `<html lang="en">` / `<html lang="pt-PT">`, `hreflang` alternates on every page, `x-default` → `/en/`.
- The switch in the bar links to the same page and hash in the other language and stores the choice in `localStorage` (`cb-lang`, wrapped in try/catch).
- `/` (root): a tiny static page that picks a language from the stored choice, else `navigator.language` starting with `pt`, else English, and redirects with `location.replace`. `<noscript>` and a visible pair of links cover the no-JS case.

## 12. SEO and sharing

- JSON-LD `Person` on both home pages: name, url, jobTitle ("AI X Lab Manager"), worksFor Nova SBE, alumniOf NOVA FCT, knowsAbout (instrumentation, analog front-ends, embedded systems, digital twins, full-stack web), sameAs (GitHub plus any link that exists).
- JSON-LD `CreativeWork` on each project page; `ScholarlyArticle` for publications once they have a URL or DOI.
- Unique title and description per page and language. Open Graph and Twitter card with a 1200 × 630 image per language (generate at build time or ship static; dark background, name, "Making the invisible visible." / "Tornar o invisível visível.").
- `sitemap.xml`, `robots.txt`, canonical URLs, custom `404.html` in both languages (one page, two blocks).

## 13. Accessibility

WCAG 2.2 AA. Contrast is checked on the real backgrounds, including text over the hero canvas at peak glow. Every interactive element is reachable and operable by keyboard with a visible cyan focus ring. Canvas elements are `aria-hidden`. Motion follows §5 and §7 for reduced-motion users.

## 14. Performance

Budgets in CLAUDE.md. Additional rules: hero script is an island loaded `client:idle` but painted immediately with the static gradient; workbench is `client:visible`; screenshots are WebP with `width`/`height`, `loading="lazy"`, `decoding="async"`, and a 2× variant through `srcset`; fonts are preloaded (one file per family).

## 15. Content rules

- All copy comes from `content/`. Do not paraphrase it in code.
- Unverified claims stay out. The current gaps are marked `todo` in projects.json.
- The thesis is "defence scheduled" until 25 Nov 2026. After that date, Cristiano will confirm the result and the wording changes; do not change it automatically.
- Papers for 2027 are "forthcoming" / "em preparação", never "published".
