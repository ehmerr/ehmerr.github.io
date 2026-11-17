// The skills periodic table.
// Each element: [symbol, name, what I use it for (one plain line), grep keyword for career.js (optional)]

export const groups = [
  {
    name: 'Cloud',
    color: '#5CC8FF',
    els: [
      ['Gc', 'Google Cloud', 'Where everything I run lives.', 'Google Cloud'],
      ['Gk', 'GKE Autopilot', 'Our clusters for dev, staging and production.', 'GKE'],
      ['Ca', 'Cloud Armor', 'Security rules in front of production.', 'production'],
      ['Ar', 'Artifact Registry', 'Where every image we build is stored.', 'pipeline'],
      ['Wi', 'Workload Identity', 'Lets pods use short-lived credentials instead of key files.', 'Terraform'],
      ['Nw', 'Networking', 'TCP/IP, DNS, TLS, VPCs and load balancers.', null],
    ],
  },
  {
    name: 'IaC & CI/CD',
    color: '#FFB86B',
    els: [
      ['Tf', 'Terraform', 'Our infrastructure for all three environments, as code.', 'Terraform'],
      ['Gl', 'GitLab CI/CD', 'Backend and front-end pipelines, the approval gate and rollbacks.', 'GitLab'],
      ['Ga', 'GitHub Actions', 'Workflows for side projects, including this site.', null],
      ['Gt', 'Git', 'Branches, reviews and submodules.', null],
    ],
  },
  {
    name: 'Containers',
    color: '#C4A1FF',
    els: [
      ['Dk', 'Docker', 'Images for every service, plus Docker Compose locally.', null],
      ['K8', 'Kubernetes', 'Autoscaling, health checks, Jobs and CronJobs.', 'Kubernetes'],
      ['Hm', 'Helm', 'Shared charts for our services and front ends.', 'Helm'],
      ['Gw', 'Gateway API', 'How users reach production on GKE.', 'production'],
    ],
  },
  {
    name: 'Observability',
    color: '#FF8A8A',
    els: [
      ['Pm', 'Prometheus', 'Metrics and alert rules for all three environments.', 'Prometheus'],
      ['Gf', 'Grafana', 'One place to see dev, staging and production.', 'Grafana'],
      ['Ot', 'OpenTelemetry', 'Traces from our services without changing app code.', 'OpenTelemetry'],
      ['Lk', 'Loki & Alloy', 'A self-hosted log stack, as a side project.', null],
      ['K6', 'k6', 'Load tests for the platform.', 'k6'],
    ],
  },
  {
    name: 'Data',
    color: '#F5E663',
    els: [
      ['Pg', 'PostgreSQL', 'Cloud SQL for our apps.', null],
      ['My', 'MySQL', 'Cloud SQL for our apps.', null],
      ['Rd', 'Redis', 'Memorystore for caching.', null],
      ['Pv', 'pgvector', 'The search index behind the AI proof of concept.', 'AI'],
    ],
  },
  {
    name: 'Code & AI',
    color: '#6EF0B4',
    els: [
      ['Sh', 'Bash', 'Scripts and automation.', null],
      ['Py', 'Python', 'Scripts and tooling.', null],
      ['Lx', 'Linux', 'Ubuntu and SSH, every day.', null],
      ['Nx', 'Nginx', 'Serving our front ends.', 'front ends'],
      ['Vl', 'vLLM', 'Running a self-hosted LLM on a GPU.', 'AI'],
      ['Cc', 'Claude Code', 'AI help with Terraform, manifests and pipelines.', null],
    ],
  },
];

// Flattened, numbered list: { n, sym, name, use, kw, g, color }
export const elements = [];
groups.forEach((group, g) => {
  group.els.forEach(([sym, name, use, kw]) => {
    elements.push({ n: elements.length + 1, sym, name, use, kw, g, color: group.color });
  });
});
export const bySym = Object.fromEntries(elements.map((e) => [e.sym, e]));

// The reactor: drop two elements in, get a compound. Keys are order-independent.
const recipes = [
  ['Tf', 'Gk', 'Cluster in a Commit', 'The whole cluster can be rebuilt from one repo.'],
  ['Tf', 'Ca', 'Policy as Code', 'Firewall rules reviewed in a merge request, not clicked in a console.'],
  ['Tf', 'Wi', 'Keyless Pods', 'Short-lived credentials. No key files sitting in a drawer.'],
  ['Gl', 'Hm', 'Release Train', 'Push, build, helm upgrade. All aboard.'],
  ['Gl', 'Ar', 'Immutable Tags', "Every image is named after its commit. 'latest' is banned."],
  ['Hm', 'K8', 'One Chart, Three Envs', 'Same chart everywhere. Only the values change.'],
  ['Dk', 'K8', 'Pod', 'A container that someone else restarts for you.'],
  ['Gk', 'Gw', 'Front Door', 'All traffic comes in through one well-lit entrance.'],
  ['Gw', 'Ca', 'Bouncer', 'Bad requests get turned away at the door.'],
  ['Ot', 'Pm', 'Span Metrics', 'Traces that also count things.'],
  ['Pm', 'Gf', 'Wall of Graphs', 'Green means sleep. Red means Slack.'],
  ['Gf', 'Gt', 'Dashboards as Code', 'Graphs that go through code review.'],
  ['Lk', 'Gf', 'Log Diving', 'One click from an error spike to the exact log line.'],
  ['K6', 'K8', 'Autoscale Drill', 'Throw fake users at it and watch the pods multiply.'],
  ['K6', 'Gw', 'Load Day', 'A thousand virtual users knock on the front door at once.'],
  ['Vl', 'Pv', 'RAG on a Budget', 'A private LLM that reads our docs before it answers.'],
  ['Vl', 'Gk', 'Scale-to-Zero GPU', 'The GPU sleeps until someone asks a question.'],
  ['Pg', 'Pv', 'Vector Store', "Postgres learns what 'similar' means."],
  ['Sh', 'Lx', 'Old Faithful', 'Every outage ends with someone SSHing in.'],
  ['Py', 'Gl', 'Pipeline Glue', 'Small scripts that keep the big pipeline in line.'],
  ['Nx', 'Dk', 'Front End in a Box', 'A tiny image that serves the site fast.'],
  ['Cc', 'Tf', 'Pair Programming', 'Terraform drafted with AI, reviewed by a human.'],
  ['Rd', 'K8', 'Cache Hit', 'Fast answers, right up until someone flushes it.'],
];

const key = (a, b) => [a, b].sort().join('+');
export const compounds = Object.fromEntries(
  recipes.map(([a, b, name, desc]) => [key(a, b), { a, b, name, desc }])
);
export function react(a, b) {
  return compounds[key(a, b)] || null;
}

export const failedMixes = [
  'Reaction failed: CrashLoopBackOff.',
  'Rejected by the admission controller.',
  'Nothing happened. Like a cron job in the wrong time zone.',
  'Produced 400 lines of YAML and no output.',
  'Error: resource already exists. Import it first.',
];
export const selfMix = "Mixing an element with itself? That's just a replica.";
