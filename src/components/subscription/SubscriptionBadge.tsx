import { useSubscription, TIER_NAMES, TIER_EMOJIS } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles } from "lucide-react";

export const SubscriptionBadge = () => {
  const { subscription, isAdmin, isInTrial, remainingCredits } = useSubscription();

  if (!subscription) return null;

  const tierColors: Record<string, string> = {
    minik_masal: "bg-amber-100 text-amber-800 border-amber-200",
    masal_kesfifcisi: "bg-emerald-100 text-emerald-800 border-emerald-200",
    masal_kahramani: "bg-violet-100 text-violet-800 border-violet-200",
    sonsuz_masal: "bg-gradient-to-r from-pink-500 to-violet-500 text-white border-none",
  };

  if (isAdmin) {
    return (
      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none gap-1">
        <Crown className="h-3 w-3" />
        Admin
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${tierColors[subscription.tier]} gap-1`}>
        <span>{TIER_EMOJIS[subscription.tier]}</span>
        <span className="hidden sm:inline">{TIER_NAMES[subscription.tier].split(" ").slice(1).join(" ")}</span>
      </Badge>
      {isInTrial && (
        <Badge variant="outline" className="text-xs gap-1">
          <Sparkles className="h-3 w-3" />
          Deneme
        </Badge>
      )}
      {remainingCredits !== -1 && (
        <Badge variant="secondary" className="text-xs">
          {remainingCredits} kredi
        </Badge>
      )}
    </div>
  );
};
