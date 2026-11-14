# Keyword search

How a typed word reaches a concept, and why it works that way.

## The order a word is tried

1. **Exact match** against the hand-built index in `src/concepts.js`: concept names, Aaker's trait words, and synonyms.
2. **Base form**: "calming" is tried as "calm", "brands" as "brand" (`stemTry` in `engine.js`).
3. **Suggested words** in `src/concepts-suggested.js`: about 2,100 everyday words, slang and trade terms that a language model proposed and the owner reviewed (November 2026). They match exactly, like synonyms. Their keyword chip says they were suggested, and they carry no evidence label.
4. **No match**: the word is reported as having no link, with near spellings offered. Nothing is guessed.

## Adding or changing words

Edit `src/concepts-suggested.js` directly: each concept id lists its words. Rebuild with `npm run build`.
To regenerate the file from the review list, edit `tools/review/rows.json` (set `keep` to `No` to drop a word) and run `node tools/review/make-suggested.mjs`.
The original candidate list, and the words left out on purpose (color names, words that usually mean something else), are in `tools/review/candidates.mjs`.

## What was tried and not shipped: automatic matching by meaning

`tools/semantic/` scores any English word against the concepts with a small language model (all-MiniLM-L6-v2) and tests the result by hiding each hand keyword and checking whether the rest predict its concept.

Results, November 2026:
- Hidden keywords: correct concept ranked first 64%, in the top 3 81%. At a 0.55 cutoff it kept 67% of words, with 79% first-correct and 91% top-3.
- On words outside the index it did worse: good brand words ("opulent", "jolly", "rustic") scored below the cutoff, while junk ("decoying" → Retro, via "deco") passed it. Opposite feelings sat close together ("cheery" was nearly as close to "gloomy" as to "cheerful").
- A positive/negative check trained on the emotion keywords cut wrong-side matches on 42 test words from 6 to 4, but could not catch "stressful".

The model is built for sentences and reads single words by their spelling fragments, so it was not shipped. Word vectors such as GloVe, which are built to compare single words, are the next thing to try; the same build and test script would carry over.
To rerun: put the model files in `tools/semantic/model/all-MiniLM-L6-v2/` (see the top of `build-table.mjs`), then `cd tools/semantic && npm install && npm run evaluate`.
