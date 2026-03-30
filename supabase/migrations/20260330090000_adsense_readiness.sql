create extension if not exists "uuid-ossp";

create table if not exists public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Public can insert contact messages"
on public.contact_messages
for insert
to public
with check (true);

create table if not exists public.site_content (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now()
);

alter table public.site_content enable row level security;
