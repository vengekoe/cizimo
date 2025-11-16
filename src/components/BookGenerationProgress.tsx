import { GenerationProgress } from "@/hooks/useBooks";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, Image, Save, CheckCircle } from "lucide-react";

interface BookGenerationProgressProps {
  progress: GenerationProgress;
}

const stageIcons = {
  story: FileText,
  cover: Image,
  images: Image,
  saving: Save,
  complete: CheckCircle,
};

const stageColors = {
  story: "text-blue-500",
  cover: "text-purple-500",
  images: "text-pink-500",
  saving: "text-orange-500",
  complete: "text-green-500",
};

export const BookGenerationProgress = ({ progress }: BookGenerationProgressProps) => {
  if (!progress.stage) return null;

  const Icon = progress.stage ? stageIcons[progress.stage] : Loader2;
  const color = progress.stage ? stageColors[progress.stage] : "text-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
        <div className="flex flex-col items-center space-y-6">
          <div className={`${color} transition-colors`}>
            {progress.stage === 'complete' ? (
              <Icon className="w-16 h-16" />
            ) : (
              <Loader2 className="w-16 h-16 animate-spin" />
            )}
          </div>
          
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-foreground">
                {progress.message}
              </p>
              <span className="text-sm text-muted-foreground font-medium">
                {progress.percentage}%
              </span>
            </div>
            
            <Progress value={progress.percentage} className="h-2" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Harika bir hikaye hazırlanıyor...
            </p>
            <p className="text-xs text-muted-foreground">
              Bu işlem biraz zaman alabilir
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
