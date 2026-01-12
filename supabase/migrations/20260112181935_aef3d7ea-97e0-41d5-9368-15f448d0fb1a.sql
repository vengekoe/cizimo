-- Add category column to books table
ALTER TABLE public.books 
ADD COLUMN category TEXT DEFAULT 'other';

-- Create book_categories reference table for predefined categories
CREATE TABLE public.book_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Insert default categories
INSERT INTO public.book_categories (id, name, emoji, color, sort_order) VALUES
  ('adventure', 'Macera', '🏔️', 'orange', 1),
  ('animals', 'Hayvanlar', '🐾', 'green', 2),
  ('fantasy', 'Fantastik', '🧙', 'purple', 3),
  ('space', 'Uzay', '🚀', 'blue', 4),
  ('nature', 'Doğa', '🌿', 'emerald', 5),
  ('friendship', 'Arkadaşlık', '🤝', 'pink', 6),
  ('family', 'Aile', '👨‍👩‍👧', 'amber', 7),
  ('sports', 'Spor', '⚽', 'red', 8),
  ('vehicles', 'Araçlar', '🚗', 'cyan', 9),
  ('other', 'Diğer', '📚', 'gray', 10);

-- Enable RLS (public read, no write for users)
ALTER TABLE public.book_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
ON public.book_categories FOR SELECT
USING (true);