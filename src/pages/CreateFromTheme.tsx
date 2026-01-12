import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useChildren } from "@/hooks/useChildren";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BookGenerationProgress } from "@/components/BookGenerationProgress";
import BottomNavigation from "@/components/BottomNavigation";
import { StoryChildSelector } from "@/components/story/StoryChildSelector";
import { StorySettings } from "@/components/story/StorySettings";

const themes = [
  { emoji: "🌊", title: "Deniz Macerası", theme: "Denizaltı dünyası ve deniz canlıları", category: "adventure" },
  { emoji: "🚀", title: "Uzay Yolculuğu", theme: "Uzay, gezegenler ve yıldızlar", category: "space" },
  { emoji: "🏰", title: "Şato Masalı", theme: "Prenses, şövalye ve ejderhalar", category: "fantasy" },
  { emoji: "🦖", title: "Dinozor Zamanı", theme: "Dinozorlar ve tarih öncesi dönem", category: "animals" },
  { emoji: "🎪", title: "Sirk Şovu", theme: "Sirk sanatçıları ve performanslar", category: "other" },
  { emoji: "🌈", title: "Gökkuşağı Ülkesi", theme: "Renkler ve hayal dünyası", category: "fantasy" },
  { emoji: "🐉", title: "Ejderha Dostluğu", theme: "Ejderhalar ve cesaret", category: "fantasy" },
  { emoji: "🎨", title: "Sanat Atölyesi", theme: "Yaratıcılık ve sanat", category: "other" },
  { emoji: "🌺", title: "Bahçe Maceraları", theme: "Çiçekler, böcekler ve doğa", category: "nature" },
  { emoji: "🧙‍♂️", title: "Büyücü Okulu", theme: "Büyü, sihir ve fantastik maceralar", category: "fantasy" },
  { emoji: "🏴‍☠️", title: "Korsan Hazinesi", theme: "Korsanlar, gemiler ve hazine avı", category: "adventure" },
  { emoji: "🦁", title: "Safari Macerası", theme: "Afrika hayvanları ve vahşi doğa", category: "animals" },
];

const CreateFromTheme = () => {
  const { books, loading, progress, generateBook } = useBooks();
  const { profile } = useProfile();
  const { children, getSelectedChild } = useChildren();
  const navigate = useNavigate();
  
  const [language, setLanguage] = useState<"tr" | "en">(
    (profile?.preferred_language as "tr" | "en") || "tr"
  );
  const [pageCount, setPageCount] = useState<number>(profile?.preferred_page_count || 5);
  const [category, setCategory] = useState<string>("adventure");
  const [aiModel, setAiModel] = useState<"gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview">(
    (profile?.preferred_ai_model as any) || "gemini-3-pro-preview"
  );
  const [imageModel, setImageModel] = useState<"gemini-2.5-flash-image" | "gemini-3-pro-image">(
    ((profile as any)?.preferred_image_model as any) || "gemini-2.5-flash-image"
  );

  const handleSelectTheme = async (theme: string, themeCategory?: string) => {
    const selectedChild = getSelectedChild();
    
    if (!selectedChild) {
      toast.error("Lütfen önce bir çocuk seçin veya profil sayfasından çocuk ekleyin");
      return;
    }
    
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
    
    const book = await generateBook(theme, language, pageCount, aiModel, profileData, themeCategory || category, imageModel);
    if (book) {
      toast.success("Yeni kitap hazır!");
      setTimeout(() => navigate(`/book/${book.id}`), 1000);
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

        <StoryChildSelector className="mb-4" />
        
        <StorySettings
          language={language}
          onLanguageChange={setLanguage}
          pageCount={pageCount}
          onPageCountChange={setPageCount}
          category={category}
          onCategoryChange={setCategory}
          aiModel={aiModel}
          onAiModelChange={setAiModel}
          imageModel={imageModel}
          onImageModelChange={setImageModel}
          showCategory={false}
          className="mb-6"
        />

        <div className="grid grid-cols-2 gap-3">
          {themes.map((item) => (
            <Button
              key={item.theme}
              onClick={() => handleSelectTheme(item.theme, item.category)}
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
