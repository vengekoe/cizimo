import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BookShare {
  id: string;
  book_id: string;
  child_id: string;
  shared_by: string;
  created_at: string;
}

export const useBookShares = () => {
  const { user } = useAuth();
  const [shares, setShares] = useState<BookShare[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadShares();
    } else {
      setShares([]);
    }
  }, [user]);

  const loadShares = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("book_shares")
        .select("*")
        .eq("shared_by", user.id);

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error("Paylaşımlar yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const shareBook = async (bookId: string, childIds: string[]) => {
    if (!user) return;

    try {
      // Get existing shares for this book
      const existingShares = shares.filter((s) => s.book_id === bookId);
      const existingChildIds = existingShares.map((s) => s.child_id);

      // Remove shares that are no longer selected
      const toRemove = existingShares.filter(
        (s) => !childIds.includes(s.child_id)
      );
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("book_shares")
          .delete()
          .in(
            "id",
            toRemove.map((s) => s.id)
          );
        if (deleteError) throw deleteError;
      }

      // Add new shares
      const toAdd = childIds.filter((id) => !existingChildIds.includes(id));
      if (toAdd.length > 0) {
        const newShares = toAdd.map((childId) => ({
          book_id: bookId,
          child_id: childId,
          shared_by: user.id,
        }));

        const { error: insertError } = await supabase
          .from("book_shares")
          .insert(newShares);
        if (insertError) throw insertError;
      }

      await loadShares();
      toast.success("Kitap paylaşımları güncellendi!");
    } catch (error) {
      console.error("Paylaşım hatası:", error);
      toast.error("Paylaşım güncellenemedi.");
    }
  };

  const getSharedChildIds = (bookId: string): string[] => {
    return shares.filter((s) => s.book_id === bookId).map((s) => s.child_id);
  };

  const isBookSharedWith = (bookId: string, childId: string): boolean => {
    return shares.some((s) => s.book_id === bookId && s.child_id === childId);
  };

  const getSharedBooksForChild = (childId: string): string[] => {
    return shares.filter((s) => s.child_id === childId).map((s) => s.book_id);
  };

  return {
    shares,
    loading,
    shareBook,
    getSharedChildIds,
    isBookSharedWith,
    getSharedBooksForChild,
    loadShares,
  };
};
