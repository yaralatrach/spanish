-- Every attempt at a word, and the confidence that falls out of them.
--
-- Until now "no lo sé" wrote nothing: a word given up on sat in exactly the
-- same state as one produced cleanly first try. That is the signal the review
-- engine needs, so it is recorded from the start rather than reconstructed
-- later from nothing.

create table if not exists attempts (
  id         bigserial primary key,
  word_id    bigint not null references words (id) on delete cascade,
  day        date   not null,
  pass       text   not null check (pass in ('reconocer','completar','producir','lectura')),
  outcome    text   not null check (outcome in ('clean','hinted','revealed','wrong')),
  hints      integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists attempts_word_idx on attempts (word_id, created_at desc);

alter table attempts enable row level security;

-- 0 to 100. An exponential moving average over attempt quality, so one bad day
-- does not erase a word she knows, and one lucky guess does not promote one she
-- does not.
alter table word_progress add column if not exists confidence integer not null default 0;
