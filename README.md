# Español

Personal Spanish curriculum: the 5000 most frequent lemmas, spaced review, a
forced daily journal gate, and handwritten production tasks.

## How a day works

1. **Journal gate.** 100+ characters in Spanish. Nothing else opens until it is
   written. Any curriculum word used here counts as known — unprompted
   production is stronger evidence than clicking "I know this" on a word the
   app just showed you, so it overrides an earlier "unknown" click.
2. **Review** of words that are due, before any new ones.
3. **10 new words**, grouped by lemma family and theme rather than served in
   isolation.
4. **Four production tasks per word**, on paper: English definition, explain it
   in Spanish, use it in a sentence, then photograph the page to close the day.

Review ladder: 25 min → 1 day → 3 days → 1 week → 2 weeks → 1 month.

## Setup

1. Create a Supabase project and apply `supabase/migrations/` — `supabase db
   push` after `supabase link`, or paste the SQL into the dashboard SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the two Supabase values from
   Project Settings → API.
3. `npm install`
4. Seed the curriculum, once: `npm run seed`
5. `npm run dev`

Every command works the same in PowerShell, CMD, Git Bash and a Unix shell —
`npm run seed` reads `.env.local` itself rather than needing exported
variables, which differ between shells.

## The word list

`data/words.json` is 5000 lemmas built by `scripts/build-wordlist.mjs` from two
corpora, because neither alone is right. UD treebanks are lemmatised and
morphologically tagged, which is what makes the form → lemma table possible,
but they are news text and rank everyday vocabulary far too low. OpenSubtitles
is conversational and large, but it is raw surface forms with no lemmas. So the
treebanks supply the mapping and the subtitles supply the spoken frequencies,
blended at equal weight per million.

| Source | Licence | Role |
| --- | --- | --- |
| [UD_Spanish-AnCora](https://github.com/UniversalDependencies/UD_Spanish-AnCora) | CC BY 4.0 | lemmas, POS, morphology |
| [UD_Spanish-GSD](https://github.com/UniversalDependencies/UD_Spanish-GSD) | CC BY-SA 4.0 | additional form coverage |
| [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles 2018) | MIT | spoken-register frequency |

90.2% of subtitle tokens resolve to a lemma. Note GSD's CC BY-SA: the derived
list inherits share-alike.

### Matching

Exact match first, so an accent that was typed still distinguishes the word.
Tokens that match nothing fall back to accent-insensitive matching, because on
real input a missing accent is the commonest miss by some margin — `reunion`,
`presentacion` and `tramites` all failed on the first real journal entry for
that reason alone. Typing `reunion` is a spelling slip, not evidence the word
is unknown. `ñ` is never folded: it is its own letter, and folding it would
collide `año` with `ano`.

### Verb paradigms

The corpora only attest the forms they happened to contain — a median of 10 per
verb against a ~50-form paradigm — so `cociné` did not match `cocinar` and
`dibuje` did not match `dibujar`. `scripts/build-conjugations.mjs` generates
the full paradigm with
[@jirimracek/conjugate-esp](https://www.npmjs.com/package/@jirimracek/conjugate-esp),
in `castellano` region so vosotros forms are present, taking verbs from 10.5 to
54.4 forms each. It also writes the structured `conjugations` the
word-introduction UI reads.

Validated against the attested forms before adopting it: the library recognises
98.6% of the curriculum's verbs and reproduces 93.2% of the forms the corpora
actually contained. The shortfall is almost entirely corpus typos (`haía`,
`podel`), clitic-attached forms (`véase`), and nouns homographic with verbs
(`poderes`, `deberes`). Two real gaps were closed by hand: participles are
inflected for gender and number, which the library returns only in the
masculine singular, and `hay` is added to `haber`.

The 11 lemmas no conjugator recognises — `hagar`, `llever`, `confunder` and so
on — were treebank lemmatisation errors rather than vocabulary, and are dropped.
Ranks are left gapped rather than renumbered, since serving order only reads
`order by rank`.

## Access model

The browser never reaches Postgres. Every read and write goes through a Server
Action using the service-role key; RLS is on with no policies, so the anon role
is denied everything and the database is unreachable from the client.

App access is a shared password: set `APP_PASSWORD` and visit `/?p=<password>`
once to set the cookie. Leave it unset locally and the gate is off.

## Deliberate omissions

- **No OCR.** Tesseract scores roughly 46% at word level on handwriting, which
  would poison the evidence tracker rather than feed it. The photo is stored as
  proof of work and never parsed; the evidence rule reads the typed journal.
- **No runtime NLP.** Matching free writing to lemmas is a lookup against the
  precomputed `word_forms` table, so there is no Python service to host and
  words outside the curriculum cannot false-positive.
