/**
 * Workbench island (SPEC §7): CSS 3D mat, camera overview/focus, hover lift, pills.
 * The mat HTML is built at compile time (src/lib/bench.js) and cloned from a template.
 * Opening a project goes through the shared case-study panel; the camera follows
 * the panel's 'case:open' / 'case:close' events.
 */
import { openCase } from './casePanel';

const MAT = { w: 1800, h: 1000 } as const;
const CAM = {
  rotX: 52,
  rotZ: -16,
  /** Overview scale = min(stageW / fitW, stageH / fitH). */
  fitW: 2120,
  fitH: 880,
  /** Pointer tilt, degrees (desktop only, off with reduced motion). */
  tiltZ: 8,
  tiltX: 5,
  focusMaxScale: 1.6,
  /** Desktop: shift the camera left so the open panel does not cover the object. */
  panelShiftMax: 260,
  panelShiftFrac: 0.2,
  narrow: 860,
} as const;

type BBox = { x0: number; y0: number; x1: number; y1: number };

export function initBench(section: HTMLElement) {
  const stage = section.querySelector<HTMLElement>('[data-bench-stage]');
  const tpl = section.querySelector<HTMLTemplateElement>('[data-bench-template]');
  if (!stage || !tpl) return;
  stage.append(tpl.content.cloneNode(true));
  const mat = stage.querySelector<HTMLElement>('[data-mat]')!;
  const bboxes: Record<string, BBox> = JSON.parse(mat.dataset.bboxes ?? '{}');
  const names = new Map([...section.querySelectorAll<HTMLButtonElement>('[data-pill]')].map((b) => [b.dataset.pill!, b.textContent ?? '']));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const narrow = () => innerWidth < CAM.narrow;
  if (reduce) mat.classList.add('no-motion');

  // Objects: group by project; the first object of each project is its keyboard stop.
  const groups = new Map<string, HTMLElement[]>();
  for (const o of mat.querySelectorAll<HTMLElement>('.obj[data-key]')) {
    const k = o.dataset.key!;
    groups.set(k, [...(groups.get(k) ?? []), o]);
  }
  for (const [k, objs] of groups) {
    objs.forEach((o, i) => {
      o.dataset.openCase = k;
      if (i === 0) {
        o.tabIndex = 0;
        o.setAttribute('role', 'button');
        o.setAttribute('aria-label', names.get(k) ?? k);
      } else {
        o.setAttribute('aria-hidden', 'true');
      }
      o.addEventListener('pointerenter', () => lift(k, true));
      o.addEventListener('pointerleave', () => lift(k, false));
      if (i === 0) {
        o.addEventListener('focus', () => lift(k, true));
        o.addEventListener('blur', () => lift(k, false));
        o.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openCase(k, { trigger: o, from: 'bench' });
          }
        });
      }
    });
  }
  function lift(k: string, on: boolean) {
    groups.get(k)?.forEach((o) => o.classList.toggle('lift', on));
  }

  // Pills: the primary way in on mobile. Scroll the stage into view first, then open.
  section.querySelectorAll<HTMLButtonElement>('[data-pill]').forEach((b) => {
    const k = b.dataset.pill!;
    b.addEventListener('pointerenter', () => lift(k, true));
    b.addEventListener('pointerleave', () => lift(k, false));
    b.addEventListener('focus', () => lift(k, true));
    b.addEventListener('blur', () => lift(k, false));
    b.addEventListener('click', () => {
      if (narrow()) stage.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      openCase(k, { trigger: b, from: 'bench' });
    });
  });

  // Camera
  let base = 1;
  let tiltX = 0, tiltZ = 0;
  let focusKey: string | null = null;
  let panelOpen = false;
  let raf = 0;

  function fit() {
    base = Math.min(stage!.clientWidth / CAM.fitW, stage!.clientHeight / CAM.fitH);
    apply();
  }
  function apply() {
    let pre = '', S = base, fx = 0, fy = 0, tx = tiltX, tz = tiltZ;
    const b = focusKey ? bboxes[focusKey] : undefined;
    if (b) {
      const W = stage!.clientWidth, H = stage!.clientHeight;
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      const bw = Math.max(b.x1 - b.x0, b.y1 - b.y0, 200);
      const shift = !narrow() && panelOpen ? Math.min(CAM.panelShiftMax, W * CAM.panelShiftFrac) : 0;
      S = Math.max(base, Math.min((W - shift * 2) / (bw * 1.7), H / (bw * 1.25), CAM.focusMaxScale));
      fx = MAT.w / 2 - cx; fy = MAT.h / 2 - cy;
      pre = `translateX(${-shift}px) `;
      tx = 0; tz = 0;
    }
    mat.style.transform = `${pre}scale(${S}) rotateX(${CAM.rotX + tx}deg) rotateZ(${CAM.rotZ + tz}deg) translate(${fx}px,${fy}px)`;
  }

  new ResizeObserver(fit).observe(stage);
  fit();

  if (!reduce && !touch) {
    stage.addEventListener('pointermove', (e) => {
      if (focusKey) return;
      const r = stage.getBoundingClientRect();
      tiltZ = ((e.clientX - r.left) / r.width - 0.5) * CAM.tiltZ;
      tiltX = ((e.clientY - r.top) / r.height - 0.5) * -CAM.tiltX;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; apply(); });
    });
    stage.addEventListener('pointerleave', () => { tiltX = tiltZ = 0; if (!focusKey) apply(); });
  }

  document.addEventListener('case:open', (e) => {
    const { id, from } = (e as CustomEvent<{ id: string; from: string }>).detail;
    panelOpen = true;
    // Bench clicks and deep links focus the camera; research rows keep the overview (as in the prototype).
    focusKey = from !== 'research' && bboxes[id] ? id : null;
    apply();
  });
  document.addEventListener('case:close', () => {
    panelOpen = false;
    focusKey = null;
    apply();
  });

  section.classList.add('is-live');
  // A deep link may have opened a bench project before the bench existed.
  const m = /^#p-([a-z0-9-]+)$/.exec(location.hash);
  if (m?.[1] && bboxes[m[1]] && document.querySelector('[data-case-panel][open]')) {
    panelOpen = true;
    focusKey = m[1];
    apply();
  }
}
