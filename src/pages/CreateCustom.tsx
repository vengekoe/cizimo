import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BookGenerationProgress } from "@/components/BookGenerationProgress";
import BottomNavigation from "@/components/BottomNavigation";

const CreateCustom = () => {
  const { books, loading, progress, generateBook } = useBooks();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const [customTheme, setCustomTheme] = useState("");
  const [language, setLanguage] = useState<"tr" | "en">(
    (profile?.preferred_language as "tr" | "en") || "tr"
  );
  const [pageCount, setPageCount] = useState<number>(profile?.preferred_page_count || 10);
  const [aiModel, setAiModel] = useState<"gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview">(
    (profile?.preferred_ai_model as any) || "gemini-3-pro-preview"
  );

  const handleGenerate = async () => {
    if (!customTheme.trim()) {
      toast.error("Lütfen bir tema girin");
      return;
    }
    
    const book = await generateBook(customTheme, language, pageCount, aiModel);
    if (book) {
      setCustomTheme("");
      toast.success("Yeni kitap hazır!");
      setTimeout(() => {
        navigate(`/book/${book.id}`);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-orange-500/10">
      <BookGenerationProgress progress={progress} />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              ✨ Kendi Teman
            </h1>
            <p className="text-sm text-muted-foreground">
              Kendi temanızı yazarak benzersiz bir hikaye oluşturun
            </p>
          </div>
        </div>

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

        {/* Tema Girişi */}
        <div className="bg-card rounded-2xl p-6 border border-border mb-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-base font-semibold">
                📝 Hikaye Teması
              </Label>
              <Textarea
                id="theme"
                placeholder="Örn: Uzayda kaybolmuş astronot kediler, bir gezegende arkadaşlık kuruyorlar ve birlikte Dünya'ya dönmeye çalışıyorlar..."
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                disabled={loading}
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {customTheme.length}/500
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm font-medium mb-2">💡 İpuçları:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Karakterleri detaylı tanımlayın</li>
                <li>• Nerede geçtiğini belirtin</li>
                <li>• Bir sorun veya macera ekleyin</li>
                <li>• Mesaj veya ders içerebilir</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !customTheme.trim() || books.length >= 10}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-6 text-lg rounded-2xl"
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

export default CreateCustom;
