-- Create a view for admin to see all users with their subscriptions
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  u.last_sign_in_at,
  p.display_name,
  s.tier,
  s.monthly_credits,
  s.used_credits,
  s.max_pages,
  s.max_children,
  s.trial_ends_at,
  s.current_period_end,
  (SELECT COUNT(*) FROM public.children c WHERE c.user_id = u.id) as children_count,
  (SELECT COUNT(*) FROM public.books b WHERE b.user_id = u.id) as books_count,
  (SELECT COALESCE(SUM(rs.duration_seconds), 0) FROM public.reading_sessions rs WHERE rs.user_id = u.id) as total_reading_seconds,
  CASE WHEN ur.role = 'admin' THEN true ELSE false END as is_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.subscriptions s ON s.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin';

-- Enable RLS on admin view (only admins can see)
-- Note: Views inherit RLS from underlying tables, but we'll add a security definer function

-- Create function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  user_created_at timestamptz,
  last_sign_in_at timestamptz,
  display_name text,
  tier subscription_tier,
  monthly_credits int,
  used_credits int,
  max_pages int,
  max_children int,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  children_count bigint,
  books_count bigint,
  total_reading_seconds bigint,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text,
    u.created_at as user_created_at,
    u.last_sign_in_at,
    p.display_name,
    s.tier,
    s.monthly_credits,
    s.used_credits,
    s.max_pages,
    s.max_children,
    s.trial_ends_at,
    s.current_period_end,
    (SELECT COUNT(*) FROM public.children c WHERE c.user_id = u.id) as children_count,
    (SELECT COUNT(*) FROM public.books b WHERE b.user_id = u.id) as books_count,
    (SELECT COALESCE(SUM(rs.duration_seconds), 0) FROM public.reading_sessions rs WHERE rs.user_id = u.id) as total_reading_seconds,
    CASE WHEN ur.role = 'admin' THEN true ELSE false END as is_admin
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.subscriptions s ON s.user_id = u.id
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
  ORDER BY u.created_at DESC;
END;
$$;

-- Create function to update user subscription (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_subscription(
  _target_user_id uuid,
  _tier subscription_tier
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _features record;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get feature details for the tier
  SELECT * INTO _features FROM public.subscription_features WHERE tier = _tier;
  
  IF _features IS NULL THEN
    RAISE EXCEPTION 'Invalid subscription tier';
  END IF;

  -- Update subscription
  UPDATE public.subscriptions
  SET 
    tier = _tier,
    monthly_credits = _features.monthly_credits,
    max_pages = _features.max_pages,
    max_children = _features.max_children,
    price_tl = _features.price_tl,
    used_credits = 0, -- Reset credits on tier change
    updated_at = now()
  WHERE user_id = _target_user_id;

  RETURN true;
END;
$$;

-- Create function to toggle admin role (admin only)
CREATE OR REPLACE FUNCTION public.admin_toggle_user_role(
  _target_user_id uuid,
  _make_admin boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Cannot remove own admin role
  IF _target_user_id = auth.uid() AND NOT _make_admin THEN
    RAISE EXCEPTION 'Cannot remove your own admin privileges';
  END IF;

  IF _make_admin THEN
    -- Add admin role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Remove admin role
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id AND role = 'admin';
  END IF;

  RETURN true;
END;
$$;

-- Create function to get platform statistics (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_statistics()
RETURNS TABLE (
  total_users bigint,
  total_children bigint,
  total_books bigint,
  total_reading_sessions bigint,
  total_reading_hours numeric,
  users_by_tier jsonb,
  new_users_this_month bigint,
  books_this_month bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users)::bigint as total_users,
    (SELECT COUNT(*) FROM public.children)::bigint as total_children,
    (SELECT COUNT(*) FROM public.books)::bigint as total_books,
    (SELECT COUNT(*) FROM public.reading_sessions)::bigint as total_reading_sessions,
    (SELECT ROUND(COALESCE(SUM(duration_seconds), 0) / 3600.0, 1) FROM public.reading_sessions)::numeric as total_reading_hours,
    (
      SELECT jsonb_object_agg(tier, cnt)
      FROM (
        SELECT tier, COUNT(*) as cnt
        FROM public.subscriptions
        GROUP BY tier
      ) tier_counts
    ) as users_by_tier,
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= date_trunc('month', now()))::bigint as new_users_this_month,
    (SELECT COUNT(*) FROM public.books WHERE created_at >= date_trunc('month', now()))::bigint as books_this_month;
END;
$$;

-- Create function to reset user credits (admin only)
CREATE OR REPLACE FUNCTION public.admin_reset_user_credits(_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  UPDATE public.subscriptions
  SET used_credits = 0, updated_at = now()
  WHERE user_id = _target_user_id;

  RETURN true;
END;
$$;