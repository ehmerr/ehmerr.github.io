// The toy cluster in 03 / SELF-HEALING CLUSTER. Workloads are named after the kinds of things
// that run on the BytePe platform; counts are made up for the game.

export const nodes = ['node-a', 'node-b', 'node-c'];

export const workloads = [
  { app: 'api', replicas: 3, color: '#6EF0B4', scalable: true },
  { app: 'worker', replicas: 2, color: '#5CC8FF' },
  { app: 'web', replicas: 2, color: '#C4A1FF' },
  { app: 'osrm', replicas: 1, color: '#FFB86B' },
  { app: 'search', replicas: 1, color: '#F5E663' },
  { app: 'cron', replicas: 1, color: '#FF8A8A' },
];

export const maxApiReplicas = 12;
export const onCallSeconds = 20;

export const monitoringLine = 'I set up this monitoring myself: Grafana · Prometheus · OpenTelemetry · Slack alerts.';

export const clusterQuips = {
  chaos: 'Chaos monkey loose. Watch the cluster heal itself.',
  healOff: "Auto-heal is off. Dead pods stay dead now.",
  healOn: 'Auto-heal back on. Kubernetes has it from here.',
  quota: `Quota reached: max ${maxApiReplicas} api replicas. Finance is watching.`,
  oncallStart: "You're on call. Auto-heal is off. Click the red pods to restart them!",
  flawless: 'Flawless shift. Now imagine doing that at 3am. That is why I automate it.',
  okay: (n) => `Shift over with ${n} SLO breach${n === 1 ? '' : 'es'}. Automation exists for a reason.`,
};
