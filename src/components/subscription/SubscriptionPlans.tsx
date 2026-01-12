import { useSubscription, SubscriptionTier, TIER_NAMES, TIER_EMOJIS } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionPlansProps {
  onSelectPlan?: (tier: SubscriptionTier) => void;
}

export const SubscriptionPlans = ({ onSelectPlan }: SubscriptionPlansProps) => {
  const { subscription, allFeatures, isInTrial } = useSubscription();

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

  if (!allFeatures) return null;

  return (
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

              {onSelectPlan && !isCurrentPlan && (
                <Button
                  className="w-full"
                  variant={isPremium ? "default" : "outline"}
                  onClick={() => onSelectPlan(plan.tier)}
                >
                  {isPremium ? "Premium'a Geç" : "Planı Seç"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
