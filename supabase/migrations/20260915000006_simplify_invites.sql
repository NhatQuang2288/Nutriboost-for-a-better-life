-- Revises the invite design after re-reading spec section 16 more carefully:
-- POST /api/clients creates the real client row (subscription-limit checked
-- at that moment) *before* POST /api/clients/[id]/invite generates a code —
-- not the "draft profile in client_invites" staging design from migration
-- 000002. That design is replaced here:
--   1. clients.profile_id becomes nullable (unset until the invite is
--      redeemed and a real auth account exists).
--   2. clients gains full_name — needed so the PT's client list can show a
--      name for a client who has been added but hasn't joined yet, which
--      profiles.full_name can't provide (no auth account = no profiles row).
--      Not one of the columns spec section 6 lists for `clients`; documented
--      deviation.
--   3. client_invites drops the draft-profile columns — the real data now
--      lives on `clients` from the start, so an invite is just a token.

alter table clients
  alter column profile_id drop not null,
  add column full_name text not null check (char_length(trim(full_name)) > 0);

drop policy if exists "client_invites_pt_manages_own" on client_invites;
drop table client_invites;

create table client_invites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references clients (id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index client_invites_client_id_idx on client_invites (client_id);

alter table client_invites enable row level security;

create policy "client_invites_pt_manages_own" on client_invites
  for all using (is_pt_of_client(client_id)) with check (is_pt_of_client(client_id));
