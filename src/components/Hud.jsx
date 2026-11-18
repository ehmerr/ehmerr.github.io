import { useEffect, useRef } from 'react';
import { useGame } from '../game/GameProvider.jsx';
import { centerOf } from '../motion/motion.js';

// Bottom-right HUD: achievements counter (bumps and throws sparks on unlock), plus bot controls.
export default function Hud({ text = 'all quiet', children = null }) {
  const { found, total, setAchOpen, bus } = useGame();
  const btn = useRef(null);
  const prev = useRef(found.size);

  useEffect(() => {
    if (found.size <= prev.current) { prev.current = found.size; return; }
    prev.current = found.size;
    const el = btn.current;
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth; // restart the animation
    el.classList.add('bump');
    const at = centerOf(el);
    bus.emit('fx:burst', { ...at, kind: 'sparks', count: 26 });
    bus.emit('fx:pulse', { ...at, power: 1.2 });
  }, [found.size, bus]);

  return (
    <div className="hud mono">
      <button ref={btn} type="button" className="hud-btn hud-ach" aria-label={`Achievements: ${found.size} of ${total} found`} onClick={() => setAchOpen(true)} data-cur="secrets">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="9" r="6" />
          <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
        </svg>
        {found.size}/{total}
      </button>
      <span className="live-dot" aria-hidden="true" />
      <span className="hud-text">{text}</span>
      {children}
    </div>
  );
}
