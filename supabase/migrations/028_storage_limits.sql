-- 028_storage_limits.sql
-- Anyone can upload report photos (anonymous reporting), so cap what the buckets accept:
-- images only, 5 MB max. Stops the buckets being used to host other files or run up storage costs.
-- The app already compresses photos to ~1600 px JPEG before upload. Safe to run twice.
update storage.buckets
   set file_size_limit = 5 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
 where id in ('report-images', 'race-hotspot-images');

-- Cleanup media also takes short videos (signed-in users only).
update storage.buckets
   set file_size_limit = 50 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm']
 where id = 'cleanup-media';
