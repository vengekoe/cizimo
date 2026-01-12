import { useSubscription } from "@/hooks/useSubscription";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Infinity } from "lucide-react";

export const CreditDisplay = () => {
  const { subscription, remainingCredits, isAdmin } = useSubscription();

  if (!subscription) return null;

  const isUnlimited = remainingCredits === -1;
  const totalCredits = subscription.monthly_credits;
  const usedCredits = subscription.used_credits;
  const progressPercent = isUnlimited ? 100 : (remainingCredits / totalCredits) * 100;

  return (
    <div className="bg-card rounded-xl p-4 border border-border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Hikaye Kredisi</span>
        </div>
        <div className="text-sm">
          {isAdmin ? (
            <span className="flex items-center gap-1 text-yellow-600">
              <Infinity className="h-4 w-4" />
              Admin
            </span>
          ) : isUnlimited ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <Infinity className="h-4 w-4" />
              Sınırsız
            </span>
          ) : (
            <span>
              <span className="font-bold text-primary">{remainingCredits}</span>
              <span className="text-muted-foreground"> / {totalCredits}</span>
            </span>
          )}
        </div>
      </div>
      
      {!isUnlimited && !isAdmin && (
        <Progress value={progressPercent} className="h-2" />
      )}
      
      {!isUnlimited && !isAdmin && remainingCredits === 0 && (
        <p className="text-xs text-muted-foreground">
          Bu ay için tüm kredilerinizi kullandınız. Yeni dönemde yenilenecek.
        </p>
      )}
    </div>
  );
};
