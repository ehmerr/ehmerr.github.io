import { useEffect, useMemo, useRef, useState } from 'react';
import { profile, sections } from '../data/profile.js';
import { useGame, accents } from '../game/GameProvider.jsx';
import { scrollToId } from '../game/scroll.js';

// ⌘K / Ctrl+K command palette.
export default function Palette() {
  const game = useGame();
  const { bus, unlock, play } = game;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const prevFocus = useRef(null);
  const openRef = useRef(false);
  openRef.current = open;

  const actions = useMemo(() => {
    const term = (cmd) => () => bus.emit('term:run', cmd);
    return [
      ...sections.map((s) => ({ group: 'Go to', label: s.num ? `${s.num} / ${s.label}` : s.label, kw: `open jump section ${s.label}`, run: () => scrollToId(s.id) })),
      { group: 'Go to', label: 'education & resume', kw: 'open education resume cv study', run: () => scrollToId('education') },
      { group: 'Play', label: 'Ship to production', kw: 'deploy pipeline run push prod', run: () => { bus.emit('pipeline:run', { env: 'prod' }); scrollToId('pipeline'); } },
      { group: 'Play', label: 'Ship a bad release (watch it roll back)', kw: 'deploy fail rollback bad', run: () => { bus.emit('pipeline:run', { env: 'prod', bad: true }); scrollToId('pipeline'); } },
      { group: 'Play', label: 'Release the chaos monkey', kw: 'chaos kill pods cluster break', run: () => { bus.emit('cluster:chaos'); scrollToId('cluster'); } },
      { group: 'Play', label: 'Play the on-call game', kw: 'oncall pager incident game cluster', run: () => { bus.emit('cluster:oncall'); scrollToId('cluster'); } },
      { group: 'Play', label: 'Hire a bot', kw: 'hire worker bot new', run: () => bus.emit('bots:cmd', { cmd: 'hire', reply: () => {} }) },
      { group: 'Play', label: 'Chai break for the bots', kw: 'coffee break chai worker', run: () => bus.emit('bots:cmd', { cmd: 'coffee', reply: () => {} }) },
      { group: 'Play', label: 'Turn gravity down', kw: 'gravity float moon konami', run: () => bus.emit('fx:gravity') },
      { group: 'Play', label: 'Matrix rain', kw: 'matrix green rabbit neo', run: () => bus.emit('fx:matrix') },
      { group: 'Play', label: 'Self-destruct the website', kw: 'terraform destroy boom explode', run: () => bus.emit('fx:destroy') },
      { group: 'Settings', label: game.soundOn ? 'Turn sound off' : 'Turn sound on', kw: 'sound mute volume audio', run: () => game.setSound(!game.soundOn) },
      ...accents.map((a) => ({ group: 'Settings', label: `Accent: ${a.name}`, kw: 'theme colour color accent repaint', run: () => game.cycleAccent(a.name) })),
      { group: 'Settings', label: 'Show achievements', kw: 'trophies secrets progress', run: () => game.setAchOpen(true) },
      { group: 'Settings', label: 'Replay the boot sequence', kw: 'boot intro loader', run: () => bus.emit('fx:boot') },
      { group: 'Contact', label: 'Copy email address', kw: 'mail contact hire copy', run: async () => { try { await navigator.clipboard.writeText(profile.email); game.toast('email copied'); } catch { game.toast(profile.email); } } },
      { group: 'Contact', label: 'Write an email', kw: 'mail contact hire message', run: () => { window.location.href = `mailto:${profile.email}`; } },
      { group: 'Contact', label: 'Open resume (PDF)', kw: 'cv resume pdf', run: () => window.open(profile.resume.href, '_blank', 'noopener') },
      { group: 'Contact', label: 'Open GitHub', kw: 'code repos github', run: () => window.open(profile.links.github, '_blank', 'noopener') },
      { group: 'Contact', label: 'Open LinkedIn', kw: 'profile linkedin', run: () => window.open(profile.links.linkedin, '_blank', 'noopener') },
      { group: 'Terminal', label: 'Run: neofetch', kw: 'terminal shell whoami', run: term('neofetch') },
    ];
  }, [bus, game]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions;
    const words = s.split(/\s+/);
    return actions.filter((a) => {
      const hay = `${a.label} ${a.kw} ${a.group}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [q, actions]);

  const show = () => {
    prevFocus.current = document.activeElement;
    setQ('');
    setSel(0);
    setOpen(true);
    unlock('palette');
    play('click');
  };
  const hide = () => {
    setOpen(false);
    prevFocus.current?.focus?.();
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (openRef.current) hide();
        else show();
      }
    };
    window.addEventListener('keydown', onKey);
    const off = bus.on('palette:open', show);
    return () => { window.removeEventListener('keydown', onKey); off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bus]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => setSel(0), [q]);

  if (!open) return null;

  const exec = (a) => {
    if (!a) return;
    hide();
    play('ok');
    setTimeout(() => a.run(), 30);
  };

  const onKey = (e) => {
    if (e.key === 'Escape') hide();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') exec(shown[sel]);
  };

  let lastGroup = null;
  return (
    <div className="pal-scrim" onClick={hide}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <div className="pal-top">
          <span className="pal-prompt mono" aria-hidden="true">❯</span>
          <input
            ref={inputRef}
            className="pal-input mono"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search commands…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-list"
            aria-activedescendant={shown[sel] ? `pal-${sel}` : undefined}
          />
          <kbd className="pal-esc mono">esc</kbd>
        </div>
        <ul id="pal-list" className="pal-list" role="listbox">
          {shown.length === 0 && <li className="pal-empty mono">zsh: command not found: {q}</li>}
          {shown.map((a, i) => {
            const header = a.group !== lastGroup ? (lastGroup = a.group) : null;
            return (
              <li key={`${a.group}-${a.label}`} role="presentation">
                {header && <p className="pal-group mono">{header}</p>}
                <button
                  id={`pal-${i}`}
                  type="button"
                  role="option"
                  aria-selected={i === sel}
                  className={`pal-item${i === sel ? ' on' : ''}`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => exec(a)}
                >
                  {a.label}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="pal-foot mono">↑↓ navigate · ↵ run · esc close</p>
      </div>
    </div>
  );
}
