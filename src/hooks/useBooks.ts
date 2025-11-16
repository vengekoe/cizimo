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
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: { theme },
      });

      if (error) throw error;

      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: data.title,
        theme,
        coverEmoji: data.pages[0]?.emoji || "📖",
        pages: data.pages,
      };

      const updatedBooks = [...books, newBook];
      saveBooks(updatedBooks);
      toast.success(`"${data.title}" başarıyla oluşturuldu!`);
      return newBook;
    } catch (error) {
      console.error("Hikaye oluşturulamadı:", error);
      toast.error("Hikaye oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { books, loading, generateBook };
};
