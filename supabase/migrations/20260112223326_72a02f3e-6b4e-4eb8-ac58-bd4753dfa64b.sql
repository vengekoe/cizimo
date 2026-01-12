-- Fix 1: Enable RLS on child_reading_stats view and add policy
ALTER VIEW public.child_reading_stats SET (security_barrier = true);

-- Note: In PostgreSQL, views don't support RLS policies directly in the same way tables do.
-- However, since this view has security_invoker=true and the underlying tables have RLS,
-- we need to ensure the query is always scoped to the current user.

-- For views, we drop and recreate with built-in user filtering
DROP VIEW IF EXISTS public.child_reading_stats;

CREATE OR REPLACE VIEW public.child_reading_stats
WITH (security_invoker = true, security_barrier = true)
AS
SELECT 
    c.id AS child_id,
    c.user_id,
    c.name AS child_name,
    c.avatar_emoji,
    COUNT(DISTINCT rs.book_id) AS books_read,
    COALESCE(SUM(rs.pages_read), 0) AS total_pages_read,
    COALESCE(SUM(rs.duration_seconds), 0) AS total_reading_seconds,
    COUNT(rs.id) AS total_sessions
FROM public.children c
LEFT JOIN public.reading_sessions rs ON rs.child_id = c.id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.user_id, c.name, c.avatar_emoji;

-- Add comment explaining security
COMMENT ON VIEW public.child_reading_stats IS 'Reading stats per child, filtered by auth.uid() for security';

-- Fix 2: Change subscription_features to require authentication
DROP POLICY IF EXISTS "Anyone can view subscription features" ON public.subscription_features;

CREATE POLICY "Authenticated users can view subscription features"
ON public.subscription_features
FOR SELECT
TO authenticated
USING (true);