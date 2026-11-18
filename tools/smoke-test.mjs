// Smoke test: `npm run check`
// 1. Server-renders the app and checks every section is there.
// 2. Mounts it in jsdom (a simulated browser) and plays through it like a visitor,
//    reporting any runtime error and which achievements unlocked.
// Pass --reduced to simulate prefers-reduced-motion.
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REDUCED = process.argv.includes('--reduced');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
const fail = (m) => { failed = true; console.log('✕ ' + m); };
const ok = (m) => console.log('✓ ' + m);

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const w = dom.window;
const errors = [];
w.addEventListener('error', (e) => errors.push('window error: ' + (e.error?.stack || e.message)));
const origErr = console.error;
console.error = (...a) => errors.push('console.error: ' + a.map(String).join(' ').slice(0, 500));
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Element', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'KeyboardEvent', 'MouseEvent', 'Event', 'MutationObserver']) {
  try { Object.defineProperty(globalThis, k, { value: w[k], configurable: true, writable: true }); } catch { /* read-only */ }
}
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
class FakeIO {
  constructor(cb) { this.cb = cb; }
  observe(el) { setTimeout(() => this.cb([{ isIntersecting: true, target: el }], this), 0); }
  unobserve() {}
  disconnect() {}
}
w.IntersectionObserver = FakeIO;
globalThis.IntersectionObserver = FakeIO;
if (!REDUCED) w.document.documentElement.classList.add('js-motion');

const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const $ = (s) => w.document.querySelector(s);
const $$ = (s) => [...w.document.querySelectorAll(s)];
const click = (el, what = '') => { if (!el) throw new Error('missing element to click: ' + what); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const byText = (sel, txt) => $$(sel).find((e) => e.textContent.includes(txt));
const key = (k, extra = {}) => w.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, ...extra }));

try {
  const React = (await import('react')).default;
  const { renderToString } = (await import('react-dom/server')).default;
  const { createRoot } = (await import('react-dom/client')).default;
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const content = (await server.ssrLoadModule('/src/data/content.js')).default;

  // ---------- 1. server render ----------
  const html = renderToString(React.createElement(App));
  const want = [
    content.site.name, content.site.tagline,
    ...Object.values(content.sections).map((s) => s.title).filter(Boolean),
    content.experience[0].title,
  ].map((t) => String(t).replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;').replace(/</g, '&lt;'));
  const missing = want.filter((t) => !html.includes(t));
  missing.length ? fail('server render is missing: ' + missing.join(' | ')) : ok(`server render has all ${want.length} headings from content.yaml`);
  const ids = ['top', 'experience', 'pipeline', 'cluster', 'stack', 'education', 'contact'].filter((i) => !html.includes(`id="${i}"`));
  ids.length ? fail('missing section ids: ' + ids.join(', ')) : ok('all section ids present');

  // ---------- 2. play through it ----------
  createRoot($('#root')).render(React.createElement(App));
  await sleep(700);
  key('x');
  await sleep(300);
  !$('.boot') ? ok('boot screen skippable') : fail('boot screen still showing');
  await sleep(200);
  w.document.body.classList.contains('booted') ? ok('hero intro triggered (body.booted)') : fail('body never got .booted');
  const revealSel = '[data-reveal], [data-reveal-stagger], [data-reveal-wave]';
  const notIn = $$(revealSel).filter((n) => !n.classList.contains('in'));
  notIn.length ? fail(`${notIn.length} reveal elements never got .in`) : ok(`all ${$$(revealSel).length} reveal elements revealed`);
  await sleep(REDUCED ? 0 : 3200);
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
