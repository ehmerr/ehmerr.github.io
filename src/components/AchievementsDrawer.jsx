import { useEffect, useRef } from 'react';
import { achievements } from '../data/achievements.js';
import { useGame } from '../game/GameProvider.jsx';

export default function AchievementsDrawer() {
  const { found, total, achOpen, setAchOpen } = useGame();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!achOpen) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setAchOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [achOpen, setAchOpen]);

  if (!achOpen) return null;
  const pct = Math.round((found.size / total) * 100);

  return (
    <div className="drawer-scrim" onClick={() => setAchOpen(false)}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="ach-title" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="drawer-kicker mono">RUNBOOK OF SECRETS</p>
            <h2 id="ach-title" className="drawer-title">
              {found.size} / {total} found
            </h2>
          </div>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Close achievements" onClick={() => setAchOpen(false)}>
            ✕
          </button>
        </div>
        <div className="ach-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
        <ul className="ach-list">
          {achievements.map((a) => {
            const got = found.has(a.id);
            return (
              <li key={a.id} className={`ach${got ? ' got' : ''}`}>
                <span className="ach-ic" aria-hidden="true">{got ? '★' : '☆'}</span>
                <span>
                  <b>{got ? a.name : '???'}</b>
                  <small>{a.hint}</small>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="drawer-foot mono">Tip: type <code>help</code> in the terminal, or press ⌘K / Ctrl+K.</p>
      </aside>
    </div>
  );
}
