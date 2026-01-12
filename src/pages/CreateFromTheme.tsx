import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useChildren } from "@/hooks/useChildren";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { BookGenerationProgress } from "@/components/BookGenerationProgress";
import BottomNavigation from "@/components/BottomNavigation";
import { StoryChildSelector } from "@/components/story/StoryChildSelector";
import { StorySettings } from "@/components/story/StorySettings";
import { BackgroundGenerateButton } from "@/components/story/BackgroundGenerateButton";
import { NoCreditsPrompt } from "@/components/subscription/UpgradePrompt";
import { CreditDisplay } from "@/components/subscription/CreditDisplay";
import { cn } from "@/lib/utils";

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
  const { loading, progress, generateBook } = useBooks();
  const { profile } = useProfile();
  const { children, getSelectedChild } = useChildren();
  const { user } = useAuth();
  const { canCreateStory, useCredit, getMaxPages, remainingCredits } = useSubscription();
  const navigate = useNavigate();
  
  const [language, setLanguage] = useState<"tr" | "en">(
    (profile?.preferred_language as "tr" | "en") || "tr"
  );
  const [pageCount, setPageCount] = useState<number>(profile?.preferred_page_count || 5);
  
  // Selected theme state
  const [selectedTheme, setSelectedTheme] = useState<typeof themes[0] | null>(null);

  const handleThemeSelect = (theme: typeof themes[0]) => {
    setSelectedTheme(theme);
  };

  const handleGenerate = async () => {
    if (!selectedTheme) {
      toast.error("Lütfen bir tema seçin");
      return;
    }

    const selectedChild = getSelectedChild();
    if (!selectedChild) {
      toast.error("Lütfen önce bir çocuk seçin veya profil sayfasından çocuk ekleyin");
      return;
    }

    if (!canCreateStory) {
      toast.error("Hikaye krediniz kalmadı. Lütfen paketinizi yükseltin.");
      return;
    }
    
    // Adjust page count based on subscription
    const adjustedPageCount = getMaxPages(pageCount);
    if (adjustedPageCount !== pageCount) {
      toast.info(`Sayfa sayısı paketinize göre ${adjustedPageCount}'e ayarlandı.`);
    }
    
    const aiModel = (profile?.preferred_ai_model as "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview") || "gemini-3-pro-preview";
    const imageModel = (profile?.preferred_image_model as "dall-e-3" | "gpt-image-1" | "gemini-2.5-flash-image" | "gemini-3-pro-image") || "dall-e-3";
    
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
    
    const book = await generateBook(selectedTheme.theme, language, adjustedPageCount, aiModel, profileData, selectedTheme.category, imageModel);
    if (book) {
      await useCredit();
      toast.success("Yeni kitap hazır!");
      setTimeout(() => navigate(`/book/${book.id}`), 1000);
    }
  };

  const getBackgroundInputData = () => {
    if (!selectedTheme || !user) return null;
    
    const selectedChild = getSelectedChild();
    if (!selectedChild) return null;

    const aiModel = (profile?.preferred_ai_model as "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview") || "gemini-3-pro-preview";
    const imageModel = (profile?.preferred_image_model as "dall-e-3" | "gpt-image-1" | "gemini-2.5-flash-image" | "gemini-3-pro-image") || "dall-e-3";
    const adjustedPageCount = getMaxPages(pageCount);

    return {
      theme: selectedTheme.theme,
      language,
      pageCount: adjustedPageCount,
      model: aiModel,
      imageModel,
      category: selectedTheme.category,
      isFromDrawing: false,
      profile: {
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
      },
    };
  };

  const selectedChild = getSelectedChild();
  const backgroundInputData = getBackgroundInputData();

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

        <CreditDisplay />
        
        {!canCreateStory && remainingCredits === 0 && (
          <div className="mt-4">
            <NoCreditsPrompt />
          </div>
        )}

        <StoryChildSelector className="mt-4 mb-4" />
        
        <StorySettings
          language={language}
          onLanguageChange={setLanguage}
          pageCount={pageCount}
          onPageCountChange={setPageCount}
          showCategory={false}
          className="mb-6"
        />

        {/* Theme Selection */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">🎨 Tema Seçin</p>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((item) => {
              const isSelected = selectedTheme?.theme === item.theme;
              return (
                <Button
                  key={item.theme}
                  onClick={() => handleThemeSelect(item)}
                  disabled={loading}
                  variant="outline"
                  className={cn(
                    "h-auto py-4 px-4 flex flex-col items-center gap-2 transition-all rounded-2xl relative",
                    isSelected 
                      ? "ring-2 ring-primary bg-primary/10 border-primary" 
                      : "hover:bg-primary/5"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-4xl">{item.emoji}</span>
                  <span className="font-semibold text-sm text-center">{item.title}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Generate Buttons */}
        {selectedTheme && (
          <div className="space-y-3">
            <Button
              onClick={handleGenerate}
              disabled={loading || !canCreateStory || children.length === 0}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-6 text-lg rounded-2xl"
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

            {backgroundInputData && selectedChild && (
              <BackgroundGenerateButton
                inputData={backgroundInputData}
                childId={selectedChild.id}
                disabled={loading || !canCreateStory || children.length === 0}
                onSuccess={() => setSelectedTheme(null)}
              />
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CreateFromTheme;
