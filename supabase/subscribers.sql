-- Subscribers table for newsletter / daily-signals capture

create table if not exists public.subscribers (
  id bigserial primary key,
  email text not null,
  subscriber_state text not null default 'active',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscribers_state_check check (subscriber_state in ('active', 'inactive', 'unsubscribed'))
);

-- Case-insensitive uniqueness for email addresses
create unique index if not exists subscribers_email_unique_lower
  on public.subscribers (lower(email));

create index if not exists idx_subscribers_state
  on public.subscribers (subscriber_state);

-- Keep updated_at fresh on updates
create or replace function public.set_subscribers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_subscribers_updated_at on public.subscribers;
create trigger trg_set_subscribers_updated_at
before update on public.subscribers
for each row
execute function public.set_subscribers_updated_at();

-- RLS: only server-side service role should read/write subscribers directly.
-- Public browser clients should go through /api/subscribe.
alter table public.subscribers enable row level security;

drop policy if exists subscribers_service_role_all on public.subscribers;
create policy subscribers_service_role_all
on public.subscribers
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
