// Smoke test: `npm run check`
// 1. Server-renders the app (exactly what tools/prerender.mjs puts in dist/index.html) and checks every section is there.
// 2. Loads that HTML into jsdom (a simulated browser), runs index.html's <head> script and src/main.jsx,
//    which takes the HTML over in place (hydration), like the live site. Any mismatch between the
//    pre-built HTML and the first browser render is reported by React and fails the test.
// 3. Plays through the site like a visitor, reporting any runtime error and which achievements unlocked.
// Pass --reduced to simulate prefers-reduced-motion.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { viteServer, renderApp } from './render.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REDUCED = process.argv.includes('--reduced');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
const fail = (m) => { failed = true; console.log('✕ ' + m); };
const ok = (m) => console.log('✓ ' + m);

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only' });
const w = dom.window;
const errors = [];
w.addEventListener('error', (e) => errors.push('window error: ' + (e.error?.stack || e.message)));
const origErr = console.error;
console.error = (...a) => errors.push('console.error: ' + a.map(String).join(' ').slice(0, 500));
// Browser globals are installed only after the server render below, which (like tools/prerender.mjs) runs in plain Node.
const installBrowserGlobals = () => {
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Element', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'KeyboardEvent', 'MouseEvent', 'Event', 'MutationObserver']) {
  try { Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true }); } catch { /* read-only */ }
}
globalThis.IntersectionObserver = FakeIO;
};
// Simulate a desktop browser: precise pointer, optional reduced motion.
w.matchMedia = (q) => ({
  matches: /reduce/.test(q) ? REDUCED : /pointer: fine|hover: hover/.test(q),
  media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
});
w.HTMLElement.prototype.scrollIntoView = function () {};
w.scrollTo = () => {};
// A do-nothing 2D canvas, so the background field and particle loops really run.
const noop = () => {};
w.HTMLCanvasElement.prototype.getContext = function () {
  return new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop: noop }) : noop),
    set: (t, k, v) => { t[k] = v; return true; },
  });
};
// IntersectionObserver that reports everything as visible right away.
// Like the real thing, it stops reporting after unobserve()/disconnect().
class FakeIO {
  constructor(cb) { this.cb = cb; this.els = new Set(); }
  observe(el) {
    this.els.add(el);
    setTimeout(() => { if (this.els.has(el)) this.cb([{ isIntersecting: true, target: el }], this); }, 0);
  }
  unobserve(el) { this.els.delete(el); }
  disconnect() { this.els.clear(); }
}
w.IntersectionObserver = FakeIO;

const server = await viteServer(root);
const $ = (s) => w.document.querySelector(s);
const $$ = (s) => [...w.document.querySelectorAll(s)];
const click = (el, what = '') => { if (!el) throw new Error('missing element to click: ' + what); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const byText = (sel, txt) => $$(sel).find((e) => e.textContent.includes(txt));
const key = (k, extra = {}) => w.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, ...extra }));

try {
  // ---------- 1. server render (plain Node, no window) ----------
  const html = await renderApp(server);
  // Re-evaluate every app module with the browser globals in place, as a real browser would.
  server.moduleGraph.invalidateAll();
  installBrowserGlobals();
  const content = (await server.ssrLoadModule('/src/data/content.js')).default;
  const want = [
    content.site.name, content.site.tagline,
    ...Object.values(content.sections).map((s) => s.title).filter(Boolean),
    content.experience[0].title,
  ].map((t) => String(t).replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;').replace(/</g, '&lt;'));
  const missing = want.filter((t) => !html.includes(t));
  missing.length ? fail('server render is missing: ' + missing.join(' | ')) : ok(`server render has all ${want.length} headings from content.yaml`);
  const ids = ['top', 'experience', 'pipeline', 'cluster', 'stack', 'education', 'contact'].filter((i) => !html.includes(`id="${i}"`));
  ids.length ? fail('missing section ids: ' + ids.join(', ')) : ok('all section ids present');

  // ---------- 2. take over the pre-built HTML, like the live site ----------
  $('#root').innerHTML = html;
  const head = readFileSync(resolve(root, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/);
  if (!head) throw new Error('index.html has no inline <head> script');
  // A returning visitor: saved accent + an achievement. Must not change the first render.
  w.localStorage.setItem('ahmar.accent', '1');
  w.localStorage.setItem('ahmar.accentVars', JSON.stringify(['#5CC8FF', '92, 200, 255']));
  w.localStorage.setItem('ahmar.ach', JSON.stringify(['theme']));
  w.eval(head[1]);
  w.document.documentElement.style.getPropertyValue('--accent') === '#5CC8FF' ? ok('saved accent applied before first paint') : fail('saved accent not applied by head script');
  const cls = w.document.documentElement.classList;
  (REDUCED ? !cls.contains('js-motion') && !cls.contains('boot-on') : cls.contains('js-motion') && cls.contains('boot-on'))
    ? ok(`head script set ${REDUCED ? 'no motion classes (reduced motion)' : 'js-motion + boot-on'}`)
    : fail('head script classes wrong: ' + cls.value);
  const prebuilt = $('#root').firstElementChild;
  await server.ssrLoadModule('/src/main.jsx'); // hydrateRoot under StrictMode (mounts every effect twice in dev)
  // Poll instead of fixed sleeps: jsdom is slow, especially with StrictMode and the canvas loops running.
  const waitFor0 = async (cond, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (cond()) return true; await sleep(50); } return cond(); };
  await waitFor0(() => $('.term-body p'));
  const hydErr = errors.filter((e) => /hydrat|did not match|server rendered|client rendering/i.test(e));
  (await waitFor0(() => /: 1 of/.test($('.hud-ach')?.getAttribute('aria-label') || ''), 3000)) ? ok('saved achievements loaded after takeover') : fail('saved achievements not loaded: ' + $('.hud-ach')?.getAttribute('aria-label'));
  hydErr.length || $('#root').firstElementChild !== prebuilt
    ? fail('hydration failed: React redrew the page instead of taking over the pre-built HTML')
    : ok('pre-built HTML taken over in place (no hydration mismatches)');

  // ---------- 3. play through it ----------
  const waitFor = async (cond, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (cond()) return true; await sleep(50); } return cond(); };
  await waitFor(() => $('.term-input'));
  if (!REDUCED) await waitFor(() => $('.boot'), 2000);
  const skipped = await waitFor(() => { key('x'); return !$('.boot'); }, 1200);
  skipped ? ok('boot screen skippable') : fail('boot screen still showing');
  (await waitFor(() => w.document.body.classList.contains('booted'))) ? ok('hero intro triggered (body.booted)') : fail('body never got .booted');
  const revealSel = '[data-reveal], [data-reveal-stagger], [data-reveal-wave]';
  const notIn = $$(revealSel).filter((n) => !n.classList.contains('in'));
  notIn.length ? fail(`${notIn.length} reveal elements never got .in`) : ok(`all ${$$(revealSel).length} reveal elements revealed`);
  await waitFor(() => ($('.hero-tagline [aria-hidden]')?.textContent || '').includes(content.site.tagline), 8000);
  const typed = $('.hero-tagline [aria-hidden]')?.textContent || '';
  typed.includes(content.site.tagline) ? ok('tagline fully typed' + (REDUCED ? ' (instantly)' : '')) : fail('tagline not fully typed: ' + typed);
  if (REDUCED) {
    !$('.cur-ring') && !w.document.documentElement.classList.contains('js-motion') ? ok('reduced motion: no cursor, no hidden states') : fail('motion still on under reduced motion');
  } else {
    $('.cur-ring') ? ok('custom cursor mounted') : fail('cursor missing');
  }

  // Move the pointer over things to exercise the cursor, tilt and magnetic buttons.
  const pmove = (el, x, y) => el.dispatchEvent(new w.MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
  for (const sel of ['button.el', '.stats li', '.hero-cta .btn', '.pod']) {
    const n = $(sel);
    if (n) { pmove(n, 50, 40); await sleep(40); }
  }
  w.dispatchEvent(new w.MouseEvent('pointerdown', { clientX: 100, clientY: 100 }));
  await sleep(100);

  const input = $('.term-input');
  const setVal = (v) => {
    Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(input, v);
    input.dispatchEvent(new w.Event('input', { bubbles: true }));
  };
  const cmd = async (c) => {
    setVal(c); await sleep(30);
    input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await sleep(80);
  };
  for (const c of ['help', 'whoami', 'neofetch', 'git log', 'skills', 'kubectl get pods', 'top', 'theme sky', 'fortune', 'uptime', 'contact', 'sudo hire ahmar', 'nonsense']) await cmd(c);
  const term = $('.term-body').textContent;
  term.includes('available commands') && term.includes('READY') && term.includes('command not found') ? ok('terminal commands respond') : fail('terminal output incomplete');

  const before = $$('.pod').length;
  click($('.pod.is-running'), 'pod');
  await sleep(3200);
  $$('.pod.is-running').length === before ? ok('killed pod healed') : fail(`pods ${before} → ${$$('.pod.is-running').length}`);

  click(byText('.pipe-btns .btn', 'Ship it'), 'ship');
  await sleep(4500);
  click(byText('.gate .btn', 'Approve'), 'approve');
  await sleep(3000);
  $$('.stage.is-ok').length === $$('.stage').length ? ok('prod pipeline green after approval') : fail('pipeline did not finish');

  click(byText('.pipe-btns .btn', 'bad release'), 'bad');
  await sleep(4500);
  click(byText('.gate .btn', 'Approve'), 'approve bad');
  await sleep(2600);
  $('.pipe-log').textContent.includes('rollback complete') ? ok('bad release rolled back') : fail('no rollback');

  const el = (sym) => $$('button.el').find((b) => b.querySelector('.el-sym').textContent === sym);
  const pair = content.compounds.pairs[0];
  for (const sym of [pair.a, pair.b]) {
    click(el(sym), sym);
    await sleep(80);
    click(byText('.el-drawer .btn', 'add to reactor'), 'add');
    key('Escape');
    await sleep(80);
  }
  click(byText('.reactor .btn', 'Mix'), 'mix');
  await sleep(1500);
  $('.compound-name')?.textContent === pair.name ? ok(`reactor made "${pair.name}"`) : fail('reactor result: ' + $('.compound')?.textContent);

  click(byText('.tf-actions .btn', 'Approve'), 'tf');
  await sleep(4200);
  $('.reach-email') ? ok('terraform apply reveals contact') : fail('contact not revealed');

  key('k', { ctrlKey: true });
  await sleep(100);
  $('.pal') ? ok('palette opens') : fail('palette did not open');
  key('k', { ctrlKey: true });
  await sleep(100);

  await sleep(1200);
  const bots = $$('.wk').length;
  click(byText('.hud-btn', '+ hire'), 'hire');
  click(byText('.hud-btn', 'chai'), 'chai');
  await sleep(300);
  $$('.wk').length === bots + 1 ? ok(`bots: ${bots} → ${bots + 1}`) : fail('hire did not add a bot');

  click($('.night-bot'), 'night');
  click($('button[aria-label="Turn sound on"]'), 'sound');
  await cmd('matrix');
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) key(k);
  await sleep(200);

  click(byText('.cl-controls .btn', 'Take the pager'), 'pager');
  for (let i = 0; i < 46 && (i < 2 || $('.cl-oncall')); i++) { $$('.pod.is-crash').forEach((p) => click(p)); await sleep(500); }
  !$('.cl-oncall') ? ok('on-call shift ends') : fail('on-call never ended');

  click(byText('.cl-btns .btn', 'Chaos'), 'chaos');
  await sleep(5500);
  await cmd('self-destruct');
  await sleep(9800);
  click(byText('.sd-term .btn', 'terraform apply'), 'restore');
  await sleep(200);
  !w.document.body.classList.contains('sd-boom') ? ok('self-destruct → restore') : fail('site not restored');

  // Nothing should be left invisible once revealed.
  w.document.querySelectorAll('[data-reveal]').forEach((n) => n.classList.add('in'));
  click($('.hud-ach'), 'ach');
  await sleep(100);
  ok('achievements ' + $('.drawer-title')?.textContent.trim());
} catch (e) {
  errors.push('TEST: ' + (e.stack || e));
} finally {
  console.error = origErr;
  if (errors.length) { failed = true; console.log(`\nERRORS (${errors.length}):\n` + [...new Set(errors)].slice(0, 12).join('\n')); }
  else console.log('\nno runtime errors' + (REDUCED ? ' (reduced motion)' : ''));
  await server.close();
  process.exit(failed ? 1 : 0);
}
