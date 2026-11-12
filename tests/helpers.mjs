/* Shared test helpers: a static server for docs/, a browser, and page set-up. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const fixture = name => join(root, 'tests', 'fixtures', name);
const site = join(root, 'docs');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff' };

export function startServer() {
  return new Promise(done => {
    const server = createServer(async (req, res) => {
      try {
        let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        if (path.endsWith('/')) path += 'index.html';
        const file = normalize(join(site, path));
        if (!file.startsWith(site + sep)) throw new Error('outside');
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
        res.end(body);
      } catch {
        if (!res.headersSent) res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, '127.0.0.1', () => done({ server, url: `http://127.0.0.1:${server.address().port}/` }));
  });
}

/* CHROME_PATH points the tests at an installed Chrome instead of Playwright's own
   Chromium. CHROME_NO_SANDBOX=1 is needed inside some containers. */
export function launch() {
  return chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: process.env.CHROME_NO_SANDBOX ? ['--no-sandbox'] : [],
  });
}

/* A fresh browser profile with the app open, the first-run panel closed,
   and every console error collected in page.errors. */
export async function openApp(browser, url, { keepWelcome = false, context = null } = {}) {
  const ctx = context || await browser.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('pageerror', e => page.errors.push('Uncaught: ' + e.message));
  await page.goto(url);
  await page.waitForFunction('typeof Store !== "undefined" && Store.S.ready && !!state.bid');
  if (!keepWelcome && await page.isVisible('#ovWelcome')) await page.click('#ovWelcome [data-close]');
  return page;
}

export async function download(page, action) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), action()]);
  return { name: dl.suggestedFilename(), data: await readFile(await dl.path()) };
}

/* Width and height from a PNG file's header. */
export const pngSize = buf => ({ png: buf.subarray(1, 4).toString() === 'PNG', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });
