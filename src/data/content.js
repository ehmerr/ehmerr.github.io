// The parsed content.yaml (see tools/content-plugin.js). Edit content.yaml, not this file.
import content from '../../content.yaml';

export default content;

// Fills {placeholders} in a line of text, e.g. fill('Hi {city}', { city: 'Delhi' }).
export function fill(str, vars = {}) {
  return String(str ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export const str = (v) => (v == null ? '' : String(v));
