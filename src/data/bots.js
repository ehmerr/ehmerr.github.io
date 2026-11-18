// The worker bots. Names, jobs and lines come from content.yaml (personality.bots); colours and limits live here.
import c, { str } from './content.js';

const b = c.personality.bots;
const L = (k) => (b[k] || []).map(str);

export const botNames = L('names');
export const botColors = ['#6EF0B4', '#5CC8FF', '#C4A1FF', '#FFB86B', '#F5E663', '#FF8A8A'];
export const maxBots = 10;

export const jobs = L('jobs');

export const quips = {
  poke: L('poke'),
  thrown: L('thrown'),
  landed: L('landed'),
  strike: L('strike'),
  hire: L('hire'),
  coffee: L('coffee'),
  gravity: L('gravity'),
  panic: L('panic'),
  night: L('night'),
};

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
