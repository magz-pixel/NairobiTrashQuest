-- 005 - MCA/MP placeholder officials for accountability flow
-- Run once in Supabase SQL Editor after 004_civic_lifecycle.sql

insert into public.officials (id, name, role, contact_email) values
  ('00000000-0000-4000-8000-000000000003', 'Ward MCA (placeholder)', 'Member of County Assembly', null),
  ('00000000-0000-4000-8000-000000000004', 'Constituency MP (placeholder)', 'Member of Parliament', null)
on conflict (id) do nothing;

-- Link MCA to all seeded wards
insert into public.ward_officials (ward_id, official_id)
select w.id, '00000000-0000-4000-8000-000000000003'::uuid
from public.wards w
on conflict do nothing;

-- Link MP by constituency grouping (simplified: one MP per ward for MVP)
insert into public.ward_officials (ward_id, official_id)
select w.id, '00000000-0000-4000-8000-000000000004'::uuid
from public.wards w
on conflict do nothing;
