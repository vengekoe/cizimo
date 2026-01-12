import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBackgroundTasks } from "@/hooks/useBackgroundTasks";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface BackgroundTaskInput {
  // Common fields
  userId: string;
  language: string;
  pageCount: number;
  model: string;
  imageModel: string;
  category: string;
  profile: {
    childId: string;
    childName: string;
    displayName: string;
    age: number | null;
    gender: string | null;
    favoriteColor: string | null;
    favoriteAnimal: string | null;
    favoriteTeam: string | null;
    favoriteToy: string | null;
    favoriteSuperhero: string | null;
    favoriteCartoon: string | null;
  };
  // For theme-based generation
  theme?: string;
  // For drawing-based generation
  imageBase64?: string;
  userDescription?: string;
  isFromDrawing?: boolean;
}

interface BackgroundGenerateButtonProps {
  inputData: Omit<BackgroundTaskInput, "userId">;
  childId: string;
  disabled?: boolean;
  onSuccess?: () => void;
  className?: string;
}

export const BackgroundGenerateButton = ({
  inputData,
  childId,
  disabled = false,
  onSuccess,
  className = "",
}: BackgroundGenerateButtonProps) => {
  const { user } = useAuth();
  const { createTask } = useBackgroundTasks();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleGenerateBackground = async () => {
    if (!user) {
      toast.error("Lütfen giriş yapın");
      return;
    }

    setIsStarting(true);

    try {
      const fullInputData: BackgroundTaskInput = {
        ...inputData,
        userId: user.id,
      };

      // Create background task
      const task = await createTask(fullInputData, childId);

      if (task) {
        // Start processing in background (fire and forget)
        supabase.functions
          .invoke("process-background-task", {
            body: { taskId: task.id },
          })
          .catch(console.error);

        toast.success("🎨 Hikaye arka planda oluşturuluyor!", {
          description: "Hazır olduğunda sizi bilgilendireceğiz.",
          duration: 5000,
        });

        onSuccess?.();
        navigate("/home");
      }
    } catch (error) {
      console.error("Background task error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleGenerateBackground}
        disabled={disabled || isStarting}
        variant="outline"
        className="w-full py-5 text-base rounded-2xl border-2 border-dashed"
      >
        {isStarting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Başlatılıyor...
          </>
        ) : (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Arka Planda Oluştur
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground mt-2">
        Arka planda oluştur: Sayfayı kapatın, hazır olunca bildirim alın
      </p>
    </div>
  );
};
