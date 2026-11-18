import { profile, text } from '../data/profile.js';

// Footer. `bot` is the night-shift bot (Step 9).
export default function Footer({ bot = null, onDanger = null }) {
  return (
    <footer className="foot wrap">
      {bot}
      <p className="foot-word" aria-hidden="true">{profile.handle}</p>
      <p className="foot-fine mono">
        <span>© 2026 {profile.name} · {profile.city}</span>
        {text.footer?.line && <span>{text.footer.line}</span>}
        {onDanger && (
          <button type="button" className="foot-danger" onClick={onDanger}>do not press</button>
        )}
      </p>
    </footer>
  );
}
