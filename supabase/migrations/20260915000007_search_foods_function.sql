-- Single round-trip search + pagination for the food database (spec section
-- 14/15). Not SECURITY DEFINER: runs as the calling role, so the existing
-- "foods_select_authenticated" RLS policy still applies.

create function public.search_foods(
  search_query text default '',
  page_limit int default 20,
  page_offset int default 0
)
returns table (
  id uuid,
  name_vi text,
  unit text,
  calo_per_unit numeric,
  protein_g numeric,
  carb_g numeric,
  fat_g numeric,
  category text,
  source text,
  total_count bigint
)
language sql
stable
as $$
  select
    f.id, f.name_vi, f.unit, f.calo_per_unit, f.protein_g, f.carb_g, f.fat_g,
    f.category, f.source,
    count(*) over () as total_count
  from foods f
  where
    trim(search_query) = ''
    or f.name_vi_unaccent ilike '%' || public.immutable_unaccent(lower(trim(search_query))) || '%'
  order by f.name_vi
  limit page_limit offset page_offset;
$$;
