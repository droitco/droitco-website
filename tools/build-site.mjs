// Builds every page of droitco.com from src/data.js. Run: node tools/build-site.mjs
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => join(ROOT, 'src', p);
const out = (p) => join(ROOT, p);

const {
  site, nav, states, stores, builds, industry, managementModules, smsConsent, openStates, mapsUrl,
} = await import('../src/data.js');
const T = await import('../src/templates.js');
const { layout, picture, storeCard, finder, bar, esc, lqip, ICON } = T;

const images = JSON.parse(await readFile(src('images.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const written = [];

async function emit(name, html) {
  await mkdir(dirname(out(name)), { recursive: true });
  await writeFile(out(name), html);
  written.push(name);
}

const org = {
  '@type': 'Organization',
  '@id': `${site.origin}/#organization`,
  name: site.brand,
  alternateName: ['Smart Self Storage'],
  url: `${site.origin}/`,
  telephone: `+1-888-711-6050`,
  logo: `${site.origin}/favicon.svg`,
  foundingDate: site.founded,
  description: 'Self storage with 24/7 access at ten open stores, plus development, construction, and operations.',
};

const storeLd = (s) => ({
  '@type': ['LocalBusiness', 'SelfStorage'],
  '@id': `${site.origin}/${s.slug}.html#store`,
  name: s.name,
  parentOrganization: { '@id': `${site.origin}/#organization` },
  url: `${site.origin}/${s.slug}.html`,
  telephone: `+1-${s.phone.display.replace(/[^0-9]/g, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')}`,
  image: `${site.origin}/img/${s.photo}-1200.jpg`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: s.street,
    addressLocality: s.city,
    addressRegion: s.state,
    ...(s.zip ? { postalCode: s.zip } : {}),
    addressCountry: 'US',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
});

const smsSection = (id = 'sms-opt-in') => `      <section class="section" id="${id}">
        <div class="wrap">
          <div class="split">
            <div data-reveal>
              <p class="eyebrow">Optional</p>
              <h2 class="h-md">Account texts, if you want them.</h2>
              <p class="lede">Rental and account updates by text. Not required to rent, and you can stop any time.</p>
            </div>
            <form class="form" action="thanks.html" method="get" data-reveal>
              <label class="field"><span>Name</span>
                <input type="text" name="name" autocomplete="name" required>
              </label>
              <label class="field"><span>Mobile number</span>
                <input type="tel" name="mobile" autocomplete="tel" required>
              </label>
              <label class="field"><span>Email <span class="optional">(optional)</span></span>
                <input type="email" name="email" autocomplete="email">
              </label>
              <label class="consent">
                <input type="checkbox" name="sms_opt_in" value="yes" required>
                <span>${smsConsent} <a href="privacy.html">Privacy Policy</a> and <a href="terms.html">Terms</a>.</span>
              </label>
              <button class="btn" type="submit">Request texts</button>
            </form>
          </div>
        </div>
      </section>`;

/* ============================ HOME ============================ */
{
  const hero = `    <section class="hero">
      <div class="hero-media">
        ${picture(images, 'eau-claire-clear-space-aerial', {
          alt: 'Aerial view of a Droit self-storage facility at dusk',
          sizes: '100vw',
          widths: [800, 1200, 1600, 1920],
          priority: true,
          ratio: 16 / 9,
        })}
      </div>
      <div class="wrap">
        <p class="eyebrow" data-reveal>Self storage</p>
        <h1 data-reveal style="--i:1">Storage that never closes.</h1>
        <p data-reveal style="--i:2">Ten stores across seven states. Drive-up units and outdoor parking, rented online. The gate does not close at night.</p>
        <div class="btn-row" data-reveal style="--i:3">
          <a class="btn btn-accent" href="#find">Find a location ${ICON.arrow}</a>
          <a class="btn btn-outline-light" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
        </div>
        <ul class="chips" data-reveal style="--i:4">
          <li class="chip"><span class="chip-dot"></span><b>10</b> stores open</li>
          <li class="chip"><b>7</b> states</li>
          <li class="chip"><b>24/7</b> gate access</li>
        </ul>
      </div>
    </section>`;

  const main = `      <section class="section" id="find">
        <div class="wrap">
          ${finder(openStates)}
          <ul class="store-grid" data-store-grid style="margin-top:var(--sp-4)">
${stores.map((s, i) => '            ' + storeCard(images, s, i)).join('\n')}
          </ul>
          <div class="finder-empty" data-finder-empty>
            <p><strong>No store matches that search.</strong></p>
            <p class="micro">Try a city or state name, or call ${site.phone.display} and we will point you at the closest store.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>How it works</p>
          <h2 class="h-md" data-reveal>Three steps, no counter visit.</h2>
          <ol class="steps">
            <li class="step" data-reveal style="--i:0">
              <h3>Pick a store</h3>
              <p>Choose the location closest to you and see what is available — drive-up units, and outdoor parking at some stores.</p>
            </li>
            <li class="step" data-reveal style="--i:1">
              <h3>Rent online</h3>
              <p>Finish the rental on that store's own site. No appointment, no waiting on an office to open.</p>
            </li>
            <li class="step" data-reveal style="--i:2">
              <h3>Move in, any hour</h3>
              <p>Access at every open store is 24 hours a day, seven days a week. The gate does not close at night.</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="band">
        <div class="wrap">
          <p class="eyebrow" data-reveal>Owners and investors</p>
          <h2 class="h-md" data-reveal>We fill units, run stores, and build new ones.</h2>
          <p class="lede" data-reveal>Three ways we work with owners. Terms are by written agreement, and you stay the landlord on every one of them.</p>
          <div class="offer-grid">
            <article class="offer" data-reveal style="--i:0">
              <h3><a href="booking.html">Booking</a></h3>
              <p>We fill your vacant units as your agent, on the same channels we run at our own stores. You keep the lease.</p>
              <span class="offer-more">Fill vacancies ${ICON.arrow}</span>
            </article>
            <article class="offer" data-reveal style="--i:1">
              <h3><a href="management.html">Management</a></h3>
              <p>Inbound, collections, access, liens, and the store website. We answer as the manager. You approve the spend.</p>
              <span class="offer-more">Run my store ${ICON.arrow}</span>
            </article>
            <article class="offer" data-reveal style="--i:2">
              <h3><a href="builds.html">Builds</a></h3>
              <p>Site through opening, then we stay and operate it. Every project is planned as a store that rents, not a drawing.</p>
              <span class="offer-more">Develop a site ${ICON.arrow}</span>
            </article>
          </div>
        </div>
      </section>

${smsSection()}`;

  await emit(
    'index.html',
    layout({
      slug: 'index',
      title: 'Droit | Self Storage, Open 24/7',
      description:
        'Self storage with 24/7 gate access at ten open stores across seven states. Rent online. We also develop, build, and operate new facilities. Call (888) 711-6050.',
      hero,
      main,
      stores,
      jsonld: { '@context': 'https://schema.org', '@graph': [org, ...stores.map(storeLd)] },
    })
  );
}

/* ========================== LOCATIONS ========================== */
{
  const hero = `    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow" data-reveal>Rent online</p>
        <h1 data-reveal style="--i:1">Ten stores. All open 24/7.</h1>
        <p data-reveal style="--i:2">Every location below is open and renting today. Pick a store, rent on its site, and move in on your own schedule. Questions: <a href="tel:${site.phone.tel}">${site.phone.display}</a>.</p>
      </div>
    </section>`;

  const byState = openStates
    .map((st) => ({ st, list: stores.filter((s) => s.state === st) }))
    .filter((g) => g.list.length);

  const main = `      <section class="section">
        <div class="wrap">
          ${finder(openStates)}
          <ul class="store-grid" data-store-grid style="margin-top:var(--sp-4)">
${stores.map((s, i) => '            ' + storeCard(images, s, i)).join('\n')}
          </ul>
          <div class="finder-empty" data-finder-empty>
            <p><strong>No store matches that search.</strong></p>
            <p class="micro">Try a city or state name, or call ${site.phone.display}.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>Coverage</p>
          <h2 class="h-md" data-reveal>Where we operate</h2>
          <dl class="rows" data-reveal>
${byState
  .map(
    (g) => `            <div>
              <dt>${states[g.st]}</dt>
              <dd>${g.list.map((s) => `<a href="${s.slug}.html">${esc(s.name)}</a>, ${esc(s.city)}`).join(' &middot; ')}</dd>
            </div>`
  )
  .join('\n')}
          </dl>
          <p class="lede" style="margin-top:var(--sp-4)" data-reveal>We also develop new facilities. <a href="builds.html">See what is under construction</a>.</p>
        </div>
      </section>`;

  await emit(
    'locations.html',
    layout({
      slug: 'locations',
      title: 'Storage Locations | Droit',
      description:
        'Ten open self-storage locations across Wisconsin, Minnesota, Iowa, Ohio, Tennessee, Texas, and Washington. 24/7 gate access. Rent online.',
      hero,
      main,
      stores,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Droit self-storage locations',
        numberOfItems: stores.length,
        itemListElement: stores.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: storeLd(s),
        })),
      },
    })
  );
}

/* ======================== STORE PAGES ========================= */
for (const s of stores) {
  // Only same-state stores are "nearby". Odessa has no Texas sibling, so that
  // page lists the whole portfolio instead of implying Eau Claire is close.
  const near = stores.filter((o) => o.slug !== s.slug && o.state === s.state);
  const others = near.length ? near.slice(0, 3) : stores.filter((o) => o.slug !== s.slug);

  const hero = `    <section class="hero hero-sm">
      <div class="hero-media">
        ${picture(images, s.photo, {
          alt: s.alt,
          sizes: '100vw',
          widths: [800, 1200, 1600, 1920],
          priority: true,
          ratio: 16 / 9,
        })}
      </div>
      <div class="wrap">
        <p class="eyebrow" data-reveal>${esc(s.city)}, ${s.state}</p>
        <h1 data-reveal style="--i:1">${esc(s.headline)}</h1>
        <p data-reveal style="--i:2">${esc(s.summary)}</p>
        <div class="btn-row" data-reveal style="--i:3">
          <a class="btn btn-accent" href="${s.rentUrl}" rel="noopener">Rent online ${ICON.arrow}</a>
          <a class="btn btn-outline-light" href="tel:${s.phone.tel}">${ICON.phone} ${s.phone.display}</a>
        </div>
      </div>
    </section>`;

  const main = `      <section class="section">
        <div class="wrap store-detail">
          <div data-reveal>
            <p class="eyebrow">This store</p>
            <h2 class="h-md">${esc(s.name)}</h2>
            <p class="lede">${esc(s.summary)}</p>
            <p>Access here is 24 hours a day, seven days a week — the gate does not close at night. Rentals are completed online, so you do not need to wait for an office to open.</p>
            <p>Call <a href="tel:${s.phone.tel}">${s.phone.display}</a> for anything about this store: unit sizes, availability, or your existing account.</p>
            <ul class="tags">
${s.features.map((f) => `              <li class="tag">${esc(f)}</li>`).join('\n')}
            </ul>
          </div>
          <div data-reveal style="--i:1">
            <dl class="facts">
              <h2>Store details</h2>
              <div class="fact">
                <dt>Address</dt>
                <dd><address>${esc(s.street)}<br>${esc(s.city)}, ${s.state}${s.zip ? ` ${s.zip}` : ''}</address></dd>
              </div>
              <div class="fact">
                <dt>Phone</dt>
                <dd><a href="tel:${s.phone.tel}">${s.phone.display}</a></dd>
              </div>
              <div class="fact">
                <dt>Access</dt>
                <dd>24 hours a day, 7 days a week</dd>
              </div>
              <div class="fact">
                <dt>Rent</dt>
                <dd><a href="${s.rentUrl}" rel="noopener">${s.domain ? esc(s.domain) : 'Rent online'}</a></dd>
              </div>
              <div class="btn-row" style="margin-top:var(--sp-3)">
                <a class="btn btn-accent btn-sm" href="${s.rentUrl}" rel="noopener">Rent online</a>
                <a class="btn btn-ghost btn-sm" href="${mapsUrl(s)}" rel="noopener">${ICON.pin} Directions</a>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>${near.length ? 'Nearby' : 'Elsewhere'}</p>
          <h2 class="h-md" data-reveal>${near.length ? `More storage in ${states[s.state]}` : 'Every Droit location'}</h2>
          <ul class="nearby" data-reveal>
${others
  .map(
    (o) => `            <li><a href="${o.slug}.html"><strong>${esc(o.name)}</strong><span>${esc(o.city)}, ${o.state}</span></a></li>`
  )
  .join('\n')}
          </ul>
          <p style="margin-top:var(--sp-4)"><a href="locations.html">View all ten locations</a></p>
        </div>
      </section>`;

  await emit(
    `${s.slug}.html`,
    layout({
      slug: s.slug,
      title: `${s.name} | ${s.city}, ${s.state} | Droit`,
      description: `Self storage at ${s.street}, ${s.city}, ${s.state}. ${s.features.join('. ')}. Call ${s.phone.display}.`,
      hero,
      main,
      stores,
      ogImage: `img/${s.photo}-1200.jpg`,
      jsonld: {
        '@context': 'https://schema.org',
        '@graph': [
          storeLd(s),
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Locations', item: `${site.origin}/locations.html` },
              { '@type': 'ListItem', position: 3, name: s.name, item: `${site.origin}/${s.slug}.html` },
            ],
          },
        ],
      },
    })
  );
}

/* ========================== BOOKING =========================== */
{
  const hero = `    <section class="hero hero-sm">
      <div class="hero-media">
        ${picture(images, 'eau-claire-clear-space-aerial', {
          alt: 'Aerial view of a self-storage facility operated by Droit',
          sizes: '100vw',
          widths: [800, 1200, 1600, 1920],
          priority: true,
          ratio: 16 / 9,
        })}
      </div>
      <div class="wrap">
        <p class="eyebrow" data-reveal>Owner booking</p>
        <h1 data-reveal style="--i:1">You stay the landlord. We fill the vacancies.</h1>
        <p data-reveal style="--i:2">We work as your agent, never as a sublessor. You set a written wholesale net. We rent at retail on the channels we already run.</p>
        <div class="btn-row" data-reveal style="--i:3">
          <a class="btn btn-accent" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
          <a class="btn btn-outline-light" href="booking-sheet.html">Print one-pager</a>
        </div>
      </div>
    </section>`;

  const main = `      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>The deal</p>
          <h2 class="h-md" data-reveal>Written wholesale. Fill only.</h2>
          <p class="lede" data-reveal>You set a wholesale net below your own website price. We rent the unit at retail on the same channels we use at our stores. If the net is not below your site, we walk.</p>
          <dl class="rows" data-reveal>
            <div><dt>You</dt><dd>Landlord. The lease is yours, and it stays yours. We never rent in our own name.</dd></div>
            <div><dt>Droit</dt><dd>Your agent. We sell at retail and carry the marketing. Terms by written agreement.</dd></div>
            <div><dt>Net</dt><dd>Written wholesale. It has to sit below your website price, or there is no deal.</dd></div>
            <div><dt>Fill</dt><dd>Vacant units only. No listing fee. We get paid when a renter actually moves in.</dd></div>
          </dl>
        </div>
      </section>

      <section class="section split-wrap">
        <div class="wrap split">
          <div data-reveal>
            <p class="eyebrow">Renter channel</p>
            <h2 class="h-sm">The same stack we run.</h2>
            <p>Renters find the unit through GetSelfStorageNow and the Google, Maps, and store-site channels we already operate on our own facilities. Nothing experimental gets tried on your store first.</p>
          </div>
          <div data-reveal style="--i:1">
            <p class="eyebrow">Proof</p>
            <h2 class="h-sm">Facilities we already run.</h2>
            <p>We operate ten self-storage stores across seven states, and we book vacant units the same way at every one of them. <a href="locations.html">See the portfolio</a>.</p>
          </div>
        </div>
      </section>

      <section class="band-soft section">
        <div class="wrap">
          <p class="caption" data-reveal>${industry.label}</p>
          <h2 class="h-md" data-reveal>Demand is local, and it is still growing.</h2>
          <p class="lede" data-reveal>Storage is a national asset class with a local lease. Most renters start online. Most will not drive far. That is the market we fill against.</p>
          <ul class="stat-grid">
${industry.stats
  .map(
    (s, i) => `            <li class="stat" data-reveal style="--i:${i}">
              <span class="stat-num" data-count="${s.value}${s.unit}">${s.value}${s.unit}</span>
              <p class="stat-label">${esc(s.label)}</p>
              <p class="stat-src">${esc(s.source)}</p>
            </li>`
  )
  .join('\n')}
          </ul>
          <div class="chart-grid">
            <div class="panel" data-reveal>
              <h3>${industry.households.title}</h3>
${industry.households.rows.map((r) => bar(r)).join('\n')}
              <p class="chart-note">${esc(industry.households.note)}</p>
            </div>
            <div class="panel" data-reveal style="--i:1">
              <h3>${industry.discovery.title}</h3>
${industry.discovery.rows.map((r) => bar(r, true)).join('\n')}
              <p class="chart-note">${esc(industry.discovery.note)}</p>
            </div>
          </div>
          <p class="chart-note">${esc(industry.footnote)}</p>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>Not this offer</p>
          <h2 class="h-md" data-reveal>Management is a separate tab.</h2>
          <p class="lede" data-reveal>Inbound, collections, gates, liens, the store website, and the monthly recap live on <a href="management.html">Management</a>. Stack them only if you want us on comms and access. Fill-only booking does not include those modules.</p>
          <div class="btn-row" data-reveal>
            <a class="btn btn-accent" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
            <a class="btn btn-ghost" href="management.html">Management</a>
            <a class="btn btn-ghost" href="booking-sheet.html">Print one-pager</a>
          </div>
        </div>
      </section>`;

  await emit(
    'booking.html',
    layout({
      slug: 'booking',
      title: 'Owner Booking | Droit',
      description:
        'We fill your vacant self-storage units as your agent. You stay the landlord, on a written wholesale net. Terms by written agreement. Call (888) 711-6050.',
      hero,
      main,
      stores,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Owner booking',
        serviceType: 'Self-storage vacancy booking',
        provider: { '@id': `${site.origin}/#organization` },
        areaServed: 'US',
        description: 'Agent booking for self-storage owners. The owner remains the landlord.',
      },
    })
  );
}

/* ========================= MANAGEMENT ========================= */
{
  const hero = `    <section class="hero hero-sm">
      <div class="hero-media">
        ${picture(images, 'river-falls', {
          alt: 'Aerial view of a self-storage facility managed by Droit',
          sizes: '100vw',
          widths: [800, 1200, 1600, 1920],
          priority: true,
          ratio: 16 / 9,
        })}
      </div>
      <div class="wrap">
        <p class="eyebrow" data-reveal>Owner management</p>
        <h1 data-reveal style="--i:1">We answer as the manager. You approve the spend.</h1>
        <p data-reveal style="--i:2">Six modules. Take one, take a few, or hand us the whole store. Booking is a separate offer unless you stack it.</p>
        <div class="btn-row" data-reveal style="--i:3">
          <a class="btn btn-accent" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
          <a class="btn btn-outline-light" href="management-sheet.html">Print one-pager</a>
        </div>
      </div>
    </section>`;

  const dash = (pct) => {
    const c = 2 * Math.PI * 44;
    return `${((pct / 100) * c).toFixed(1)} ${c.toFixed(1)}`;
  };

  const main = `      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>Modules</p>
          <h2 class="h-md" data-reveal>What we run. What you keep.</h2>
          <ol class="modules">
${managementModules
  .map(
    (m, i) => `            <li data-reveal style="--i:${Math.min(i, 3)}">
              <span class="mod-n">${m.n}</span>
              <div>
                <h3>${esc(m.title)}</h3>
                <p>${esc(m.body)}</p>
              </div>
            </li>`
  )
  .join('\n')}
          </ol>
        </div>
      </section>

      <section class="band-soft section">
        <div class="wrap">
          <p class="caption" data-reveal>${industry.label}</p>
          <h2 class="h-md" data-reveal>Professional ops win on Google, then at the gate.</h2>
          <p class="lede" data-reveal>Self storage is a twenty-minute business. The Map Pack is where the lease starts. Professionally run portfolios still post the highest occupancy in the CMBS set.</p>
          <div class="chart-grid">
            <div class="panel" data-reveal>
              <h3>${industry.radius.title}</h3>
              <div class="donut">
                <svg viewBox="0 0 120 120" role="img" aria-label="Sixty-nine percent of storage customers travel twenty minutes or less.">
                  <circle cx="60" cy="60" r="44" fill="none" stroke="#e6e2db" stroke-width="12"/>
                  <circle class="donut-ring" cx="60" cy="60" r="44" fill="none" stroke="#e1751f" stroke-width="12"
                          stroke-linecap="round" style="--dash:${dash(industry.radius.percent)}" transform="rotate(-90 60 60)"/>
                  <text x="60" y="57" text-anchor="middle" font-size="21" font-weight="700" fill="#0b1626" font-family="Inter, system-ui, sans-serif">${industry.radius.percent}%</text>
                  <text x="60" y="74" text-anchor="middle" font-size="8" fill="#828c9d" font-family="Inter, system-ui, sans-serif">within 20 min</text>
                </svg>
                <div>
${industry.radius.body.map((p) => `                  <p>${esc(p)}</p>`).join('\n')}
                </div>
              </div>
              <p class="chart-note">${esc(industry.radius.note)}</p>
            </div>
            <div class="panel" data-reveal style="--i:1">
              <h3>${industry.occupancy.title}</h3>
${industry.occupancy.rows.map((r) => bar(r)).join('\n')}
              <p class="chart-note">${esc(industry.occupancy.note)}</p>
            </div>
          </div>
          <div class="chart-grid" style="margin-top:var(--sp-3)">
            <div class="panel" data-reveal>
              <h3>${industry.discovery.title}</h3>
${industry.discovery.rows.map((r) => bar(r, true)).join('\n')}
              <p class="chart-note">${esc(industry.discovery.note)}</p>
            </div>
            <div class="panel" data-reveal style="--i:1">
              <h3>Why the listing matters</h3>
              <p>A Google Business Profile sits above ordinary website results. SSA found 41% of renters start on the internet and 24% arrive specifically through Google and reviews. Flyers, billboards, social, and aggregators combined trail that.</p>
              <p>We keep name, address, phone, hours, photos, and rent links tight on every store we run, because a wrong pin does not convert.</p>
              <p class="chart-note">SSA 2023 Demand Study. Local Pack click share is widely reported above organic listings on local queries. We make no claim about a Droit ranking.</p>
            </div>
          </div>
          <p class="chart-note">${esc(industry.footnote)}</p>
        </div>
      </section>

      <section class="section">
        <div class="wrap split">
          <div data-reveal>
            <p class="eyebrow">Stack with booking</p>
            <h2 class="h-sm">Fill is a separate offer.</h2>
            <p>Management covers comms, collections, access, liens, and the store website. Filling vacant units lives on the <a href="booking.html">Booking</a> tab. Stack them if you want both. Terms by written agreement.</p>
          </div>
          <div data-reveal style="--i:1">
            <p class="eyebrow">Proof</p>
            <h2 class="h-sm">Facilities we already run.</h2>
            <p>We manage ten self-storage stores across seven states. These are the same modules we run at each of them. <a href="locations.html">See the portfolio</a>.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="btn-row" data-reveal style="margin-top:0">
            <a class="btn btn-accent" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
            <a class="btn btn-ghost" href="booking.html">Booking</a>
            <a class="btn btn-ghost" href="management-sheet.html">Print one-pager</a>
          </div>
        </div>
      </section>`;

  await emit(
    'management.html',
    layout({
      slug: 'management',
      title: 'Owner Management | Droit',
      description:
        'Inbound, collections, gates, liens, the store website, and full management for self-storage owners. You still approve anything that spends money. Call (888) 711-6050.',
      hero,
      main,
      stores,
      ogImage: 'img/river-falls-1200.jpg',
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Owner management',
        serviceType: 'Self-storage property management',
        provider: { '@id': `${site.origin}/#organization` },
        areaServed: 'US',
        description: 'Self-storage owner management: inbound, collections, gates, liens, store website, full recap.',
      },
    })
  );
}

/* =========================== BUILDS =========================== */
{
  const hero = `    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow" data-reveal>Development</p>
        <h1 data-reveal style="--i:1">Built to lease. Operated to stay full.</h1>
        <p data-reveal style="--i:2">We design, build, and operate self storage. Site through opening, then we stay with the property. Every project is planned as a store that rents, not a drawing.</p>
        <div class="btn-row" data-reveal style="--i:3">
          <a class="btn btn-accent" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
          <a class="btn btn-outline-light" href="locations.html">View operating stores</a>
        </div>
      </div>
    </section>`;

  const main = `      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>The brief</p>
          <h2 class="h-md" data-reveal>Occupancy is the brief.</h2>
          <p class="lede" data-reveal>Unit mix, drive lanes, parking, and 24/7 gate access are set so the store can rent from day one. We do not hand it off and leave.</p>
          <ol class="steps">
            <li class="step" data-reveal style="--i:0">
              <h3>Development</h3>
              <p>We underwrite the site and the unit mix against the local market, including drive-up storage and outdoor parking where demand supports it.</p>
            </li>
            <li class="step" data-reveal style="--i:1">
              <h3>Construction</h3>
              <p>We deliver an operating store. A project is listed for rent only after it is open. Construction is never marketed as available.</p>
            </li>
            <li class="step" data-reveal style="--i:2">
              <h3>Operations</h3>
              <p>After opening we run leasing, Google listings, and day-to-day ops. Customers rent online, and access is 24/7.</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="band">
        <div class="wrap">
          <p class="eyebrow" data-reveal>Track record</p>
          <h2 class="h-md" data-reveal>Ten stores already open.</h2>
          <p class="lede" data-reveal>Wisconsin, Minnesota, Iowa, Ohio, Tennessee, Texas, and Washington. That operating record sits behind every project we build.</p>
          <ul class="stat-grid">
            <li class="stat" data-reveal style="--i:0"><span class="stat-num" data-count="10">10</span><p class="stat-label">Stores open and renting</p></li>
            <li class="stat" data-reveal style="--i:1"><span class="stat-num" data-count="7">7</span><p class="stat-label">States with an operating store</p></li>
            <li class="stat" data-reveal style="--i:2"><span class="stat-num" data-count="2">2</span><p class="stat-label">Facilities under construction</p></li>
          </ul>
          <div class="btn-row" data-reveal>
            <a class="btn btn-light" href="locations.html">View all locations ${ICON.arrow}</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>In progress</p>
          <h2 class="h-md" data-reveal>Under construction</h2>
          <p class="lede" data-reveal>These sites are not open and are not available to rent. When one opens, it moves to <a href="locations.html">Locations</a>.</p>
          <ul class="store-grid" style="margin-top:var(--sp-4)">
${builds
  .map(
    (b, i) => `            <li class="store-card" data-reveal style="--i:${i}">
              <div class="store-body">
                <span class="badge-build">Under construction</span>
                <h3>${esc(b.name)}</h3>
                <p class="store-meta">${esc(b.note)}</p>
              </div>
            </li>`
  )
  .join('\n')}
          </ul>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>Land or a project</p>
          <h2 class="h-md" data-reveal>Bring us a site.</h2>
          <p class="lede" data-reveal>If you have land or an existing store, call. We will tell you quickly whether it is a Droit build.</p>
          <div class="btn-row" data-reveal>
            <a class="btn btn-accent" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
            <a class="btn btn-ghost" href="contact.html">Contact us</a>
          </div>
        </div>
      </section>`;

  await emit(
    'builds.html',
    layout({
      slug: 'builds',
      title: 'Self-Storage Development | Droit',
      description:
        'We design, build, and operate self-storage facilities, then stay with the property. Ten stores open across seven states. Call (888) 711-6050.',
      hero,
      main,
      stores,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Self-storage development',
        serviceType: 'Development, construction, and operations',
        provider: { '@id': `${site.origin}/#organization` },
        areaServed: 'US',
      },
    })
  );
}

/* ========================== CONTACT =========================== */
{
  const hero = `    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow" data-reveal>Contact</p>
        <h1 data-reveal style="--i:1">One number, seven days a week.</h1>
        <p data-reveal style="--i:2">Renting a unit, asking about your account, or bringing us a store or a site — start with a call.</p>
        <div class="btn-row" data-reveal style="--i:3">
          <a class="btn btn-accent" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
          <a class="btn btn-outline-light" href="locations.html">Find a location</a>
        </div>
      </div>
    </section>`;

  const main = `      <section class="section">
        <div class="wrap">
          <p class="eyebrow" data-reveal>Where to start</p>
          <h2 class="h-md" data-reveal>Tell us which one you are.</h2>
          <ol class="steps">
            <li class="step" data-reveal style="--i:0">
              <h3>Renting or already renting</h3>
              <p>Unit sizes, availability, gate access, or your account. Each store also has its own direct number on its <a href="locations.html">location page</a>.</p>
            </li>
            <li class="step" data-reveal style="--i:1">
              <h3>You own a store</h3>
              <p>Vacant units to fill, or a store to hand off. Start at <a href="booking.html">Booking</a> or <a href="management.html">Management</a>.</p>
            </li>
            <li class="step" data-reveal style="--i:2">
              <h3>You have land</h3>
              <p>Development, construction, and operations. Start at <a href="builds.html">Builds</a>.</p>
            </li>
          </ol>
        </div>
      </section>

${smsSection()}`;

  await emit(
    'contact.html',
    layout({
      slug: 'contact',
      title: 'Contact Droit | (888) 711-6050',
      description:
        'Call (888) 711-6050 for rentals, accounts, owner booking and management, or a new facility. Optional rental text messages.',
      hero,
      main,
      stores,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        url: `${site.origin}/contact.html`,
        mainEntity: org,
      },
    })
  );
}

/* ====================== PRINT ONE-PAGERS ====================== */
const sheetShell = (kicker, body) => `      <div class="sheet-stage">
        <article class="sheet-page">
          <div class="sheet-head">
            <a class="sheet-mark" href="index.html">${site.brand}</a>
            <p class="sheet-kicker">${kicker}</p>
          </div>
${body}
          <div class="sheet-cta">
            <strong><a href="tel:${site.phone.tel}">${site.phone.display}</a></strong>
            <span>${site.brand} &middot; Smart Self Storage</span>
          </div>
          <p class="no-print" style="margin-top:1.2rem">
            <button class="btn btn-sm" type="button" onclick="window.print()">Print this page</button>
          </p>
        </article>
      </div>`;

await emit(
  'booking-sheet.html',
  layout({
    slug: 'booking-sheet',
    title: 'Owner Booking One-Pager | Droit',
    description: 'Printable owner booking terms. Droit acts as your agent. Written wholesale net. Call (888) 711-6050.',
    robots: 'noindex, follow',
    bodyClass: 'sheet',
    stores,
    main: sheetShell(
      'Owner booking &middot; one page',
      `          <h1>You stay the landlord. We fill the vacancies.</h1>
          <p class="lede">We act as your agent, never as a sublessor. You set a written wholesale net. We rent at retail on the channels we already run. Terms by written agreement.</p>
          <div class="sheet-grid">
            <div><h2>You</h2><p>Landlord. The lease is yours and stays yours.</p></div>
            <div><h2>Droit</h2><p>Your agent. We never rent in our own name.</p></div>
            <div><h2>Net</h2><p>Written wholesale, below your own website price, or there is no deal.</p></div>
            <div><h2>Fill</h2><p>Vacant units only. No listing fee. We are paid on a verified move-in.</p></div>
            <div><h2>Renter channel</h2><p>GetSelfStorageNow, plus the Google, Maps, and store-site channels we run.</p></div>
            <div><h2>Proof</h2><p>Ten stores open across seven states, booked this same way.</p></div>
          </div>
          <div class="sheet-list">
            <h2>${industry.label}</h2>
            <p>68,000+ active U.S. facilities (TractIQ, July 2026). 2.1B rentable square feet (StorageCafe, June 2026). Household use rose from 8.95% in 2005 to 12.60% in 2024, and 41% of renters start online, with 24% arriving through Google and reviews (SSA Demand Study).</p>
          </div>
          <p class="sheet-note">Management &mdash; inbound, collections, gates, liens, store website, monthly recap &mdash; is a separate offer on the Management tab.</p>`
    ),
  })
);

await emit(
  'management-sheet.html',
  layout({
    slug: 'management-sheet',
    title: 'Owner Management One-Pager | Droit',
    description: 'Printable owner management modules. Call (888) 711-6050.',
    robots: 'noindex, follow',
    bodyClass: 'sheet',
    stores,
    main: sheetShell(
      'Owner management &middot; one page',
      `          <h1>We answer as the manager. You approve the spend.</h1>
          <p class="lede">Six modules. Take one, take a few, or hand us the whole store. You still approve refunds, legal work, and anything that spends money. Terms by written agreement.</p>
          <div class="sheet-list">
${managementModules
  .map(
    (m) => `            <div class="sheet-item"><span class="sheet-n">${m.n}</span><p><strong>${esc(m.title)}.</strong> ${esc(m.body)}</p></div>`
  )
  .join('\n')}
          </div>
          <div class="sheet-grid">
            <div><h2>Stack with booking</h2><p>Filling vacant units is a separate offer on the Booking tab. Stack them if you want both.</p></div>
            <div><h2>Proof</h2><p>Ten stores open across seven states, run on these same modules.</p></div>
          </div>
          <p class="sheet-note">${esc(industry.label)}: 69% of storage customers travel twenty minutes or less, and 41% start online with 24% arriving via Google and reviews (SSA Demand Study). Q1 2026 CMBS occupancy: REIT portfolios 87.7%, non-designated 85.2%, sophisticated 81.8% (TractIQ).</p>`
    ),
  })
);

/* ===================== LEGAL / UTILITY ======================== */
const legalPage = (slug, title, description, body) =>
  emit(
    `${slug}.html`,
    layout({
      slug,
      title,
      description,
      stores,
      hero: `    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow">Legal</p>
        <h1>${esc(title.split(' | ')[0])}</h1>
        <p>Last updated ${today}.</p>
      </div>
    </section>`,
      main: `      <section class="section">
        <div class="wrap">
          <div class="legal">
${body}
          </div>
        </div>
      </section>`,
    })
  );

await legalPage(
  'privacy',
  'Privacy Policy | Droit',
  'How Droit collects, uses, and protects information, including mobile opt-in and text messaging.',
  `            <h2>What we collect</h2>
            <p>When you contact us or ask for rental text messages, we collect the name, mobile number, and email address you give us, plus anything you include in your message. We do not collect payment details on this website. Rentals are completed on each store's own rental site.</p>

            <h2>How we use it</h2>
            <p>We use your information to answer your question, service your rental or account, and send the account and rental text messages you asked for.</p>

            <h2>Text messages</h2>
            <div class="callout">
              <p>Consent to receive text messages is never a condition of renting. Message frequency varies, and message and data rates may apply. Reply <strong>STOP</strong> to unsubscribe or <strong>HELP</strong> for help, or call <a href="tel:${site.phone.tel}">${site.phone.display}</a>.</p>
              <p><strong>No mobile opt-in or text message consent will be shared with third parties or affiliates for marketing or promotional purposes.</strong></p>
            </div>

            <h2>Sharing</h2>
            <p>We share information only with service providers who help us operate — for example the messaging platform that delivers texts, or the rental software at the store you choose. They may use it only to provide that service to us. We do not sell personal information.</p>

            <h2>Retention</h2>
            <p>We keep information for as long as it is needed to service your account and to meet legal and record-keeping obligations, then we delete it.</p>

            <h2>Your choices</h2>
            <ul>
              <li>Stop texts at any time by replying STOP.</li>
              <li>Ask us what we hold about you, or ask us to delete it, by calling ${site.phone.display}.</li>
              <li>Contact each store directly about a rental agreement you signed with that store.</li>
            </ul>

            <h2>Children</h2>
            <p>This site is not directed to children under 13, and we do not knowingly collect their information.</p>

            <h2>Changes</h2>
            <p>If this policy changes we will update this page and the date above.</p>

            <h2>Contact</h2>
            <p>Call <a href="tel:${site.phone.tel}">${site.phone.display}</a> with any privacy question.</p>`
);

await legalPage(
  'terms',
  'Terms of Use | Droit',
  'The terms that apply to using the Droit website.',
  `            <h2>Using this site</h2>
            <p>This website describes our self-storage stores and the services we offer to owners. Use it lawfully and do not attempt to disrupt it or access it in ways it was not designed for.</p>

            <h2>Rentals happen at the store</h2>
            <p>Renting a unit is a separate agreement between you and the store you choose, completed on that store's own rental site. Unit availability, pricing, and rental terms are set there, not here. Nothing on this website is an offer to lease.</p>

            <h2>Access hours</h2>
            <p>Gate access at open stores is 24 hours a day, seven days a week. Access may be affected by weather, maintenance, or the terms of your rental agreement, including non-payment.</p>

            <h2>Owner services</h2>
            <p>Booking, management, and development services are described in general terms on this site. Any engagement is governed by a separate written agreement. Nothing here is an offer, a quote, or a guarantee of any result.</p>

            <h2>Industry figures</h2>
            <p>Where this site cites market statistics, they are third-party industry figures, attributed on the page. They describe the industry, not Droit's results, and they are not a forecast for any property.</p>

            <h2>Text messages</h2>
            <p>If you opt in to text messages, message frequency varies and message and data rates may apply. Reply STOP to unsubscribe or HELP for help. Consent is not a condition of renting. See our <a href="privacy.html">Privacy Policy</a>.</p>

            <h2>Accuracy</h2>
            <p>We keep addresses, phone numbers, and hours current, but this site is provided as is, without warranties. Call <a href="tel:${site.phone.tel}">${site.phone.display}</a> to confirm anything before you rely on it.</p>

            <h2>Contact</h2>
            <p>Questions about these terms: <a href="tel:${site.phone.tel}">${site.phone.display}</a>.</p>`
);

await emit(
  'thanks.html',
  layout({
    slug: 'thanks',
    title: 'Thank You | Droit',
    description:
      'Thanks — we received your request. Call (888) 711-6050 if you need something now, or find an open Droit storage location with 24/7 access.',
    robots: 'noindex, follow',
    stores,
    hero: `    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow">Received</p>
        <h1>Thank you.</h1>
        <p>We have your request. If you need something now, call <a href="tel:${site.phone.tel}">${site.phone.display}</a>. You can reply STOP to any text to stop them.</p>
        <div class="btn-row">
          <a class="btn btn-accent" href="locations.html">Find a location ${ICON.arrow}</a>
          <a class="btn btn-outline-light" href="index.html">Back home</a>
        </div>
      </div>
    </section>`,
    main: '',
  })
);

await emit(
  '404.html',
  layout({
    slug: '404',
    title: 'Page Not Found | Droit',
    description:
      'That page is not on this site. Find an open self-storage location with 24/7 access, or call (888) 711-6050.',
    robots: 'noindex, follow',
    stores,
    hero: `    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow">404</p>
        <h1>That page is not here.</h1>
        <p>The link may be old. Every open store is one click away, or call <a href="tel:${site.phone.tel}">${site.phone.display}</a>.</p>
        <div class="btn-row">
          <a class="btn btn-accent" href="locations.html">Find a location ${ICON.arrow}</a>
          <a class="btn btn-outline-light" href="index.html">Back home</a>
        </div>
      </div>
    </section>`,
    main: `      <section class="section">
        <div class="wrap">
          <p class="eyebrow">All stores</p>
          <h2 class="h-md">Ten locations, all open 24/7</h2>
          <ul class="nearby">
${stores
  .map(
    (s) => `            <li><a href="${s.slug}.html"><strong>${esc(s.name)}</strong><span>${esc(s.city)}, ${s.state}</span></a></li>`
  )
  .join('\n')}
          </ul>
        </div>
      </section>`,
  })
);

/* ============ SAMPLE STORE SITE (owner outreach, noindex) ===== */
await emit(
  'preview/mitchell-road.html',
  layout({
    slug: 'preview/mitchell-road',
    title: 'Mitchell Road Self Storage | Eau Claire, WI | Sample',
    description: 'Sample store site for Mitchell Road Self Storage, W3750 Mitchell Rd, Eau Claire, WI. Prepared by Droit. Not live.',
    robots: 'noindex, nofollow',
    depth: 1,
    stores,
    hero: `    <p style="background:var(--signal);color:#fff;font-size:.85rem;font-weight:600;text-align:center;margin:0;padding:calc(var(--header-h) + .7rem) 1rem .7rem">Sample site for Mitchell Road Self Storage. Prepared by Droit. Not live.</p>
    <section class="page-head" style="padding-top:var(--sp-5)">
      <div class="wrap">
        <p class="eyebrow">Eau Claire, WI</p>
        <h1>Self storage on Mitchell Road.</h1>
        <p>Drive-up units. Open now. Access is 24/7.</p>
        <div class="btn-row">
          <a class="btn btn-accent" href="tel:${site.phone.tel}">${ICON.phone} ${site.phone.display}</a>
        </div>
      </div>
    </section>`,
    main: `      <section class="section">
        <div class="wrap store-detail">
          <div>
            <p class="eyebrow">This store</p>
            <h2 class="h-md">Mitchell Road Self Storage</h2>
            <p class="lede">Drive-up units with 24/7 gate access.</p>
            <p>This is a sample store site. The name, address, and hours are theirs. The look is the same stack we run on the facilities we operate. No unit prices appear on this page, and rent would go live only when the owner says go.</p>
          </div>
          <div>
            <dl class="facts">
              <h2>Store details</h2>
              <div class="fact"><dt>Address</dt><dd><address>W3750 Mitchell Rd<br>Eau Claire, WI 54701</address></dd></div>
              <div class="fact"><dt>Phone</dt><dd><a href="tel:${site.phone.tel}">${site.phone.display}</a></dd></div>
              <div class="fact"><dt>Access</dt><dd>24 hours a day, 7 days a week</dd></div>
            </dl>
          </div>
        </div>
      </section>`,
  })
);

/* ============ TRAILING-SLASH REDIRECT SHIMS =================== */
// /privacy/ and /terms/ used to 404. These keep those URLs alive.
for (const slug of ['privacy', 'terms']) {
  await emit(
    `${slug}/index.html`,
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <title>Redirecting | ${site.brand}</title>
  <link rel="canonical" href="${site.origin}/${slug}.html">
  <meta http-equiv="refresh" content="0; url=/${slug}.html">
  <script>location.replace("/${slug}.html");</script>
</head>
<body>
  <p><a href="/${slug}.html">Continue to the ${slug} page</a></p>
</body>
</html>
`
  );
}

/* ==================== SITEMAP / ROBOTS / ASSETS =============== */
const urls = [
  { loc: '', pri: '1.0' },
  { loc: 'locations.html', pri: '0.9' },
  ...stores.map((s) => ({ loc: `${s.slug}.html`, pri: '0.8' })),
  { loc: 'builds.html', pri: '0.7' },
  { loc: 'booking.html', pri: '0.7' },
  { loc: 'management.html', pri: '0.7' },
  { loc: 'contact.html', pri: '0.6' },
  { loc: 'privacy.html', pri: '0.3' },
  { loc: 'terms.html', pri: '0.3' },
];

await emit(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${site.origin}/${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.pri}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`
);

await emit(
  'robots.txt',
  `User-agent: *
Allow: /
Disallow: /preview/

Sitemap: ${site.origin}/sitemap.xml
`
);

await copyFile(src('styles.css'), out('styles.css'));
await copyFile(src('app.js'), out('app.js'));
written.push('styles.css', 'app.js');

console.log(`Built ${written.length} files:`);
console.log(written.map((f) => '  ' + f).join('\n'));
