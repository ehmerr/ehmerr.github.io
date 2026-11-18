// Small bits of personality used across the site. The text comes from content.yaml (personality:).
import c, { str } from './content.js';

const g = c.personality.greetings;

export const fortunes = (c.personality.fortunes || []).map(str);

export const greetings = (hour) =>
  str(hour < 5 ? g.late : hour < 12 ? g.morning : hour < 17 ? g.afternoon : hour < 21 ? g.evening : g.night);
