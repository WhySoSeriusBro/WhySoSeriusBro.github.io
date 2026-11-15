/**
 * Case-study panel (SPEC §9) on a native modal <dialog>: focus moves to Close, the page
 * behind is inert (focus trap), Escape closes, focus returns to the trigger.
 * Rows, cards and lines carry data-open-case="<id>". The URL hash mirrors the open
 * project (#p-<id>), so deep links and the language switch reopen it.
 *
 * Events for other islands (the workbench camera in Phase 6):
 *   'case:open'  detail { id, from }   'case:close'  detail { id }
 */

export type CaseSource = 'research' | 'bench' | 'link';

const SLIDE_MS = 350;
const HASH = /^#p-([a-z0-9-]+)$/;

let dialog: HTMLDialogElement | null = null;
let body: HTMLElement | null = null;
let current: string | null = null;
let returnTo: HTMLElement | null = null;
let closeTimer = 0;

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function template(id: string) {
  return document.querySelector<HTMLTemplateElement>(`template[data-case="${CSS.escape(id)}"]`);
}

export function openCase(id: string, opts: { trigger?: HTMLElement | null; from?: CaseSource } = {}) {
  const tpl = template(id);
  if (!dialog || !body || !tpl) return false;
  const from = opts.from ?? 'link';

  window.clearTimeout(closeTimer);
  // trigger: undefined = whatever has focus now; null = none (deep link), so closing falls back to the project's row.
  const trigger = opts.trigger === undefined ? (document.activeElement as HTMLElement | null) : opts.trigger;
  const usable = trigger && trigger !== document.body ? trigger : null;
  if (!dialog.open || usable) returnTo = usable;

  current = id;
  body.replaceChildren(tpl.content.cloneNode(true));
  // Light scrim when the bench camera shows the object behind the panel (bench clicks and deep links to bench projects).
  const onBench = !!document.querySelector(`[data-pill="${CSS.escape(id)}"]`);
  dialog.classList.toggle('light', from === 'bench' || (from === 'link' && onBench));
  dialog.scrollTop = 0;

  if (!dialog.open) dialog.showModal();
  // Next frame, so the slide-in transition runs from the closed position (also when reopened mid-close).
  if (!dialog.classList.contains('is-open')) requestAnimationFrame(() => dialog!.classList.add('is-open'));
  dialog.querySelector<HTMLElement>('[data-case-close]')?.focus();

  const hash = `#p-${id}`;
  if (location.hash !== hash) history.replaceState(history.state, '', hash);
  document.dispatchEvent(new CustomEvent('case:open', { detail: { id, from } }));
  return true;
}

export function closeCase() {
  if (!dialog?.open) return;
  const id = current;
  current = null;
  dialog.classList.remove('is-open');
  // Return focus to the trigger, or to the project's row when the panel came from a deep link.
  const target = returnTo?.isConnected ? returnTo : id ? fallbackTarget(id) : null;
  returnTo = null;
  const finish = () => {
    dialog!.close(); // the page stops being inert only now, so focus after this
    body!.replaceChildren();
    target?.focus({ preventScroll: true });
  };
  if (reduce()) finish();
  else closeTimer = window.setTimeout(finish, SLIDE_MS);

  if (HASH.test(location.hash)) history.replaceState(history.state, '', location.pathname + location.search);
  document.dispatchEvent(new CustomEvent('case:close', { detail: { id } }));
}

/** A visible, focusable control for the project: research row, bench object, pill or card. */
function fallbackTarget(id: string) {
  const sel = CSS.escape(id);
  const candidates = document.querySelectorAll<HTMLElement>(
    `a[data-open-case="${sel}"], [data-open-case="${sel}"][tabindex="0"], [data-pill="${sel}"]`,
  );
  return [...candidates].find((el) => el.getClientRects().length > 0) ?? null;
}

function openFromHash() {
  const m = HASH.exec(location.hash);
  if (m?.[1]) {
    if (m[1] !== current) openCase(m[1], { trigger: null, from: 'link' });
  } else if (current) {
    closeCase();
  }
}

export function initCasePanel() {
  dialog = document.querySelector<HTMLDialogElement>('[data-case-panel]');
  body = dialog?.querySelector<HTMLElement>('[data-case-body]') ?? null;
  if (!dialog || !body) return;

  dialog.querySelector('[data-case-close]')?.addEventListener('click', closeCase);
  // Escape: animate out instead of the dialog's instant close.
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeCase(); });
  // A click on the backdrop lands on the dialog element itself, outside its box.
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog!.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeCase();
  });

  // Any element with data-open-case opens the panel. Links keep working with modifier keys
  // (new tab) and without JavaScript, where they go to the project page.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-open-case]') : null;
    if (!el || dialog!.contains(el)) return;
    const id = el.dataset.openCase!;
    const from = (el.closest('[data-case-from]') as HTMLElement | null)?.dataset.caseFrom as CaseSource | undefined;
    if (openCase(id, { trigger: el.tabIndex >= 0 ? el : null, from })) e.preventDefault();
  });

  window.addEventListener('hashchange', openFromHash);
  openFromHash();
}
