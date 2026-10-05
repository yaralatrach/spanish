-- The grammar correction for the day's journal, cached so the same entry is
-- never sent to the model twice.
alter table sessions add column if not exists journal_review jsonb;
alter table sessions add column if not exists review_seen_at timestamptz;
alter table sessions add column if not exists passage text;
-- The example sentence in English, for the "no lo sé" reveal on the cloze.
-- Stored rather than translated on demand: this button gets pressed often, and
-- it should never cost money or make her wait.
alter table words add column if not exists example_en text;
