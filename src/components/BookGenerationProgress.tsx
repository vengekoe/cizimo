import { useState, useEffect, useMemo } from "react";
import { GenerationProgress } from "@/hooks/useBooks";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Image, Save, CheckCircle, Clock, Minimize2 } from "lucide-react";

interface BookGenerationProgressProps {
  progress: GenerationProgress;
  onMoveToBackground?: () => void;
}

const stageIcons = {
  story: FileText,
  cover: Image,
  images: Image,
  saving: Save,
  complete: CheckCircle,
  retrying: Loader2,
};

const stageColors = {
  story: "text-blue-500",
  cover: "text-purple-500",
  images: "text-pink-500",
  saving: "text-orange-500",
  complete: "text-green-500",
  retrying: "text-amber-500",
};

// Estimated time for each stage (in seconds)
const stageDurations: Record<string, number> = {
  story: 30,      // 30 seconds for story generation
  cover: 20,      // 20 seconds for cover
  images: 120,    // 2 minutes for images (5 pages × ~24 sec each)
  saving: 5,      // 5 seconds for saving
};

export const BookGenerationProgress = ({ progress, onMoveToBackground }: BookGenerationProgressProps) => {
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!progress.stage || progress.stage === 'complete') return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.stage, startTime]);

  // Calculate estimated remaining time
  const estimatedRemaining = useMemo(() => {
    if (!progress.stage || progress.stage === 'complete') return 0;
    
    // Total estimated time based on all stages
    const totalEstimated = Object.values(stageDurations).reduce((a, b) => a + b, 0);
    
    // Calculate remaining based on percentage
    const percentageRemaining = 100 - progress.percentage;
    const remainingSeconds = Math.ceil((totalEstimated * percentageRemaining) / 100);
    
    // Ensure minimum of 10 seconds to avoid showing "0 saniye"
    return Math.max(remainingSeconds, progress.percentage < 95 ? 10 : 0);
  }, [progress.percentage, progress.stage]);

  // Format time as minutes:seconds
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Birazdan...";
    if (seconds < 60) return `~${seconds} saniye`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `~${minutes} dk ${secs} sn` : `~${minutes} dk`;
  };

  if (!progress.stage) return null;

  const Icon = progress.stage ? stageIcons[progress.stage] : Loader2;
  const color = progress.stage ? stageColors[progress.stage] : "text-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-5">
          <div className={`${color} transition-colors`}>
            {progress.stage === 'complete' ? (
              <Icon className="w-14 h-14" />
            ) : (
              <Loader2 className="w-14 h-14 animate-spin" />
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

          {/* Estimated time remaining */}
          {progress.stage !== 'complete' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Tahmini kalan süre: {formatTime(estimatedRemaining)}</span>
            </div>
          )}

          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Harika bir hikaye hazırlanıyor...
            </p>
            <p className="text-xs text-muted-foreground">
              Bu işlem biraz zaman alabilir
            </p>
          </div>

          {/* Move to background button */}
          {progress.stage !== 'complete' && onMoveToBackground && (
            <Button
              onClick={onMoveToBackground}
              variant="outline"
              className="w-full mt-2 gap-2"
            >
              <Minimize2 className="w-4 h-4" />
              Arka Planda Çalıştır
            </Button>
          )}
          
          {progress.stage !== 'complete' && onMoveToBackground && (
            <p className="text-xs text-center text-muted-foreground px-4">
              Arka planda çalıştırarak diğer işlerinize devam edebilirsiniz. 
              Hikaye hazır olduğunda size bildirim göndereceğiz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
