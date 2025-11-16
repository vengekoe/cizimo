import { useState, useEffect } from "react";
import { Book, defaultBooks } from "@/data/books";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GenerationProgress {
  stage: 'story' | 'cover' | 'images' | 'saving' | 'complete' | null;
  percentage: number;
  message: string;
}

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>(defaultBooks);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({ 
    stage: null, 
    percentage: 0, 
    message: '' 
  });

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
    setProgress({ stage: 'story', percentage: 10, message: 'Çizim analiz ediliyor...' });
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
      setProgress({ stage: 'cover', percentage: 30, message: 'Çizim yükleniyor...' });
      const coverImageUrl = await uploadImageToStorage(imageBase64, bookId, -1); // -1 = cover image

      // Çizimden hikaye oluştur
      const { data: storyData, error: storyError } = await supabase.functions.invoke(
        "generate-story-from-drawing",
        {
          body: { imageBase64 },
        }
      );

      if (storyError) {
        // 402 Payment Required hatası için özel mesaj
        if (storyError.message?.includes("402") || storyError.message?.includes("Ödeme gerekli")) {
          throw new Error("PAYMENT_REQUIRED");
        }
        // 429 Rate Limit hatası için özel mesaj
        if (storyError.message?.includes("429") || storyError.message?.includes("Rate limit")) {
          throw new Error("RATE_LIMIT");
        }
        throw storyError;
      }

      setProgress({ stage: 'images', percentage: 50, message: 'Sayfa görselleri oluşturuluyor...' });

      // Görselleri oluştur
      const { data: imageData } = await supabase.functions.invoke("generate-book-images", {
        body: {
          pages: storyData.pages,
          theme: `${storyData.metadata.theme}, using colors: ${storyData.metadata.colors.join(", ")}, in a child-drawing style`,
        },
      });

      setProgress({ stage: 'saving', percentage: 70, message: 'Görseller kaydediliyor...' });

      // Görselleri storage'a yükle
      const uploadPromises = (imageData?.images || []).map((imageBase64: string, index: number) => {
        if (imageBase64) {
          return uploadImageToStorage(imageBase64, bookId, index);
        }
        return Promise.resolve(null);
      });

      setProgress({ stage: 'complete', percentage: 90, message: 'Kitap hazırlanıyor...' });

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
        isFromDrawing: true,
        pages,
      };

      const updatedBooks = [...books, newBook];
      saveBooks(updatedBooks);
      setProgress({ stage: 'complete', percentage: 100, message: 'Tamamlandı!' });
      toast.success(`"${storyData.title}" çiziminden oluşturuldu!`);
      return newBook;
    } catch (error) {
      console.error("Çizimden hikaye oluşturulamadı:", error);
      setProgress({ stage: null, percentage: 0, message: '' });
      
      // Özel hata mesajları
      if (error instanceof Error) {
        if (error.message === "PAYMENT_REQUIRED") {
          toast.error("Lovable AI kredileriniz tükendi. Lütfen Settings → Workspace → Usage bölümünden kredi ekleyin.", {
            duration: 8000,
          });
          return null;
        }
        if (error.message === "RATE_LIMIT") {
          toast.error("Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.", {
            duration: 6000,
          });
          return null;
        }
      }
      
      toast.error("Hikaye oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProgress({ stage: null, percentage: 0, message: '' });
      }, 2000);
    }
  };

  const generateBook = async (theme: string) => {
    setLoading(true);
    setProgress({ stage: 'story', percentage: 10, message: 'Hikaye oluşturuluyor...' });
    try {
      const bookId = `book-${Date.now()}`;
      
      // Önce hikayeyi oluştur
      const { data: storyData, error: storyError } = await supabase.functions.invoke("generate-story", {
        body: { theme },
      });

      if (storyError) {
        // 402 Payment Required hatası için özel mesaj
        if (storyError.message?.includes("402") || storyError.message?.includes("Ödeme gerekli")) {
          throw new Error("PAYMENT_REQUIRED");
        }
        // 429 Rate Limit hatası için özel mesaj
        if (storyError.message?.includes("429") || storyError.message?.includes("Rate limit")) {
          throw new Error("RATE_LIMIT");
        }
        throw storyError;
      }

      setProgress({ stage: 'cover', percentage: 30, message: 'Kitap kapağı oluşturuluyor...' });
      
      // Kitap kapağı için görsel oluştur
      const { data: coverData } = await supabase.functions.invoke("generate-book-images", {
        body: {
          pages: [{
            character: storyData.title,
            emoji: storyData.pages[0]?.emoji || "📖",
            title: storyData.title,
            description: `Book cover for ${storyData.title}`,
            sound: ""
          }],
          theme: `${theme} - beautiful book cover illustration, children's book style, colorful and inviting`
        },
      });

      // Kapak görselini yükle
      let coverImageUrl = null;
      if (coverData?.images?.[0]) {
        coverImageUrl = await uploadImageToStorage(coverData.images[0], bookId, -1);
      }

      setProgress({ stage: 'images', percentage: 50, message: 'Sayfa görselleri oluşturuluyor...' });
      
      // Sayfa görselleri oluştur
      const { data: imageData } = await supabase.functions.invoke("generate-book-images", {
        body: {
          pages: storyData.pages,
          theme
        },
      });

      setProgress({ stage: 'saving', percentage: 70, message: 'Görseller kaydediliyor...' });
      
      // Görselleri storage'a yükle
      const uploadPromises = (imageData?.images || []).map((imageBase64: string, index: number) => {
        if (imageBase64) {
          return uploadImageToStorage(imageBase64, bookId, index);
        }
        return Promise.resolve(null);
      });

      setProgress({ stage: 'complete', percentage: 90, message: 'Kitap hazırlanıyor...' });

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
        coverImage: coverImageUrl || undefined,
        pages,
      };

      const updatedBooks = [...books, newBook];
      saveBooks(updatedBooks);
      setProgress({ stage: 'complete', percentage: 100, message: 'Tamamlandı!' });
      toast.success(`"${storyData.title}" başarıyla oluşturuldu!`);
      return newBook;
    } catch (error) {
      console.error("Hikaye oluşturulamadı:", error);
      setProgress({ stage: null, percentage: 0, message: '' });
      
      // Özel hata mesajları
      if (error instanceof Error) {
        if (error.message === "PAYMENT_REQUIRED") {
          toast.error("Lovable AI kredileriniz tükendi. Lütfen Settings → Workspace → Usage bölümünden kredi ekleyin.", {
            duration: 8000,
          });
          return null;
        }
        if (error.message === "RATE_LIMIT") {
          toast.error("Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.", {
            duration: 6000,
          });
          return null;
        }
      }
      
      toast.error("Hikaye oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProgress({ stage: null, percentage: 0, message: '' });
      }, 2000);
    }
  };

  const deleteBook = (bookId: string) => {
    try {
      const updatedBooks = books.filter(book => book.id !== bookId);
      saveBooks(updatedBooks);
      toast.success("Kitap silindi");
    } catch (error) {
      console.error("Kitap silinemedi:", error);
      toast.error("Kitap silinemedi");
    }
  };

  const toggleFavorite = (bookId: string) => {
    try {
      const updatedBooks = books.map(book =>
        book.id === bookId ? { ...book, isFavorite: !book.isFavorite } : book
      );
      saveBooks(updatedBooks);
    } catch (error) {
      console.error("Favori güncellenemedi:", error);
      toast.error("Favori güncellenemedi");
    }
  };

  const updateLastRead = (bookId: string) => {
    try {
      const updatedBooks = books.map(book =>
        book.id === bookId ? { ...book, lastReadAt: new Date().toISOString() } : book
      );
      saveBooks(updatedBooks);
    } catch (error) {
      console.error("Son okunma tarihi güncellenemedi:", error);
    }
  };

  return { books, loading, progress, generateBook, generateBookFromDrawing, deleteBook, toggleFavorite, updateLastRead };
};
