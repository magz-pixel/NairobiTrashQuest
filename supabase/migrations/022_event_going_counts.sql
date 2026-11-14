-- 022_event_going_counts.sql
-- Public "N people going" for cleanup events.
--
-- Why: event_rsvps rows are private (RLS only shows a user their own RSVPs), so the
-- map can't count them directly. This function returns only aggregate counts —
-- never who is going — and is safe to expose to anonymous visitors.
--
-- Safe to run twice.

create or replace function public.event_going_counts(p_event_ids uuid[])
returns table (event_id uuid, going integer)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_id, count(*)::integer as going
  from public.event_rsvps r
  where r.event_id = any (p_event_ids)
    and r.status in ('going', 'attended')
  group by r.event_id
$$;

revoke all on function public.event_going_counts(uuid[]) from public;
grant execute on function public.event_going_counts(uuid[]) to anon, authenticated;
