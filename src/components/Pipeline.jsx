import { useCallback, useEffect, useRef, useState } from 'react';
import { stages, envs, badRelease } from '../data/pipeline.js';
import { useGame } from '../game/GameProvider.jsx';
import SecHead from './SecHead.jsx';
import { centerOf } from '../motion/motion.js';
import { text } from '../data/profile.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randSha = () => Math.random().toString(16).slice(2, 9);

// 02 / PIPELINE — run the release pipeline: dev/staging go straight through,
// prod stops at the approval gate, and a bad release rolls itself back.
export default function Pipeline() {
  const { bus, unlock, play, bump, setStatus, toast } = useGame();
  const [env, setEnv] = useState('prod');
  const [state, setState] = useState(() => stages.map(() => 'idle'));
  const [log, setLog] = useState([{ t: '# press "Ship it" to start a release', k: 'dim' }]);
  const [running, setRunning] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [result, setResult] = useState(null); // 'ok' | 'rollback' | null
  const approveRef = useRef(null);
  const runId = useRef(0);
  const logRef = useRef(null);
  const runningRef = useRef(false);
  const shipRef = useRef(null);

  useEffect(() => () => { runId.current++; }, []);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  const run = useCallback(
    async ({ bad = false, env: forceEnv } = {}) => {
      if (runningRef.current) return;
      const target = forceEnv || env;
      if (forceEnv) setEnv(forceEnv);
      const id = ++runId.current;
      const alive = () => runId.current === id;
      const sha = randSha();
      const fill = (s) => s.replaceAll('{env}', target).replaceAll('{sha}', sha);
      const add = (items) => setLog((l) => [...l, ...items].slice(-80));
      const mark = (i, st) => setState((s) => s.map((v, j) => (j === i ? st : v)));

      runningRef.current = true;
      setRunning(true);
      setResult(null);
      setState(stages.map(() => 'idle'));
      setLog([{ t: `$ git push origin main   # ${bad ? 'a release with a bug in it' : 'a normal release'} → ${target}`, k: 'cmd' }]);
      setStatus('warn', `deploying to ${target}…`);
      play('click');

      for (let i = 0; i < stages.length; i++) {
        const st = stages[i];
        if (!alive()) return;

        if (st.gate) {
          if (target !== 'prod') {
            mark(i, 'skip');
            add([{ t: `↷ approval skipped: ${target} ships without a gate`, k: 'dim' }]);
            continue;
          }
          mark(i, 'wait');
          add([{ t: '⏸ production needs a human. click Approve to continue.', k: 'warn' }]);
          setWaiting(true);
          play('alarm');
          const ok = await new Promise((res) => { approveRef.current = res; });
          setWaiting(false);
          if (!alive()) return;
          if (!ok) {
            mark(i, 'fail');
            add([{ t: '✕ change rejected. nothing shipped, nothing broke.', k: 'err' }]);
            finish(null);
            return;
          }
          unlock('approve');
          mark(i, 'ok');
          add(st.logs.map((t) => ({ t: `  ${t}`, k: 'ok' })));
          continue;
        }

        mark(i, 'run');
        add([{ t: `$ ${fill(st.cmd)}`, k: 'cmd' }]);
        await sleep(st.dur);
        if (!alive()) return;

        if (bad && st.id === badRelease.failAt) {
          mark(i, 'fail');
          play('err');
          add(badRelease.logs.slice(0, 1));
          await sleep(700);
          if (!alive()) return;
          mark(i, 'rollback');
          add(badRelease.logs.slice(1));
          for (let j = i + 1; j < stages.length; j++) mark(j, 'skip');
          unlock('rollback');
          bus.emit('fx:pulse', { ...centerOf(shipRef.current), color: '#FFB86B', power: 1 });
          finish('rollback');
          return;
        }

        mark(i, 'ok');
        play('pop');
        add(st.logs.map((t) => ({ t: `  ${fill(t)}`, k: 'out' })));
      }

      if (!alive()) return;
      add([{ t: `✓ shipped to ${target}. pipeline green.`, k: 'ok' }]);
      bump('deploys');
      play('ok');
      {
        const at = centerOf(shipRef.current);
        bus.emit('fx:burst', { ...at, kind: target === 'prod' ? 'confetti' : 'sparks' });
        bus.emit('fx:pulse', { ...at, power: target === 'prod' ? 1.4 : 0.8 });
      }
      if (target === 'prod') unlock('deploy');
      finish('ok');

      function finish(res) {
        runningRef.current = false;
        setRunning(false);
        setResult(res);
        setStatus('ok', 'all systems operational');
        if (res === 'ok') toast(`Shipped to ${target}. Zero pages.`);
        if (res === 'rollback') toast('Rolled back on its own. Nobody noticed.');
      }
    },
    [env, play, setStatus, unlock, bump, toast, bus]
  );

  // Terminal / palette can trigger runs.
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => bus.on('pipeline:run', (opts) => runRef.current(opts)), [bus]);

  const decide = (ok) => {
    approveRef.current?.(ok);
    approveRef.current = null;
  };

  return (
    <section id="pipeline" className="sec wrap" aria-labelledby="pipeline-title">
      <SecHead num="02" kicker={text.pipeline.kicker} title={text.pipeline.title} id="pipeline-title">
        {text.pipeline.intro}
      </SecHead>

      <div className="pipe panel">
        <div className="pipe-controls">
          <div className="seg mono" role="radiogroup" aria-label="Target environment">
            {envs.map((e) => (
              <button key={e} type="button" role="radio" aria-checked={env === e} className={env === e ? 'on' : ''} disabled={running} onClick={() => setEnv(e)}>
                {e}
              </button>
            ))}
          </div>
          <div className="pipe-btns">
            <button ref={shipRef} type="button" className="btn btn-primary" disabled={running} onClick={() => run()} data-magnetic data-cur="ship it">
              {result ? 'Ship again' : 'Ship it'}
            </button>
            <button type="button" className="btn btn-ghost" disabled={running} onClick={() => run({ bad: true })} data-magnetic data-cur="break it">
              Ship a bad release
            </button>
          </div>
        </div>

        <ol className="stages" aria-label="Pipeline stages">
          {stages.map((s, i) => (
            <li key={s.id} className={`stage is-${state[i]}`} style={{ '--dur': `${s.dur || 800}ms` }}>
              <span className="stage-ic" aria-hidden="true">{ICON[state[i]]}</span>
              <span className="stage-name mono">{s.name}</span>
              <span className="sr"> {state[i]}</span>
              {s.gate && <span className="stage-note mono">prod only</span>}
              <span className="stage-bar" aria-hidden="true"><i /></span>
              <span className="stage-pk" aria-hidden="true" />
            </li>
          ))}
        </ol>

        {waiting && (
          <div className="gate" role="alert">
            <p className="mono">
              <b>Manual approval required.</b> Deploy <code>api</code> to <b>production</b>?
            </p>
            <div className="gate-btns">
              <button type="button" className="btn btn-primary" onClick={() => decide(true)} autoFocus data-cur="LGTM">Approve</button>
              <button type="button" className="btn btn-ghost" onClick={() => decide(false)}>Reject</button>
            </div>
          </div>
        )}

        <div className="pipe-log mono" ref={logRef} role="log" aria-live="polite">
          {log.map((l, i) => (
            <p key={i} className={`t-${l.k}`}>{l.t}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

const ICON = { idle: '○', run: '◐', ok: '✓', fail: '✕', wait: '⏸', skip: '↷', rollback: '↺' };
