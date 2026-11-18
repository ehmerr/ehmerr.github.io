// Achievements. Names and hints come from content.yaml; ids are checked by tools/validate-content.js.
import c, { str } from './content.js';

export const achievements = (c.achievements || []).map((a) => ({ id: str(a.id), name: str(a.name), hint: str(a.hint) }));
export const achById = Object.fromEntries(achievements.map((a) => [a.id, a]));
