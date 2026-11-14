# Ezy Brand and Media

A browser app for trying brand colors, type and graphics on social media post templates before you commit to them.

**Open the app: https://seekerofkhorne.github.io/Ezy-Brand-and-Media/**

Nothing to install, no sign-up, no tracking. It runs in your browser and keeps your work on your own device.

## Start here

1. **Open the link above** and bookmark it. That is the whole app, always the latest version.
2. **Optional: give it its own icon**, so it opens like a normal app in its own window.
   - **Chrome or Edge (Mac or PC):** click the install icon at the right end of the address bar, or look for **Install** in the browser menu.
   - **Safari on a Mac:** **File → Add to Dock**.
   - **iPhone or iPad:** **Share → Add to Home Screen**.
   - **Android:** browser menu → **Add to Home screen** or **Install app**.
3. **Describe a brand** in a few words ("calm, trustworthy") and pick from the palettes, type and graphics it suggests.

### Where your work is saved

In the browser you made it in, on that device. Some things to know:

- **Back it up.** Clearing the browser's site data deletes it. Use **Brands and posts → Back up everything** now and then, and keep the file.
- **Each browser keeps its own copy.** Work made in Chrome does not appear in Safari. On a Mac, the Safari Dock icon also keeps its own copy, separate from Safari tabs. Pick one place to work, and move work between places with a backup file.
- **Sharing:** save a brand or a post as a file and send it. The other person opens it in their own copy.

## How changes reach the app

1. You ask Claude for a change.
2. Claude makes it, runs the tests, and opens a **pull request** on GitHub.
3. You open the pull request, look it over, and click **Merge pull request**, then **Confirm merge**.
4. About a minute later the app at the link above has the change. Reload the page (or close and reopen the installed app) to see it.

Nothing goes live until you merge, and every merged change can be undone on GitHub.

## What it does

- **Templates** for 33 formats across seven platforms, with safe-zone guides and ten layouts.
- **Keyword search** over 49 ideas (brand personality, emotions, values, styles, topics), reached through about 2,900 keywords and each linked to colors, type and graphics by a rule with a named source.
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

## Limits worth knowing


- The research behind the associations covers colors, typefaces and simple shapes one at a time, mostly with North American and European participants. Nothing here predicts how a finished post will perform. Test finalists with the real audience.
- Platform sizes and safe zones come from third-party guides and change without notice. Re-check a size before producing final files.
- PDF import recovers live text, images and shapes. A flattened PDF has no text to recover, and typefaces that are not bundled are replaced with the nearest one and listed.
- The guidelines PDF is written so Canva's Brand Kit Builder can read it. How much that tool picks up is Canva's decision.

## For developers

Running the app on your own computer, building, testing, and a map of the folders are in [CONTRIBUTING.md](CONTRIBUTING.md). The code is described in [handbook/architecture.md](handbook/architecture.md).

## License

No license has been chosen for this project's own code yet, so by default it is not licensed for reuse. Bundled fonts and libraries keep their own licenses: see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
