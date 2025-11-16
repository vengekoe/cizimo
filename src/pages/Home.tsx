import { useState } from "react";
import { Link } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  const { books, loading, generateBook } = useBooks();
  const [customTheme, setCustomTheme] = useState("");

  const handleGenerateBook = async (theme: string) => {
    const book = await generateBook(theme);
    if (book) {
      toast.success("Yeni kitap hazır! Şimdi okuyabilirsiniz.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Hikaye Kitaplığım 📚
          </h1>
          <p className="text-xl text-muted-foreground">
            Yapay zeka ile benzersiz hikayeler keşfet!
          </p>
        </div>

        {/* Mevcut Kitaplar */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <span>📖</span>
            Kitaplarım ({books.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className="p-8">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    {book.coverEmoji}
                  </div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{book.theme}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {book.pages.length} sayfa
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Yeni Kitap Oluştur */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 border border-border">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Yeni Hikaye Oluştur
          </h2>

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
    </div>
  );
};

export default Home;
