-- Run in Supabase SQL Editor after signing in once.
-- Replace YOUR_USER_ID with your UUID from Authentication → Users.

INSERT INTO public.reports (user_id, latitude, longitude, severity_score, status, image_url, ai_tags)
VALUES
  ('YOUR_USER_ID', -1.286389, 36.817223, 8, 'active', 'https://picsum.photos/seed/trash1/400/300', '["plastic","overflow"]'),
  ('YOUR_USER_ID', -1.292000, 36.821000, 6, 'active', 'https://picsum.photos/seed/trash2/400/300', '["bags","street"]'),
  ('YOUR_USER_ID', -1.280000, 36.810000, 9, 'active', 'https://picsum.photos/seed/trash3/400/300', '["dump","severe"]');
