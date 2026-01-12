-- Add preferred_image_model column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_image_model TEXT DEFAULT 'gemini-2.5-flash-image';