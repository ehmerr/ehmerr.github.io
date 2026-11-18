import { useEffect, useRef, useState } from 'react';
import { career } from '../data/career.js';
import { text } from '../data/profile.js';
import { onScrollProgress, motionOn } from '../motion/motion.js';
import CountUp from '../motion/CountUp.jsx';
import SecHead from './SecHead.jsx';

// 01 / EXPERIENCE — career as `git log`. The timeline draws itself as you scroll;
// each commit expands into a diff whose lines cascade in.
export default function Experience() {
  const [open, setOpen] = useState(() => new Set(career.length ? [career[0].hash] : []));
  const logRef = useRef(null);
  const toggle = (hash) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(hash) ? next.delete(hash) : next.add(hash);
      return next;
    });

  useEffect(() => {
    const el = logRef.current;
    if (!el || !motionOn()) return;
    return onScrollProgress(el, (p) => {
      el.style.setProperty('--p', p.toFixed(3));
      el.style.setProperty('--log-h', `${Math.max(0, el.offsetHeight - 48)}px`);
      el.style.setProperty('--p-on', p > 0.01 && p < 0.99 ? '1' : '0');
    }, { start: 0.75, end: 0.35 });
  }, []);

  return (
    <section id="experience" className="sec wrap" aria-labelledby="experience-title">
      <SecHead num="01" kicker={text.experience.kicker} title={text.experience.title} id="experience-title">
        {text.experience.intro}
      </SecHead>
      <ol className="log" ref={logRef}>
        {career.map((c) => {
          const isOpen = open.has(c.hash);
          return (
            <li key={c.hash} className={`commit${isOpen ? ' is-open' : ''}`} data-reveal>
              <span className="commit-dot" aria-hidden="true" />
              <button
                type="button"
                className="commit-head"
                aria-expanded={isOpen}
                aria-controls={`diff-${c.hash}`}
                onClick={() => toggle(c.hash)}
                data-cur={isOpen ? 'collapse' : 'git show'}
              >
                <span className="commit-meta mono">
                  <span className="commit-hash">{c.hash}</span>
                  {c.ref && <span className="commit-ref">({c.ref})</span>}
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
              {c.tags.length > 0 && (
                <ul className="commit-tags" aria-label="Tech used" data-reveal-stagger>
                  {c.tags.map((t) => (
                    <li key={t} className="tag">{t}</li>
                  ))}
                </ul>
              )}
              {isOpen && (
                <div id={`diff-${c.hash}`} className="diff-wrap">
                  {c.stats && (
                    <ul className="stats">
                      {c.stats.map((s) => (
                        <li key={s.label} data-tilt="8">
                          <b><CountUp value={s.value} /></b>
                          <span>{s.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="diff mono">
                    {c.diff.map(([kind, line], i) =>
                      kind === 'hdr' ? (
                        <p key={i} className="diff-line diff-hdr" style={{ '--i': i }}>@@ {line} @@</p>
                      ) : (
                        <p key={i} className="diff-line diff-add" style={{ '--i': i }}>
                          <span aria-hidden="true">+ </span>
                          {line}
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
