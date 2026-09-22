-- Lemma families: fruta -> frutal, frutería, frutero.
--
-- Stored as jsonb on the root rather than as a foreign key, because most
-- members are not curriculum words and so have no row to point at. frutería
-- sits below the 4,989 cutoff but belongs beside fruta, and rides along as
-- context: shown when the root is introduced, never counted against the
-- daily ten.
--
-- family_root was the original design, pointing each word at its root. It is
-- the wrong direction for that reason and was never populated.

alter table words drop column if exists family_root;
alter table words add column if not exists family jsonb not null default '[]'::jsonb;

drop index if exists words_family_idx;
