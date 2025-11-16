import { useEffect, useState } from "react";

interface ReadingProgress {
  current_page: number;
  completed: boolean;
}

export const useReadingProgress = (bookId: string = "default-book") => {
  const [progress, setProgress] = useState<ReadingProgress>({ current_page: 0, completed: false });
  const [loading, setLoading] = useState(true);

  // LocalStorage'dan ilerlemeyi yükle
  useEffect(() => {
    const loadProgress = () => {
      try {
        const saved = localStorage.getItem(`reading_progress_${bookId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProgress(parsed);
        }
      } catch (error) {
        console.error("İlerleme yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [bookId]);

  // İlerlemeyi kaydet
  const saveProgress = (currentPage: number, completed: boolean = false) => {
    try {
      const newProgress = { current_page: currentPage, completed };
      localStorage.setItem(`reading_progress_${bookId}`, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error("İlerleme kaydetme hatası:", error);
    }
  };

  return {
    progress,
    loading,
    saveProgress,
    isLoggedIn: true, // Giriş kontrolü devre dışı
  };
};
