// Who Ahmar is and how to reach him. The text comes from content.yaml.
import c, { str } from './content.js';

const s = c.site;
const phone = str(c.contact.phone);

export const profile = {
  name: str(s.name),
  first: str(s.first) || str(s.name).split(' ')[0],
  handle: str(s.handle),
  host: str(s.host),
  role: str(s.role),
  company: str(s.company),
  track: str(s.track),
  tagline: str(s.tagline),
  summary: str(s.summary),
  city: str(s.city),
  timeZone: str(s.timeZone),
  openTo: (s.openTo || []).map(str),
  openWhere: str(s.openWhere),
  available: str(s.available),
  buttons: { work: 'See my work', contact: 'Get in touch', resume: 'Resume', ...(s.buttons || {}) },

  email: str(c.contact.email),
  phone,
  phoneHref: phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '',
  links: { github: str(c.contact.github), linkedin: str(c.contact.linkedin) },
  resume: {
    href: `/${str(c.resume.file).replace(/^\//, '')}`,
    preview: `/${str(c.resume.preview).replace(/^\//, '')}`,
    format: str(c.resume.format),
    updated: str(c.resume.updated),
    covers: (c.resume.covers || []).map(str),
  },
};

export const education = (c.education || []).map((e, i) => ({
  key: String(i),
  title: str(e.title),
  place: str(e.place),
  when: str(e.when),
  score: str(e.score),
}));

// Section headings and intro lines.
export const text = c.sections;

// Section ids and labels, shared by the nav, the ⌘K palette and the terminal's `open` command.
export const sections = [
  { id: 'top', label: 'home' },
  { id: 'experience', label: str(text.experience.nav) || 'experience', num: '01' },
  { id: 'pipeline', label: str(text.pipeline.nav) || 'pipeline', num: '02' },
  { id: 'cluster', label: str(text.cluster.nav) || 'cluster', num: '03' },
  { id: 'stack', label: str(text.stack.nav) || 'stack', num: '04' },
  { id: 'contact', label: str(text.contact.nav) || 'contact', num: '05' },
];
