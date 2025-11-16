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

  const generateBookFromDrawing = async (imageFile: File) => {
    setLoading(true);
    try {
      // Resmi base64'e çevir
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const imageBase64 = await base64Promise;
      toast.loading("Çizim analiz ediliyor...");

      // Çizimden hikaye oluştur
      const { data: storyData, error: storyError } = await supabase.functions.invoke(
        "generate-story-from-drawing",
        {
          body: { imageBase64 },
        }
      );

      if (storyError) throw storyError;

      toast.dismiss();
      toast.loading("Hikaye görselleri oluşturuluyor...");

      // Görselleri oluştur - çizimdeki renkler ve stille
      const { data: imageData } = await supabase.functions.invoke("generate-book-images", {
        body: {
          pages: storyData.pages,
          theme: `${storyData.metadata.theme}, using colors: ${storyData.metadata.colors.join(", ")}, in a child-drawing style`,
        },
      });

      const pages = storyData.pages.map((page: any, index: number) => ({
        ...page,
        backgroundImage: imageData?.images?.[index] || undefined,
      }));

      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: storyData.title,
        theme: storyData.metadata.theme,
        coverEmoji: storyData.pages[0]?.emoji || "🎨",
        pages,
      };

      const updatedBooks = [...books, newBook];
      saveBooks(updatedBooks);
      toast.dismiss();
      toast.success(`"${storyData.title}" çiziminden oluşturuldu!`);
      return newBook;
    } catch (error) {
      console.error("Çizimden hikaye oluşturulamadı:", error);
      toast.dismiss();
      toast.error("Hikaye oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setLoading(false);
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

  return { books, loading, generateBook, generateBookFromDrawing };
};
