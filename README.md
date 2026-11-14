# Ezy Brand and Media

A browser app for trying brand colors, type and graphics on social media post templates before you commit to them.

You describe a brand in a few words ("calm, trustworthy"). The app ranks palettes, single colors, type pairings and graphics that fit those words, and shows each choice on a real post size for Facebook, Instagram, TikTok, YouTube, LinkedIn, X or Pinterest. Every suggestion names the study, standard or convention it rests on, so you can judge how much weight to give it.

It runs entirely in the browser. There is no server, no sign-up and no tracking. Your work is stored on your own device.

## What it does

- **Templates** for 33 formats across seven platforms, with safe-zone guides and ten layouts.
- **Keyword search** over 49 ideas (brand personality, emotions, values, styles, topics), each linked to colors, type and graphics by a rule with a named source.
- **Color**: 28 ready-made palettes, or build one color at a time with partners that suit your primary and match your keywords. Contrast is checked against WCAG 2.2.
- **Type**: 52 ready-made pairings from 56 bundled open-licensed typefaces.
- **Brands and posts**: save named palettes, pairings, a logo and any number of posts under a brand. Keep several brands.
- **Layer editor**: import a PDF (for example, one downloaded from Canva) or an image and edit it as layers, or start from a blank canvas.
- **Export**: PNG at the exact platform size; a brand kit ZIP (guidelines PDF, palette files, wordmark, fonts) that tools such as Canva's Brand Kit can take in.
- **Sharing without accounts**: save a brand or a post as one file, images included, and send it to someone. They open it in their own copy.

### Simple and Advanced

The switch at the top of the page changes how many controls are shown. It never changes what a post contains.

| | Simple | Advanced |
|---|---|---|
| Templates, keywords, palettes, color builder, type pairings, graphics | Yes | Yes |
| Numbered steps and a shorter toolbar | Yes | |
| Build your own type pairing from any two bundled faces | | Yes |
| All five hex values at once, graphic strength | | Yes |
| Headline and supporting text size, capitals | | Yes |
| Photo focal point, tint strength, shade behind text | | Yes |
| Hide the brand mark or the handle | | Yes |
| Export JPG, or every size for a platform as a ZIP | | Yes |
| Edit as layers: turn a template post into editable layers | | Yes |
| Choose what Shuffle changes | | Yes |

More detail is in the [user guide](handbook/user-guide.md). How keyword search works, and what was tried, is in [keyword search](handbook/keyword-search.md).

## Use it

**Without installing anything.** If this repository has GitHub Pages turned on (Settings → Pages → Deploy from a branch → `main`, folder `/docs`), the app is live at `https://<owner>.github.io/<repository>/`.

**On your own computer.** You need [Node.js](https://nodejs.org) 20 or newer.

```
git clone https://github.com/SeekerofKhorne/Ezy-Brand-and-Media.git
cd Ezy-Brand-and-Media
npm install
npm start
```

Then open http://localhost:5173/ in your browser.

The built app is also checked in under `docs/`, so any static file server can serve that folder as it is, with no build step (`python3 -m http.server --directory docs 5173` works). Opening `docs/index.html` by double-click does not fully work: browsers block the PDF importer and the brand kit from loading their files off `file://`.

## Work on it

```
npm run dev     # serve on localhost:5173 and rebuild when a file in src/ changes
npm run build   # rebuild docs/ once
npm test        # build, then run the browser tests
```

The tests drive a real browser with [Playwright](https://playwright.dev). The first time, either run `npx playwright install chromium`, or point the tests at a Chrome you already have: `CHROME_PATH=/path/to/chrome npm test`.

There is no framework and no bundler. `scripts/build.mjs` joins the files in `src/` into one page and copies the fonts and three libraries next to it. Start with [handbook/architecture.md](handbook/architecture.md) for a map of the code, and [CONTRIBUTING.md](CONTRIBUTING.md) for the rules that keep the research claims honest.

Rebuild before you commit: `docs/` is what people download and what GitHub Pages serves.

## Where your work is kept

In the browser's own storage (IndexedDB) for the address you opened the app at. That means:

- Work saved at `localhost:5173` and work saved on the GitHub Pages address are separate.
- Clearing the browser's site data removes it. Use **Brands and posts → Back up everything** to keep a file.
- Nothing leaves your device unless you export or share a file yourself.

The storage code also supports running as a hosted page with sign-in and share links (see the architecture notes). A stand-alone copy does not use that path.

## Limits worth knowing

- The research behind the associations covers colors, typefaces and simple shapes one at a time, mostly with North American and European participants. Nothing here predicts how a finished post will perform. Test finalists with the real audience.
- Platform sizes and safe zones come from third-party guides and change without notice. Re-check a size before producing final files.
- PDF import recovers live text, images and shapes. A flattened PDF has no text to recover, and typefaces that are not bundled are replaced with the nearest one and listed.
- The guidelines PDF is written so Canva's Brand Kit Builder can read it. How much that tool picks up is Canva's decision.

## License

No license has been chosen for this project's own code yet, so by default it is not licensed for reuse. Bundled fonts and libraries keep their own licenses: see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
