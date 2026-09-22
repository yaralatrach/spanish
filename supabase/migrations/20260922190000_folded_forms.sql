-- Accent-insensitive fallback for the evidence rule.
--
-- Real journal input misses accents far more often than it misses conjugations:
-- reunion, presentacion, tramites and padron all failed to match on day one for
-- that reason alone. Exact matching still runs first, so canto and cantó stay
-- distinct when the accent is actually typed; this is only the fallback.
--
-- ñ is deliberately NOT folded. It is a distinct letter, not an accented n, and
-- folding it would collide año with ano.

alter table word_forms add column if not exists form_folded text;

update word_forms
set form_folded = translate(form, 'áéíóúüÁÉÍÓÚÜ', 'aeiouuAEIOUU')
where form_folded is null;

alter table word_forms alter column form_folded set not null;

create index if not exists word_forms_folded_idx on word_forms (form_folded);
