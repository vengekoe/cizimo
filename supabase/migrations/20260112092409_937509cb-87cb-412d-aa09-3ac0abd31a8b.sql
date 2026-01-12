-- Add text_position column to book_pages table
ALTER TABLE public.book_pages
ADD COLUMN text_position TEXT DEFAULT 'top';

-- Add comment for documentation
COMMENT ON COLUMN public.book_pages.text_position IS 'Position of text overlay on the page: top, bottom, top-left, top-right, bottom-left, bottom-right';