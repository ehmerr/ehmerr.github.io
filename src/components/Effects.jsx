import { useEffect, useRef, useState } from 'react';
import { profile } from '../data/profile.js';
import { useGame } from '../game/GameProvider.jsx';
import { session } from '../game/storage.js';
import { reducedMotion as reduced, centerOf } from '../motion/motion.js';

/* ---------------- self-destruct ---------------- */
const DESTROY_LOG = [
  { t: '$ terraform destroy -auto-approve', k: 'cmd' },
  { t: 'module.site.google_compute_global_address.front: Destroying...', k: 'out' },
  { t: 'module.site.helm_release.portfolio: Destruction complete after 0s', k: 'out' },
  { t: 'module.bots.robot[*]: tiny antennas recovered from the rubble', k: 'out' },
  { t: 'Destroy complete! Resources: 42 destroyed.', k: 'err' },
  { t: '', k: 'out' },
  { t: `kernel panic: unable to mount root fs "${profile.host}"`, k: 'err' },
  { t: '…luckily, everything here is code, and code has backups.', k: 'ok' },
];

export function SelfDestruct() {
  const { bus, play, setStatus, toast, unlock } = useGame();
  const [phase, setPhase] = useState(null); // null | 'cover' | 'armed' | 'boom' | 'dead'
  const [n, setN] = useState(5);
  const [log, setLog] = useState([]);

  useEffect(() => bus.on('fx:destroy', () => setPhase((p) => p || 'armed')), [bus]);
  useEffect(() => bus.on('fx:destroy-cover', () => setPhase((p) => p || 'cover')), [bus]);

  useEffect(() => {
    if (phase !== 'armed') return;
    setN(5);
    setStatus('err', 'self-destruct imminent');
    bus.emit('bots:panic');
    let k = 5;
    play('alarm');
    const t = setInterval(() => {
      k -= 1;
      setN(k);
      play('alarm');
      if (k <= 2) document.body.classList.add('sd-shake');
      if (k <= 0) { clearInterval(t); setPhase('boom'); }
    }, 1000);
    return () => { clearInterval(t); document.body.classList.remove('sd-shake'); };
  }, [phase, bus, play, setStatus]);

  useEffect(() => {
    if (phase !== 'boom') return;
    play('boom');
    document.body.classList.remove('sd-shake');
    document.body.classList.add('sd-boom');
    bus.emit('fx:pulse', { color: '#FF7A7A', power: 1.6 });
    bus.emit('fx:burst', { x: window.innerWidth / 2, y: window.innerHeight / 2, kind: 'shards', count: 60, colors: ['#FF7A7A', '#FFB86B', '#F5E663', '#8B95A3'] });
    setLog([]);
    let i = 0;
    const t = setInterval(() => {
      const line = DESTROY_LOG[i]; // read now; the state updater may run later
      if (line) setLog((l) => [...l, line]);
      i += 1;
      if (i >= DESTROY_LOG.length) { clearInterval(t); setPhase('dead'); }
    }, 450);
    return () => clearInterval(t);
  }, [phase, play, bus]);

  const abort = () => {
    setPhase(null);
    setStatus('ok', 'all systems operational');
    toast('Self-destruct aborted. Cold feet. Fair enough.');
  };
  const restore = () => {
    document.body.classList.remove('sd-boom');
    document.body.classList.add('sd-restore');
    setTimeout(() => document.body.classList.remove('sd-restore'), 1600);
    setTimeout(() => bus.emit('fx:burst', { x: window.innerWidth / 2, y: window.innerHeight * 0.4, kind: 'confetti' }), 300);
    setPhase(null);
    setLog([]);
    setStatus('ok', 'all systems operational');
    unlock('destroy');
    play('ok');
    toast('$ terraform apply · restored from backup. Nothing was lost.');
    window.scrollTo({ top: 0 });
  };

  if (!phase) return null;
  if (phase === 'cover') {
    return (
      <div className="sd-overlay sd-cover" role="dialog" aria-modal="true" aria-label="Self-destruct">
        <div className="sd-box panel">
          <p className="sec-kicker mono">DANGER ZONE</p>
          <h2 className="sd-title">Self-destruct this website?</h2>
          <p className="sd-sub">Destroys the whole site. No undo.<sup>*</sup></p>
          <p className="sd-fine mono">*there are backups.</p>
          <div className="hero-cta">
            <button type="button" className="btn sd-red" onClick={() => setPhase('armed')}>Arm it</button>
            <button type="button" className="btn btn-ghost" onClick={() => setPhase(null)} autoFocus>Close the cover</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`sd-overlay is-${phase}`} role="alertdialog" aria-modal="true" aria-label="Self-destruct sequence">
      {phase === 'armed' && (
        <div className="sd-box panel sd-armed">
          <p className="sec-kicker mono" style={{ color: 'var(--err)' }}>SELF-DESTRUCT SEQUENCE ENGAGED</p>
          <p className="sd-count">{n}</p>
          <button type="button" className="btn btn-primary" onClick={abort} autoFocus>ABORT</button>
        </div>
      )}
      {(phase === 'boom' || phase === 'dead') && (
        <div className="sd-term term">
          <div className="term-body mono">
            {log.map((l, i) => (
              <p key={i} className={`t-${l.k}`}>{l.t || ' '}</p>
            ))}
          </div>
          {phase === 'dead' && (
            <div className="tf-actions">
              <button type="button" className="btn btn-primary mono" onClick={restore} autoFocus>$ terraform apply  # restore from backup</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- matrix rain ---------------- */
export function Matrix() {
  const { bus, unlock, toast } = useGame();
  const [on, setOn] = useState(false);
  const canvas = useRef(null);

  useEffect(() => bus.on('fx:matrix', () => {
    unlock('matrix');
    if (reduced()) { toast('Reduced motion is on. Imagine green rain.'); return; }
    setOn(true);
  }), [bus, unlock, toast]);

  useEffect(() => {
    if (!on) return;
    const c = canvas.current;
    const ctx = c?.getContext?.('2d');
    if (!ctx) { setOn(false); return; }
    const fit = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    fit();
    const size = 16;
    const cols = Math.ceil(c.width / size);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = 'アイウエオカキクケコサシスセソ01kubectlhelm{}[]$#';
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6EF0B4';
    let raf;
    const draw = () => {
      ctx.fillStyle = 'rgba(10, 12, 15, 0.12)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = accent;
      ctx.font = `${size}px 'JetBrains Mono', monospace`;
      for (let i = 0; i < cols; i++) {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, drops[i] * size);
        if (drops[i] * size > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const stop = setTimeout(() => setOn(false), 7000);
    window.addEventListener('resize', fit);
    return () => { cancelAnimationFrame(raf); clearTimeout(stop); window.removeEventListener('resize', fit); };
  }, [on]);

  if (!on) return null;
  return <canvas ref={canvas} className="matrix" aria-hidden="true" onClick={() => setOn(false)} />;
}

/* ---------------- Konami → low gravity ---------------- */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function Gravity() {
  const { bus, unlock, toast } = useGame();
  const active = useRef(false);

  useEffect(() => {
    const go = () => {
      if (active.current) return;
      active.current = true;
      unlock('gravity');
      toast('Gravity set to 0.08g. The bots did not consent.');
      document.body.classList.add('low-g');
      bus.emit('bots:gravity', true);
      bus.emit('fx:pulse', { power: 1.8 });
      setTimeout(() => {
        active.current = false;
        document.body.classList.remove('low-g');
        bus.emit('bots:gravity', false);
        toast('Gravity restored. Please keep your antennas inside the vehicle.');
      }, 9000);
    };
    let i = 0;
    const onKey = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === KONAMI[i] ? i + 1 : k === KONAMI[0] ? 1 : 0;
      if (i === KONAMI.length) { i = 0; go(); }
    };
    window.addEventListener('keydown', onKey);
    const off = bus.on('fx:gravity', go);
    return () => { window.removeEventListener('keydown', onKey); off(); };
  }, [bus, unlock, toast]);

  return null;
}

/* ---------------- boot screen ---------------- */
const BOOT = [
  `${profile.handle}-bios 2026.11 · platform team`,
  'mem    16384 MB ............ ok',
  'cloud  google-cloud ........ ok',
  'k8s    pods scheduled ...... ok',
  'helm   charts rendered ..... ok',
  'obs    dashboards green .... ok',
  'bots   clocked in .......... ok',
  'boot   handing over to visitor@prod',
];

export function Boot() {
  const { bus } = useGame();
  const [show, setShow] = useState(() => !session.get('booted') && !reduced());
  const [count, setCount] = useState(0);

  useEffect(() => bus.on('fx:boot', () => { document.body.classList.remove('booted'); setCount(0); setShow(true); }), [bus]);

  useEffect(() => {
    if (show) return;
    // Next frame, so the hero's hidden starting state is painted before the intro animates.
    const r = requestAnimationFrame(() => {
      document.body.classList.add('booted');
      bus.emit('fx:boot-done');
    });
    return () => cancelAnimationFrame(r);
  }, [show, bus]);

  useEffect(() => {
    if (!show) return;
    session.set('booted', '1');
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setCount(i);
      if (i > BOOT.length) { clearInterval(t); setTimeout(() => setShow(false), 250); }
    }, 150);
    const skip = () => setShow(false);
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => { clearInterval(t); window.removeEventListener('keydown', skip); window.removeEventListener('pointerdown', skip); };
  }, [show]);

  if (!show) return null;
  return (
    <div className="boot mono" role="status" aria-label={`Booting ${profile.host}`}>
      <div className="boot-in">
        {BOOT.slice(0, count).map((l, i) => (
          <p key={i} className={l.includes('ok') ? 'boot-ok' : ''}>{l}</p>
        ))}
        <p className="boot-cursor" aria-hidden="true">_</p>
      </div>
      <p className="boot-skip">press any key to skip</p>
    </div>
  );
}

/* ---------------- heading text scramble ---------------- */
export function useScramble() {
  useEffect(() => {
    if (reduced() || !('IntersectionObserver' in window)) return;
    const glyphs = '!<>-_\\/[]{}=+*^?#$%&01';
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const node = en.target.firstChild;
        if (!node || node.nodeType !== 3) return;
        const final = node.nodeValue;
        let frame = 0;
        const total = 18;
        const t = setInterval(() => {
          frame += 1;
          const done = Math.floor((frame / total) * final.length);
          node.nodeValue = final
            .split('')
            .map((ch, i) => (i < done || ch === ' ' ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]))
            .join('');
          if (frame >= total) { clearInterval(t); node.nodeValue = final; }
        }, 30);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-scramble]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
