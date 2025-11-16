import { useState, useEffect } from "react";
import { Book, defaultBooks } from "@/data/books";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>(defaultBooks);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = () => {
    try {
      const saved = localStorage.getItem("storybooks");
      if (saved) {
        const parsed = JSON.parse(saved);
        setBooks(parsed);
      }
    } catch (error) {
      console.error("Kitaplar yüklenemedi:", error);
    }
  };

  const saveBooks = (newBooks: Book[]) => {
    try {
      localStorage.setItem("storybooks", JSON.stringify(newBooks));
      setBooks(newBooks);
    } catch (error) {
      console.error("Kitaplar kaydedilemedi:", error);
    }
  };

  const generateBook = async (theme: string) => {
    setLoading(true);
    try {
      // Önce hikayeyi oluştur
      const { data: storyData, error: storyError } = await supabase.functions.invoke("generate-story", {
        body: { theme },
      });

      if (storyError) throw storyError;

      // Sonra görselleri oluştur
      toast.loading("Hikaye görselleri oluşturuluyor...");
      const { data: imageData, error: imageError } = await supabase.functions.invoke("generate-book-images", {
        body: { 
          pages: storyData.pages,
          theme 
        },
      });

      // Görseller başarısız olsa bile hikayeyi kaydet
      const pages = storyData.pages.map((page: any, index: number) => ({
        ...page,
        backgroundImage: imageData?.images?.[index] || undefined,
      }));

      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: storyData.title,
        theme,
        coverEmoji: storyData.pages[0]?.emoji || "📖",
        pages,
      };

      const updatedBooks = [...books, newBook];
      saveBooks(updatedBooks);
      toast.dismiss();
      toast.success(`"${storyData.title}" başarıyla oluşturuldu!`);
      return newBook;
    } catch (error) {
      console.error("Hikaye oluşturulamadı:", error);
      toast.dismiss();
      toast.error("Hikaye oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { books, loading, generateBook };
};
