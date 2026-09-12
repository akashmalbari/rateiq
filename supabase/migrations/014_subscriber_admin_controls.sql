alter table public.users
  add column if not exists access_status text not null default 'active',
  add column if not exists access_granted_at timestamptz,
  add column if not exists access_granted_by uuid references public.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_access_status_check'
  ) then
    alter table public.users
      add constraint users_access_status_check
      check (access_status in ('active', 'inactive'));
  end if;
end
$$;

create index if not exists users_access_status_idx
on public.users (access_status, created_at desc);

create table if not exists public.subscriber_admin_actions (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.users(id) on delete cascade,
  admin_user_id uuid references public.users(id) on delete set null,
  action text not null check (
    action in ('access_activated', 'access_deactivated', 'email_opted_in', 'email_opted_out', 'premium_granted', 'stripe_upgraded', 'stripe_cancellation_scheduled')
  ),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists subscriber_admin_actions_target_created_idx
on public.subscriber_admin_actions (target_user_id, created_at desc);

alter table public.subscriber_admin_actions enable row level security;
revoke all on table public.subscriber_admin_actions from public, anon, authenticated;

create or replace function public.current_user_has_premium_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    left join public.subscriptions s on s.user_id = u.id
    where u.id = auth.uid()
      and (
        u.role = 'admin'
        or (
          u.access_status = 'active'
          and (
            (s.tier = 'premium' and s.status in ('active', 'trialing'))
            or (u.subscription_tier = 'premium' and u.access_granted_at is not null)
            or exists (
              select 1
              from public.premium_invites i
              where i.redeemed_by = u.id
                and i.redeemed_at is not null
                and i.revoked_at is null
            )
          )
        )
      )
  );
$$;

revoke all on function public.current_user_has_premium_access() from public, anon;
grant execute on function public.current_user_has_premium_access() to authenticated;

notify pgrst, 'reload schema';
