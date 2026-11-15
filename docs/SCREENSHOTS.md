# Real screenshots on the workbench

The devices on the workbench show real captures of each app, adapted to the site's look so a laptop on the bench reads as a lit screen in a dark room and not as a pasted image. The list of screens lives in `content/screens.json`.

## Folders

```
assets/screens/raw/   inputs: <id>.png, optional <id>.pt.png (committed)
assets/screens/out/   generated: <id>[.pt].webp and @2x (generated at build, gitignored)
```

## Getting the raw captures

Each entry in screens.json has a `source`:

| source | Who | How |
|---|---|---|
| `url-public` | Claude Code | Playwright script `scripts/capture.mjs`: opens `url` at `viewport`, waits for network idle, captures the viewport. For PT/EN, toggle the app's language switcher and capture both. |
| `url-login` | Claude Code with Cristiano | Same script, logging in with demo credentials read from environment variables (`SCREEN_<ID>_USER`, `SCREEN_<ID>_PASS`) in a local `.env.screens` that is gitignored. Ask Cristiano for the URL and a demo account first. Never commit credentials, cookies or storage state. |
| `url-or-manual` | Either | Try the URL if one is known; otherwise ask Cristiano for the file. |
| `manual` | Cristiano | He drops `<id>.png` into `assets/screens/raw/`. When a phase needs a missing manual capture, list exactly which ids are missing and what each should show (the `how` field). |

Before the first capture session, give Cristiano a checklist in Portuguese with every `manual` and `url-login` id, the device, the aspect ratio and what should be on screen.

## Privacy and redaction

- Demo data only. If a capture shows a real person's name, email, address, phone, avatar, token or chat id, it must be redacted.
- Redaction is declared, not hand-painted: add `"redact": [[x, y, w, h], ...]` (in raw-image pixels) to the entry, and the pipeline blurs those rectangles (Gaussian, sigma 12) before anything else.
- Never capture screens from real citizens in PUREPOLIS or cir4fun.

## Processing pipeline (`npm run screens`, also run in the build)

Use `sharp`. For each raw file:

1. Apply `redact` blurs.
2. Crop to the device aspect ratio from `viewport`, anchored at the top (`position: 'top'`), then resize to 1× and 2× of the face size the bench uses (store the face sizes in one table in code, derived from the prototype).
3. Light normalisation so every app sits in one family: `modulate({ saturation: 0.92 })`, `linear(1.02, -2)`, a very light sharpen after downscaling.
4. Device-specific treatment:
   - `eink-800x480`: greyscale, threshold-free; then a 4-level posterise and a faint paper texture (generate the noise in code), so it reads as e-ink.
   - `paper-a4`: greyscale ink, multiplied onto an off-white paper colour `#FBFBF8`.
   - `print-card`: keep colours; this is a printed card.
   - all screens (phone, tablet, laptop, monitor): no baked effect beyond step 3.
5. Encode WebP quality 80 (e-ink and paper: lossless if smaller).
6. Write a manifest `assets/screens/out/manifest.json` with id, language, width, height and the missing ids.

## Making them look like lit screens (CSS, not baked)

Inside each device face:
- `img` with `object-fit: cover; object-position: top`.
- A glass layer above it: `linear-gradient(155deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 38%)`.
- An inner edge shadow: `box-shadow: inset 0 0 0 1px rgba(0,0,0,.35), inset 0 0 18px rgba(0,0,0,.35)`.
- Screen brightness in the dark scene: `filter: brightness(.94)` on the image, and a faint light spill on the mat in front of large screens (a blurred rectangle in the screen's dominant colour at 15% opacity; compute the dominant colour in the pipeline and store it in the manifest).
- E-ink and paper get no glass and no spill.

## Fallback

If an id is missing from the manifest, the device renders the illustrated mock from `reference/prototype.html` (`scrLuna`, `scrTwins`, `scrTrmnl`, `scrP30`, `scrTigtag`, `scrPurepolis`, `scrCir4fun`, `scrPlanner`, `scrGerador`, `scrHome`, `scrNutri`, `scrExpo`). The build prints the missing ids as a warning, never as an error.

## Project pages

Each `/<lang>/projects/<id>/` page shows the same screenshot larger, inside a simple device frame, with the case study text below.

## Implementation notes (Phase 5)

- `npm run capture [-- <id> ...]` runs `scripts/capture.mjs`; `npm run screens` runs `scripts/screens.mjs`, which `npm run build` also runs first.
- Face sizes live in `src/lib/screen-faces.json` (mat units, measured from `buildBench()`). Each raw file produces `<id>[.pt].webp` (1×), `@2x.webp` and `.page.webp` (viewport aspect, at most 960 px wide) for the project pages.
- `redactPt` overrides `redact` for the `.pt.png` capture when the Portuguese layout differs.
- Optional per-entry `capture` settings (`waitFor`, `delayMs`, `login` selectors, `langs` with a `click` selector or `url` per language) are documented at the top of `scripts/capture.mjs`.
- The manifest stores the dominant colour for the light spill (`null` for e-ink, paper and the print card). Outputs are rebuilt only when the raw file is newer, or when `PIPELINE_VERSION` in `screens.mjs` changes.
- The checklist for Cristiano is `docs/CAPTURAS.md` (Portuguese).
