import { useGame } from '../game/GameProvider.jsx';

// Sound toggle, accent cycler and ⌘K button for the nav.
export default function NavTools({ onPalette }) {
  const { soundOn, setSound, accent, cycleAccent, play } = useGame();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return (
    <>
      <button
        type="button"
        className="icon-btn"
        data-magnetic
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
        title={soundOn ? 'Sound on' : 'Sound off'}
        onClick={() => setSound(!soundOn)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          {soundOn ? <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /> : <path d="m23 9-6 6M17 9l6 6" />}
        </svg>
      </button>
      <button
        type="button"
        className="icon-btn"
        data-magnetic
        aria-label={`Accent colour: ${accent.name}. Click to change.`}
        title={`accent: ${accent.name}`}
        onClick={() => { cycleAccent(); play('click'); }}
      >
        <span className="accent-swatch" aria-hidden="true" />
      </button>
      <button type="button" className="icon-btn nav-pal mono" data-magnetic data-cur="⌘K" aria-label="Open command palette" onClick={onPalette}>
        <span aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</span>
      </button>
    </>
  );
}
