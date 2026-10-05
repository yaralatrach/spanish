-- The grammar correction for the day's journal, cached so the same entry is
-- never sent to the model twice.
alter table sessions add column if not exists journal_review jsonb;
alter table sessions add column if not exists review_seen_at timestamptz;
alter table sessions add column if not exists passage text;
