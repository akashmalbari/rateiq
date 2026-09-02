create table public.recommendation_expiration_outcomes (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null unique references public.recommendations(id) on delete cascade,
  scan_id uuid not null references public.scans(id) on delete cascade,
  symbol text not null,
  company_name text not null,
  strategy_type text not null check (strategy_type in ('cash_secured_put', 'covered_call')),
  universe_group text not null,
  recommended_at timestamptz not null,
  expiration_date date not null,
  underlying_entry_price numeric(14,4) not null,
  underlying_expiration_price numeric(14,4) not null,
  strike_price numeric(14,4) not null,
  option_credit_per_share numeric(14,4) not null,
  premium_received numeric(14,2) not null,
  intrinsic_value numeric(14,2) not null,
  breakeven_price numeric(14,4) not null,
  modeled_pnl numeric(14,2) not null,
  modeled_return_pct numeric(10,4) not null,
  assignment_status text not null check (assignment_status in (
    'expired_without_assignment', 'put_assigned', 'shares_called_away'
  )),
  assignment_avoided boolean not null,
  probability_of_profit numeric(6,2) not null,
  confidence_score integer not null,
  price_source text not null,
  settlement_method text not null default 'expiration_close_model',
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index recommendation_outcomes_expiration_idx
on public.recommendation_expiration_outcomes (expiration_date desc, strategy_type);

create index recommendation_outcomes_assignment_idx
on public.recommendation_expiration_outcomes (assignment_avoided, expiration_date desc);

create index recommendation_outcomes_symbol_idx
on public.recommendation_expiration_outcomes (symbol, expiration_date desc);

alter table public.recommendation_expiration_outcomes enable row level security;

create policy "authenticated read recommendation expiration outcomes"
on public.recommendation_expiration_outcomes
for select to authenticated using (true);

create or replace function public.get_pending_expiration_recommendations(
  p_expiration_date date,
  p_limit integer default 500
)
returns table (
  id uuid,
  scan_id uuid,
  symbol text,
  company_name text,
  strategy_type text,
  entry jsonb,
  option_legs jsonb,
  probability_of_profit numeric,
  confidence_score integer,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.scan_id,
    r.symbol,
    r.company_name,
    r.strategy_type,
    r.entry,
    r.option_legs,
    r.probability_of_profit,
    r.confidence_score,
    r.created_at,
    r.expires_at
  from public.recommendations r
  left join public.recommendation_expiration_outcomes o
    on o.recommendation_id = r.id
  where r.strategy_type in ('cash_secured_put', 'covered_call')
    and r.expires_at < (p_expiration_date + 1)::timestamptz
    and o.id is null
  order by r.expires_at, r.created_at
  limit least(greatest(p_limit, 1), 1000);
$$;

revoke all on function public.get_pending_expiration_recommendations(date, integer)
from public, anon, authenticated;
grant execute on function public.get_pending_expiration_recommendations(date, integer)
to service_role;

-- Run after the close on every weekday. The endpoint admits only the matching
-- 4:30 PM America/New_York invocation, so these cover daylight and standard time.
do $$
declare
  v_job record;
begin
  for v_job in
    select jobid from cron.job
    where jobname in (
      'figure-my-money-expiration-settlement-edt',
      'figure-my-money-expiration-settlement-est'
    )
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'figure-my-money-expiration-settlement-edt',
  '30 20 * * 1-5',
  $$
  select net.http_get(
    url := (
      select decrypted_secret from vault.decrypted_secrets
      where name = 'figure_my_money_app_url'
    ) || '/api/outcomes/settle',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'figure_my_money_cron_secret'
      ),
      'x-figure-my-money-cron', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'figure_my_money_cron_secret'
      )
    ),
    timeout_milliseconds := 120000
  );
  $$
);

select cron.schedule(
  'figure-my-money-expiration-settlement-est',
  '30 21 * * 1-5',
  $$
  select net.http_get(
    url := (
      select decrypted_secret from vault.decrypted_secrets
      where name = 'figure_my_money_app_url'
    ) || '/api/outcomes/settle',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'figure_my_money_cron_secret'
      ),
      'x-figure-my-money-cron', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'figure_my_money_cron_secret'
      )
    ),
    timeout_milliseconds := 120000
  );
  $$
);
