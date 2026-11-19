import { profile } from '../data/profile.js';
import LocalTime from './LocalTime.jsx';
import Typewriter from '../motion/Typewriter.jsx';

// Hero. The intro animation starts when <body> gets .booted (after the boot screen).
export default function Hero({ terminal = null, bot = null }) {
  // Letters animate one by one, grouped into words so a line can only break between words.
  let n = 0;
  const words = profile.name.split(' ').map((w) => [...w].map((ch) => ({ ch, i: n++ })));
  return (
    <section id="top" className="hero wrap" aria-labelledby="hero-name">
      <div className="hero-copy">
        {bot}
        <p className="hero-role mono" data-hero style={{ '--d': '0ms' }}>
          <span className="hero-role-at">{profile.role}</span> @ {profile.company}
          <span className="hero-role-track"> · {profile.track}</span>
        </p>
        <h1 id="hero-name" className="hero-name">
          <span className="sr">{profile.name}</span>
          <span aria-hidden="true">
            {words.map((w, wi) => (
              <span key={wi}>
                {wi > 0 && ' '}
                <span className="word">
                  {w.map(({ ch, i }) => (
                    <span key={i} className="ch" style={{ '--i': i }}>{ch}</span>
                  ))}
                  {wi === words.length - 1 && <span className="hero-dot">.</span>}
                </span>
              </span>
            ))}
          </span>
        </h1>
        <p className="hero-tagline" data-hero style={{ '--d': '450ms' }}>
          <Typewriter text={profile.tagline} delay={900} />
        </p>
        <p className="hero-summary" data-hero style={{ '--d': '650ms' }}>{profile.summary}</p>
        <div className="hero-cta" data-hero style={{ '--d': '800ms' }}>
          <a className="btn btn-primary" href="#experience" data-magnetic data-cur="scroll">{profile.buttons.work}</a>
          <a className="btn btn-ghost" href="#contact" data-magnetic>{profile.buttons.contact}</a>
          <a className="btn btn-ghost" href={profile.resume.href} target="_blank" rel="noopener" data-magnetic data-cur="pdf">
            {profile.buttons.resume}
          </a>
        </div>
        <div data-hero style={{ '--d': '950ms' }}>
          <LocalTime />
        </div>
      </div>
      <div className="hero-term" data-hero="right" style={{ '--d': '350ms' }}>
        {terminal}
      </div>
    </section>
  );
}
