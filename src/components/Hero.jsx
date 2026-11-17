import { profile } from '../data/profile.js';
import LocalTime from './LocalTime.jsx';

// Hero. `terminal` is the live shell (Step 5); until then a static welcome is shown.
export default function Hero({ terminal = null, bot = null }) {
  return (
    <section id="top" className="hero wrap" aria-labelledby="hero-name">
      <div className="hero-copy">
        {bot}
        <p className="hero-role mono">
          <span className="hero-role-at">{profile.role}</span> @ {profile.company}
          <span className="hero-role-track"> · {profile.track}</span>
        </p>
        <h1 id="hero-name" className="hero-name">
          {profile.name}
          <span className="hero-dot" aria-hidden="true">.</span>
        </h1>
        <p className="hero-tagline">{profile.tagline}</p>
        <p className="hero-summary">{profile.summary}</p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#experience">See my work</a>
          <a className="btn btn-ghost" href="#contact">Get in touch</a>
          <a className="btn btn-ghost" href={profile.resume.href} target="_blank" rel="noopener">
            Resume
          </a>
        </div>
        <LocalTime />
      </div>
      <div className="hero-term">{terminal || <StaticTerminal />}</div>
    </section>
  );
}

function StaticTerminal() {
  return (
    <div className="term" aria-label="Terminal">
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="term-title mono">visitor@{profile.host}: ~</span>
      </div>
      <div className="term-body mono">
        <p className="t-cmd">$ ssh visitor@{profile.host}</p>
        <p className="t-ok">✓ pods healthy · pipeline green</p>
        <p className="t-out">Welcome. Scroll down, or come back when the shell is live.</p>
      </div>
    </div>
  );
}
