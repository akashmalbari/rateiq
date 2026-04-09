-- Trading desk user accounts
-- Run this in the Supabase SQL editor before using the registration/login flow.

create extension if not exists pgcrypto;

create table if not exists public.trading_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null,
  password_hash text not null,
  password_salt text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'user')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz
);

create unique index if not exists trading_users_email_unique_idx
  on public.trading_users (lower(email));

create or replace function public.set_trading_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_trading_users_updated_at on public.trading_users;
create trigger trg_trading_users_updated_at
before update on public.trading_users
for each row
execute function public.set_trading_users_updated_at();

alter table public.trading_users enable row level security;

comment on table public.trading_users is 'Database-backed login accounts for the private trading desk.';
