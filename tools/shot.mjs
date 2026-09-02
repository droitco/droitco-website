import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 620 } });
const p = await ctx.newPage();
await p.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
await p.screenshot({ path: '/tmp/claude-0/-home-user-droitco-website/add402d8-a243-5c25-a8cb-80494f2aa7e8/scratchpad/shots/hdr.png' });
console.log('brand:', await p.$eval('.brand', e => e.textContent.trim()), '| svg in brand:', await p.$$eval('.brand svg', e => e.length));
await b.close();
