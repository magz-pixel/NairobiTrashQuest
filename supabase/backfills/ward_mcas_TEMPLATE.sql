-- Ward MCAs for Nairobi — fill in, then run in the Supabase SQL editor.
--
-- The map's ward card shows "<Name> · <Ward> Ward MCA" with email / call buttons
-- as soon as a ward has a row here. Leave mca_name empty for wards you don't know yet;
-- empty rows are skipped. Safe to run again after adding more names (it upserts).
--
-- Columns: ward (exact name as on the map), mca_name, email, phone (e.g. +2547...)

with mcas(ward, mca_name, email, phone) as (values
  ('Airbase', '', '', ''),
  ('Babadogo', '', '', ''),
  ('California', '', '', ''),
  ('Claycity', '', '', ''),
  ('Dandora Area I', '', '', ''),
  ('Dandora Area II', '', '', ''),
  ('Dandora Area III', '', '', ''),
  ('Dandora Area IV', '', '', ''),
  ('Eastleigh North', '', '', ''),
  ('Eastleigh South', '', '', ''),
  ('Embakasi', '', '', ''),
  ('Gatina', '', '', ''),
  ('Githurai', '', '', ''),
  ('Harambee', '', '', ''),
  ('Hospital', '', '', ''),
  ('Huruma', '', '', ''),
  ('Imara Daima', '', '', ''),
  ('Kabiro', '', '', ''),
  ('Kahawa', '', '', ''),
  ('Kahawa West', '', '', ''),
  ('Kangemi', '', '', ''),
  ('Karen', '', '', ''),
  ('Kariobangi North', '', '', ''),
  ('Kariobangi South', '', '', ''),
  ('Karura', '', '', ''),
  ('Kasarani', '', '', ''),
  ('Kawangware', '', '', ''),
  ('Kayole Central', '', '', ''),
  ('Kayole North', '', '', ''),
  ('Kayole South', '', '', ''),
  ('Kiamaiko', '', '', ''),
  ('Kileleshwa', '', '', ''),
  ('Kilimani', '', '', ''),
  ('Kitisuru', '', '', ''),
  ('Komarock', '', '', ''),
  ('Korogocho', '', '', ''),
  ('Kwa Njenga', '', '', ''),
  ('Kwa Reuben', '', '', ''),
  ('Kware', '', '', ''),
  ('Laini Saba', '', '', ''),
  ('Landimawe', '', '', ''),
  ('Lindi', '', '', ''),
  ('Lower Savannah', '', '', ''),
  ('Lucky Summer', '', '', ''),
  ('Mabatini', '', '', ''),
  ('Makina', '', '', ''),
  ('Makongeni', '', '', ''),
  ('Maringo/Hamza', '', '', ''),
  ('Mathare North', '', '', ''),
  ('Matopeni', '', '', ''),
  ('Mihango', '', '', ''),
  ('Mlango Kubwa', '', '', ''),
  ('Mountain View', '', '', ''),
  ('Mowlem', '', '', ''),
  ('Mugumo-Ini', '', '', ''),
  ('Mutuini', '', '', ''),
  ('Mwiki', '', '', ''),
  ('Nairobi Central', '', '', ''),
  ('Nairobi South', '', '', ''),
  ('Nairobi West', '', '', ''),
  ('Ngando', '', '', ''),
  ('Ngara', '', '', ''),
  ('Ngei', '', '', ''),
  ('Njiru', '', '', ''),
  ('Nyayo Highrise', '', '', ''),
  ('Pangani', '', '', ''),
  ('Parklands/Highridge', '', '', ''),
  ('Pipeline', '', '', ''),
  ('Pumwani', '', '', ''),
  ('Riruta', '', '', ''),
  ('Roysambu', '', '', ''),
  ('Ruai', '', '', ''),
  ('Sarangombe', '', '', ''),
  ('South-C', '', '', ''),
  ('Umoja I', '', '', ''),
  ('Umoja II', '', '', ''),
  ('Upper Savannah', '', '', ''),
  ('Utalii', '', '', ''),
  ('Utawala', '', '', ''),
  ('Uthiru/Ruthimitu', '', '', ''),
  ('Viwandani', '', '', ''),
  ('Waithaka', '', '', ''),
  ('Woodley/Kenyatta Golf', '', '', ''),
  ('Zimmerman', '', '', ''),
  ('Ziwani/Kariokor', '', '', '')
),
filled as (
  select ward, trim(mca_name) as mca_name, nullif(trim(email), '') as email, nullif(trim(phone), '') as phone,
         'nairobi-' || trim(both '-' from regexp_replace(lower(ward), '[^a-z0-9]+', '-', 'g')) as ward_id
  from mcas
  where trim(mca_name) <> ''
),
w as (
  insert into public.wards (id, name, sub_county)
  select ward_id, ward, '' from filled
  on conflict (id) do update set name = excluded.name
  returning id
),
o as (
  insert into public.officials (id, name, role, contact_email, contact_phone)
  select md5(ward_id || '-mca')::uuid, mca_name, 'Ward MCA', email, phone from filled
  on conflict (id) do update
    set name = excluded.name, contact_email = excluded.contact_email, contact_phone = excluded.contact_phone
  returning id
)
insert into public.ward_officials (ward_id, official_id)
select ward_id, md5(ward_id || '-mca')::uuid from filled
on conflict do nothing;
