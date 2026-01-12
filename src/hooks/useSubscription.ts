import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SubscriptionTier = "minik_masal" | "masal_kesfifcisi" | "masal_kahramani" | "sonsuz_masal";

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  monthly_credits: number;
  used_credits: number;
  max_pages: number;
  max_children: number;
  price_tl: number;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFeatures {
  tier: SubscriptionTier;
  monthly_credits: number;
  max_pages: number;
  max_children: number;
  price_tl: number;
  basic_personalization: boolean;
  advanced_personalization: boolean;
  cover_design_selection: boolean;
  friend_sharing: boolean;
  unlimited_friend_sharing: boolean;
  basic_stats: boolean;
  detailed_stats: boolean;
  advanced_stats: boolean;
  photo_story: boolean;
  audio_story: boolean;
  font_selection: boolean;
  unlimited_revision: boolean;
  favorite_pages: boolean;
  custom_illustration: boolean;
  weekly_themes: boolean;
  family_sharing: boolean;
  print_ready: boolean;
  library_backup: boolean;
  unlimited_stories: boolean;
  unlimited_pages: boolean;
  trial_months: number;
}

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  minik_masal: "🐣 Minik Masal",
  masal_kesfifcisi: "🐿️ Masal Keşifçisi",
  masal_kahramani: "🦄 Masal Kahramanı",
  sonsuz_masal: "🐉 Sonsuz Masal Dünyası",
};

export const TIER_EMOJIS: Record<SubscriptionTier, string> = {
  minik_masal: "🐣",
  masal_kesfifcisi: "🐿️",
  masal_kahramani: "🦄",
  sonsuz_masal: "🐉",
};

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
  });

  // Fetch all subscription features
  const { data: allFeatures } = useQuery({
    queryKey: ["subscription_features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_features")
        .select("*")
        .order("price_tl", { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionFeatures[];
    },
  });

  // Get current tier features
  const currentFeatures = allFeatures?.find(f => f.tier === subscription?.tier);

  // Check if user is admin
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Use a SECURITY DEFINER DB function so we don't rely on direct table SELECTs (RLS-safe)
      const { data, error } = await supabase.rpc("is_admin", {
        _user_id: user.id,
      });

      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Calculate remaining credits
  const remainingCredits = (() => {
    if (isAdmin) return -1; // unlimited
    if (!subscription) return 0;
    if (subscription.monthly_credits === -1) return -1; // unlimited
    return Math.max(0, subscription.monthly_credits - subscription.used_credits);
  })();

  // Check if user is in trial period
  const isInTrial = subscription?.trial_ends_at 
    ? new Date(subscription.trial_ends_at) > new Date() 
    : false;

  // Check if user can create a story
  const canCreateStory = isAdmin || remainingCredits === -1 || remainingCredits > 0;

  // Get max allowed pages based on subscription
  const getMaxPages = (requestedPages: number): number => {
    if (isAdmin) return requestedPages;
    if (!currentFeatures) return 5;
    if (currentFeatures.unlimited_pages) return requestedPages;
    return Math.min(requestedPages, currentFeatures.max_pages);
  };

  // Check if a feature is available
  const hasFeature = (feature: keyof SubscriptionFeatures): boolean => {
    if (isAdmin) return true;
    if (!currentFeatures) return false;
    const value = currentFeatures[feature];
    return typeof value === "boolean" ? value : false;
  };

  // Get max children allowed
  const maxChildren = isAdmin ? Infinity : (currentFeatures?.max_children ?? 1);

  // Use a credit mutation
  const useCredit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      if (isAdmin) return true;
      
      const { data, error } = await supabase.rpc("use_story_credit", {
        _user_id: user.id,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    },
  });

  // Change subscription tier mutation
  const changeTier = useMutation({
    mutationFn: async (newTier: SubscriptionTier) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Get feature details for the new tier
      const features = allFeatures?.find(f => f.tier === newTier);
      if (!features) throw new Error("Invalid tier");

      const { error } = await supabase
        .from("subscriptions")
        .update({
          tier: newTier,
          monthly_credits: features.monthly_credits,
          max_pages: features.max_pages,
          max_children: features.max_children,
          price_tl: features.price_tl,
          used_credits: 0, // Reset credits on tier change
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    },
  });

  return {
    subscription,
    subscriptionLoading,
    currentFeatures,
    allFeatures,
    isAdmin: isAdmin ?? false,
    isAdminLoading,
    remainingCredits,
    isInTrial,
    canCreateStory,
    getMaxPages,
    hasFeature,
    maxChildren,
    useCredit: useCredit.mutateAsync,
    changeTier: changeTier.mutateAsync,
    isChangingTier: changeTier.isPending,
    tierName: subscription ? TIER_NAMES[subscription.tier] : null,
    tierEmoji: subscription ? TIER_EMOJIS[subscription.tier] : null,
  };
};
