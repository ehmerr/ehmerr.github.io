import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from './motion.js';

// Counts the number inside a value like "~64%" or "3" up from 0 when it scrolls into view.
export default function CountUp({ value, ms = 1400 }) {
  const raw = String(value);
  const m = raw.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
  const [shown, setShown] = useState(raw); // the real value first: it's what the pre-built HTML shows
  const ref = useRef(null);

  useEffect(() => {
    if (!m || reducedMotion() || typeof IntersectionObserver === 'undefined') { setShown(raw); return; }
    const [, pre, num, post] = m;
    setShown(`${pre}0${post}`);
    const target = parseFloat(num);
    const decimals = (num.split('.')[1] || '').length;
    let raf = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms);
        const eased = 1 - Math.pow(1 - k, 3);
        setShown(`${pre}${(target * eased).toFixed(decimals)}${post}`);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.6 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, ms]);

  return (
    <span ref={ref} className="count">
      <span aria-hidden="true">{shown}</span>
      <span className="sr">{raw}</span>
    </span>
  );
}
