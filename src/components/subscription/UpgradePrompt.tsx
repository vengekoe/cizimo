import { useSubscription, TIER_NAMES } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  feature: string;
  requiredTier?: string;
}

export const UpgradePrompt = ({ feature, requiredTier }: UpgradePromptProps) => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <Lock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Bu özellik mevcut paketinizde yok
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <p className="mb-3">
          <strong>{feature}</strong> özelliğini kullanmak için paketinizi yükseltmeniz gerekiyor.
          {requiredTier && (
            <span> Bu özellik <strong>{requiredTier}</strong> ve üzeri paketlerde mevcuttur.</span>
          )}
        </p>
        <Button
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          onClick={() => navigate("/profile?tab=subscription")}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Paketi Yükselt
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export const NoCreditsPrompt = () => {
  const navigate = useNavigate();
  const { subscription, isInTrial } = useSubscription();

  return (
    <Alert className="border-rose-200 bg-rose-50 dark:bg-rose-950/20">
      <Sparkles className="h-4 w-4 text-rose-600" />
      <AlertTitle className="text-rose-800 dark:text-rose-200">
        Hikaye krediniz kalmadı
      </AlertTitle>
      <AlertDescription className="text-rose-700 dark:text-rose-300">
        <p className="mb-3">
          Bu ay için tüm hikaye kredilerinizi kullandınız. 
          {subscription && (
            <span> Mevcut paketiniz: <strong>{TIER_NAMES[subscription.tier]}</strong></span>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/profile?tab=subscription")}
          >
            Paketleri Gör
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            onClick={() => navigate("/profile?tab=subscription")}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Daha Fazla Kredi Al
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
