// The toy cluster in 03 / SELF-HEALING CLUSTER. Mechanics live here; its messages come from content.yaml.
import c, { fill, str } from './content.js';

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

const q = c.personality.cluster;
export const monitoringLine = str(c.personality.monitoring);

export const clusterQuips = {
  chaos: str(q.chaos),
  healOff: str(q.healOff),
  healOn: str(q.healOn),
  quota: fill(q.quota, { max: maxApiReplicas }),
  oncallStart: str(q.oncallStart),
  flawless: str(q.flawless),
  okay: (n) => fill(q.okay, { n }),
};
