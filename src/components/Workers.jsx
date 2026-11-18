import { useCallback, useEffect, useRef, useState } from 'react';
import { botNames, botColors, maxBots, jobs, quips, pick } from '../data/bots.js';
import { useGame } from '../game/GameProvider.jsx';
import BotSprite from './BotSprite.jsx';
import { reducedMotion as reduced } from '../motion/motion.js';

const W = 40;
const H = 46;
const G = 1800; // px/s²
const WALK = 34; // px/s
const LEDGES = '.term, .panel';


function readLedges() {
  const sy = window.scrollY;
  const sx = window.scrollX;
  const out = [];
  document.querySelectorAll(LEDGES).forEach((el) => {
    if (el.closest('.drawer, .pal, .sd-overlay')) return;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 40) return;
    out.push({ left: r.left + sx + 8, right: r.right + sx - 8, top: r.top + sy });
  });
  const docH = document.documentElement.scrollHeight;
  out.push({ left: 0, right: document.documentElement.clientWidth, top: docH - 2, ground: true });
  return out;
}

// Draggable, throwable worker bots that walk along the tops of panels.
export default function Workers({ onHudText }) {
  const { bus, unlock, play, bump, toast } = useGame();
  const [list, setList] = useState([]); // [{ id, name, color }]
  const [ui, setUi] = useState({}); // id → { say, strike, coffee, para }
  const bots = useRef(new Map()); // id → physics state
  const els = useRef(new Map());
  const ledges = useRef([]);
  const gScale = useRef(1);
  const nextId = useRef(0);
  const layerRef = useRef(null);
  const timers = useRef(new Set());
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.current.delete(t); fn(); }, ms);
    timers.current.add(t);
  };

  const setBotUi = useCallback((id, patch) => setUi((u) => ({ ...u, [id]: { ...u[id], ...patch } })), []);
  const say = useCallback(
    (id, text, ms = 2200) => {
      setBotUi(id, { say: text });
      later(() => setUi((u) => (u[id]?.say === text ? { ...u, [id]: { ...u[id], say: '' } } : u)), ms);
    },
    [setBotUi]
  );

  const spawn = useCallback(
    (opts = {}) => {
      if (bots.current.size >= maxBots) return null;
      const id = ++nextId.current;
      const name = botNames[(id - 1) % botNames.length];
      const color = botColors[(id - 1) % botColors.length];
      const ls = ledges.current.filter((l) => !l.ground);
      const docW = document.documentElement.clientWidth;
      let b;
      if (opts.para) {
        const x = 40 + Math.random() * (docW - 80 - W);
        b = { x, y: window.scrollY - 10, vx: 0, vy: 0, mode: 'para', dir: 1, annoy: 0, ledge: null };
      } else {
        const l = ls.length ? ls[Math.floor(Math.random() * ls.length)] : ledges.current[ledges.current.length - 1];
        const x = l.left + Math.random() * Math.max(1, l.right - l.left - W);
        b = { x, y: l.top, vx: 0, vy: 0, mode: 'walk', dir: Math.random() < 0.5 ? -1 : 1, annoy: 0, ledge: l, pause: 0 };
      }
      b.job = pick(jobs);
      bots.current.set(id, b);
      setList((L) => [...L, { id, name, color }]);
      if (opts.para) setBotUi(id, { para: true });
      return id;
    },
    [setBotUi]
  );

  // Initial crew, once layout has settled.
  useEffect(() => {
    const t = setTimeout(() => {
      ledges.current = readLedges();
      for (let i = 0; i < 3; i++) spawn();
    }, 1400);
    return () => clearTimeout(t);
  }, [spawn]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Physics loop
  useEffect(() => {
    let raf;
    let last = performance.now();
    let ledgeClock = 0;
    const still = reduced();

    const land = (b, prevFeet) => {
      const cx = b.x + W / 2;
      let best = null;
      for (const l of ledges.current) {
        if (cx < l.left || cx > l.right) continue;
        if (prevFeet <= l.top + 1 && b.y >= l.top && (!best || l.top < best.top)) best = l;
      }
      return best;
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ledgeClock += dt;
      if (ledgeClock > 1) { ledgeClock = 0; ledges.current = readLedges(); }
      const docW = document.documentElement.clientWidth;
      const layer = layerRef.current;
      if (layer) layer.style.height = `${document.documentElement.scrollHeight}px`;

      bots.current.forEach((b, id) => {
        const g = G * gScale.current;
        if (b.mode === 'held') {
          // position set by pointer
        } else if (b.mode === 'fall' || b.mode === 'fly' || b.mode === 'para') {
          const prev = b.y;
          if (b.mode === 'para') {
            b.vy = Math.min(b.vy + g * 0.2 * dt, 70);
            b.vx = Math.sin(now / 600 + id) * 18;
          } else {
            b.vy += g * dt;
          }
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < 0) { b.x = 0; b.vx = -b.vx * 0.5; }
          if (b.x > docW - W) { b.x = docW - W; b.vx = -b.vx * 0.5; }
          if (b.y - H < 0 && b.vy < 0) { b.y = H; b.vy = 0; }
          const l = b.vy >= 0 ? land(b, prev) : null;
          if (l) {
            const wasFlying = b.mode === 'fly';
            const wasPara = b.mode === 'para';
            b.y = l.top;
            b.vy = 0;
            b.vx = 0;
            b.ledge = l;
            b.mode = b.strikeUntil > now ? 'strike' : b.coffeeUntil > now ? 'coffee' : 'walk';
            if (wasPara) { setBotUi(id, { para: false }); say(id, pick(quips.hire)); }
            else if (wasFlying) say(id, pick(quips.landed));
          }
        } else {
          // walk / coffee / strike / idle on a ledge
          const l = b.ledge;
          const fresh = l && ledges.current.find((x) => Math.abs(x.left - l.left) < 3 && Math.abs(x.right - l.right) < 3 && Math.abs(x.top - l.top) < 200);
          if (!fresh) { b.mode = 'fall'; b.ledge = null; }
          else {
            b.ledge = fresh;
            b.y = fresh.top;
            if (b.mode === 'strike' && b.strikeUntil < now) { b.mode = 'walk'; b.annoy = 0; setBotUi(id, { strike: false }); }
            if (b.mode === 'coffee' && b.coffeeUntil < now) { b.mode = 'walk'; setBotUi(id, { coffee: false }); }
            if (b.mode === 'walk' && !still) {
              if (b.pause > 0) b.pause -= dt;
              else {
                b.x += b.dir * WALK * dt;
                if (b.x < fresh.left) { b.x = fresh.left; b.dir = 1; }
                if (b.x > fresh.right - W) { b.x = fresh.right - W; b.dir = -1; }
                if (Math.random() < dt * 0.25) { b.pause = 1.5 + Math.random() * 3; b.job = pick(jobs); }
              }
            }
            if (gScale.current < 1 && b.mode === 'walk') { b.mode = 'fly'; b.vy = -380 - Math.random() * 200; b.vx = (Math.random() - 0.5) * 120; }
          }
        }
        const el = els.current.get(id);
        if (el) {
          el.style.transform = `translate3d(${b.x}px, ${b.y - H}px, 0)`;
          el.dataset.mode = b.mode;
          el.dataset.dir = b.dir < 0 ? 'l' : 'r';
          el.dataset.busy = b.pause > 0 ? '1' : '0';
        }
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [say, setBotUi]);

  // Pointer: poke or drag-and-throw
  const onDown = (id) => (e) => {
    const b = bots.current.get(id);
    if (!b) return;
    e.preventDefault();
    const start = { x: e.pageX, y: e.pageY, t: performance.now() };
    const offX = e.pageX - b.x;
    const offY = e.pageY - b.y;
    let moved = false;
    let hist = [start];
    const prevMode = b.mode;

    const move = (ev) => {
      const dx = ev.pageX - start.x;
      const dy = ev.pageY - start.y;
      if (!moved && Math.hypot(dx, dy) > 6) {
        moved = true;
        b.mode = 'held';
        say(id, pick(quips.thrown), 1500);
      }
      if (moved) {
        b.x = ev.pageX - offX;
        b.y = ev.pageY - offY;
        hist.push({ x: ev.pageX, y: ev.pageY, t: performance.now() });
        if (hist.length > 6) hist = hist.slice(-6);
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!moved) {
        b.annoy += 1;
        play('pop');
        if (prevMode === 'strike') say(id, pick(quips.strike));
        else if (prevMode === 'coffee') say(id, pick(quips.coffee));
        else say(id, pick(quips.poke));
      } else {
        const a = hist[0];
        const z = hist[hist.length - 1];
        const dtm = Math.max(16, z.t - a.t) / 1000;
        b.vx = Math.max(-1600, Math.min(1600, (z.x - a.x) / dtm));
        b.vy = Math.max(-1600, Math.min(1600, (z.y - a.y) / dtm));
        b.mode = 'fly';
        b.annoy += 2;
        const speed = Math.hypot(b.vx, b.vy);
        if (speed > 300) { unlock('throw'); bump('botsThrown'); play('pop'); }
      }
      if (b.annoy >= 6 && !(b.strikeUntil > performance.now())) {
        b.strikeUntil = performance.now() + 10000;
        if (b.mode !== 'fly') b.mode = 'strike';
        setBotUi(id, { strike: true });
        say(id, pick(quips.strike), 3000);
        unlock('strike');
        toast('A bot has gone on strike. Maybe stop throwing them?');
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // HUD status text
  useEffect(() => {
    const t = setInterval(() => {
      const arr = [...bots.current.entries()];
      if (!arr.length) return onHudText?.('no bots on shift');
      const [id, b] = arr[Math.floor(Math.random() * arr.length)];
      const name = list.find((x) => x.id === id)?.name || 'bot';
      const what = b.mode === 'strike' ? 'on strike' : b.mode === 'coffee' ? 'on chai break' : b.mode === 'fly' ? 'airborne' : b.job;
      onHudText?.(`${name}: ${what}`);
    }, 3000);
    return () => clearInterval(t);
  }, [list, onHudText]);

  // Commands from the terminal, palette, HUD and effects
  const api = useRef({});
  api.current = {
    hire() {
      if (bots.current.size >= maxBots) { toast(`Headcount frozen at ${maxBots}. Finance said no.`); return `quota reached: ${maxBots} bots max`; }
      spawn({ para: true });
      unlock('hire');
      play('ok');
      return 'new bot incoming. look up!';
    },
    coffee() {
      const until = performance.now() + 6000;
      bots.current.forEach((b, id) => {
        b.coffeeUntil = until;
        if (b.mode === 'walk') b.mode = 'coffee';
        setBotUi(id, { coffee: true });
        say(id, pick(quips.coffee), 2000);
      });
      unlock('coffee');
      return 'chai break for everyone. productivity −100%, morale +100%.';
    },
    panic() {
      bots.current.forEach((b, id) => { say(id, pick(quips.panic), 2500); if (b.mode === 'walk') { b.mode = 'fly'; b.vy = -500; b.vx = (Math.random() - 0.5) * 600; } });
    },
    gravity(on) {
      gScale.current = on ? 0.08 : 1;
      if (on) bots.current.forEach((b, id) => say(id, pick(quips.gravity), 2500));
    },
    list() {
      return [
        'NAME     STATUS        DOING',
        ...[...bots.current.entries()].map(([id, b]) => {
          const name = list.find((x) => x.id === id)?.name || '?';
          return `${name.padEnd(8)} ${b.mode.padEnd(13)} ${b.job}`;
        }),
        `${bots.current.size} bots, load average: chill`,
      ];
    },
  };

  useEffect(() => {
    const offs = [
      bus.on('bots:cmd', ({ cmd, reply }) => {
        if (cmd === 'hire') reply([api.current.hire()]);
        else if (cmd === 'coffee') reply([api.current.coffee()]);
        else reply(api.current.list());
      }),
      bus.on('bots:panic', () => api.current.panic()),
      bus.on('bots:gravity', (on) => api.current.gravity(on)),
    ];
    return () => offs.forEach((o) => o());
  }, [bus]);

  return (
    <div className="wk-layer" ref={layerRef} aria-hidden="false">
      {list.map((w) => {
        const u = ui[w.id] || {};
        return (
          <div key={w.id} className="wk" ref={(el) => (el ? els.current.set(w.id, el) : els.current.delete(w.id))}>
            {u.say && <div className="wk-say mono">{u.say}</div>}
            {u.strike && <div className="wk-sign mono">ON STRIKE</div>}
            {u.para && (
              <svg className="wk-chute" viewBox="0 0 60 40" width="60" height="40" aria-hidden="true">
                <path d="M2 20 Q30 -10 58 20 Q51 15 44 20 Q37 15 30 20 Q23 15 16 20 Q9 15 2 20 Z" fill={w.color} fillOpacity=".85" />
                <path d="M3 20 L24 40 M57 20 L36 40 M30 20 L30 40" stroke="#C9D1DB" strokeWidth=".8" />
              </svg>
            )}
            <button
              type="button"
              className="wk-btn"
              aria-label={`Worker bot ${w.name}. Click to poke, drag to throw.`}
              data-cur="drag me"
              onPointerDown={onDown(w.id)}
            >
              <BotSprite color={w.color} />
              {u.coffee && <span className="wk-cup" aria-hidden="true">☕</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function HudBotControls() {
  const { bus } = useGame();
  return (
    <>
      <button type="button" className="hud-btn" data-magnetic data-cur="parachute" onClick={() => bus.emit('bots:cmd', { cmd: 'hire', reply: () => {} })}>+ hire</button>
      <button type="button" className="hud-btn" data-magnetic data-cur="☕" onClick={() => bus.emit('bots:cmd', { cmd: 'coffee', reply: () => {} })}>chai break</button>
    </>
  );
}
