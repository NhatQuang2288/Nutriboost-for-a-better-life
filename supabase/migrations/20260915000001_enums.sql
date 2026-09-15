-- Enums used across the schema (see spec section 7).

create type user_role as enum ('pt', 'client');

create type sex as enum ('male', 'female');

create type activity_level as enum (
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active'
);

create type goal_type as enum ('lose_weight', 'maintain', 'gain_muscle');

create type client_status as enum ('active', 'paused', 'achieved');

create type meal_plan_status as enum ('draft', 'approved', 'sent');

create type meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');

create type meal_log_source as enum ('client', 'pt');

create type subscription_tier as enum ('plus', 'premium', 'diamond');

create type subscription_status as enum ('active', 'canceled');

create type meal_plan_generator as enum ('pt', 'ai');
