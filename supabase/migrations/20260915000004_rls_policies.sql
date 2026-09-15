-- Row Level Security. Every table is enabled; policies encode exactly the
-- ownership rules from spec section 8 (PT sees own clients only, client
-- sees only their own data). API route handlers must still re-check
-- authorization server-side — RLS is the last line of defense, not the only one.

alter table profiles enable row level security;
alter table client_invites enable row level security;
alter table clients enable row level security;
alter table nutrition_targets enable row level security;
alter table foods enable row level security;
alter table meal_plans enable row level security;
alter table meal_plan_items enable row level security;
alter table meal_logs enable row level security;
alter table progress_logs enable row level security;
alter table subscriptions enable row level security;

-- profiles ---------------------------------------------------------------

create policy "profiles_select_own_or_managed" on profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from clients c
      where c.profile_id = profiles.id and c.pt_id = auth.uid()
    )
  );

create policy "profiles_insert_self" on profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_self_or_managed" on profiles
  for update using (
    id = auth.uid()
    or exists (
      select 1 from clients c
      where c.profile_id = profiles.id and c.pt_id = auth.uid()
    )
  );

-- client_invites -----------------------------------------------------------
-- No policy allows anon/public reads: the /join/[code] flow looks up a code
-- through an API route using the service-role client after validating the
-- code server-side (spec section 8's "server authorization check" layer).

create policy "client_invites_pt_manages_own" on client_invites
  for all using (pt_id = auth.uid()) with check (pt_id = auth.uid());

-- clients ------------------------------------------------------------------

create policy "clients_select_own" on clients
  for select using (pt_id = auth.uid() or profile_id = auth.uid());

create policy "clients_insert_by_pt" on clients
  for insert with check (pt_id = auth.uid());

create policy "clients_update_by_pt" on clients
  for update using (pt_id = auth.uid());

create policy "clients_delete_by_pt" on clients
  for delete using (pt_id = auth.uid());

-- nutrition_targets ----------------------------------------------------------
-- Read-only for the client; PT (or the server acting on the PT's session)
-- is the only writer, since values are always derived, never hand-entered.

create policy "nutrition_targets_select" on nutrition_targets
  for select using (
    is_pt_of_client(client_id) or is_own_client(client_id)
  );

create policy "nutrition_targets_write_by_pt" on nutrition_targets
  for insert with check (is_pt_of_client(client_id));

create policy "nutrition_targets_update_by_pt" on nutrition_targets
  for update using (is_pt_of_client(client_id));

-- foods ----------------------------------------------------------------------
-- Shared reference data: any signed-in user (PT or client) can read it.
-- No insert/update/delete policy — writes only via the seed script (admin key).

create policy "foods_select_authenticated" on foods
  for select to authenticated using (true);

-- meal_plans / meal_plan_items ------------------------------------------------
-- Schema only in Release 1 (see spec section 4); policies keep the same
-- ownership shape as everything else so RLS is never left disabled.

create policy "meal_plans_select" on meal_plans
  for select using (is_pt_of_client(client_id) or is_own_client(client_id));

create policy "meal_plans_write_by_pt" on meal_plans
  for all using (is_pt_of_client(client_id)) with check (is_pt_of_client(client_id));

create policy "meal_plan_items_select" on meal_plan_items
  for select using (
    exists (
      select 1 from meal_plans mp
      where mp.id = meal_plan_items.meal_plan_id
        and (is_pt_of_client(mp.client_id) or is_own_client(mp.client_id))
    )
  );

create policy "meal_plan_items_write_by_pt" on meal_plan_items
  for all using (
    exists (
      select 1 from meal_plans mp
      where mp.id = meal_plan_items.meal_plan_id and is_pt_of_client(mp.client_id)
    )
  ) with check (
    exists (
      select 1 from meal_plans mp
      where mp.id = meal_plan_items.meal_plan_id and is_pt_of_client(mp.client_id)
    )
  );

-- meal_logs --------------------------------------------------------------
-- Insert-only from the app (Release 1 has no edit/delete of a saved log).

create policy "meal_logs_select" on meal_logs
  for select using (is_pt_of_client(client_id) or is_own_client(client_id));

create policy "meal_logs_insert" on meal_logs
  for insert with check (is_pt_of_client(client_id) or is_own_client(client_id));

-- progress_logs ------------------------------------------------------------
-- Only the client logs their own weight (spec section 25); PT is read-only.

create policy "progress_logs_select" on progress_logs
  for select using (is_pt_of_client(client_id) or is_own_client(client_id));

create policy "progress_logs_insert_by_client" on progress_logs
  for insert with check (is_own_client(client_id));

-- subscriptions --------------------------------------------------------------
-- Read-only through the app. Release 1 has no billing, so tier changes are
-- made directly in the database (service role / Supabase dashboard) per spec.

create policy "subscriptions_select_own" on subscriptions
  for select using (pt_id = auth.uid());
