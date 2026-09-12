create table if not exists public.invite_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(trim(email)) and length(email) between 3 and 320),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'declined')),
  invite_id uuid references public.premium_invites(id) on delete set null,
  provider_message_id text,
  error_message text,
  requested_at timestamptz not null default now(),
  invited_at timestamptz,
  handled_at timestamptz,
  handled_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists invite_requests_open_email_idx
on public.invite_requests (lower(email))
where status in ('pending', 'processing');

create index if not exists invite_requests_status_requested_idx
on public.invite_requests (status, requested_at desc);

drop trigger if exists invite_requests_set_updated_at on public.invite_requests;
create trigger invite_requests_set_updated_at
before update on public.invite_requests
for each row execute function public.set_updated_at();

alter table public.invite_requests enable row level security;
revoke all on table public.invite_requests from public, anon, authenticated;

notify pgrst, 'reload schema';
