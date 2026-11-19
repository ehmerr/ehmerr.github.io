// npm run images: regenerates the two pictures in public/ from content.yaml and the resume PDF.
//   og.png               the 1200×630 card shown when the site is shared (LinkedIn, WhatsApp, Slack…)
//   resume-preview.webp  page 1 of the resume, shown in the Resume section
// Run it after changing the resume PDF or your headline. Needs Playwright's Chromium and
// `sudo apt-get install -y poppler-utils webp` (for pdftoppm and cwebp).
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const c = parse(readFileSync(resolve(root, 'content.yaml'), 'utf8'));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const font = (pkg, file) => `data:font/woff2;base64,${readFileSync(resolve(root, 'node_modules', pkg, 'files', file)).toString('base64')}`;

// ---------- og.png ----------
function card() {
  const s = c.site;
  const url = new URL(c.seo?.url || 'https://ehmerr.github.io/').host;
  const tools = (c.personality?.marquee?.tools || []).slice(0, 6); // one row
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: SG; font-weight: 300 700; src: url(${font('@fontsource-variable/space-grotesk', 'space-grotesk-latin-wght-normal.woff2')}) format('woff2'); }
@font-face { font-family: JB; font-weight: 100 800; src: url(${font('@fontsource-variable/jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}) format('woff2'); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; }
body { position: relative; overflow: hidden; background: #0a0c0f; color: #e7ecf2; font-family: SG, sans-serif; padding: 70px 80px; }
body::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgba(231,236,242,.10) 1.2px, transparent 1.3px); background-size: 34px 34px;
  -webkit-mask-image: radial-gradient(ellipse at 80% 20%, #000 10%, transparent 75%); }
body::after { content: ''; position: absolute; width: 760px; height: 760px; right: -260px; top: -340px; border-radius: 50%;
  background: radial-gradient(circle, rgba(110,240,180,.22), transparent 62%); }
.in { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }
.cmd { font: 500 22px JB, monospace; color: #8b95a3; }
.cmd b { color: #6ef0b4; font-weight: 500; }
h1 { font-size: 92px; line-height: 1; letter-spacing: -.035em; font-weight: 700; margin-top: 26px; }
.role { margin-top: 22px; font: 600 26px JB, monospace; color: #6ef0b4; }
.tag { margin-top: 22px; font-size: 30px; line-height: 1.35; color: #c3cad3; max-width: 900px; }
.foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.tools { display: flex; flex-wrap: wrap; gap: 10px; max-width: 800px; }
.tools span { font: 500 17px JB, monospace; color: #c3cad3; border: 1px solid #262e39; background: rgba(17,21,27,.85); border-radius: 9px; padding: 7px 12px; }
.url { font: 600 20px JB, monospace; color: #e7ecf2; white-space: nowrap; display: flex; align-items: center; gap: 10px; }
.url i { width: 10px; height: 10px; border-radius: 50%; background: #6ef0b4; box-shadow: 0 0 14px #6ef0b4; }
</style></head><body><div class="in">
  <p class="cmd"><b>$</b> whoami</p>
  <h1>${esc(s.name)}</h1>
  <p class="role">${esc(s.role)} @ ${esc(s.company)} · ${esc(s.track)}</p>
  <p class="tag">${esc(s.tagline)}</p>
  <div class="foot">
    <div class="tools">${tools.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <p class="url"><i></i>${esc(url)}</p>
  </div>
</div></body></html>`;
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(card(), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(root, 'public/og.png') });
  console.log('✓ public/og.png');
} finally {
  await browser.close();
}

// ---------- resume-preview.webp ----------
const pdf = resolve(root, 'public', c.resume?.file || 'Ahmar-Rahmani-Resume.pdf');
const tmp = mkdtempSync(join(tmpdir(), 'resume-'));
try {
  execFileSync('pdftoppm', ['-png', '-f', '1', '-l', '1', '-singlefile', '-scale-to-x', '1100', '-scale-to-y', '-1', pdf, join(tmp, 'p1')]);
  execFileSync('cwebp', ['-quiet', '-q', '82', join(tmp, 'p1.png'), '-o', resolve(root, 'public', c.resume?.preview || 'resume-preview.webp')]);
  const png = readFileSync(join(tmp, 'p1.png'));
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  console.log(`✓ public/${c.resume?.preview || 'resume-preview.webp'} (${w}×${h})`);
} catch (e) {
  console.log(`✕ resume preview: ${e.code === 'ENOENT' ? 'pdftoppm/cwebp not found; run: sudo apt-get install -y poppler-utils webp' : e.message}`);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
