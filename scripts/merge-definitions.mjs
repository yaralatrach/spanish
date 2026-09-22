// Merges data/definitions.json into data/words.json.
//
// Definitions are written by hand in batches as the curriculum is reached,
// rather than pulled from a dictionary: every Spanish dictionary source is
// unreachable from the build environment, and the spec called for batched
// content anyway. They are in Spanish because the app is monolingual and
// writing the English definition is the learner's own first task.
//
// Usage: node scripts/merge-definitions.mjs

import { readFileSync, writeFileSync } from "node:fs";

const wordsPath = new URL("../data/words.json", import.meta.url).pathname;
const words = JSON.parse(readFileSync(wordsPath, "utf8"));
const defs = JSON.parse(
  readFileSync(new URL("../data/definitions.json", import.meta.url), "utf8"),
);

let applied = 0;
const unmatched = [];

for (const [lemma, entry] of Object.entries(defs)) {
  const word = words.find((w) => w.lemma === lemma);
  if (!word) {
    unmatched.push(lemma);
    continue;
  }
  word.definition = entry.definition;
  word.example = entry.example;
  applied += 1;
}

writeFileSync(wordsPath, JSON.stringify(words, null, 0) + "\n");

const withDefs = words.filter((w) => w.definition).length;
console.log(`definitions applied: ${applied}`);
if (unmatched.length) console.log(`not in curriculum:   ${unmatched.join(", ")}`);
console.log(`coverage:            ${withDefs} / ${words.length}`);
