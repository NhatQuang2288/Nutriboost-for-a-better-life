-- Core tables (see spec section 6). All PKs are UUID, timestamps stored UTC.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null check (char_length(trim(full_name)) > 0),
  email text not null,
  created_at timestamptz not null default now()
);

-- Bridges the invite -> join flow. Not one of the ten named tables in the
-- spec because none of them can hold a pending client's data before they
-- have an auth account (clients.profile_id / age / height_cm / ... below
-- are all NOT NULL, matching the spec's column list literally).
create table client_invites (
  id uuid primary key default gen_random_uuid(),
  pt_id uuid not null references profiles (id) on delete cascade,
  code text not null unique,
  full_name text not null check (char_length(trim(full_name)) > 0),
  age int not null check (age between 10 and 100),
  height_cm numeric(5, 1) not null check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) not null check (weight_kg between 20 and 400),
  sex sex not null,
  activity_level activity_level not null,
  goal_type goal_type not null default 'lose_weight',
  target_weight_kg numeric(5, 1) not null check (target_weight_kg between 20 and 400),
  target_date date not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  pt_id uuid not null references profiles (id) on delete cascade,
  profile_id uuid not null unique references profiles (id) on delete cascade,
  age int not null check (age between 10 and 100),
  height_cm numeric(5, 1) not null check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) not null check (weight_kg between 20 and 400),
  sex sex not null,
  activity_level activity_level not null,
  goal_type goal_type not null default 'lose_weight',
  target_weight_kg numeric(5, 1) not null check (target_weight_kg between 20 and 400),
  target_date date not null,
  status client_status not null default 'active',
  created_at timestamptz not null default now()
);

create table nutrition_targets (
  client_id uuid primary key references clients (id) on delete cascade,
  bmi numeric(4, 1) not null,
  bmi_category text not null,
  bmr numeric(6, 1) not null,
  tdee numeric(6, 1) not null,
  daily_calo numeric(6, 1) not null,
  protein_g numeric(6, 1) not null,
  carb_g numeric(6, 1) not null,
  fat_g numeric(6, 1) not null,
  water_ml numeric(7, 1) not null,
  calculated_at timestamptz not null default now()
);

create table foods (
  id uuid primary key default gen_random_uuid(),
  name_vi text not null check (char_length(trim(name_vi)) > 0),
  unit text not null,
  calo_per_unit numeric(6, 1) not null check (calo_per_unit >= 0),
  protein_g numeric(6, 1) not null default 0 check (protein_g >= 0),
  carb_g numeric(6, 1) not null default 0 check (carb_g >= 0),
  fat_g numeric(6, 1) not null default 0 check (fat_g >= 0),
  category text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  week_start date not null,
  status meal_plan_status not null default 'draft',
  generated_by meal_plan_generator not null default 'pt',
  token_cost int not null default 0 check (token_cost >= 0),
  created_at timestamptz not null default now()
);

create table meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references meal_plans (id) on delete cascade,
  day_index int not null check (day_index between 0 and 6),
  meal_type meal_type not null,
  food_id uuid not null references foods (id),
  quantity numeric(6, 2) not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table meal_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  logged_at timestamptz not null default now(),
  meal_type meal_type not null,
  food_id uuid not null references foods (id),
  quantity numeric(6, 2) not null check (quantity > 0),
  source meal_log_source not null default 'client',
  created_at timestamptz not null default now()
);

create table progress_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  logged_at timestamptz not null default now(),
  weight_kg numeric(5, 1) not null check (weight_kg between 20 and 400),
  note text,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  pt_id uuid not null unique references profiles (id) on delete cascade,
  tier subscription_tier not null default 'plus',
  max_clients int not null default 5 check (max_clients > 0),
  started_at timestamptz not null default now(),
  status subscription_status not null default 'active',
  created_at timestamptz not null default now()
);

create index clients_pt_id_idx on clients (pt_id);
create index clients_profile_id_idx on clients (profile_id);
create index client_invites_pt_id_idx on client_invites (pt_id);
create index meal_plans_client_id_idx on meal_plans (client_id);
create index meal_plan_items_meal_plan_id_idx on meal_plan_items (meal_plan_id);
create index meal_logs_client_id_logged_at_idx on meal_logs (client_id, logged_at desc);
create index progress_logs_client_id_logged_at_idx on progress_logs (client_id, logged_at desc);
