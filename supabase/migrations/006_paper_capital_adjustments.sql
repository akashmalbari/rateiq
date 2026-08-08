alter table public.paper_accounts
add column if not exists net_contributions numeric(14,2) not null default 0;

alter table public.paper_ledger
add column if not exists actor_user_id uuid references public.users(id) on delete set null;

alter table public.paper_ledger
drop constraint if exists paper_ledger_event_type_check;

alter table public.paper_ledger
add constraint paper_ledger_event_type_check check (event_type in (
  'account_opened', 'capital_contribution', 'capital_withdrawal',
  'option_premium', 'option_buyback', 'stock_purchase', 'stock_sale',
  'fee', 'realized_pnl'
));

alter table public.paper_daily_snapshots
add column if not exists net_contributions numeric(14,2) not null default 0;

create or replace function public.adjust_paper_capital(
  p_account_id uuid,
  p_amount numeric,
  p_actor_user_id uuid,
  p_note text default null
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.paper_accounts%rowtype;
  v_reserved numeric;
  v_new_cash numeric;
  v_event_type text;
  v_description text;
begin
  if p_amount = 0 then
    raise exception 'Capital adjustment must not be zero';
  end if;

  select * into v_account
  from public.paper_accounts
  where id = p_account_id
  for update;

  if v_account.id is null or v_account.status = 'completed' then
    raise exception 'Paper account is not available for funding adjustments';
  end if;

  select coalesce(sum(collateral_reserved), 0) into v_reserved
  from public.paper_positions
  where account_id = p_account_id and status = 'open';

  v_new_cash := v_account.cash_balance + p_amount;
  if v_new_cash - v_reserved < 0 then
    raise exception 'Withdrawal exceeds available paper cash after reserved collateral';
  end if;

  v_event_type := case when p_amount > 0 then 'capital_contribution' else 'capital_withdrawal' end;
  v_description := coalesce(
    nullif(trim(p_note), ''),
    case when p_amount > 0 then 'Manual paper capital contribution' else 'Manual paper capital withdrawal' end
  );

  update public.paper_accounts set
    cash_balance = v_new_cash,
    net_contributions = net_contributions + p_amount
  where id = p_account_id;

  insert into public.paper_ledger (
    account_id, actor_user_id, event_type, amount, balance_after, description
  ) values (
    p_account_id, p_actor_user_id, v_event_type, p_amount, v_new_cash, v_description
  );

  return v_new_cash;
end;
$$;

revoke all on function public.adjust_paper_capital(uuid, numeric, uuid, text)
from public, anon, authenticated;

grant execute on function public.adjust_paper_capital(uuid, numeric, uuid, text)
to service_role;
