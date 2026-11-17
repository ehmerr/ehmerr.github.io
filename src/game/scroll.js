import { sections } from '../data/profile.js';

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

// Accepts a section id or label ("experience", "stack", "02"...).
export function findSection(q) {
  const s = String(q || '').toLowerCase().replace(/^#/, '');
  return sections.find((x) => x.id === s || x.label === s || x.num === s) || (s === 'education' ? { id: 'education', label: 'education' } : null);
}
