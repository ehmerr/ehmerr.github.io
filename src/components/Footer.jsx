import { profile } from '../data/profile.js';

// Footer. `bot` is the night-shift bot (Step 9).
export default function Footer({ bot = null, onDanger = null }) {
  return (
    <footer className="foot wrap">
      {bot}
      <p className="foot-word" aria-hidden="true">{profile.handle}</p>
      <p className="foot-fine mono">
        <span>© 2026 {profile.name} · {profile.city}</span>
        <span>built with Vite, shipped by GitHub Actions, watched by nobody at 3am</span>
        {onDanger && (
          <button type="button" className="foot-danger" onClick={onDanger}>do not press</button>
        )}
      </p>
    </footer>
  );
}
