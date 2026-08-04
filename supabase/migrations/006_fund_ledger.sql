-- Fund ledger for Fix Nairobi public accountability
-- Run in Supabase SQL Editor after prior migrations.

create table if not exists public.fund_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('donation', 'expense')),
  amount_kes numeric(12, 2) not null check (amount_kes > 0),
  donor_or_payee text not null,
  note text,
  voided boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists fund_entries_created_at_idx
  on public.fund_entries (created_at desc);

alter table public.fund_entries enable row level security;

create policy "Fund entries are viewable by everyone"
  on public.fund_entries for select
  using (true);

create policy "Admins can insert fund entries"
  on public.fund_entries for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins can update fund entries"
  on public.fund_entries for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins can delete fund entries"
  on public.fund_entries for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Starter seed (idempotent by donor note markers)
insert into public.fund_entries (kind, amount_kes, donor_or_payee, note)
select * from (values
  ('donation'::text, 50000::numeric, 'XPNC Partnership seed', 'Season 2 operating float'),
  ('donation'::text, 25000::numeric, 'Community donor circle', 'Amazing Trash Race prep'),
  ('donation'::text, 10000::numeric, 'Anonymous supporter', 'General Fix Nairobi fund'),
  ('expense'::text, 12000::numeric, 'Cleanup kit procurement', 'Gloves, bags, vests — Race S2'),
  ('expense'::text, 8000::numeric, 'Print & zone materials', 'Maps and marshal sheets')
) as v(kind, amount_kes, donor_or_payee, note)
where not exists (
  select 1 from public.fund_entries where note = 'Season 2 operating float'
);
