-- Serving the day's new words.
--
-- This lives in the database rather than the app so that the pick-and-stamp is
-- one statement: a refresh mid-introduction must not hand out a second batch,
-- and two tabs must not disagree about what today's words are.

-- Family members below the curriculum cutoff have no words row to hang
-- progress off -- frutería is shown beside fruta but is not itself ranked. This
-- records what she has said about them without inventing a rank for them.
create table if not exists derived_progress (
  lemma        text primary key,
  root_word_id bigint references words (id) on delete cascade,
  status       text not null check (status in ('known', 'unknown')),
  updated_at   timestamptz not null default now()
);

alter table derived_progress enable row level security;

create or replace function serve_daily_words(p_day date, p_count integer default 10)
returns setof words
language plpgsql
as $$
declare
  already integer;
begin
  select count(*) into already from words where introduced_on = p_day;

  if already = 0 then
    -- A word she has already produced in her own writing is not new to her,
    -- so it is skipped rather than taught.
    update words
    set introduced_on = p_day
    where id in (
      select w.id
      from words w
      left join word_progress p on p.word_id = w.id
      where w.introduced_on is null
        and coalesce(p.status, 'new') <> 'known'
      order by w.rank
      limit p_count
    );

    update sessions
    set new_words_served = (select count(*) from words where introduced_on = p_day)
    where day = p_day;
  end if;

  return query select * from words where introduced_on = p_day order by rank;
end;
$$;
