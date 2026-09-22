-- Links a participle-adjective to the verb it comes from: sentado -> sentar.
--
-- These are not merged away. divertido, pesado, querido and aburrido carry
-- adjectival meanings their verbs do not, so treating them as duplicates would
-- lose real vocabulary. The link lets the introduction UI show them beside
-- their verb instead of on a day of their own.
alter table words add column if not exists participle_of text;
