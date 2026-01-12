import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Users, Mail, MessageCircle, Link2, Copy, Check, Send } from "lucide-react";
import { useChildren } from "@/hooks/useChildren";
import { useBookShares } from "@/hooks/useBookShares";
import { toast } from "sonner";

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
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Filter out the owner child - can't share with self
  const shareableChildren = children.filter((c) => c.id !== ownerChildId);

  // Generate shareable link
  const shareUrl = `${window.location.origin}/book/${bookId}`;
  const shareMessage = `"${bookTitle}" hikayesine göz at! 📚✨`;

  useEffect(() => {
    if (open) {
      setSelectedChildIds(getSharedChildIds(bookId));
      setCopied(false);
      setEmail("");
    }
  }, [open, bookId]);

  const handleToggleChild = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const handleSaveChildren = async () => {
    setSaving(true);
    await shareBook(bookId, selectedChildIds);
    setSaving(false);
    toast.success("Paylaşım ayarları kaydedildi!");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link kopyalandı!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Link kopyalanamadı");
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareMessage}\n${shareUrl}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailShare = () => {
    if (!email.trim()) {
      toast.error("Lütfen e-posta adresi girin");
      return;
    }
    
    const subject = encodeURIComponent(`${bookTitle} - Hikaye Paylaşımı 📚`);
    const body = encodeURIComponent(`Merhaba!\n\n${shareMessage}\n\nHikayeyi görüntülemek için:\n${shareUrl}\n\nKeyifli okumalar! 🌟`);
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    toast.success("E-posta uygulaması açılıyor...");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Kitap Paylaş
          </DialogTitle>
          <DialogDescription>
            "{bookTitle}" kitabını paylaşın.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link" className="text-xs">
              <Link2 className="w-3.5 h-3.5 mr-1" />
              Link
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs">
              <MessageCircle className="w-3.5 h-3.5 mr-1" />
              Mesaj
            </TabsTrigger>
            <TabsTrigger value="children" className="text-xs">
              <Users className="w-3.5 h-3.5 mr-1" />
              Çocuklar
            </TabsTrigger>
          </TabsList>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm">Paylaşım Linki</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-xs bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">E-posta ile Gönder</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEmailShare}
                  disabled={!email.trim()}
                  className="shrink-0"
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-3 mt-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleWhatsAppShare}
            >
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Kişi veya gruba gönder</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleCopyLink}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium">Link Kopyala</p>
                <p className="text-xs text-muted-foreground">Herhangi bir yere yapıştır</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                const mailtoUrl = `mailto:?subject=${encodeURIComponent(`${bookTitle} - Hikaye 📚`)}&body=${encodeURIComponent(`${shareMessage}\n\n${shareUrl}`)}`;
                window.location.href = mailtoUrl;
              }}
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium">E-posta</p>
                <p className="text-xs text-muted-foreground">E-posta ile paylaş</p>
              </div>
            </Button>
          </TabsContent>

          {/* Children Tab */}
          <TabsContent value="children" className="mt-4">
            {shareableChildren.length === 0 ? (
              <div className="py-6 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Paylaşmak için başka çocuk profili ekleyin.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {shareableChildren.map((child) => (
                    <label
                      key={child.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedChildIds.includes(child.id)}
                        onCheckedChange={() => handleToggleChild(child.id)}
                      />
                      <span className="text-xl">{child.avatar_emoji || "👶"}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{child.name}</p>
                        {child.age && (
                          <p className="text-xs text-muted-foreground">
                            {child.age} yaşında
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <Button
                  onClick={handleSaveChildren}
                  disabled={saving}
                  className="w-full mt-4"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
