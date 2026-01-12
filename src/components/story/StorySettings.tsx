import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StorySettingsProps {
  language: "tr" | "en";
  onLanguageChange: (value: "tr" | "en") => void;
  pageCount: number;
  onPageCountChange: (value: number) => void;
  aiModel?: "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview";
  onAiModelChange?: (value: "gemini-3-pro-preview" | "gpt-5-mini" | "gpt-5.1-mini-preview") => void;
  showAiModel?: boolean;
  className?: string;
}

export const StorySettings = ({
  language,
  onLanguageChange,
  pageCount,
  onPageCountChange,
  aiModel,
  onAiModelChange,
  showAiModel = true,
  className,
}: StorySettingsProps) => {
  return (
    <div className={`bg-card rounded-2xl p-4 border border-border ${className}`}>
      <h2 className="font-semibold mb-3">Hikaye Ayarları</h2>
      <div className={`grid gap-3 ${showAiModel ? "grid-cols-3" : "grid-cols-2"}`}>
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
