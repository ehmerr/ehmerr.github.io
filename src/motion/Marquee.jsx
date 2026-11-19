import { elements } from '../data/elements.js';
import content, { str } from '../data/content.js';

// content.yaml › personality › marquee: { tools: [...], status: [...] }
// (a plain list still works and is treated as the status words)
const MQ = content.personality.marquee || {};
const TOOLS = (Array.isArray(MQ) ? [] : MQ.tools || []).map(str).filter(Boolean);
const STATUS = (Array.isArray(MQ) ? MQ : MQ.status || []).map(str).filter(Boolean);

// A tool takes the colour of the skill with the same name ("GKE" also matches "GKE Autopilot").
const colorOf = (name) => {
  const n = name.toLowerCase();
  const hit = elements.find((e) => e.name.toLowerCase() === n)
    || elements.find((e) => e.name.toLowerCase().startsWith(n + ' '));
  return hit?.color;
};

// Two bands drifting in opposite directions: tools on top, status words below.
export default function Marquee() {
  const tech = TOOLS.length
    ? TOOLS.map((t) => ({ t, c: colorOf(t) }))
    : elements.map((e) => ({ t: e.name, c: e.color })); // no list given: show every skill
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
    <div className="mq-clip">
      <div className="mq" aria-label="Tools I work with">
        {row(tech, 'mq-a')}
        {STATUS.length > 0 && row(STATUS.map((t) => ({ t: `✓ ${t}` })), 'mq-b mono')}
      </div>
    </div>
  );
}
