-- Citizen reports store selected waste categories, not a single AI tag.
alter table public.reports
  alter column waste_type type text[]
  using (
    case
      when waste_type is null or btrim(waste_type) = '' then null
      else array[waste_type]
    end
  );
