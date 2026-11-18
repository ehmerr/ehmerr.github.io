import { elements } from '../data/elements.js';
import content, { str } from '../data/content.js';

const STATUS = (content.personality.marquee || []).map(str);

// Two bands of tech and status words drifting in opposite directions.
export default function Marquee() {
  const tech = elements.map((e) => ({ t: e.name, c: e.color }));
  const row = (items, cls) => (
    <div className={`mq-row ${cls}`}>
      <div className="mq-track">
        {[0, 1].map((k) => (
          <div className="mq-group" key={k} aria-hidden={k === 1 ? 'true' : undefined}>
            {items.map((it, i) => (
              <span key={i} className="mq-item" style={it.c ? { '--c': it.c } : undefined}>
                <i aria-hidden="true" />
                {it.t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="mq" aria-label="Tools I work with">
      {row(tech, 'mq-a')}
      {STATUS.length > 0 && row(STATUS.map((t) => ({ t: `✓ ${t}` })), 'mq-b mono')}
    </div>
  );
}
