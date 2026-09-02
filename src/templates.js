import { site, nav, states, mapsUrl } from './data.js';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICON = {
  phone:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
};


/* ---------- Images ---------- */
// widths: which derivative widths to offer; `sizes` must match the CSS box.
export function picture(images, name, { alt, sizes, widths, className = '', priority = false, ratio = 16 / 10, up = '' }) {
  const meta = images[name];
  if (!meta) throw new Error(`No image built for "${name}" — add src/photos/${name}.jpg and rerun build-images.`);
  const avail = widths.filter((w) => meta.widths.includes(w));
  const use = avail.length ? avail : [meta.widths[meta.widths.length - 1]];
  const set = (ext) => use.map((w) => `${up}img/${name}-${w}.${ext} ${w}w`).join(', ');
  const fallback = use[Math.min(1, use.length - 1)];
  const h = Math.round(use[use.length - 1] / ratio);
  return `<picture>
        <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
        <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
        <img src="${up}img/${name}-${fallback}.jpg" srcset="${set('jpg')}" sizes="${sizes}"
             width="${use[use.length - 1]}" height="${h}" alt="${esc(alt)}"${className ? ` class="${className}"` : ''}
             ${priority ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}>
      </picture>`;
}

export const lqip = (images, name) => (images[name] ? `background-image:url(${images[name].lqip})` : '');

/* ---------- Chrome ---------- */
const header = (current, up = '') => `<header class="site-header">
      <div class="wrap">
        <a class="brand" href="${up}index.html">${site.brand}</a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menu"><span></span></button>
        <nav class="site-nav" id="site-nav" aria-label="Primary">
          <a href="${up}index.html"${current === 'index' ? ' aria-current="page"' : ''}>Home</a>
${nav
  .map(
    (n) =>
      `          <a href="${up}${n.href}"${current === n.href.replace('.html', '') ? ' aria-current="page"' : ''}>${n.label}</a>`
  )
  .join('\n')}
        </nav>
        <a class="header-cta" href="tel:${site.phone.tel}">${ICON.phone}<span>${site.phone.display}</span></a>
      </div>
    </header>`;

// Two stores share Eau Claire, and two share the name "Smart Self Storage",
// so label by whichever of the pair is actually distinguishing.
const footerLabel = (s, all) => {
  const sameCity = all.filter((o) => o.city === s.city && o.state === s.state).length > 1;
  return sameCity ? esc(s.name) : `${esc(s.city)}, ${s.state}`;
};

const footer = (stores, up = '') => `<footer class="site-footer">
      <div class="wrap">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="brand" href="${up}index.html">${site.brand}</a>
            <p><a class="footer-phone" href="tel:${site.phone.tel}">${site.phone.display}</a></p>
            <p>Self storage with 24/7 access, and the crew that builds and runs it.</p>
          </div>
          <div>
            <h2>Rent</h2>
            <ul>
              <li><a href="${up}locations.html">All locations</a></li>
${stores
  .slice(0, 5)
  .map((s) => `              <li><a href="${up}${s.slug}.html">${footerLabel(s, stores)}</a></li>`)
  .join('\n')}
            </ul>
          </div>
          <div>
            <h2>More stores</h2>
            <ul>
${stores
  .slice(5)
  .map((s) => `              <li><a href="${up}${s.slug}.html">${footerLabel(s, stores)}</a></li>`)
  .join('\n')}
            </ul>
          </div>
          <div>
            <h2>Owners</h2>
            <ul>
              <li><a href="${up}booking.html">Booking</a></li>
              <li><a href="${up}management.html">Management</a></li>
              <li><a href="${up}builds.html">Builds</a></li>
              <li><a href="${up}contact.html">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} ${site.brand}. Smart Self Storage.</p>
          <p><a href="${up}privacy.html">Privacy</a> &middot; <a href="${up}terms.html">Terms</a> &middot; <a href="${up}contact.html">Contact</a></p>
        </div>
      </div>
    </footer>`;

/* ---------- Page shell ---------- */
export function layout({
  slug,
  title,
  description,
  bodyClass = '',
  hero = '',
  main = '',
  jsonld = null,
  ogImage = 'img/eau-claire-clear-space-aerial-1200.jpg',
  robots = 'index, follow',
  depth = 0,
  stores = [],
}) {
  const up = '../'.repeat(depth);
  const url = `${site.origin}/${slug === 'index' ? '' : slug + '.html'}`;
  const cls = [bodyClass, hero.includes('class="hero') ? '' : 'no-hero'].filter(Boolean).join(' ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="${robots}">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#0b1626">
  <script>document.documentElement.className+=" js";</script>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.brand}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site.origin}/${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${site.origin}/${ogImage}">
  <link rel="preload" href="${up}fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${up}fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${up}styles.css">
${jsonld ? `  <script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2)}\n  </script>` : ''}
</head>
<body${cls ? ` class="${cls}"` : ''}>
    <a class="skip" href="#main">Skip to content</a>
    ${header(slug, up)}
${hero}
    <main id="main">
${main}
    </main>
    ${footer(stores, up)}
    <script src="${up}app.js" defer></script>
</body>
</html>
`;
}

/* ---------- Fragments ---------- */
export const storeCard = (images, s, i) => `<li class="store-card" data-store data-state="${s.state}"
              data-search="${esc(
                [s.name, s.city, s.state, states[s.state], s.street, s.zip].filter(Boolean).join(' ').toLowerCase()
              )}" data-reveal style="--i:${i % 3}">
            <figure class="store-figure" style="${lqip(images, s.photo)}">
              ${picture(images, s.photo, {
                alt: s.alt,
                sizes: '(min-width:1200px) 380px, (min-width:760px) 33vw, 100vw',
                widths: [400, 800, 1200],
              })}
              <span class="badge-open">Open 24/7</span>
            </figure>
            <div class="store-body">
              <p class="store-city">${esc(s.city)}, ${s.state}</p>
              <h3><a href="${s.slug}.html">${esc(s.name)}</a></h3>
              <p class="store-meta">${esc(s.street)}${s.zip ? `, ${s.zip}` : ''}<br>${s.phone.display}</p>
              <div class="store-actions">
                <a class="btn btn-accent btn-sm" href="${s.rentUrl}" rel="noopener">Rent online</a>
                <a class="btn btn-ghost btn-sm" href="${s.slug}.html">Details</a>
              </div>
            </div>
          </li>`;

export const finder = (openStates) => `<div class="finder" data-finder data-reveal>
          <div class="finder-head">
            <h2>Find your store</h2>
            <p class="micro" data-finder-count></p>
          </div>
          <div class="finder-search">
            ${ICON.search}
            <label class="visually-hidden" for="store-search">Search stores by city, state, or name</label>
            <input id="store-search" type="search" autocomplete="off" placeholder="City, state, or store name">
            <button class="finder-clear" type="button" data-finder-clear aria-label="Clear search">&times;</button>
          </div>
          <ul class="filters">
            <li><button class="filter" type="button" data-state="all" aria-pressed="true">All states</button></li>
${openStates
  .map(
    (st) =>
      `            <li><button class="filter" type="button" data-state="${st}" aria-pressed="false">${states[st]}</button></li>`
  )
  .join('\n')}
          </ul>
        </div>`.replace('type="search"', 'type="search" data-finder-input');

export const bar = (row, accent = false) => {
  const max = row.max || 100;
  const pct = Math.round((row.value / max) * 100);
  return `<div class="bar">
              <span class="bar-label">${esc(row.label)}</span>
              <span class="bar-track"><span class="bar-fill${accent ? ' accent' : ''}" style="--w:${pct}%"></span></span>
              <span class="bar-val">${esc(row.display || row.value + '%')}</span>
            </div>`;
};

export const directions = (s) => mapsUrl(s);
export { ICON };
