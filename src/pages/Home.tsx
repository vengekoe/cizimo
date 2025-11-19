import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Paintbrush, Trash2, Star, Clock, LogOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import rainbowForestCover from "@/assets/rainbow-forest-cover.jpg";
import { BookGenerationProgress } from "@/components/BookGenerationProgress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const themes = [
  { emoji: "🌊", title: "Deniz Macerası", theme: "Denizaltı dünyası ve deniz canlıları" },
  { emoji: "🚀", title: "Uzay Yolculuğu", theme: "Uzay, gezegenler ve yıldızlar" },
  { emoji: "🏰", title: "Şato Masalı", theme: "Prenses, şövalye ve ejderhalar" },
  { emoji: "🦖", title: "Dinozor Zamanı", theme: "Dinozorlar ve tarih öncesi dönem" },
  { emoji: "🎪", title: "Sirk Şovu", theme: "Sirk sanatçıları ve performanslar" },
  { emoji: "🌈", title: "Gökkuşağı Ülkesi", theme: "Renkler ve hayal dünyası" },
  { emoji: "🐉", title: "Ejderha Dostluğu", theme: "Ejderhalar ve cesaret" },
  { emoji: "🎨", title: "Sanat Atölyesi", theme: "Yaratıcılık ve sanat" },
  { emoji: "🌺", title: "Bahçe Maceraları", theme: "Çiçekler, böcekler ve doğa" },
];

const Home = () => {
  const { books, loading, progress, generateBook, generateBookFromDrawing, deleteBook, toggleFavorite } = useBooks();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [customTheme, setCustomTheme] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"favorites" | "recent">("favorites");
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [pageCount, setPageCount] = useState<number>(10);

  // Kullanıcı giriş yapmamışsa auth sayfasına yönlendir
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Kitapları sıralama tipine göre sırala
  const sortedBooks = [...books].sort((a, b) => {
    if (sortBy === "favorites") {
      // Favoriler üstte
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    } else {
      // En son okunanlar üstte
      const aDate = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
      const bDate = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
      return bDate - aDate;
    }
  });

  // Gökkuşağı Ormanı'nın Kayıp Rengi kitabını çizimden işaretle
  useEffect(() => {
    const storedBooks = localStorage.getItem("storybooks");
    if (storedBooks) {
      const parsedBooks = JSON.parse(storedBooks);
      const rainbowBook = parsedBooks.find((book: any) => 
        book.title === "Gökkuşağı Ormanı'nın Kayıp Rengi"
      );
      
      if (rainbowBook && !rainbowBook.isFromDrawing) {
        const updatedBooks = parsedBooks.map((book: any) => 
          book.title === "Gökkuşağı Ormanı'nın Kayıp Rengi" 
            ? { ...book, isFromDrawing: true }
            : book
        );
        localStorage.setItem("storybooks", JSON.stringify(updatedBooks));
        window.location.reload();
      }
    }
  }, []);

  const handleGenerateBook = async (theme: string) => {
    const book = await generateBook(theme, language, pageCount);
    if (book) {
      toast.success("Yeni kitap hazır! Şimdi okuyabilirsiniz.");
      // Kitabı otomatik olarak aç
      setTimeout(() => {
        navigate(`/book/${book.id}`);
      }, 1000);
    }
  };

  const handleCustomTheme = async () => {
    if (!customTheme.trim()) {
      toast.error("Lütfen bir tema girin");
      return;
    }
    await handleGenerateBook(customTheme);
    setCustomTheme("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerateFromDrawing = async () => {
    if (!selectedImage) {
      toast.error("Lütfen bir çizim yükleyin");
      return;
    }
    const book = await generateBookFromDrawing(selectedImage, language, pageCount);
    if (book) {
      setSelectedImage(null);
      setPreviewUrl("");
      toast.success("Çiziminden harika bir hikaye doğdu!");
      // Kitabı otomatik olarak aç
      setTimeout(() => {
        navigate(`/book/${book.id}`);
      }, 1000);
    }
  };

  const handleDeleteBook = (bookId: string) => {
    if (deleteBook) {
      deleteBook(bookId);
      setBookToDelete(null);
    }
  };

  return (
    <div className="min-h-screen relative">
      <BookGenerationProgress progress={progress} />
      
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${rainbowForestCover})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-background/80" />
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="flex justify-between items-start mb-12">
          <div className="text-center flex-1">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Hikaye Kitaplığım 📚
            </h1>
            <p className="text-xl text-muted-foreground">
              Yapay zeka ile benzersiz hikayeler keşfet!
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </Button>
        </div>

        {/* Mevcut Kitaplar */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <span>📖</span>
              Kitaplarım ({books.length})
            </h2>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "favorites" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("favorites")}
              >
                <Star className="w-4 h-4 mr-2" />
                Favoriler
              </Button>
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("recent")}
              >
                <Clock className="w-4 h-4 mr-2" />
                En Son Okunanlar
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBooks.map((book) => (
              <div key={book.id} className="relative group">
                <Link
                  to={`/book/${book.id}`}
                  className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  {book.isFromDrawing && (
                    <div className="absolute top-14 right-3 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
                      <Paintbrush className="w-3.5 h-3.5" />
                      Çizimden
                    </div>
                  )}
                  <div className="p-8">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {book.coverEmoji}
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{book.theme}</p>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {book.pages.length} sayfa
                      </span>
                      {book.lastReadAt && (
                        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(book.lastReadAt), { addSuffix: true, locale: tr })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm ${
                      book.isFavorite 
                        ? "bg-yellow-500/80 hover:bg-yellow-500 text-white" 
                        : "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite && toggleFavorite(book.id);
                    }}
                  >
                    <Star className={`w-4 h-4 ${book.isFavorite ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBookToDelete(book.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Çizimden Hikaye Oluştur */}
        <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-3xl p-8 border border-border mb-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <span className="text-4xl">🎨</span>
            Çiziminden Hikaye Oluştur
          </h2>
          <p className="text-muted-foreground mb-6">
            Çocuğunun çizdiği resmi yükle, yapay zeka o renkler ve temalarla benzersiz bir hikaye yaratsın!
          </p>

          {/* Hikaye Ayarları */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-card/50 rounded-xl p-4 border border-border/50">
            <div className="space-y-2">
              <Label htmlFor="drawing-language">Hikaye Dili</Label>
              <Select value={language} onValueChange={(value: "tr" | "en") => setLanguage(value)}>
                <SelectTrigger id="drawing-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="drawing-pages">Sayfa Sayısı</Label>
              <Select value={pageCount.toString()} onValueChange={(value) => setPageCount(parseInt(value))}>
                <SelectTrigger id="drawing-pages">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Sayfa</SelectItem>
                  <SelectItem value="10">10 Sayfa</SelectItem>
                  <SelectItem value="15">15 Sayfa</SelectItem>
                  <SelectItem value="20">20 Sayfa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label
                htmlFor="drawing-upload"
                className="block cursor-pointer"
              >
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-8 hover:border-primary hover:bg-primary/5 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="drawing-upload"
                    disabled={loading}
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-7xl">📷</div>
                    <div className="text-center">
                      <p className="font-semibold text-lg mb-2">
                        {selectedImage ? "✅ Çizim Yüklendi!" : "Çizim Yükle"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Fotoğraf çek veya galeriden seç
                      </p>
                    </div>
                  </div>
                </div>
              </label>
              
              {selectedImage && (
                <Button
                  onClick={handleGenerateFromDrawing}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-accent to-primary text-white py-6 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Hikaye Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Hikayeyi Oluştur
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {previewUrl && (
              <div className="rounded-xl overflow-hidden border-2 border-primary/30 bg-card shadow-lg">
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-3 border-b border-border">
                  <p className="text-sm font-semibold text-center">Yüklenen Çizim</p>
                </div>
                <div className="p-4">
                  <img
                    src={previewUrl}
                    alt="Yüklenen çizim"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Yeni Kitap Oluştur */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 border border-border">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Temadan Hikaye Oluştur
          </h2>

          {/* Hikaye Ayarları */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-card/50 rounded-xl p-4 border border-border/50">
            <div className="space-y-2">
              <Label htmlFor="theme-language">Hikaye Dili</Label>
              <Select value={language} onValueChange={(value: "tr" | "en") => setLanguage(value)}>
                <SelectTrigger id="theme-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme-pages">Sayfa Sayısı</Label>
              <Select value={pageCount.toString()} onValueChange={(value) => setPageCount(parseInt(value))}>
                <SelectTrigger id="theme-pages">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Sayfa</SelectItem>
                  <SelectItem value="10">10 Sayfa</SelectItem>
                  <SelectItem value="15">15 Sayfa</SelectItem>
                  <SelectItem value="20">20 Sayfa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Önerilen Temalar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themes.slice(0, books.length >= 10 ? 0 : 10 - books.length).map((item) => (
                <Button
                  key={item.theme}
                  onClick={() => handleGenerateBook(item.theme)}
                  disabled={loading}
                  variant="outline"
                  className="h-auto py-4 px-6 flex flex-col items-center gap-2 hover:bg-primary/20 transition-all"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="font-semibold">{item.title}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-card/50 rounded-xl p-6 border border-border/50">
            <h3 className="text-xl font-semibold mb-4">Kendi Temanı Yaz</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Örn: Uzayda kaybolmuş astronot kediler..."
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomTheme()}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleCustomTheme}
                disabled={loading || !customTheme.trim()}
                className="px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  "Oluştur"
                )}
              </Button>
            </div>
          </div>

          {books.length >= 10 && (
            <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-accent/50">
              <p className="text-center text-sm">
                ⚠️ Maksimum 10 kitap oluşturabilirsiniz. Yeni kitap için önce bir kitabı silin.
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!bookToDelete} onOpenChange={() => setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kitabı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Kitap kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookToDelete && handleDeleteBook(bookToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;
