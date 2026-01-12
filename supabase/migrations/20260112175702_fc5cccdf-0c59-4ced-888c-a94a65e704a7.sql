-- Create children table
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  favorite_color TEXT,
  favorite_animal TEXT,
  favorite_team TEXT,
  favorite_toy TEXT,
  favorite_superhero TEXT,
  favorite_cartoon TEXT,
  avatar_emoji TEXT DEFAULT '👶',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own children"
ON public.children
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own children"
ON public.children
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own children"
ON public.children
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own children"
ON public.children
FOR DELETE
USING (auth.uid() = user_id);

-- Add child_id to books table
ALTER TABLE public.books ADD COLUMN child_id UUID REFERENCES public.children(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_books_child_id ON public.books(child_id);
CREATE INDEX idx_children_user_id ON public.children(user_id);