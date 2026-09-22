// Builds the 5000-lemma curriculum and its form -> lemma table.
//
// Two corpora, because neither alone is right. UD treebanks are lemmatised and
// morphologically tagged, which is what makes the form -> lemma table possible
// at all, but they are news text: everyday vocabulary (frutería, cocinero)
// ranks far too low. OpenSubtitles is conversational and huge, but it is raw
// surface forms with no lemmas. So the treebanks supply the lemma mapping and
// the subtitle corpus supplies the spoken-register frequencies.
//
// Sources:
//   UD_Spanish-AnCora   CC BY 4.0
//   UD_Spanish-GSD      CC BY-SA 4.0
//   FrequencyWords (OpenSubtitles 2018)  MIT
//
// Usage: node scripts/build-wordlist.mjs <conllu-dir...> --subs <file> --out <file>

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TARGET_SIZE = 5000;

// Proper nouns are not vocabulary. Punctuation, symbols, numerals and the
// catch-all X are not words worth a review card.
const SKIP_POS = new Set(["PROPN", "PUNCT", "SYM", "X", "NUM"]);

function parseArgs(argv) {
  const dirs = [];
  let subs = null;
  let out = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--subs") subs = argv[++i];
    else if (argv[i] === "--out") out = argv[++i];
    else dirs.push(argv[i]);
  }
  if (!dirs.length || !subs || !out) {
    throw new Error(
      "usage: build-wordlist.mjs <conllu-dir...> --subs <file> --out <file>",
    );
  }
  return { dirs, subs, out };
}

/**
 * Reads the treebanks once and returns everything derived from them:
 * per-lemma news counts, the forms attested for each lemma, and the reverse
 * map used to resolve a bare subtitle form back to a lemma.
 */
function readTreebanks(dirs) {
  const newsCount = new Map(); // lemma -> tokens
  const posCount = new Map(); // lemma -> Map(pos -> tokens)
  const formToLemma = new Map(); // form -> Map(lemma -> tokens)

  for (const dir of dirs) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".conllu"))) {
      const text = readFileSync(join(dir, file), "utf8");
      for (const line of text.split("\n")) {
        if (!line || line[0] === "#") continue;
        const cols = line.split("\t");
        if (cols.length < 5) continue;
        // Skip multiword-token ranges (1-2) and empty nodes (1.1).
        if (!/^\d+$/.test(cols[0])) continue;

        const form = cols[1].toLowerCase();
        const lemma = cols[2].toLowerCase();
        const pos = cols[3];
        if (SKIP_POS.has(pos) || !lemma || lemma === "_") continue;

        newsCount.set(lemma, (newsCount.get(lemma) ?? 0) + 1);

        if (!posCount.has(lemma)) posCount.set(lemma, new Map());
        const byPos = posCount.get(lemma);
        byPos.set(pos, (byPos.get(pos) ?? 0) + 1);

        if (!formToLemma.has(form)) formToLemma.set(form, new Map());
        const cands = formToLemma.get(form);
        cands.set(lemma, (cands.get(lemma) ?? 0) + 1);
      }
    }
  }

  // A form like "para" is ambiguous (preposition vs a form of "parar").
  // Resolve to whichever lemma it more often was, which is the best guess
  // available without running a tagger at build time.
  const bestLemma = new Map();
  for (const [form, cands] of formToLemma) {
    let top = null;
    let topN = -1;
    for (const [lemma, n] of cands) {
      if (n > topN) {
        top = lemma;
        topN = n;
      }
    }
    bestLemma.set(form, top);
  }

  const dominantPos = new Map();
  for (const [lemma, byPos] of posCount) {
    let top = null;
    let topN = -1;
    for (const [pos, n] of byPos) {
      if (n > topN) {
        top = pos;
        topN = n;
      }
    }
    dominantPos.set(lemma, top);
  }

  return { newsCount, bestLemma, dominantPos };
}

/** form -> occurrences, from the `{word} {count}` subtitle list. */
function readSubtitleCounts(path) {
  const counts = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const space = line.lastIndexOf(" ");
    if (space < 1) continue;
    const form = line.slice(0, space).toLowerCase();
    const n = Number(line.slice(space + 1));
    if (!Number.isFinite(n)) continue;
    counts.set(form, (counts.get(form) ?? 0) + n);
  }
  return counts;
}

function perMillion(counts) {
  let total = 0;
  for (const n of counts.values()) total += n;
  const scaled = new Map();
  for (const [key, n] of counts) scaled.set(key, (n / total) * 1_000_000);
  return { scaled, total };
}

function main() {
  const { dirs, subs, out } = parseArgs(process.argv.slice(2));

  const { newsCount, bestLemma, dominantPos } = readTreebanks(dirs);
  const subForms = readSubtitleCounts(subs);

  // Fold subtitle surface forms onto lemmas. A form the treebanks never saw
  // cannot be resolved, so it is dropped rather than guessed at.
  const subCount = new Map();
  let mapped = 0;
  let unmapped = 0;
  for (const [form, n] of subForms) {
    const lemma = bestLemma.get(form);
    if (!lemma) {
      unmapped += n;
      continue;
    }
    mapped += n;
    subCount.set(lemma, (subCount.get(lemma) ?? 0) + n);
  }

  const news = perMillion(newsCount);
  const subtitles = perMillion(subCount);

  // Blend at equal weight on a per-million basis, so the far larger subtitle
  // corpus does not simply drown out the news one. A word strong in only one
  // register keeps half its score, which is the intent: register-specific
  // vocabulary should still make the list, just lower.
  const scored = [];
  for (const lemma of new Set([...news.scaled.keys(), ...subtitles.scaled.keys()])) {
    const pos = dominantPos.get(lemma);
    if (!pos) continue;
    const newsPM = news.scaled.get(lemma) ?? 0;
    const subsPM = subtitles.scaled.get(lemma) ?? 0;
    scored.push({
      lemma,
      pos,
      score: (newsPM + subsPM) / 2,
      news_per_million: Number(newsPM.toFixed(3)),
      subs_per_million: Number(subsPM.toFixed(3)),
    });
  }

  scored.sort((a, b) => b.score - a.score || a.lemma.localeCompare(b.lemma, "es"));

  // Build the form table from the resolved reverse map, not from each lemma's
  // observed forms. Going through bestLemma means every form credits exactly
  // one lemma, so a mis-tagged token cannot attach "fueros" to "ser" while
  // "fuero" also claims it, and runtime matching sees the same single answer
  // this build step decided on.
  const formsForLemma = new Map();
  for (const [form, lemma] of bestLemma) {
    if (!formsForLemma.has(lemma)) formsForLemma.set(lemma, new Set());
    formsForLemma.get(lemma).add(form);
  }

  const words = scored.slice(0, TARGET_SIZE).map((entry, index) => {
    const forms = formsForLemma.get(entry.lemma) ?? new Set();
    forms.add(entry.lemma); // the dictionary form itself always counts
    return {
      rank: index + 1,
      lemma: entry.lemma,
      pos: entry.pos,
      news_per_million: entry.news_per_million,
      subs_per_million: entry.subs_per_million,
      forms: [...forms].sort(),
    };
  });

  writeFileSync(out, JSON.stringify(words, null, 0) + "\n");

  const formCount = words.reduce((sum, w) => sum + w.forms.length, 0);
  console.log(
    [
      `treebank lemmas:      ${newsCount.size}`,
      `treebank forms:       ${bestLemma.size}`,
      `subtitle forms:       ${subForms.size}`,
      `subtitle tokens kept: ${((mapped / (mapped + unmapped)) * 100).toFixed(1)}%`,
      `curriculum lemmas:    ${words.length}`,
      `curriculum forms:     ${formCount}`,
      `weakest score:        ${scored[TARGET_SIZE - 1]?.score.toFixed(2)} per million`,
    ].join("\n"),
  );
}

main();
