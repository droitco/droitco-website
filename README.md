# droitco.com

Static site for **DROIT** — self storage with 24/7 access, plus development and
operations. Served by GitHub Pages from the `gh-pages` branch at
<https://droitco.com> (DNS is live; `CNAME` must stay in the branch root).

## How it is built

Every page is generated from one source of truth so the header, footer, phone
numbers, and store details can never drift apart again.

```
src/data.js        stores, industry figures, copy constants
src/templates.js   page shell + shared fragments
src/styles.css     design system (copied to root on build)
src/app.js         progressive enhancement (copied to root on build)
src/photos/        full-resolution source photos, one per store
tools/build-site.mjs    writes every .html, sitemap.xml, robots.txt
tools/build-images.mjs  writes img/ derivatives + src/images.json
```

Generated files are committed to the branch root because GitHub Pages serves
the branch directly — there is no CI build step.

## Working on it

```bash
cd tools && npm install        # once, for sharp
node tools/build-images.mjs    # only after changing src/photos/
node tools/build-site.mjs      # after any content or template change
python3 -m http.server 8000    # preview at http://localhost:8000
```

Edit `src/`, never the generated `.html` at the root — the next build
overwrites it.

## Rules that live in the data, not in someone's memory

- Public brand is **DROIT**. Not Droitco, not LLC.
- All open stores are **24/7**. Never publish limited gate hours for an open store.
- Company phone is **(888) 711-6050**. Odessa's store phone is **(432) 200-0595**.
- Odessa is **114 Betty Lou Dr** only. `odessasmartstorage.com` and 6825 Faudree Rd
  are a different company — never link, cite, or imply otherwise.
- Lynwood and Daytona Beach / Holly Hill are **construction only**. No rent CTA.
- Percentages from third-party research are labelled *industry figures, not Droit results*.
- No Droit pricing or fee percentages anywhere on Booking, Management, or the print sheets.
