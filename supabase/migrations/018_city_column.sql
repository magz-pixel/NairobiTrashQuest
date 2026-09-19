-- 018 - Multi-city foundation: city slug on core tables
-- Default 'nairobi' keeps existing rows and Nairobi writes unchanged.
-- Do not apply race_hotspots (race pins stay season-scoped for now).

alter table public.reports
  add column if not exists city text not null default 'nairobi';

alter table public.events
  add column if not exists city text not null default 'nairobi';

alter table public.fund_entries
  add column if not exists city text not null default 'nairobi';

alter table public.race_registrations
  add column if not exists city text not null default 'nairobi';
