// Fills in verb paradigms, in place, in data/words.json.
//
// The corpora only attest the forms they happened to contain: a median of 9
// per verb against a ~50-form paradigm, so "cociné" did not match "cocinar"
// and "dibuje" did not match "dibujar". Generating the paradigm closes that,
// and produces the structured conjugations the word-introduction UI needs.
//
// Region is castellano throughout, so vosotros forms are present.
//
// Usage: node scripts/build-conjugations.mjs [path-to-words.json]

import { readFileSync, writeFileSync } from "node:fs";

import pkg from "@jirimracek/conjugate-esp";

const { Conjugator } = pkg;

const target = process.argv[2] ?? new URL("../data/words.json", import.meta.url);

const conjugator = new Conjugator();
conjugator.setOrthography("2010");

const REFLEXIVE = new Set(["me", "te", "se", "nos", "os"]);

// Tenses worth showing when a word is introduced. The compound tenses are all
// built with haber, which is itself a curriculum word, so showing them here
// would teach the same auxiliary 900 times over.
const DISPLAY = [
  ["presente", "Indicativo", "Presente"],
  ["indefinido", "Indicativo", "PreteritoIndefinido"],
  ["imperfecto", "Indicativo", "PreteritoImperfecto"],
  ["futuro", "Indicativo", "FuturoImperfecto"],
  ["condicional", "Indicativo", "CondicionalSimple"],
  ["subjuntivo", "Subjuntivo", "Presente"],
  ["imperativo", "Imperativo", "Afirmativo"],
];

/** Conjugate, falling back to the reflexive form for verbs that only exist so. */
function conjugate(lemma) {
  for (const candidate of [lemma, `${lemma}se`]) {
    try {
      const result = conjugator.conjugateSync(candidate, "castellano");
      if (Array.isArray(result) && result.length > 0 && result[0]?.conjugation) {
        return result;
      }
    } catch {
      // Not a verb this library knows under that spelling; try the next.
    }
  }
  return null;
}

/**
 * A single orthographic word, or null. Reflexive conjugations come back as
 * "me arrepiento", so the pronoun is stripped to leave a matchable token;
 * anything else with a space is a compound tense, which is two known words
 * rather than one new one.
 */
function singleWord(raw) {
  if (!raw || raw === "-") return null;
  const parts = raw.trim().toLowerCase().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2 && REFLEXIVE.has(parts[0])) return parts[1];
  return null;
}

/** Participles inflect for gender and number; the library returns only one. */
function participleForms(participle) {
  if (!participle || !participle.endsWith("o")) return participle ? [participle] : [];
  const stem = participle.slice(0, -1);
  return [participle, `${stem}a`, `${stem}os`, `${stem}as`];
}

const words = JSON.parse(readFileSync(target, "utf8"));

const unconjugable = [];
let enriched = 0;
let formsBefore = 0;
let formsAfter = 0;

for (const word of words) {
  if (word.pos !== "VERB" && word.pos !== "AUX") continue;

  const result = conjugate(word.lemma);
  if (!result) {
    unconjugable.push(word.lemma);
    continue;
  }

  const generated = new Set();
  for (const entry of result) {
    for (const tenses of Object.values(entry.conjugation)) {
      for (const value of Object.values(tenses)) {
        for (const raw of Array.isArray(value) ? value : [value]) {
          const form = singleWord(raw);
          if (form) generated.add(form);
        }
      }
    }
    for (const form of participleForms(entry.conjugation.Impersonal?.Participio)) {
      generated.add(form.toLowerCase());
    }
  }

  // "hay" is the impersonal present of haber and is not part of the regular
  // paradigm the library returns, but it is one of the commonest words there is.
  if (word.lemma === "haber") generated.add("hay");

  const display = {
    gerundio: result[0].conjugation.Impersonal?.Gerundio ?? null,
    participio: result[0].conjugation.Impersonal?.Participio ?? null,
  };
  for (const [key, mood, tense] of DISPLAY) {
    const value = result[0].conjugation[mood]?.[tense];
    if (Array.isArray(value)) {
      display[key] = value.map((v) => (v === "-" ? null : v));
    }
  }

  formsBefore += word.forms.length;
  word.forms = [...new Set([...word.forms, ...generated])].sort();
  word.conjugations = display;
  formsAfter += word.forms.length;
  enriched += 1;
}

// A lemma no real conjugator recognises, tagged as a verb, is a treebank
// lemmatisation error rather than vocabulary: hagar, llever, confunder. It
// would otherwise be taught as a word.
const kept = words.filter(
  (w) => !((w.pos === "VERB" || w.pos === "AUX") && unconjugable.includes(w.lemma)),
);

writeFileSync(
  typeof target === "string" ? target : target.pathname,
  JSON.stringify(kept, null, 0) + "\n",
);

console.log(`verbs enriched:   ${enriched}`);
console.log(`forms per verb:   ${(formsBefore / enriched).toFixed(1)} -> ${(formsAfter / enriched).toFixed(1)}`);
console.log(`dropped as junk:  ${unconjugable.length} (${unconjugable.join(", ")})`);
console.log(`curriculum size:  ${words.length} -> ${kept.length}`);
console.log(`total forms:      ${kept.reduce((n, w) => n + w.forms.length, 0)}`);
