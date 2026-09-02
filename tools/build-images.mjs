// Generates responsive AVIF/WebP/JPEG derivatives + LQIP placeholders from src/photos.
// Run: node tools/build-images.mjs   (needs `npm i sharp` in tools/)
import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, parse, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src/photos');
const OUT = join(ROOT, 'img');
const WIDTHS = [400, 800, 1200, 1600, 1920];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const manifest = {};

for (const file of (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const name = parse(file).name;
  const input = sharp(join(SRC, file)).rotate();
  const { width: sw, height: sh } = await input.metadata();
  const ratio = sh / sw;

  // Never upscale: only emit widths the source can actually fill.
  const widths = WIDTHS.filter((w) => w <= sw);
  if (widths.length === 0) widths.push(sw);

  const sources = {};
  for (const w of widths) {
    const base = sharp(join(SRC, file)).rotate().resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(`${OUT}/${name}-${w}.avif`);
    await base.clone().webp({ quality: 76, effort: 6 }).toFile(`${OUT}/${name}-${w}.webp`);
    await base.clone().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(`${OUT}/${name}-${w}.jpg`);
  }
  sources.widths = widths;

  // 24px blurred LQIP, inlined as a background so cards never flash empty.
  const lqip = await sharp(join(SRC, file))
    .rotate()
    .resize({ width: 24 })
    .webp({ quality: 40 })
    .toBuffer();

  manifest[name] = {
    widths,
    width: sw,
    height: sh,
    ratio: Number(ratio.toFixed(4)),
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  };
  console.log(`${name}: ${sw}x${sh} -> ${widths.join(', ')}`);
}

await writeFile(join(ROOT, 'src/images.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nWrote src/images.json (${Object.keys(manifest).length} images)`);
