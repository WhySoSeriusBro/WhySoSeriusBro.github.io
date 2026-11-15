# Reference prototype

`prototype.html` is the approved single-file prototype from the planning phase. It is the visual and interaction reference for the real site: look, layout, motion constants, the workbench coordinates (`buildBench()`), and the illustrated screen mocks used as fallbacks (`scrXxx()` functions).

It is not production code. Do not import it, serve it, or copy it wholesale. Port each part into Astro components as described in `docs/SPEC.md`.

Known shortcuts in the prototype that the real site must not keep: copy inlined in JavaScript (the site reads `content/`), placeholder links, illustrated mocks instead of real screenshots, no focus trap in the panel, Google Fonts from the CDN.
