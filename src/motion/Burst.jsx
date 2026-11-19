import { useEffect, useRef } from 'react';
import { useGame } from '../game/GameProvider.jsx';
import { reducedMotion, accentHex } from './motion.js';

// One canvas for all particle effects. Idle (no animation loop) until something fires:
//   bus.emit('fx:burst', { x, y, kind: 'confetti' | 'sparks' | 'shards' | 'smoke', colors?, count? })
export default function Burst() {
  const { bus } = useGame();
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext?.('2d');
    if (!ctx) return;
    let parts = [];
    let raf = 0;
    let last = 0;

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();

    const spawn = ({ x, y, kind = 'sparks', colors, count }) => {
      if (reducedMotion()) return;
      const pal = colors?.length ? colors : [accentHex(), '#5CC8FF', '#C4A1FF', '#FFB86B', '#F5E663'];
      const n = count ?? { confetti: 90, sparks: 28, shards: 14, smoke: 12 }[kind] ?? 20;
      for (let i = 0; i < n; i++) {
        const ang = kind === 'confetti' ? -Math.PI / 2 + (Math.random() - 0.5) * 1.9 : Math.random() * Math.PI * 2;
        const sp = {
          confetti: 380 + Math.random() * 520,
          sparks: 160 + Math.random() * 380,
          shards: 120 + Math.random() * 260,
          smoke: 20 + Math.random() * 50,
        }[kind];
        parts.push({
          kind, x, y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - (kind === 'shards' ? 120 : 0),
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 14,
          size: { confetti: 5 + Math.random() * 5, sparks: 2 + Math.random() * 2, shards: 4 + Math.random() * 6, smoke: 10 + Math.random() * 14 }[kind],
          color: pal[i % pal.length],
          life: 0,
          max: { confetti: 2.6, sparks: 0.7 + Math.random() * 0.4, shards: 1.1, smoke: 1.2 }[kind],
        });
      }
      if (parts.length > 600) parts = parts.slice(-600);
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };

    const frame = (now) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      parts = parts.filter((p) => (p.life += dt) < p.max);
      for (const p of parts) {
        const k = p.life / p.max;
        if (p.kind === 'smoke') {
          p.vy -= 30 * dt;
          p.size += 22 * dt;
        } else {
          p.vy += (p.kind === 'confetti' ? 900 : p.kind === 'shards' ? 1100 : 300) * dt;
          const drag = p.kind === 'confetti' ? 0.985 : 0.97;
          p.vx *= drag; p.vy *= p.kind === 'confetti' ? 0.99 : 1;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.globalAlpha = p.kind === 'smoke' ? 0.35 * (1 - k) : Math.min(1, 1.6 * (1 - k));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.kind === 'confetti') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 * (0.4 + Math.abs(Math.sin(p.rot * 2))));
        } else if (p.kind === 'sparks') {
          ctx.fillRect(-p.size * 3, -p.size / 2, p.size * 6, p.size);
        } else if (p.kind === 'shards') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.8, p.size * 0.6); ctx.lineTo(-p.size * 0.7, p.size * 0.5);
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = '#8B95A3';
          ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      raf = parts.length ? requestAnimationFrame(frame) : 0;
      if (!raf) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };

    const off = bus.on('fx:burst', spawn);
    window.addEventListener('resize', fit);
    return () => { off(); cancelAnimationFrame(raf); window.removeEventListener('resize', fit); };
  }, [bus]);

  return <canvas ref={ref} className="burst" aria-hidden="true" />;
}
