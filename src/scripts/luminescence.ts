/**
 * Hero luminescence sample (SPEC §5), ported from reference/prototype.html.
 * Canvas 2D only. Progressive enhancement: the hero is complete without this.
 */
import { wl } from '../lib/spectrum';

export const LUMI = {
  /** Particle count = min(W·H / areaPerParticle, cap). */
  areaPerParticle: 1900,
  capPointer: 700,
  capTouch: 260,
  maxDpr: 2,
  nmMin: 440,
  nmMax: 670,
  /** Drift velocity range, ±px/s. */
  drift: 5,
  /** Excitation source (the cursor). */
  sourceNm: 365,
  sourceRadius: 120,
  excitationRate: 5,
  /** Exponential lifetime of the emission, seconds. */
  tau: 0.6,
  /** Click/tap pulse. */
  pulseReach: 320,
  pulseFalloff: 400,
  ringSpeed: 850,
  ringMax: 400,
  /** One orchestrated pulse after load, as fractions of the canvas. */
  loadPulseMs: 700,
  loadPulseAt: [0.68, 0.42] as const,
  /** Rendering. */
  trail: 'rgba(9,14,19,.38)',
  haloThreshold: 0.25,
  ringColour: '25,216,232',
  /** Instrument trace. */
  traceFrames: 220,
  traceFloor: 30,
  traceColour: '#FFB45E',
  /** Largest frame step, so a long pause does not jump the simulation. */
  maxDt: 0.05,
  /**
   * Legibility: behind the text, a particle's excitation glow is drawn at this fraction
   * (rendering only; physics and the emission count are unchanged). The trail lets a static
   * particle build up to ~2.6× its per-frame brightness, hence the low value. Keeps text ≥ 4.5:1 at peak glow.
   */
  textDim: 0.02,
  /** Covers the largest halo radius (5 × 3.6 px) so halos from outside cannot sum up behind the text. */
  textPad: 22,
  textSelectors: 'h1, .tag, .lede, .ctas',
} as const;

interface Particle { x: number; y: number; vx: number; vy: number; e: number; c: [number, number, number] }
interface Ring { x: number; y: number; r: number }

export function startLuminescence(hero: HTMLElement) {
  const field = hero.querySelector<HTMLCanvasElement>('[data-field]');
  const trace = hero.querySelector<HTMLCanvasElement>('[data-trace]');
  const counts = hero.querySelector<HTMLElement>('[data-counts]');
  const hint = hero.querySelector<HTMLElement>('[data-hint]');
  const cx = field?.getContext('2d');
  const tx = trace?.getContext('2d');
  if (!field || !trace || !cx || !tx) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const C = LUMI;

  if (hint) hint.textContent = (touch ? hint.dataset.touch : hint.dataset.mouse) ?? '';
  hero.classList.add('is-live');

  let W = 0, H = 0;
  let particles: Particle[] = [];
  let rings: Ring[] = [];
  const mouse = { x: -999, y: -999, on: false };
  const hist = new Array<number>(C.traceFrames).fill(0);

  const makeParticle = (): Particle => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 2 * C.drift,
    vy: (Math.random() - 0.5) * 2 * C.drift,
    e: 0,
    c: wl(C.nmMin + Math.random() * (C.nmMax - C.nmMin)),
  });

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, C.maxDpr);
    const oldW = W, oldH = H;
    W = field!.clientWidth;
    H = field!.clientHeight;
    if (!W || !H) return;
    field!.width = Math.round(W * dpr);
    field!.height = Math.round(H * dpr);
    cx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    trace!.width = Math.round(trace!.clientWidth * dpr);
    trace!.height = Math.round(trace!.clientHeight * dpr);
    tx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Keep existing particles (rescaled) so a mobile address-bar resize does not reset the sample.
    if (oldW && oldH) for (const p of particles) { p.x *= W / oldW; p.y *= H / oldH; }
    const n = Math.floor(Math.min((W * H) / C.areaPerParticle, touch ? C.capTouch : C.capPointer));
    if (particles.length > n) particles.length = n;
    while (particles.length < n) particles.push(makeParticle());
    cx!.fillStyle = '#090e13';
    cx!.fillRect(0, 0, W, H);
    measureText();
    wake();
  }

  /** Text boxes in canvas coordinates, padded. */
  let textBoxes: [number, number, number, number][] = [];
  function measureText() {
    const c = field!.getBoundingClientRect();
    const pad = C.textPad;
    textBoxes = [...hero.querySelectorAll(C.textSelectors)].flatMap((el) =>
      [...el.getClientRects()].map((r) => [r.left - c.left - pad, r.top - c.top - pad, r.right - c.left + pad, r.bottom - c.top + pad] as [number, number, number, number]),
    );
    textBlock = textBoxes.length
      ? textBoxes.reduce((u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])])
      : null;
  }
  /** Union of the text boxes: one rectangle, so overlapping boxes never cancel out in the clip. */
  let textBlock: [number, number, number, number] | null = null;
  function behindText(x: number, y: number) {
    for (const b of textBoxes) if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) return true;
    return false;
  }

  function local(e: PointerEvent) {
    const r = field!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function pulse(x: number, y: number) {
    rings.push({ x, y, r: 0 });
    for (const p of particles) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < C.pulseReach) p.e = Math.max(p.e, 1 - d / C.pulseFalloff);
    }
    wake();
  }

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const { x, y } = local(e);
    mouse.x = x; mouse.y = y; mouse.on = true;
    wake();
  });
  hero.addEventListener('pointerleave', () => { mouse.on = false; });
  hero.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('a,button')) return;
    const { x, y } = local(e);
    pulse(x, y);
  });

  // Loop control: run only while the hero is on screen and the tab is visible.
  let onScreen = true;
  let raf = 0;
  let last = 0;
  let total = 0;

  function wake() {
    if (raf || !onScreen || document.hidden) return;
    last = 0; // first frame after waking uses a nominal step
    raf = requestAnimationFrame(frame);
  }
  function sleep() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  new IntersectionObserver(([entry]) => {
    onScreen = !!entry?.isIntersecting;
    onScreen ? wake() : sleep();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? sleep() : wake()));
  new ResizeObserver(resize).observe(field);

  function frame(t: number) {
    raf = 0;
    // rAF timestamps can precede the moment the frame was requested, so clamp to [0, maxDt].
    const dt = last ? Math.min(Math.max((t - last) / 1000, 0), C.maxDt) : 1 / 60;
    last = t;

    cx!.globalCompositeOperation = 'source-over';
    cx!.fillStyle = C.trail;
    cx!.fillRect(0, 0, W, H);
    cx!.globalCompositeOperation = 'lighter';

    let I = 0;
    const k = Math.exp(-dt / C.tau);
    for (const p of particles) {
      if (!reduce) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W;
        if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H;
      }
      if (mouse.on) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < C.sourceRadius) p.e = Math.min(1, p.e + dt * C.excitationRate * (1 - d / C.sourceRadius));
      }
      p.e *= k;
      I += p.e;
      const [r, g, b] = p.c;
      const dim = behindText(p.x, p.y) ? C.textDim : 1;
      const s = 1 + p.e * dim * 2.6;
      cx!.fillStyle = `rgba(${r},${g},${b},${0.14 + p.e * 0.86 * dim})`;
      cx!.beginPath(); cx!.arc(p.x, p.y, s, 0, 6.283); cx!.fill();
      if (p.e > C.haloThreshold && dim === 1) {
        cx!.fillStyle = `rgba(${r},${g},${b},${p.e * 0.12})`;
        cx!.beginPath(); cx!.arc(p.x, p.y, s * 5, 0, 6.283); cx!.fill();
      }
    }

    cx!.globalCompositeOperation = 'source-over';
    // Rings and the source outline are clipped out of the text boxes.
    cx!.save();
    cx!.beginPath();
    cx!.rect(0, 0, W, H);
    if (textBlock) cx!.rect(textBlock[0], textBlock[1], textBlock[2] - textBlock[0], textBlock[3] - textBlock[1]);
    cx!.clip('evenodd');
    rings = rings.filter((q) => q.r < C.ringMax);
    cx!.lineWidth = 1.5;
    for (const q of rings) {
      q.r += dt * C.ringSpeed;
      cx!.strokeStyle = `rgba(${C.ringColour},${Math.max(0, 1 - q.r / C.ringMax)})`;
      cx!.beginPath(); cx!.arc(q.x, q.y, q.r, 0, 6.283); cx!.stroke();
    }
    if (mouse.on) {
      cx!.strokeStyle = `rgba(${C.ringColour},.3)`;
      cx!.setLineDash([3, 5]);
      cx!.beginPath(); cx!.arc(mouse.x, mouse.y, C.sourceRadius, 0, 6.283); cx!.stroke();
      cx!.setLineDash([]);
    }
    cx!.restore();

    // Instrument trace: summed emission over the last frames, auto-scaled with a floor.
    hist.push(I); hist.shift();
    const w = trace!.clientWidth, h = trace!.clientHeight;
    let max: number = C.traceFloor;
    for (const v of hist) if (v > max) max = v;
    tx!.clearRect(0, 0, w, h);
    tx!.strokeStyle = 'rgba(233,239,242,.07)';
    tx!.lineWidth = 1;
    for (let i = 1; i < 4; i++) { tx!.beginPath(); tx!.moveTo(0, (h * i) / 4); tx!.lineTo(w, (h * i) / 4); tx!.stroke(); }
    tx!.strokeStyle = C.traceColour;
    tx!.lineWidth = 1.6;
    tx!.beginPath();
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * w, y = h - 3 - (v / max) * (h - 8);
      i ? tx!.lineTo(x, y) : tx!.moveTo(x, y);
    });
    tx!.stroke();

    const rounded = Math.round(I * 100);
    if (counts && rounded !== total) { total = rounded; counts.textContent = rounded.toLocaleString('en'); }

    // With reduced motion nothing drifts, so the loop sleeps once the sample and the trace are dark.
    const settled = reduce && !mouse.on && rings.length === 0 && I < 0.01 && hist.every((v) => v < 0.01);
    if (!settled && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  }

  resize();
  document.fonts?.ready.then(measureText);
  if (!reduce) setTimeout(() => pulse(W * C.loadPulseAt[0], H * C.loadPulseAt[1]), C.loadPulseMs);
}
