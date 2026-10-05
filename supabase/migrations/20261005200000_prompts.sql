-- The day's writing prompt and the theme it carries.
--
-- A blank page is the hardest version of the journal gate. The prompt is the
-- scaffolding, and its theme is stored because it is what the day's new words
-- should follow: what she wrote about decides what she is taught next.
--
-- prompt_offset records how many times she asked for a different question, so
-- a refresh does not swap the prompt out from under a half-written entry.
alter table sessions add column if not exists prompt_offset integer not null default 0;
alter table sessions add column if not exists theme text;
