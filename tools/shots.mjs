// npm run shots: builds the site, serves the build, and saves screenshots to shots/ (gitignored):
//   desktop + phone: first visit (boot screen, hero), every section, and the whole page
//   no-js (desktop + phone), reduced motion (phone), slow-js (what shows before the app starts), 404
// Also prints any browser console errors. Needs Playwright's Chromium: `npx playwright install chromium`
// plus its system libraries (`sudo env "PATH=$PATH" npx playwright install-deps chromium`).
import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'shots');
const SECTIONS = ['top', 'experience', 'pipeline', 'cluster', 'stack', 'education', 'contact'];
const VIEWS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
const only = process.argv.slice(2); // e.g. `npm run shots -- phone` to limit passes by name
const want = (name) => !only.length || only.some((o) => name.includes(o));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const saved = [];
const problems = [];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const server = await preview({ root, logLevel: 'error', preview: { port: 4179 } });
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();

async function page(view, opts = {}, { returning = true } = {}) {
  const ctx = await browser.newContext({ ...VIEWS[view], ...opts });
  if (returning) await ctx.addInitScript(() => { try { sessionStorage.setItem('ahmar.booted', '1'); } catch {} });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') problems.push(`[${view}] console: ${m.text()}`); });
  p.on('pageerror', (e) => problems.push(`[${view}] page error: ${e.message}`));
  return p;
}
async function shot(p, name, full = false) {
  const file = resolve(out, `${name}.png`);
  await p.screenshot({ path: file, fullPage: full });
  saved.push(`shots/${name}.png`);
}

try {
  for (const view of Object.keys(VIEWS)) {
    if (want(`${view}-first`)) {
      const p = await page(view, {}, { returning: false });
      await p.goto(base);
      await wait(700);
      await shot(p, `${view}-first-1-boot`);
      await p.keyboard.press('x');
      await wait(2600);
      await shot(p, `${view}-first-2-hero`);
      await p.context().close();
    }
    if (want(`${view}-sections`) || want(`${view}-full`)) {
      const p = await page(view);
      await p.goto(base);
      await wait(1800);
      for (const [i, id] of SECTIONS.entries()) {
        await p.evaluate((sid) => document.getElementById(sid)?.scrollIntoView({ block: 'start' }), id);
        await wait(1300);
        if (want(`${view}-sections`)) await shot(p, `${view}-${i + 1}-${id}`);
      }
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await wait(1200);
      await p.evaluate(() => window.scrollTo(0, 0));
      await wait(800);
      if (want(`${view}-full`)) await shot(p, `${view}-full`, true);
      await p.context().close();
    }
    if (want(`${view}-nojs`)) {
      const p = await page(view, { javaScriptEnabled: false });
      await p.goto(base);
      await wait(500);
      await shot(p, `${view}-nojs`, true);
      await p.context().close();
    }
  }
  if (want('phone-reduced')) {
    const p = await page('phone', { reducedMotion: 'reduce' });
    await p.goto(base);
    await wait(1200);
    await shot(p, 'phone-reduced', true);
    await p.context().close();
  }
  if (want('slow-js')) {
    // What a visitor on a slow connection sees before the app's JavaScript arrives.
    const p = await page('phone', {}, { returning: false });
    await p.route(/\/assets\/.*\.js$/, async (r) => { await wait(3000); await r.continue(); });
    await p.goto(base, { waitUntil: 'commit' });
    await wait(900);
    await shot(p, 'slow-js-1-before-app');
    await wait(4500);
    await shot(p, 'slow-js-2-after-app');
    await p.context().close();
  }
  if (want('404')) {
    const p = await page('desktop');
    await p.goto(new URL('404.html', base).href); // vite preview doesn't serve it for unknown paths; GitHub Pages does
    await wait(300);
    await shot(p, '404');
    await p.context().close();
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}

console.log(saved.join('\n'));
console.log(problems.length ? `\nbrowser errors (${problems.length}):\n${[...new Set(problems)].join('\n')}` : '\nno browser errors');
process.exit(problems.length ? 1 : 0);
