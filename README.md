# droitco.com

Static site for **DROIT** — self storage with 24/7 access, plus development and
operations. Served by GitHub Pages from the `gh-pages` branch at
<https://droitco.com>. DNS is live; `CNAME` must stay in the branch root.

## How it is built

Every page is generated from one source of truth, so the header, footer, phone
numbers, and store details cannot drift apart.

```
src/data.js        stores, industry figures, copy constants
src/templates.js   page shell + shared fragments
src/styles.css     design system (copied to root on build)
src/app.js         progressive enhancement (copied to root on build)
src/photos/        full-resolution source photos, one per store
tools/build-site.mjs    writes every page, sitemap.xml, robots.txt
tools/build-images.mjs  writes img/ derivatives + src/images.json
tools/check.mjs         fails on broken links and brand-rule violations
tools/audit.mjs         crawls for orphans, sitemap gaps, URL hygiene
tools/build-preview.mjs bundles the whole site into one shareable file
tools/serve.mjs         local server that resolves URLs like GitHub Pages
```

Generated files are committed to the branch root because GitHub Pages serves
the branch directly — there is no CI build step.

## Working on it

```bash
cd tools && npm install     # once, for sharp
node tools/build-images.mjs # only after changing src/photos/
node tools/build-site.mjs   # after any content or template change
node tools/check.mjs        # must pass before pushing
node tools/audit.mjs        # whole-site crawl
node tools/serve.mjs        # preview at http://localhost:8000
```

Edit `src/`, never the generated pages at the root — the next build overwrites
them.

Use `node tools/serve.mjs`, not `python3 -m http.server`. The site links
without file extensions (`/locations`, not `/locations.html`), which GitHub
Pages resolves but a plain static server does not.

## URLs

Pages are linked and canonicalised without `.html`. The `.html` forms still
resolve, so nothing already indexed or filed breaks. `/builds` redirects to
`/development`; `/privacy/` and `/terms/` redirect to their pages.

## Rules that live in the data, not in someone's memory

`tools/check.mjs` fails the build on each of these:

- Public brand is **DROIT**. Not Droitco, not LLC, and no letterform logo.
- All open stores are **24/7**. Never publish limited gate hours for an open
  store. Gates do close; what is always true is that access is 24/7.
- Company phone is **(888) 711-6050**. Odessa's store phone is **(432) 200-0595**.
- Odessa is **114 Betty Lou Dr** only. `odessasmartstorage.com` and 6825 Faudree
  Rd are a different company — never link, cite, or imply otherwise.
- Lynwood and Daytona Beach / Holly Hill are **construction only**. No rent CTA.
- Percentages from third-party research are labelled *industry figures, not
  Droit results*, and carry their source.
- No Droit pricing or fee percentages on Booking, Management, or the print sheets.

### A2P / 10DLC

RingCentral campaign **CTD3F6D** was filed against `droitco.com/privacy.html`
and `droitco.com/terms.html`, with the homepage itself as the opt-in page. The
build fails if the front page loses the consent checkbox, the STOP /
message-rates / not-a-condition language, or its links to those two pages, or
if either page stops existing. Do not remove them.
