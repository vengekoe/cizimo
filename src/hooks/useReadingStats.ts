import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ReadingSession {
  id: string;
  user_id: string;
  child_id: string | null;
  book_id: string;
  pages_read: number;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
}

export interface ChildReadingStats {
  child_id: string;
  child_name: string;
  avatar_emoji: string | null;
  books_read: number;
  total_pages_read: number;
  total_reading_seconds: number;
  total_sessions: number;
}

export const useReadingStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ChildReadingStats[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<{ id: string; startTime: number; pagesRead: number } | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("child_reading_stats")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setStats((data as unknown as ChildReadingStats[]) || []);
    } catch (error) {
      console.error("Stats load error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStats();
    } else {
      setStats([]);
      setLoading(false);
    }
  }, [user, loadStats]);

  const startReadingSession = async (bookId: string, childId: string | null) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("reading_sessions")
        .insert({
          user_id: user.id,
          child_id: childId,
          book_id: bookId,
          pages_read: 0,
          duration_seconds: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      sessionRef.current = {
        id: data.id,
        startTime: Date.now(),
        pagesRead: 0,
      };

      return data.id;
    } catch (error) {
      console.error("Start session error:", error);
      return null;
    }
  };

  const updateReadingSession = async (pagesRead: number) => {
    if (!user || !sessionRef.current) return;

    const elapsed = Math.floor((Date.now() - sessionRef.current.startTime) / 1000);
    sessionRef.current.pagesRead = pagesRead;

    try {
      await supabase
        .from("reading_sessions")
        .update({
          pages_read: pagesRead,
          duration_seconds: elapsed,
        })
        .eq("id", sessionRef.current.id);
    } catch (error) {
      console.error("Update session error:", error);
    }
  };

  const endReadingSession = async () => {
    if (!user || !sessionRef.current) return;

    const elapsed = Math.floor((Date.now() - sessionRef.current.startTime) / 1000);

    try {
      await supabase
        .from("reading_sessions")
        .update({
          pages_read: sessionRef.current.pagesRead,
          duration_seconds: elapsed,
          ended_at: new Date().toISOString(),
        })
        .eq("id", sessionRef.current.id);

      sessionRef.current = null;
      
      // Refresh stats
      await loadStats();
    } catch (error) {
      console.error("End session error:", error);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} saniye`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${mins} dakika`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours} saat ${mins} dk` : `${hours} saat`;
  };

  return {
    stats,
    loading,
    loadStats,
    startReadingSession,
    updateReadingSession,
    endReadingSession,
    formatDuration,
  };
};
