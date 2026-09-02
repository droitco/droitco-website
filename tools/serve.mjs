// Local preview that resolves URLs the way GitHub Pages does: /locations serves
// locations.html, /privacy/ serves privacy/index.html, and a miss serves 404.html.
// `python3 -m http.server` does none of that, so it would 404 on every clean link.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2',
};

const isFile = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const rel = normalize(url).replace(/^(\.\.[/\\])+/, '').replace(/^\//, '');
  const base = join(ROOT, rel);
  const candidates = url.endsWith('/')
    ? [join(base, 'index.html')]
    : [base, base + '.html', join(base, 'index.html')];
  if (rel === '') candidates.unshift(join(ROOT, 'index.html'));

  for (const c of candidates) {
    if (await isFile(c)) {
      res.writeHead(200, { 'content-type': TYPES[extname(c)] || 'application/octet-stream' });
      return res.end(await readFile(c));
    }
  }
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
  res.end(await readFile(join(ROOT, '404.html')).catch(() => 'Not found'));
}).listen(PORT, () => console.log(`droitco.com preview -> http://localhost:${PORT}`));
