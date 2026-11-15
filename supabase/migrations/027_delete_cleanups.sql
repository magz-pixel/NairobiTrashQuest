-- 027_delete_cleanups.sql
-- Lets an admin (or the cleanup's organiser) delete a cleanup event from the Cleanup console.
-- RSVPs are removed with it (event_rsvps.event_id is ON DELETE CASCADE). Safe to run twice.
drop policy if exists "Admins delete events" on public.events;
create policy "Admins delete events"
  on public.events for delete
  using (
    auth.uid() = organizer_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
