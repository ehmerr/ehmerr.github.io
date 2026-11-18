// Checks content.yaml and returns a list of { path, msg } problems (empty when all is well).
// Paths are arrays like ['experience', 0, 'title'] so the plugin can point at the right line.

// The site's code unlocks achievements by these ids, so the list in content.yaml must match.
export const ACHIEVEMENT_IDS = [
  'deploy', 'approve', 'rollback', 'kill', 'chaos', 'oncall', 'flawless', 'throw', 'strike', 'hire',
  'coffee', 'stretch', 'wake', 'sudo', 'kubectl', 'palette', 'theme', 'sound', 'element', 'compound',
  'apply', 'matrix', 'gravity', 'destroy', 'bottom',
];

export function validate(c) {
  const out = [];
  const bad = (path, msg) => out.push({ path, msg });
  const get = (path) => path.reduce((o, k) => (o == null ? undefined : o[k]), c);
  const isText = (v) => (typeof v === 'string' && v.trim() !== '') || typeof v === 'number';

  const text = (path, label = 'is missing or empty') => {
    if (!isText(get(path))) bad(path, label);
  };
  const list = (path, { min = 1 } = {}) => {
    const v = get(path);
    if (!Array.isArray(v)) { bad(path, 'should be a list (lines starting with "- ")'); return []; }
    if (v.length < min) bad(path, `needs at least ${min} item${min === 1 ? '' : 's'}`);
    return v;
  };
  const textList = (path, opts) => list(path, opts).forEach((v, i) => { if (!isText(v)) bad([...path, i], 'is empty'); });

  if (!c || typeof c !== 'object') return [{ path: [], msg: 'the file is empty' }];

  // site + contact + resume
  ['name', 'handle', 'host', 'role', 'company', 'track', 'tagline', 'summary', 'city', 'timeZone', 'openWhere', 'available']
    .forEach((k) => text(['site', k]));
  textList(['site', 'openTo']);
  text(['contact', 'email']);
  if (isText(get(['contact', 'email'])) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(get(['contact', 'email'])))) bad(['contact', 'email'], "doesn't look like an email address");
  ['github', 'linkedin'].forEach((k) => {
    const v = get(['contact', k]);
    if (v != null && !/^https?:\/\//.test(String(v))) bad(['contact', k], 'should start with https://');
  });
  ['file', 'preview', 'format', 'updated'].forEach((k) => text(['resume', k]));
  if (get(['resume', 'covers']) != null) textList(['resume', 'covers'], { min: 0 });

  // section headings
  for (const s of ['experience', 'pipeline', 'cluster', 'stack', 'contact', 'education', 'resume']) {
    text(['sections', s, 'kicker']);
    text(['sections', s, 'title']);
  }

  // experience
  list(['experience']).forEach((job, i) => {
    const p = ['experience', i];
    ['title', 'when'].forEach((k) => text([...p, k]));
    list([...p, 'groups']).forEach((g, j) => {
      if (g == null || typeof g !== 'object') { bad([...p, 'groups', j], 'should have "points:" (and optionally "heading:")'); return; }
      textList([...p, 'groups', j, 'points']);
    });
    if (job?.stats != null) list([...p, 'stats'], { min: 0 }).forEach((s, j) => {
      text([...p, 'stats', j, 'value']);
      text([...p, 'stats', j, 'label']);
    });
    if (job?.tags != null) textList([...p, 'tags'], { min: 0 });
    if (job?.hash != null && !/^[0-9a-f]{4,12}$/i.test(String(job.hash))) bad([...p, 'hash'], 'should be 4–12 letters/digits from 0-9 and a-f (or just remove it)');
  });

  // education
  list(['education'], { min: 0 }).forEach((e, i) => ['title', 'place'].forEach((k) => text(['education', i, k])));

  // skills
  const symbols = new Set();
  list(['skills']).forEach((g, i) => {
    const p = ['skills', i];
    text([...p, 'group']);
    if (!/^#[0-9a-f]{6}$/i.test(String(g?.color ?? ''))) bad([...p, 'color'], "should be a colour like '#5CC8FF' (with the quotes)");
    list([...p, 'elements']).forEach((el, j) => {
      const q = [...p, 'elements', j];
      ['symbol', 'name', 'use'].forEach((k) => text([...q, k]));
      const sym = String(el?.symbol ?? '');
      if (sym.length > 3) bad([...q, 'symbol'], 'should be 1–3 characters');
      if (symbols.has(sym)) bad([...q, 'symbol'], `"${sym}" is used twice; symbols must be unique`);
      symbols.add(sym);
    });
  });

  // compounds
  list(['compounds', 'pairs'], { min: 0 }).forEach((pr, i) => {
    const p = ['compounds', 'pairs', i];
    ['a', 'b', 'name', 'says'].forEach((k) => text([...p, k]));
    ['a', 'b'].forEach((k) => {
      const v = String(pr?.[k] ?? '');
      if (v && !symbols.has(v)) bad([...p, k], `"${v}" isn't a symbol in skills`);
    });
  });
  textList(['compounds', 'failed']);
  text(['compounds', 'self']);

  // achievements
  const ach = list(['achievements']);
  const seen = new Set();
  ach.forEach((a, i) => {
    ['id', 'name', 'hint'].forEach((k) => text(['achievements', i, k]));
    const id = String(a?.id ?? '');
    if (id && !ACHIEVEMENT_IDS.includes(id)) bad(['achievements', i, 'id'], `"${id}" isn't an id the site knows; keep the original ids`);
    seen.add(id);
  });
  const missing = ACHIEVEMENT_IDS.filter((id) => !seen.has(id));
  if (missing.length) bad(['achievements'], `is missing id${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);

  // personality
  ['late', 'morning', 'afternoon', 'evening', 'night'].forEach((k) => text(['personality', 'greetings', k]));
  textList(['personality', 'fortunes']);
  text(['personality', 'monitoring']);
  ['chaos', 'healOff', 'healOn', 'quota', 'oncallStart', 'flawless', 'okay'].forEach((k) => text(['personality', 'cluster', k]));
  ['names', 'jobs', 'poke', 'thrown', 'landed', 'strike', 'hire', 'coffee', 'gravity', 'panic', 'night']
    .forEach((k) => textList(['personality', 'bots', k]));

  return out;
}
