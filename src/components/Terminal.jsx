import { useEffect, useRef, useState } from 'react';
import { profile, sections } from '../data/profile.js';
import { career } from '../data/career.js';
import { groups, elements } from '../data/elements.js';
import { fortunes, greetings } from '../data/quips.js';
import { useGame, accents } from '../game/GameProvider.jsx';
import { scrollToId, findSection } from '../game/scroll.js';
import { track } from '../game/track.js';

const HELP = [
  'available commands (tab completes):',
  '  whoami · neofetch        who is this person',
  '  git log                  career history',
  '  skills                   the periodic table',
  '  deploy [--bad]           run the pipeline (or break it)',
  '  kubectl get pods|nodes   live cluster state',
  '  kubectl delete pod <name> · kubectl scale --replicas=N',
  '  chaos · oncall           break things / get paged',
  '  hire · coffee · top      manage the bots',
  '  theme [mint|sky|lilac|amber]   repaint the site',
  '  sound on|off             synth bleeps',
  '  matrix · gravity         you will see',
  '  achievements             what you have found',
  '  open <section>           jump around (or ⌘K / Ctrl+K)',
  '  self-destruct            you would not dare',
  '  uptime · contact · history · fortune · clear',
];

const COMPLETIONS = [
  'help', 'whoami', 'neofetch', 'git log', 'skills', 'deploy', 'deploy --bad',
  'kubectl get pods', 'kubectl get nodes', 'kubectl delete pod ', 'kubectl scale --replicas=',
  'chaos', 'oncall', 'hire', 'coffee', 'top', 'workers',
  ...accents.map((a) => `theme ${a.name}`), 'sound on', 'sound off',
  'matrix', 'gravity', 'achievements', ...sections.map((s) => `open ${s.label}`), 'open education',
  'self-destruct', 'uptime', 'contact', 'history', 'fortune', 'clear', 'sudo hire ahmar', 'cat about.md', 'ls',
];

const t0 = Date.now();

export default function Terminal() {
  const game = useGame();
  const { bus, unlock, play, setAchOpen, cycleAccent, setSound, stats } = game;
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [hist, setHist] = useState([]);
  const histIdx = useRef(-1);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const out = (items) =>
    setLines((ls) => [...ls, ...items.map((x) => (typeof x === 'string' ? { t: x, k: 'out' } : x))].slice(-200));

  // Boot greeting
  useEffect(() => {
    const hour = new Date().getHours();
    setLines([
      { t: `$ ssh visitor@${profile.host}`, k: 'cmd' },
      { t: greetings(hour), k: 'dim' },
      { t: '✓ pods healthy · pipeline green · bots on shift', k: 'ok' },
      { t: "type 'help' to look around, or just scroll.", k: 'out' },
    ]);
  }, []);

  // Other parts of the site can print here or run commands (palette → `term:run`).
  const runRef = useRef(null);
  runRef.current = run;
  useEffect(() => {
    const a = bus.on('term:print', (items) => out(items));
    const b = bus.on('term:run', (cmd) => {
      runRef.current(cmd);
      scrollToId('top');
    });
    return () => { a(); b(); };
  }, [bus]);

  useEffect(() => {
    const b = bodyRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [lines]);

  function run(raw) {
    const cmd = raw.trim();
    const echo = { t: `$ ${cmd}`, k: 'cmd' };
    if (!cmd) return out([echo]);
    setHist((h) => [...h, cmd].slice(-50));
    const [head, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(' ');
    const lc = cmd.toLowerCase();
    play('key');

    if (lc === 'clear') return setLines([]);

    const reply = (items) => out([echo, ...items]);

    switch (head.toLowerCase()) {
      case 'help':
      case '?':
        return reply(HELP);
      case 'whoami':
        return reply([`${profile.name}`, `${profile.role} @ ${profile.company} · ${profile.track}`, profile.tagline]);
      case 'cat':
        if (/about/.test(arg)) return reply([profile.summary, `Open to ${profile.openTo.join(', ')} roles, ${profile.openWhere}.`]);
        if (/career|log/.test(arg)) return run('git log');
        if (/periodic|skills|csv/.test(arg)) return run('skills');
        return reply([{ t: `cat: ${arg || ''}: No such file or directory`, k: 'err' }]);
      case 'ls':
        return reply(['about.md  career.log  periodic-table.csv  hire.tfplan  .secrets/']);
      case 'cd':
        return reply([{ t: 'you are already home.', k: 'dim' }]);
      case 'pwd':
        return reply([`/home/visitor/${profile.host}`]);
      case 'neofetch': {
        const up = Math.round((Date.now() - t0) / 1000);
        return reply([
          { t: `visitor@${profile.host}`, k: 'ok' },
          '-------------------',
          `name     ${profile.name}`,
          `role     ${profile.role} @ ${profile.company}`,
          `track    ${profile.track}`,
          `cloud    Google Cloud · GKE Autopilot`,
          `stack    Kubernetes · Helm · Terraform · GitLab CI/CD`,
          `watch    Grafana · Prometheus · OpenTelemetry`,
          `city     ${profile.city} (IST)`,
          `uptime   ${up}s on this page`,
          `found    ${game.found.size}/${game.total} achievements`,
        ]);
      }
      case 'git':
        if (/^log/.test(arg) || arg === '') {
          return reply([
            ...career.map((c) => ({ t: `${c.hash} (${c.ref}) ${c.title} · ${c.when}`, k: 'warn' })),
            { t: '→ full diff in 01 / experience', k: 'dim' },
          ]);
        }
        if (/^push/.test(arg)) return reply([{ t: 'everything up-to-date. (it always is, here.)', k: 'dim' }]);
        return reply([{ t: `git: '${arg}' is not something I'd run on main.`, k: 'err' }]);
      case 'skills':
        return reply([
          ...groups.map((g) => `${g.name.padEnd(14)} ${elements.filter((e) => groups[e.g] === g).map((e) => e.name).join(' · ')}`),
          { t: '→ the full table is in 04 / stack', k: 'dim' },
        ]);
      case 'deploy': {
        const bad = /--bad|fail/.test(arg);
        bus.emit('pipeline:run', { bad, env: 'prod' });
        scrollToId('pipeline');
        return reply([{ t: bad ? 'shipping a release that will fail its checks… on purpose.' : 'triggering pipeline for production…', k: 'ok' }]);
      }
      case 'kubectl':
      case 'k': {
        unlock('kubectl');
        let answered = false;
        bus.emit('cluster:cmd', {
          args: rest,
          reply: (items) => {
            answered = true;
            reply(items);
          },
        });
        if (!answered) reply([{ t: 'error: the cluster is not reachable from here (yet).', k: 'err' }]);
        return;
      }
      case 'chaos':
        bus.emit('cluster:chaos');
        scrollToId('cluster');
        return reply([{ t: 'releasing the chaos monkey… go to 03 / cluster.', k: 'warn' }]);
      case 'oncall':
        bus.emit('cluster:oncall');
        scrollToId('cluster');
        return reply([{ t: 'PAGE: you are now on call. scroll to 03 / cluster. good luck.', k: 'err' }]);
      case 'hire':
      case 'coffee':
      case 'workers':
      case 'top': {
        let answered = false;
        bus.emit('bots:cmd', { cmd: head.toLowerCase(), reply: (items) => { answered = true; reply(items); } });
        if (!answered) reply([{ t: 'the bots are not on shift yet.', k: 'dim' }]);
        return;
      }
      case 'theme': {
        if (!arg) { cycleAccent(); return reply(['repainted. try: ' + accents.map((a) => a.name).join(' · ')]); }
        const a = accents.find((x) => x.name === arg.toLowerCase());
        if (!a) return reply([{ t: `unknown accent: ${arg}. try ${accents.map((x) => x.name).join(' · ')}`, k: 'err' }]);
        cycleAccent(a.name);
        return reply([`repainted in ${a.name}.`]);
      }
      case 'sound':
        if (arg === 'on') { setSound(true); return reply(['sound on. you asked for it.']); }
        if (arg === 'off') { setSound(false); return reply(['sound off. sweet silence.']); }
        return reply(['usage: sound on|off']);
      case 'matrix':
        bus.emit('fx:matrix');
        return reply([{ t: 'wake up, visitor…', k: 'ok' }]);
      case 'gravity':
        bus.emit('fx:gravity');
        return reply(['gravity reduced for a few seconds. hold on to something.']);
      case 'achievements':
        setAchOpen(true);
        return reply([`${game.found.size}/${game.total} found. opening the list…`]);
      case 'open':
      case 'goto': {
        const s = findSection(arg);
        if (!s) return reply([{ t: `no such section: ${arg || '(none)'}`, k: 'err' }]);
        scrollToId(s.id);
        return reply([`→ ${s.label}`]);
      }
      case 'self-destruct':
      case 'selfdestruct':
        bus.emit('fx:destroy');
        return reply([{ t: 'self-destruct armed. there is an abort button. probably.', k: 'err' }]);
      case 'uptime': {
        const s = Math.round((Date.now() - t0) / 1000);
        return reply([`up ${Math.floor(s / 60)}m ${s % 60}s · ${stats.deploys} deploys · ${stats.podsKilled} pods killed · load average: calm`]);
      }
      case 'contact':
        return reply([`email   ${profile.email}`, `phone   ${profile.phone}`, `github  ${profile.links.github}`, `linkedin ${profile.links.linkedin}`, { t: '→ or scroll to 05 / contact', k: 'dim' }]);
      case 'history':
        return reply(hist.length ? hist.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`) : ['(empty)']);
      case 'fortune':
        return reply([fortunes[Math.floor(Math.random() * fortunes.length)]]);
      case 'date':
        return reply([new Date().toString()]);
      case 'echo':
        return reply([arg]);
      case 'sudo':
        if (/hire\s+ahmar/i.test(arg)) {
          unlock('sudo');
          play('ok');
          setTimeout(() => scrollToId('contact'), 900);
          return reply([
            { t: '[sudo] password for recruiter: ********', k: 'dim' },
            { t: '✓ access granted. hiring ahmar… see 05 / contact', k: 'ok' },
          ]);
        }
        unlock('sudo');
        return reply([{ t: 'visitor is not in the sudoers file. this incident will be reported. (to nobody)', k: 'err' }]);
      case 'rm':
        return reply([{ t: 'nice try. the filesystem is read-only. immutable infra, remember?', k: 'err' }]);
      case 'vim':
      case 'vi':
      case 'nano':
      case 'emacs':
        return reply([{ t: 'nothing to edit. everything here is deployed from git.', k: 'dim' }]);
      case 'exit':
      case 'logout':
        return reply([{ t: "there is no logout. there is only 'self-destruct'.", k: 'dim' }]);
      case 'ping':
        return reply([`PONG from ${profile.host}: time=0.2ms (it is all in your browser)`]);
      case 'curl':
        return reply(['HTTP/2 200', 'x-powered-by: chai', 'content-type: text/human']);
      default:
        play('err');
        return reply([{ t: `zsh: command not found: ${head}. try 'help'.`, k: 'err' }]);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') {
      if (input.trim()) track('terminal-used');
      run(input);
      setInput('');
      histIdx.current = -1;
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.toLowerCase();
      if (!v) return;
      const hits = COMPLETIONS.filter((c) => c.startsWith(v));
      if (hits.length === 1) setInput(hits[0]);
      else if (hits.length > 1) out([{ t: `$ ${input}`, k: 'cmd' }, hits.join('   ')]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hist.length) return;
      histIdx.current = histIdx.current === -1 ? hist.length - 1 : Math.max(0, histIdx.current - 1);
      setInput(hist[histIdx.current]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx.current === -1) return;
      histIdx.current += 1;
      if (histIdx.current >= hist.length) { histIdx.current = -1; setInput(''); }
      else setInput(hist[histIdx.current]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <div className="term" onClick={() => inputRef.current?.focus()}>
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="term-title mono">visitor@{profile.host}: ~</span>
      </div>
      <div className="term-body mono" ref={bodyRef} role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map((l, i) => (
          <p key={i} className={`t-${l.k}`}>{l.t}</p>
        ))}
        <div className="term-line">
          <span className="term-prompt" aria-hidden="true">$</span>
          <input
            ref={inputRef}
            className="term-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            aria-label="Terminal command"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder="type help"
          />
        </div>
      </div>
    </div>
  );
}
