-- Review. Words had a due_at and a confidence and nothing read either, so
-- nothing ever came back: the app taught and forgot.
--
-- Review runs before the day's new words, per the method: what is already
-- half-known is worth more than what is not known at all.

alter table sessions add column if not exists repaso_done_at timestamptz;

create or replace function due_words(p_limit integer default 20)
returns table (
  id bigint, lemma text, pos text, rank integer,
  definition_es text, definition_en text, example_es text, example_en text,
  etymology_es text, conjugations jsonb, family jsonb, participle_of text,
  confidence integer, srs_step integer
)
language sql
as $$
  select w.id, w.lemma, w.pos, w.rank,
         w.definition_es, w.definition_en, w.example_es, w.example_en,
         w.etymology_es, w.conjugations, w.family, w.participle_of,
         p.confidence, p.srs_step
  from word_progress p
  join words w on w.id = p.word_id
  where p.due_at is not null
    and p.due_at <= now()
    and p.status <> 'known'
    -- Only what she has actually been taught. A word flagged unknown in the
    -- sweep has never been introduced and has no entry, so there is nothing to
    -- review it with; it waits its turn as one of the day's new words.
    and w.introduced_on is not null
  order by p.due_at
  limit p_limit;
$$;
