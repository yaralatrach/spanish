-- Spanish 5000-word curriculum app: initial schema.
--
-- Access model: every read/write goes through Next.js Server Actions using the
-- service-role key. RLS is enabled with NO policies, so the anon/authenticated
-- roles are denied everything and the database is unreachable from the browser.
-- service_role bypasses RLS, so the server keeps full access.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profile --
-- Single learner. Enforced single-row by the `singleton` check.
create table profile (
  id                     boolean primary key default true check (id),
  level                  text check (level in ('A1','A2','B1','B2','C1','C2')),
  placement_completed_at timestamptz,
  created_at             timestamptz not null default now()
);

-- ------------------------------------------------------------------ words --
-- The curriculum, one row per lemma, ordered by frequency rank.
create table words (
  id            bigserial primary key,
  lemma         text   not null unique,
  pos           text   not null,
  rank          integer not null unique,
  gloss_en      text,
  example_es    text,
  -- Lemma family: frutería -> fruta, cocinero -> cocinar. Self-referential so a
  -- family can be introduced together rather than scattered across days.
  family_root   text,
  theme         text,
  -- Inflected forms with their morphological features, for the introduction UI.
  conjugations  jsonb  not null default '[]'::jsonb,
  introduced_on date,
  created_at    timestamptz not null default now()
);

create index words_rank_idx        on words (rank);
create index words_family_idx      on words (family_root) where family_root is not null;
create index words_introduced_idx  on words (introduced_on) where introduced_on is not null;

-- ------------------------------------------------------------- word_forms --
-- Surface form -> lemma. Precomputed so free-writing evidence matching is a
-- plain lookup: no runtime NLP, and forms outside the curriculum can't match.
create table word_forms (
  form    text   not null,
  word_id bigint not null references words (id) on delete cascade,
  primary key (form, word_id)
);

create index word_forms_form_idx on word_forms (form);

-- ---------------------------------------------------------- word_progress --
-- SRS state. srs_step indexes the interval ladder in lib/srs.ts.
create table word_progress (
  word_id        bigint primary key references words (id) on delete cascade,
  status         text   not null default 'new'
                 check (status in ('new','learning','known')),
  srs_step       integer not null default 0,
  due_at         timestamptz,
  -- How the word was first established as known. 'free_writing' is the
  -- strongest signal: unprimed production, not a click on a prompt.
  known_source   text check (known_source in ('click','free_writing','quiz')),
  first_known_at timestamptz,
  lapses         integer not null default 0,
  updated_at     timestamptz not null default now()
);

create index word_progress_due_idx on word_progress (due_at) where due_at is not null;

-- --------------------------------------------------------------- sessions --
-- One row per Europe/Madrid-local day. `day` is the session boundary.
create table sessions (
  day                  date primary key,
  journal_text         text,
  journal_submitted_at timestamptz,
  new_words_served     integer not null default 0,
  -- Proof-of-work photo of the handwritten production tasks. Stored, never
  -- parsed: handwriting OCR is too inaccurate to feed the evidence tracker.
  photo_path           text,
  photo_uploaded_at    timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz not null default now()
);

-- ----------------------------------------------- placement_responses ------
create table placement_responses (
  id          bigserial primary key,
  question_id text not null,
  answer      text not null,
  correct     boolean not null,
  level_band  text not null,
  answered_at timestamptz not null default now()
);

-- -------------------------------------------------------------------- RLS --
alter table profile             enable row level security;
alter table words               enable row level security;
alter table word_forms          enable row level security;
alter table word_progress       enable row level security;
alter table sessions            enable row level security;
alter table placement_responses enable row level security;
