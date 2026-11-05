-- Signal Flow database schema
-- Run this entire file in Supabase: SQL Editor -> New query -> Run.
-- Row Level Security ensures each signed-in user can access only their own records.

create extension if not exists pgcrypto;

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Other',
  model text default '',
  connection_type text default '',
  location text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.service_setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  service_type text not null default 'Sunday Service',
  description text default '',
  flow_data jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.equipment enable row level security;
alter table public.service_setups enable row level security;

drop policy if exists "Users manage their own equipment" on public.equipment;
create policy "Users manage their own equipment"
on public.equipment for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage their own service setups" on public.service_setups;
create policy "Users manage their own service setups"
on public.service_setups for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists equipment_user_id_idx on public.equipment(user_id);
create index if not exists service_setups_user_id_idx on public.service_setups(user_id);
