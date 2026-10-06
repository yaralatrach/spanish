// Merges data/definitions.json into data/words.json.
//
// Written by hand in batches as the curriculum is reached, per the spec. Every
// Spanish dictionary source is unreachable from this environment, so there is
// no automated path regardless.
//
// Usage: node scripts/merge-definitions.mjs

import { readFileSync, writeFileSync } from "node:fs";

const wordsPath = new URL("../data/words.json", import.meta.url).pathname;
const words = JSON.parse(readFileSync(wordsPath, "utf8"));
const defs = JSON.parse(
  readFileSync(new URL("../data/definitions.json", import.meta.url), "utf8"),
);

/**
 * The definition with any form of its own word blanked out.
 *
 * The recognition exercise shows the definition and asks which word it
 * defines, so a definition that contains the word answers itself: "En España,
 * «vale» se usa constantemente" gives away valer outright. Six of the first
 * fifty did this.
 *
 * Masking uses the word's own attested forms rather than a stem guess, so
 * «cuyas» is caught for cuyo and «anda» for andar.
 */
function maskOwnWord(definition, lemma, forms) {
  const candidates = [...new Set([lemma, ...(forms ?? [])])]
    .filter((f) => f.length >= 3)
    .sort((a, b) => b.length - a.length);

  let masked = definition;
  for (const form of candidates) {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{M}])(${form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=[^\\p{L}\\p{M}]|$)`,
      "giu",
    );
    masked = masked.replace(pattern, "$1_____");
  }
  return masked;
}

const byLemma = new Map(words.map((w) => [w.lemma, w]));
let applied = 0;
const unmatched = [];

for (const [lemma, entry] of Object.entries(defs)) {
  const word = byLemma.get(lemma);
  if (!word) {
    unmatched.push(lemma);
    continue;
  }
  word.definition = entry.es;
  word.definitionEn = entry.en;
  word.example = entry.example;
  word.etymology = entry.etymology;
  word.exampleEn = entry.exampleEn ?? null;
  word.exampleEnGap = entry.exampleEnGap ?? null;
  word.examples = entry.examples ?? [];
  word.definitionMasked = maskOwnWord(entry.es, word.lemma, word.forms);
  applied += 1;
}

writeFileSync(wordsPath, JSON.stringify(words, null, 0) + "\n");

console.log(`definitions applied: ${applied}`);
if (unmatched.length) console.log(`not in curriculum:   ${unmatched.join(", ")}`);
const masked = words.filter(
  (w) => w.definitionMasked && w.definitionMasked !== w.definition,
).length;

console.log(
  `coverage:            ${words.filter((w) => w.definition).length} / ${words.length}`,
);
console.log(`definitions masked:  ${masked}`);
