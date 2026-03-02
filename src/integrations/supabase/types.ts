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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          parent_comment_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          parent_comment_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          parent_comment_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_anonymous: boolean
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          keywords: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      matriz_9box: {
        Row: {
          created_at: string
          employee_name: string
          id: string
          notes: string | null
          performance: number
          potential: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_name: string
          id?: string
          notes?: string | null
          performance: number
          potential: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_name?: string
          id?: string
          notes?: string | null
          performance?: number
          potential?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_materials: {
        Row: {
          created_at: string
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          module_id: string
          order_number: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id: string
          order_number?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id?: string
          order_number?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_number: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_number: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_number?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      nanda_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          message: string
          post_id: string | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          message: string
          post_id?: string | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          message?: string
          post_id?: string | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_actions: {
        Row: {
          achievable: string | null
          action_type: string
          completed_at: string | null
          created_at: string
          description: string
          end_date: string | null
          evidence: string | null
          id: string
          measurable: string | null
          pdi_id: string
          relevant: string | null
          specific: string | null
          start_date: string | null
          status: string
          time_bound: string | null
          updated_at: string
        }
        Insert: {
          achievable?: string | null
          action_type: string
          completed_at?: string | null
          created_at?: string
          description: string
          end_date?: string | null
          evidence?: string | null
          id?: string
          measurable?: string | null
          pdi_id: string
          relevant?: string | null
          specific?: string | null
          start_date?: string | null
          status?: string
          time_bound?: string | null
          updated_at?: string
        }
        Update: {
          achievable?: string | null
          action_type?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          evidence?: string | null
          id?: string
          measurable?: string | null
          pdi_id?: string
          relevant?: string | null
          specific?: string | null
          start_date?: string | null
          status?: string
          time_bound?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_actions_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_checkins: {
        Row: {
          best_moment: string | null
          biggest_effort: string | null
          checkin_date: string
          checkin_number: number
          created_at: string
          id: string
          new_action_ideas: string | null
          notes: string | null
          obstacles: string | null
          pdi_id: string
          updated_at: string
          what_didnt_work: string | null
          what_worked: string | null
          who_can_help: string | null
        }
        Insert: {
          best_moment?: string | null
          biggest_effort?: string | null
          checkin_date?: string
          checkin_number: number
          created_at?: string
          id?: string
          new_action_ideas?: string | null
          notes?: string | null
          obstacles?: string | null
          pdi_id: string
          updated_at?: string
          what_didnt_work?: string | null
          what_worked?: string | null
          who_can_help?: string | null
        }
        Update: {
          best_moment?: string | null
          biggest_effort?: string | null
          checkin_date?: string
          checkin_number?: number
          created_at?: string
          id?: string
          new_action_ideas?: string | null
          notes?: string | null
          obstacles?: string | null
          pdi_id?: string
          updated_at?: string
          what_didnt_work?: string | null
          what_worked?: string | null
          who_can_help?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdi_checkins_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_closures: {
        Row: {
          closure_date: string
          created_at: string
          final_status: string | null
          gains_obtained: string | null
          id: string
          main_learnings: string | null
          next_steps: string | null
          notes: string | null
          pdi_id: string
          satisfaction_score: number | null
          still_needs_development: string | null
          updated_at: string
          what_accomplished: string | null
          what_not_accomplished: string | null
          what_was_missing: string | null
        }
        Insert: {
          closure_date?: string
          created_at?: string
          final_status?: string | null
          gains_obtained?: string | null
          id?: string
          main_learnings?: string | null
          next_steps?: string | null
          notes?: string | null
          pdi_id: string
          satisfaction_score?: number | null
          still_needs_development?: string | null
          updated_at?: string
          what_accomplished?: string | null
          what_not_accomplished?: string | null
          what_was_missing?: string | null
        }
        Update: {
          closure_date?: string
          created_at?: string
          final_status?: string | null
          gains_obtained?: string | null
          id?: string
          main_learnings?: string | null
          next_steps?: string | null
          notes?: string | null
          pdi_id?: string
          satisfaction_score?: number | null
          still_needs_development?: string | null
          updated_at?: string
          what_accomplished?: string | null
          what_not_accomplished?: string | null
          what_was_missing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdi_closures_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: true
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_mentors: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          mentor_name: string
          mentor_role: string | null
          pdi_id: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          mentor_name: string
          mentor_role?: string | null
          pdi_id: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          mentor_name?: string
          mentor_role?: string | null
          pdi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_mentors_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdis: {
        Row: {
          behavior_assessments: Json | null
          created_at: string
          current_stage: number
          employee_name: string
          id: string
          notes: string | null
          pda_axis: string
          reflective_answers: Json | null
          start_date: string
          status: string
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          behavior_assessments?: Json | null
          created_at?: string
          current_stage?: number
          employee_name: string
          id?: string
          notes?: string | null
          pda_axis: string
          reflective_answers?: Json | null
          start_date?: string
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          behavior_assessments?: Json | null
          created_at?: string
          current_stage?: number
          employee_name?: string
          id?: string
          notes?: string | null
          pda_axis?: string
          reflective_answers?: Json | null
          start_date?: string
          status?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_evolution: {
        Row: {
          a_value: number | null
          assessment_date: string
          created_at: string
          decision_making: number | null
          e_value: number | null
          employee_name: string
          energy: number | null
          energy_balance: number | null
          id: string
          n_value: number | null
          notes: string | null
          p_value: number | null
          profile_intensity: number | null
          r_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          a_value?: number | null
          assessment_date?: string
          created_at?: string
          decision_making?: number | null
          e_value?: number | null
          employee_name: string
          energy?: number | null
          energy_balance?: number | null
          id?: string
          n_value?: number | null
          notes?: string | null
          p_value?: number | null
          profile_intensity?: number | null
          r_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          a_value?: number | null
          assessment_date?: string
          created_at?: string
          decision_making?: number | null
          e_value?: number | null
          employee_name?: string
          energy?: number | null
          energy_balance?: number | null
          id?: string
          n_value?: number | null
          notes?: string | null
          p_value?: number | null
          profile_intensity?: number | null
          r_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          analysis_result: Json | null
          avatar_url: string | null
          bio: string | null
          community_visible: boolean
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          last_password_change: string | null
          lgpd_accepted: boolean | null
          lgpd_accepted_at: string | null
          linkedin_url: string | null
          password_changed: boolean | null
          pda_a_value: number | null
          pda_dominant_axis: string | null
          pda_e_value: number | null
          pda_n_value: number | null
          pda_p_value: number | null
          pda_profile_name: string | null
          pda_public: boolean
          pda_r_value: number | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          avatar_url?: string | null
          bio?: string | null
          community_visible?: boolean
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_password_change?: string | null
          lgpd_accepted?: boolean | null
          lgpd_accepted_at?: string | null
          linkedin_url?: string | null
          password_changed?: boolean | null
          pda_a_value?: number | null
          pda_dominant_axis?: string | null
          pda_e_value?: number | null
          pda_n_value?: number | null
          pda_p_value?: number | null
          pda_profile_name?: string | null
          pda_public?: boolean
          pda_r_value?: number | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          avatar_url?: string | null
          bio?: string | null
          community_visible?: boolean
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_password_change?: string | null
          lgpd_accepted?: boolean | null
          lgpd_accepted_at?: string | null
          linkedin_url?: string | null
          password_changed?: boolean | null
          pda_a_value?: number | null
          pda_dominant_axis?: string | null
          pda_e_value?: number | null
          pda_n_value?: number | null
          pda_p_value?: number | null
          pda_profile_name?: string | null
          pda_public?: boolean
          pda_r_value?: number | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          module_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          full_name: string | null
          job_title: string | null
          linkedin_url: string | null
          pda_a_value: number | null
          pda_dominant_axis: string | null
          pda_e_value: number | null
          pda_n_value: number | null
          pda_p_value: number | null
          pda_profile_name: string | null
          pda_r_value: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          full_name?: string | null
          job_title?: string | null
          linkedin_url?: string | null
          pda_a_value?: never
          pda_dominant_axis?: never
          pda_e_value?: never
          pda_n_value?: never
          pda_p_value?: never
          pda_profile_name?: never
          pda_r_value?: never
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          full_name?: string | null
          job_title?: string | null
          linkedin_url?: string | null
          pda_a_value?: never
          pda_dominant_axis?: never
          pda_e_value?: never
          pda_n_value?: never
          pda_p_value?: never
          pda_profile_name?: never
          pda_r_value?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      log_user_action: {
        Args: {
          _action: string
          _new_data?: Json
          _old_data?: Json
          _record_id?: string
          _table_name?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
