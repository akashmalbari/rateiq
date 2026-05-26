create extension if not exists "pgcrypto";

create type public.user_role as enum ('user', 'admin');
create type public.subscription_tier as enum ('free', 'premium', 'enterprise');
create type public.scan_status as enum ('queued', 'running', 'completed', 'failed');
create type public.risk_level as enum ('conservative', 'balanced', 'aggressive');
create type public.recommendation_status as enum ('open', 'closed', 'expired', 'skipped');
create type public.trade_outcome as enum ('win', 'loss', 'breakeven', 'open');
create type public.email_status as enum ('queued', 'sent', 'failed', 'skipped');
create type public.contract_type as enum ('call', 'put');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  subscription_tier public.subscription_tier not null default 'free',
  email_digest_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.users.full_name, excluded.full_name),
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  scan_date date not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status public.scan_status not null default 'queued',
  market_regime jsonb not null default '{}'::jsonb,
  universe_count integer not null default 0,
  recommendation_count integer not null default 0,
  error_message text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index scans_scan_date_idx on public.scans (scan_date desc);
create index scans_status_started_idx on public.scans (status, started_at desc);

create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null,
  enabled boolean not null default true,
  risk_level public.risk_level not null default 'balanced',
  thresholds jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger strategies_set_updated_at
before update on public.strategies
for each row execute function public.set_updated_at();

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  symbol text not null,
  company_name text not null,
  strategy_type text not null,
  entry jsonb not null,
  exit_plan jsonb not null,
  option_legs jsonb not null,
  probability_of_profit numeric(6,2) not null,
  expected_move numeric(12,2) not null,
  max_risk numeric(12,2) not null,
  max_reward numeric(12,2) not null,
  risk_reward_ratio numeric(8,3) not null,
  confidence_score integer not null,
  greeks jsonb not null,
  iv_percentile integer not null,
  liquidity_score integer not null,
  technical_score integer not null,
  historical_win_rate numeric(6,2) not null,
  suggested_position_size_pct numeric(6,2) not null,
  rationale text[] not null default '{}',
  warnings text[] not null default '{}',
  expires_at timestamptz not null,
  status public.recommendation_status not null default 'open',
  created_at timestamptz not null default now()
);

create index recommendations_scan_idx on public.recommendations (scan_id);
create index recommendations_symbol_created_idx on public.recommendations (symbol, created_at desc);
create index recommendations_score_idx on public.recommendations (confidence_score desc, probability_of_profit desc);
create index recommendations_status_expiry_idx on public.recommendations (status, expires_at);

create table public.option_contracts (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  underlying_symbol text not null,
  expiration_date date not null,
  strike numeric(12,3) not null,
  contract_type public.contract_type not null,
  bid numeric(12,3) not null,
  ask numeric(12,3) not null,
  last numeric(12,3),
  volume integer not null default 0,
  open_interest integer not null default 0,
  implied_volatility numeric(10,6) not null default 0,
  delta numeric(10,6),
  gamma numeric(10,6),
  theta numeric(10,6),
  vega numeric(10,6),
  captured_at timestamptz not null default now(),
  unique (symbol, captured_at)
);

create index option_contracts_underlying_exp_idx on public.option_contracts (underlying_symbol, expiration_date, strike);

create table public.trade_results (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  opened_at timestamptz,
  closed_at timestamptz,
  entry_price numeric(12,3),
  exit_price numeric(12,3),
  pnl numeric(12,2),
  pnl_pct numeric(8,3),
  outcome public.trade_outcome not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

create index trade_results_recommendation_idx on public.trade_results (recommendation_id);
create index trade_results_outcome_idx on public.trade_results (outcome);

create table public.backtests (
  id uuid primary key default gen_random_uuid(),
  strategy_slug text not null,
  symbol text,
  start_date date not null,
  end_date date not null,
  metrics jsonb not null,
  parameters jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index backtests_strategy_created_idx on public.backtests (strategy_slug, created_at desc);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  scan_id uuid references public.scans(id) on delete set null,
  recipient text not null,
  subject text not null,
  provider_message_id text,
  status public.email_status not null default 'queued',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index email_logs_user_created_idx on public.email_logs (user_id, created_at desc);
create index email_logs_scan_idx on public.email_logs (scan_id);
create index email_logs_status_idx on public.email_logs (status);

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scans enable row level security;
alter table public.strategies enable row level security;
alter table public.recommendations enable row level security;
alter table public.option_contracts enable row level security;
alter table public.trade_results enable row level security;
alter table public.backtests enable row level security;
alter table public.email_logs enable row level security;

create policy "users read own profile" on public.users
for select using (auth.uid() = id);

create policy "users update own profile" on public.users
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "subscriptions read own" on public.subscriptions
for select using (auth.uid() = user_id);

create policy "authenticated read completed scans" on public.scans
for select to authenticated using (status = 'completed');

create policy "authenticated read strategies" on public.strategies
for select to authenticated using (true);

create policy "authenticated read recommendations" on public.recommendations
for select to authenticated using (true);

create policy "authenticated read option contracts" on public.option_contracts
for select to authenticated using (true);

create policy "users read own backtests" on public.backtests
for select using (auth.uid() = created_by);

create policy "users insert own backtests" on public.backtests
for insert with check (auth.uid() = created_by);

create policy "users read own email logs" on public.email_logs
for select using (auth.uid() = user_id);

insert into public.strategies (slug, name, type, risk_level, thresholds) values
  ('cash_secured_put', 'Cash Secured Put', 'income', 'balanced', '{"min_iv_percentile":35,"target_delta":0.22,"max_spread_pct":18}'),
  ('covered_call', 'Covered Call', 'income', 'balanced', '{"min_iv_percentile":30,"target_delta":0.25,"max_spread_pct":18}'),
  ('bull_put_credit_spread', 'Bull Put Credit Spread', 'defined_risk_income', 'balanced', '{"min_iv_percentile":38,"target_delta":0.22,"max_spread_pct":18}'),
  ('bear_call_credit_spread', 'Bear Call Credit Spread', 'defined_risk_income', 'balanced', '{"min_iv_percentile":38,"target_delta":0.22,"max_spread_pct":18}'),
  ('bull_call_debit_spread', 'Bull Call Debit Spread', 'directional', 'aggressive', '{"max_iv_percentile":72,"target_delta":0.48,"max_spread_pct":18}'),
  ('bear_put_debit_spread', 'Bear Put Debit Spread', 'directional', 'aggressive', '{"max_iv_percentile":72,"target_delta":0.48,"max_spread_pct":18}'),
  ('iron_condor', 'Iron Condor', 'range_income', 'conservative', '{"min_iv_percentile":45,"target_delta":0.18,"max_atr_percent":4.2}'),
  ('directional_call', 'Directional Call', 'directional', 'aggressive', '{"max_iv_percentile":58,"target_delta":0.55,"min_alignment":72}'),
  ('directional_put', 'Directional Put', 'directional', 'aggressive', '{"max_iv_percentile":60,"target_delta":0.55,"min_alignment":72}')
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  risk_level = excluded.risk_level,
  thresholds = excluded.thresholds;
