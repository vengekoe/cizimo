-- 1) Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2) Create enum for subscription packages
CREATE TYPE public.subscription_tier AS ENUM ('minik_masal', 'masal_kesfifcisi', 'masal_kahramani', 'sonsuz_masal');

-- 3) Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4) Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    tier subscription_tier NOT NULL DEFAULT 'minik_masal',
    monthly_credits INTEGER NOT NULL DEFAULT 1,
    used_credits INTEGER NOT NULL DEFAULT 0,
    max_pages INTEGER NOT NULL DEFAULT 5,
    max_children INTEGER NOT NULL DEFAULT 1,
    price_tl INTEGER NOT NULL DEFAULT 0,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 month'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 5) Create subscription_features table to track what features each tier has
CREATE TABLE public.subscription_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier subscription_tier NOT NULL UNIQUE,
    monthly_credits INTEGER NOT NULL,
    max_pages INTEGER NOT NULL,
    max_children INTEGER NOT NULL,
    price_tl INTEGER NOT NULL,
    basic_personalization BOOLEAN NOT NULL DEFAULT true,
    advanced_personalization BOOLEAN NOT NULL DEFAULT false,
    cover_design_selection BOOLEAN NOT NULL DEFAULT false,
    friend_sharing BOOLEAN NOT NULL DEFAULT false,
    unlimited_friend_sharing BOOLEAN NOT NULL DEFAULT false,
    basic_stats BOOLEAN NOT NULL DEFAULT false,
    detailed_stats BOOLEAN NOT NULL DEFAULT false,
    advanced_stats BOOLEAN NOT NULL DEFAULT false,
    photo_story BOOLEAN NOT NULL DEFAULT false,
    audio_story BOOLEAN NOT NULL DEFAULT false,
    font_selection BOOLEAN NOT NULL DEFAULT false,
    unlimited_revision BOOLEAN NOT NULL DEFAULT false,
    favorite_pages BOOLEAN NOT NULL DEFAULT false,
    custom_illustration BOOLEAN NOT NULL DEFAULT false,
    weekly_themes BOOLEAN NOT NULL DEFAULT false,
    family_sharing BOOLEAN NOT NULL DEFAULT false,
    print_ready BOOLEAN NOT NULL DEFAULT false,
    library_backup BOOLEAN NOT NULL DEFAULT false,
    unlimited_stories BOOLEAN NOT NULL DEFAULT false,
    unlimited_pages BOOLEAN NOT NULL DEFAULT false,
    trial_months INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS on subscription_features (public read)
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;

-- 6) Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7) Function to check if user is admin (for bypassing limits)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- 8) Function to get user's subscription tier
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id UUID)
RETURNS subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tier FROM public.subscriptions WHERE user_id = _user_id
$$;

-- 9) RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 10) RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 11) RLS Policies for subscription_features (public read)
CREATE POLICY "Anyone can view subscription features"
ON public.subscription_features
FOR SELECT
USING (true);

-- 12) Insert default subscription features for each tier
INSERT INTO public.subscription_features (tier, monthly_credits, max_pages, max_children, price_tl, basic_personalization, advanced_personalization, cover_design_selection, friend_sharing, unlimited_friend_sharing, basic_stats, detailed_stats, advanced_stats, photo_story, audio_story, font_selection, unlimited_revision, favorite_pages, custom_illustration, weekly_themes, family_sharing, print_ready, library_backup, unlimited_stories, unlimited_pages, trial_months) VALUES
('minik_masal', 1, 5, 1, 49, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, 3),
('masal_kesfifcisi', 3, 15, 2, 199, true, true, true, true, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, 0),
('masal_kahramani', 10, 20, 3, 499, true, true, true, true, false, true, true, false, true, true, true, true, true, false, false, false, false, false, false, false, 0),
('sonsuz_masal', -1, -1, 5, 999, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, 0);

-- 13) Trigger to create subscription when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default subscription (minik_masal with 3 month trial)
  INSERT INTO public.subscriptions (user_id, tier, monthly_credits, used_credits, max_pages, max_children, price_tl, trial_ends_at)
  VALUES (
    NEW.id,
    'minik_masal',
    1,
    0,
    5,
    1,
    0,
    now() + INTERVAL '3 months'
  );
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user subscription
CREATE TRIGGER on_auth_user_created_subscription
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_subscription();

-- 14) Function to check if user can create story (has credits)
CREATE OR REPLACE FUNCTION public.can_create_story(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN public.is_admin(_user_id) THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.user_id = _user_id
        AND (s.monthly_credits = -1 OR s.used_credits < s.monthly_credits)
        AND s.current_period_end > now()
      ) THEN true
      ELSE false
    END
$$;

-- 15) Function to use a credit
CREATE OR REPLACE FUNCTION public.use_story_credit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _can_create BOOLEAN;
BEGIN
  -- Admins don't use credits
  IF public.is_admin(_user_id) THEN
    RETURN true;
  END IF;
  
  -- Check if user can create
  SELECT public.can_create_story(_user_id) INTO _can_create;
  
  IF NOT _can_create THEN
    RETURN false;
  END IF;
  
  -- Update used credits (skip if unlimited)
  UPDATE public.subscriptions
  SET used_credits = used_credits + 1, updated_at = now()
  WHERE user_id = _user_id
  AND monthly_credits != -1;
  
  RETURN true;
END;
$$;

-- 16) Function to get user's remaining credits
CREATE OR REPLACE FUNCTION public.get_remaining_credits(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN public.is_admin(_user_id) THEN -1
      WHEN s.monthly_credits = -1 THEN -1
      ELSE GREATEST(0, s.monthly_credits - s.used_credits)
    END
  FROM public.subscriptions s
  WHERE s.user_id = _user_id
$$;

-- 17) Update updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();