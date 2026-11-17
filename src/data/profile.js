// Who Ahmar is, and how to reach him. Every fact here comes from the previous version of the site.

export const profile = {
  name: 'Ahmar Rahmani',
  first: 'Ahmar',
  handle: 'ahmar',
  host: 'ahmar.sh',

  role: 'DevOps Intern',
  company: 'BytePe',
  track: 'Platform / SRE',
  tagline: 'I move apps onto Kubernetes, then keep them awake.',
  summary:
    'DevOps Intern at BytePe, a fintech startup. I run our platform on Google Cloud with GKE, Helm, Terraform and GitLab CI/CD.',

  city: 'New Delhi',
  timeZone: 'Asia/Kolkata',
  openTo: ['DevOps', 'Cloud', 'Platform', 'SRE'],
  openWhere: 'anywhere in India or remote',
  available: 'open to DevOps & SRE roles',

  email: 'ahmarrahmanicse@gmail.com',
  phone: '+91 79799 66812',
  phoneHref: 'tel:+917979966812',
  links: {
    github: 'https://github.com/ehmerr',
    linkedin: 'https://linkedin.com/in/ahmarrahmani',
  },
  resume: {
    href: '/Ahmar-Rahmani-Resume.pdf',
    preview: '/resume-preview.webp',
    format: 'PDF, 1 page',
    updated: '17 October 2026',
    covers: ['DevOps Intern · BytePe', 'VMs → GKE', 'GitLab CI/CD', 'Terraform', 'skills & education'],
  },
};

export const education = [
  {
    key: 'degree',
    title: 'B.Tech, Computer Science and Engineering (Data Science)',
    place: 'ITS Engineering College',
    when: 'Nov 2022 – Jun 2026',
    score: 'CGPA 7.98',
  },
  {
    key: 'school',
    title: 'Class XII, Senior Secondary (CBSE)',
    place: 'Sadhana Devi Vidyapith',
    when: 'Apr 2020 – Aug 2021',
    score: '91%',
  },
];

// Section ids and labels, shared by the nav, the ⌘K palette and the terminal's `open` command.
export const sections = [
  { id: 'top', label: 'home' },
  { id: 'experience', label: 'experience', num: '01' },
  { id: 'pipeline', label: 'pipeline', num: '02' },
  { id: 'cluster', label: 'cluster', num: '03' },
  { id: 'stack', label: 'stack', num: '04' },
  { id: 'contact', label: 'contact', num: '05' },
];
