-- 030_whatsapp_reporting.sql
-- WhatsApp reporting, made safe to open to the public. Needs 029 (rate limiter).
-- Also creates the half-report table from 016 in case 016 was never run.
-- Safe to run twice.

-- Numbers that send spam or abuse. Stored as the same one-way hash the function uses:
--   insert into public.whatsapp_blocked_numbers (phone_hash, reason)
--   values (encode(sha256(convert_to('rt-wa:whatsapp:+2547XXXXXXXX', 'UTF8')), 'hex'), 'spam');
-- (note the "whatsapp:" prefix Twilio puts in front of the number)
create table if not exists public.whatsapp_blocked_numbers (
  phone_hash text primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.whatsapp_blocked_numbers enable row level security; -- service role + SQL editor only

create table if not exists public.whatsapp_pending_reports (
  phone_number text primary key, -- now a one-way hash of the number, never the number itself
  image_url text,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_pending_reports enable row level security;
revoke all on table public.whatsapp_pending_reports from anon, authenticated;

-- Pending half-reports are now keyed by a phone hash, never the raw number. Clear any old raw rows.
delete from public.whatsapp_pending_reports where phone_number like 'whatsapp:%' or phone_number like '+%';

-- Expire abandoned half-reports (the function also ignores rows older than 2 hours).
create or replace function public.expire_whatsapp_pending()
returns int language sql security definer set search_path = public as $$
  with d as (delete from public.whatsapp_pending_reports where updated_at < now() - interval '2 hours' returning 1)
  select count(*)::int from d;
$$;
revoke all on function public.expire_whatsapp_pending() from public, anon, authenticated;
