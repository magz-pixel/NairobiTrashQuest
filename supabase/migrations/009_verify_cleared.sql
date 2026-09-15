-- Allow any authenticated cleaner to mark a hotspot verified_cleared
-- (bypass "Users can update own reports" RLS via security definer RPC).
-- Run after 004_civic_lifecycle.sql (status enum + cleared_* columns).

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
    cleared_image_url = cleared_image
  where id = report_uuid
    and status in ('active', 'flagged');

  get diagnostics updated_count = row_count;

  if updated_count = 0 then
    raise exception 'Report not found or not eligible to clear';
  end if;
end;
$$;

revoke all on function public.verify_report_cleared(uuid, text) from public;
grant execute on function public.verify_report_cleared(uuid, text) to authenticated;
