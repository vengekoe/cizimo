import { useState } from "react";
import { useBackgroundTasks } from "@/hooks/useBackgroundTasks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  analyzing: "Çizim analiz ediliyor",
  generating_story: "Hikaye yazılıyor",
  generating_images: "Görseller oluşturuluyor",
};

export function BackgroundTaskIndicator() {
  const { activeTasks, cancelTask } = useBackgroundTasks();
  const [open, setOpen] = useState(false);

  if (activeTasks.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "fixed bottom-20 right-4 z-50 gap-2 shadow-lg",
            "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
            "hover:from-purple-600 hover:to-pink-600"
          )}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{activeTasks.length} hikaye oluşturuluyor</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="top">
        <div className="p-3 border-b">
          <h4 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Arka Planda Çalışan İşler
          </h4>
        </div>
        <div className="max-h-64 overflow-auto">
          {activeTasks.map((task) => (
            <div key={task.id} className="p-3 border-b last:border-b-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {task.input_data?.description || "Yeni Hikaye"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {statusLabels[task.status] || task.status}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => cancelTask(task.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <Progress value={task.progress_percent} className="h-1.5" />
              {task.progress_message && (
                <p className="text-xs text-muted-foreground mt-1">
                  {task.progress_message}
                </p>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
