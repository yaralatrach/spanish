-- English gloss and etymology alongside the Spanish definition.
--
-- The Spanish definition stays primary; the English one was asked for
-- explicitly, and having both is how a bilingual learner's dictionary reads.
-- Etymology earns its place here because a root learned once pays off across a
-- whole family: rumpere explains romper, ruptura, irrumpir and corromper.
alter table words add column if not exists definition_en text;
alter table words add column if not exists etymology_es  text;
