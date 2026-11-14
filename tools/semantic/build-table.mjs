/* Builds data/semantic-table.json: for everyday English words that are not
   hand-mapped keywords, the three concepts they sit closest to in meaning.

   How it works, in short:
   1. Every hand-mapped keyword in src/concepts.js is an "anchor" for its concept.
   2. A small language model (all-MiniLM-L6-v2) turns each word into 384 numbers
      that encode meaning. Words with similar meanings get similar numbers.
   3. A word's score for a concept is how close it sits to that concept's
      nearest anchors (cosine similarity, where 1 means identical meaning).
   4. A positive/negative direction, learned from the positive and difficult
      emotion keywords, gives every word a sign. The app uses it to stop a
      negative word landing on a positive emotion, and the reverse.

   Usage (from this folder):
     npm install            once
     npm run evaluate       holdout test only; prints accuracy, writes nothing
     npm run build          holdout test, then writes ../../data/semantic-table.json

   The model files are not in the repository. Put them in model/all-MiniLM-L6-v2/
   (config.json, tokenizer.json, tokenizer_config.json, onnx/model_quantized.onnx)
   from https://huggingface.co/Xenova/all-MiniLM-L6-v2 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { pipeline, env } from '@huggingface/transformers';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const evaluateOnly = process.argv.includes('--evaluate');

/* ---------- settings (chosen by the holdout test; see handbook/semantic-search.md) ---------- */
const K = +(process.env.K || 2);               // a concept's score = mean of the word's K closest anchors in it
const FOLDS = 5;           // holdout test: each keyword is hidden once, in one of 5 rounds
const VALENCE_CUT = +(process.env.VCUT || 0.12); // positive above 0.5+cut probability, negative below 0.5-cut
const VOCAB_LEVELS = ['10', '20', '35', '40', '50']; // SCOWL frequency levels; higher = rarer words
const VALENCE_TEMPLATE = process.env.VT || 'I feel {w}.'; // phrase used only for the positive/negative check

/* ---------- load the app's own keyword code, so the table matches the app exactly ---------- */
const ctx = { console };
vm.createContext(ctx);
for (const f of ['data.js', 'concepts.js', 'concepts-suggested.js', 'types.js', 'engine.js'])
  vm.runInContext(readFileSync(join(root, 'src', f), 'utf8'), ctx, { filename: f });
vm.runInContext('this.APP={LEX,CONCEPTS,lookup,STOP}', ctx);
const { LEX, CONCEPTS, lookup, STOP } = ctx.APP;
const CIDS = CONCEPTS.map(c => c.id);
const CIDX = Object.fromEntries(CIDS.map((c, i) => [c, i]));
const groupOf = Object.fromEntries(CONCEPTS.map(c => [c.id, c.group]));
const SIGN = { 'Positive emotions': 1, 'Difficult emotions': -1 };

/* anchors: every hand keyword, with the concepts it belongs to */
const ANCHORS = Object.keys(LEX).sort();
const anchorConcepts = ANCHORS.map(a => [...new Set(LEX[a].map(h => h.c))]);
/* Negated keywords ("stress-free", "worry-free") still match exactly, but are left out of the
   similarity search: the model reads the root ("stress") and would pull "stressful" toward Relief. */
const NEGATED = /(-free|\bfree of\b|^un|^no )/;
const similarityAnchor = ANCHORS.map(a => !(NEGATED.test(a) && !['understanding','unity','unique','uniqueness','universalism'].includes(a)));

/* ---------- vocabulary: common English words the hand index does not already cover ---------- */
const require = createRequire(import.meta.url);
const WL = require('wordlist-english');
const vocab = new Set();
for (const lv of VOCAB_LEVELS) for (const list of [WL['english/' + lv], WL['english/american/' + lv]])
  for (const w of list || []) if (/^[a-z][a-z-]{2,}$/.test(w) && !STOP.includes(w)) vocab.add(w);
const VOCAB = [...vocab].filter(w => !lookup(w)).sort();

/* ---------- embeddings ---------- */
env.allowRemoteModels = false;
env.localModelPath = join(here, 'model') + '/';
if (!existsSync(join(here, 'model', 'all-MiniLM-L6-v2', 'onnx', 'model_quantized.onnx'))) {
  console.error('Model files missing. See the comment at the top of this file.');
  process.exit(1);
}
const extract = await pipeline('feature-extraction', 'all-MiniLM-L6-v2', { dtype: 'q8' });
async function embed(words, template = '{w}') {
  const out = [];
  for (let i = 0; i < words.length; i += 256) {
    const t = await extract(words.slice(i, i + 256).map(w => template.replace('{w}', w)), { pooling: 'mean', normalize: true });
    out.push(...t.tolist());
    if (words.length > 2000 && (i / 256) % 20 === 0) process.stdout.write(`  embedded ${i}/${words.length}\r`);
  }
  return out.map(v => Float32Array.from(v));
}
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

console.log(`Anchors: ${ANCHORS.length} hand keywords across ${CIDS.length} concepts. Vocabulary to score: ${VOCAB.length} words.`);
const AV = await embed(ANCHORS);
const AVV = await embed(ANCHORS, VALENCE_TEMPLATE);

/* ---------- scoring ---------- */
/* Score one word vector against the anchors that are allowed (all, or all but a hidden fold). */
function scoreWord(v, allowed) {
  const per = CIDS.map(() => []);                    // similarities to each concept's anchors
  for (let i = 0; i < ANCHORS.length; i++) {
    if ((allowed && !allowed[i]) || !similarityAnchor[i]) continue;
    const s = dot(v, AV[i]);
    for (const c of anchorConcepts[i]) per[CIDX[c]].push([s, i]);
  }
  return per.map((list, ci) => {
    list.sort((a, b) => b[0] - a[0]);
    const top = list.slice(0, K);
    const score = top.length ? top.reduce((s, x) => s + x[0], 0) / top.length : 0;
    return { ci, score, via: top.length ? top[0][1] : -1 };
  }).sort((a, b) => b.score - a.score);
}

/* Positive/negative direction: a small logistic regression trained on the emotion keywords
   (positive emotions = 1, difficult emotions = 0). It returns the probability a word is positive. */
function valenceAxis(allowed) {
  const X = [], y = [];
  ANCHORS.forEach((a, i) => {
    if (allowed && !allowed[i]) return;
    const s = anchorConcepts[i].map(c => SIGN[groupOf[c]] || 0);
    if (s.includes(1) && !s.includes(-1)) { X.push(AVV[i]); y.push(1); }
    if (s.includes(-1) && !s.includes(1)) { X.push(AVV[i]); y.push(0); }
  });
  const w = new Float32Array(384); let b = 0;
  const lr = 0.5, l2 = 0.001, np = y.filter(v => v).length, nn = y.length - np;
  for (let ep = 0; ep < 400; ep++) {
    const gw = new Float32Array(384); let gb = 0;
    X.forEach((x, j) => {
      const p = 1 / (1 + Math.exp(-(dot(w, x) + b)));
      const wt = y[j] ? y.length / (2 * np) : y.length / (2 * nn);   // balance the two classes
      const e = (p - y[j]) * wt;
      for (let d = 0; d < 384; d++) gw[d] += e * x[d];
      gb += e;
    });
    for (let d = 0; d < 384; d++) w[d] -= lr * (gw[d] / X.length + l2 * w[d]);
    b -= lr * gb / X.length;
  }
  return { w, b };
}
const posProb = (v, axis) => 1 / (1 + Math.exp(-(dot(axis.w, v) + axis.b)));
const valenceOf = (v, axis) => { const p = posProb(v, axis); return p > 0.5 + VALENCE_CUT ? 1 : p < 0.5 - VALENCE_CUT ? -1 : 0; };
/* The gate: drop concepts whose emotional sign contradicts the word's. */
const gate = (ranked, val) => val === 0 ? ranked : ranked.filter(r => (SIGN[groupOf[CIDS[r.ci]]] || 0) !== -val);

/* ---------- holdout test ---------- */
/* Each keyword is hidden once; the rest predict it. Correct = a predicted concept is one it really belongs to.
   Multi-concept keywords (e.g. "bold": Excitement and Power) count as correct on either. */
function holdout(useGate) {
  const fold = ANCHORS.map((_, i) => i % FOLDS);
  const rows = [];
  for (let f = 0; f < FOLDS; f++) {
    const allowed = fold.map(x => x !== f);
    const axis = valenceAxis(allowed);
    ANCHORS.forEach((a, i) => {
      if (fold[i] !== f) return;
      let r = scoreWord(AV[i], allowed);
      if (useGate) r = gate(r, valenceOf(AVV[i], axis));
      const truth = anchorConcepts[i];
      rows.push({ word: a, top: r[0].score, hit1: truth.includes(CIDS[r[0].ci]), hit3: r.slice(0, 3).some(x => truth.includes(CIDS[x.ci])) });
    });
  }
  return rows;
}
function report(rows, label) {
  const n = rows.length, pct = x => (100 * x).toFixed(1) + '%';
  console.log(`\n${label}: ${n} hidden keywords`);
  console.log(`  correct concept ranked first: ${pct(rows.filter(r => r.hit1).length / n)}   in top 3: ${pct(rows.filter(r => r.hit3).length / n)}`);
  console.log('  threshold | words kept | first-ranked correct among kept | top 3 correct among kept');
  const sweep = [];
  for (let t = 0.30; t <= 0.701; t += 0.05) {
    const kept = rows.filter(r => r.top >= t);
    const p1 = kept.length ? kept.filter(r => r.hit1).length / kept.length : 0;
    const p3 = kept.length ? kept.filter(r => r.hit3).length / kept.length : 0;
    sweep.push({ t: +t.toFixed(2), keep: kept.length / n, p1, p3 });
    console.log(`     ${t.toFixed(2)}   |   ${pct(kept.length / n).padStart(6)}   |   ${pct(p1).padStart(6)}   |   ${pct(p3).padStart(6)}`);
  }
  return { n, top1: rows.filter(r => r.hit1).length / n, top3: rows.filter(r => r.hit3).length / n, sweep };
}

/* Opposite-feeling probe: emotion words that are NOT hand keywords, with the side they belong on.
   Counts how often the first-ranked concept is an emotion from the wrong side. */
const PROBE = {
  '-1': ['stressful', 'stressed', 'worried', 'worry', 'miserable', 'unhappy', 'hopeless', 'terrified', 'frightening', 'depressing', 'depressed', 'irritated', 'bitter', 'resentful', 'upset', 'distressed', 'uneasy', 'tormented', 'agony', 'despair', 'insecure', 'jealous', 'annoyed', 'restless'],
  '1': ['cheery', 'gleeful', 'placid', 'carefree', 'grateful', 'thankful', 'jolly', 'delighted', 'pleased', 'thrilled', 'loved', 'secure', 'confident', 'hopefulness', 'cherish', 'blessed', 'excited', 'glee', 'relaxation', 'comfy', 'harmony', 'kindhearted', 'heartwarming', 'radiant']
};
async function probe(axis) {
  const words = [], side = [];
  for (const s of ['-1', '1']) for (const w of PROBE[s]) if (!lookup(w)) { words.push(w); side.push(+s); }
  const V = await embed(words), VVal = await embed(words, VALENCE_TEMPLATE);
  const res = { off: [], on: [] };
  words.forEach((w, i) => {
    const r = scoreWord(V[i]);
    const val = valenceOf(VVal[i], axis);
    const g = gate(r, val);
    const wrong = x => (SIGN[groupOf[CIDS[x.ci]]] || 0) === -side[i];
    if (wrong(r[0])) res.off.push(w + ' → ' + CIDS[r[0].ci]);
    if (wrong(g[0])) res.on.push(w + ' → ' + CIDS[g[0].ci]);
  });
  if (process.env.SHOWVAL) console.log(words.map((w, i) => w + ':' + posProb(VVal[i], axis).toFixed(2) + (side[i] > 0 ? '+' : '-')).join(' '));
  console.log(`\nOpposite-feeling probe: ${words.length} emotion words not in the hand index`);
  console.log(`  first concept is an emotion on the wrong side, gate off: ${res.off.length}  ${res.off.join(', ')}`);
  console.log(`  first concept is an emotion on the wrong side, gate on:  ${res.on.length}  ${res.on.join(', ')}`);
  return { words: words.length, wrongOff: res.off.length, wrongOn: res.on.length };
}

const off = report(holdout(false), 'Holdout, valence gate off');
const on = report(holdout(true), 'Holdout, valence gate on');
const fullAxis = valenceAxis(null);
const pr = await probe(fullAxis);

/* Threshold: the lowest cutoff at which at least 90% of kept words have a correct concept in their top 3.
   Favors precision: a wrong match costs more than a missing one, which the app reports as "no link". */
const pick = on.sweep.find(s => s.p3 >= 0.9) || on.sweep[on.sweep.length - 1];
const THRESHOLD = pick.t;
console.log(`\nChosen threshold: ${THRESHOLD} (keeps ${(pick.keep * 100).toFixed(0)}% of hidden keywords; ${(pick.p3 * 100).toFixed(0)}% of those have a correct concept in the top 3)`);
if (evaluateOnly) process.exit(0);

/* ---------- score the vocabulary and write the table ---------- */
console.log(`\nScoring ${VOCAB.length} words...`);
const VV = await embed(VOCAB), VVV = await embed(VOCAB, VALENCE_TEMPLATE);
const words = {};
let kept = 0;
VOCAB.forEach((w, i) => {
  const val = valenceOf(VVV[i], fullAxis);
  const r = gate(scoreWord(VV[i]), val).filter(x => x.score >= THRESHOLD).slice(0, 3);
  if (!r.length) return;
  kept++;
  /* [concept, score x100, ...up to 3, via-anchor index, sign] */
  words[w] = [...r.flatMap(x => [x.ci, Math.round(x.score * 100)]), r[0].via, val];
});
const table = {
  about: 'Generated by tools/semantic/build-table.mjs. Do not edit by hand; rebuild instead.',
  model: 'all-MiniLM-L6-v2 (8-bit), sentence-transformers via Xenova ONNX export, Apache-2.0',
  vocabulary: 'SCOWL levels ' + VOCAB_LEVELS.join(', ') + ' (Kevin Atkinson, permissive license)',
  built: new Date().toISOString().slice(0, 10),
  method: { neighbours: K, threshold: THRESHOLD, valenceCut: VALENCE_CUT },
  test: {
    hiddenKeywords: on.n,
    firstCorrect: +on.top1.toFixed(3), top3Correct: +on.top3.toFixed(3),
    atThreshold: { kept: +pick.keep.toFixed(3), firstCorrect: +pick.p1.toFixed(3), top3Correct: +pick.p3.toFixed(3) },
    gateOff: { firstCorrect: +off.top1.toFixed(3), top3Correct: +off.top3.toFixed(3) },
    oppositeProbe: pr
  },
  concepts: CIDS,
  anchors: ANCHORS,
  words
};
mkdirSync(join(root, 'data'), { recursive: true });
const file = join(root, 'data', 'semantic-table.json');
writeFileSync(file, JSON.stringify(table));
console.log(`Wrote ${file}: ${kept} of ${VOCAB.length} words have at least one concept above ${THRESHOLD}. ${(readFileSync(file).length / 1024).toFixed(0)} KB.`);
