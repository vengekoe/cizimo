import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Users } from "lucide-react";
import { useChildren } from "@/hooks/useChildren";
import { useBookShares } from "@/hooks/useBookShares";

interface BookShareDialogProps {
  bookId: string;
  bookTitle: string;
  ownerChildId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookShareDialog = ({
  bookId,
  bookTitle,
  ownerChildId,
  open,
  onOpenChange,
}: BookShareDialogProps) => {
  const { children } = useChildren();
  const { shareBook, getSharedChildIds } = useBookShares();
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Filter out the owner child - can't share with self
  const shareableChildren = children.filter((c) => c.id !== ownerChildId);

  useEffect(() => {
    if (open) {
      setSelectedChildIds(getSharedChildIds(bookId));
    }
  }, [open, bookId]);

  const handleToggleChild = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await shareBook(bookId, selectedChildIds);
    setSaving(false);
    onOpenChange(false);
  };

  if (shareableChildren.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Kitap Paylaş
            </DialogTitle>
            <DialogDescription>
              Paylaşmak için başka çocuk profili eklemeniz gerekiyor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Profil sayfasından yeni çocuk ekleyebilirsiniz.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Kitap Paylaş
          </DialogTitle>
          <DialogDescription>
            "{bookTitle}" kitabını diğer çocuklarla paylaşın.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {shareableChildren.map((child) => (
            <label
              key={child.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedChildIds.includes(child.id)}
                onCheckedChange={() => handleToggleChild(child.id)}
              />
              <span className="text-2xl">{child.avatar_emoji || "👶"}</span>
              <div className="flex-1">
                <p className="font-medium">{child.name}</p>
                {child.age && (
                  <p className="text-xs text-muted-foreground">
                    {child.age} yaşında
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
