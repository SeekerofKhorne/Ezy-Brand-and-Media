/* End-to-end checks, run in a real browser against the built app in docs/.
   Each test starts from an empty browser profile unless it says otherwise.
     npm test
   The page's top-level names (state, Store, Free, TYP ...) are read directly
   with page.evaluate, which keeps the tests short. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';
import { startServer, launch, openApp, download, fixture, pngSize, root } from './helpers.mjs';

let server, url, browser;
const out = join(root, 'tests', 'output');
before(async () => { ({ server, url } = await startServer()); browser = await launch(); await mkdir(out, { recursive: true }); });
after(async () => { await browser?.close(); server?.close(); });
const toMedia = page => page.click('#nav button[data-v=design]');
const toBrand = page => page.click('#nav button[data-v=brand]');
/* type a keyword into the chip box and commit it */
async function addKw(page, w) { await page.click('#q'); await page.keyboard.type(w); await page.keyboard.press('Enter'); }

test('opens in Simple mode with a starter brand and no errors', async () => {
  const page = await openApp(browser, url, { keepWelcome: true });
  assert.equal(await page.isVisible('#ovWelcome'), true, 'the quick start shows on a first visit');
  await page.click('#ovWelcome [data-close]');
  const s = await page.evaluate('({mode:Store.S.mode,ui:uiMode,brands:Store.all("brand").length,palettes:PALETTES.length,types:TYPESETS.length,formats:FORMATS.length})');
  assert.deepEqual({ mode: s.mode, ui: s.ui, brands: s.brands }, { mode: 'local', ui: 'simple', brands: 1 });
  assert.ok(s.palettes >= 28 && s.types >= 52 && s.formats >= 30);
  // a first visit starts on the Brand page, at the describe step
  assert.equal(await page.isVisible('#bDescribe'), true);
  assert.equal(await page.evaluate('Lib.view'), 'brand');
  await page.screenshot({ path: join(out, 'brand-describe.png') });
  await toMedia(page);
  for (const id of ['#accAdv', '#advBar']) assert.equal(await page.isVisible(id), false, id + ' is hidden in Simple mode');
  assert.equal(await page.isVisible('.stepline'), true, 'step labels show in Simple mode');
  await page.screenshot({ path: join(out, 'simple.png') });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('can be installed as an app (Dock, Start menu, phone home screen)', async () => {
  const page = await openApp(browser, url);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  // the test browser is a private profile, which Chrome reports on its own
  assert.deepEqual(installabilityErrors.filter(e => e.errorId !== 'in-incognito'), []);
  assert.equal(await page.textContent('#appName'), 'Ezy Brand and Media');
  await page.context().close();
});

test('keywords rank the options, and choosing one changes the brand preview', async () => {
  const page = await openApp(browser, url);
  // autocomplete: a partial word offers known keywords, and Enter takes the top one
  await page.click('#q'); await page.keyboard.type('trustw');
  await page.waitForSelector('#acList:not([hidden]) .acopt');
  assert.match(await page.textContent('#acList .acopt >> nth=0'), /trustworthy.*Competence|trustworthy.*Sincerity/);
  await page.keyboard.press('Enter');
  await addKw(page, 'calm');
  await page.waitForFunction('parsed.concepts.length >= 2');
  assert.equal(await page.evaluate('state.query'), 'trustworthy, calm');
  assert.equal(await page.locator('#kwChips .chip').count(), 2);
  // the fingerprint draws the keywords on eight axes
  assert.equal(await page.locator('#radarBig svg text.rl').count(), 8);
  assert.equal(await page.locator('#radarBig svg polygon.rt').count(), 1);
  await page.click('#btnUseKw');
  await page.waitForSelector('#bBuild:not([hidden])');
  assert.match(await page.textContent('#rSummary'), /match/);
  await page.waitForTimeout(250);
  const before = await page.evaluate('document.getElementById("pcv").toDataURL()');
  const first = await page.evaluate('results().colors[1].it.id');
  await page.click('#results .opt >> nth=1');
  assert.equal(await page.evaluate('state.paletteId'), first);
  await page.waitForTimeout(250);
  assert.notEqual(await page.evaluate('document.getElementById("pcv").toDataURL()'), before, 'the preview was redrawn');
  // the small radar compares the keywords with the current picks
  assert.equal(await page.locator('#radarSmall svg polygon.rc').count(), 1);
  assert.notEqual(await page.textContent('#fpFit'), '');
  // every result names a source tier
  assert.ok(await page.locator('#results .opt .tier').count() > 0);
  // the three preview formats
  for (const [v, w, h] of [['story', 1080, 1920], ['banner', 1200, 630], ['square', 1080, 1080]]) {
    await page.click(`#pvFmt button[data-v=${v}]`); await page.waitForTimeout(120);
    const r = await page.evaluate('(()=>{const c=document.getElementById("pcv");return c.width/c.height;})()');
    assert.ok(Math.abs(r - w / h) < 0.02, v + ' preview ratio ' + r);
  }
  // a word with no mapping is reported, not guessed
  await page.click('#btnEditKw');
  await addKw(page, 'zzzqqq');
  await page.waitForFunction('parsed.terms.some(t => !t.hits)');
  assert.match(await page.textContent('#terms'), /no link on file/);
  assert.equal(await page.locator('#kwChips .chip.miss').count(), 1);
  await page.click('#kwChips .chip.miss button');
  // a reviewed, model-suggested word is understood, and its chip says where the link comes from
  await addKw(page, 'opulent');
  await page.waitForFunction('parsed.concepts.includes("sophistication")');
  assert.match(await page.getAttribute('#terms .term:has-text("opulent")', 'title'), /Suggested by a language model/);
  // the color builder accepts a typed hex code
  await page.click('#bStep2');
  await page.click('#subbar button:has-text("Build your own")');
  await page.fill('#bHex', '#0B6E4F');
  await page.press('#bHex', 'Enter');
  assert.equal(await page.evaluate('state.colors.primary'), '#0B6E4F');
  // nothing is stored until Save brand
  assert.equal(await page.evaluate('Lib.isDirty()'), true);
  assert.equal(await page.evaluate('Store.get("brand",state.bid).query'), '');
  await page.click('#btnSaveBrand');
  await page.waitForFunction('!Lib.isDirty()');
  assert.deepEqual(await page.evaluate('(()=>{const b=Store.get("brand",state.bid);return [b.query,b.colors.primary];})()'), ['trustworthy, calm, opulent', '#0B6E4F']);
  await page.screenshot({ path: join(out, 'brand-build.png') });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('unsaved brand changes are guarded, and a saved post keeps its own look', async () => {
  const page = await openApp(browser, url);
  // save a post in the starter look
  await toMedia(page);
  await page.fill('#postName', 'Starter look');
  await page.click('#btnSave');
  await page.waitForFunction('Store.all("post").length === 1');
  const look = await page.evaluate('state.colors.primary');
  // change the brand's colors on the Brand page
  await toBrand(page);
  await page.click('#bStep2');
  await page.click('#results .opt >> nth=3');
  const brandPrimary = await page.evaluate('state.colors.primary');
  assert.notEqual(brandPrimary, look);
  await page.waitForSelector('#navDirty:not([hidden])', { timeout: 2000 }); // the Brand tab shows a dot while changes are unsaved
  // the open post keeps its own look on the Media page
  await toMedia(page);
  assert.equal(await page.evaluate('state.colors.primary'), look);
  // the brand look is one click away
  await page.click('#mPals .palpick:has-text("Brand colors")');
  assert.equal(await page.evaluate('state.colors.primary'), brandPrimary);
  // switching brands asks first
  await page.evaluate('Lib.setView("lib")');
  await page.click('#libBrands button:has-text("New brand")');
  await page.waitForSelector('#ovUnsaved:not([hidden])');
  await page.click('#unsCancel');
  assert.equal(await page.isVisible('#ovUnsaved'), false);
  await page.click('#libBrands button:has-text("New brand")');
  await page.click('#unsSave');
  await page.waitForSelector('#ovAsk:not([hidden])');
  await page.fill('#askIn', 'Second brand');
  await page.click('#askOk');
  await page.waitForFunction('Store.all("brand").length === 2 && Lib.view === "brand"');
  assert.equal(await page.evaluate('Store.all("brand").find(b=>b.name==="Northfield Co.").colors.primary'), brandPrimary, 'Save kept the change');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Advanced mode adds controls; its settings and a custom type pairing are saved', async () => {
  const page = await openApp(browser, url);
  await page.click('#modeSeg button[data-v=advanced]');
  await toMedia(page);
  for (const id of ['#accAdv', '#advBar']) assert.equal(await page.isVisible(id), true, id + ' shows in Advanced mode');
  assert.equal(await page.isVisible('.stepline'), false);
  await page.click('#accAdv summary');
  await page.evaluate('(()=>{const r=document.getElementById("aHead");r.value=130;r.dispatchEvent(new Event("input"));})()');
  await page.selectOption('#aCaps', 'upper');
  await page.uncheck('#aHandle');
  assert.deepEqual(await page.evaluate('[state.headScale,state.caps,state.showHandle,snap().type.display.upper,snap().noHandle]'), [1.3, 'upper', false, true, true]);
  // build a pairing on the Brand page
  await toBrand(page);
  await page.click('#bStep2');
  assert.equal(await page.isVisible('#accFine'), true, 'hex fine-tuning shows on the Brand page in Advanced mode');
  await page.click('#tabs button[data-v=type]');
  await page.click('#subbar button:has-text("Build a pairing")');
  await page.click('#results button:has-text("Start a pairing from this one")');
  await page.waitForSelector('#tDF');
  await page.selectOption('#tDF', 'Oswald');
  await page.selectOption('#tBF', 'Lora');
  await page.fill('#tName', 'Poster pair');
  await page.press('#tName', 'Tab');
  const t = await page.evaluate('({id:state.typeId,d:TYP[state.typeId].display.family,b:TYP[state.typeId].body.family,name:TYP[state.typeId].name,tags:Object.keys(TAGS.type[state.typeId].tags).length})');
  assert.match(t.id, /^myt-/);
  assert.deepEqual([t.d, t.b, t.name], ['Oswald', 'Lora', 'Poster pair']);
  assert.ok(t.tags > 0, 'a custom pairing still carries sourced associations');
  await page.click('#btnSaveBrand');
  await page.waitForFunction('(Store.get("brand",state.bid).types||[]).some(t=>t.name==="Poster pair")', null, { timeout: 5000 });
  await toMedia(page);
  await page.screenshot({ path: join(out, 'advanced.png') });
  // back in Simple mode the post keeps its settings and says so
  await page.click('#modeSeg button[data-v=simple]');
  assert.equal(await page.isVisible('#advNote'), true);
  assert.equal(await page.evaluate('state.headScale'), 1.3);
  // save, reload: mode, pairing and post survive
  await page.fill('#postName', 'Big headline');
  await page.click('#btnSave');
  await page.waitForFunction('/^Saved/.test(document.getElementById("status").textContent)');
  await page.reload();
  await page.waitForFunction('typeof Store !== "undefined" && Store.S.ready && !!state.bid');
  const r = await page.evaluate('({ui:uiMode,posts:Store.all("post").map(p=>[p.name,p.s.headScale,p.s.typeId.slice(0,4)]),type:TYP[state.typeId].name,welcome:!document.getElementById("ovWelcome").hidden})');
  assert.deepEqual(r, { ui: 'simple', posts: [['Big headline', 1.3, 'myt-']], type: 'Poster pair', welcome: false });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('exports are real files at the platform size', async () => {
  const page = await openApp(browser, url);
  await toMedia(page);
  const png = await download(page, () => page.click('#btnExport'));
  assert.match(png.name, /facebook-feed-post-4-5-1080x1350\.png$/);
  assert.deepEqual(pngSize(png.data), { png: true, w: 1080, h: 1350 });
  await page.click('#modeSeg button[data-v=advanced]');
  const jpg = await download(page, () => page.click('#btnJpg'));
  assert.match(jpg.name, /\.jpg$/);
  assert.equal(jpg.data.subarray(0, 2).toString('hex'), 'ffd8');
  const set = await download(page, () => page.click('#btnSet'));
  const zip = await JSZip.loadAsync(set.data);
  const formats = await page.evaluate('FORMATS.filter(f=>f.p===state.platform).map(f=>[f.w,f.h])');
  const names = Object.keys(zip.files);
  assert.equal(names.length, formats.length);
  for (const n of names) { const m = /-(\d+)x(\d+)\.png$/.exec(n); const s = pngSize(await zip.file(n).async('nodebuffer')); assert.deepEqual([s.w, s.h], [+m[1], +m[2]], n); }
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('a template post opens as editable layers', async () => {
  const page = await openApp(browser, url);
  await page.click('#modeSeg button[data-v=advanced]');
  await toMedia(page);
  await page.setInputFiles('#inLogo', fixture('logo.png'));
  await page.waitForFunction('!!logoImg');
  const flat = await page.evaluate('(async()=>{const b=await draftBlob(state,false);const im=await createImageBitmap(b);const c=document.createElement("canvas");c.width=im.width;c.height=im.height;c.getContext("2d").drawImage(im,0,0);return c.toDataURL();})()');
  await page.click('#btnLayers');
  await page.waitForFunction('Free.doc && Free.doc.layers.length > 3 && !document.getElementById("viewFree").hidden');
  const d = await page.evaluate('({w:Free.doc.w,h:Free.doc.h,kinds:Free.doc.layers.map(l=>l.t),texts:Free.doc.layers.filter(l=>l.t==="text").map(l=>l.text.replace(/\\n/g," ")),locked:Free.doc.layers[0].lock,logo:Free.doc.layers.some(l=>l.name==="Logo")})');
  assert.deepEqual([d.w, d.h, d.locked, d.logo], [1080, 1350, true, true]);
  assert.ok(d.texts.includes('Made for the long run.'), 'the headline is a text layer: ' + JSON.stringify(d.texts));
  assert.ok(d.texts.includes('Learn more') && d.kinds.includes('rect'), 'the button is a shape plus a text layer');
  // the layered copy looks like the template it came from
  await page.waitForTimeout(600);
  const diff = await page.evaluate(async flat => {
    /* eslint-disable no-undef */
    await Free.prepare(Free.doc);
    const c = document.createElement('canvas'); c.width = Free.doc.w; c.height = Free.doc.h; Free.render(c.getContext('2d'), Free.doc);
    const im = new Image(); await new Promise(r => { im.onload = r; im.src = flat; });
    const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; o.getContext('2d').drawImage(im, 0, 0);
    const a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, b = o.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 90) n++;
    return n / (a.length / 4);
  }, flat);
  assert.ok(diff < 0.004, 'layers differ from the template in ' + (diff * 100).toFixed(3) + '% of pixels');
  await page.screenshot({ path: join(out, 'layers.png') });
  // edit a text layer and save the layout to the brand
  await page.evaluate('(()=>{const l=Free.doc.layers.find(l=>l.t==="text"&&/Made for/.test(l.text));l.text="Edited headline";})()');
  await page.click('#fSave');
  await page.waitForFunction('Store.all("post").some(p=>p.type==="free")');
  const saved = await page.evaluate('Store.all("post").filter(p=>p.type==="free").map(p=>({n:p.doc.layers.length,refs:p.doc.layers.filter(l=>l.t==="img").map(l=>l.ref.slice(0,2)),edited:p.doc.layers.some(l=>l.text==="Edited headline")}))[0]');
  assert.ok(saved.edited && saved.refs.every(r => r === 'l:'), 'images are stored with the layout: ' + JSON.stringify(saved));
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('a PDF is imported as separate text, image and shape layers', async () => {
  const page = await openApp(browser, url);
  await page.click('#nav button[data-v=free]');
  await page.setInputFiles('#fImport', fixture('sample.pdf'));
  await page.waitForFunction('Free.doc && document.getElementById("fBusy").hidden && Free.doc.layers.length > 0', null, { timeout: 90000 });
  const d = await page.evaluate('({w:Free.doc.w,h:Free.doc.h,text:Free.doc.layers.filter(l=>l.t==="text").map(l=>[l.text,l.family]),imgs:Free.doc.layers.filter(l=>l.t==="img").length})');
  assert.ok(d.w === 1080 && Math.abs(d.h - 1350) <= 1, 'page size ' + d.w + ' x ' + d.h);
  // the fixture uses Lora (bundled, so kept) and two faces that are not bundled (so replaced and listed)
  assert.ok(d.text.some(([t]) => /Fresh from the garden/.test(t)), JSON.stringify(d.text));
  assert.ok(d.text.some(([t, f]) => /Seasonal plates/.test(t) && f === 'Lora'), JSON.stringify(d.text));
  assert.match(await page.textContent('#fNotes'), /DejaVuSans → Source Sans 3/);
  assert.ok(d.imgs >= 2, 'the photo and the shapes are their own layers');
  await page.click('#fBrandC');
  await page.click('#fBrandF');
  await page.screenshot({ path: join(out, 'pdf-import.png') });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('a brand travels to another browser as a file, with its posts and images', async () => {
  const a = await openApp(browser, url);
  await a.setInputFiles('#inLogo', fixture('logo.png'));
  await a.click('#btnSaveBrand');
  await a.waitForFunction('!!Store.get("brand",state.bid).logo');
  await toMedia(a);
  await a.setInputFiles('#inPhoto', fixture('photo.jpg'));
  await a.waitForFunction('!!logoImg && !!photoImg');
  await a.fill('#postName', 'Photo post');
  await a.click('#btnSave');
  await a.waitForFunction('Store.all("post").length === 1 && !!Store.all("post")[0].photo && !!Store.get("brand",state.bid).logo', null, { timeout: 8000 });
  await a.click('#nav button[data-v=lib]');
  const file = await download(a, () => a.click('#libPanel button:has-text("Share brand as a file")'));
  assert.match(file.name, /\.brand\.json$/);
  const parsed = JSON.parse(file.data.toString());
  assert.equal(parsed.kind, 'brand');
  assert.equal(Object.keys(parsed.images).length, 2, 'the logo and the photo are inside the file');
  assert.equal(await a.isVisible('#ovShare'), true);
  assert.match(await a.textContent('#shareNote'), /Open a backup or shared file/);
  await a.click('#ovShare [data-close]');
  const backup = await download(a, () => a.click('#libAcct button:has-text("Back up everything")'));
  assert.deepEqual(a.errors, []);
  await a.context().close();

  const path = join(out, file.name), bpath = join(out, backup.name);
  await writeFile(path, file.data); await writeFile(bpath, backup.data);

  const b = await openApp(browser, url);
  await b.click('#nav button[data-v=lib]');
  await b.setInputFiles('#libOpen', path);
  await b.waitForSelector('#ovIncoming:not([hidden]) #inAdd:not([hidden])');
  assert.match(await b.textContent('#inH'), /Shared brand: Northfield Co\./);
  await b.click('#inAdd');
  await b.waitForFunction('Store.all("brand").length === 2 && Store.all("post").length === 1');
  const got = await b.evaluate('(async()=>{const p=Store.all("post")[0],br=Store.get("brand",p.bid);const [ph,lg]=await Promise.all([Store.loadImage(p.photo),Store.loadImage(br.logo)]);return {name:p.name,photo:!!ph&&ph.naturalWidth,logo:!!lg&&lg.naturalWidth,from:!!br.from};})()');
  assert.deepEqual(got, { name: 'Photo post', photo: 400, logo: 240, from: true });
  assert.deepEqual(b.errors, []);
  await b.context().close();

  // a full backup restores into an empty profile
  const c = await openApp(browser, url);
  await c.click('#nav button[data-v=lib]');
  await c.setInputFiles('#libOpen', bpath);
  await c.waitForFunction('Store.all("post").length === 1');
  assert.match(await c.textContent('#libMsg'), /Restored 1 brand and 1 post/);
  assert.equal(await c.evaluate('(async()=>!!(await Store.loadImage(Store.all("post")[0].photo)))()'), true);
  // and a file that is not ours is refused politely
  const junk = join(out, 'junk.json'); await writeFile(junk, '{"hello":1}');
  await c.setInputFiles('#libOpen', junk);
  await c.waitForFunction('/not a backup/.test(document.getElementById("libMsg").textContent)');
  assert.deepEqual(c.errors, []);
  await c.context().close();
});

test('the brand kit holds a guidelines PDF, palette files, a wordmark and fonts', async () => {
  const page = await openApp(browser, url);
  await page.click('#nav button[data-v=lib]');
  const kit = await download(page, () => page.click('#libPanel button:has-text("Export brand kit")'));
  const names = Object.keys((await JSZip.loadAsync(kit.data)).files);
  for (const n of ['Brand-guidelines.pdf', 'colors/hex-codes.txt', 'colors/palette.ase', 'colors/tokens.json', 'logo/wordmark-dark.png', 'README.txt']) assert.ok(names.includes(n), n + ' is in the kit');
  assert.ok(names.some(n => /^fonts\/.+\.woff$/.test(n)), 'fonts are in the kit');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('hosted with accounts (simulated): work saves per account and a share link copies it to another', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const blobs = new Map();
  await ctx.exposeFunction('testAsset', (id, dataUrl) => { blobs.set(id, dataUrl); });
  await ctx.addInitScript({ path: join(root, 'tests', 'mock-host.js') });
  await ctx.route('**/_blob/*', route => {
    const u = blobs.get(route.request().url().split('/').pop());
    if (!u) return route.fulfill({ status: 404 });
    const [head, data] = u.split(',');
    return route.fulfill({ status: 200, contentType: head.slice(5).split(';')[0], body: Buffer.from(data, 'base64') });
  });
  const one = await openApp(browser, url + '?u=1', { context: ctx });
  assert.deepEqual(await one.evaluate('[Store.S.mode,Store.S.me.name,Store.S.canShare]'), ['cloud', 'Tester 1', true]);
  await toMedia(one);
  await one.setInputFiles('#inPhoto', fixture('photo.jpg'));
  await one.waitForFunction('!!photoImg');
  await one.fill('#postName', 'Account post');
  await one.click('#btnSave');
  await one.waitForFunction('/^Saved/.test(document.getElementById("status").textContent)');
  assert.match(await one.evaluate('Store.all("post")[0].photo'), /^a:/, 'the photo went to the page asset store');
  await one.click('#nav button[data-v=lib]');
  await one.click('#libPanel button:has-text("Share brand")');
  await one.waitForSelector('#ovShare:not([hidden])');
  const link = await one.inputValue('#shareUrl');
  assert.match(link, /#s-[a-z0-9]+$/);

  const two = await openApp(browser, url + '?u=2' + link.slice(link.indexOf('#')), { context: ctx, keepWelcome: true });
  if (await two.isVisible('#ovWelcome')) await two.evaluate('document.getElementById("ovWelcome").hidden = true');
  assert.equal(await two.evaluate('Store.all("post").length'), 0, 'accounts do not see each other\'s work');
  await two.waitForSelector('#ovIncoming:not([hidden]) #inAdd:not([hidden])');
  assert.match(await two.textContent('#inBody'), /Shared by Tester 1/);
  await two.click('#inAdd');
  await two.waitForFunction('Store.all("post").length === 1');
  assert.equal(await two.evaluate('(async()=>{const im=await Store.loadImage(Store.all("post")[0].photo);return im&&im.naturalWidth;})()'), 400);
  assert.deepEqual(one.errors.concat(two.errors), []);
  await ctx.close();
});
