import { useEffect, useRef } from 'react';
import { profile, text } from '../data/profile.js';
import { onScrollProgress, motionOn } from '../motion/motion.js';

// Footer. `bot` is the night-shift bot (Step 9).
export default function Footer({ bot = null, onDanger = null }) {
  const word = useRef(null);
  // The outlined wordmark fills with the accent colour as you reach the bottom.
  useEffect(() => {
    const el = word.current;
    if (!el || !motionOn()) { el?.style.setProperty('--fill', '100%'); return; }
    return onScrollProgress(el, (p) => el.style.setProperty('--fill', `${(p * 100).toFixed(1)}%`), { start: 1, end: 0.55 });
  }, []);
  return (
    <footer className="foot wrap">
      {bot}
      <p className="foot-word" aria-hidden="true" ref={word}>{profile.handle}</p>
      <p className="foot-fine mono">
        <span>© 2026 {profile.name} · {profile.city}</span>
        {text.footer?.line && <span>{text.footer.line}</span>}
        {onDanger && (
          <button type="button" className="foot-danger" onClick={onDanger} data-cur="don't">do not press</button>
        )}
      </p>
    </footer>
  );
}
