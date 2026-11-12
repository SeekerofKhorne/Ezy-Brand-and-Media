# Third-party notices

This project bundles the work of others. Their licenses apply to their files, whatever license this project itself carries. The license texts are copied into `docs/licenses/` by the build so they travel with the built app.

## Libraries

| Library | Version | License | Used for |
|---|---|---|---|
| [PDF.js](https://github.com/mozilla/pdf.js) (pdfjs-dist) | 6.5.438 | Apache-2.0 | Reading PDFs for import |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | MIT | Writing the brand guidelines PDF |
| [JSZip](https://github.com/Stuk/jszip) | 3.10.2 | MIT or GPL-3.0-or-later (used under MIT) | Writing ZIP files |
| [Playwright](https://github.com/microsoft/playwright) | 1.65.0 | Apache-2.0 | Tests only; not shipped |

## Typefaces

Font files come from the [Fontsource](https://fontsource.org) packages of each family (Latin subset, WOFF2 for the page and WOFF for brand kits). The brand kit export copies the font files a brand uses into the ZIP, so each kit carries those files under the same licenses.

| Family | Weights bundled | License |
|---|---|---|
| Source Sans 3 | 400, 700 | OFL-1.1 |
| Playfair Display | 700 | OFL-1.1 |
| Source Serif 4 | 400 | OFL-1.1 |
| Lora | 400, 600 | OFL-1.1 |
| Nunito | 400, 800 | OFL-1.1 |
| Montserrat | 400, 700 | OFL-1.1 |
| Oswald | 600 | OFL-1.1 |
| Archivo Black | 400 | OFL-1.1 |
| Archivo | 400 | OFL-1.1 |
| Roboto Slab | 700 | Apache-2.0 |
| Caveat | 700 | OFL-1.1 |
| Cormorant Garamond | 600 | OFL-1.1 |
| Great Vibes | 400 | OFL-1.1 |
| IBM Plex Mono | 600 | OFL-1.1 |
| IBM Plex Sans | 400, 500, 600 | OFL-1.1 |
| Fraunces | 600 | OFL-1.1 |
| Fredoka | 600 | OFL-1.1 |
| Sora | 400, 700 | OFL-1.1 |
| DM Serif Display | 400 | OFL-1.1 |
| DM Sans | 400, 500 | OFL-1.1 |
| EB Garamond | 400, 600 | OFL-1.1 |
| Libre Baskerville | 400, 700 | OFL-1.1 |
| Bodoni Moda | 700 | OFL-1.1 |
| Merriweather | 400, 700 | OFL-1.1 |
| Cinzel | 700 | OFL-1.1 |
| Abril Fatface | 400 | OFL-1.1 |
| Bitter | 400, 700 | OFL-1.1 |
| Alfa Slab One | 400 | OFL-1.1 |
| Rye | 400 | OFL-1.1 |
| Inter | 400, 700 | OFL-1.1 |
| Open Sans | 400, 700 | OFL-1.1 |
| Raleway | 400, 600 | OFL-1.1 |
| Poppins | 400, 600 | OFL-1.1 |
| Quicksand | 500, 700 | OFL-1.1 |
| Rubik | 400, 700 | OFL-1.1 |
| Bebas Neue | 400 | OFL-1.1 |
| Anton | 400 | OFL-1.1 |
| Space Grotesk | 400, 700 | OFL-1.1 |
| Orbitron | 700 | OFL-1.1 |
| Exo 2 | 400 | OFL-1.1 |
| Syne | 400, 700 | OFL-1.1 |
| Pacifico | 400 | OFL-1.1 |
| Dancing Script | 700 | OFL-1.1 |
| Permanent Marker | 400 | Apache-2.0 |
| Kalam | 400, 700 | OFL-1.1 |
| Amatic SC | 700 | OFL-1.1 |
| Bangers | 400 | OFL-1.1 |
| Creepster | 400 | OFL-1.1 |
| Special Elite | 400 | Apache-2.0 |
| Pirata One | 400 | OFL-1.1 |
| Press Start 2P | 400 | OFL-1.1 |
| Poiret One | 400 | OFL-1.1 |
| Black Ops One | 400 | OFL-1.1 |
| Righteous | 400 | OFL-1.1 |
| JetBrains Mono | 400, 700 | OFL-1.1 |
| Space Mono | 400, 700 | OFL-1.1 |

OFL-1.1 is the SIL Open Font License 1.1. Each family's copyright notice and full license text is in `docs/licenses/fonts/<package>.txt`.

## Research and platform data

The keyword associations paraphrase findings from published studies; the app cites each one under Sources and method, and the full list is in `src/data.js` (`SRC`). Platform sizes and safe zones are measurements reported by third-party guides and change without notice.
