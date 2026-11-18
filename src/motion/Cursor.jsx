import { useEffect, useRef, useState } from 'react';
import { reducedMotion, isTouch } from './motion.js';

const HOT = '[data-cur], a, button, input, label, [role="button"], [role="option"]';

// A ring that trails the mouse, grows over anything clickable, and shows a label from data-cur.
// Desktop only; the normal cursor stays visible underneath.
export default function Cursor() {
  const [enabled] = useState(() => !isTouch() && !reducedMotion());
  const ring = useRef(null);
  const dot = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const pos = { x: -100, y: -100, rx: -100, ry: -100 };
    let raf = 0;
    let shown = false;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      pos.rx += (pos.x - pos.rx) * 0.2;
      pos.ry += (pos.y - pos.ry) * 0.2;
      if (ring.current) ring.current.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0)`;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    };
    raf = requestAnimationFrame(tick);

    const move = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!shown) { shown = true; ring.current?.classList.add('on'); dot.current?.classList.add('on'); pos.rx = pos.x; pos.ry = pos.y; }
      const hot = e.target.closest?.(HOT);
      const text = hot?.closest('[data-cur]')?.getAttribute('data-cur') || '';
      ring.current?.classList.toggle('hot', !!hot);
      ring.current?.classList.toggle('labelled', !!text);
      if (label.current && label.current.textContent !== text) label.current.textContent = text;
    };
    const down = () => ring.current?.classList.add('press');
    const up = () => ring.current?.classList.remove('press');
    const leave = () => { shown = false; ring.current?.classList.remove('on'); dot.current?.classList.remove('on'); };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.removeEventListener('pointerleave', leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className="cur-ring" aria-hidden="true">
        <span ref={label} className="cur-label mono" />
      </div>
      <div ref={dot} className="cur-dot" aria-hidden="true" />
    </>
  );
}
