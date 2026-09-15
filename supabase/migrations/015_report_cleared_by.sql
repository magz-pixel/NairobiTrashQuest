-- Track who verified a hotspot clear (citizen cleanup flow).
-- Additive: existing rows keep cleared_by = null; no backfill.

alter table public.reports
  add column if not exists cleared_by uuid references public.profiles (id) on delete set null;

create index if not exists reports_cleared_by_idx
  on public.reports (cleared_by)
  where cleared_by is not null;

-- Same signature and citizen-clear auth as 012; records clearer on transition.
create or replace function public.verify_report_cleared(
  report_uuid uuid,
  cleared_image text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if cleared_image is null or length(trim(cleared_image)) = 0 then
    raise exception 'cleared_image is required';
  end if;

  update public.reports
  set
    status = 'verified_cleared',
    cleared_at = now(),
    cleared_image_url = cleared_image,
    cleared_by = auth.uid()
  where id = report_uuid
    and status in ('active', 'flagged');

  get diagnostics updated_count = row_count;

  if updated_count = 0 then
    raise exception 'Report not found or not eligible to clear';
  end if;
end;
$$;

revoke all on function public.verify_report_cleared(uuid, text) from public;
revoke all on function public.verify_report_cleared(uuid, text) from anon;
grant execute on function public.verify_report_cleared(uuid, text) to authenticated;
