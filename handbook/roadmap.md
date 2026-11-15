# Roadmap and open questions

Nothing here is promised. It records what is known to be missing or unverified, so nobody mistakes it for finished.

## Not yet verified

- **PDF import on real exports.** The importer is tested on a generated sample. It needs trying on PDFs downloaded from Canva, Adobe Express, Figma and PowerPoint, with notes on what breaks (grouped shapes, gradients, masked images, rotated text).
- **Canva Brand Kit Builder.** The guidelines PDF is written to be machine-readable, but how much Canva extracts from it has not been measured.
- **Browsers.** Tests run in Chromium only. Firefox and Safari need a manual pass, especially letter spacing on canvas, font loading and downloads on iOS.
- **Small screens.** The layout stacks below 1060 px, but the Layer editor is not designed for touch.
- **Accessibility.** Controls are labelled and keyboard reachable, and the Layer editor has keyboard editing, but there has been no screen-reader pass.

## Decisions for the owner

- **License.** Until one is added, others cannot legally reuse the code. MIT and Apache-2.0 are the usual permissive choices; GPL or AGPL keep derivatives open.
- **Accounts.** A stand-alone copy has none, by design. Real accounts and link sharing need a backend (a hosted database with sign-in, for example Supabase or Firebase) and someone to own its cost, privacy policy and abuse handling. `src/store.js` is the single place to add it.

## Ideas, roughly in order of value

1. Photo layer controls in the Layer editor (crop, mask to a rounded shape).
2. Multi-page documents: carousels as one post with several slides.
3. More Advanced options on the Media page: text alignment, logo position, a second graphic.
4. Custom formats on the Media page (any size, with user-defined safe zones).
5. Import a brand from a website address or a logo (extract colors, suggest the nearest palette roles).
6. Group, align and distribute in the Layer editor; shape layers beyond rectangles.
7. Split `src/` into ES modules and add unit tests for the engine's rules.
8. Translations.
