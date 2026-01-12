import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { SubscriptionTier } from "./useSubscription";
import { toast } from "sonner";

export interface AdminUser {
  user_id: string;
  email: string;
  user_created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  tier: SubscriptionTier;
  monthly_credits: number;
  used_credits: number;
  max_pages: number;
  max_children: number;
  trial_ends_at: string | null;
  current_period_end: string;
  children_count: number;
  books_count: number;
  total_reading_seconds: number;
  is_admin: boolean;
}

export interface AdminStatistics {
  total_users: number;
  total_children: number;
  total_books: number;
  total_reading_sessions: number;
  total_reading_hours: number;
  users_by_tier: Record<string, number>;
  new_users_this_month: number;
  books_this_month: number;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ["admin_check", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Get all users (admin only)
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_all_users");
      
      if (error) {
        console.error("Admin get users error:", error);
        throw error;
      }
      
      return data as AdminUser[];
    },
    enabled: isAdmin === true,
  });

  // Get statistics (admin only)
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["admin_statistics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_statistics");
      
      if (error) {
        console.error("Admin get statistics error:", error);
        throw error;
      }
      
      return (data as AdminStatistics[])?.[0] || null;
    },
    enabled: isAdmin === true,
  });

  // Update user subscription
  const updateSubscription = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: SubscriptionTier }) => {
      const { data, error } = await supabase.rpc("admin_update_user_subscription", {
        _target_user_id: userId,
        _tier: tier,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      queryClient.invalidateQueries({ queryKey: ["admin_statistics"] });
      toast.success("Kullanıcı paketi güncellendi");
    },
    onError: (error) => {
      console.error("Update subscription error:", error);
      toast.error("Paket güncellenemedi");
    },
  });

  // Toggle admin role
  const toggleAdminRole = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const { data, error } = await supabase.rpc("admin_toggle_user_role", {
        _target_user_id: userId,
        _make_admin: makeAdmin,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("Kullanıcı rolü güncellendi");
    },
    onError: (error: any) => {
      console.error("Toggle admin error:", error);
      toast.error(error.message || "Rol güncellenemedi");
    },
  });

  // Reset user credits
  const resetCredits = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc("admin_reset_user_credits", {
        _target_user_id: userId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("Kullanıcı kredileri sıfırlandı");
    },
    onError: (error) => {
      console.error("Reset credits error:", error);
      toast.error("Krediler sıfırlanamadı");
    },
  });

  return {
    isAdmin: isAdmin ?? false,
    isAdminLoading,
    users: users ?? [],
    usersLoading,
    statistics,
    statsLoading,
    updateSubscription: updateSubscription.mutateAsync,
    toggleAdminRole: toggleAdminRole.mutateAsync,
    resetCredits: resetCredits.mutateAsync,
    refetchUsers,
  };
};
