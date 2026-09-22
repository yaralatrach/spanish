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
3. Seed the curriculum, once:
   `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs`
4. `npm install && npm run dev`

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

### Known gap

Forms are only those the treebanks actually attested, which is fine for nouns
(median 2 — singular and plural) but thin for verbs (median 9 against a ~50-form
paradigm). So `cociné` does not currently match `cocinar`. This needs a
rule-based conjugator, which the `conjugations` column wants anyway for the
word-introduction UI. Until then the evidence rule under-credits, which is the
safe direction to be wrong in: a missed word simply stays up for review.

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
