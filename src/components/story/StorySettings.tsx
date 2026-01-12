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
  showCategory = true,
  className,
}: StorySettingsProps) => {
  const { categories } = useBookCategories();

  return (
    <div className={`bg-card rounded-2xl p-4 border border-border ${className}`}>
      <h2 className="font-semibold mb-3">Hikaye Ayarları</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
      </div>
    </div>
  );
};
