# Contributing

Most people never need this page: the app is live at https://seekerofkhorne.github.io/Ezy-Brand-and-Media/. This is for changing the code.

## What is in this repository

| Folder or file | What it is |
|---|---|
| `src/` | The app's source: page layout, styles, and the code. Edit here. |
| `docs/` | The built app, made from `src/` by the build. GitHub Pages serves this folder as the live site. Never edit it by hand; rebuild instead. (GitHub only lets Pages serve a folder called `docs` or the top level, hence the name.) |
| `handbook/` | Documentation: how the code fits together, the user guide, keyword search, the roadmap. |
| `scripts/` | The build (`build.mjs`) and a small local web server (`serve.mjs`). |
| `tests/` | Browser tests that open the built app and use it. |
| `tools/` | Occasional jobs that are not part of the app: the keyword review list and the meaning-matching experiment. See `handbook/keyword-search.md`. |
| `app.config.json` | The app's name and short name. |

## Run it on your own computer

You need [Node.js](https://nodejs.org) 20 or newer. In a terminal:

```
git clone https://github.com/SeekerofKhorne/Ezy-Brand-and-Media.git
cd Ezy-Brand-and-Media
npm install
npm start
```

Then open http://localhost:5173/. Work saved there is separate from work saved on the live site, because the browser stores it per address.

`docs/` can also be served as it is by any static file server (`python3 -m http.server --directory docs 5173`). Opening `docs/index.html` by double-click does not fully work: browsers block the PDF importer and the brand kit from loading their files off `file://`.

## Make a change

```
npm run dev     # serve on localhost:5173 and rebuild when a file in src/ changes
npm run build   # rebuild docs/ once
npm test        # build, then run the browser tests
```

The tests drive a real browser with [Playwright](https://playwright.dev). The first time, either run `npx playwright install chromium`, or point the tests at a Chrome you already have: `CHROME_PATH=/path/to/chrome npm test`.

Commit the rebuilt `docs/` with your change: it is what the live site serves. Changes go to `main` through a pull request, and GitHub runs the tests on every pull request.

There is no framework and no bundler. `scripts/build.mjs` joins the files in `src/` into one page and copies the fonts, icons and three libraries next to it. Start with [handbook/architecture.md](handbook/architecture.md) for a map of the code.

## Ground rules

**1. Every association needs a source and a tier.**
The point of the app is that a suggestion can be traced. A palette, color, pairing or graphic gets its tags from a rule in `src/engine.js`, and every rule names an entry in `SRC` (`src/data.js`) with one of three tiers:

- `R` research: a peer-reviewed study measured the link.
- `S` standard: a published specification or a platform's own requirement.
- `C` convention: common practice that nobody in the index tested.

If you add a link you cannot source, label it `C` and say so in its `why` text. Do not raise a tier to make a result look stronger. If a study only partly supported a link, give it a reduced weight and say that in the text, as the existing rules do.

**2. Tag by feature, not by hand.**
Add a palette or a type pairing by describing it (its colors; its design features in `f`), and let the rules derive the tags. The `conv` field is the only place for a hand-assigned link, and those are always shown as conventions.

**3. Simple stays simple.**
A new control goes in Advanced unless a first-time user needs it to finish a post. Mark Advanced-only markup with the class `adv`, and Simple-only guidance with `simple-only`. Switching modes must never change what a post looks like.

**4. Saved work must keep opening.**
Brands and posts are stored as plain objects, and people keep backup files for a long time. Add fields with safe defaults (see `sane()` in `src/ui.js`); do not rename or repurpose existing ones.

**5. Copy is part of the product.**
Sample text must not make result claims. Write labels for someone who has never used a design tool.

## Common changes

| To add | Edit |
|---|---|
| A palette | `PALETTES` in `src/data.js` |
| A platform format or safe zone | `FORMATS` in `src/data.js` (cite the guide in `SRC`) |
| A typeface | `npm install -D @fontsource/<name>`, then `scripts/fonts.mjs`, then a pairing in `src/types.js` |
| A type pairing | `TYPESETS` in `src/types.js` |
| A graphic | the `G` object in `src/draw.js` and `GRAPHICS` in `src/data.js` |
| A layout | the `L` object in `src/draw.js`, `LAYOUTS` and each format's `layouts` list in `src/data.js` |
| A keyword or idea | `src/concepts.js` |
| A tagging rule | `src/engine.js` (and its source in `SRC`) |
| An Advanced option | `ADV_DEFAULTS`, `sane()`, `snap()` and `syncAdv()` in `src/ui.js`, the markup in `src/body.html`, the drawing in `src/draw.js` |

A new layout should draw its text through `drawFit`, `pill`, `chip` and `brandRow`, so that **Edit as layers** can lift that text onto layers without extra work.

## Tests

`tests/app.test.mjs` runs the built app in a browser. Add a test when you add a feature someone could break without noticing: anything that saves, exports, imports or converts.
