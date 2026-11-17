import { useGame } from '../game/GameProvider.jsx';

// Bottom-right HUD: achievements counter, plus bot controls (`children`, Step 9).
export default function Hud({ text = 'all quiet', children = null }) {
  const { found, total, setAchOpen } = useGame();
  return (
    <div className="hud mono">
      <button type="button" className="hud-btn hud-ach" aria-label={`Achievements: ${found.size} of ${total} found`} onClick={() => setAchOpen(true)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="9" r="6" />
          <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
        </svg>
        {found.size}/{total}
      </button>
      <span className="live-dot" aria-hidden="true" />
      <span className="hud-text">{text}</span>
      {children}
    </div>
  );
}
