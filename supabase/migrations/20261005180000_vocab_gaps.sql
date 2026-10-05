-- Words she reached for in English because she did not have the Spanish.
--
-- This is the best signal the app has about what to teach her next. Frequency
-- rank says what Spanish speakers say often; a word she tried to use today
-- says what she needs. The second beats the first.

create table if not exists vocab_gaps (
  id         bigserial primary key,
  english    text not null,
  spanish    text not null,
  note       text,
  day        date not null,
  word_id    bigint references words (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (english, spanish)
);

alter table vocab_gaps enable row level security;

alter table words add column if not exists wanted boolean not null default false;

-- Wanted words are served before the next one down the frequency list.
create or replace function serve_daily_words(p_day date, p_count integer default 10)
returns setof words
language plpgsql
as $$
declare
  already integer;
begin
  select count(*) into already from words where introduced_on = p_day;

  if already = 0 then
    update words
    set introduced_on = p_day
    where id in (
      select w.id
      from words w
      left join word_progress p on p.word_id = w.id
      where w.introduced_on is null
        and coalesce(p.status, 'new') <> 'known'
      order by w.wanted desc, w.rank
      limit p_count
    );

    update sessions
    set new_words_served = (select count(*) from words where introduced_on = p_day)
    where day = p_day;
  end if;

  return query select * from words where introduced_on = p_day order by wanted desc, rank;
end;
$$;
