-- İlerleme takibi için tablo
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL DEFAULT 'default-book',
  current_page INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS politikaları
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi ilerlemelerini görebilir"
  ON public.reading_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilerlemelerini oluşturabilir"
  ON public.reading_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilerlemelerini güncelleyebilir"
  ON public.reading_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Güncelleme trigger'ı
CREATE OR REPLACE FUNCTION public.update_reading_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reading_progress_updated_at();