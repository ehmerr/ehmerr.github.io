// The release pipeline shown in 02 / PIPELINE. Modelled on the GitLab CI/CD flow at BytePe
// (simplified, with generic names). `{env}` and `{sha}` are filled in at run time.

export const envs = ['dev', 'staging', 'prod'];

export const stages = [
  {
    id: 'build',
    name: 'build',
    cmd: 'docker build -t api:{sha} .',
    logs: ['layer cache hit 11/14', 'image built · api:{sha}'],
    dur: 1100,
  },
  {
    id: 'push',
    name: 'push',
    cmd: 'docker push registry/api:{sha}',
    logs: ['pushed to Artifact Registry · tag is the commit, never "latest"'],
    dur: 800,
  },
  {
    id: 'dryrun',
    name: 'dry-run',
    cmd: 'helm upgrade api ./chart -f values-{env}.yaml --dry-run=server',
    logs: ['cluster accepted every manifest · no surprises'],
    dur: 900,
  },
  {
    id: 'migrate',
    name: 'migrate',
    cmd: 'kubectl apply -f jobs/db-migrate.yaml',
    logs: ['job/db-migrate completed'],
    dur: 900,
  },
  {
    id: 'approve',
    name: 'approve',
    gate: true, // production only: waits for the visitor to click Approve
    cmd: 'waiting for manual approval…',
    logs: ['approved by visitor · change ticket closed in record time'],
    dur: 0,
  },
  {
    id: 'deploy',
    name: 'deploy',
    cmd: 'helm upgrade api ./chart -f values-{env}.yaml --atomic',
    logs: ['rolling out 3/3 pods on GKE Autopilot', 'release "api" upgraded'],
    dur: 1500,
  },
  {
    id: 'verify',
    name: 'verify',
    cmd: 'curl -fsS https://api.{env}.internal/healthz',
    logs: ['200 OK · error rate normal'],
    dur: 800,
  },
];

// What happens when "Ship a bad release" is pressed: the deploy stage fails and Helm rolls back.
export const badRelease = {
  failAt: 'deploy',
  logs: [
    { t: '✕ 0/3 new pods passed their readiness check', k: 'err' },
    { t: '↺ --atomic: rolling back to the previous release…', k: 'warn' },
    { t: '✓ rollback complete · previous version still serving', k: 'ok' },
    { t: '0 users affected. the bad build never took traffic.', k: 'ok' },
  ],
};
