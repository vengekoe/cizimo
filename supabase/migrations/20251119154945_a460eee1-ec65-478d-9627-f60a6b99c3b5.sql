-- Kitaplar tablosu oluştur
CREATE TABLE public.books (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  cover_emoji TEXT NOT NULL,
  cover_image TEXT,
  is_from_drawing BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Kitap sayfaları tablosu oluştur
CREATE TABLE public.book_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  character TEXT NOT NULL,
  emoji TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sound TEXT NOT NULL,
  background_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, page_number)
);

-- Kitaplar için RLS politikaları
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi kitaplarını görebilir"
  ON public.books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi kitaplarını oluşturabilir"
  ON public.books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi kitaplarını güncelleyebilir"
  ON public.books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi kitaplarını silebilir"
  ON public.books FOR DELETE
  USING (auth.uid() = user_id);

-- Kitap sayfaları için RLS politikaları
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi kitaplarının sayfalarını görebilir"
  ON public.book_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_pages.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Kullanıcılar kendi kitaplarının sayfalarını oluşturabilir"
  ON public.book_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_pages.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Kullanıcılar kendi kitaplarının sayfalarını güncelleyebilir"
  ON public.book_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_pages.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Kullanıcılar kendi kitaplarının sayfalarını silebilir"
  ON public.book_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_pages.book_id
      AND books.user_id = auth.uid()
    )
  );

-- Updated_at otomatik güncellemesi için trigger
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reading_progress_updated_at();

-- İndeksler
CREATE INDEX idx_books_user_id ON public.books(user_id);
CREATE INDEX idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX idx_book_pages_book_id ON public.book_pages(book_id);
CREATE INDEX idx_book_pages_page_number ON public.book_pages(book_id, page_number);