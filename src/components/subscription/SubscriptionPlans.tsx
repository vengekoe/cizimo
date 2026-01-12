import { useState } from "react";
import { useSubscription, SubscriptionTier, TIER_NAMES, TIER_EMOJIS } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Sparkles, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SubscriptionPlansProps {
  onSelectPlan?: (tier: SubscriptionTier) => void;
  allowChange?: boolean;
}

export const SubscriptionPlans = ({ onSelectPlan, allowChange = true }: SubscriptionPlansProps) => {
  const { subscription, allFeatures, isInTrial, changeTier, isChangingTier } = useSubscription();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; tier: SubscriptionTier | null; isUpgrade: boolean }>({
    open: false,
    tier: null,
    isUpgrade: true,
  });

  const featureLabels: Record<string, string> = {
    basic_personalization: "Temel kişiselleştirme (ad, yaş)",
    advanced_personalization: "Gelişmiş kişiselleştirme",
    cover_design_selection: "Kapak tasarımı seçimi",
    friend_sharing: "Arkadaşla paylaşma",
    unlimited_friend_sharing: "Sınırsız arkadaş paylaşımı",
    basic_stats: "Basit istatistik",
    detailed_stats: "Detaylı istatistik",
    advanced_stats: "Gelişmiş istatistik",
    photo_story: "Fotoğraftan hikaye",
    audio_story: "Sesli hikaye (AI anlatıcı)",
    font_selection: "Yazı tipi seçimi",
    unlimited_revision: "Sınırsız revizyon",
    favorite_pages: "Favori sayfa işaretleme",
    custom_illustration: "Özel illüstrasyon stili",
    weekly_themes: "Haftalık tema koleksiyonu",
    family_sharing: "Aile içi paylaşım",
    print_ready: "Baskıya hazır tasarım",
    library_backup: "Kütüphane yedekleme",
  };

  const highlightedFeatures = [
    "advanced_personalization",
    "photo_story",
    "audio_story",
    "unlimited_revision",
    "custom_illustration",
  ];

  const tierOrder: SubscriptionTier[] = ["minik_masal", "masal_kesfifcisi", "masal_kahramani", "sonsuz_masal"];

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (onSelectPlan) {
      onSelectPlan(tier);
      return;
    }

    if (!allowChange || !subscription) return;

    const currentIndex = tierOrder.indexOf(subscription.tier);
    const newIndex = tierOrder.indexOf(tier);
    const isUpgrade = newIndex > currentIndex;

    setConfirmDialog({ open: true, tier, isUpgrade });
  };

  const handleConfirmChange = async () => {
    if (!confirmDialog.tier) return;

    try {
      await changeTier(confirmDialog.tier);
      toast.success(
        confirmDialog.isUpgrade 
          ? "Paketiniz yükseltildi! 🎉" 
          : "Paketiniz değiştirildi."
      );
      setConfirmDialog({ open: false, tier: null, isUpgrade: true });
    } catch (error) {
      console.error("Change tier error:", error);
      toast.error("Paket değiştirilemedi. Lütfen tekrar deneyin.");
    }
  };

  const getButtonText = (planTier: SubscriptionTier) => {
    if (!subscription) return "Planı Seç";
    
    const currentIndex = tierOrder.indexOf(subscription.tier);
    const planIndex = tierOrder.indexOf(planTier);
    
    if (planIndex > currentIndex) {
      return (
        <>
          <ArrowUp className="w-4 h-4 mr-1" />
          Yükselt
        </>
      );
    } else {
      return (
        <>
          <ArrowDown className="w-4 h-4 mr-1" />
          Düşür
        </>
      );
    }
  };

  const getButtonVariant = (planTier: SubscriptionTier): "default" | "outline" | "secondary" => {
    if (!subscription) return "outline";
    
    const currentIndex = tierOrder.indexOf(subscription.tier);
    const planIndex = tierOrder.indexOf(planTier);
    const isPremium = planTier === "sonsuz_masal";
    
    if (planIndex > currentIndex) {
      return isPremium ? "default" : "default";
    }
    return "secondary";
  };

  if (!allFeatures) return null;

  const selectedPlanFeatures = confirmDialog.tier 
    ? allFeatures.find(f => f.tier === confirmDialog.tier) 
    : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allFeatures.map((plan) => {
          const isCurrentPlan = subscription?.tier === plan.tier;
          const isPremium = plan.tier === "sonsuz_masal";
          
          return (
            <Card
              key={plan.tier}
              className={cn(
                "relative transition-all",
                isCurrentPlan && "ring-2 ring-primary",
                isPremium && "bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950 dark:to-pink-950"
              )}
            >
              {isCurrentPlan && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  Mevcut Plan
                </Badge>
              )}
              {isPremium && (
                <div className="absolute -top-2 right-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">{TIER_EMOJIS[plan.tier]}</div>
                <CardTitle className="text-lg">
                  {TIER_NAMES[plan.tier].split(" ").slice(1).join(" ")}
                </CardTitle>
                <CardDescription>
                  {plan.tier === "minik_masal" && plan.trial_months > 0 && (
                    <span className="text-emerald-600 font-medium">
                      İlk {plan.trial_months} ay ücretsiz!
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold">{plan.price_tl}</span>
                  <span className="text-muted-foreground"> TL/ay</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>
                      {plan.unlimited_stories 
                        ? "Sınırsız hikaye" 
                        : `Aylık ${plan.monthly_credits} hikaye`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>
                      {plan.unlimited_pages 
                        ? "Sınırsız sayfa" 
                        : `Maksimum ${plan.max_pages} sayfa`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>{plan.max_children} çocuk profili</span>
                  </div>

                  <hr className="my-2" />

                  {Object.entries(featureLabels).map(([key, label]) => {
                    const hasFeature = plan[key as keyof typeof plan];
                    const isHighlighted = highlightedFeatures.includes(key);
                    
                    if (!hasFeature && !isHighlighted) return null;
                    
                    return (
                      <div 
                        key={key} 
                        className={cn(
                          "flex items-center gap-2",
                          !hasFeature && "text-muted-foreground"
                        )}
                      >
                        {hasFeature ? (
                          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-xs">{label}</span>
                      </div>
                    );
                  })}
                </div>

                {allowChange && !isCurrentPlan && (
                  <Button
                    className="w-full"
                    variant={getButtonVariant(plan.tier)}
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={isChangingTier}
                  >
                    {getButtonText(plan.tier)}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.isUpgrade ? (
                <>
                  <ArrowUp className="w-5 h-5 text-emerald-500" />
                  Paketi Yükselt
                </>
              ) : (
                <>
                  <ArrowDown className="w-5 h-5 text-amber-500" />
                  Paketi Değiştir
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.tier && selectedPlanFeatures && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-center gap-4 py-4">
                    <div className="text-center">
                      <div className="text-2xl mb-1">{subscription ? TIER_EMOJIS[subscription.tier] : ""}</div>
                      <p className="text-xs text-muted-foreground">Mevcut</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">→</div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">{TIER_EMOJIS[confirmDialog.tier]}</div>
                      <p className="text-xs font-medium">{TIER_NAMES[confirmDialog.tier]}</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p><strong>Yeni paket özellikleri:</strong></p>
                    <ul className="space-y-1">
                      <li>• {selectedPlanFeatures.unlimited_stories ? "Sınırsız" : selectedPlanFeatures.monthly_credits} hikaye/ay</li>
                      <li>• Maksimum {selectedPlanFeatures.unlimited_pages ? "sınırsız" : selectedPlanFeatures.max_pages} sayfa</li>
                      <li>• {selectedPlanFeatures.max_children} çocuk profili</li>
                    </ul>
                    <p className="text-lg font-bold text-center mt-4">
                      {selectedPlanFeatures.price_tl} TL/ay
                    </p>
                  </div>

                  {!confirmDialog.isUpgrade && (
                    <p className="text-amber-600 text-xs">
                      ⚠️ Paket düşürüldüğünde mevcut özellikleriniz kısıtlanabilir.
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Not: Ödeme entegrasyonu yakında eklenecektir. Şimdilik paket değişikliği anında uygulanır.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, tier: null, isUpgrade: true })}>
              İptal
            </Button>
            <Button 
              onClick={handleConfirmChange} 
              disabled={isChangingTier}
              className={confirmDialog.isUpgrade ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isChangingTier ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                confirmDialog.isUpgrade ? "Yükselt" : "Değiştir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
