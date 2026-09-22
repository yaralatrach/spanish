-- Definitions and examples shown when a word is introduced.
--
-- In Spanish, not English: the app is monolingual, and writing the English
-- definition is the first production task, so an English gloss on screen would
-- answer it. Written in batches as the curriculum is reached, per the spec.
alter table words add column if not exists definition_es text;
