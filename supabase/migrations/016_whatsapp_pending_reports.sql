-- Staging table for Twilio WhatsApp two-step reports (photo + location arrive separately).
-- Service-role only; no client access. Known gap: no TTL/cleanup for abandoned rows yet.

create table if not exists public.whatsapp_pending_reports (
  phone_number text primary key,
  image_url text,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_pending_reports enable row level security;

revoke all on table public.whatsapp_pending_reports from anon, authenticated;
