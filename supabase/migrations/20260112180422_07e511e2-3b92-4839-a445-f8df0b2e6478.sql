-- Create reading_sessions table to track reading activity
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  pages_read INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own reading sessions"
ON public.reading_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading sessions"
ON public.reading_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions"
ON public.reading_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_child_id ON public.reading_sessions(child_id);
CREATE INDEX idx_reading_sessions_book_id ON public.reading_sessions(book_id);

-- Create a view for child statistics
CREATE OR REPLACE VIEW public.child_reading_stats AS
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