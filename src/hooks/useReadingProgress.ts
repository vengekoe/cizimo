import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ReadingProgress {
  current_page: number;
  completed: boolean;
}

export const useReadingProgress = (bookId: string = "default-book") => {
  const [progress, setProgress] = useState<ReadingProgress>({ current_page: 0, completed: false });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load progress from Supabase, fallback to localStorage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // Try Supabase first if user is authenticated
        if (user?.id) {
          const { data, error } = await supabase
            .from("reading_progress")
            .select("current_page, completed")
            .eq("user_id", user.id)
            .eq("book_id", bookId)
            .maybeSingle();

          if (data && !error) {
            setProgress({ current_page: data.current_page, completed: data.completed });
            setLoading(false);
            return;
          }
          
          // If no data in Supabase, check localStorage for migration
          const saved = localStorage.getItem(`reading_progress_${bookId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            setProgress(parsed);
            // Migrate to Supabase
            await supabase.from("reading_progress").upsert({
              user_id: user.id,
              book_id: bookId,
              current_page: parsed.current_page,
              completed: parsed.completed,
            }, { onConflict: "user_id,book_id" });
            // Clear localStorage after migration
            localStorage.removeItem(`reading_progress_${bookId}`);
          }
        } else {
          // Fallback to localStorage for unauthenticated users
          const saved = localStorage.getItem(`reading_progress_${bookId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            setProgress(parsed);
          }
        }
      } catch (error) {
        console.error("Progress load error");
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [bookId, user?.id]);

  // Save progress to Supabase and localStorage
  const saveProgress = useCallback(async (currentPage: number, completed: boolean = false) => {
    const newProgress = { current_page: currentPage, completed };
    setProgress(newProgress);

    try {
      if (user?.id) {
        // Save to Supabase
        await supabase.from("reading_progress").upsert({
          user_id: user.id,
          book_id: bookId,
          current_page: currentPage,
          completed,
        }, { onConflict: "user_id,book_id" });
      } else {
        // Fallback to localStorage for unauthenticated users
        localStorage.setItem(`reading_progress_${bookId}`, JSON.stringify(newProgress));
      }
    } catch (error) {
      console.error("Progress save error");
      // Fallback to localStorage on error
      localStorage.setItem(`reading_progress_${bookId}`, JSON.stringify(newProgress));
    }
  }, [bookId, user?.id]);

  return {
    progress,
    loading,
    saveProgress,
    isLoggedIn: !!user,
  };
};
