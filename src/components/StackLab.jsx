import { useEffect, useRef, useState } from 'react';
import { groups, bySym, react as mix, failedMixes, selfMix } from '../data/elements.js';
import { career } from '../data/career.js';
import { useGame } from '../game/GameProvider.jsx';
import Stack from './Stack.jsx';
import { centerOf, reducedMotion } from '../motion/motion.js';

// Stack section with interactions: element drawer, group filter, and the reactor.
export default function StackLab() {
  const { unlock, play, toast, bus } = useGame();
  const [mixing, setMixing] = useState(false);
  const reactorRef = useRef(null);
  const [picked, setPicked] = useState(null);
  const [filter, setFilter] = useState(null);
  const [slots, setSlots] = useState([null, null]);
  const [result, setResult] = useState(null);

  const pick = (el) => {
    setPicked(el);
    unlock('element');
    play('click');
  };

  const addToReactor = (sym) => {
    setResult(null);
    setSlots(([a, b]) => (a === null ? [sym, b] : b === null ? [a, sym] : [b, sym]));
    play('pop');
  };

  const drop = (i) => (e) => {
    e.preventDefault();
    const sym = e.dataTransfer.getData('text/plain');
    if (!bySym[sym]) return;
    setResult(null);
    setSlots((s) => s.map((v, j) => (j === i ? sym : v)));
    play('pop');
  };

  const runMix = () => {
    const [a, b] = slots;
    if (!a || !b || mixing) return;
    setResult(null);
    setMixing(true);
    play('click');
    // Slots slam together and shake, then the reactor flashes and the result appears.
    setTimeout(() => {
      setMixing(false);
      const at = centerOf(reactorRef.current?.querySelector('.reactor-row'));
      const flash = () => {
        const r = reactorRef.current;
        if (!r) return;
        r.classList.remove('flash');
        void r.offsetWidth;
        r.classList.add('flash');
      };
      if (a === b) {
        setResult({ fail: true, desc: selfMix });
        bus.emit('fx:burst', { ...at, kind: 'smoke' });
        play('err');
        return;
      }
      const c = mix(a, b);
      if (c) {
        setResult(c);
        flash();
        bus.emit('fx:burst', { ...at, kind: 'sparks', count: 40, colors: [bySym[a].color, bySym[b].color, '#E7ECF2'] });
        bus.emit('fx:pulse', { ...at, color: bySym[a].color, power: 1 });
        unlock('compound');
        play('ok');
      } else {
        setResult({ fail: true, desc: failedMixes[Math.floor(Math.random() * failedMixes.length)] });
        bus.emit('fx:burst', { ...at, kind: 'smoke' });
        play('err');
      }
    }, reducedMotion() ? 0 : 900);
  };

  const reactor = (
    <div className="reactor panel" aria-label="Reactor" ref={reactorRef} data-reveal>
      <div className="reactor-head">
        <p className="sec-kicker mono" style={{ margin: 0 }}>REACTOR</p>
        <p className="reactor-hint">Drag two elements in (or use "add to reactor"), then mix. Some pairs make something.</p>
      </div>
      <div className={`reactor-row${mixing ? ' mixing' : ''}`}>
        {slots.map((sym, i) => (
          <div key={i} className={`slot${sym ? ' full' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={drop(i)} style={sym ? { '--c': bySym[sym].color } : undefined}>
            {sym ? (
              <>
                <span className="el-sym">{sym}</span>
                <span className="el-name mono">{bySym[sym].name}</span>
                <button type="button" className="slot-x" aria-label={`Remove ${bySym[sym].name}`} onClick={() => { setSlots((s) => s.map((v, j) => (j === i ? null : v))); setResult(null); }}>✕</button>
              </>
            ) : (
              <span className="slot-empty mono">drop here</span>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-primary" disabled={!slots[0] || !slots[1] || mixing} onClick={runMix} data-magnetic data-cur="mix">{mixing ? 'Mixing…' : 'Mix'}</button>
      </div>
      {result && (
        <div className={`compound${result.fail ? ' fail' : ''}`} role="status">
          {result.fail ? (
            <p className="mono">✕ {result.desc}</p>
          ) : (
            <>
              <p className="compound-name">{result.name}</p>
              <p className="compound-desc">{result.desc}</p>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Stack onPick={pick} filter={filter} setFilter={setFilter} extra={reactor} />
      {picked && <ElementDrawer el={picked} onClose={() => setPicked(null)} onAdd={(s) => { addToReactor(s); toast(`${bySym[s].name} added to the reactor`); }} />}
    </>
  );
}

function ElementDrawer({ el, onClose, onAdd }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const hits = el.kw
    ? career.flatMap((c) => c.diff.filter(([k, t]) => k === 'add' && t.toLowerCase().includes(el.kw.toLowerCase())).map(([, t]) => ({ hash: c.hash, t })))
    : [];

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="drawer el-drawer" role="dialog" aria-modal="true" aria-labelledby="el-title" onClick={(e) => e.stopPropagation()} style={{ '--c': el.color }}>
        <div className="drawer-head">
          <div className="el-big">
            <span className="el-num mono">{el.n}</span>
            <span className="el-sym">{el.sym}</span>
          </div>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Close element details" onClick={onClose}>✕</button>
        </div>
        <p className="drawer-kicker mono" style={{ color: el.color }}>{groups[el.g].name}</p>
        <h2 id="el-title" className="drawer-title">{el.name}</h2>
        <p className="el-use">{el.use}</p>
        <div className="el-grep mono">
          <p className="t-cmd">$ git log --grep="{el.kw || el.name}"</p>
          {hits.length ? (
            hits.map((h, i) => (
              <p key={i} className="t-out"><span className="commit-hash">{h.hash}</span> {h.t}</p>
            ))
          ) : (
            <p className="t-dim">no commits mention it directly, but it is in the toolbox.</p>
          )}
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => onAdd(el.sym)}>+ add to reactor</button>
      </aside>
    </div>
  );
}
