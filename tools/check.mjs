// Pre-flight checks for droitco.com. Run: node tools/check.mjs
// Fails the build on broken links, missing images, invalid JSON-LD, or a
// brand-rule violation. These are the mistakes that are expensive in public.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, dirname, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'src', 'tools', 'img'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    // preview-*.html at the root are local review bundles, not pages of the
    // site (the preview/ directory is a real page and stays checked).
    else if (e.name.endsWith('.html') && !/^preview-.*\.html$/.test(e.name)) out.push(p);
  }
  return out;
}

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

// The site links extensionlessly; GitHub Pages resolves /locations to
// locations.html and /privacy/ to privacy/index.html.
const resolves = async (p) =>
  (await exists(p)) || (await exists(p + '.html')) || (await exists(join(p, 'index.html')));

// Rules that must never regress. Each is a real incident from the brief.
const FORBIDDEN = [
  { re: /odessasmartstorage/i, why: 'Odessa competitor domain (different company)' },
  { re: /faudree/i, why: 'Faudree Rd is a different company' },
  { re: /432[-.\s)]?201[-.\s]?5667/, why: 'wrong Odessa phone — competitor also displays it' },
  { re: /Droitco\s*LLC|Droit\s+LLC|Droitco/i, why: 'public brand is DROIT only' },
  { re: /\bLLC\b/, why: 'no LLC in public-facing copy' },
  { re: /\b15%\s*over\s*net|\b20\s*[-–]\s*25%/i, why: 'no Droit fee percentages in public copy' },
  { re: /SpareFoot|Neighbor\b/i, why: 'no SpareFoot/Neighbor comps' },
  { re: /FILE_CONTENT_FROM_LOCAL_SVG|PLACEHOLDER_WILL_BE/, why: 'unreplaced build placeholder' },
];

// Every open store must be presented as 24/7; none may carry limited hours.
const LIMITED_HOURS = /gate\s+(?:hours|closes)|closed\s+(?:at|after)\s*\d|office\s+hours:\s*\d/i;

const files = await walk(ROOT);
if (!files.length) fail('repo', 'no HTML files found');

for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  const html = await readFile(file, 'utf8');
  const base = dirname(file);
  const isRedirect = /http-equiv="refresh"/.test(html);

  // Brand rules apply to what a visitor reads, not to the droitco.com domain
  // that legitimately appears in canonicals, OG tags, and JSON-LD.
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  for (const rule of FORBIDDEN) {
    const m = visible.match(rule.re);
    if (m) fail(rel, `forbidden "${m[0]}" in visible copy — ${rule.why}`);
    const bad = [...html.matchAll(/(?:href|src|content)="([^"]*)"/g)]
      .map((x) => x[1])
      .filter((v) => !/^https?:\/\/(www\.)?droitco\.com/.test(v) && rule.re.test(v));
    if (bad.length) fail(rel, `forbidden "${bad[0]}" in a URL/meta — ${rule.why}`);
  }
  if (LIMITED_HOURS.test(visible)) fail(rel, 'looks like limited gate hours on an open store');

  // Local hrefs and srcs resolve to a real file
  const refs = [...html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|tel:|mailto:|data:|#|\/\/)/.test(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    const target = clean.startsWith('/') ? join(ROOT, clean) : normalize(join(base, clean));
    if (!(await resolves(target))) fail(rel, `broken local reference -> ${ref}`);
  }

  // srcset entries resolve too
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (!url || /^(https?:|data:)/.test(url)) continue;
      if (!(await exists(normalize(join(base, url))))) fail(rel, `broken srcset -> ${url}`);
    }
  }

  // JSON-LD must parse
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      fail(rel, `invalid JSON-LD: ${e.message}`);
    }
  }

  // Basic page hygiene (redirect shims carry none of this by design)
  if (isRedirect) continue;
  if (!/<title>[^<]{5,}<\/title>/.test(html)) fail(rel, 'missing or too-short <title>');
  if (!/<meta name="description" content="[^"]{40,}"/.test(html)) fail(rel, 'missing or thin meta description');
  if (!/rel="canonical"/.test(html)) fail(rel, 'missing canonical');
  if (!/<html lang="en">/.test(html)) fail(rel, 'missing lang attribute');
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)];
  for (const [tag] of imgs) {
    if (!/\salt="/.test(tag)) fail(rel, `<img> without alt: ${tag.slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag))
      fail(rel, `<img> without width/height (layout shift): ${tag.slice(0, 80)}`);
  }
  // Exactly one h1 per page
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(rel, `expected exactly one <h1>, found ${h1s}`);
  // Brand must be present as DROIT in the header, not injected later
  if (!/class="brand"[^>]*>.*?DROIT/s.test(html)) fail(rel, 'header brand is not DROIT in the served HTML');
}

// A2P/10DLC campaign CTD3F6D (RingCentral) was filed against droitco.com/privacy.html
// and droitco.com/terms.html, with the homepage itself as the opt-in page. If the
// consent checkbox or either link disappears from the front page, the campaign's
// filed evidence stops matching the live site. Fail the build rather than ship that.
{
  const home = await readFile(join(ROOT, 'index.html'), 'utf8');
  const bottom = home.slice(home.indexOf('<main'));
  if (!/id="sms-opt-in"/.test(home)) fail('index.html', 'A2P: #sms-opt-in anchor is missing from the homepage');
  if (!/name="sms_opt_in"[^>]*type="checkbox"|type="checkbox"[^>]*name="sms_opt_in"/.test(home))
    fail('index.html', 'A2P: the SMS consent checkbox is missing from the homepage');
  for (const phrase of ['Reply STOP', 'Message and data rates may apply', 'Consent is not a condition'])
    if (!home.includes(phrase)) fail('index.html', `A2P: consent language missing the phrase "${phrase}"`);
  for (const page of ['privacy', 'terms']) {
    // The filing cites the .html URLs; the site now links the clean ones.
    // Both must resolve, and the front page must link to the page either way.
    if (!new RegExp(`href="/?${page}(\\.html)?"`).test(bottom))
      fail('index.html', `A2P: homepage must link to the ${page} page`);
    if (!(await exists(join(ROOT, `${page}.html`))))
      fail(`${page}.html`, 'A2P: cited in the RingCentral filing and must stay live at that exact URL');
  }
}

// Canonical host + sitemap agreement
const sitemap = await readFile(join(ROOT, 'sitemap.xml'), 'utf8');
for (const m of sitemap.matchAll(/<loc>https:\/\/droitco\.com\/([^<]*)<\/loc>/g)) {
  const p = m[1] === '' ? 'index.html' : m[1];
  if (!(await resolves(join(ROOT, p)))) fail('sitemap.xml', `lists a page that does not exist -> ${m[1]}`);
  if (/\.html$/.test(m[1])) fail('sitemap.xml', `should list the clean URL, not ${m[1]}`);
}
if (!(await exists(join(ROOT, 'CNAME')))) fail('CNAME', 'missing — custom domain would break');
if (!(await exists(join(ROOT, '.nojekyll')))) fail('.nojekyll', 'missing — Pages may skip files');

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n`);
  console.error(problems.map((p) => '  ✗ ' + p).join('\n'));
  process.exit(1);
}
console.log(`✓ ${files.length} pages checked — links, images, JSON-LD, and brand rules all clean.`);
