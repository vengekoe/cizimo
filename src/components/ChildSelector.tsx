import { useChildren } from "@/hooks/useChildren";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Baby } from "lucide-react";

interface ChildSelectorProps {
  onChildChange?: (childId: string) => void;
  className?: string;
}

export const ChildSelector = ({ onChildChange, className }: ChildSelectorProps) => {
  const { children, selectedChildId, setSelectedChildId, loading } = useChildren();

  if (loading || children.length === 0) {
    return null;
  }

  const handleChange = (value: string) => {
    setSelectedChildId(value);
    onChildChange?.(value);
  };

  return (
    <Select value={selectedChildId || undefined} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Baby className="w-4 h-4 text-primary" />
          <SelectValue placeholder="Çocuk seçin" />
        </div>
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
  );
};
