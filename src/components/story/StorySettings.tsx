import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookCategories } from "@/hooks/useBookCategories";

interface StorySettingsProps {
  language: "tr" | "en";
  onLanguageChange: (value: "tr" | "en") => void;
  pageCount: number;
  onPageCountChange: (value: number) => void;
  category?: string;
  onCategoryChange?: (value: string) => void;
  aiModel?: "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview";
  onAiModelChange?: (value: "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview") => void;
  showAiModel?: boolean;
  showCategory?: boolean;
  className?: string;
}

export const StorySettings = ({
  language,
  onLanguageChange,
  pageCount,
  onPageCountChange,
  category = "other",
  onCategoryChange,
  aiModel,
  onAiModelChange,
  showAiModel = true,
  showCategory = true,
  className,
}: StorySettingsProps) => {
  const { categories, getCategoryColor } = useBookCategories();

  const colCount = 2 + (showAiModel ? 1 : 0) + (showCategory ? 1 : 0);

  return (
    <div className={`bg-card rounded-2xl p-4 border border-border ${className}`}>
      <h2 className="font-semibold mb-3">Hikaye Ayarları</h2>
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(colCount, 4)}, 1fr)` }}>
        <div className="space-y-1">
          <Label className="text-xs">Dil</Label>
          <Select value={language} onValueChange={(v: "tr" | "en") => onLanguageChange(v)}>
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
          <Select value={pageCount.toString()} onValueChange={(v) => onPageCountChange(parseInt(v))}>
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
        {showCategory && onCategoryChange && (
          <div className="space-y-1">
            <Label className="text-xs">Kategori</Label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {showAiModel && aiModel && onAiModelChange && (
          <div className="space-y-1">
            <Label className="text-xs">Model</Label>
            <Select value={aiModel} onValueChange={(v: any) => onAiModelChange(v)}>
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
        )}
      </div>
    </div>
  );
};
