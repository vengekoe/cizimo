import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BookCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sort_order: number;
}

export const useBookCategories = () => {
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("book_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Kategoriler yüklenemedi:", error);
      // Fallback to hardcoded categories
      setCategories([
        { id: "adventure", name: "Macera", emoji: "🏔️", color: "orange", sort_order: 1 },
        { id: "animals", name: "Hayvanlar", emoji: "🐾", color: "green", sort_order: 2 },
        { id: "fantasy", name: "Fantastik", emoji: "🧙", color: "purple", sort_order: 3 },
        { id: "space", name: "Uzay", emoji: "🚀", color: "blue", sort_order: 4 },
        { id: "nature", name: "Doğa", emoji: "🌿", color: "emerald", sort_order: 5 },
        { id: "friendship", name: "Arkadaşlık", emoji: "🤝", color: "pink", sort_order: 6 },
        { id: "family", name: "Aile", emoji: "👨‍👩‍👧", color: "amber", sort_order: 7 },
        { id: "sports", name: "Spor", emoji: "⚽", color: "red", sort_order: 8 },
        { id: "vehicles", name: "Araçlar", emoji: "🚗", color: "cyan", sort_order: 9 },
        { id: "other", name: "Diğer", emoji: "📚", color: "gray", sort_order: 10 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryById = (id: string | undefined | null): BookCategory | null => {
    if (!id) return categories.find((c) => c.id === "other") || null;
    return categories.find((c) => c.id === id) || null;
  };

  const getCategoryColor = (categoryId: string | undefined | null): string => {
    const colorMap: Record<string, string> = {
      orange: "from-orange-500 to-amber-500",
      green: "from-green-500 to-emerald-500",
      purple: "from-purple-500 to-violet-500",
      blue: "from-blue-500 to-cyan-500",
      emerald: "from-emerald-500 to-teal-500",
      pink: "from-pink-500 to-rose-500",
      amber: "from-amber-500 to-yellow-500",
      red: "from-red-500 to-orange-500",
      cyan: "from-cyan-500 to-blue-500",
      gray: "from-gray-500 to-slate-500",
    };
    const category = getCategoryById(categoryId);
    return colorMap[category?.color || "gray"] || colorMap.gray;
  };

  return {
    categories,
    loading,
    getCategoryById,
    getCategoryColor,
    loadCategories,
  };
};
