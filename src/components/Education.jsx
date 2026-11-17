import { education, profile } from '../data/profile.js';

// Education and the resume card, side by side.
export default function Education() {
  const r = profile.resume;
  return (
    <section id="education" className="sec wrap edu-sec" aria-labelledby="education-title">
      <div className="edu">
        <p className="sec-kicker mono">EDUCATION</p>
        <h2 id="education-title" className="edu-title">Where I studied</h2>
        <dl className="edu-list">
          {education.map((e) => (
            <div key={e.key} className="edu-row">
              <dt className="edu-when mono">{e.when}</dt>
              <dd>
                <strong>{e.title}</strong>
                <span className="edu-meta mono">
                  {e.place} · {e.score}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="cv panel">
        <div className="cv-copy">
          <p className="sec-kicker mono">RESUME</p>
          <h2 className="edu-title">The whole story, on one page</h2>
          <ul className="cv-tags">
            {r.covers.map((c) => (
              <li key={c} className="tag">{c}</li>
            ))}
          </ul>
          <p className="cv-meta mono">
            {r.format} · updated {r.updated}
          </p>
          <a className="btn btn-primary" href={r.href} target="_blank" rel="noopener">
            Read the resume
          </a>
        </div>
        <a className="cv-sheet" href={r.href} target="_blank" rel="noopener" aria-label={`Open ${profile.name}'s resume, PDF, in a new tab`}>
          <img src={r.preview} width="1100" height="1424" alt={`First page of ${profile.name}'s resume`} loading="lazy" decoding="async" />
        </a>
      </div>
    </section>
  );
}
