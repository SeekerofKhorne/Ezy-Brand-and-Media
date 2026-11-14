/* Builds the app into docs/ (or the folder given as the first argument).
   The result is plain static files: index.html, fonts/, fonts-woff/, vendor/.
   There is no bundler. The source files in src/ are joined in a fixed order
   into one page, so the browser needs nothing but a static file server. */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import FONTS from './fonts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : 'docs');
const nm = (...p) => join(root, 'node_modules', ...p);
const src = f => readFileSync(join(root, 'src', f), 'utf8');

/* app.config.json holds the two settings a host may want to change.
   Environment variables win, so one checkout can produce several builds. */
const config = JSON.parse(readFileSync(join(root, 'app.config.json'), 'utf8'));
if (process.env.APP_NAME) config.name = process.env.APP_NAME;
if (process.env.APP_SHARE_BASE) config.shareBase = process.env.APP_SHARE_BASE;

/* Source files, in load order. Later files use what earlier files define. */
const SCRIPTS = ['data.js', 'concepts.js', 'concepts-suggested.js', 'types.js', 'engine.js', 'draw.js', 'store.js', 'ui.js', 'free.js', 'kit.js', 'lib.js'];

const VENDOR = [
  ['pdfjs-dist/build/pdf.min.mjs', 'pdf.min.js'],
  ['pdfjs-dist/build/pdf.worker.min.mjs', 'pdf.worker.min.js'],
  ['jszip/dist/jszip.min.js', 'jszip.min.js'],
  ['jspdf/dist/jspdf.umd.min.js', 'jspdf.umd.min.js'],
];

if (!existsSync(nm('jszip'))) {
  console.error('Dependencies are missing. Run "npm install" first.');
  process.exit(1);
}

for (const d of ['fonts', 'fonts-woff', 'vendor', 'licenses']) rmSync(join(out, d), { recursive: true, force: true });
for (const d of ['fonts', 'fonts-woff', 'vendor', 'licenses/fonts']) mkdirSync(join(out, d), { recursive: true });

for (const [from, to] of VENDOR) copyFileSync(nm(from), join(out, 'vendor', to));
for (const [pkg, file] of [['pdfjs-dist', 'pdfjs-dist.txt'], ['jszip', 'jszip.md'], ['jspdf', 'jspdf.txt']]) {
  const lic = ['LICENSE', 'LICENSE.markdown', 'LICENSE.md', 'LICENSE.txt'].map(n => nm(pkg, n)).find(existsSync);
  if (lic) copyFileSync(lic, join(out, 'licenses', file));
}

const faces = [];
let fontBytes = 0;
for (const [family, pkg, weights] of FONTS) {
  for (const w of weights) {
    const base = nm('@fontsource', pkg, 'files', `${pkg}-latin-${w}-normal`);
    if (!existsSync(base + '.woff2')) {
      console.error(`Missing font file for ${family} ${w}. Is @fontsource/${pkg} installed, and does it ship weight ${w}?`);
      process.exit(1);
    }
    copyFileSync(base + '.woff2', join(out, 'fonts', `${pkg}-${w}.woff2`));
    copyFileSync(base + '.woff', join(out, 'fonts-woff', `${pkg}-${w}.woff`));
    fontBytes += readFileSync(base + '.woff2').length;
    faces.push(`@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url("fonts/${pkg}-${w}.woff2") format("woff2")}`);
  }
  const lic = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].map(n => nm('@fontsource', pkg, n)).find(existsSync);
  if (lic) copyFileSync(lic, join(out, 'licenses', 'fonts', `${pkg}.txt`));
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fontFaces = Object.fromEntries(FONTS.map(([f, , w]) => [f, w]));
const fontFiles = Object.fromEntries(FONTS.map(([f, p]) => [f, p]));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(config.name)}</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="theme-color" content="#111111">
<meta name="apple-mobile-web-app-title" content="${esc(config.name)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23111'/%3E%3Ccircle cx='12' cy='13' r='6' fill='%23f2efe8'/%3E%3Ccircle cx='20' cy='19' r='6' fill='%238a7a5c'/%3E%3C/svg%3E">
<style>
${faces.join('\n')}
${src('style.css')}
</style>
</head>
<body>
${src('body.html')}
<script>
const APP_CONFIG=${JSON.stringify({ name: config.name, shareBase: config.shareBase || '' })};
const FONT_FACES=${JSON.stringify(fontFaces)};const FONT_FILES=${JSON.stringify(fontFiles)};
${SCRIPTS.map(src).join('\n')}
</script>
</body>
</html>
`;
writeFileSync(join(out, 'index.html'), html);
writeFileSync(join(out, '.nojekyll'), '');
/* Install support: lets the browser add the app to the Dock, Start menu or a phone's home screen. */
mkdirSync(join(out, 'icons'), { recursive: true });
for (const f of ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) copyFileSync(join(root, 'src', 'icons', f), join(out, 'icons', f));
writeFileSync(join(out, 'manifest.webmanifest'), JSON.stringify({
  name: config.name, short_name: config.shortName || config.name, start_url: './', scope: './', display: 'standalone',
  background_color: '#F2F2F3', theme_color: '#111111',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }
  ]
}, null, 2));
console.log(`Built ${config.name} into ${out}`);
console.log(`  index.html ${(html.length / 1024).toFixed(0)} KB, ${faces.length} font files ${(fontBytes / 1048576).toFixed(1)} MB`);
