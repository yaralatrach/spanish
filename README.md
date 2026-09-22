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

### Lemma families

`scripts/build-families.mjs` groups roots with their derivations — `fruta` with
`frutal`, `frutería`, `frutero`. Nothing in the corpora records that one word
derives from another, so this is *constructed* from Spanish derivational
suffixes rather than looked up, and is approximate by design. Candidates are
kept only if they occur at least 50 times in the subtitle corpus, which keeps
out invented words; the lexicon only filters candidates the rules construct, so
the proper nouns and typos in that frequency band can never be proposed.

1,091 roots carry a family, 1,518 members in total, 1,100 of them below the
curriculum cutoff. Spot-checking around fifty found roughly one questionable
member in twenty (`marcha` → `marchal`, a surname rather than a word).
Irregular derivations are missed entirely — `pan` → `panadería` and `pelo` →
`peluquería` do not follow the regular patterns — which is the intended
direction to fail in.

Filtering members that appear as `PROPN` in the treebanks was tried and
rejected: it would have removed `contar` → `contador`, `libro` → `librería` and
`broma` → `bromista`, which are tagged that way only because they occur inside
institution names.

Members below the cutoff are display context. They are not in `word_forms`, so
writing `frutería` credits nothing yet — crediting them needs a `words` row,
which is a decision for the word-introduction UI rather than a schema guess now.

### Audit against hand-reviewed data

Mark Davies' argument for the Corpus del Español is that large web corpora are
auto-tagged and never corrected, so their lemma lists fill with junk. Checked
against his own published data for Spanish `s-` words, that is accurate: in
Sketch Engine's verb list, 51.6% of the top 500 lemmas are flagged as problems,
rising to 99% beyond rank 3,000.

His lists are hand-reviewed, so they double as a reference to audit this
curriculum against. Of its 308 `s-` lemmas tagged noun, verb, adjective or
adverb:

| | |
| --- | --- |
| Confirmed correct by his review | 285 (92.5%) |
| Flagged by him as problems | 14 (4.5%) |
| Absent from his lists | 9 (2.9%) |

The gap between this and Sketch Engine is mostly down to source: AnCora and GSD
are hand-annotated treebanks, not auto-tagged web text. The flagged remainder
was real, though, and `scripts/clean-curriculum.mjs` acts on it — 16 non-words
removed (abbreviated titles, bare letters, `$`, Catalan `i`). `a`, `y`, `o`,
`e` and `u` are equally short and were kept: they are real function words.

The nine "absent" entries were all participle-adjectives, which his review
treats as verb forms rather than lemmas. They are linked to their verb rather
than deleted, because `divertido`, `pesado`, `querido` and `aburrido` mean
things their verbs do not, and 147 such links exist.

What this audit cannot reach is the opposite failure: a word absent from the
treebanks cannot enter the curriculum however common it is in speech. `zumo`
and `enfadar` are both missing for that reason despite being ordinary
Peninsular vocabulary — `enfadar` and `enfadado` together outnumber `enojar` in
the subtitle corpus. A broad hand-lemmatised corpus would fix that; the
treebanks cannot.

## Deliberate omissions

- **No OCR.** Tesseract scores roughly 46% at word level on handwriting, which
  would poison the evidence tracker rather than feed it. The photo is stored as
  proof of work and never parsed; the evidence rule reads the typed journal.
- **No runtime NLP.** Matching free writing to lemmas is a lookup against the
  precomputed `word_forms` table, so there is no Python service to host and
  words outside the curriculum cannot false-positive.
