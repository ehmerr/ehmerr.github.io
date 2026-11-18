import { useState } from 'react';
import { career } from '../data/career.js';
import SecHead from './SecHead.jsx';
import { text } from '../data/profile.js';

// 01 / EXPERIENCE — career as `git log`, each commit expands into a diff.
export default function Experience() {
  const [open, setOpen] = useState(() => new Set([career[0].hash]));
  const toggle = (hash) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(hash) ? next.delete(hash) : next.add(hash);
      return next;
    });

  return (
    <section id="experience" className="sec wrap" aria-labelledby="experience-title">
      <SecHead num="01" kicker={text.experience.kicker} title={text.experience.title} id="experience-title">
        {text.experience.intro}
      </SecHead>
      <ol className="log">
        {career.map((c) => {
          const isOpen = open.has(c.hash);
          return (
            <li key={c.hash} className={`commit${isOpen ? ' is-open' : ''}`}>
              <span className="commit-dot" aria-hidden="true" />
              <button
                type="button"
                className="commit-head"
                aria-expanded={isOpen}
                aria-controls={`diff-${c.hash}`}
                onClick={() => toggle(c.hash)}
              >
                <span className="commit-meta mono">
                  <span className="commit-hash">{c.hash}</span>
                  <span className="commit-ref">({c.ref})</span>
                  <span className="commit-when">
                    {c.when}{c.place ? ` · ${c.place}` : ''}
                  </span>
                </span>
                <span className="commit-title">{c.title}</span>
                {c.sub && <span className="commit-sub">{c.sub}</span>}
                <span className="commit-toggle mono" aria-hidden="true">
                  {isOpen ? '− hide diff' : `+ git show ${c.hash}`}
                </span>
              </button>
              <ul className="commit-tags" aria-label="Tech used">
                {c.tags.map((t) => (
                  <li key={t} className="tag">{t}</li>
                ))}
              </ul>
              {isOpen && (
                <div id={`diff-${c.hash}`} className="diff-wrap">
                  {c.stats && (
                    <ul className="stats">
                      {c.stats.map((s) => (
                        <li key={s.label}>
                          <b>{s.value}</b>
                          <span>{s.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="diff mono">
                    {c.diff.map(([kind, text], i) =>
                      kind === 'hdr' ? (
                        <p key={i} className="diff-line diff-hdr">@@ {text} @@</p>
                      ) : (
                        <p key={i} className="diff-line diff-add">
                          <span aria-hidden="true">+ </span>
                          {text}
                        </p>
                      )
                    )}
                  </div>
                  {c.link && (
                    <a className="commit-link mono" href={c.link.href}>
                      → {c.link.label}
                    </a>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
