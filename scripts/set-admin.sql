-- Run in Supabase SQL Editor after signing in at least once in the app.
-- Replace the email below with your Google/magic-link login email.

update public.profiles
set is_admin = true
where id in (
  select id from auth.users where email = 'YOUR_EMAIL@example.com'
);

-- Verify:
select p.id, p.username, p.is_admin, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.is_admin = true;
