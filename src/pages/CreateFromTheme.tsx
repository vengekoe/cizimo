import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useChildren } from "@/hooks/useChildren";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Baby } from "lucide-react";
import { toast } from "sonner";
import { BookGenerationProgress } from "@/components/BookGenerationProgress";
import BottomNavigation from "@/components/BottomNavigation";
import { Link } from "react-router-dom";

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
  { emoji: "🧙‍♂️", title: "Büyücü Okulu", theme: "Büyü, sihir ve fantastik maceralar" },
  { emoji: "🏴‍☠️", title: "Korsan Hazinesi", theme: "Korsanlar, gemiler ve hazine avı" },
  { emoji: "🦁", title: "Safari Macerası", theme: "Afrika hayvanları ve vahşi doğa" },
];

const CreateFromTheme = () => {
  const { books, loading, progress, generateBook } = useBooks();
  const { profile } = useProfile();
  const { children, selectedChildId, setSelectedChildId, getSelectedChild } = useChildren();
  const navigate = useNavigate();
  
  const [language, setLanguage] = useState<"tr" | "en">(
    (profile?.preferred_language as "tr" | "en") || "tr"
  );
  const [pageCount, setPageCount] = useState<number>(profile?.preferred_page_count || 5);
  const [aiModel, setAiModel] = useState<"gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview">(
    (profile?.preferred_ai_model as any) || "gemini-3-pro-preview"
  );

  const handleSelectTheme = async (theme: string) => {
    const selectedChild = getSelectedChild();
    
    if (!selectedChild) {
      toast.error("Lütfen önce bir çocuk seçin veya profil sayfasından çocuk ekleyin");
      return;
    }
    
    // Build profile data from selected child
    const profileData = {
      childId: selectedChild.id,
      childName: selectedChild.name,
      displayName: selectedChild.name,
      age: selectedChild.age,
      gender: selectedChild.gender,
      favoriteColor: selectedChild.favorite_color,
      favoriteAnimal: selectedChild.favorite_animal,
      favoriteTeam: selectedChild.favorite_team,
      favoriteToy: selectedChild.favorite_toy,
      favoriteSuperhero: selectedChild.favorite_superhero,
      favoriteCartoon: selectedChild.favorite_cartoon,
    };
    
    const book = await generateBook(theme, language, pageCount, aiModel, profileData);
    if (book) {
      toast.success("Yeni kitap hazır!");
      setTimeout(() => {
        navigate(`/book/${book.id}`);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-primary/10">
      <BookGenerationProgress progress={progress} />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🎭 Temadan Hikaye
            </h1>
            <p className="text-sm text-muted-foreground">
              Hazır temalardan birini seçerek hikaye oluşturun
            </p>
          </div>
        </div>

        {/* Çocuk Seçimi */}
        {children.length === 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Baby className="w-6 h-6 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Çocuk profili bulunamadı</p>
                <p className="text-xs text-muted-foreground">Kişiselleştirilmiş hikayeler için çocuk ekleyin</p>
              </div>
              <Link to="/profile">
                <Button size="sm" variant="outline">Ekle</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-4 border border-border mb-4">
            <div className="flex items-center gap-3">
              <Baby className="w-5 h-5 text-primary" />
              <Label className="text-sm font-medium">Hikaye kimin için?</Label>
            </div>
            <Select value={selectedChildId || ""} onValueChange={setSelectedChildId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Çocuk seçin" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    <div className="flex items-center gap-2">
                      <span>{child.avatar_emoji || "👶"}</span>
                      <span>{child.name}</span>
                      {child.age && <span className="text-muted-foreground text-xs">({child.age} yaş)</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ayarlar */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-6">
          <h2 className="font-semibold mb-3">Hikaye Ayarları</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Dil</Label>
              <Select value={language} onValueChange={(v: "tr" | "en") => setLanguage(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sayfa</Label>
              <Select value={pageCount.toString()} onValueChange={(v) => setPageCount(parseInt(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Model</Label>
              <Select value={aiModel} onValueChange={(v: any) => setAiModel(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-3-pro-preview">Gemini 3</SelectItem>
                  <SelectItem value="gpt-5-mini">GPT-5</SelectItem>
                  <SelectItem value="gpt-5.1-mini-preview">GPT-5.1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tema Seçimi */}
        <div className="grid grid-cols-2 gap-3">
          {themes.map((item) => (
            <Button
              key={item.theme}
              onClick={() => handleSelectTheme(item.theme)}
              disabled={loading || books.length >= 10 || children.length === 0}
              variant="outline"
              className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-primary/10 transition-all rounded-2xl"
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <span className="text-4xl">{item.emoji}</span>
              )}
              <span className="font-semibold text-sm text-center">{item.title}</span>
            </Button>
          ))}
        </div>

        {books.length >= 10 && (
          <div className="mt-6 p-4 bg-accent/20 rounded-2xl border border-accent/50">
            <p className="text-center text-sm">
              ⚠️ Maksimum 10 kitap. Yeni kitap için önce bir kitabı silin.
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CreateFromTheme;
