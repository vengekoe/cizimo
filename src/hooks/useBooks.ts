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
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem("storybooks");
      return saved ? JSON.parse(saved) : defaultBooks;
    } catch {
      return defaultBooks;
    }
  });
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

  const uploadImageToStorage = async (imageSource: string, bookId: string, pageIndex: number): Promise<string | null> => {
    try {
      let blob: Blob;
      let ext = 'png';

      if (imageSource.startsWith('data:image')) {
        // Data URL (base64) -> Blob
        const [header, base64Data] = imageSource.split(',');
        const mimeMatch = header.match(/data:(image\/[a-zA-Z+]+);base64/);
        const mime = mimeMatch?.[1] || 'image/png';
        ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png';

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mime });
      } else if (/^https?:\/\//.test(imageSource)) {
        // Remote URL -> fetch -> Blob (persist to our storage so it doesn't expire)
        const resp = await fetch(imageSource);
        if (!resp.ok) throw new Error(`Image fetch failed: ${resp.status}`);
        blob = await resp.blob();
        const mime = blob.type || 'image/png';
        ext = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg');
      } else {
        throw new Error('Unsupported image source format');
      }

      const baseName = pageIndex >= 0 ? `page-${pageIndex}` : 'cover';
      const safeExt = ext.includes(';') ? 'png' : ext;
      const fileName = `${bookId}/${baseName}.${safeExt}`;

      const { error } = await supabase.storage
        .from('book-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
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
      // As a fallback, if we received a remote URL, return it to avoid blocking book creation (may expire)
      if (/^https?:\/\//.test(imageSource)) {
        return imageSource;
      }
      return null;
    }
  };
  const generateBookFromDrawing = async (imageFile: File) => {
    setLoading(true);
    setProgress({ stage: 'story', percentage: 10, message: 'Çizim analiz ediliyor...' });
    try {
      const bookId = `book-${Date.now()}`;
      
      // Resmi sıkıştır ve base64'e çevir
      const compressImage = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              // Max 1920px width/height
              const maxSize = 1920;
              if (width > maxSize || height > maxSize) {
                if (width > height) {
                  height = (height / width) * maxSize;
                  width = maxSize;
                } else {
                  width = (width / height) * maxSize;
                  height = maxSize;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              // Compress to JPEG with quality 0.8
              const compressed = canvas.toDataURL('image/jpeg', 0.8);
              resolve(compressed);
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const imageBase64 = await compressImage(imageFile);
      
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
        console.error("Story generation error:", storyError);
        
        // Check error response for structured errors
        const errorData = storyError.context?.body;
        if (errorData?.error === "PAYMENT_REQUIRED") {
          throw new Error("PAYMENT_REQUIRED");
        }
        if (errorData?.error === "RATE_LIMIT") {
          throw new Error("RATE_LIMIT");
        }
        
        // Fallback to checking error message
        if (storyError.message?.includes("402") || storyError.message?.includes("PAYMENT_REQUIRED")) {
          throw new Error("PAYMENT_REQUIRED");
        }
        if (storyError.message?.includes("429") || storyError.message?.includes("RATE_LIMIT")) {
          throw new Error("RATE_LIMIT");
        }
        if (storyError.message?.includes("too_big") || storyError.message?.includes("IMAGE_TOO_LARGE")) {
          throw new Error("IMAGE_TOO_LARGE");
        }
        
        throw storyError;
      }

      setProgress({ stage: 'images', percentage: 50, message: 'Sayfa görselleri oluşturuluyor...' });

      // Görselleri oluştur
      const { data: imageData } = await supabase.functions.invoke("generate-book-images", {
        body: {
          pages: storyData.story.pages,
          theme: `${storyData.analysis.theme}, using colors: ${storyData.analysis.colors.join(", ")}, in a child-drawing style`,
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

      const pages = storyData.story.pages.map((page: any, index: number) => ({
        ...page,
        backgroundImage: uploadedUrls[index] || undefined,
      }));

      const newBook: Book = {
        id: bookId,
        title: storyData.story.title,
        theme: storyData.analysis.theme,
        coverEmoji: storyData.story.pages[0]?.emoji || "🎨",
        coverImage: coverImageUrl || undefined,
        isFromDrawing: true,
        pages,
      };

      const updatedBooks = [...books, newBook];
      saveBooks(updatedBooks);
      setProgress({ stage: 'complete', percentage: 100, message: 'Tamamlandı!' });
      toast.success(`"${storyData.story.title}" çiziminden oluşturuldu!`);
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
        if (error.message === "IMAGE_TOO_LARGE") {
          toast.error("Görsel çok büyük. Görsel otomatik olarak sıkıştırıldı ama hala çok büyük. Lütfen daha küçük bir görsel deneyin.", {
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
            character: storyData.story.title,
            emoji: storyData.story.pages[0]?.emoji || "📖",
            title: storyData.story.title,
            description: `Book cover for ${storyData.story.title}`,
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
          pages: storyData.story.pages,
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

      const pages = storyData.story.pages.map((page: any, index: number) => ({
        ...page,
        backgroundImage: uploadedUrls[index] || undefined,
      }));

      const newBook: Book = {
        id: bookId,
        title: storyData.story.title,
        theme,
        coverEmoji: storyData.story.pages[0]?.emoji || "📖",
        coverImage: coverImageUrl || undefined,
        pages,
      };

      const updatedBooks = [...books, newBook];
      saveBooks(updatedBooks);
      setProgress({ stage: 'complete', percentage: 100, message: 'Tamamlandı!' });
      toast.success(`"${storyData.story.title}" başarıyla oluşturuldu!`);
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
