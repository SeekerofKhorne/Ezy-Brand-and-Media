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
async function setMode(page, m) { await page.click('#btnSettings'); await page.click(`#modeSeg button[data-v=${m}]`); await page.click('#ovSettings [data-close]'); }
async function addKw(page, w) { await page.click('#q'); await page.keyboard.type(w); await page.keyboard.press('Enter'); }

test('opens in Simple mode with a starter brand and no errors', async () => {
  const page = await openApp(browser, url, { keepWelcome: true });
  assert.equal(await page.isVisible('#ovWelcome'), true, 'the quick start shows on a first visit');
  await page.click('#ovWelcome [data-close]');
  const s = await page.evaluate('({mode:Store.S.mode,ui:uiMode,brands:Store.all("brand").length,palettes:PALETTES.length,types:TYPESETS.length,formats:FORMATS.length})');
  assert.deepEqual({ mode: s.mode, ui: s.ui, brands: s.brands }, { mode: 'local', ui: 'simple', brands: 1 });
  assert.ok(s.palettes >= 39 && s.types >= 52 && s.formats >= 30);
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
  await addKw(page, 'compassion');
  await page.waitForSelector('#fpOff:not([hidden])');
  assert.match(await page.textContent('#fpOff'), /Compassion \(emotion; no pleasure-arousal-dominance position on file\)/);
  await page.click('#kwChips .chip:has-text("compassion") button');
  await page.waitForSelector('#fpOff', { state: 'hidden' });
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

test('graphics: every graphic has styles that lean apart, picked and stepped through on cards', async () => {
  const page = await openApp(browser, url);
  // the catalog: every graphic but "No graphic" has at least three styles, each one draws and is tagged
  const cat = await page.evaluate(`(()=>{const cv=document.createElement('canvas');cv.width=240;cv.height=150;const ctx=cv.getContext('2d'),c=makeScheme(state.colors,'base');
    return GFAMILIES.map(F=>({fam:F.fam,n:F.vars.length,leans:new Set(F.vars.map(v=>leans(v.id).top.map(L=>L.k).join())).size,
      ok:F.vars.every(v=>{try{drawGraphic(ctx,v.id,{x:0,y:0,w:240,h:150},c,.8,7);return !!TAGS.graphic[v.id];}catch(e){return false;}})}));})()`);
  for (const f of cat) {
    assert.ok(f.ok, f.fam + ' draws every style');
    if (f.fam === 'none') continue;
    assert.ok(f.n >= 3, f.fam + ' has at least three styles');
    assert.ok(f.leans >= 2, f.fam + ' styles lean toward different parts of the fingerprint');
  }
  // the ids saved before styles existed still name the same graphic
  for (const id of ['waves', 'ripples', 'blobs', 'leaves', 'frame', 'bolts', 'checker'])
    assert.equal(await page.evaluate(`GV["${id}"].fam`), id);
  // the picker: one card per graphic; the arrows, dots and arrow keys step through its styles
  await addKw(page, 'calm');
  await page.click('#btnUseKw');
  await page.click('#tabs button[data-v=graphic]');
  await page.waitForSelector('#results .gcard');
  assert.match(await page.textContent('#rSummary'), /graphics match your keywords/);
  await page.click('#btnAll');
  assert.equal(await page.locator('#results .gcard').count(), cat.length);
  const card = '#results .gcard[data-fam=waves]';
  await page.click(card + ' .gpick');
  assert.equal(await page.evaluate('GV[state.graphicId].fam'), 'waves');
  const first = await page.evaluate('state.graphicId');
  await page.click(card + ' .garr >> nth=1');
  const second = await page.evaluate('state.graphicId');
  assert.notEqual(second, first);
  assert.equal(await page.evaluate('GV[state.graphicId].fam'), 'waves', 'the arrows stay inside the graphic');
  await page.focus(card + ' .gpick'); await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate('state.graphicId'), first);
  assert.equal(await page.evaluate('document.activeElement.closest(".gcard").dataset.fam'), 'waves', 'focus stays on the card');
  await page.click(card + ' .gdot >> nth=3');
  assert.equal(await page.evaluate('state.graphicId'), 'waves-deep');
  // the in-use strip shows every style of the graphic, with its fingerprint lean
  assert.equal(await page.locator('#results .gcur .gvar').count(), 4);
  assert.ok(await page.locator('#results .gcur .lean').count() >= 4);
  await page.click('#results .gcur .gvar >> nth=1');
  assert.equal(await page.evaluate('state.graphicId'), 'waves-line');
  // the Aim for filter keeps graphics with a style that leans that way, and shows that style
  await page.click('#subbar .tgtbar button[aria-label="High dominance"]');
  // (the card of the graphic in use keeps showing the style in use)
  const shown = await page.evaluate('[...document.querySelectorAll("#results .gcard:not(.on) .gpick canvas")].map(c=>c.dataset.g)');
  assert.ok(shown.length > 0 && shown.length < cat.length);
  for (const id of shown) assert.ok(await page.evaluate(`leans("${id}").s["d+"] >= LEAN_MIN`), id + ' leans toward high dominance');
  await page.click('#subbar .tgtbar button:has-text("Clear")');
  // the Media page: a graphic chosen for a post leaves the brand's graphic alone
  await page.click('#btnSaveBrand'); await page.waitForFunction('!Lib.isDirty()');
  await toMedia(page);
  await page.click('#rail button[data-p=graphic]');
  await page.waitForSelector('#mgGrid .gcard');
  assert.match(await page.textContent('#mgNote'), /Waves · Fine lines/);
  await page.click('#mgGrid .gcard[data-fam=hearts] .gpick');
  assert.equal(await page.evaluate('GV[state.graphicId].fam'), 'hearts');
  assert.equal(await page.evaluate('Lib.look().graphicId'), 'waves-line');
  assert.equal(await page.evaluate('Lib.isDirty()'), false, 'a post graphic is not a brand change');
  await page.click('#mgBrand');
  assert.equal(await page.evaluate('state.graphicId'), 'waves-line');
  // Shuffle can try another style of the post's graphic (Advanced), and never another graphic
  await setMode(page, 'advanced');
  for (const v of ['layout', 'arrangement', 'colors']) await page.click(`#shuf button[data-v=${v}]`);
  await page.click('#shuf button[data-v=graphic]');
  const seen = new Set();
  for (let i = 0; i < 6; i++) { await page.click('#btnShuffle'); seen.add(await page.evaluate('state.graphicId')); }
  assert.ok(seen.size >= 2, 'Shuffle changed the style');
  for (const id of seen) assert.equal(await page.evaluate(`GV["${id}"].fam`), 'waves');
  await page.screenshot({ path: join(out, 'graphics-media.png') });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Aim for: options are filtered by where they sit on the fingerprint', async () => {
  const page = await openApp(browser, url);
  await addKw(page, 'powerful'); await addKw(page, 'energetic');
  await page.click('#btnUseKw');
  await page.waitForSelector('#bBuild:not([hidden])');
  if (await page.isVisible('#btnAll')) await page.click('#btnAll');
  // every direction has premade palettes leaning toward it
  assert.equal(await page.evaluate('LEANS.filter(L=>PALETTES.filter(p=>itemLean("colors",p)[L.k]>=LEAN_MIN).length<2).map(L=>L.l).join()'), '');
  // several directions at once; an option must lean toward every one of them
  await page.click('#subbar .tgtbar button[aria-label="High arousal"]');
  await page.click('#subbar .tgtbar button[aria-label="High dominance"]');
  assert.deepEqual(await page.evaluate('state.fpTarget'), ['a+', 'd+']);
  const pals = await page.evaluate('PALETTES.filter(p=>tgtFit(itemLean("colors",p)).ok).map(p=>p.id)');
  assert.ok(pals.length >= 2, 'premade palettes reach high arousal and high dominance');
  assert.equal(await page.locator('#results .opt').count(), pals.length);
  assert.equal(await page.locator('#results .opt .tfit').count(), pals.length, 'each card shows its fit');
  // a corner no palette reaches sends the search to single colors
  await page.click('#subbar .tgtbar button:has-text("Clear")');
  await page.click('#subbar .tgtbar button[aria-label="Sincerity"]');
  await page.click('#subbar .tgtbar button[aria-label="High dominance"]');
  assert.equal(await page.locator('#results .opt').count(), 0);
  assert.match(await page.textContent('#results .empty'), /No palette leans toward sincerity and high dominance/);
  await page.click('#results .empty button:has-text("build one color by color")');
  assert.equal(await page.evaluate('state.colorMode'), 'build');
  assert.equal(await page.evaluate('getComputedStyle(document.getElementById("results")).display'), 'block', 'the builder is laid out top to bottom, not in the card grid');
  const hexes = await page.evaluate('[...document.querySelectorAll("#results .swgrid .swatch")].map(b=>b.dataset.hex)');
  assert.ok(hexes.length > 0, 'some single colors lean toward sincerity and high dominance');
  for (const h of hexes) assert.ok(await page.evaluate(`(()=>{const s=colorLean("${h}");return s["sincerity"]>=LEAN_MIN&&s["d+"]>=LEAN_MIN;})()`), h + ' fits the target');
  await page.hover('#results .swgrid .swatch >> nth=0');
  assert.equal(await page.locator('#clive .tfit .lean').count(), 2, 'the color under the pointer shows how far it leans each way');
  // the opposite end of a feeling axis replaces the other
  await page.click('#subbar .tgtbar button[aria-label="Low dominance"]');
  assert.deepEqual(await page.evaluate('state.fpTarget'), ['sincerity', 'd-']);
  // type pairings: filtered the same way, closest first, each card showing its fit
  await page.click('#tabs button[data-v=type]');
  const want = await page.evaluate('listedTypes().map(t=>tgtFit(itemLean("type",t))).filter(f=>f.ok).length');
  assert.ok(want > 0);
  assert.equal(await page.locator('#results .opt').count(), want);
  assert.equal(await page.locator('#results .opt .tfit').count(), want);
  const means = await page.evaluate('[...document.querySelectorAll("#results .opt .tfit")].map(d=>[...d.children].reduce((a,c)=>a+parseInt(c.textContent.match(/(\\d+)%/)[1]),0))');
  for (let i = 1; i < means.length; i++) assert.ok(means[i] <= means[i - 1] + 2, 'closest first');
  // the keywords' own strongest directions (powerful, energetic: high dominance and high arousal)
  await page.click('#subbar .tgtbar button:has-text("Match my keywords")');
  assert.deepEqual(await page.evaluate('state.fpTarget'), ['a+', 'd+']);
  await page.click('#subbar .tgtbar button:has-text("Clear")');
  assert.deepEqual(await page.evaluate('state.fpTarget'), []);
  // the old one-direction graphics filter carries over from a saved state
  assert.deepEqual(await page.evaluate('sane({gLean:"d+"}).fpTarget'), ['d+']);
  assert.deepEqual(await page.evaluate('sane({fpTarget:["a+","a-","zz"]}).fpTarget'), ['a+']);
  await page.screenshot({ path: join(out, 'aim-for.png') });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('a saved palette can be deleted from the Saved palettes row, and the delete can be undone', async () => {
  const page = await openApp(browser, url);
  await page.click('#bStep2');
  await page.waitForSelector('#bBuild:not([hidden])');
  await page.click('#tabs button[data-v=colors]');
  await page.evaluate('Lib.savePalette("Keep me")');
  await page.evaluate('Lib.savePalette("Delete me")');
  const saved = () => page.evaluate('(Store.get("brand",state.bid).palettes||[]).map(p=>p.name)');
  assert.deepEqual(await saved(), ['Delete me', 'Keep me']);
  // the delete is written at once, without Save brand
  await page.click('#savedPals .paldel[aria-label="Delete palette Delete me"]');
  await page.waitForFunction('!(Store.get("brand",state.bid).palettes||[]).some(p=>p.name==="Delete me")');
  assert.deepEqual(await saved(), ['Keep me']);
  assert.equal(await page.locator('#savedPals .palpick').count(), 1);
  assert.equal(await page.evaluate('PALETTES.some(p=>p.mine&&p.name==="Delete me")'), false, 'it leaves the palette list too');
  assert.equal(await page.evaluate('Lib.isDirty()'), false);
  // Undo puts it back in the same place
  assert.match(await page.textContent('#bStatus'), /Deleted .Delete me./, 'the message shows on the Brand page');
  await page.click('#bStatus button:has-text("Undo")');
  await page.waitForFunction('(Store.get("brand",state.bid).palettes||[]).length === 2');
  assert.deepEqual(await saved(), ['Delete me', 'Keep me']);
  assert.equal(await page.locator('#savedPals .palpick').count(), 2);
  assert.deepEqual(page.errors, []);
});

test('palettes are four colors: combination filter, Canva palettes, fingerprint percentages and the color wheel', async () => {
  const page = await openApp(browser, url);
  await page.click('#bStep2');
  await page.waitForSelector('#bBuild:not([hidden])');
  // four roles; the panel tint is worked out, and every premade palette has readable text
  assert.deepEqual(await page.evaluate('ROLES.map(r=>r[0])'), ['bg', 'primary', 'accent', 'text']);
  assert.equal(await page.locator('#results .opt >> nth=0').locator('.vis.sw i').count(), 4);
  assert.equal(await page.evaluate('PALETTES.filter(p=>contrast(p.text,p.bg)<4.5||!validHex(p.surface)).length'), 0);
  // Canva's combinations: roles come from the rule, and a combination with no readable text pair is left out
  assert.ok(await page.evaluate('PALETTES.filter(p=>p.canva).length') >= 50);
  assert.deepEqual(await page.evaluate('(()=>{const r=assignRoles(["#001A27","#063852","#F0810F","#E6DF44"]);return [r.bg,r.text,r.primary,r.accent];})()'), ['#001A27', '#E6DF44', '#F0810F', '#063852']);
  assert.equal(await page.evaluate('assignRoles(["#FA8866","#FF420E","#80BD9E","#89DA59"])'), null);
  assert.equal(await page.evaluate('TAGS.palette["canva-11"]'), undefined, 'a combination without a readable text pair is not listed');
  assert.equal(await page.evaluate('SRC[TAGS.palette["canva-16"].tags.power.reasons.find(r=>/Canva/.test(r.why)).src].t'), 'C', "Canva's theme is a convention");
  // combination types are read from hue angles
  const combo = c => page.evaluate(`comboOf(${JSON.stringify(c)})`);
  assert.equal(await combo({ bg: '#FFFFFF', primary: '#1F5FA8', accent: '#6FA8E8', text: '#12243A' }), 'mono');
  assert.equal(await combo({ bg: '#FFFFFF', primary: '#1F5FA8', accent: '#2BB3A3', text: '#111111' }), 'analogous');
  assert.equal(await combo({ bg: '#FFFFFF', primary: '#1F5FA8', accent: '#E08A1F', text: '#111111' }), 'complementary');
  assert.equal(await combo({ bg: '#FFFFFF', primary: '#1D4FB8', accent: '#D8262B', text: '#1F4D1B' }), 'triadic');
  assert.equal(await combo({ bg: '#FFFFFF', primary: '#3D3D3D', accent: '#8C8C8C', text: '#111111' }), 'neutral');
  // the filter shows only palettes of the chosen type, and every type has some
  for (const [k, label] of [['mono', 'Monochromatic'], ['analogous', 'Analogous'], ['complementary', 'Complementary'], ['triadic', 'Triadic']]) {
    await page.click(`#subbar .cmbbar button:has-text("${label}")`);
    const want = await page.evaluate(`PALETTES.filter(p=>comboKey(p)==="${k}").length`);
    assert.ok(want >= 4, label + ' has premade palettes');
    assert.equal(await page.locator('#results .opt').count(), want);
    assert.deepEqual(await page.evaluate('[...new Set([...document.querySelectorAll("#results .opt .cmb")].map(x=>x.textContent))]'), [label]);
  }
  await page.click('#subbar .cmbbar button:has-text("Dark")');
  const dark = await page.evaluate('PALETTES.filter(p=>comboKey(p)==="triadic"&&groundOf(p)==="dark").map(p=>p.id)');
  assert.equal(await page.locator('#results .opt').count(), dark.length);
  assert.match(await page.textContent('#rSummary'), /dark-ground triadic palette/);
  await page.click('#subbar .cmbbar button:has-text("Clear")');
  assert.deepEqual(await page.evaluate('[state.combo,state.ground]'), ['all', 'any']);
  // work saved with a panel color keeps it; work without one gets one; the old Panel role falls back to Primary
  assert.equal(await page.evaluate('sane({colors:{bg:"#FFFFFF",surface:"#123456",primary:"#1F5FA8",accent:"#2BB3A3",text:"#111111"}}).colors.surface'), '#123456');
  assert.equal(await page.evaluate('validHex(sane({colors:{bg:"#FFFFFF",primary:"#1F5FA8",accent:"#2BB3A3",text:"#111111"}}).colors.surface)'), true);
  assert.equal(await page.evaluate('sane({buildRole:"surface"}).buildRole'), 'primary');
  // pointing at any color shows its fingerprint as percentages
  await page.hover('#results .opt >> nth=0 >> .vis.sw i >> nth=1');
  await page.waitForSelector('#ctip:not([hidden])');
  assert.equal(await page.locator('#ctip .fpb').count(), 8);
  assert.equal(await page.locator('#ctip .fpmini svg').count(), 1);
  const tipHex = await page.textContent('#ctip .cihead b');
  assert.deepEqual(await page.evaluate('[...document.querySelectorAll("#ctip .fpb .fv")].map(x=>x.textContent)'), await page.evaluate(`fpPct(tagColor("${tipHex}").tags).map(fpVal)`));
  assert.match(await page.textContent('#ctip .cihead'), /family · used as primary/);
  // the same numbers as the Aim for filter
  assert.equal(await page.evaluate(`(()=>{const p=fpPct(tagColor("${tipHex}").tags),s=colorLean("${tipHex}");return LEANS.every(L=>{const a=p[L.i],v=L.d?(a.dir===L.d?a.pct:0):a.pct;return Math.abs(v-Math.round(s[L.k]*100))<=1;});})()`), true);
  await page.mouse.move(5, 5);
  await page.waitForSelector('#ctip', { state: 'hidden' });
  // build your own: four roles, the current color's percentages, and the combination the four colors make
  await page.click('#subbar button:has-text("Build your own")');
  assert.equal(await page.locator('#results .roles .role').count(), 4);
  assert.equal(await page.locator('#cinfo .fpb').count(), 8);
  assert.match(await page.textContent('#cmbNow'), /These four colors make a \w+( \w+)? combination/);
  // the color wheel: a large button opens it in the page
  const wb = await page.locator('#bWheel').boundingBox();
  assert.ok(wb.height >= 44 && wb.width >= 44, 'the wheel button is a comfortable target');
  await page.click('#bWheel');
  await page.waitForSelector('#wheelPanel');
  assert.equal(await page.locator('#wheelFp .fpb').count(), 8);
  await page.evaluate('(()=>{const r=document.getElementById("wheelV");r.value=90;r.dispatchEvent(new Event("input"));r.dispatchEvent(new Event("change"));})()');
  assert.ok(Math.abs(await page.evaluate('hexToHsv(state.colors.primary).v') - 0.9) < 0.02, 'brightness applies');
  const before = await page.evaluate('state.colors.primary');
  let box = await page.locator('#wheelCv').boundingBox();
  // pointing previews the color under the pointer without changing the palette
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.3);
  assert.equal(await page.textContent('#wheelPanel .wwho'), 'Under the pointer');
  const hov = await page.textContent('#wheelHex');
  assert.notEqual(hov, before);
  assert.deepEqual(await page.evaluate('[...document.querySelectorAll("#wheelFp .fpb .fv")].map(x=>x.textContent)'), await page.evaluate(`fpPct(tagColor("${hov}").tags).map(fpVal)`), 'the percentages follow the pointer');
  assert.equal(await page.evaluate('state.colors.primary'), before);
  // pressing and dragging chooses; letting go applies it to the role and works out the panel tint again
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.7, { steps: 5 });
  assert.equal(await page.textContent('#wheelPanel .wwho'), 'Selected');
  await page.mouse.up();
  await page.waitForFunction(`state.colors.primary!=="${before}"`);
  const picked = await page.evaluate('state.colors.primary');
  assert.equal(await page.textContent('#wheelHex'), picked);
  assert.equal(await page.evaluate('hueFamily(state.colors.primary)'), 'blue', 'lower left of the wheel is blue');
  assert.equal(await page.evaluate('state.colors.surface===autoPanel(state.colors.bg,state.colors.primary,state.colors.text)'), true);
  assert.equal(await page.evaluate('document.activeElement.id'), 'wheelCv', 'the wheel keeps keyboard focus after a pick');
  // arrow keys move the hue
  await page.keyboard.press('Shift+ArrowRight');
  await page.waitForFunction(`state.colors.primary!=="${picked}"`);
  assert.ok(Math.abs(await page.evaluate(`(()=>{let d=hexToHsv(state.colors.primary).h-hexToHsv("${picked}").h;return (d+360)%360;})()`) - 15) < 3);
  // partners can be limited to one relationship with the primary
  await page.click('#results .roles .role >> nth=2');
  await page.click('#subbar .cmbbar button:has-text("Complementary")');
  const parts = await page.evaluate('[...document.querySelectorAll("#results .optgrid .opt .nm")].map(x=>x.textContent.trim())');
  assert.ok(parts.length > 0, 'complementary partners are offered for the accent');
  for (const h of parts) assert.ok(await page.evaluate(`(()=>{let d=Math.abs(hexToHsv("${h}").h-hexToHsv(state.colors.primary).h);if(d>180)d=360-d;return d>=170;})()`), h + ' is opposite the primary');
  assert.equal(await page.evaluate('[...document.querySelectorAll("#results .swgrid .swatch")].every(b=>relToPrimary(b.dataset.hex)==="complementary")'), true);
  await page.click('#subbar .cmbbar button:has-text("Clear")');
  await page.screenshot({ path: join(out, 'color-wheel.png') });
  // Advanced: the fine-tune swatches open the same wheel for their role
  await setMode(page, 'advanced');
  await page.click('#bWheel');
  assert.equal(await page.locator('#wheelPanel').count(), 0);
  assert.equal(await page.locator('#colors .cfield').count(), 4);
  await page.evaluate('document.getElementById("accFine").open=true');
  await page.click('#c_text');
  assert.deepEqual(await page.evaluate('[state.buildRole,!!document.getElementById("wheelPanel")]'), ['text', true]);
  // Media: the Brand panel shows the post's four colors, each with its percentages
  await toMedia(page);
  await page.click('#rail button[data-p=brand]');
  assert.equal(await page.locator('#mPostCols .pcol').count(), 4);
  await page.hover('#mPostCols .pcol >> nth=1');
  await page.waitForSelector('#ctip:not([hidden])');
  assert.equal(await page.locator('#ctip .fpb').count(), 8);
  // the graphics count follows Aim for with no keywords
  await toBrand(page);
  await page.click('#tabs button[data-v=graphic]');
  await page.click('#subbar .tgtbar button[aria-label="Ruggedness"]');
  assert.equal(await page.textContent('#nGraphic'), String(await page.locator('#results .gcard').count()));
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
  // the brand look is one click away, in the Brand panel
  await page.click('#rail button[data-p=brand]');
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
  await setMode(page, 'advanced');
  await toMedia(page);
  await page.click('#rail button[data-p=adjust]');
  for (const id of ['#accAdv', '#advBar']) assert.equal(await page.isVisible(id), true, id + ' shows in Advanced mode');
  assert.equal(await page.isVisible('.stepline'), false);
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
  await setMode(page, 'simple');
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

test('settings: Neon Noir by default, themes persist, and the preview stays neutral gray', async () => {
  const page = await openApp(browser, url);
  assert.equal(await page.evaluate('document.documentElement.dataset.theme'), 'noir');
  const neutral = async () => page.evaluate('(()=>{const c=getComputedStyle(document.getElementById("pvStage")).backgroundColor.match(/\\d+/g).map(Number);return Math.max(...c.slice(0,3))-Math.min(...c.slice(0,3));})()');
  assert.ok(await neutral() <= 6, 'the preview stage is neutral in Neon Noir');
  await page.click('#btnSettings');
  assert.equal(await page.getAttribute('#themeSeg button[data-v=noir]', 'aria-pressed'), 'true');
  await page.click('#themeSeg button[data-v=graphite]');
  assert.equal(await page.evaluate('document.documentElement.dataset.theme'), 'graphite');
  assert.ok(await neutral() <= 6, 'and in Graphite');
  // help moved into settings
  await page.click('#btnHelp');
  assert.equal(await page.isVisible('#ovWelcome'), true);
  assert.equal(await page.isVisible('#ovSettings'), false);
  await page.evaluate('document.getElementById("ovWelcome").hidden=true');
  await page.reload();
  await page.waitForFunction('typeof Store !== "undefined" && Store.S.ready && !!state.bid');
  assert.equal(await page.evaluate('document.documentElement.dataset.theme'), 'graphite');
  await page.screenshot({ path: join(out, 'theme-graphite.png') });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Media: the tool rail, and Shuffle stays inside the brand', async () => {
  const page = await openApp(browser, url);
  await toMedia(page);
  assert.equal(await page.isVisible('#plats'), true, 'Layouts is the first panel');
  await page.click('#rail button[data-p=text]');
  assert.equal(await page.isVisible('#plats'), false);
  await page.fill('#fields textarea >> nth=0', 'Rail headline');
  assert.equal(await page.isVisible('#rail button[data-p=adjust]'), false, 'Adjust is an Advanced panel');
  const before = await page.evaluate('[state.typeId,state.graphicId]');
  for (let i = 0; i < 5; i++) await page.click('#btnShuffle');
  assert.deepEqual(await page.evaluate('[state.typeId,state.graphicId]'), before, 'Shuffle never changes the brand type or graphic');
  // the Layout arrows under the canvas step through the format's layouts and wrap around
  const lays = await page.evaluate('FMT[state.format].layouts'), at = await page.evaluate('state.layout');
  await page.click('#btnNext');
  assert.equal(await page.evaluate('state.layout'), lays[(lays.indexOf(at) + 1) % lays.length]);
  await page.click('#btnPrev'); await page.click('#btnPrev');
  assert.equal(await page.evaluate('state.layout'), lays[(lays.indexOf(at) - 1 + lays.length) % lays.length]);
  await page.click('#draftCheck summary');
  assert.match(await page.textContent('#dSum'), /contrast/);
  // Templates and Layer editor are two modes of the Media page
  await page.click('#mediaMode button[data-v=free]');
  assert.equal(await page.evaluate('Lib.view'), 'free');
  assert.equal(await page.getAttribute('#nav button[data-v=design]', 'aria-pressed'), 'true');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('Library: folders organize posts, and a post copies to another brand in that brand\'s look', async () => {
  const page = await openApp(browser, url);
  await toMedia(page);
  await page.selectOption('#postFolder', '__new');
  await page.fill('#askIn', 'Spring launch');
  await page.click('#askOk');
  await page.waitForFunction('document.getElementById("postFolder").value === "Spring launch"');
  await page.fill('#postName', 'Teaser');
  await page.click('#btnSave');
  await page.waitForFunction('/^Saved “Teaser”/.test(document.getElementById("status").textContent)');
  assert.equal(await page.evaluate('Store.all("post")[0].folder'), 'Spring launch');
  await page.fill('#postName', 'Loose post');
  await page.selectOption('#postFolder', '');
  await page.click('#btnSaveNew');
  await page.waitForFunction('Store.all("post").length === 2');
  // a second brand with a different look
  await page.evaluate('Lib.setView("lib")');
  await page.click('#libBrands button:has-text("New brand")');
  await page.fill('#askIn', 'Night shop');
  await page.click('#askOk');
  await page.waitForFunction('Store.all("brand").length === 2 && Lib.view === "brand"');
  await page.click('#bStep2');
  await page.click('#results .opt >> nth=5');
  await page.click('#btnSaveBrand');
  await page.waitForFunction('!Lib.isDirty()');
  const night = await page.evaluate('({id:state.bid,primary:Store.get("brand",state.bid).colors.primary})');
  // back to the first brand's library page
  await page.evaluate('Lib.setView("lib")');
  await page.click('#libBrands .bcard:has-text("Northfield")');
  await page.click('.fchip:has-text("Spring launch")');
  assert.equal(await page.locator('#libPanel .pcard').count(), 1, 'the folder shows its one post');
  assert.ok((await page.locator('#libPanel .fbar').boundingBox()).height >= 28, 'the folder row is not clipped');
  await page.click('.fchip:has-text("No folder")');
  assert.equal(await page.locator('#libPanel .pcard').count(), 1);
  await page.click('.fchip:has-text("All posts")');
  await page.selectOption('#libPanel select[aria-label="Copy Teaser to another brand"]', night.id);
  await page.waitForFunction('Store.all("post").length === 3');
  const r = await page.evaluate(`(()=>{const ps=Store.all("post");const o=ps.find(p=>p.name==="Teaser"&&p.bid!==${JSON.stringify(night.id)}),c=ps.find(p=>p.bid===${JSON.stringify(night.id)});return {orig:o.s.colors.primary,origFolder:o.folder,copy:c.s.colors.primary,name:c.s.brandName,folder:c.folder};})()`);
  assert.equal(r.copy, night.primary, 'the copy takes the other brand\'s colors');
  assert.notEqual(r.orig, night.primary, 'the original keeps its own');
  assert.deepEqual([r.name, r.folder, r.origFolder], ['Night shop', '', 'Spring launch'], JSON.stringify(r));
  // deleting a folder keeps its posts
  await page.click('.fchip:has-text("Spring launch")');
  await page.click('#libPanel button:has-text("Delete folder")');
  await page.click('#libPanel button:has-text("Confirm delete")');
  await page.waitForFunction('!(Store.get("brand",state.bid).folders||[]).length');
  assert.equal(await page.evaluate('Store.all("post").filter(p=>p.name==="Teaser").length'), 2);
  await page.screenshot({ path: join(out, 'library-folders.png') });
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('exports are real files at the platform size', async () => {
  const page = await openApp(browser, url);
  await toMedia(page);
  const png = await download(page, () => page.click('#btnExport'));
  assert.match(png.name, /facebook-feed-post-4-5-1080x1350\.png$/);
  assert.deepEqual(pngSize(png.data), { png: true, w: 1080, h: 1350 });
  await setMode(page, 'advanced');
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
  await setMode(page, 'advanced');
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
  await toMedia(page);
  await page.click('#mediaMode button[data-v=free]');
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
  const zip = await JSZip.loadAsync(kit.data);
  assert.deepEqual(Object.keys(JSON.parse(await zip.file('colors/tokens.json').async('string')).color), ['background', 'primary', 'accent', 'text'], 'the kit lists the four palette colors');
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

test('switching brands empties the photo and logo pickers, and a late image load does not land in the new brand', async () => {
  const page = await openApp(browser, url);
  await page.evaluate(async () => { const d = defaults('sample'); await Store.put('brand', { id: 'b2', name: 'Second', handle: '', query: '', typeId: d.typeId, graphicId: d.graphicId, gStrength: .55, paletteId: d.paletteId, colors: d.colors, palettes: [], types: [], content: d.content, logo: null }); });
  await page.reload(); await page.waitForFunction('Store.S.ready && !!state.bid');
  if (await page.isVisible('#ovWelcome')) await page.click('#ovWelcome [data-close]');
  await toMedia(page); await page.click('#rail button[data-p=photo]');
  await page.setInputFiles('#inPhoto', fixture('photo.jpg'));
  await page.waitForFunction('!!photoImg');
  const other = await page.evaluate('Store.all("brand").find(b=>b.id!==state.bid).id');
  await page.selectOption('#brandSel', other);
  await page.waitForFunction(id => state.bid === id, other);
  assert.equal(await page.evaluate('document.querySelector("#inPhoto").files.length'), 0, 'the old file is no longer shown as chosen');
  assert.equal(await page.evaluate('photoImg'), null);
  // the same file can be chosen again in the new brand
  await page.setInputFiles('#inPhoto', fixture('photo.jpg'));
  await page.waitForFunction('!!photoImg');
  // a photo still loading when the brand changes is dropped
  const back = await page.evaluate('Store.all("brand").find(b=>b.id!==state.bid).id');
  await page.evaluate(() => { const i = document.querySelector('#inPhoto'); i.value = ''; });
  await page.setInputFiles('#inPhoto', fixture('photo.jpg'));
  await page.selectOption('#brandSel', back);
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate('photoImg'), null, 'a photo picked in one brand does not appear in another');
  assert.deepEqual(page.errors, []);
});
