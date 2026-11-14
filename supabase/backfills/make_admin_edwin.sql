-- Give Edwin admin access (post cleanups, team ledger, race admin, moderation).
-- He must have signed in once first. Expect "1 row affected"; 0 means no account yet.
update public.profiles set is_admin = true
where id = (select id from auth.users where lower(email) = lower('edwinmacharia353@gmail.com'));

-- Check:
select p.id, u.email, p.is_admin
from public.profiles p join auth.users u on u.id = p.id
where lower(u.email) = lower('edwinmacharia353@gmail.com');
