// Shared motion helpers. Every effect checks these so reduced-motion and touch users get a calm site.

export const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// True when there's no precise pointer (phones, tablets): no custom cursor, tilt or magnetic buttons.
export const isTouch = () =>
  typeof window === 'undefined' || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

export const motionOn = () => typeof document !== 'undefined' && document.documentElement.classList.contains('js-motion');

export function accentHex() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  return v || '#6EF0B4';
}

// Centre of an element in viewport coordinates, for bursts and ripples.
export function centerOf(el) {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Calls cb(progress 0..1) as `el` scrolls through the viewport. Returns a cleanup function.
export function onScrollProgress(el, cb, { start = 0.85, end = 0.25 } = {}) {
  let raf = 0;
  const run = () => {
    raf = 0;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = r.height + vh * (start - end);
    const p = (vh * start - r.top) / (total || 1);
    cb(Math.max(0, Math.min(1, p)));
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
  run();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
