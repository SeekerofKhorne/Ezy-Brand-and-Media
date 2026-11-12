# Contributing

## Set up

```
npm install
npm run dev
```

Edit files in `src/`, reload the page. Before you commit, run `npm test` (it rebuilds `docs/` first) and commit the rebuilt `docs/` with your change.

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
