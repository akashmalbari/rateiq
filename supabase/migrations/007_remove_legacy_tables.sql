-- These tables belong to the retired FastAPI application and are not used by
-- the deployed Next.js/Vercel application or its Supabase schema.
-- Intentionally omit CASCADE: an unexpected dependency should block cleanup.
drop table if exists public.contact_messages;
drop table if exists public.site_content;
drop table if exists public.subscribers;
drop table if exists public.trading_signals;
drop table if exists public.trading_users;
