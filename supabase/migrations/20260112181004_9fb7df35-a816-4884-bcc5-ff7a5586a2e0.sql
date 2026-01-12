-- Create book_shares table for sharing books between children
CREATE TABLE public.book_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, child_id)
);

-- Enable Row Level Security
ALTER TABLE public.book_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own book shares"
ON public.book_shares
FOR SELECT
USING (auth.uid() = shared_by);

CREATE POLICY "Users can create book shares"
ON public.book_shares
FOR INSERT
WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can delete their own book shares"
ON public.book_shares
FOR DELETE
USING (auth.uid() = shared_by);