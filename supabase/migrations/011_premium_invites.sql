create table if not exists public.premium_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  token_prefix text not null,
  note text,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (redeemed_at is null or redeemed_by is not null)
);

create index if not exists premium_invites_redeemed_access_idx
on public.premium_invites (redeemed_by)
where redeemed_at is not null and revoked_at is null;

create index if not exists premium_invites_created_at_idx
on public.premium_invites (created_at desc);

drop trigger if exists premium_invites_set_updated_at on public.premium_invites;
create trigger premium_invites_set_updated_at
before update on public.premium_invites
for each row execute function public.set_updated_at();

alter table public.premium_invites enable row level security;
revoke all on table public.premium_invites from public, anon, authenticated;

create or replace function public.redeem_premium_invite(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite public.premium_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select * into v_invite
  from public.premium_invites
  where token_hash = lower(p_token_hash)
  for update;

  if not found then
    raise exception 'This invitation is invalid.';
  end if;
  if v_invite.revoked_at is not null then
    raise exception 'This invitation has been revoked.';
  end if;
  if v_invite.redeemed_at is not null then
    raise exception 'This invitation has already been used.';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'This invitation has expired.';
  end if;

  update public.premium_invites
  set redeemed_at = now(), redeemed_by = auth.uid()
  where id = v_invite.id;

  return v_invite.id;
end;
$$;

revoke all on function public.redeem_premium_invite(text) from public, anon;
grant execute on function public.redeem_premium_invite(text) to authenticated;

create or replace function public.current_user_has_premium_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.users u
      left join public.subscriptions s on s.user_id = u.id
      where u.id = auth.uid()
        and (
          u.role = 'admin'
          or (s.tier = 'premium' and s.status in ('active', 'trialing'))
        )
    )
    or exists (
      select 1
      from public.premium_invites i
      where i.redeemed_by = auth.uid()
        and i.redeemed_at is not null
        and i.revoked_at is null
    );
$$;

revoke all on function public.current_user_has_premium_access() from public, anon;
grant execute on function public.current_user_has_premium_access() to authenticated;
