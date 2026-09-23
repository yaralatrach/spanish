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
  applied += 1;
}

writeFileSync(wordsPath, JSON.stringify(words, null, 0) + "\n");

console.log(`definitions applied: ${applied}`);
if (unmatched.length) console.log(`not in curriculum:   ${unmatched.join(", ")}`);
console.log(
  `coverage:            ${words.filter((w) => w.definition).length} / ${words.length}`,
);
