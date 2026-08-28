-- 018 - Flag race hotspots eligible for crowd-funded cleanup (display only; no ledger)
alter table public.race_hotspots
  add column if not exists is_funded boolean not null default false;
