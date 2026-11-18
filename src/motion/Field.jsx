import { useEffect, useRef } from 'react';
import { useGame } from '../game/GameProvider.jsx';
import { reducedMotion, accentHex, isTouch } from './motion.js';

const GAP = 34;          // px between dots
const REACH = 150;       // cursor influence radius
const RING_SPEED = 900;  // ripple speed, px/s
const RING_WIDTH = 70;

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [110, 240, 180];
}

// The living background: a dot grid that leans away from the cursor, an aurora glow,
// and ripples sent with bus.emit('fx:pulse', { x, y, color?, power? }).
export default function Field() {
  const { bus } = useGame();
  const ref = useRef(null);

  useEffect(() => {
    if (reducedMotion()) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext?.('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const fit = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const rings = [];
    let accent = hexToRgb(accentHex());
    let accentClock = 0;
    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const minGap = isTouch() ? 50 : 0; // ~20fps on phones to save battery

    const onMove = (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; if (mouse.x < -999) { mouse.x = e.clientX; mouse.y = e.clientY; } };
    const onLeave = () => { mouse.tx = -9999; mouse.ty = -9999; };
    const onDown = (e) => rings.push({ x: e.clientX, y: e.clientY, t: 0, power: 0.45, rgb: accent });
    const offPulse = bus.on('fx:pulse', ({ x, y, color, power = 1 } = {}) => {
      rings.push({ x: x ?? w / 2, y: y ?? h / 2, t: 0, power, rgb: color ? hexToRgb(color) : accent });
      if (rings.length > 8) rings.shift();
    });

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      if (minGap && now - lastDraw < minGap && !rings.length) return;
      lastDraw = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      accentClock += dt;
      if (accentClock > 0.5) { accentClock = 0; accent = hexToRgb(accentHex()); }

      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 10);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 10);
      for (const r of rings) r.t += dt;
      while (rings.length && rings[0].t * RING_SPEED > Math.hypot(w, h)) rings.shift();

      ctx.clearRect(0, 0, w, h);

      // Aurora: two soft glows drifting slowly.
      const t = now / 1000;
      const glow = (x, y, r, rgb, a) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      glow(w * (0.25 + 0.12 * Math.sin(t * 0.13)), h * (0.3 + 0.1 * Math.cos(t * 0.11)), Math.max(w, h) * 0.45, accent, 0.07);
      glow(w * (0.8 + 0.1 * Math.cos(t * 0.09)), h * (0.75 + 0.12 * Math.sin(t * 0.07)), Math.max(w, h) * 0.4, [92, 120, 255], 0.05);
      if (mouse.x > -999) glow(mouse.x, mouse.y, 260, accent, 0.06);

      // Dot grid
      const ox = (w % GAP) / 2;
      const oy = (h % GAP) / 2;
      for (let y = oy; y < h + GAP; y += GAP) {
        for (let x = ox; x < w + GAP; x += GAP) {
          let px = x, py = y, a = 0.07, size = 1.4;
          let rgb = null;

          const dx = x - mouse.x, dy = y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < REACH) {
            const f = 1 - d / REACH;
            const push = f * f * 10;
            px += (dx / (d || 1)) * push;
            py += (dy / (d || 1)) * push;
            a += f * 0.55;
            size += f * 1.4;
            rgb = accent;
          }

          for (const r of rings) {
            const rd = Math.hypot(x - r.x, y - r.y);
            const off = Math.abs(rd - r.t * RING_SPEED);
            if (off < RING_WIDTH) {
              const f = (1 - off / RING_WIDTH) * r.power * Math.max(0, 1 - r.t / 1.6);
              px += ((x - r.x) / (rd || 1)) * f * 9;
              py += ((y - r.y) / (rd || 1)) * f * 9;
              a += f * 0.7;
              size += f * 1.6;
              rgb = r.rgb;
            }
          }

          const c = rgb || [169, 179, 193];
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(0.9, a)})`;
          ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
      }
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener('resize', fit);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      offPulse();
      window.removeEventListener('resize', fit);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [bus]);

  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
