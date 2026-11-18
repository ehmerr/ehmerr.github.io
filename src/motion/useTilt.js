import { useEffect } from 'react';
import { reducedMotion, isTouch } from './motion.js';

// 3D tilt + glare for any element with data-tilt (optional value = max degrees, default 6).
// One delegated listener for the whole page; sets --rx --ry --gx --gy on the element.
export function useTilt() {
  useEffect(() => {
    if (reducedMotion() || isTouch()) return;
    let cur = null;
    let raf = 0;
    let evt = null;

    const reset = (el) => {
      if (!el) return;
      el.classList.remove('tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    const apply = () => {
      raf = 0;
      const e = evt;
      const el = e.target.closest?.('[data-tilt]');
      if (el !== cur) { reset(cur); cur = el; }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const max = parseFloat(el.getAttribute('data-tilt')) || 6;
      el.classList.add('tilting');
      el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
    };

    const move = (e) => { evt = e; if (!raf) raf = requestAnimationFrame(apply); };
    const leave = () => { reset(cur); cur = null; };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);
}
