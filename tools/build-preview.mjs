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
  'owners.html', 'booking.html', 'management.html', 'development.html', 'about.html', 'contact.html',
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

  pages[file] = { cls, body: body.trim() };
}

if (!imgCache.size) throw new Error('no images inlined — run build-images first');

const MOBILE = process.argv.includes('--mobile');
const title = MOBILE ? 'DROIT — Mobile Preview' : 'DROIT — Desktop Preview';
const site = `<title>${title}</title>
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
${MOBILE ? '' : '<div id="pv-note"><span><b>Preview</b> &middot; not published</span><button type="button" aria-label="Hide preview badge">&times;</button></div>'}
<script>
document.documentElement.className += " js";
var IMAGES = ${JSON.stringify(Object.fromEntries(imgCache))};
var PAGES = ${JSON.stringify(pages)};
var HEADER = ${JSON.stringify(header)};
var root = document.getElementById('pv-root');

${app}

// The site links extensionlessly (/locations, /locations#WI, /). Map any
// internal href onto a bundled page.
function resolvePage(href) {
  var parts = href.replace(/^\\//, '').split('#');
  var path = parts[0];
  var page = path === '' ? 'index.html' : /\\.html$/.test(path) ? path : path + '.html';
  return { page: PAGES[page] ? page : '404.html', anchor: parts[1] || '' };
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
    // A state anchor (#WI) drives the real filter button, so the preview
    // exercises the same code path the live site does.
    var btn = host.querySelector('[data-state="' + anchor.toUpperCase() + '"]');
    if (btn) btn.click();
    var t = document.getElementById(anchor);
    if (t) { t.scrollIntoView({ behavior: 'smooth' }); return; }
    if (btn) { window.scrollTo(0, 0); return; }
  }
  window.scrollTo(0, 0);
}

// Every internal link is intercepted, including ones carrying an anchor such
// as /locations#WI. Anything left unhandled would try to fetch a file that
// does not exist inside a single-file bundle.
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  var href = a.getAttribute('href');
  if (!href || /^(https?:|tel:|mailto:|data:)/.test(href)) return;
  if (href.charAt(0) === '#') return; // in-page anchor: let the browser do it
  e.preventDefault();
  var t = resolvePage(href);
  render(t.page, t.anchor);
  // Keep the document URL untouched: this is one file, so changing the URL
  // would make Back leave the bundle entirely. History state alone drives it.
  try { history.pushState({ page: t.page, anchor: t.anchor }, ''); } catch (err) {}
});

window.addEventListener('popstate', function (e) {
  var st = e.state || { page: 'index.html', anchor: '' };
  render(PAGES[st.page] ? st.page : 'index.html', st.anchor || '');
});

var note = document.getElementById('pv-note');
if (note) note.querySelector('button').addEventListener('click', function () { note.remove(); });

try { history.replaceState({ page: 'index.html', anchor: '' }, ''); } catch (err) {}
render('index.html', '');
</script>
`;

// Desktop: ship the site as-is and let the artifact viewport be the viewport.
// Mobile: the same site inside a real 390px iframe, because CSS breakpoints
// answer to the viewport, not to a narrow container.
let out;
let file;
if (MOBILE) {
  file = 'preview-mobile.html';
  // Split head content (title/style) from body content so the framed document
  // is well-formed rather than relying on the parser to relocate divs.
  const headEnd = site.indexOf('</style>') + '</style>'.length;
  const doc =
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    site.slice(0, headEnd) +
    `</head><body>` + site.slice(headEnd) + `</body></html>`;
  out = `<title>${title}</title>
<style>
  :root{color-scheme:light}
  body{margin:0;min-height:100svh;display:flex;flex-direction:column;align-items:center;gap:1.1rem;
    padding:1.6rem 1rem 2rem;background:radial-gradient(70rem 40rem at 50% -10%,#1b3050,#0b1626 70%);
    font:400 14px/1.5 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#cfd8e6}
  .bar{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;justify-content:center}
  .seg{display:flex;gap:.2rem;padding:.22rem;border-radius:999px;background:rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.14)}
  .seg button{appearance:none;border:0;background:none;color:rgba(255,255,255,.7);cursor:pointer;
    padding:.4rem .9rem;border-radius:999px;font:600 .78rem/1 inherit;letter-spacing:.04em}
  .seg button[aria-pressed="true"]{background:#e1751f;color:#fff}
  .seg button:hover:not([aria-pressed="true"]){color:#fff}
  .tag{font:700 .68rem/1 inherit;letter-spacing:.14em;text-transform:uppercase;color:#f5b476}
  .phone{position:relative;border-radius:44px;padding:12px;background:linear-gradient(160deg,#2b3648,#141b28);
    box-shadow:0 2px 0 rgba(255,255,255,.12) inset,0 40px 90px rgba(0,0,0,.5);flex:none;
    transition:width .3s cubic-bezier(.22,1,.36,1),height .3s cubic-bezier(.22,1,.36,1)}
  .phone.tablet{border-radius:28px;padding:14px}
  iframe{display:block;width:100%;height:100%;border:0;border-radius:33px;background:#fbfaf8}
  .phone.tablet iframe{border-radius:16px}
  .hint{font-size:.78rem;color:rgba(255,255,255,.45);text-align:center;max-width:34rem}
  @media (max-width:520px){body{padding:.8rem .4rem}.phone{transform-origin:top center}}
</style>
<div class="bar">
  <span class="tag">Preview &middot; not published</span>
  <div class="seg" role="group" aria-label="Device size">
    <button type="button" data-w="390" data-h="844" aria-pressed="true">Phone</button>
    <button type="button" data-w="768" data-h="1024" aria-pressed="false">Tablet</button>
  </div>
</div>
<div class="phone" id="frame"><iframe id="site" title="DROIT site preview"></iframe></div>
<p class="hint">The site renders in a real viewport at this width, so the mobile breakpoints, sticky header, and drawer menu behave exactly as they will on a phone. Scroll and tap inside the frame.</p>
<script>
var DOC = ${JSON.stringify(doc).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\u0021--')};
var frame = document.getElementById('frame');
var site = document.getElementById('site');
function size(w, h) {
  var scale = Math.min(1, (window.innerWidth - 40) / (w + 24), (window.innerHeight - 150) / (h + 24));
  frame.style.width = w + 24 + 'px';
  frame.style.height = h + 24 + 'px';
  frame.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
  frame.classList.toggle('tablet', w > 500);
}
var cur = { w: 390, h: 844 };
document.querySelectorAll('.seg button').forEach(function (b) {
  b.addEventListener('click', function () {
    document.querySelectorAll('.seg button').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
    cur = { w: +b.dataset.w, h: +b.dataset.h };
    size(cur.w, cur.h);
  });
});
window.addEventListener('resize', function () { size(cur.w, cur.h); });
size(cur.w, cur.h);
site.srcdoc = DOC;
</script>
`;
} else {
  file = 'preview-desktop.html';
  out = site;
}

await writeFile(r(file), out);
const kb = Buffer.byteLength(out) / 1024;
console.log(`${file} — ${Object.keys(pages).length} pages, ${imgCache.size} images, ${(kb / 1024).toFixed(2)} MB`);
