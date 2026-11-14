/* Turns tools/review/candidates.mjs into review rows: drops words the app already links to the same
   concept, and notes anything a reviewer should look at. Writes tools/review/rows.json. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { pipeline, env } from '@huggingface/transformers';
import CANDIDATES, { LEFT_OUT } from '../review/candidates.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..', '..');
const ctx = { console }; vm.createContext(ctx);
for (const f of ['data.js', 'concepts.js', 'concepts-suggested.js', 'types.js', 'engine.js']) vm.runInContext(readFileSync(join(root, 'src', f), 'utf8'), ctx);
vm.runInContext('this.APP={LEX,CONCEPTS,lookup,GROUPS}', ctx);
const { LEX, CONCEPTS, lookup, GROUPS } = ctx.APP;
const C = Object.fromEntries(CONCEPTS.map(c => [c.id, c]));
const SIGN = { 'Positive emotions': 1, 'Difficult emotions': -1 };

const WL = createRequire(import.meta.url)('wordlist-english');
const dict = new Set(); for (const k in WL) for (const w of WL[k]) dict.add(w.toLowerCase());
const inDict = w => w.split(/[\s-]+/).every(t => dict.has(t) || /^\d/.test(t) || ["let's", "it's", "year's"].includes(t));

env.allowRemoteModels = false; env.localModelPath = join(here, 'model') + '/';
const ex = await pipeline('feature-extraction', 'all-MiniLM-L6-v2', { dtype: 'q8' });
const emb = async (a, t = '{w}') => { const o = []; for (let i = 0; i < a.length; i += 256) o.push(...(await ex(a.slice(i, i + 256).map(w => t.replace('{w}', w)), { pooling: 'mean', normalize: true })).tolist()); return o; };
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const ANCH = Object.keys(LEX), AC = ANCH.map(a => [...new Set(LEX[a].map(h => h.c))]);
const AV = await emb(ANCH), AVV = await emb(ANCH, 'I feel {w}.');
/* positive/negative classifier, as in build-table.mjs */
const X = [], y = [];
ANCH.forEach((a, i) => { const s = AC[i].map(c => SIGN[C[c].group] || 0); if (s.includes(1) && !s.includes(-1)) { X.push(AVV[i]); y.push(1); } if (s.includes(-1) && !s.includes(1)) { X.push(AVV[i]); y.push(0); } });
const w = new Float32Array(384); let b = 0; const np = y.filter(v => v).length, nn = y.length - np;
for (let ep = 0; ep < 400; ep++) { const gw = new Float32Array(384); let gb = 0; X.forEach((x, j) => { const p = 1 / (1 + Math.exp(-(dot(w, x) + b))); const e = (p - y[j]) * (y[j] ? y.length / (2 * np) : y.length / (2 * nn)); for (let d = 0; d < 384; d++) gw[d] += e * x[d]; gb += e; }); for (let d = 0; d < 384; d++) w[d] -= 0.5 * (gw[d] / X.length + 0.001 * w[d]); b -= 0.5 * gb / X.length; }

const rows = [], seen = new Set();
for (const cid in CANDIDATES) {
  if (!C[cid]) throw new Error('Unknown concept ' + cid);
  for (let word of CANDIDATES[cid]) {
    word = word.toLowerCase().trim();
    if (LEFT_OUT.includes(word) || seen.has(cid + '|' + word)) continue; seen.add(cid + '|' + word);
    const hit = lookup(word);
    const linked = hit ? [...new Set(hit.map(h => h.c))] : [];
    if (linked.includes(cid)) continue;                 // already reachable for this concept
    rows.push({ word, cid, linked });
  }
}
const V = await emb(rows.map(r => r.word)), VV = await emb(rows.map(r => r.word), 'I feel {w}.');
rows.forEach((r, i) => {
  const per = {};
  ANCH.forEach((a, j) => { const s = dot(V[i], AV[j]); for (const c of AC[j]) (per[c] ||= []).push(s); });
  const score = Object.entries(per).map(([c, l]) => [c, l.sort((p, q) => q - p).slice(0, 2).reduce((s, x) => s + x, 0) / Math.min(2, l.length)]).sort((p, q) => q[1] - p[1]);
  const rank = score.findIndex(s => s[0] === r.cid) + 1;
  const pos = 1 / (1 + Math.exp(-(dot(w, VV[i]) + b)));
  const notes = [];
  const sign = SIGN[C[r.cid].group] || 0;
  /* Model-based flags (positive/negative, closest concept) were tried and dropped: on single words
     they flagged mostly correct entries. Only factual notes remain. */
  if (r.linked.length) notes.push('Already linked to ' + r.linked.map(c => C[c].label).join(', ') + '; keeping adds this concept too');
  if (!inDict(r.word)) notes.push('Not in the dictionary list: slang, a trade term, or a spelling to check');
  r.note = notes.join('. ');
});
const gOrder = GROUPS.map(g => g.id), cOrder = CONCEPTS.map(c => c.id);
rows.sort((p, q) => gOrder.indexOf(C[p.cid].group) - gOrder.indexOf(C[q.cid].group) || cOrder.indexOf(p.cid) - cOrder.indexOf(q.cid) || (q.note ? 1 : 0) - (p.note ? 1 : 0) || p.word.localeCompare(q.word));
const out = rows.map(r => ({ keep: 'Yes', word: r.word, concept: C[r.cid].label, cid: r.cid, group: C[r.cid].group, means: C[r.cid].def, check: r.note }));
writeFileSync(join(root, 'tools', 'review', 'rows.json'), JSON.stringify(out, null, 1));
const flagged = out.filter(r => r.check);
console.log(`${out.length} rows; ${flagged.length} with a note.`);
for (const k of ['Reads as', 'Already linked', 'Not in the dictionary', 'Model puts']) console.log(`  ${k}: ${flagged.filter(r => r.check.includes(k)).length}`);
console.log(flagged.filter(r => r.check.includes('Reads as')).map(r => r.word + '→' + r.concept).join(', '));
console.log(flagged.filter(r => r.check.includes('Model puts')).slice(0, 40).map(r => r.word + '→' + r.concept).join(', '));
