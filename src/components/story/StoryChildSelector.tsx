import { Link } from "react-router-dom";
import { useChildren } from "@/hooks/useChildren";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Baby } from "lucide-react";

interface StoryChildSelectorProps {
  className?: string;
}

export const StoryChildSelector = ({ className }: StoryChildSelectorProps) => {
  const { children, selectedChildId, setSelectedChildId } = useChildren();

  if (children.length === 0) {
    return (
      <div className={`bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 ${className}`}>
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
    );
  }

  return (
    <div className={`bg-card rounded-2xl p-4 border border-border ${className}`}>
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
  );
};
