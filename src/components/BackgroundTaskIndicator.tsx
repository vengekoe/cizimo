import { useState } from "react";
import { useBackgroundTasks } from "@/hooks/useBackgroundTasks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, X, BookOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  analyzing: "Analiz ediliyor",
  generating_story: "Hikaye yazılıyor",
  generating_images: "Görseller oluşturuluyor",
};

const statusEmojis: Record<string, string> = {
  pending: "⏳",
  analyzing: "🔍",
  generating_story: "✍️",
  generating_images: "🎨",
};

export function BackgroundTaskIndicator() {
  const { activeTasks, cancelTask } = useBackgroundTasks();
  const [open, setOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [taskToCancel, setTaskToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  if (activeTasks.length === 0) return null;

  const handleCancelClick = (taskId: string) => {
    setTaskToCancel(taskId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!taskToCancel) return;
    
    setIsCancelling(true);
    try {
      await cancelTask(taskToCancel);
      toast.success("Görev iptal edildi", {
        description: "Hikaye oluşturma işlemi durduruldu.",
      });
    } catch (error) {
      toast.error("İptal edilemedi", {
        description: "Lütfen tekrar deneyin.",
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setTaskToCancel(null);
    }
  };

  const handleCancelAll = async () => {
    setIsCancelling(true);
    try {
      await Promise.all(activeTasks.map(task => cancelTask(task.id)));
      toast.success("Tüm görevler iptal edildi");
      setOpen(false);
    } catch (error) {
      toast.error("Bazı görevler iptal edilemedi");
    } finally {
      setIsCancelling(false);
    }
  };

  const getTaskTitle = (task: any) => {
    if (task.input_data?.theme) {
      return task.input_data.theme.slice(0, 30) + (task.input_data.theme.length > 30 ? "..." : "");
    }
    if (task.input_data?.imageBase64) {
      return "Çizimden hikaye";
    }
    return "Yeni Hikaye";
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "fixed bottom-20 right-4 z-50 gap-2 shadow-lg",
              "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
              "hover:from-purple-600 hover:to-pink-600",
              "animate-pulse"
            )}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{activeTasks.length} hikaye oluşturuluyor</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end" side="top">
          <div className="p-3 border-b flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Arka Planda Çalışan İşler
            </h4>
            {activeTasks.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleCancelAll}
                disabled={isCancelling}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Tümünü İptal
              </Button>
            )}
          </div>
          <div className="max-h-64 overflow-auto">
            {activeTasks.map((task) => (
              <div key={task.id} className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      <span>{statusEmojis[task.status] || "📚"}</span>
                      {getTaskTitle(task)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {statusLabels[task.status] || task.status}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleCancelClick(task.id)}
                    title="Görevi iptal et"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Progress value={task.progress_percent} className="h-1.5" />
                {task.progress_message && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {task.progress_message}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="p-2 border-t bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              Hazır olduğunda bildirim alacaksınız
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Görevi İptal Et</AlertDialogTitle>
            <AlertDialogDescription>
              Bu hikaye oluşturma işlemini iptal etmek istediğinizden emin misiniz? 
              İptal edilen işlem geri alınamaz ve hikaye kaybolur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  İptal ediliyor...
                </>
              ) : (
                "Evet, İptal Et"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
