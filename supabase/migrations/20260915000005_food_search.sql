-- Accent-insensitive food search (spec section 14): "pho bo" must find "Phở bò".
-- unaccent() is STABLE, not IMMUTABLE, so it cannot back a generated column or
-- a functional index directly — wrap it in an IMMUTABLE function first.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

create function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
as $$
  select unaccent('unaccent', $1);
$$;

alter table foods
  add column name_vi_unaccent text
  generated always as (public.immutable_unaccent(lower(name_vi))) stored;

create index foods_name_vi_unaccent_trgm_idx
  on foods using gin (name_vi_unaccent gin_trgm_ops);
