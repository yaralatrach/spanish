// Removes non-words from the curriculum and links participle-adjectives to
// their verbs.
//
// Prompted by auditing the list against Mark Davies' hand-reviewed lemma data
// for Spanish words beginning with s-. 92.5% of this curriculum's s- lemmas
// were confirmed correct there; the rest are what this script addresses.
//
// Usage: node scripts/clean-curriculum.mjs [path-to-words.json]

import { readFileSync, writeFileSync } from "node:fs";

// Reviewed individually, not matched by pattern: a, y, o, e and u are short
// but are real function words, while i and ó are foreign or misspelled
// conjunctions that the tagger let through.
const NOT_WORDS = new Set([
  "sr.", "dr.", "dra.", "s.",          // abbreviated titles
  "$",                                 // currency symbol
  "i", "ó",                            // Catalan "i"; a misspelling of "o"
  "s", "m", "d", "n", "c", "b", "l", "x", "h", // bare letters
]);

const target = process.argv[2] ?? new URL("../data/words.json", import.meta.url).pathname;
const words = JSON.parse(readFileSync(target, "utf8"));

const removed = words.filter((w) => NOT_WORDS.has(w.lemma)).map((w) => w.lemma);
const kept = words.filter((w) => !NOT_WORDS.has(w.lemma));

// Participle-adjectives are NOT removed. divertido, pesado, querido and
// aburrido carry adjectival meanings their verbs do not, so deleting them as
// duplicates would lose real vocabulary. They are linked instead, so the
// introduction UI can present sentado beside sentar rather than on its own
// day, without either card disappearing.
const verbs = new Map();
for (const w of kept) {
  if (w.pos === "VERB" || w.pos === "AUX") verbs.set(w.lemma, w);
}

let linked = 0;
for (const word of kept) {
  delete word.participleOf;
  if (word.pos !== "ADJ") continue;
  const stem = word.lemma.replace(/(ado|ido)$/, "");
  if (stem === word.lemma) continue;
  for (const ending of ["ar", "er", "ir"]) {
    const verb = verbs.get(stem + ending);
    if (verb && verb.forms.includes(word.lemma)) {
      word.participleOf = verb.lemma;
      linked += 1;
      break;
    }
  }
}

writeFileSync(target, JSON.stringify(kept, null, 0) + "\n");

console.log(`removed as non-words:        ${removed.length} (${removed.join(", ")})`);
console.log(`participles linked to verbs: ${linked}`);
console.log(`curriculum size:             ${words.length} -> ${kept.length}`);
