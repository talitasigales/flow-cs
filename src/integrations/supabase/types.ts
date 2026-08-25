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
      bussola_assignments: {
        Row: {
          created_at: string
          encounter_count: number
          id: string
          program_id: string
          psychologist_id: string | null
          status: string
          young_email: string | null
          young_name: string | null
          young_user_id: string
        }
        Insert: {
          created_at?: string
          encounter_count?: number
          id?: string
          program_id: string
          psychologist_id?: string | null
          status?: string
          young_email?: string | null
          young_name?: string | null
          young_user_id: string
        }
        Update: {
          created_at?: string
          encounter_count?: number
          id?: string
          program_id?: string
          psychologist_id?: string | null
          status?: string
          young_email?: string | null
          young_name?: string | null
          young_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bussola_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      bussola_payments: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string | null
          dom_transaction_id: string
          encounter_count: number
          id: string
          raw_payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string | null
          dom_transaction_id: string
          encounter_count?: number
          id?: string
          raw_payload?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          dom_transaction_id?: string
          encounter_count?: number
          id?: string
          raw_payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      bussola_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          encounter_number: number
          id: string
          notes: Json | null
          program_id: string
          psychologist_user_id: string
          scheduled_date: string | null
          status: string
          updated_at: string
          young_user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          encounter_number: number
          id?: string
          notes?: Json | null
          program_id: string
          psychologist_user_id: string
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          young_user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          encounter_number?: number
          id?: string
          notes?: Json | null
          program_id?: string
          psychologist_user_id?: string
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          young_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bussola_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      bussola_workbooks: {
        Row: {
          created_at: string
          data: Json
          encounter_number: number
          id: string
          is_prework: boolean
          program_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          encounter_number: number
          id?: string
          is_prework?: boolean
          program_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          encounter_number?: number
          id?: string
          is_prework?: boolean
          program_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bussola_workbooks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_code: string
          class_id: string | null
          course_dates: string
          course_hours: number
          created_at: string
          director_name: string
          director_signature_url: string | null
          emailed_at: string | null
          enabled_at: string
          enabled_by: string
          enrollment_id: string
          generated_at: string | null
          id: string
          program_id: string
          user_id: string
        }
        Insert: {
          certificate_code: string
          class_id?: string | null
          course_dates?: string
          course_hours?: number
          created_at?: string
          director_name?: string
          director_signature_url?: string | null
          emailed_at?: string | null
          enabled_at?: string
          enabled_by: string
          enrollment_id: string
          generated_at?: string | null
          id?: string
          program_id: string
          user_id: string
        }
        Update: {
          certificate_code?: string
          class_id?: string | null
          course_dates?: string
          course_hours?: number
          created_at?: string
          director_name?: string
          director_signature_url?: string | null
          emailed_at?: string | null
          enabled_at?: string
          enabled_by?: string
          enrollment_id?: string
          generated_at?: string | null
          id?: string
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "program_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "program_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
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
      class_module_specialists: {
        Row: {
          class_id: string
          created_at: string
          id: string
          module_id: string
          order_number: number
          specialist_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          module_id: string
          order_number?: number
          specialist_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          module_id?: string
          order_number?: number
          specialist_id?: string
        }
        Relationships: []
      }
      class_modules: {
        Row: {
          class_id: string
          created_at: string
          id: string
          module_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          module_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_modules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "program_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      class_reminder_logs: {
        Row: {
          channel: string
          class_id: string
          id: string
          recipients_count: number
          reminder_type: string
          sent_at: string
          session_date: string
          session_start_time: string | null
        }
        Insert: {
          channel?: string
          class_id: string
          id?: string
          recipients_count?: number
          reminder_type: string
          sent_at?: string
          session_date: string
          session_start_time?: string | null
        }
        Update: {
          channel?: string
          class_id?: string
          id?: string
          recipients_count?: number
          reminder_type?: string
          sent_at?: string
          session_date?: string
          session_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_reminder_logs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "program_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string | null
          end_time: string | null
          id: string
          module_id: string | null
          order_number: number | null
          schedule_date: string
          start_time: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          module_id?: string | null
          order_number?: number | null
          schedule_date: string
          start_time?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          module_id?: string | null
          order_number?: number | null
          schedule_date?: string
          start_time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "program_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
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
      cs_companies: {
        Row: {
          created_at: string
          created_by: string | null
          external_data: Json | null
          external_id: string | null
          external_provider: string | null
          id: string
          last_synced_at: string | null
          name: string
          notes: string | null
          owner_user_id: string | null
          segment: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          external_data?: Json | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          notes?: string | null
          owner_user_id?: string | null
          segment?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          external_data?: Json | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          segment?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cs_contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          external_data: Json | null
          external_id: string | null
          external_provider: string | null
          id: string
          influence: string
          is_active: boolean
          last_synced_at: string | null
          name: string
          phone: string | null
          role_title: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          external_data?: Json | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          influence?: string
          is_active?: boolean
          last_synced_at?: string | null
          name: string
          phone?: string | null
          role_title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          external_data?: Json | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          influence?: string
          is_active?: boolean
          last_synced_at?: string | null
          name?: string
          phone?: string | null
          role_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cs_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          last_delta_sync_at: string | null
          last_full_sync_at: string | null
          provider: string
          sync_frequency_minutes: number
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_delta_sync_at?: string | null
          last_full_sync_at?: string | null
          provider: string
          sync_frequency_minutes?: number
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_delta_sync_at?: string | null
          last_full_sync_at?: string | null
          provider?: string
          sync_frequency_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      cs_sync_logs: {
        Row: {
          companies_imported: number
          contacts_imported: number
          errors: Json
          finished_at: string | null
          id: string
          provider: string
          run_type: string
          started_at: string
          status: string
          touchpoints_imported: number
          triggered_by: string | null
        }
        Insert: {
          companies_imported?: number
          contacts_imported?: number
          errors?: Json
          finished_at?: string | null
          id?: string
          provider: string
          run_type: string
          started_at?: string
          status: string
          touchpoints_imported?: number
          triggered_by?: string | null
        }
        Update: {
          companies_imported?: number
          contacts_imported?: number
          errors?: Json
          finished_at?: string | null
          id?: string
          provider?: string
          run_type?: string
          started_at?: string
          status?: string
          touchpoints_imported?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      cs_touchpoint_contacts: {
        Row: {
          contact_id: string
          touchpoint_id: string
        }
        Insert: {
          contact_id: string
          touchpoint_id: string
        }
        Update: {
          contact_id?: string
          touchpoint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_touchpoint_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cs_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_touchpoint_contacts_touchpoint_id_fkey"
            columns: ["touchpoint_id"]
            isOneToOne: false
            referencedRelation: "cs_touchpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_touchpoints: {
        Row: {
          attachments: Json | null
          company_id: string
          created_at: string
          description: string | null
          external_data: Json | null
          external_id: string | null
          external_provider: string | null
          id: string
          occurred_at: string
          owner_user_id: string | null
          status: string
          tags: string[] | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          company_id: string
          created_at?: string
          description?: string | null
          external_data?: Json | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          occurred_at?: string
          owner_user_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          company_id?: string
          created_at?: string
          description?: string | null
          external_data?: Json | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          occurred_at?: string
          owner_user_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_touchpoints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cs_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_user_access: {
        Row: {
          created_at: string
          created_by: string | null
          cs_role: Database["public"]["Enums"]["cs_role"]
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cs_role?: Database["public"]["Enums"]["cs_role"]
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cs_role?: Database["public"]["Enums"]["cs_role"]
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      csat_responses: {
        Row: {
          comment: string | null
          created_at: string
          dismissed: boolean
          id: string
          rating: number
          trigger_reference: string | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          dismissed?: boolean
          id?: string
          rating: number
          trigger_reference?: string | null
          trigger_type: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          dismissed?: boolean
          id?: string
          rating?: number
          trigger_reference?: string | null
          trigger_type?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_responses: {
        Row: {
          answers: Json
          exercise_id: string
          id: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          exercise_id: string
          id?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          exercise_id?: string
          id?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_responses_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "module_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      job_constructions: {
        Row: {
          a_score: number
          answers: Json
          created_at: string
          e_score: number
          id: string
          job_title: string | null
          n_score: number
          p_score: number
          r_score: number
          user_id: string
        }
        Insert: {
          a_score: number
          answers?: Json
          created_at?: string
          e_score: number
          id?: string
          job_title?: string | null
          n_score: number
          p_score: number
          r_score: number
          user_id: string
        }
        Update: {
          a_score?: number
          answers?: Json
          created_at?: string
          e_score?: number
          id?: string
          job_title?: string | null
          n_score?: number
          p_score?: number
          r_score?: number
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
      module_default_specialists: {
        Row: {
          created_at: string
          id: string
          module_id: string
          order_number: number
          specialist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          order_number?: number
          specialist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          order_number?: number
          specialist_id?: string
        }
        Relationships: []
      }
      module_exercises: {
        Row: {
          created_at: string
          description: string | null
          exercise_type: string
          id: string
          module_id: string
          order_number: number | null
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exercise_type?: string
          id?: string
          module_id: string
          order_number?: number | null
          questions?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exercise_type?: string
          id?: string
          module_id?: string
          order_number?: number | null
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_exercises_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_feature_links: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          id: string
          label: string | null
          module_id: string
          order_number: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          id?: string
          label?: string | null
          module_id: string
          order_number?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          id?: string
          label?: string | null
          module_id?: string
          order_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "module_feature_links_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
        ]
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
      pda_cache: {
        Row: {
          endpoint: string
          fetched_at: string
          payload: Json
        }
        Insert: {
          endpoint: string
          fetched_at?: string
          payload: Json
        }
        Update: {
          endpoint?: string
          fetched_at?: string
          payload?: Json
        }
        Relationships: []
      }
      pda_reports: {
        Row: {
          file_name: string
          file_url: string
          id: string
          program_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          program_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          program_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pda_reports_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      pda_sinaleira_snapshot: {
        Row: {
          account_expiration: string | null
          account_name: string
          account_type: string | null
          alert: string | null
          available_credits: number
          consulted_at: string | null
          created_at: string
          credits_expiration: string | null
          id: string
          last_month_consumption: number
          signal: string
          snapshot_id: string
          used_credits_total: number
        }
        Insert: {
          account_expiration?: string | null
          account_name: string
          account_type?: string | null
          alert?: string | null
          available_credits?: number
          consulted_at?: string | null
          created_at?: string
          credits_expiration?: string | null
          id?: string
          last_month_consumption?: number
          signal?: string
          snapshot_id: string
          used_credits_total?: number
        }
        Update: {
          account_expiration?: string | null
          account_name?: string
          account_type?: string | null
          alert?: string | null
          available_credits?: number
          consulted_at?: string | null
          created_at?: string
          credits_expiration?: string | null
          id?: string
          last_month_consumption?: number
          signal?: string
          snapshot_id?: string
          used_credits_total?: number
        }
        Relationships: []
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
      pdi_shares: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          hide_notes: boolean
          id: string
          is_active: boolean
          last_viewed_at: string | null
          pdi_id: string
          token: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          hide_notes?: boolean
          id?: string
          is_active?: boolean
          last_viewed_at?: string | null
          pdi_id: string
          token: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          hide_notes?: boolean
          id?: string
          is_active?: boolean
          last_viewed_at?: string | null
          pdi_id?: string
          token?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdi_shares_pdi_id_fkey"
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
      pending_enrollments: {
        Row: {
          class_id: string | null
          created_at: string
          dilemmas_url: string | null
          email: string
          id: string
          phone: string | null
          program_id: string
          resilience_url: string | null
          secondary_email: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          dilemmas_url?: string | null
          email: string
          id?: string
          phone?: string | null
          program_id: string
          resilience_url?: string | null
          secondary_email?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          dilemmas_url?: string | null
          email?: string
          id?: string
          phone?: string | null
          program_id?: string
          resilience_url?: string | null
          secondary_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "program_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_changelog: {
        Row: {
          area: string
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          area?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          published_at?: string
          title?: string
          updated_at?: string
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
          profile_modification: number
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
          profile_modification?: number
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
          profile_modification?: number
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
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_access_at: string | null
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
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_access_at?: string | null
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
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_access_at?: string | null
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
      program_classes: {
        Row: {
          created_at: string
          dilemmas_released: boolean
          dilemmas_url: string | null
          email_reminder_1h_sent_at: string | null
          email_reminder_24h_sent_at: string | null
          email_reminders_enabled: boolean
          end_date: string | null
          id: string
          name: string
          pda_report_enabled: boolean
          program_id: string
          resilience_url: string | null
          specialist: string | null
          start_date: string | null
          start_time: string | null
          timezone: string
          video_conference_url: string | null
          whatsapp_reminder_24h_sent_at: string | null
          whatsapp_reminder_30min_sent_at: string | null
          whatsapp_reminders_enabled: boolean
        }
        Insert: {
          created_at?: string
          dilemmas_released?: boolean
          dilemmas_url?: string | null
          email_reminder_1h_sent_at?: string | null
          email_reminder_24h_sent_at?: string | null
          email_reminders_enabled?: boolean
          end_date?: string | null
          id?: string
          name: string
          pda_report_enabled?: boolean
          program_id: string
          resilience_url?: string | null
          specialist?: string | null
          start_date?: string | null
          start_time?: string | null
          timezone?: string
          video_conference_url?: string | null
          whatsapp_reminder_24h_sent_at?: string | null
          whatsapp_reminder_30min_sent_at?: string | null
          whatsapp_reminders_enabled?: boolean
        }
        Update: {
          created_at?: string
          dilemmas_released?: boolean
          dilemmas_url?: string | null
          email_reminder_1h_sent_at?: string | null
          email_reminder_24h_sent_at?: string | null
          email_reminders_enabled?: boolean
          end_date?: string | null
          id?: string
          name?: string
          pda_report_enabled?: boolean
          program_id?: string
          resilience_url?: string | null
          specialist?: string | null
          start_date?: string | null
          start_time?: string | null
          timezone?: string
          video_conference_url?: string | null
          whatsapp_reminder_24h_sent_at?: string | null
          whatsapp_reminder_30min_sent_at?: string | null
          whatsapp_reminders_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "program_classes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_enrollments: {
        Row: {
          class_id: string | null
          dilemmas_url: string | null
          enrolled_at: string
          id: string
          program_id: string
          resilience_url: string | null
          user_id: string
        }
        Insert: {
          class_id?: string | null
          dilemmas_url?: string | null
          enrolled_at?: string
          id?: string
          program_id: string
          resilience_url?: string | null
          user_id: string
        }
        Update: {
          class_id?: string | null
          dilemmas_url?: string | null
          enrolled_at?: string
          id?: string
          program_id?: string
          resilience_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "program_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          external_url: string | null
          id: string
          location: string | null
          program_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          external_url?: string | null
          id?: string
          location?: string | null
          program_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          external_url?: string | null
          id?: string
          location?: string | null
          program_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_materials: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          module_id: string | null
          order_number: number | null
          program_id: string
          title: string
          video_urls: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id?: string | null
          order_number?: number | null
          program_id: string
          title: string
          video_urls?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id?: string | null
          order_number?: number | null
          program_id?: string
          title?: string
          video_urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "program_materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_materials_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_number: number | null
          program_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_number?: number | null
          program_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_number?: number | null
          program_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_welcome_dismissed: {
        Row: {
          dismissed_at: string
          id: string
          program_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: string
          program_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: string
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_welcome_dismissed_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_welcome_messages: {
        Row: {
          active: boolean
          content: string | null
          created_at: string
          id: string
          message_type: string
          program_id: string
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          content?: string | null
          created_at?: string
          id?: string
          message_type?: string
          program_id: string
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          content?: string | null
          created_at?: string
          id?: string
          message_type?: string
          program_id?: string
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_welcome_messages_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: true
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      schedule_modules: {
        Row: {
          created_at: string
          id: string
          module_id: string
          schedule_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          schedule_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_modules_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      specialists: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
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
      webinars: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          presenter: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          webinar_date: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          presenter?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          webinar_date?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          presenter?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          webinar_date?: string | null
        }
        Relationships: []
      }
      workshop_responses: {
        Row: {
          answers: Json
          id: string
          program_id: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          id?: string
          program_id: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          id?: string
          program_id?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_responses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
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
      can_cs_edit: { Args: { _user_id: string }; Returns: boolean }
      has_cs_access: { Args: { _user_id: string }; Returns: boolean }
      has_cs_role: {
        Args: {
          _role: Database["public"]["Enums"]["cs_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      is_cs_admin: { Args: { _user_id: string }; Returns: boolean }
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
      app_role: "admin" | "user" | "young" | "psychologist"
      cs_role: "cs_admin" | "cs_editor" | "cs_viewer"
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
      app_role: ["admin", "user", "young", "psychologist"],
      cs_role: ["cs_admin", "cs_editor", "cs_viewer"],
    },
  },
} as const
