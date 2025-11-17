-- Profil tablosu oluştur
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS aktif et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Herkes tüm profilleri görebilir
CREATE POLICY "Profiller herkese açık"
ON public.profiles
FOR SELECT
USING (true);

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Kullanıcılar kendi profillerini oluşturabilir
CREATE POLICY "Kullanıcılar kendi profillerini oluşturabilir"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Yeni kullanıcı oluşturulduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$;

-- Trigger oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at otomatik güncelleme trigger'ı
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reading_progress_updated_at();