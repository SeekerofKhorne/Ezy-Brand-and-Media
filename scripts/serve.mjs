/* A small static file server for the built app. No dependencies.
     node scripts/serve.mjs            serve docs/ on http://localhost:5173
     node scripts/serve.mjs --watch    also rebuild when a file in src/ changes
     PORT=8080 node scripts/serve.mjs  use another port
   The app needs a server (not file://) because the PDF importer and the
   brand kit load files with fetch and import. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'docs');
const port = Number(process.env.PORT) || 5173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json' };

const build = () => new Promise(done => spawn(process.execPath, [join(root, 'scripts', 'build.mjs')], { stdio: 'inherit' }).on('exit', done));

if (process.argv.includes('--watch')) {
  await build();
  let timer = null;
  watch(join(root, 'src'), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(build, 150); });
  console.log('Watching src/ for changes. Reload the page after each rebuild.');
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(dir, path));
    if (file !== dir && !file.startsWith(dir + sep)) { res.writeHead(403).end('Forbidden'); return; }
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    if (!res.headersSent) res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Open http://localhost:${port}/ in your browser. Press Ctrl+C to stop.`));
