// Vite plugin: lets the app `import content from '../../content.yaml'`.
// The YAML is parsed and checked at build time only, so visitors download plain JSON, not a YAML parser.
// Mistakes are reported as "content.yaml line N: …" in the terminal and in the browser overlay.
import { basename } from 'node:path';
import { parseDocument, LineCounter } from 'yaml';
import { validate } from './validate-content.js';

export default function contentPlugin() {
  return {
    name: 'content-yaml',
    transform(code, id) {
      if (!/\.ya?ml$/.test(id)) return null;
      const file = basename(id);
      const lines = new LineCounter();
      const doc = parseDocument(code, { lineCounter: lines, prettyErrors: true });

      if (doc.errors.length) {
        const e = doc.errors[0];
        const line = e.linePos?.[0]?.line;
        throw friendly(id, line, `${file}${line ? ` line ${line}` : ''}: this line (or the one just below it) can't be read.\n${e.message}\n\nTip: check the indentation, and put text that contains ": " in quotes.`);
      }

      const data = doc.toJS();
      const problems = validate(data);
      if (problems.length) {
        const where = (path) => {
          for (let p = path; p.length; p = p.slice(0, -1)) {
            const node = doc.getIn(p, true);
            if (node?.range) return lines.linePos(node.range[0]).line;
          }
          return null;
        };
        const msgs = problems.slice(0, 8).map(({ path, msg }) => {
          const line = where(path);
          return `  • ${line ? `line ${line}: ` : ''}${pretty(path)} ${msg}`;
        });
        const first = where(problems[0].path);
        throw friendly(id, first, `${file} needs a fix:\n${msgs.join('\n')}${problems.length > 8 ? `\n  …and ${problems.length - 8} more` : ''}`);
      }

      return { code: `export default ${JSON.stringify(data)};`, map: null };
    },
  };
}

function pretty(path) {
  return path.map((p) => (typeof p === 'number' ? `item ${p + 1}` : p)).join(' › ');
}

function friendly(id, line, message) {
  const err = new Error(message);
  err.id = id;
  if (line) err.loc = { file: id, line, column: 1 };
  err.stack = message; // keep the overlay free of plugin internals
  return err;
}
