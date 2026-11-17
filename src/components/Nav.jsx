import { profile, sections } from '../data/profile.js';

// Sticky top bar. Step 4 adds the status pill states, sound, accent and ⌘K tools via `tools`.
export default function Nav({ status = 'ok', statusText = 'all systems operational', tools = null }) {
  return (
    <nav className="nav" aria-label="Sections">
      <div className="nav-in">
        <a className="nav-brand mono" href="#top">
          {profile.host}
          <span className="nav-caret" aria-hidden="true" />
        </a>
        <div className="nav-links">
          {sections
            .filter((s) => s.num)
            .map((s) => (
              <a key={s.id} className="nav-link mono" href={`#${s.id}`}>
                <span className="nav-num">{s.num}</span>
                {s.label}
              </a>
            ))}
        </div>
        <div className="nav-tools">
          <span className={`nav-status mono is-${status}`} role="status">
            <span className="live-dot" aria-hidden="true" />
            <span className="nav-status-txt">{statusText}</span>
          </span>
          {tools}
        </div>
      </div>
    </nav>
  );
}
