create type public.paper_account_status as enum ('active', 'paused', 'completed');
create type public.paper_order_status as enum ('pending', 'filled', 'rejected', 'skipped');
create type public.paper_position_status as enum ('open', 'closed');

create table public.paper_accounts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  starting_cash numeric(14,2) not null default 25000,
  cash_balance numeric(14,2) not null default 25000,
  status public.paper_account_status not null default 'active',
  strategy_version text not null,
  strategy_parameters jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger paper_accounts_set_updated_at
before update on public.paper_accounts
for each row execute function public.set_updated_at();

create table public.paper_job_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_accounts(id) on delete cascade,
  job_key text not null unique,
  job_type text not null check (job_type in ('entry', 'monitor', 'snapshot')),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index paper_job_runs_account_started_idx
on public.paper_job_runs (account_id, started_at desc);

create table public.paper_orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_accounts(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  position_id uuid,
  idempotency_key text not null unique,
  action text not null check (action in ('open', 'close')),
  symbol text not null,
  strategy_type text not null,
  status public.paper_order_status not null default 'pending',
  reason text,
  option_quantity integer not null default -1,
  underlying_quantity integer not null default 0,
  option_price numeric(12,4),
  underlying_price numeric(12,4),
  gross_amount numeric(14,2),
  fees numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  filled_at timestamptz
);

create index paper_orders_account_created_idx
on public.paper_orders (account_id, created_at desc);
create index paper_orders_status_idx on public.paper_orders (status, created_at desc);

create table public.paper_positions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_accounts(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  open_order_id uuid references public.paper_orders(id) on delete set null,
  close_order_id uuid references public.paper_orders(id) on delete set null,
  symbol text not null,
  strategy_type text not null check (strategy_type in ('cash_secured_put', 'covered_call')),
  option_type public.contract_type not null,
  option_quantity integer not null default -1 check (option_quantity = -1),
  underlying_quantity integer not null default 0 check (underlying_quantity in (0, 100)),
  strike numeric(12,3) not null,
  expiration_date date not null,
  entry_option_price numeric(12,4) not null,
  current_option_price numeric(12,4) not null,
  entry_underlying_price numeric(12,4) not null,
  current_underlying_price numeric(12,4) not null,
  entry_greeks jsonb not null default '{}'::jsonb,
  current_greeks jsonb not null default '{}'::jsonb,
  collateral_reserved numeric(14,2) not null default 0,
  capital_deployed numeric(14,2) not null,
  status public.paper_position_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  realized_pnl numeric(14,2),
  close_reason text,
  strategy_version text not null,
  strategy_parameters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.paper_orders
add constraint paper_orders_position_fk
foreign key (position_id) references public.paper_positions(id) on delete set null;

create unique index paper_positions_one_open_symbol_idx
on public.paper_positions (account_id, symbol)
where status = 'open';
create index paper_positions_account_status_idx
on public.paper_positions (account_id, status, opened_at desc);
create index paper_positions_expiration_idx
on public.paper_positions (status, expiration_date);

create trigger paper_positions_set_updated_at
before update on public.paper_positions
for each row execute function public.set_updated_at();

create table public.paper_position_marks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_accounts(id) on delete cascade,
  position_id uuid not null references public.paper_positions(id) on delete cascade,
  marked_at timestamptz not null default now(),
  underlying_price numeric(12,4) not null,
  option_price numeric(12,4) not null,
  unrealized_pnl numeric(14,2) not null,
  greeks jsonb not null default '{}'::jsonb,
  unique (position_id, marked_at)
);

create index paper_position_marks_position_idx
on public.paper_position_marks (position_id, marked_at desc);

create table public.paper_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_accounts(id) on delete cascade,
  position_id uuid references public.paper_positions(id) on delete set null,
  order_id uuid references public.paper_orders(id) on delete set null,
  event_type text not null check (event_type in (
    'account_opened', 'option_premium', 'option_buyback', 'stock_purchase',
    'stock_sale', 'fee', 'realized_pnl'
  )),
  amount numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  description text not null,
  occurred_at timestamptz not null default now()
);

create index paper_ledger_account_occurred_idx
on public.paper_ledger (account_id, occurred_at desc);

create table public.paper_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.paper_accounts(id) on delete cascade,
  snapshot_date date not null,
  cash_balance numeric(14,2) not null,
  available_cash numeric(14,2) not null,
  reserved_collateral numeric(14,2) not null,
  stock_market_value numeric(14,2) not null,
  option_liability numeric(14,2) not null,
  equity numeric(14,2) not null,
  realized_pnl_cumulative numeric(14,2) not null,
  unrealized_pnl numeric(14,2) not null,
  open_position_count integer not null,
  created_at timestamptz not null default now(),
  unique (account_id, snapshot_date)
);

create index paper_daily_snapshots_account_date_idx
on public.paper_daily_snapshots (account_id, snapshot_date desc);

alter table public.paper_accounts enable row level security;
alter table public.paper_job_runs enable row level security;
alter table public.paper_orders enable row level security;
alter table public.paper_positions enable row level security;
alter table public.paper_position_marks enable row level security;
alter table public.paper_ledger enable row level security;
alter table public.paper_daily_snapshots enable row level security;

create policy "authenticated read paper accounts" on public.paper_accounts
for select to authenticated using (true);
create policy "authenticated read paper job runs" on public.paper_job_runs
for select to authenticated using (true);
create policy "authenticated read paper orders" on public.paper_orders
for select to authenticated using (true);
create policy "authenticated read paper positions" on public.paper_positions
for select to authenticated using (true);
create policy "authenticated read paper marks" on public.paper_position_marks
for select to authenticated using (true);
create policy "authenticated read paper ledger" on public.paper_ledger
for select to authenticated using (true);
create policy "authenticated read paper snapshots" on public.paper_daily_snapshots
for select to authenticated using (true);

insert into public.paper_accounts (
  slug,
  name,
  starting_cash,
  cash_balance,
  strategy_version,
  strategy_parameters
) values (
  'figure-my-money-default',
  'Figure My Money Paper Portfolio',
  25000,
  25000,
  'income-v2-theta-2026-08',
  '{
    "max_position_equity_pct": 0.40,
    "max_deployed_equity_pct": 0.80,
    "max_open_positions": 3,
    "contracts_per_position": 1,
    "profit_target_pct": 0.50,
    "stop_multiple": 2.0,
    "max_position_loss_pct": 0.08,
    "time_exit_dte": 7,
    "monitor_interval_minutes": 15,
    "option_spread_slippage_pct": 0.25,
    "underlying_slippage_bps": 5,
    "option_fee_per_contract": 0.65,
    "assignment_enabled": false
  }'::jsonb
)
on conflict (slug) do nothing;

insert into public.paper_ledger (
  account_id,
  event_type,
  amount,
  balance_after,
  description
)
select id, 'account_opened', 25000, 25000, 'Initial paper capital'
from public.paper_accounts
where slug = 'figure-my-money-default'
  and not exists (
    select 1 from public.paper_ledger
    where account_id = public.paper_accounts.id
      and event_type = 'account_opened'
  );

create or replace function public.execute_paper_open(
  p_account_id uuid,
  p_recommendation_id uuid,
  p_idempotency_key text,
  p_symbol text,
  p_strategy_type text,
  p_option_type public.contract_type,
  p_strike numeric,
  p_expiration_date date,
  p_underlying_quantity integer,
  p_option_price numeric,
  p_underlying_price numeric,
  p_greeks jsonb,
  p_collateral_reserved numeric,
  p_capital_deployed numeric,
  p_strategy_version text,
  p_strategy_parameters jsonb,
  p_fees numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.paper_accounts%rowtype;
  v_position_id uuid;
  v_order_id uuid;
  v_existing_position uuid;
  v_cash numeric;
  v_reserved numeric;
  v_stock_cost numeric := p_underlying_quantity * p_underlying_price;
  v_premium numeric := p_option_price * 100;
  v_running_balance numeric;
begin
  select * into v_account
  from public.paper_accounts
  where id = p_account_id
  for update;

  if v_account.id is null or v_account.status <> 'active' then
    raise exception 'Paper account is not active';
  end if;

  select position_id into v_existing_position
  from public.paper_orders
  where idempotency_key = p_idempotency_key;
  if found then
    return v_existing_position;
  end if;

  if exists (
    select 1 from public.paper_positions
    where account_id = p_account_id and symbol = p_symbol and status = 'open'
  ) then
    raise exception 'An open paper position already exists for %', p_symbol;
  end if;

  select coalesce(sum(collateral_reserved), 0) into v_reserved
  from public.paper_positions
  where account_id = p_account_id and status = 'open';

  v_cash := v_account.cash_balance - v_stock_cost + v_premium - p_fees;
  if v_cash - v_reserved - p_collateral_reserved < 0 then
    raise exception 'Insufficient unreserved paper cash';
  end if;

  insert into public.paper_orders (
    account_id, recommendation_id, idempotency_key, action, symbol,
    strategy_type, status, option_quantity, underlying_quantity,
    option_price, underlying_price, gross_amount, fees, filled_at
  ) values (
    p_account_id, p_recommendation_id, p_idempotency_key, 'open', p_symbol,
    p_strategy_type, 'filled', -1, p_underlying_quantity,
    p_option_price, p_underlying_price, v_premium - v_stock_cost, p_fees, now()
  ) returning id into v_order_id;

  insert into public.paper_positions (
    account_id, recommendation_id, open_order_id, symbol, strategy_type,
    option_type, option_quantity, underlying_quantity, strike, expiration_date,
    entry_option_price, current_option_price, entry_underlying_price,
    current_underlying_price, entry_greeks, current_greeks,
    collateral_reserved, capital_deployed, strategy_version, strategy_parameters
  ) values (
    p_account_id, p_recommendation_id, v_order_id, p_symbol, p_strategy_type,
    p_option_type, -1, p_underlying_quantity, p_strike, p_expiration_date,
    p_option_price, p_option_price, p_underlying_price,
    p_underlying_price, p_greeks, p_greeks,
    p_collateral_reserved, p_capital_deployed, p_strategy_version, p_strategy_parameters
  ) returning id into v_position_id;

  update public.paper_orders set position_id = v_position_id where id = v_order_id;
  update public.paper_accounts set cash_balance = v_cash where id = p_account_id;

  v_running_balance := v_account.cash_balance;
  if v_stock_cost > 0 then
    v_running_balance := v_running_balance - v_stock_cost;
    insert into public.paper_ledger (
      account_id, position_id, order_id, event_type, amount, balance_after, description
    ) values (
      p_account_id, v_position_id, v_order_id, 'stock_purchase', -v_stock_cost,
      v_running_balance, format('Bought %s shares of %s', p_underlying_quantity, p_symbol)
    );
  end if;

  v_running_balance := v_running_balance + v_premium;
  insert into public.paper_ledger (
    account_id, position_id, order_id, event_type, amount, balance_after, description
  ) values (
    p_account_id, v_position_id, v_order_id, 'option_premium', v_premium,
    v_running_balance, format('Sold one %s %s option', p_symbol, p_option_type)
  );

  if p_fees > 0 then
    v_running_balance := v_running_balance - p_fees;
    insert into public.paper_ledger (
      account_id, position_id, order_id, event_type, amount, balance_after, description
    ) values (
      p_account_id, v_position_id, v_order_id, 'fee', -p_fees,
      v_running_balance, 'Paper execution fee'
    );
  end if;

  return v_position_id;
end;
$$;

create or replace function public.execute_paper_close(
  p_account_id uuid,
  p_position_id uuid,
  p_idempotency_key text,
  p_option_price numeric,
  p_underlying_price numeric,
  p_greeks jsonb,
  p_close_reason text,
  p_fees numeric
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.paper_accounts%rowtype;
  v_position public.paper_positions%rowtype;
  v_order_id uuid;
  v_existing_order public.paper_orders%rowtype;
  v_option_cost numeric;
  v_stock_proceeds numeric;
  v_open_fees numeric;
  v_realized_pnl numeric;
  v_cash numeric;
  v_running_balance numeric;
begin
  select * into v_account
  from public.paper_accounts
  where id = p_account_id
  for update;

  select * into v_existing_order
  from public.paper_orders
  where idempotency_key = p_idempotency_key;
  if found then
    select realized_pnl into v_realized_pnl
    from public.paper_positions where id = v_existing_order.position_id;
    return v_realized_pnl;
  end if;

  select * into v_position
  from public.paper_positions
  where id = p_position_id and account_id = p_account_id
  for update;

  if v_position.id is null or v_position.status <> 'open' then
    raise exception 'Paper position is not open';
  end if;

  v_option_cost := p_option_price * 100;
  v_stock_proceeds := v_position.underlying_quantity * p_underlying_price;
  select coalesce(fees, 0) into v_open_fees
  from public.paper_orders where id = v_position.open_order_id;
  v_realized_pnl :=
    (v_position.entry_option_price - p_option_price) * 100 +
    (p_underlying_price - v_position.entry_underlying_price) * v_position.underlying_quantity -
    v_open_fees - p_fees;
  v_cash := v_account.cash_balance - v_option_cost + v_stock_proceeds - p_fees;

  insert into public.paper_orders (
    account_id, recommendation_id, position_id, idempotency_key, action,
    symbol, strategy_type, status, option_quantity, underlying_quantity,
    option_price, underlying_price, gross_amount, fees, reason, filled_at
  ) values (
    p_account_id, v_position.recommendation_id, p_position_id, p_idempotency_key, 'close',
    v_position.symbol, v_position.strategy_type, 'filled', 1, -v_position.underlying_quantity,
    p_option_price, p_underlying_price, v_stock_proceeds - v_option_cost, p_fees,
    p_close_reason, now()
  ) returning id into v_order_id;

  update public.paper_positions set
    close_order_id = v_order_id,
    current_option_price = p_option_price,
    current_underlying_price = p_underlying_price,
    current_greeks = p_greeks,
    status = 'closed',
    closed_at = now(),
    realized_pnl = v_realized_pnl,
    close_reason = p_close_reason
  where id = p_position_id;

  update public.paper_accounts set cash_balance = v_cash where id = p_account_id;

  v_running_balance := v_account.cash_balance - v_option_cost;
  insert into public.paper_ledger (
    account_id, position_id, order_id, event_type, amount, balance_after, description
  ) values (
    p_account_id, p_position_id, v_order_id, 'option_buyback', -v_option_cost,
    v_running_balance, format('Bought back one %s option', v_position.symbol)
  );

  if v_stock_proceeds > 0 then
    v_running_balance := v_running_balance + v_stock_proceeds;
    insert into public.paper_ledger (
      account_id, position_id, order_id, event_type, amount, balance_after, description
    ) values (
      p_account_id, p_position_id, v_order_id, 'stock_sale', v_stock_proceeds,
      v_running_balance, format('Sold %s shares of %s', v_position.underlying_quantity, v_position.symbol)
    );
  end if;

  if p_fees > 0 then
    v_running_balance := v_running_balance - p_fees;
    insert into public.paper_ledger (
      account_id, position_id, order_id, event_type, amount, balance_after, description
    ) values (
      p_account_id, p_position_id, v_order_id, 'fee', -p_fees,
      v_running_balance, 'Paper execution fee'
    );
  end if;

  insert into public.paper_ledger (
    account_id, position_id, order_id, event_type, amount, balance_after, description
  ) values (
    p_account_id, p_position_id, v_order_id, 'realized_pnl', 0,
    v_running_balance, format('Closed for realized P/L of %s', round(v_realized_pnl, 2))
  );

  if v_position.recommendation_id is not null then
    update public.recommendations set status = 'closed'
    where id = v_position.recommendation_id;

    insert into public.trade_results (
      recommendation_id, opened_at, closed_at, entry_price, exit_price,
      pnl, pnl_pct, outcome, notes
    ) values (
      v_position.recommendation_id, v_position.opened_at, now(),
      v_position.entry_option_price, p_option_price,
      v_realized_pnl,
      case when v_position.capital_deployed > 0
        then v_realized_pnl / v_position.capital_deployed * 100 else 0 end,
      case when v_realized_pnl > 0 then 'win'::public.trade_outcome
        when v_realized_pnl < 0 then 'loss'::public.trade_outcome
        else 'breakeven'::public.trade_outcome end,
      p_close_reason
    );
  end if;

  return v_realized_pnl;
end;
$$;

revoke all on function public.execute_paper_open(
  uuid, uuid, text, text, text, public.contract_type, numeric, date, integer,
  numeric, numeric, jsonb, numeric, numeric, text, jsonb, numeric
) from public, anon, authenticated;
revoke all on function public.execute_paper_close(
  uuid, uuid, text, numeric, numeric, jsonb, text, numeric
) from public, anon, authenticated;
grant execute on function public.execute_paper_open(
  uuid, uuid, text, text, text, public.contract_type, numeric, date, integer,
  numeric, numeric, jsonb, numeric, numeric, text, jsonb, numeric
) to service_role;
grant execute on function public.execute_paper_close(
  uuid, uuid, text, numeric, numeric, jsonb, text, numeric
) to service_role;
