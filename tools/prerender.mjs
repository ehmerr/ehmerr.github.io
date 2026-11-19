// Runs after `vite build`: writes the rendered page into dist/index.html, so visitors, search
// engines and link previews get real HTML before any JavaScript runs. src/main.jsx then takes it
// over in place (hydrateRoot) instead of drawing the page again.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { viteServer, renderApp } from './render.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'dist/index.html');
const EMPTY = '<div id="root"></div>';

const server = await viteServer(root);
try {
  const html = await renderApp(server);
  const page = await readFile(file, 'utf8');
  if (!page.includes(EMPTY)) throw new Error(`dist/index.html has no ${EMPTY} to fill (already pre-rendered?)`);
  await writeFile(file, page.replace(EMPTY, () => `<div id="root">${html}</div>`));
  console.log(`prerender: ${(html.length / 1024).toFixed(1)} kB of HTML written into dist/index.html`);
} finally {
  await server.close();
}
