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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      active_buffs: {
        Row: {
          buff_id: string
          expires_at: string
          label: string
          user_id: string
        }
        Insert: {
          buff_id: string
          expires_at: string
          label: string
          user_id: string
        }
        Update: {
          buff_id?: string
          expires_at?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      active_timed_quests: {
        Row: {
          chapter_id: string
          habit_id: string
          node_id: string
          started_at: string
          started_on: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          habit_id: string
          node_id: string
          started_at: string
          started_on: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          habit_id?: string
          node_id?: string
          started_at?: string
          started_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_timed_quests_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_timed_quests_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_timed_quests_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "quest_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          chapter_id: string | null
          coins_earned: number
          habit_id: string | null
          id: string
          node_id: string | null
          occurred_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          chapter_id?: string | null
          coins_earned?: number
          habit_id?: string | null
          id?: string
          node_id?: string | null
          occurred_at: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          chapter_id?: string | null
          coins_earned?: number
          habit_id?: string | null
          id?: string
          node_id?: string | null
          occurred_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "quest_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_reward_claims: {
        Row: {
          chapter_id: string
          claimed_at: string
          habit_id: string
          id: string
          reward_coins: number
          reward_xp: number
          user_id: string
        }
        Insert: {
          chapter_id: string
          claimed_at: string
          habit_id: string
          id?: string
          reward_coins: number
          reward_xp: number
          user_id: string
        }
        Update: {
          chapter_id?: string
          claimed_at?: string
          habit_id?: string
          id?: string
          reward_coins?: number
          reward_xp?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_reward_claims_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_reward_claims_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          description: string
          habit_id: string
          id: string
          reward_coins: number
          reward_xp: number
          sort_order: number
          title: string
        }
        Insert: {
          description: string
          habit_id: string
          id: string
          reward_coins: number
          reward_xp: number
          sort_order: number
          title: string
        }
        Update: {
          description?: string
          habit_id?: string
          id?: string
          reward_coins?: number
          reward_xp?: number
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_check_ins: {
        Row: {
          claimed_at: string
          claimed_on: string
          id: string
          reward_coins: number
          reward_energy: number
          user_id: string
        }
        Insert: {
          claimed_at: string
          claimed_on: string
          id?: string
          reward_coins: number
          reward_energy: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          claimed_on?: string
          id?: string
          reward_coins?: number
          reward_energy?: number
          user_id?: string
        }
        Relationships: []
      }
      equipment_items: {
        Row: {
          asset_key: string
          id: string
          name: string
          primary_stat: string
          secondary_stat: string
          set_id: string
          slot_id: string
        }
        Insert: {
          asset_key: string
          id: string
          name: string
          primary_stat: string
          secondary_stat: string
          set_id: string
          slot_id: string
        }
        Update: {
          asset_key?: string
          id?: string
          name?: string
          primary_stat?: string
          secondary_stat?: string
          set_id?: string
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "equipment_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_items_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "equipment_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_sets: {
        Row: {
          description: string
          id: string
          name: string
        }
        Insert: {
          description: string
          id: string
          name: string
        }
        Update: {
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      equipment_slots: {
        Row: {
          icon: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          icon: string
          id: string
          label: string
          sort_order: number
        }
        Update: {
          icon?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      habit_definitions: {
        Row: {
          daily_prompt: string
          icon: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          daily_prompt: string
          icon: string
          id: string
          label: string
          sort_order: number
        }
        Update: {
          daily_prompt?: string
          icon?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      habit_progress: {
        Row: {
          habit_id: string
          last_completed_on: string | null
          level: number
          streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          habit_id: string
          last_completed_on?: string | null
          level?: number
          streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          habit_id?: string
          last_completed_on?: string | null
          level?: number
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_progress_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          acquired_at: string
          equipment_item_id: string
          equipped_slot: string | null
          id: string
          rarity: string
          source_completion_id: string
          stats: Json
          user_id: string
        }
        Insert: {
          acquired_at?: string
          equipment_item_id: string
          equipped_slot?: string | null
          id?: string
          rarity: string
          source_completion_id: string
          stats: Json
          user_id: string
        }
        Update: {
          acquired_at?: string
          equipment_item_id?: string
          equipped_slot?: string | null
          id?: string
          rarity?: string
          source_completion_id?: string
          stats?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_equipped_slot_fkey"
            columns: ["equipped_slot"]
            isOneToOne: false
            referencedRelation: "equipment_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_source_completion_id_fkey"
            columns: ["source_completion_id"]
            isOneToOne: true
            referencedRelation: "quest_completions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_class_id: string
          avatar_variant: string
          coins: number
          daily_streak: number
          display_name: string
          energy_current: number
          energy_max: number
          id: string
          joined_at: string
          last_energy_refill_at: string | null
          last_streak_on: string | null
          level: number
          longest_streak: number
          streak_shields: number
          updated_at: string
          xp: number
          xp_to_next_level: number
        }
        Insert: {
          avatar_class_id?: string
          avatar_variant?: string
          coins?: number
          daily_streak?: number
          display_name?: string
          energy_current?: number
          energy_max?: number
          id: string
          joined_at?: string
          last_energy_refill_at?: string | null
          last_streak_on?: string | null
          level?: number
          longest_streak?: number
          streak_shields?: number
          updated_at?: string
          xp?: number
          xp_to_next_level?: number
        }
        Update: {
          avatar_class_id?: string
          avatar_variant?: string
          coins?: number
          daily_streak?: number
          display_name?: string
          energy_current?: number
          energy_max?: number
          id?: string
          joined_at?: string
          last_energy_refill_at?: string | null
          last_streak_on?: string | null
          level?: number
          longest_streak?: number
          streak_shields?: number
          updated_at?: string
          xp?: number
          xp_to_next_level?: number
        }
        Relationships: []
      }
      quest_completions: {
        Row: {
          chapter_id: string
          completed_at: string
          completed_on: string
          habit_id: string
          id: string
          node_id: string
          reward_coins: number
          reward_xp: number
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at: string
          completed_on: string
          habit_id: string
          id?: string
          node_id: string
          reward_coins: number
          reward_xp: number
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string
          completed_on?: string
          habit_id?: string
          id?: string
          node_id?: string
          reward_coins?: number
          reward_xp?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_completions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_completions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "quest_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_nodes: {
        Row: {
          chapter_id: string
          day: number
          energy_cost: number
          icon: string
          id: string
          quest_type: Database["public"]["Enums"]["quest_tracking_type"]
          reward_coins: number
          reward_xp: number
          summary: string
          target_duration_seconds: number | null
          target_quantity: number | null
          target_unit: string | null
          title: string
        }
        Insert: {
          chapter_id: string
          day: number
          energy_cost: number
          icon: string
          id: string
          quest_type: Database["public"]["Enums"]["quest_tracking_type"]
          reward_coins: number
          reward_xp: number
          summary: string
          target_duration_seconds?: number | null
          target_quantity?: number | null
          target_unit?: string | null
          title: string
        }
        Update: {
          chapter_id?: string
          day?: number
          energy_cost?: number
          icon?: string
          id?: string
          quest_type?: Database["public"]["Enums"]["quest_tracking_type"]
          reward_coins?: number
          reward_xp?: number
          summary?: string
          target_duration_seconds?: number | null
          target_quantity?: number | null
          target_unit?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_nodes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          equipped_slot: number | null
          item_id: string
          owned_at: string
          user_id: string
        }
        Insert: {
          equipped_slot?: number | null
          item_id: string
          owned_at?: string
          user_id: string
        }
        Update: {
          equipped_slot?: number | null
          item_id?: string
          owned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_equipped_slot_catalog_fkey"
            columns: ["equipped_slot"]
            isOneToOne: false
            referencedRelation: "equipment_slots"
            referencedColumns: ["sort_order"]
          },
        ]
      }
      user_settings: {
        Row: {
          daily_reminder_enabled: boolean
          daily_reminder_time: string
          haptics_enabled: boolean
          sound_enabled: boolean
          time_zone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_reminder_enabled?: boolean
          daily_reminder_time?: string
          haptics_enabled?: boolean
          sound_enabled?: boolean
          time_zone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_reminder_enabled?: boolean
          daily_reminder_time?: string
          haptics_enabled?: boolean
          sound_enabled?: boolean
          time_zone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_chapter_reward: {
        Args: { p_chapter_id: string; p_habit_id: string }
        Returns: Json
      }
      claim_daily_check_in: { Args: never; Returns: Json }
      complete_daily_quest: { Args: { p_habit_id: string }; Returns: Json }
      get_game_snapshot: { Args: never; Returns: Json }
      start_daily_quest: { Args: { p_habit_id: string }; Returns: Json }
      update_profile: { Args: { p_profile_fields: Json }; Returns: Json }
      update_settings: { Args: { p_settings: Json }; Returns: Json }
    }
    Enums: {
      activity_type: "daily-quest" | "chapter-reward" | "daily-check-in"
      quest_tracking_type: "timed" | "one-time"
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
      activity_type: ["daily-quest", "chapter-reward", "daily-check-in"],
      quest_tracking_type: ["timed", "one-time"],
    },
  },
} as const
