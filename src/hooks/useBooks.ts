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
      // Sadece metadata'yı kaydet, görseller zaten storage'da
      const booksToSave = newBooks.map(book => ({
        ...book,
        pages: book.pages.map(page => ({
          ...page,
          // backgroundImage zaten URL, olduğu gibi kaydet
        }))
      }));
      localStorage.setItem("storybooks", JSON.stringify(booksToSave));
      setBooks(newBooks);
    } catch (error) {
      console.error("Kitaplar kaydedilemedi:", error);
      toast.error("Kitap kaydedilemedi. Çok fazla kitap var, bazılarını silin.");
    }
  };

  const uploadImageToStorage = async (base64Image: string, bookId: string, pageIndex: number): Promise<string | null> => {
    try {
      // Base64'ü blob'a çevir
      const base64Data = base64Image.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const fileName = `${bookId}/page-${pageIndex}.png`;
      
      const { data, error } = await supabase.storage
        .from('book-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('book-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  const generateBookFromDrawing = async (imageFile: File) => {
    setLoading(true);
    try {
      const bookId = `book-${Date.now()}`;
      
      // Resmi base64'e çevir
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const imageBase64 = await base64Promise;
      
      // Önce orijinal çizimi storage'a yükle
      toast.loading("Çizim yükleniyor...");
      const coverImageUrl = await uploadImageToStorage(imageBase64, bookId, -1); // -1 = cover image
      
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

      // Görselleri oluştur
      const { data: imageData } = await supabase.functions.invoke("generate-book-images", {
        body: {
          pages: storyData.pages,
          theme: `${storyData.metadata.theme}, using colors: ${storyData.metadata.colors.join(", ")}, in a child-drawing style`,
        },
      });

      // Görselleri storage'a yükle
      toast.loading("Görseller kaydediliyor...");
      const uploadPromises = (imageData?.images || []).map((imageBase64: string, index: number) => {
        if (imageBase64) {
          return uploadImageToStorage(imageBase64, bookId, index);
        }
        return Promise.resolve(null);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      const pages = storyData.pages.map((page: any, index: number) => ({
        ...page,
        backgroundImage: uploadedUrls[index] || undefined,
      }));

      const newBook: Book = {
        id: bookId,
        title: storyData.title,
        theme: storyData.metadata.theme,
        coverEmoji: storyData.pages[0]?.emoji || "🎨",
        coverImage: coverImageUrl || undefined,
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
      const bookId = `book-${Date.now()}`;
      
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

      // Görselleri storage'a yükle
      toast.loading("Görseller kaydediliyor...");
      const uploadPromises = (imageData?.images || []).map((imageBase64: string, index: number) => {
        if (imageBase64) {
          return uploadImageToStorage(imageBase64, bookId, index);
        }
        return Promise.resolve(null);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      const pages = storyData.pages.map((page: any, index: number) => ({
        ...page,
        backgroundImage: uploadedUrls[index] || undefined,
      }));

      const newBook: Book = {
        id: bookId,
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
