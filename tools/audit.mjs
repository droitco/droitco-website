// Whole-site crawl: reachability, orphans, sitemap agreement, URL hygiene.
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (['.git','node_modules','src','tools','img','fonts'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.name.endsWith('.html') && !/^preview-/.test(e.name)) out.push(p.slice(ROOT.length + 1));
  }
  return out;
}
const all = await walk(ROOT);
const norm = (h, from) => {
  let x = h.split('?')[0].split('#')[0];
  if (x === '' || x === '/') return 'index.html';
  x = x.replace(/^\//, '');
  if (!x.endsWith('.html')) x += '.html';
  if (!x.includes('/') && from.includes('/')) { /* root-absolute already */ }
  return x;
};

// crawl from the homepage
const seen = new Set(['index.html']);
const queue = ['index.html'];
const broken = [];
const outbound = new Map();
while (queue.length) {
  const page = queue.shift();
  let html;
  try { html = await readFile(join(ROOT, page), 'utf8'); } catch { continue; }
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1])
    .filter(h => !/^(https?:|tel:|mailto:|data:|#)/.test(h))
    .filter(h => !/\.(css|js|svg|xml|txt|jpg|webp|avif|woff2)$/.test(h));
  outbound.set(page, new Set(links.map(l => norm(l, page))));
  for (const l of links) {
    const t = norm(l, page);
    if (!all.includes(t)) { broken.push(`${page} -> ${l}`); continue; }
    if (!seen.has(t)) { seen.add(t); queue.push(t); }
  }
}

// Deliberately unlinked: the error page, the form destination, the noindex
// outreach sample, and the redirect shims that keep old URLs alive.
const EXPECTED_ORPHANS = new Set([
  '404.html', 'thanks.html', 'preview/mitchell-road.html',
  'builds.html', 'privacy/index.html', 'terms/index.html',
]);
const orphans = all.filter(f => !seen.has(f) && !EXPECTED_ORPHANS.has(f));
const sitemap = await readFile(join(ROOT, 'sitemap.xml'), 'utf8');
const inSitemap = new Set([...sitemap.matchAll(/<loc>https:\/\/droitco\.com\/([^<]*)<\/loc>/g)]
  .map(m => (m[1] === '' ? 'index.html' : m[1] + '.html')));

const noindex = new Set();
const canon = new Map();
const htmlLeak = [];
for (const f of all) {
  const h = await readFile(join(ROOT, f), 'utf8');
  if (/name="robots" content="noindex/.test(h)) noindex.add(f);
  const c = h.match(/rel="canonical" href="([^"]+)"/);
  if (c) canon.set(f, c[1]);
  // any .html left in a link or in visible text
  for (const m of h.matchAll(/(?:href|action)="([^"]*\.html[^"]*)"/g)) htmlLeak.push(`${f}: ${m[1]}`);
  const vis = h.replace(/<(script|style)[\s\S]*?<\/\1>/g,' ').replace(/<[^>]+>/g,' ');
  for (const m of vis.matchAll(/\S+\.html\b/g)) htmlLeak.push(`${f}: visible text "${m[0]}"`);
}
const indexable = all.filter(f => !noindex.has(f) && !/http-equiv="refresh"/.test(''));
const missingFromSitemap = all.filter(f => !noindex.has(f) && !inSitemap.has(f));
const shimInSitemap = [...inSitemap].filter(f => /^(builds|privacy\/index|terms\/index)\.html$/.test(f));
const dupCanon = [...canon.entries()].reduce((acc,[f,c]) => { (acc[c] ||= []).push(f); return acc; }, {});

const r = (label, list) => console.log(`${label.padEnd(34)} ${list.length ? '✗ ' + list.join('\n' + ' '.repeat(36)) : '✓ none'}`);
console.log(`Pages on disk: ${all.length}   reachable from home: ${seen.size}\n`);
r('Broken internal links', broken);
r('Orphans (unreachable from home)', orphans);
r('Indexable but missing from sitemap', missingFromSitemap);
r('.html leaking into links/text', [...new Set(htmlLeak)]);
// A redirect shim sharing its target's canonical is the point of a shim.
const shims = new Set(['builds.html', 'privacy/index.html', 'terms/index.html']);
r('Duplicate canonicals', Object.entries(dupCanon)
  .map(([c, v]) => [c, v.filter(f => !shims.has(f))])
  .filter(([, v]) => v.length > 1)
  .map(([c, v]) => `${c} <- ${v.join(', ')}`));
const noCanon = all.filter(f => !canon.has(f));
r('Pages without canonical', noCanon);
r('Redirect shims in the sitemap', shimInSitemap);
