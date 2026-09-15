-- 017 - Multiple briefing photos per race hotspot
-- Keep reference_image_url unchanged for existing single-photo pins.

alter table public.race_hotspots
  add column if not exists gallery_image_urls text[] default '{}'::text[];
