import { useCallback, useEffect, useRef, useState } from 'react';
import { nodes, workloads, maxApiReplicas, onCallSeconds, monitoringLine, clusterQuips as Q } from '../data/cluster.js';
import { useGame } from '../game/GameProvider.jsx';
import SecHead from './SecHead.jsx';

const suffix = () => Math.random().toString(36).slice(2, 6);
const colorOf = Object.fromEntries(workloads.map((w) => [w.app, w.color]));

function leastLoaded(pods) {
  const count = Object.fromEntries(nodes.map((n) => [n, 0]));
  pods.forEach((p) => { if (p.status !== 'terminating') count[p.node] += 1; });
  return nodes.reduce((a, b) => (count[b] < count[a] ? b : a));
}

function initialPods() {
  const pods = [];
  workloads.forEach((w) => {
    for (let i = 0; i < w.replicas; i++) {
      pods.push({ id: `${w.app}-${suffix()}`, app: w.app, node: leastLoaded(pods), status: 'running' });
    }
  });
  return pods;
}

function desiredCounts(apiReplicas) {
  return Object.fromEntries(workloads.map((w) => [w.app, w.app === 'api' ? apiReplicas : w.replicas]));
}

// 03 / SELF-HEALING CLUSTER — kill pods, scale, unleash chaos, or take the pager.
export default function Cluster() {
  const { bus, unlock, play, bump, stats, setStatus, toast } = useGame();
  const [pods, setPods] = useState(initialPods);
  const [apiReplicas, setApiReplicas] = useState(3);
  const [heal, setHeal] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [requests, setRequests] = useState(0);
  const [oncall, setOncall] = useState(null); // { left, budget, breaches, fixes }
  const [chaos, setChaos] = useState(false);

  const podsRef = useRef(pods); podsRef.current = pods;
  const healRef = useRef(heal); healRef.current = heal;
  const replRef = useRef(apiReplicas); replRef.current = apiReplicas;
  const oncallRef = useRef(oncall); oncallRef.current = oncall;
  const timers = useRef(new Set());
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.current.delete(t); fn(); }, ms);
    timers.current.add(t);
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Pending pods become Running after a short "scheduling" delay.
  const scheduled = useRef(new Set());
  useEffect(() => {
    pods.forEach((pod) => {
      if (pod.status !== 'pending' || scheduled.current.has(pod.id)) return;
      scheduled.current.add(pod.id);
      later(() => {
        scheduled.current.delete(pod.id);
        setPods((cur) => cur.map((p) => (p.id === pod.id && p.status === 'pending' ? { ...p, status: 'running' } : p)));
      }, 900 + Math.random() * 600);
    });
  }, [pods]);

  const alert = useCallback((kind, text) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAlerts((a) => [{ id: Math.random(), kind, text, time }, ...a].slice(0, 6));
  }, []);

  // Reconcile loop: if auto-heal is on, schedule missing pods.
  const reconcile = useCallback(() => {
    if (!healRef.current) return;
    const want = desiredCounts(replRef.current);
    setPods((ps) => {
      const live = ps.filter((p) => p.status !== 'terminating');
      const next = [...ps];
      workloads.forEach(({ app }) => {
        const have = live.filter((p) => p.app === app).length;
        for (let i = have; i < want[app]; i++) {
          next.push({ id: `${app}-${suffix()}`, app, node: leastLoaded(next), status: 'pending' });
        }
      });
      return next;
    });
  }, []);

  const kill = useCallback(
    (id, source = 'click') => {
      const pod = podsRef.current.find((p) => p.id === id);
      if (!pod || pod.status === 'terminating') return false;
      setPods((ps) => ps.map((p) => (p.id === id ? { ...p, status: 'terminating' } : p)));
      play('kill');
      bump('podsKilled');
      if (source !== 'chaos') unlock('kill');
      alert('fire', `PodNotReady ${id}`);
      later(() => {
        setPods((ps) => ps.filter((p) => p.id !== id));
        if (healRef.current) {
          reconcile();
          later(() => alert('ok', `${pod.app} back to full strength · auto-healed`), 1600);
        }
      }, 800);
      return true;
    },
    [play, bump, unlock, alert, reconcile]
  );

  const scale = useCallback(
    (n) => {
      if (n > maxApiReplicas) { toast(Q.quota); return `error: ${Q.quota}`; }
      const v = Math.max(1, n);
      setApiReplicas(v);
      replRef.current = v;
      // Scale down: terminate extra api pods.
      const apiPods = podsRef.current.filter((p) => p.app === 'api' && p.status !== 'terminating');
      apiPods.slice(v).forEach((p) => {
        setPods((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: 'terminating' } : x)));
        later(() => setPods((ps) => ps.filter((x) => x.id !== p.id)), 700);
      });
      if (apiPods.length < v) {
        const was = healRef.current;
        healRef.current = true;
        reconcile();
        healRef.current = was;
      }
      play('pop');
      return `deployment.apps/api scaled to ${v}`;
    },
    [reconcile, play, toast]
  );

  const toggleHeal = useCallback(
    (on) => {
      setHeal(on);
      healRef.current = on;
      toast(on ? Q.healOn : Q.healOff);
      if (on) reconcile();
    },
    [reconcile, toast]
  );

  const runChaos = useCallback(() => {
    if (chaos) return;
    setChaos(true);
    unlock('chaos');
    toast(Q.chaos);
    let n = 0;
    const tick = () => {
      const alive = podsRef.current.filter((p) => p.status === 'running');
      if (alive.length) kill(alive[Math.floor(Math.random() * alive.length)].id, 'chaos');
      if (++n < 6) later(tick, 650);
      else later(() => setChaos(false), 800);
    };
    tick();
  }, [chaos, kill, unlock, toast]);

  // ---------- on-call game ----------
  const startOncall = useCallback(() => {
    if (oncallRef.current) return;
    toggleHeal(false);
    setStatus('err', 'incident in progress');
    play('alarm');
    toast(Q.oncallStart, 'err', 4000);
    setOncall({ left: onCallSeconds, budget: 100, breaches: 0, fixes: 0 });
  }, [toggleHeal, setStatus, play, toast]);

  useEffect(() => {
    if (!oncall) return;
    const crashTimer = setInterval(() => {
      const ok = podsRef.current.filter((p) => p.status === 'running');
      if (!ok.length) return;
      const p = ok[Math.floor(Math.random() * ok.length)];
      setPods((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: 'crash' } : x)));
      alert('fire', `HighErrorRate ${p.id}`);
      play('err');
    }, 1100);
    const clock = setInterval(() => {
      setOncall((o) => {
        if (!o) return o;
        const crashed = podsRef.current.filter((p) => p.status === 'crash').length;
        const budget = Math.max(0, o.budget - crashed * 1.5);
        const breaches = o.breaches + (crashed >= 2 ? 1 : 0);
        return { ...o, left: o.left - 0.5, budget, breaches };
      });
    }, 500);
    return () => { clearInterval(crashTimer); clearInterval(clock); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!oncall]);

  useEffect(() => {
    if (!oncall || oncall.left > 0) return;
    const { breaches } = oncall;
    setOncall(null);
    setPods((ps) => ps.map((p) => (p.status === 'crash' ? { ...p, status: 'running' } : p)));
    unlock('oncall');
    if (breaches === 0) unlock('flawless');
    toast(breaches === 0 ? Q.flawless : Q.okay(breaches), breaches === 0 ? 'ach' : 'info', 5000);
    setStatus('ok', 'all systems operational');
    toggleHeal(true);
  }, [oncall, unlock, toast, setStatus, toggleHeal]);

  const restart = (id) => {
    setPods((ps) => ps.map((p) => (p.id === id ? { ...p, status: 'running' } : p)));
    setOncall((o) => (o ? { ...o, fixes: o.fixes + 1 } : o));
    alert('ok', `${id} restarted by visitor`);
    play('ok');
  };

  // Traffic counter
  useEffect(() => {
    const t = setInterval(() => {
      const ready = podsRef.current.filter((p) => p.status === 'running').length;
      setRequests((r) => r + ready * (8 + Math.floor(Math.random() * 6)));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Terminal + palette hooks
  const api = useRef({});
  api.current = { kill, scale, runChaos, startOncall };
  useEffect(() => {
    const offs = [
      bus.on('cluster:chaos', () => api.current.runChaos()),
      bus.on('cluster:oncall', () => api.current.startOncall()),
      bus.on('cluster:cmd', ({ args, reply }) => {
        const [verb, what, name] = args;
        const ps = podsRef.current;
        if (verb === 'get' && /^(po|pods?)$/.test(what || '')) {
          return reply([
            'NAME              READY   STATUS        NODE',
            ...ps.map((p) => `${p.id.padEnd(17)} ${p.status === 'running' ? '1/1' : '0/1'}     ${statusWord(p.status).padEnd(13)} ${p.node}`),
          ]);
        }
        if (verb === 'get' && /^(no|nodes?)$/.test(what || '')) {
          return reply([
            'NAME     STATUS   PODS',
            ...nodes.map((n) => `${n.padEnd(8)} Ready    ${ps.filter((p) => p.node === n).length}`),
          ]);
        }
        if (verb === 'delete' && /^(po|pods?)$/.test(what || '')) {
          const target = ps.find((p) => p.id === name) || ps.find((p) => name && p.app === name && p.status === 'running');
          if (!target) return reply([{ t: `Error from server (NotFound): pods "${name || ''}" not found. try 'kubectl get pods'`, k: 'err' }]);
          api.current.kill(target.id);
          return reply([`pod "${target.id}" deleted`, healRef.current ? { t: 'the reconcile loop is already on it…', k: 'dim' } : { t: 'auto-heal is off. it is not coming back.', k: 'warn' }]);
        }
        const sc = args.join(' ').match(/scale.*--replicas=(\d+)/);
        if (sc) return reply([api.current.scale(parseInt(sc[1], 10))]);
        return reply(["usage: kubectl get pods|nodes · kubectl delete pod <name> · kubectl scale deploy/api --replicas=N"]);
      }),
    ];
    return () => offs.forEach((o) => o());
  }, [bus]);

  // ---------- render ----------
  const desiredTotal = Object.values(desiredCounts(apiReplicas)).reduce((a, b) => a + b, 0);
  const ready = pods.filter((p) => p.status === 'running').length;
  const health = Math.min(100, Math.round((ready / desiredTotal) * 100));
  const errRate = Math.max(0, 100 - health);

  return (
    <section id="cluster" className="sec wrap" aria-labelledby="cluster-title">
      <SecHead num="03" kicker="SELF-HEALING CLUSTER" title="Break it. It heals." id="cluster-title">
        A toy Kubernetes cluster running in your browser. Click a pod to kill it and watch it come back.
        Then turn auto-heal off, or take the pager yourself.
      </SecHead>

      <div className="cluster">
        <div className="cl-main panel">
          <div className="cl-controls">
            <div className="cl-btns">
              <button type="button" className="btn btn-ghost" onClick={() => scale(apiReplicas - 1)} disabled={!!oncall || apiReplicas <= 1} aria-label="Scale api down">api −</button>
              <span className="cl-repl mono" aria-live="polite">api × {apiReplicas}</span>
              <button type="button" className="btn btn-ghost" onClick={() => scale(apiReplicas + 1)} disabled={!!oncall} aria-label="Scale api up">api +</button>
              <button type="button" className="btn btn-ghost" onClick={runChaos} disabled={chaos || !!oncall}>Chaos monkey</button>
              <label className="cl-heal mono">
                <input type="checkbox" checked={heal} disabled={!!oncall} onChange={(e) => toggleHeal(e.target.checked)} />
                auto-heal
              </label>
            </div>
            <button type="button" className="btn btn-primary" onClick={startOncall} disabled={!!oncall}>
              {oncall ? `On call · ${Math.ceil(oncall.left)}s` : `Take the pager (${onCallSeconds}s)`}
            </button>
          </div>

          {oncall && (
            <div className="cl-oncall mono" role="status">
              <span>YOU ARE ON CALL · AUTO-HEAL OFF</span>
              <span>error budget <b>{Math.round(oncall.budget)}%</b></span>
              <span>breaches <b>{oncall.breaches}</b></span>
              <span>fixed <b>{oncall.fixes}</b></span>
            </div>
          )}

          <div className="nodes">
            {nodes.map((n) => (
              <div key={n} className="node">
                <p className="node-name mono">{n}</p>
                <ul className="pods">
                  {pods.filter((p) => p.node === n).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`pod is-${p.status}`}
                        style={{ '--c': colorOf[p.app] }}
                        disabled={p.status === 'terminating' || p.status === 'pending'}
                        onClick={() => (p.status === 'crash' ? restart(p.id) : kill(p.id))}
                        aria-label={`${p.id}, ${statusWord(p.status)}. ${p.status === 'crash' ? 'Restart' : 'Kill'}`}
                        title={`${p.id} · ${statusWord(p.status)}`}
                      >
                        <span className="pod-app mono">{p.app}</span>
                        <span className="pod-id mono">{p.id.slice(-4)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <dl className="cl-stats mono">
            <div><dt>requests served</dt><dd>{requests.toLocaleString('en-IN')}</dd></div>
            <div><dt>error rate</dt><dd className={errRate > 0 ? 'bad' : ''}>{errRate}%</dd></div>
            <div><dt>pods ready</dt><dd>{ready}/{desiredTotal}</dd></div>
            <div><dt>deploys shipped</dt><dd>{stats.deploys}</dd></div>
          </dl>
        </div>

        <aside className="cl-mon panel" aria-label="Monitoring">
          <p className="cl-mon-title mono">grafana · platform health</p>
          <div className="gauge" style={{ '--v': health }} role="img" aria-label={`Health ${health}%`}>
            <span className="gauge-num">{health}<small>%</small></span>
            <span className="gauge-label mono">healthy</span>
          </div>
          <p className="cl-mon-title mono"># alerts</p>
          <ul className="slack" aria-live="polite">
            {alerts.length === 0 && <li className="slack-empty mono">all quiet. kill a pod to see an alert.</li>}
            {alerts.map((a) => (
              <li key={a.id} className={`slack-msg is-${a.kind}`}>
                <span className="slack-who mono">alertmanager <time>{a.time}</time></span>
                <span className="slack-txt mono">
                  {a.kind === 'fire' ? '🔥 FIRING · ' : '✅ RESOLVED · '}
                  {a.text}
                </span>
              </li>
            ))}
          </ul>
          <p className="cl-mon-note">{monitoringLine}</p>
        </aside>
      </div>
    </section>
  );
}

function statusWord(s) {
  return { running: 'Running', pending: 'Pending', terminating: 'Terminating', crash: 'CrashLoopBackOff' }[s] || s;
}
