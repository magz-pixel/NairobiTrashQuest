-- removed — path scheme changed to flat UUID filenames, folder-based ownership check is no longer satisfiable.
drop policy if exists "Users can update own uploads" on storage.objects;
