-- Fix profiles table RLS policies

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Profiller herkese açık" ON public.profiles;

-- Create a restrictive SELECT policy - users can only see their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add DELETE policy - users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);