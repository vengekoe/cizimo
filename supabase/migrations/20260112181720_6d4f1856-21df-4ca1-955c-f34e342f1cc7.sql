-- Create book_likes table
CREATE TABLE public.book_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, child_id)
);

-- Create book_comments table
CREATE TABLE public.book_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  emoji TEXT DEFAULT '😊',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_likes
CREATE POLICY "Users can view their own book likes"
ON public.book_likes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create book likes"
ON public.book_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book likes"
ON public.book_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for book_comments
CREATE POLICY "Users can view their own book comments"
ON public.book_comments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create book comments"
ON public.book_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book comments"
ON public.book_comments FOR DELETE
USING (auth.uid() = user_id);