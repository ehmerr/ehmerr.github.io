// The worker bots: names, jobs and lines. All written for this site.

export const botNames = ['HELM', 'PODDY', 'KUBO', 'GREP', 'CRON', 'TAINT', 'PROBE', 'SHA', 'YAML', 'NOOP', 'LINT', 'REDIS'];
export const botColors = ['#6EF0B4', '#5CC8FF', '#C4A1FF', '#FFB86B', '#F5E663', '#FF8A8A'];
export const maxBots = 10;

export const jobs = [
  'rotating secrets', 'tagging images', 'fixing YAML indents', 'reading logs', 'resizing node pools',
  'renewing certs', 'tuning HPA', 'checking probes', 'waiting on CI', 'it was DNS', 'chai.exe',
];

export const quips = {
  poke: ['Busy. Very busy.', 'I am mid-rollout!', 'That tickles my health check.', 'Please file a ticket.', 'Not in my runbook.', 'Rude. Logging this.'],
  thrown: ['WHEEEE', 'I am not a load balancer!', 'Unscheduled migration!', 'PUT ME DOWN', 'Evicted without notice!'],
  landed: ['Rescheduled. Fine.', 'New node, who dis?', 'Okay, I work here now.', 'That was… fun actually.', 'Readiness: questionable.'],
  strike: ['ON STRIKE', 'Union of Pods, Local 503.', 'No more throwing!', 'We want chai and uptime.'],
  hire: ['Reporting for duty!', 'Where is the kubeconfig?', 'First day! Hi!'],
  coffee: ['ahh, chai', 'five-minute break', 'refuelling…'],
  gravity: ['I can see prod from here!', 'who turned off gravity?', 'floating point error'],
  panic: ['RUN!!', 'NOT THE BUTTON!', 'WHERE ARE THE BACKUPS?', 'I just got promoted!'],
  night: ['zzz… five more minutes', 'Night shift. Go away.', 'Alerts are quiet. Let me sleep.', 'Only page me for prod.'],
};

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
