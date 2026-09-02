// Bundles the whole built site into ONE self-contained HTML file so it can be
// published as a private Artifact and clicked through before anything ships.
// Images and fonts are inlined as data URIs; navigation is hash-routed.
// Run: node tools/build-preview.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => join(ROOT, p);

const PAGES = [
  'index.html', 'locations.html',
  'eau-claire-clear-space.html', 'eau-claire-southview.html', 'river-falls.html', 'mosinee.html',
  'mankato.html', 'des-moines.html', 'dayton.html', 'memphis.html', 'odessa.html', 'medical-lake.html',
  'booking.html', 'management.html', 'builds.html', 'contact.html',
  'booking-sheet.html', 'management-sheet.html',
  'privacy.html', 'terms.html', 'thanks.html', '404.html',
];

const dataUri = async (p, mime) => `data:${mime};base64,${(await readFile(r(p))).toString('base64')}`;

// One inlined bitmap per photo, at the largest width the preview needs.
const imgCache = new Map();
async function inlineImage(name) {
  if (imgCache.has(name)) return imgCache.get(name);
  for (const w of [1200, 800, 400]) {
    try {
      const uri = await dataUri(`img/${name}-${w}.webp`, 'image/webp');
      imgCache.set(name, uri);
      return uri;
    } catch {}
  }
  imgCache.set(name, '');
  return '';
}

// <picture> with three <source> sets collapses to one <img src="data:...">
async function collapsePictures(html) {
  const out = [];
  let last = 0;
  const re = /<picture>[\s\S]*?<\/picture>/g;
  let m;
  while ((m = re.exec(html))) {
    out.push(html.slice(last, m.index));
    const block = m[0];
    const imgTag = block.match(/<img\b[^>]*>/)?.[0] || '';
    const nameMatch = block.match(/img\/([a-z0-9-]+)-\d+\.(?:avif|webp|jpg)/i);
    const key = nameMatch ? nameMatch[1] : '';
    if (key) await inlineImage(key);
    // Each photo is stored once in IMAGES and resolved at render time, so a
    // store shown on three pages costs one copy, not three.
    out.push(
      imgTag
        .replace(/\ssrcset="[^"]*"/g, '')
        .replace(/\ssizes="[^"]*"/g, '')
        .replace(/\ssrc="[^"]*"/, ` data-img="${key}"`)
        .replace(/\sloading="lazy"/, '')
    );
    last = m.index + block.length;
  }
  out.push(html.slice(last));
  return out.join('');
}

let css = await readFile(r('src/styles.css'), 'utf8');
const interUri = await dataUri('fonts/inter-latin.woff2', 'font/woff2');
const frauncesUri = await dataUri('fonts/fraunces-latin.woff2', 'font/woff2');
css = css
  .replace('url("fonts/fraunces-latin.woff2")', `url(${frauncesUri})`)
  .replace('url("fonts/inter-latin.woff2")', `url(${interUri})`)
  .replace(/^@charset[^;]+;\s*/m, '');

// app.js is an IIFE; wrapping it lets the router re-run it after each swap.
const app = `function initDroit() {\n${await readFile(r('src/app.js'), 'utf8')}\n}`;

let header = null;
const pages = {};
for (const file of PAGES) {
  let html = await readFile(r(file), 'utf8');
  html = await collapsePictures(html);

  const bodyOpen = html.match(/<body([^>]*)>/);
  const cls = (bodyOpen?.[1].match(/class="([^"]*)"/) || [, ''])[1];
  let body = html.slice(html.indexOf(bodyOpen[0]) + bodyOpen[0].length, html.lastIndexOf('</body>'));

  // Header is rendered once and persists across navigation.
  const hEnd = body.indexOf('</header>');
  if (header === null) header = body.slice(body.indexOf('<header'), hEnd + 9);
  body = body.slice(hEnd + 9);
  body = body.replace(/<script[\s\S]*?<\/script>/g, '');

  // Route internal page links through the hash router; keep in-page anchors.
  body = body.replace(/href="((?!https?:|tel:|mailto:|#)[a-z0-9/-]+\.html)"/g, 'href="#$1"');
  pages[file] = { cls, body: body.trim() };
}
header = header.replace(/href="((?!https?:|tel:|mailto:|#)[a-z0-9/-]+\.html)"/g, 'href="#$1"');

const title = 'DROIT — Site Preview';
if (!imgCache.size) throw new Error('no images inlined — run build-images first');
const out = `<title>${title}</title>
<style>
${css}
/* --- preview chrome (not part of the site) --- */
#pv-note{position:fixed;left:1rem;bottom:1rem;z-index:300;display:flex;align-items:center;gap:.6rem;
  padding:.5rem .75rem .5rem .9rem;border-radius:999px;background:rgba(11,22,38,.92);color:#fff;
  font:600 .74rem/1 var(--sans);letter-spacing:.06em;text-transform:uppercase;
  box-shadow:0 8px 28px rgba(11,22,38,.3);backdrop-filter:blur(10px)}
#pv-note b{color:#f5b476;font-weight:700}
#pv-note button{background:none;border:0;color:rgba(255,255,255,.6);cursor:pointer;font-size:1rem;line-height:1;padding:0 .1rem}
#pv-note button:hover{color:#fff}
@media print{#pv-note{display:none}}
</style>
<div id="pv-root"></div>
<div id="pv-note"><span><b>Preview</b> &middot; not published</span><button type="button" aria-label="Hide preview badge">&times;</button></div>
<script>
document.documentElement.className += " js";
var IMAGES = ${JSON.stringify(Object.fromEntries(imgCache))};
var PAGES = ${JSON.stringify(pages)};
var HEADER = ${JSON.stringify(header)};
var root = document.getElementById('pv-root');

${app}

function pageFromHash() {
  var h = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (!h) return { page: 'index.html', anchor: '' };
  if (/\\.html$/.test(h)) return { page: PAGES[h] ? h : '404.html', anchor: '' };
  return { page: current, anchor: h };
}

var current = 'index.html';
var headerEl = null;

function render(name, anchor) {
  var p = PAGES[name] || PAGES['404.html'];
  current = name;
  document.body.className = p.cls || '';
  if (!headerEl) {
    root.innerHTML = HEADER + '<div id="pv-page"></div>';
    headerEl = root.querySelector('.site-header');
  }
  var host = document.getElementById('pv-page');
  host.innerHTML = p.body;
  host.querySelectorAll('img[data-img]').forEach(function (img) {
    img.src = IMAGES[img.getAttribute('data-img')] || '';
  });
  // Mark the active nav item for the page we just rendered.
  headerEl.querySelectorAll('.site-nav a').forEach(function (a) {
    var href = a.getAttribute('href').replace(/^#/, '');
    if (href === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  initDroit();
  if (anchor) {
    var t = document.getElementById(anchor);
    if (t) { t.scrollIntoView({ behavior: 'smooth' }); return; }
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', function () {
  var s = pageFromHash();
  if (s.anchor) {
    var t = document.getElementById(s.anchor);
    if (t) { t.scrollIntoView({ behavior: 'smooth' }); return; }
  }
  render(s.page, s.anchor);
});

document.getElementById('pv-note').querySelector('button')
  .addEventListener('click', function () { document.getElementById('pv-note').remove(); });

render(pageFromHash().page, '');
</script>
`;

await writeFile(r('preview-bundle.html'), out);
const kb = Buffer.byteLength(out) / 1024;
console.log(`preview-bundle.html — ${Object.keys(pages).length} pages, ${imgCache.size} images, ${(kb / 1024).toFixed(2)} MB`);
