alter table public.subscriptions
  alter column status set default 'inactive',
  add column if not exists stripe_price_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists last_stripe_event_id text,
  add column if not exists last_stripe_event_created_at timestamptz;

update public.subscriptions
set status = 'inactive'
where stripe_subscription_id is null
  and status = 'active';

create unique index if not exists subscriptions_stripe_customer_idx
on public.subscriptions (stripe_customer_id)
where stripe_customer_id is not null;

create unique index if not exists subscriptions_stripe_subscription_idx
on public.subscriptions (stripe_subscription_id)
where stripe_subscription_id is not null;

create table if not exists public.subscription_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  percent_off numeric(5,2) not null check (percent_off > 0 and percent_off <= 100),
  duration text not null check (duration in ('once', 'forever')),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  expires_at timestamptz,
  stripe_coupon_id text not null unique,
  stripe_promotion_code_id text not null unique,
  active boolean not null default true,
  times_redeemed integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscription_coupons_code_idx
on public.subscription_coupons (upper(code));

create index if not exists subscription_coupons_active_created_idx
on public.subscription_coupons (active, created_at desc);

drop trigger if exists subscription_coupons_set_updated_at on public.subscription_coupons;
create trigger subscription_coupons_set_updated_at
before update on public.subscription_coupons
for each row execute function public.set_updated_at();

alter table public.subscription_coupons enable row level security;

create table if not exists public.billing_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.billing_webhook_events enable row level security;

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
        or (s.tier = 'premium' and s.status in ('active', 'trialing'))
      )
  );
$$;

revoke all on function public.current_user_has_premium_access() from public, anon;
grant execute on function public.current_user_has_premium_access() to authenticated;

revoke update on table public.users from authenticated;
grant update (full_name, avatar_url, email_digest_enabled) on table public.users to authenticated;

drop policy if exists "authenticated read completed scans" on public.scans;
create policy "premium read completed scans" on public.scans
for select to authenticated
using (status = 'completed' and public.current_user_has_premium_access());

drop policy if exists "authenticated read strategies" on public.strategies;
create policy "premium read strategies" on public.strategies
for select to authenticated
using (public.current_user_has_premium_access());

drop policy if exists "authenticated read recommendations" on public.recommendations;
create policy "premium read recommendations" on public.recommendations
for select to authenticated
using (public.current_user_has_premium_access());

drop policy if exists "authenticated read option contracts" on public.option_contracts;
create policy "premium read option contracts" on public.option_contracts
for select to authenticated
using (public.current_user_has_premium_access());

drop policy if exists "authenticated read recommendation expiration outcomes"
on public.recommendation_expiration_outcomes;
create policy "premium read recommendation expiration outcomes"
on public.recommendation_expiration_outcomes
for select to authenticated
using (public.current_user_has_premium_access());

drop policy if exists "authenticated read paper accounts" on public.paper_accounts;
create policy "premium read paper accounts" on public.paper_accounts
for select to authenticated using (public.current_user_has_premium_access());

drop policy if exists "authenticated read paper job runs" on public.paper_job_runs;
create policy "premium read paper job runs" on public.paper_job_runs
for select to authenticated using (public.current_user_has_premium_access());

drop policy if exists "authenticated read paper orders" on public.paper_orders;
create policy "premium read paper orders" on public.paper_orders
for select to authenticated using (public.current_user_has_premium_access());

drop policy if exists "authenticated read paper positions" on public.paper_positions;
create policy "premium read paper positions" on public.paper_positions
for select to authenticated using (public.current_user_has_premium_access());

drop policy if exists "authenticated read paper marks" on public.paper_position_marks;
create policy "premium read paper marks" on public.paper_position_marks
for select to authenticated using (public.current_user_has_premium_access());

drop policy if exists "authenticated read paper ledger" on public.paper_ledger;
create policy "premium read paper ledger" on public.paper_ledger
for select to authenticated using (public.current_user_has_premium_access());

drop policy if exists "authenticated read paper snapshots" on public.paper_daily_snapshots;
create policy "premium read paper snapshots" on public.paper_daily_snapshots
for select to authenticated using (public.current_user_has_premium_access());

create or replace function public.sync_billing_subscription(
  p_user_id uuid,
  p_tier public.subscription_tier,
  p_status text,
  p_customer_id text,
  p_subscription_id text,
  p_price_id text,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_canceled_at timestamptz,
  p_trial_end timestamptz,
  p_event_id text,
  p_event_created_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (
    user_id,
    tier,
    status,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    current_period_end,
    cancel_at_period_end,
    canceled_at,
    trial_end,
    last_stripe_event_id,
    last_stripe_event_created_at
  ) values (
    p_user_id,
    p_tier,
    p_status,
    p_customer_id,
    p_subscription_id,
    p_price_id,
    p_period_end,
    coalesce(p_cancel_at_period_end, false),
    p_canceled_at,
    p_trial_end,
    p_event_id,
    p_event_created_at
  )
  on conflict (user_id) do update set
    tier = excluded.tier,
    status = excluded.status,
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    canceled_at = excluded.canceled_at,
    trial_end = excluded.trial_end,
    last_stripe_event_id = excluded.last_stripe_event_id,
    last_stripe_event_created_at = excluded.last_stripe_event_created_at,
    updated_at = now()
  where public.subscriptions.last_stripe_event_created_at is null
     or public.subscriptions.last_stripe_event_created_at <= excluded.last_stripe_event_created_at;

  if found then
    update public.users
    set
      subscription_tier = case
        when p_status in ('active', 'trialing') then p_tier
        else 'essential'::public.subscription_tier
      end,
      updated_at = now()
    where id = p_user_id;
  end if;
end;
$$;

revoke all on function public.sync_billing_subscription(
  uuid,
  public.subscription_tier,
  text,
  text,
  text,
  text,
  timestamptz,
  boolean,
  timestamptz,
  timestamptz,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.sync_billing_subscription(
  uuid,
  public.subscription_tier,
  text,
  text,
  text,
  text,
  timestamptz,
  boolean,
  timestamptz,
  timestamptz,
  text,
  timestamptz
) to service_role;
