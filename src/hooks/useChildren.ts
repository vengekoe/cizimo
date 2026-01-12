import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ChildData {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  favorite_color: string | null;
  favorite_animal: string | null;
  favorite_team: string | null;
  favorite_toy: string | null;
  favorite_superhero: string | null;
  favorite_cartoon: string | null;
  avatar_emoji: string | null;
  created_at: string;
  updated_at: string;
}

export const useChildren = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadChildren();
    } else {
      setChildren([]);
      setSelectedChildId(null);
      setLoading(false);
    }
  }, [user]);

  // Load selected child from localStorage (only for story creation, not for library filtering)
  useEffect(() => {
    const stored = localStorage.getItem('selectedChildId');
    if (stored && children.some(c => c.id === stored)) {
      setSelectedChildId(stored);
    }
    // Don't auto-select first child - let "All Books" be default in library
  }, [children]);

  // Save selected child to localStorage
  useEffect(() => {
    if (selectedChildId) {
      localStorage.setItem('selectedChildId', selectedChildId);
    }
  }, [selectedChildId]);

  const loadChildren = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChildren((data as ChildData[]) || []);
    } catch (error) {
      console.error("Children load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addChild = async (childData: Partial<ChildData>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("children")
        .insert({
          user_id: user.id,
          name: childData.name || "Çocuk",
          age: childData.age,
          gender: childData.gender,
          favorite_color: childData.favorite_color,
          favorite_animal: childData.favorite_animal,
          favorite_team: childData.favorite_team,
          favorite_toy: childData.favorite_toy,
          favorite_superhero: childData.favorite_superhero,
          favorite_cartoon: childData.favorite_cartoon,
          avatar_emoji: childData.avatar_emoji || "👶",
        })
        .select()
        .single();

      if (error) throw error;
      
      const newChild = data as ChildData;
      setChildren([...children, newChild]);
      
      // Select the new child if it's the first one
      if (children.length === 0) {
        setSelectedChildId(newChild.id);
      }
      
      toast.success("Çocuk eklendi!");
      return newChild;
    } catch (error) {
      console.error("Add child error:", error);
      toast.error("Çocuk eklenemedi");
      return null;
    }
  };

  const updateChild = async (childId: string, updates: Partial<ChildData>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("children")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", childId)
        .eq("user_id", user.id);

      if (error) throw error;

      setChildren(children.map(c => 
        c.id === childId ? { ...c, ...updates } : c
      ));
      toast.success("Çocuk bilgileri güncellendi!");
      return true;
    } catch (error) {
      console.error("Update child error:", error);
      toast.error("Güncelleme başarısız");
      return false;
    }
  };

  const deleteChild = async (childId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", childId)
        .eq("user_id", user.id);

      if (error) throw error;

      const updatedChildren = children.filter(c => c.id !== childId);
      setChildren(updatedChildren);
      
      // If deleted child was selected, select another
      if (selectedChildId === childId) {
        setSelectedChildId(updatedChildren[0]?.id || null);
      }
      
      toast.success("Çocuk silindi");
      return true;
    } catch (error) {
      console.error("Delete child error:", error);
      toast.error("Silme başarısız");
      return false;
    }
  };

  const getSelectedChild = () => {
    return children.find(c => c.id === selectedChildId) || null;
  };

  const getChildById = (childId: string | undefined | null) => {
    if (!childId) return null;
    return children.find(c => c.id === childId) || null;
  };

  return {
    children,
    loading,
    selectedChildId,
    setSelectedChildId,
    getSelectedChild,
    getChildById,
    addChild,
    updateChild,
    deleteChild,
    loadChildren,
  };
};
