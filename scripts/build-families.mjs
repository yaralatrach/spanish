// Groups the curriculum into lemma families: fruta -> frutería, cocinar ->
// cocinero. Nothing in the corpora records that a word is derived from
// another, so this is constructed from Spanish derivational suffixes rather
// than looked up, and is therefore approximate by nature.
//
// Precision is favoured over recall throughout. A candidate is kept only if it
// appears in the subtitle corpus often enough to be a real word rather than a
// typo, so the families that survive are small but trustworthy. A family
// missed costs nothing; a fabricated word taught as vocabulary is a real harm.
//
// Usage: node scripts/build-families.mjs --subs <file> [--words data/words.json]

import { readFileSync, writeFileSync } from "node:fs";

// A derived form must occur at least this often across the subtitle corpus.
// The band below this is mostly proper nouns and accent-stripped typos, but
// those can never be proposed: the lexicon only filters candidates the suffix
// rules construct, and those are constructed correctly accented. The binding
// constraint is the other way — frutería occurs just 91 times, and excluding
// it would drop the very family this feature exists for.
const MIN_OCCURRENCES = 50;

// Shorter stems produce coincidences rather than derivations.
const MIN_STEM = 4;

// strip: what the root ends with. add: what replaces it. Each pair is a
// productive Spanish derivation, applied only to the part of speech it belongs
// to so that "casa" cannot be read as a form of "casar".
const RULES = [
  // Verbs: agent nouns, action nouns, participant nouns.
  { pos: "VERB", strip: /(ar|er|ir)$/, add: ["ador", "adora", "edor", "idor"] },
  { pos: "VERB", strip: /ar$/, add: ["ación", "ero", "era", "ante", "able"] },
  { pos: "VERB", strip: /(er|ir)$/, add: ["ición", "imiento", "iente", "ible"] },
  { pos: "VERB", strip: /ar$/, add: ["amiento"] },
  // Nouns: trades, shops, adherents, related adjectives.
  { pos: "NOUN", strip: /[aoe]$/, add: ["ería", "ero", "era", "ista", "al"] },
  { pos: "NOUN", strip: /$/, add: ["ería", "ero", "era", "ista", "al"] },
  // Adjectives: adverbs and abstract nouns.
  { pos: "ADJ", strip: /o$/, add: ["amente", "eza", "idad", "ura"] },
  { pos: "ADJ", strip: /[e]?$/, add: ["mente", "idad", "eza"] },
];

function parseArgs(argv) {
  let subs = null;
  let wordsPath = new URL("../data/words.json", import.meta.url).pathname;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--subs") subs = argv[++i];
    else if (argv[i] === "--words") wordsPath = argv[++i];
  }
  if (!subs) throw new Error("usage: build-families.mjs --subs <file> [--words <file>]");
  return { subs, wordsPath };
}

/** Real-word check: surface forms seen often enough to not be noise. */
function readLexicon(path) {
  const lexicon = new Set();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const space = line.lastIndexOf(" ");
    if (space < 1) continue;
    if (Number(line.slice(space + 1)) >= MIN_OCCURRENCES) {
      lexicon.add(line.slice(0, space).toLowerCase());
    }
  }
  return lexicon;
}

const { subs, wordsPath } = parseArgs(process.argv.slice(2));
const lexicon = readLexicon(subs);
const words = JSON.parse(readFileSync(wordsPath, "utf8"));

const curriculum = new Map(words.map((w) => [w.lemma, w]));
const isInflection = new Set();
for (const w of words) for (const f of w.forms) isInflection.add(f);

let familiesFound = 0;
let membersTotal = 0;
let inCurriculum = 0;

for (const word of words) {
  delete word.family;
  const members = [];

  for (const rule of RULES) {
    if (rule.pos !== word.pos) continue;
    if (!rule.strip.test(word.lemma)) continue;
    const stem = word.lemma.replace(rule.strip, "");
    if (stem.length < MIN_STEM) continue;

    for (const suffix of rule.add) {
      const candidate = stem + suffix;
      if (candidate === word.lemma) continue;
      if (!lexicon.has(candidate)) continue;
      // An inflected form of some verb is not a derived word.
      if (isInflection.has(candidate) && !curriculum.has(candidate)) continue;
      if (members.some((m) => m.lemma === candidate)) continue;

      const existing = curriculum.get(candidate);
      members.push({
        lemma: candidate,
        // In-curriculum members keep their own card and rank; the rest ride
        // along as context, shown but never counted against the daily ten.
        rank: existing ? existing.rank : null,
      });
    }
  }

  if (members.length === 0) continue;
  members.sort((a, b) => a.lemma.localeCompare(b.lemma, "es"));
  word.family = members;
  familiesFound += 1;
  membersTotal += members.length;
  inCurriculum += members.filter((m) => m.rank !== null).length;
}

writeFileSync(wordsPath, JSON.stringify(words, null, 0) + "\n");

console.log(`lexicon (>=${MIN_OCCURRENCES} occurrences): ${lexicon.size} forms`);
console.log(`roots with a family:  ${familiesFound}`);
console.log(`members total:        ${membersTotal}`);
console.log(`  already curriculum: ${inCurriculum}`);
console.log(`  riding along free:  ${membersTotal - inCurriculum}`);
