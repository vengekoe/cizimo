import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookCategories } from "@/hooks/useBookCategories";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
  const { currentFeatures, isAdmin, getMaxPages } = useSubscription();

  // Get max pages allowed by subscription
  const maxAllowedPages = isAdmin ? 20 : (currentFeatures?.unlimited_pages ? 20 : (currentFeatures?.max_pages ?? 5));
  
  // Available page options based on subscription
  const pageOptions = [5, 10, 15, 20].filter(p => p <= maxAllowedPages);
  
  // If current pageCount exceeds max, update it
  const effectivePageCount = Math.min(pageCount, maxAllowedPages);

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
          <Select 
            value={effectivePageCount.toString()} 
            onValueChange={(v) => onPageCountChange(parseInt(v))}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageOptions.map((p) => (
                <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
              ))}
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
      {!isAdmin && maxAllowedPages < 20 && (
        <Alert className="mt-3 py-2 bg-muted/50 border-muted">
          <Info className="h-3 w-3" />
          <AlertDescription className="text-xs">
            Paketiniz maksimum {maxAllowedPages} sayfa destekliyor. Daha fazla sayfa için paketinizi yükseltin.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
