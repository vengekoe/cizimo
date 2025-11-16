import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReadingProgress {
  id?: string;
  current_page: number;
  completed: boolean;
}

export const useReadingProgress = (bookId: string = "default-book") => {
  const [progress, setProgress] = useState<ReadingProgress>({ current_page: 0, completed: false });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Kullanıcı oturum kontrolü
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // İlerlemeyi yükle
  useEffect(() => {
    const loadProgress = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("reading_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("book_id", bookId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setProgress({
            id: data.id,
            current_page: data.current_page,
            completed: data.completed,
          });
        }
      } catch (error) {
        console.error("İlerleme yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userId, bookId]);

  // İlerlemeyi kaydet
  const saveProgress = async (currentPage: number, completed: boolean = false) => {
    if (!userId) {
      toast({
        title: "Giriş yapın",
        description: "İlerlemenizi kaydetmek için giriş yapmalısınız",
        variant: "destructive",
      });
      return;
    }

    try {
      if (progress.id) {
        // Güncelle
        const { error } = await supabase
          .from("reading_progress")
          .update({
            current_page: currentPage,
            completed: completed,
          })
          .eq("id", progress.id);

        if (error) throw error;
      } else {
        // Yeni oluştur
        const { data, error } = await supabase
          .from("reading_progress")
          .insert({
            user_id: userId,
            book_id: bookId,
            current_page: currentPage,
            completed: completed,
          })
          .select()
          .single();

        if (error) throw error;
        setProgress({ id: data.id, current_page: currentPage, completed });
      }

      setProgress({ ...progress, current_page: currentPage, completed });
    } catch (error) {
      console.error("İlerleme kaydetme hatası:", error);
      toast({
        title: "Hata",
        description: "İlerleme kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  return {
    progress,
    loading,
    saveProgress,
    isLoggedIn: !!userId,
  };
};
