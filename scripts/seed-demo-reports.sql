-- Run in Supabase SQL Editor after signing in once (creates a profile row).
-- Uses the first profile; no manual UUID needed.

INSERT INTO public.reports (user_id, latitude, longitude, severity_score, status, image_url, ai_tags)
SELECT
  p.id,
  v.lat,
  v.lng,
  v.severity,
  'active'::public.report_status,
  v.image_url,
  v.ai_tags::jsonb
FROM public.profiles p
CROSS JOIN (
  VALUES
    (-1.286389::double precision, 36.817223::double precision, 8::smallint, 'https://picsum.photos/seed/trash1/400/300', '["plastic","overflow"]'),
    (-1.292, 36.821, 6, 'https://picsum.photos/seed/trash2/400/300', '["bags","street"]'),
    (-1.28, 36.81, 9, 'https://picsum.photos/seed/trash3/400/300', '["dump","severe"]')
) AS v(lat, lng, severity, image_url, ai_tags)
LIMIT 3;
