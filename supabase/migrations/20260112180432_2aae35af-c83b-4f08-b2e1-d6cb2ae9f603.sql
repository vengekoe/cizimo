-- Drop the security definer view and recreate with security invoker
DROP VIEW IF EXISTS public.child_reading_stats;

-- Recreate view with SECURITY INVOKER (respects RLS of querying user)
CREATE OR REPLACE VIEW public.child_reading_stats 
WITH (security_invoker = true) AS
SELECT 
  c.id as child_id,
  c.user_id,
  c.name as child_name,
  c.avatar_emoji,
  COALESCE(COUNT(DISTINCT rs.book_id), 0) as books_read,
  COALESCE(SUM(rs.pages_read), 0) as total_pages_read,
  COALESCE(SUM(rs.duration_seconds), 0) as total_reading_seconds,
  COALESCE(COUNT(rs.id), 0) as total_sessions
FROM public.children c
LEFT JOIN public.reading_sessions rs ON c.id = rs.child_id
GROUP BY c.id, c.user_id, c.name, c.avatar_emoji;