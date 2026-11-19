// Career history for the `git log` section. The text comes from content.yaml (experience:).
// diff entries are [kind, text]:  'hdr' → @@ heading @@,  'add' → + line
import c, { str } from './content.js';

// A stable, made-up short commit hash for roles that don't set one.
function shortHash(s) {
  let h = 0x811c9dc5;
  for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

export const career = (c.experience || []).map((job, i, all) => ({
  hash: str(job.hash) || shortHash(`${job.title}|${job.when}`),
  ref: str(job.ref) || (i === 0 ? 'HEAD → main' : i === all.length - 1 ? 'tag: v0.1' : `HEAD~${i}`),
  title: str(job.title),
  when: str(job.when),
  place: str(job.place),
  sub: str(job.summary),
  stats: job.stats?.length ? job.stats.map((s) => ({ value: str(s.value), label: str(s.label) })) : null,
  tags: (job.tags || []).map(str),
  diff: (job.groups || []).flatMap((g) => [
    ...(g.heading ? [['hdr', str(g.heading)]] : []),
    ...(g.points || []).map((p) => ['add', str(p)]),
  ]),
  link: job.link?.href ? { href: str(job.link.href), label: str(job.link.label) || 'more' } : null,
}));
