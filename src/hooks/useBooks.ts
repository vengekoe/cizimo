import { useState, useEffect } from "react";
import { Book, defaultBooks } from "@/data/books";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface GenerationProgress {
  stage: 'story' | 'cover' | 'images' | 'saving' | 'complete' | null;
  percentage: number;
  message: string;
}

export const useBooks = () => {
  const { user } = useAuth();
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
    if (user) {
      loadBooks();
    }
  }, [user]);

  const loadBooks = async () => {
    if (!user) return;
    
    try {
      // Önce Supabase'den yükle
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (booksError) throw booksError;

      if (booksData && booksData.length > 0) {
        // Her kitap için sayfa bilgilerini yükle
        const booksWithPages = await Promise.all(
          booksData.map(async (bookData) => {
            const { data: pagesData, error: pagesError } = await supabase
              .from('book_pages')
              .select('*')
              .eq('book_id', bookData.id)
              .order('page_number', { ascending: true });

            if (pagesError) {
              console.error('Sayfa yükleme hatası:', pagesError);
              return null;
            }

            return {
              id: bookData.id,
              title: bookData.title,
              theme: bookData.theme,
              coverEmoji: bookData.cover_emoji,
              coverImage: bookData.cover_image || undefined,
              isFromDrawing: bookData.is_from_drawing || false,
              isFavorite: bookData.is_favorite || false,
              lastReadAt: bookData.last_read_at || undefined,
              pages: pagesData.map(page => ({
                character: page.character,
                emoji: page.emoji,
                title: page.title,
                description: page.description,
                sound: page.sound,
                backgroundImage: page.background_image || undefined,
                textPosition: (page as any).text_position || "top",
              })),
            } as Book;
          })
        );

        const validBooks = booksWithPages.filter((book): book is Book => book !== null);
        setBooks(validBooks);
        // Sync to localStorage as backup
        localStorage.setItem("storybooks", JSON.stringify(validBooks));
      } else {
        // Supabase'de kitap yoksa localStorage'dan yükle ve Supabase'e migrate et
        const saved = localStorage.getItem("storybooks");
        if (saved) {
          const parsed = JSON.parse(saved);
          setBooks(parsed);
          // Migrate to Supabase
          await migrateLocalStorageToSupabase(parsed);
        }
      }
    } catch (error) {
      console.error("Kitaplar yüklenemedi:", error);
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem("storybooks");
        if (saved) {
          const parsed = JSON.parse(saved);
          setBooks(parsed);
        }
      } catch (localError) {
        console.error("LocalStorage'dan da yüklenemedi:", localError);
      }
    }
  };

  const migrateLocalStorageToSupabase = async (localBooks: Book[]) => {
    if (!user) return;
    
    try {
      for (const book of localBooks) {
        // Insert book
        const { error: bookError } = await supabase
          .from('books')
          .insert({
            id: book.id,
            user_id: user.id,
            title: book.title,
            theme: book.theme,
            cover_emoji: book.coverEmoji,
            cover_image: book.coverImage,
            is_from_drawing: book.isFromDrawing || false,
            is_favorite: book.isFavorite || false,
            last_read_at: book.lastReadAt,
          });

        if (bookError) {
          console.error('Book insert error:', bookError);
          continue;
        }

        // Insert pages
        const pagesData = book.pages.map((page, index) => ({
          book_id: book.id,
          page_number: index,
          character: page.character,
          emoji: page.emoji,
          title: page.title,
          description: page.description,
          sound: page.sound,
          background_image: page.backgroundImage,
          text_position: page.textPosition || "top",
        }));

        const { error: pagesError } = await supabase
          .from('book_pages')
          .insert(pagesData);

        if (pagesError) {
          console.error('Pages insert error:', pagesError);
        }
      }
      toast.success("Kitaplarınız veritabanına aktarıldı!");
    } catch (error) {
      console.error("Migration error:", error);
    }
  };

  const saveBooks = async (newBooks: Book[]) => {
    if (!user) return;
    
    try {
      // Sadece metadata'yı kaydet, görseller zaten storage'da
      const booksToSave = newBooks.map(book => ({
        ...book,
        pages: book.pages.map(page => ({
          ...page,
          // backgroundImage zaten URL, olduğu gibi kaydet
        }))
      }));
      
      // Save to localStorage as backup
      localStorage.setItem("storybooks", JSON.stringify(booksToSave));
      setBooks(newBooks);
      
      // Save to Supabase
      for (const book of newBooks) {
        // Upsert book
        const { error: bookError } = await supabase
          .from('books')
          .upsert({
            id: book.id,
            user_id: user.id,
            title: book.title,
            theme: book.theme,
            cover_emoji: book.coverEmoji,
            cover_image: book.coverImage,
            is_from_drawing: book.isFromDrawing || false,
            is_favorite: book.isFavorite || false,
            last_read_at: book.lastReadAt,
          }, {
            onConflict: 'id'
          });

        if (bookError) {
          console.error('Book save error:', bookError);
          continue;
        }

        // Delete existing pages and insert new ones
        await supabase
          .from('book_pages')
          .delete()
          .eq('book_id', book.id);

        const pagesData = book.pages.map((page, index) => ({
          book_id: book.id,
          page_number: index,
          character: page.character,
          emoji: page.emoji,
          title: page.title,
          description: page.description,
          sound: page.sound,
          background_image: page.backgroundImage,
          text_position: page.textPosition || "top",
        }));

        const { error: pagesError } = await supabase
          .from('book_pages')
          .insert(pagesData);

        if (pagesError) {
          console.error('Pages save error:', pagesError);
        }
      }
    } catch (error) {
      console.error("Kitaplar kaydedilemedi:", error);
      toast.error("Kitap kaydedilemedi.");
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
  const generateBookFromDrawing = async (imageFile: File, language: "tr" | "en" = "tr", pageCount: number = 10, model: "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview" = "gemini-3-pro-preview", userDescription?: string): Promise<Book | null> => {
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
          body: { imageBase64, language, pageCount, model, userDescription },
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

      // Background fotoğraflarının tamamının oluşturulduğunu kontrol et
      const missingImages = uploadedUrls.filter(url => !url).length;
      if (missingImages > 0) {
        throw new Error("MISSING_BACKGROUNDS");
      }

      const pages = storyData.story.pages.map((page: any, index: number) => ({
        ...page,
        backgroundImage: uploadedUrls[index],
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
        if (error.message === "MISSING_BACKGROUNDS") {
          toast.error("Bazı sayfa fotoğrafları oluşturulamadı. Lütfen tekrar deneyin.", {
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

  const generateBook = async (theme: string, language: "tr" | "en" = "tr", pageCount: number = 10, model: "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview" = "gemini-3-pro-preview"): Promise<Book | null> => {
    setLoading(true);
    setProgress({ stage: 'story', percentage: 10, message: 'Hikaye oluşturuluyor...' });
    try {
      const bookId = `book-${Date.now()}`;
      
      // Önce hikayeyi oluştur
      const { data: storyData, error: storyError } = await supabase.functions.invoke("generate-story", {
        body: { theme, language, pageCount, model },
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

      // Background fotoğraflarının tamamının oluşturulduğunu kontrol et
      const missingImages = uploadedUrls.filter(url => !url).length;
      if (missingImages > 0) {
        throw new Error("MISSING_BACKGROUNDS");
      }

      const pages = storyData.story.pages.map((page: any, index: number) => ({
        ...page,
        backgroundImage: uploadedUrls[index],
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
        if (error.message === "MISSING_BACKGROUNDS") {
          toast.error("Bazı sayfa fotoğrafları oluşturulamadı. Lütfen tekrar deneyin.", {
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

  const deleteBook = async (bookId: string) => {
    if (!user) return;
    
    try {
      const updatedBooks = books.filter(book => book.id !== bookId);
      
      // Delete from Supabase (cascade will delete pages)
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase delete error:', error);
      }
      
      // Update local state and localStorage
      localStorage.setItem("storybooks", JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
      toast.success("Kitap silindi");
    } catch (error) {
      console.error("Kitap silinemedi:", error);
      toast.error("Kitap silinemedi");
    }
  };

  const toggleFavorite = async (bookId: string) => {
    if (!user) return;
    
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;
      
      const newFavoriteStatus = !book.isFavorite;
      const updatedBooks = books.map(b =>
        b.id === bookId ? { ...b, isFavorite: newFavoriteStatus } : b
      );
      
      // Update Supabase
      const { error } = await supabase
        .from('books')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', bookId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
      }
      
      // Update local state and localStorage
      localStorage.setItem("storybooks", JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
    } catch (error) {
      console.error("Favori güncellenemedi:", error);
      toast.error("Favori güncellenemedi");
    }
  };

  const updateLastRead = async (bookId: string) => {
    if (!user) return;
    
    try {
      const now = new Date().toISOString();
      const updatedBooks = books.map(book =>
        book.id === bookId ? { ...book, lastReadAt: now } : book
      );
      
      // Update Supabase
      const { error } = await supabase
        .from('books')
        .update({ last_read_at: now })
        .eq('id', bookId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
      }
      
      // Update local state and localStorage
      localStorage.setItem("storybooks", JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
    } catch (error) {
      console.error("Son okunma tarihi güncellenemedi:", error);
    }
  };

  const regenerateBookImages = async (bookId: string): Promise<boolean> => {
    if (!user) return false;
    
    const book = books.find(b => b.id === bookId);
    if (!book) {
      toast.error("Kitap bulunamadı");
      return false;
    }

    setLoading(true);
    setProgress({ stage: 'images', percentage: 10, message: 'Yüksek çözünürlüklü görseller oluşturuluyor...' });

    try {
      // Prepare pages data for image generation
      const pagesData = book.pages.map(page => ({
        character: page.character,
        emoji: page.emoji,
        description: page.description,
      }));

      setProgress({ stage: 'images', percentage: 20, message: `${book.pages.length} görsel yeniden oluşturuluyor...` });

      // Call edge function to generate new high-resolution images
      const { data: imageResponse, error: imageError } = await supabase.functions.invoke('generate-book-images', {
        body: { pages: pagesData, theme: book.theme },
      });

      if (imageError) {
        console.error('Image generation error:', imageError);
        throw new Error(imageError.message || 'Görsel oluşturma hatası');
      }

      const generatedImages = imageResponse?.images || [];
      console.log(`Generated ${generatedImages.filter((img: string | null) => img !== null).length} images`);

      setProgress({ stage: 'saving', percentage: 60, message: 'Görseller yükleniyor...' });

      // Upload new images to storage and update pages
      const updatedPages = await Promise.all(
        book.pages.map(async (page, index) => {
          const newImage = generatedImages[index];
          if (newImage) {
            const uploadedUrl = await uploadImageToStorage(newImage, bookId, index);
            // Add cache buster to force refresh
            const cacheBuster = `?v=${Date.now()}`;
            return {
              ...page,
              backgroundImage: uploadedUrl ? `${uploadedUrl}${cacheBuster}` : page.backgroundImage,
            };
          }
          return page;
        })
      );

      setProgress({ stage: 'saving', percentage: 80, message: 'Kitap güncelleniyor...' });

      // Update book with new images
      const updatedBook = { ...book, pages: updatedPages };
      const updatedBooks = books.map(b => b.id === bookId ? updatedBook : b);

      // Update database
      for (let i = 0; i < updatedPages.length; i++) {
        const page = updatedPages[i];
        await supabase
          .from('book_pages')
          .update({ background_image: page.backgroundImage })
          .eq('book_id', bookId)
          .eq('page_number', i);
      }

      // Update local state
      localStorage.setItem("storybooks", JSON.stringify(updatedBooks));
      setBooks(updatedBooks);

      setProgress({ stage: 'complete', percentage: 100, message: 'Görseller yenilendi!' });
      toast.success("Görseller yüksek çözünürlükte yenilendi!");

      setTimeout(() => {
        setProgress({ stage: null, percentage: 0, message: '' });
      }, 2000);

      return true;
    } catch (error) {
      console.error("Görsel yenileme hatası:", error);
      toast.error("Görseller yenilenemedi: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
      setProgress({ stage: null, percentage: 0, message: '' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { books, loading, progress, generateBook, generateBookFromDrawing, deleteBook, toggleFavorite, updateLastRead, regenerateBookImages };
};
