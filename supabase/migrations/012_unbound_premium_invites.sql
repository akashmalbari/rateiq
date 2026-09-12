-- Existing deployments may retain legacy email audit columns. They are no
-- longer read or written; invite ownership is established only on redemption.
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
