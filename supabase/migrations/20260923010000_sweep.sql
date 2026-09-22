-- Sweep mode: clearing known vocabulary in bulk before daily study starts.
--
-- The placement test sets a level, but serving new words starts at rank 1
-- regardless, so a B1 speaker would spend weeks clicking through words she has
-- known for years. Rather than skipping ahead by level, which guesses and would
-- hide the common words she genuinely does not know, the sweep shows large
-- batches to assess quickly. It stays evidence-based: nothing is assumed from
-- the level, she still says so for every word.

alter table profile add column if not exists sweep_completed_at timestamptz;
alter table profile add column if not exists sweep_position integer not null default 0;

-- Words not yet assessed at all, in frequency order.
create or replace function sweep_batch(p_after_rank integer, p_count integer default 100)
returns setof words
language sql
as $$
  select w.*
  from words w
  left join word_progress p on p.word_id = w.id
  where w.rank > p_after_rank
    and p.word_id is null
  order by w.rank
  limit p_count;
$$;
