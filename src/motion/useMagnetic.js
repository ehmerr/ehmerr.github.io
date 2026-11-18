import { useEffect } from 'react';
import { reducedMotion, isTouch } from './motion.js';

// Elements with data-magnetic lean toward the cursor when it comes close, then spring back.
export function useMagnetic() {
  useEffect(() => {
    if (reducedMotion() || isTouch()) return;
    const RANGE = 70;
    const PULL = 0.28;
    let raf = 0;
    let evt = null;
    const pulled = new Set();

    const apply = () => {
      raf = 0;
      const { clientX: x, clientY: y } = evt;
      document.querySelectorAll('[data-magnetic]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -RANGE || r.top > window.innerHeight + RANGE) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const inside = Math.abs(dx) < r.width / 2 + RANGE && Math.abs(dy) < r.height / 2 + RANGE;
        if (inside && !el.disabled) {
          el.style.translate = `${(dx * PULL).toFixed(1)}px ${(dy * PULL).toFixed(1)}px`;
          el.classList.add('magnet');
          pulled.add(el);
        } else if (pulled.has(el)) {
          el.style.translate = '';
          el.classList.remove('magnet');
          pulled.delete(el);
        }
      });
    };
    const move = (e) => { evt = e; if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      pulled.forEach((el) => { el.style.translate = ''; el.classList.remove('magnet'); });
    };
  }, []);
}
