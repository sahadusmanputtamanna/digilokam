-- Supabase Article View Tracking RPC Function
-- Run this in your Supabase SQL Editor to enable page view tracking.

CREATE OR REPLACE FUNCTION public.increment_views(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Output confirmation
SELECT 'Article view tracker RPC function registered successfully' as status;
