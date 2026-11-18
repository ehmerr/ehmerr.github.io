import { useEffect } from 'react';
import { motionOn } from './motion.js';

// Adds `.in` to [data-reveal] and [data-reveal-stagger] elements as they scroll into view.
// Children of [data-reveal-stagger] get --i (0, 1, 2…) so CSS can stagger them.
// Reveal styles only apply under html.js-motion, so content is never hidden if this doesn't run.
export function useReveal() {
  useEffect(() => {
    const SEL = '[data-reveal]:not([data-seen]), [data-reveal-stagger]:not([data-seen]), [data-reveal-wave]:not([data-seen])';
    if (!motionOn() || typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('[data-reveal], [data-reveal-stagger], [data-reveal-wave]').forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    const scan = () => {
      document.querySelectorAll(SEL).forEach((el) => {
        el.setAttribute('data-seen', '');
        if (el.hasAttribute('data-reveal-stagger')) [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
        io.observe(el);
      });
    };
    scan();
    // New content (opened diffs, drawers…) gets picked up too; batched to one scan per frame.
    let raf = 0;
    const mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; scan(); }); });
    mo.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);
}

// Tracks which section is on screen; returns nothing, calls setActive(id).
export function useActiveSection(ids, setActive) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); }),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids, setActive]);
}
