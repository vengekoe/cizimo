export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      book_categories: {
        Row: {
          color: string
          emoji: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color: string
          emoji: string
          id: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string
          emoji?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      book_comments: {
        Row: {
          book_id: string
          child_id: string
          content: string
          created_at: string
          emoji: string | null
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          child_id: string
          content: string
          created_at?: string
          emoji?: string | null
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          child_id?: string
          content?: string
          created_at?: string
          emoji?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_comments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_reading_stats"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "book_comments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      book_generation_tasks: {
        Row: {
          book_id: string | null
          child_id: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json
          progress_message: string | null
          progress_percent: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id?: string | null
          child_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data: Json
          progress_message?: string | null
          progress_percent?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string | null
          child_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          progress_message?: string | null
          progress_percent?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_generation_tasks_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_reading_stats"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "book_generation_tasks_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      book_likes: {
        Row: {
          book_id: string
          child_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          child_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          child_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_likes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_reading_stats"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "book_likes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      book_pages: {
        Row: {
          background_image: string | null
          book_id: string
          character: string
          created_at: string
          description: string
          emoji: string
          id: string
          page_number: number
          sound: string
          text_position: string | null
          title: string
        }
        Insert: {
          background_image?: string | null
          book_id: string
          character: string
          created_at?: string
          description: string
          emoji: string
          id?: string
          page_number: number
          sound: string
          text_position?: string | null
          title: string
        }
        Update: {
          background_image?: string | null
          book_id?: string
          character?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          page_number?: number
          sound?: string
          text_position?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_pages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_shares: {
        Row: {
          book_id: string
          child_id: string
          created_at: string
          id: string
          shared_by: string
        }
        Insert: {
          book_id: string
          child_id: string
          created_at?: string
          id?: string
          shared_by: string
        }
        Update: {
          book_id?: string
          child_id?: string
          created_at?: string
          id?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_shares_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_reading_stats"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "book_shares_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          category: string | null
          child_id: string | null
          cover_emoji: string
          cover_image: string | null
          created_at: string
          id: string
          is_favorite: boolean | null
          is_from_drawing: boolean | null
          last_read_at: string | null
          theme: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          child_id?: string | null
          cover_emoji: string
          cover_image?: string | null
          created_at?: string
          id: string
          is_favorite?: boolean | null
          is_from_drawing?: boolean | null
          last_read_at?: string | null
          theme: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          child_id?: string | null
          cover_emoji?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          is_from_drawing?: boolean | null
          last_read_at?: string | null
          theme?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_reading_stats"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "books_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number | null
          avatar_emoji: string | null
          created_at: string
          favorite_animal: string | null
          favorite_cartoon: string | null
          favorite_color: string | null
          favorite_superhero: string | null
          favorite_team: string | null
          favorite_toy: string | null
          gender: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_emoji?: string | null
          created_at?: string
          favorite_animal?: string | null
          favorite_cartoon?: string | null
          favorite_color?: string | null
          favorite_superhero?: string | null
          favorite_team?: string | null
          favorite_toy?: string | null
          gender?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_emoji?: string | null
          created_at?: string
          favorite_animal?: string | null
          favorite_cartoon?: string | null
          favorite_color?: string | null
          favorite_superhero?: string | null
          favorite_team?: string | null
          favorite_toy?: string | null
          gender?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          favorite_animal: string | null
          favorite_cartoon: string | null
          favorite_color: string | null
          favorite_superhero: string | null
          favorite_team: string | null
          favorite_toy: string | null
          gender: string | null
          id: string
          preferred_ai_model: string | null
          preferred_image_model: string | null
          preferred_language: string | null
          preferred_page_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          favorite_animal?: string | null
          favorite_cartoon?: string | null
          favorite_color?: string | null
          favorite_superhero?: string | null
          favorite_team?: string | null
          favorite_toy?: string | null
          gender?: string | null
          id?: string
          preferred_ai_model?: string | null
          preferred_image_model?: string | null
          preferred_language?: string | null
          preferred_page_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          favorite_animal?: string | null
          favorite_cartoon?: string | null
          favorite_color?: string | null
          favorite_superhero?: string | null
          favorite_team?: string | null
          favorite_toy?: string | null
          gender?: string | null
          id?: string
          preferred_ai_model?: string | null
          preferred_image_model?: string | null
          preferred_language?: string | null
          preferred_page_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string
          completed: boolean
          created_at: string
          current_page: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id?: string
          completed?: boolean
          created_at?: string
          current_page?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          completed?: boolean
          created_at?: string
          current_page?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          book_id: string
          child_id: string | null
          created_at: string
          duration_seconds: number
          ended_at: string | null
          id: string
          pages_read: number
          started_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          child_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          pages_read?: number
          started_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          child_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          pages_read?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "child_reading_stats"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "reading_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_features: {
        Row: {
          advanced_personalization: boolean
          advanced_stats: boolean
          audio_story: boolean
          basic_personalization: boolean
          basic_stats: boolean
          cover_design_selection: boolean
          custom_illustration: boolean
          detailed_stats: boolean
          family_sharing: boolean
          favorite_pages: boolean
          font_selection: boolean
          friend_sharing: boolean
          id: string
          library_backup: boolean
          max_children: number
          max_pages: number
          monthly_credits: number
          photo_story: boolean
          price_tl: number
          print_ready: boolean
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_months: number
          unlimited_friend_sharing: boolean
          unlimited_pages: boolean
          unlimited_revision: boolean
          unlimited_stories: boolean
          weekly_themes: boolean
        }
        Insert: {
          advanced_personalization?: boolean
          advanced_stats?: boolean
          audio_story?: boolean
          basic_personalization?: boolean
          basic_stats?: boolean
          cover_design_selection?: boolean
          custom_illustration?: boolean
          detailed_stats?: boolean
          family_sharing?: boolean
          favorite_pages?: boolean
          font_selection?: boolean
          friend_sharing?: boolean
          id?: string
          library_backup?: boolean
          max_children: number
          max_pages: number
          monthly_credits: number
          photo_story?: boolean
          price_tl: number
          print_ready?: boolean
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_months?: number
          unlimited_friend_sharing?: boolean
          unlimited_pages?: boolean
          unlimited_revision?: boolean
          unlimited_stories?: boolean
          weekly_themes?: boolean
        }
        Update: {
          advanced_personalization?: boolean
          advanced_stats?: boolean
          audio_story?: boolean
          basic_personalization?: boolean
          basic_stats?: boolean
          cover_design_selection?: boolean
          custom_illustration?: boolean
          detailed_stats?: boolean
          family_sharing?: boolean
          favorite_pages?: boolean
          font_selection?: boolean
          friend_sharing?: boolean
          id?: string
          library_backup?: boolean
          max_children?: number
          max_pages?: number
          monthly_credits?: number
          photo_story?: boolean
          price_tl?: number
          print_ready?: boolean
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_months?: number
          unlimited_friend_sharing?: boolean
          unlimited_pages?: boolean
          unlimited_revision?: boolean
          unlimited_stories?: boolean
          weekly_themes?: boolean
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          max_children: number
          max_pages: number
          monthly_credits: number
          price_tl: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          max_children?: number
          max_pages?: number
          monthly_credits?: number
          price_tl?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          max_children?: number
          max_pages?: number
          monthly_credits?: number
          price_tl?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          used_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      child_reading_stats: {
        Row: {
          avatar_emoji: string | null
          books_read: number | null
          child_id: string | null
          child_name: string | null
          total_pages_read: number | null
          total_reading_seconds: number | null
          total_sessions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_create_story: { Args: { _user_id: string }; Returns: boolean }
      get_remaining_credits: { Args: { _user_id: string }; Returns: number }
      get_user_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      use_story_credit: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      subscription_tier:
        | "minik_masal"
        | "masal_kesfifcisi"
        | "masal_kahramani"
        | "sonsuz_masal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      subscription_tier: [
        "minik_masal",
        "masal_kesfifcisi",
        "masal_kahramani",
        "sonsuz_masal",
      ],
    },
  },
} as const
