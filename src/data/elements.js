// The skills periodic table and the reactor. The text comes from content.yaml (skills:, compounds:).
import c, { str } from './content.js';

export const groups = (c.skills || []).map((g) => ({
  name: str(g.group),
  color: str(g.color),
  els: (g.elements || []).map((e) => [str(e.symbol), str(e.name), str(e.use), e.grep ? str(e.grep) : null]),
}));

// Flattened, numbered list: { n, sym, name, use, kw, g, color }
export const elements = [];
groups.forEach((group, g) => {
  group.els.forEach(([sym, name, use, kw]) => {
    elements.push({ n: elements.length + 1, sym, name, use, kw, g, color: group.color });
  });
});
export const bySym = Object.fromEntries(elements.map((e) => [e.sym, e]));

const key = (a, b) => [a, b].sort().join('+');
export const compounds = Object.fromEntries(
  (c.compounds.pairs || []).map((p) => [key(str(p.a), str(p.b)), { a: str(p.a), b: str(p.b), name: str(p.name), desc: str(p.says) }])
);
export function react(a, b) {
  return compounds[key(a, b)] || null;
}

export const failedMixes = (c.compounds.failed || []).map(str);
export const selfMix = str(c.compounds.self);
