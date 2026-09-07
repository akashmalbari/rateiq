alter type public.subscription_tier rename value 'free' to 'essential';

alter table public.users
alter column subscription_tier set default 'essential'::public.subscription_tier;

alter table public.subscriptions
alter column tier set default 'essential'::public.subscription_tier;
