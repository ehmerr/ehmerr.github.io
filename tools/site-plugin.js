// Vite plugin: builds everything around the page from content.yaml, so it never drifts from the site.
//  · <head>: title, description, link-preview tags (Open Graph / Twitter), canonical, JSON-LD Person
//  · <noscript> line with contact links for visitors without JavaScript
//  · build only: font preloads, GoatCounter stats (if configured), robots.txt, sitemap.xml, 404.html
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const meta = (attrs) => ({ tag: 'meta', attrs, injectTo: 'head' });

export function siteInfo(root) {
  const c = parse(readFileSync(resolve(root, 'content.yaml'), 'utf8')) || {};
  const site = c.site || {};
  const seo = c.seo || {};
  const url = seo.url || 'https://ehmerr.github.io/';
  return {
    c,
    url,
    title: seo.title || `${site.name} · ${site.track}`,
    description: seo.description || site.summary,
    share: seo.shareText || `${site.role} at ${site.company}. ${site.tagline}`,
    image: new URL('og.png', url).href,
    imageAlt: `${site.name}, ${site.role} at ${site.company}.`,
    goatcounter: c.analytics?.goatcounter || '',
  };
}

function person({ c, url, image }) {
  const site = c.site || {};
  const contact = c.contact || {};
  const tools = c.personality?.marquee?.tools;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url,
    image,
    jobTitle: site.role,
    worksFor: site.company ? { '@type': 'Organization', name: site.company } : undefined,
    alumniOf: (c.education || []).filter((e) => e.place).map((e) => ({ '@type': 'EducationalOrganization', name: e.place })),
    homeLocation: site.location || site.city ? { '@type': 'Place', name: site.location || site.city } : undefined,
    knowsAbout: Array.isArray(tools) && tools.length ? tools : undefined,
    // No email or phone here: this block is read by scrapers too.
    sameAs: [contact.github, contact.linkedin].filter(Boolean),
  };
}

function notFoundPage({ c, url }) {
  const site = c.site || {};
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<meta name="theme-color" content="#0A0C0F" />
<title>404 · pod not found · ${esc(site.name)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<style>
  :root { color-scheme: dark; --bg: #0a0c0f; --panel: #11151b; --line: #1f2630; --text: #e7ecf2; --dim: #8b95a3; --accent: #6ef0b4; --err: #ff7a7a; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--text);
         font: 14px/1.7 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .term { width: min(620px, 100%); background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.45); }
  .bar { display: flex; gap: 7px; padding: 12px 14px; border-bottom: 1px solid var(--line); }
  .bar i { width: 11px; height: 11px; border-radius: 50%; background: #2a323d; }
  .body { padding: 18px 20px 22px; overflow-wrap: anywhere; }
  p { margin: 0; }
  .cmd { color: var(--text); } .dim { color: var(--dim); } .err { color: var(--err); } .ok { color: var(--accent); }
  a { color: var(--bg); background: var(--accent); text-decoration: none; padding: 9px 14px; border-radius: 9px; display: inline-block; margin-top: 18px; font-weight: 700; }
  a:focus-visible { outline: 2px solid var(--text); outline-offset: 3px; }
</style>
</head>
<body>
<main class="term">
  <div class="bar" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="body">
    <p class="cmd">$ kubectl get page <span id="path">this-page</span></p>
    <p class="err">Error from server (NotFound): pages "<span id="path2">this-page</span>" not found</p>
    <p class="dim">&nbsp;</p>
    <p class="dim"># The link is broken or the page moved. Everything lives on one page now.</p>
    <a href="/">$ cd ~ &nbsp;# back to ${esc(new URL(url).host)}</a>
  </div>
</main>
<script>
  var p = location.pathname.replace(/^\\/+/, '') || 'this-page';
  document.getElementById('path').textContent = p;
  document.getElementById('path2').textContent = p;
</script>
</body>
</html>
`;
}

export default function sitePlugin() {
  let root = process.cwd();
  let isBuild = false;
  return {
    name: 'site-html',
    configResolved(cfg) { root = cfg.root; isBuild = cfg.command === 'build'; },

    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const info = siteInfo(root);
        const { c, url, title, description, share, image, imageAlt, goatcounter } = info;
        const site = c.site || {};
        const contact = c.contact || {};
        const tags = [
          { tag: 'title', children: esc(title), injectTo: 'head-prepend' },
          meta({ name: 'description', content: description }),
          { tag: 'link', attrs: { rel: 'canonical', href: url }, injectTo: 'head' },
          meta({ property: 'og:type', content: 'website' }),
          meta({ property: 'og:site_name', content: site.name }),
          meta({ property: 'og:locale', content: 'en_IN' }),
          meta({ property: 'og:url', content: url }),
          meta({ property: 'og:title', content: title }),
          meta({ property: 'og:description', content: share }),
          meta({ property: 'og:image', content: image }),
          meta({ property: 'og:image:width', content: '1200' }),
          meta({ property: 'og:image:height', content: '630' }),
          meta({ property: 'og:image:alt', content: imageAlt }),
          meta({ name: 'twitter:card', content: 'summary_large_image' }),
          meta({ name: 'twitter:title', content: title }),
          meta({ name: 'twitter:description', content: share }),
          meta({ name: 'twitter:image', content: image }),
          {
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: JSON.stringify(person(info)).replace(/</g, '\\u003c'),
            injectTo: 'head',
          },
        ];

        // Visitors without JavaScript can read everything, but the contact details sit behind a game.
        const links = [
          contact.email && `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`,
          contact.linkedin && `<a href="${esc(contact.linkedin)}">LinkedIn</a>`,
          contact.github && `<a href="${esc(contact.github)}">GitHub</a>`,
        ].filter(Boolean).join(' · ');
        tags.push({
          tag: 'noscript',
          children: `<p class="noscript mono">JavaScript is off: everything is readable, but the games won't run.${links ? ` Contact: ${links}` : ''}</p>`,
          injectTo: 'body-prepend',
        });

        if (isBuild && ctx.bundle) {
          // Preload the two font files the first screen needs (latin, variable weight).
          for (const f of Object.keys(ctx.bundle)) {
            if (/(space-grotesk|jetbrains-mono)-latin-wght-normal-[\w-]+\.woff2$/.test(f)) {
              tags.push({ tag: 'link', attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' });
            }
          }
          // GoatCounter: cookie-free visitor stats, only on the built site, skipped for Do Not Track / Global Privacy Control.
          if (goatcounter) {
            tags.push({
              tag: 'script',
              children: `(function(){var n=navigator;if(n.doNotTrack==='1'||window.doNotTrack==='1'||n.globalPrivacyControl)return;var s=document.createElement('script');s.async=true;s.src='https://gc.zgo.at/count.js';s.setAttribute('data-goatcounter','https://${goatcounter}.goatcounter.com/count');document.head.appendChild(s);})();`,
              injectTo: 'body',
            });
          }
        }
        return { html, tags };
      },
    },

    generateBundle() {
      if (!isBuild) return;
      const info = siteInfo(root);
      const day = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', info.url).href}\n` });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${esc(info.url)}</loc><lastmod>${day}</lastmod></url>\n</urlset>\n`,
      });
      this.emitFile({ type: 'asset', fileName: '404.html', source: notFoundPage(info) });
    },
  };
}
