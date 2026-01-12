import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  favorite_color: string | null;
  favorite_animal: string | null;
  favorite_team: string | null;
  favorite_toy: string | null;
  favorite_superhero: string | null;
  favorite_cartoon: string | null;
  preferred_ai_model: string | null;
  preferred_language: string | null;
  preferred_page_count: number | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              display_name: user.email?.split("@")[0] || "Kullanıcı",
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile as ProfileData);
        } else {
          throw error;
        }
      } else {
        setProfile(data as ProfileData);
      }
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user || !profile) return false;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast.success("Profil güncellendi!");
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profil güncellenemedi");
      return false;
    }
  };

  return { profile, loading, updateProfile, loadProfile };
};
