import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BookLike {
  id: string;
  book_id: string;
  child_id: string;
  user_id: string;
  created_at: string;
}

export interface BookComment {
  id: string;
  book_id: string;
  child_id: string;
  user_id: string;
  content: string;
  emoji: string;
  created_at: string;
}

export const useBookInteractions = (bookId: string | undefined) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState<BookLike[]>([]);
  const [comments, setComments] = useState<BookComment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && bookId) {
      loadInteractions();
    } else {
      setLikes([]);
      setComments([]);
    }
  }, [user, bookId]);

  const loadInteractions = async () => {
    if (!user || !bookId) return;

    try {
      setLoading(true);

      const [likesRes, commentsRes] = await Promise.all([
        supabase
          .from("book_likes")
          .select("*")
          .eq("book_id", bookId)
          .eq("user_id", user.id),
        supabase
          .from("book_comments")
          .select("*")
          .eq("book_id", bookId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (likesRes.error) throw likesRes.error;
      if (commentsRes.error) throw commentsRes.error;

      setLikes(likesRes.data || []);
      setComments(commentsRes.data || []);
    } catch (error) {
      console.error("Etkileşimler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (childId: string) => {
    if (!user || !bookId) return;

    const existingLike = likes.find(
      (l) => l.book_id === bookId && l.child_id === childId
    );

    try {
      if (existingLike) {
        // Remove like
        const { error } = await supabase
          .from("book_likes")
          .delete()
          .eq("id", existingLike.id);

        if (error) throw error;
        setLikes(likes.filter((l) => l.id !== existingLike.id));
      } else {
        // Add like
        const { data, error } = await supabase
          .from("book_likes")
          .insert({
            book_id: bookId,
            child_id: childId,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        setLikes([...likes, data]);
        toast.success("Kitap beğenildi! ❤️");
      }
    } catch (error) {
      console.error("Beğeni hatası:", error);
      toast.error("Beğeni kaydedilemedi");
    }
  };

  const addComment = async (
    childId: string,
    content: string,
    emoji: string = "😊"
  ) => {
    if (!user || !bookId || !content.trim()) return null;

    try {
      const { data, error } = await supabase
        .from("book_comments")
        .insert({
          book_id: bookId,
          child_id: childId,
          user_id: user.id,
          content: content.trim(),
          emoji,
        })
        .select()
        .single();

      if (error) throw error;
      setComments([data, ...comments]);
      toast.success("Yorum eklendi! 💬");
      return data;
    } catch (error) {
      console.error("Yorum hatası:", error);
      toast.error("Yorum eklenemedi");
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("book_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success("Yorum silindi");
      return true;
    } catch (error) {
      console.error("Yorum silme hatası:", error);
      toast.error("Yorum silinemedi");
      return false;
    }
  };

  const isLikedByChild = (childId: string): boolean => {
    return likes.some((l) => l.child_id === childId);
  };

  const getLikesCount = (): number => {
    return likes.length;
  };

  const getCommentsForChild = (childId: string): BookComment[] => {
    return comments.filter((c) => c.child_id === childId);
  };

  return {
    likes,
    comments,
    loading,
    toggleLike,
    addComment,
    deleteComment,
    isLikedByChild,
    getLikesCount,
    getCommentsForChild,
    loadInteractions,
  };
};
