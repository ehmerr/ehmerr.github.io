import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/GameProvider.jsx';
import BotSprite from './BotSprite.jsx';

const REST = 70; // cable length at rest (px)

// A bot hanging on a cable in the hero. Click to swing, drag to stretch; it springs back.
export default function HangingBot() {
  const { unlock, play } = useGame();
  const [pos, setPos] = useState({ x: 0, y: REST });
  const st = useRef({ x: 0, y: REST, vx: 0, vy: 0, held: false });
  const raf = useRef(0);

  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = st.current;
      if (!s.held) {
        // damped spring back to (0, REST)
        const k = 60;
        const d = 5;
        s.vx += (-k * s.x - d * s.vx) * dt;
        s.vy += (-k * (s.y - REST) - d * s.vy) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      setPos((p) => (Math.abs(p.x - s.x) < 0.1 && Math.abs(p.y - s.y) < 0.1 ? p : { x: s.x, y: s.y }));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const onDown = (e) => {
    e.preventDefault();
    const s = st.current;
    const start = { x: e.clientX, y: e.clientY, sx: s.x, sy: s.y };
    let moved = false;
    const move = (ev) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (Math.hypot(dx, dy) > 4) moved = true;
      if (!moved) return;
      s.held = true;
      s.x = Math.max(-160, Math.min(160, start.sx + dx));
      s.y = Math.max(20, Math.min(320, start.sy + dy));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!moved) {
        s.vx += (Math.random() < 0.5 ? -1 : 1) * 260;
        play('pop');
      } else if (Math.hypot(s.x, s.y - REST) > 80) {
        unlock('stretch');
        play('pop');
      }
      s.held = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="hang">
      <svg className="hang-cable" width="340" height="360" viewBox="-170 0 340 360" aria-hidden="true">
        <circle cx="0" cy="4" r="4" fill="var(--accent)" />
        <path d={`M0 4 Q ${pos.x * 0.3} ${pos.y * 0.6} ${pos.x} ${pos.y}`} stroke="#8B95A3" strokeWidth="1.5" fill="none" />
      </svg>
      <button
        type="button"
        className="hang-bot"
        style={{ transform: `translate(${pos.x - 20}px, ${pos.y - 2}px) rotate(${pos.x * 0.15}deg)` }}
        onPointerDown={onDown}
        aria-label="A small bot hanging on a cable. Click to swing it, or drag to stretch the cable."
      >
        <BotSprite color="var(--accent)" />
      </button>
    </div>
  );
}
