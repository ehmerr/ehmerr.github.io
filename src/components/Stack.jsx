import { groups, elements } from '../data/elements.js';
import SecHead from './SecHead.jsx';

// 04 / STACK — skills as a periodic table. `onPick(el)` opens the element drawer (Step 8);
// `extra` is the reactor (Step 8).
export default function Stack({ onPick = null, filter = null, setFilter = null, extra = null }) {
  return (
    <section id="stack" className="sec wrap" aria-labelledby="stack-title">
      <SecHead num="04" kicker="STACK" title="The periodic table" id="stack-title">
        {elements.length} elements I work with, in {groups.length} groups.
        {onPick ? ' Click one to see where I used it.' : ''}
      </SecHead>

      {setFilter && (
        <div className="ptable-filter mono" role="group" aria-label="Filter by group">
          <button type="button" className={filter === null ? 'on' : ''} onClick={() => setFilter(null)}>
            all
          </button>
          {groups.map((g, i) => (
            <button
              key={g.name}
              type="button"
              className={filter === i ? 'on' : ''}
              style={{ '--c': g.color }}
              onClick={() => setFilter(filter === i ? null : i)}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      <div className="ptable-wrap">
        <div className="ptable">
          {groups.map((g, gi) => (
            <div key={g.name} className="ptable-col" style={{ '--c': g.color }}>
              {elements
                .filter((e) => e.g === gi)
                .map((e) => {
                  const dim = filter !== null && filter !== gi;
                  const Tag = onPick ? 'button' : 'div';
                  return (
                    <Tag
                      key={e.sym}
                      className={`el${dim ? ' is-dim' : ''}`}
                      style={{ '--c': e.color }}
                      {...(onPick
                        ? { type: 'button', onClick: () => onPick(e), 'aria-label': `${e.name}: details` }
                        : { title: `${e.name}: ${e.use}` })}
                      draggable={onPick ? true : undefined}
                      onDragStart={onPick ? (ev) => ev.dataTransfer.setData('text/plain', e.sym) : undefined}
                    >
                      <span className="el-num mono">{e.n}</span>
                      <span className="el-sym">{e.sym}</span>
                      <span className="el-name mono">{e.name}</span>
                    </Tag>
                  );
                })}
              <p className="ptable-group mono">{g.name}</p>
            </div>
          ))}
        </div>
      </div>
      {extra}
    </section>
  );
}
