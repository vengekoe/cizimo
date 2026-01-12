import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface BackgroundTask {
  id: string;
  user_id: string;
  child_id: string | null;
  status: "pending" | "analyzing" | "generating_story" | "generating_images" | "completed" | "failed";
  progress_message: string | null;
  progress_percent: number;
  book_id: string | null;
  error_message: string | null;
  input_data: any;
  created_at: string;
  updated_at: string;
}

export function useBackgroundTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTasks, setActiveTasks] = useState<BackgroundTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("book_generation_tasks")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["pending", "analyzing", "generating_story", "generating_images"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }

    setActiveTasks((data || []) as BackgroundTask[]);
    setLoading(false);
  }, [user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    fetchTasks();

    const channel = supabase
      .channel("book_generation_tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "book_generation_tasks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const task = payload.new as BackgroundTask;
          
          if (payload.eventType === "INSERT") {
            setActiveTasks((prev) => [task, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setActiveTasks((prev) =>
              prev.map((t) => (t.id === task.id ? task : t))
            );

            // Show notification when task completes
            if (task.status === "completed" && task.book_id) {
              toast.success("📚 Hikaye hazır!", {
                description: "Kitabınız oluşturuldu! Okumak için tıklayın.",
                duration: 10000,
                action: {
                  label: "Aç",
                  onClick: () => navigate(`/book/${task.book_id}`),
                },
              });
              // Remove from active tasks
              setActiveTasks((prev) => prev.filter((t) => t.id !== task.id));
            } else if (task.status === "failed") {
              toast.error("Hikaye oluşturulamadı", {
                description: task.error_message || "Bir hata oluştu.",
                duration: 8000,
              });
              // Remove from active tasks
              setActiveTasks((prev) => prev.filter((t) => t.id !== task.id));
            }
          } else if (payload.eventType === "DELETE") {
            setActiveTasks((prev) => prev.filter((t) => t.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTasks, navigate]);

  // Create a new background task
  const createTask = useCallback(
    async (inputData: any, childId?: string) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("book_generation_tasks")
        .insert({
          user_id: user.id,
          child_id: childId || null,
          input_data: inputData,
          status: "pending",
          progress_message: "Başlatılıyor...",
          progress_percent: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating task:", error);
        toast.error("Görev oluşturulamadı");
        return null;
      }

      return data as BackgroundTask;
    },
    [user]
  );

  // Cancel a task
  const cancelTask = useCallback(async (taskId: string) => {
    const { error } = await supabase
      .from("book_generation_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("Error cancelling task:", error);
      toast.error("Görev iptal edilemedi");
    }
  }, []);

  return {
    activeTasks,
    loading,
    createTask,
    cancelTask,
    refetch: fetchTasks,
  };
}
