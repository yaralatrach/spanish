-- The introduction session runs in passes over the whole batch, so a refresh
-- mid-session needs to land back where it was. Stored on the session rather
-- than per word, because the unit of progress is the pass, not the word.
alter table sessions add column if not exists pass_index integer not null default 0;
