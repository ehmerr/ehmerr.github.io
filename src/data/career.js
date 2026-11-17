// Career history, shown as `git log`. Newest first.
// Copy rule: one short line per item, plain words, say what was done (no bug stories or internals).
//
// diff entries are [kind, text]:  'hdr' → @@ group heading @@,  'add' → + line

export const career = [
  {
    hash: 'b7e4c21',
    ref: 'HEAD → main',
    title: 'DevOps Intern @ BytePe',
    when: 'Jun 2026 – present',
    place: 'Noida',
    sub: 'Fintech startup · I run the platform on Google Cloud with my lead',
    stats: [
      { value: '3', label: 'environments moved to Kubernetes' },
      { value: '~64%', label: 'lower production compute cost' },
      { value: '~55%', label: 'fewer non-production compute hours' },
    ],
    tags: [
      'Google Cloud', 'GKE', 'Kubernetes', 'Helm', 'Terraform', 'GitLab CI/CD', 'Docker',
      'Grafana', 'Prometheus', 'OpenTelemetry', 'k6', 'Python', 'Bash',
    ],
    diff: [
      ['hdr', 'VMs → Kubernetes'],
      ['add', 'Moved dev, staging and production from VMs to GKE Autopilot with my lead. All three are done.'],
      ['add', 'Set up the production pipeline and ran the cutover. Production has been live on GKE since Oct 2026.'],
      ['add', 'Put our web front ends on Kubernetes with Helm.'],

      ['hdr', 'monitoring'],
      ['add', 'Set up the whole monitoring stack myself: Grafana, Prometheus, OpenTelemetry, Cloud Logging, Cloud Trace and Slack alerts, for all three environments.'],

      ['hdr', 'CI/CD'],
      ['add', 'Built the staging pipeline and the production approval gate in GitLab CI/CD.'],
      ['add', 'Made releases safe to ship, with automatic rollback when an upgrade fails.'],

      ['hdr', 'cost'],
      ['add', 'Cut production compute cost by ~64%.'],
      ['add', 'Dev and staging now sleep on nights and weekends: ~55% fewer compute hours.'],

      ['hdr', 'platform'],
      ['add', 'Set up autoscaling and wrote k6 load tests for the platform.'],
      ['add', 'Moved OSRM (routing) and Typesense (search) onto GKE.'],
      ['add', 'Wrote Terraform for our infrastructure across all three environments.'],

      ['hdr', 'AI'],
      ['add', 'Built an AI proof of concept: a self-hosted LLM that answers from our docs, on a GPU that scales to zero.'],
    ],
  },
  {
    hash: '1a0f3d9',
    ref: 'tag: v0.1',
    title: 'init: B.Tech CSE (Data Science)',
    when: 'Nov 2022 – Jun 2026',
    place: 'ITS Engineering College',
    sub: 'Where it started',
    tags: ['Computer Science', 'Data Science'],
    diff: [
      ['add', 'B.Tech in Computer Science and Engineering (Data Science).'],
      ['add', 'Graduated with a CGPA of 7.98.'],
    ],
    link: { href: '#education', label: 'see education' },
  },
];
