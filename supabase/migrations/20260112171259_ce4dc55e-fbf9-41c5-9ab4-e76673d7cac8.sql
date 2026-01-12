-- Add extended profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS favorite_color text,
ADD COLUMN IF NOT EXISTS favorite_animal text,
ADD COLUMN IF NOT EXISTS favorite_team text,
ADD COLUMN IF NOT EXISTS favorite_toy text,
ADD COLUMN IF NOT EXISTS favorite_superhero text,
ADD COLUMN IF NOT EXISTS favorite_cartoon text,
ADD COLUMN IF NOT EXISTS preferred_ai_model text DEFAULT 'gemini-3-pro-preview',
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'tr',
ADD COLUMN IF NOT EXISTS preferred_page_count integer DEFAULT 10;