-- Helper functions used by RLS policies. Marked SECURITY DEFINER so they can
-- read `clients`/`profiles` internally without re-triggering RLS recursively,
-- and STABLE so the planner can reuse the result within one statement.

create function public.is_pt_of_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from clients
    where id = target_client_id and pt_id = auth.uid()
  );
$$;

create function public.is_own_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from clients
    where id = target_client_id and profile_id = auth.uid()
  );
$$;

create function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- Creates the matching profiles row whenever a new Supabase Auth user is
-- created. `role` and `full_name` must be passed as auth signUp() metadata
-- (options.data) by the register / join-by-invite flows in Phase 2.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
