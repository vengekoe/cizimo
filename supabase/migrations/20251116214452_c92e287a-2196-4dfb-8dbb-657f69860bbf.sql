-- Function'ın search_path'ini düzelt
DROP TRIGGER IF EXISTS update_reading_progress_updated_at ON public.reading_progress;
DROP FUNCTION IF EXISTS public.update_reading_progress_updated_at();

CREATE OR REPLACE FUNCTION public.update_reading_progress_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reading_progress_updated_at();