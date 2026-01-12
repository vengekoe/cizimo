import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useChildren } from "@/hooks/useChildren";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ArrowLeft, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { BookGenerationProgress } from "@/components/BookGenerationProgress";
import BottomNavigation from "@/components/BottomNavigation";
import { StoryChildSelector } from "@/components/story/StoryChildSelector";
import { StorySettings } from "@/components/story/StorySettings";

const CreateFromDrawing = () => {
  const { loading, progress, generateBookFromDrawing } = useBooks();
  const { profile } = useProfile();
  const { children, getSelectedChild } = useChildren();
  const navigate = useNavigate();
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [drawingDescription, setDrawingDescription] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [language, setLanguage] = useState<"tr" | "en">(
    (profile?.preferred_language as "tr" | "en") || "tr"
  );
  const [pageCount, setPageCount] = useState<number>(profile?.preferred_page_count || 5);
  const [category, setCategory] = useState<string>("other");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setTimeout(() => {
          setPreviewUrl(URL.createObjectURL(file));
          setIsImageLoading(false);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      toast.error("Lütfen bir çizim yükleyin");
      return;
    }
    
    const selectedChild = getSelectedChild();
    if (!selectedChild) {
      toast.error("Lütfen önce bir çocuk seçin veya profil sayfasından çocuk ekleyin");
      return;
    }
    
    const aiModel = (profile?.preferred_ai_model as "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview") || "gemini-3-pro-preview";
    
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
    
    const book = await generateBookFromDrawing(selectedImage, language, pageCount, aiModel, drawingDescription.trim() || undefined, profileData);
    if (book) {
      setSelectedImage(null);
      setPreviewUrl("");
      setDrawingDescription("");
      toast.success("Çiziminden harika bir hikaye doğdu!");
      setTimeout(() => navigate(`/book/${book.id}`), 1000);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-accent/10">
      <BookGenerationProgress progress={progress} />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🎨 Çizimden Hikaye
            </h1>
            <p className="text-sm text-muted-foreground">
              Çocuğunuzun çizimini yapay zeka ile hikayeye dönüştürün
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
          showAiModel={false}
          className="mb-6"
        />

        {/* Çizim Yükleme */}
        <label htmlFor="drawing-upload" className="block cursor-pointer mb-6">
          <div className={`border-2 border-dashed rounded-2xl hover:border-primary hover:bg-primary/5 transition-all ${
            selectedImage || isImageLoading
              ? "border-primary/30 p-3" 
              : "border-primary/50 p-8"
          }`}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="drawing-upload"
              disabled={loading || isImageLoading}
            />
            {isImageLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Çizim yükleniyor...</p>
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-3 ${selectedImage ? "" : "flex-col gap-4"}`}>
                <div className={`rounded-full bg-primary/10 flex items-center justify-center ${
                  selectedImage ? "w-10 h-10" : "w-20 h-20"
                }`}>
                  <Camera className={selectedImage ? "w-5 h-5 text-primary" : "w-10 h-10 text-primary"} />
                </div>
                <div className={selectedImage ? "" : "text-center"}>
                  <p className={`font-semibold ${selectedImage ? "text-sm" : "text-lg mb-1"}`}>
                    {selectedImage ? "✅ Çizim Yüklendi! (değiştirmek için dokun)" : "Çizim Yükle"}
                  </p>
                  {!selectedImage && (
                    <p className="text-sm text-muted-foreground">
                      Fotoğraf çek veya galeriden seç
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </label>

        {/* Loading skeleton for image preview */}
        {isImageLoading && (
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg mb-6 animate-pulse">
            <div className="p-4 space-y-4">
              <div className="w-full aspect-[4/3] bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-muted-foreground">Çizim hazırlanıyor...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewUrl && !isImageLoading && (
          <div className="bg-card rounded-2xl overflow-hidden border-2 border-primary shadow-lg mb-6 animate-fade-in">
            <div className="p-4 space-y-4">
              <img
                src={previewUrl}
                alt="Yüklenen çizim"
                className="w-full h-auto rounded-xl shadow-md"
              />
              <div className="space-y-2">
                <Label htmlFor="drawing-description" className="text-sm text-muted-foreground">
                  📝 Çizimi anlat (isteğe bağlı)
                </Label>
                <Input
                  id="drawing-description"
                  placeholder="Örn: Bu bir uzay gemisi ve astronot..."
                  value={drawingDescription}
                  onChange={(e) => setDrawingDescription(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
          </div>
        )}

        {selectedImage && (
          <Button
            onClick={handleGenerate}
            disabled={loading || children.length === 0}
            className="w-full bg-gradient-to-r from-accent to-primary text-white py-6 text-lg rounded-2xl"
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

      <BottomNavigation />
    </div>
  );
};

export default CreateFromDrawing;
