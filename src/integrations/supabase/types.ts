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
      attainment_scale_bands: {
        Row: {
          category_label: string
          created_at: string
          id: string
          is_default: boolean
          max_score: number
          min_score: number
          scale_value: number
          updated_at: string
        }
        Insert: {
          category_label: string
          created_at?: string
          id?: string
          is_default?: boolean
          max_score: number
          min_score: number
          scale_value: number
          updated_at?: string
        }
        Update: {
          category_label?: string
          created_at?: string
          id?: string
          is_default?: boolean
          max_score?: number
          min_score?: number
          scale_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      bloom_taxonomy_levels: {
        Row: {
          created_at: string
          display_order: number
          domain: string
          id: string
          is_active: boolean
          level: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          domain: string
          id?: string
          is_active?: boolean
          level: string
        }
        Update: {
          created_at?: string
          display_order?: number
          domain?: string
          id?: string
          is_active?: boolean
          level?: string
        }
        Relationships: []
      }
      co_assessment_tools: {
        Row: {
          course_outcome_id: string
          created_at: string
          display_order: number
          id: string
          max_marks: number
          rubric_notes: string | null
          tool_name: string
          updated_at: string
        }
        Insert: {
          course_outcome_id: string
          created_at?: string
          display_order?: number
          id?: string
          max_marks: number
          rubric_notes?: string | null
          tool_name: string
          updated_at?: string
        }
        Update: {
          course_outcome_id?: string
          created_at?: string
          display_order?: number
          id?: string
          max_marks?: number
          rubric_notes?: string | null
          tool_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_assessment_tools_course_outcome_id_fkey"
            columns: ["course_outcome_id"]
            isOneToOne: false
            referencedRelation: "course_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      co_knowledge_profile_mapping: {
        Row: {
          course_outcome_id: string
          created_at: string
          id: string
          knowledge_profile_id: string
        }
        Insert: {
          course_outcome_id: string
          created_at?: string
          id?: string
          knowledge_profile_id: string
        }
        Update: {
          course_outcome_id?: string
          created_at?: string
          id?: string
          knowledge_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_knowledge_profile_mapping_course_outcome_id_fkey"
            columns: ["course_outcome_id"]
            isOneToOne: false
            referencedRelation: "course_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_knowledge_profile_mapping_knowledge_profile_id_fkey"
            columns: ["knowledge_profile_id"]
            isOneToOne: false
            referencedRelation: "knowledge_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      co_po_mapping: {
        Row: {
          course_outcome_id: string
          created_at: string
          id: string
          program_outcome_id: string
        }
        Insert: {
          course_outcome_id: string
          created_at?: string
          id?: string
          program_outcome_id: string
        }
        Update: {
          course_outcome_id?: string
          created_at?: string
          id?: string
          program_outcome_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_po_mapping_course_outcome_id_fkey"
            columns: ["course_outcome_id"]
            isOneToOne: false
            referencedRelation: "course_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_po_mapping_program_outcome_id_fkey"
            columns: ["program_outcome_id"]
            isOneToOne: false
            referencedRelation: "program_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      co_problem_attribute_mapping: {
        Row: {
          complex_problem_attribute_id: string
          course_outcome_id: string
          created_at: string
          id: string
        }
        Insert: {
          complex_problem_attribute_id: string
          course_outcome_id: string
          created_at?: string
          id?: string
        }
        Update: {
          complex_problem_attribute_id?: string
          course_outcome_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_problem_attribute_mapping_complex_problem_attribute_id_fkey"
            columns: ["complex_problem_attribute_id"]
            isOneToOne: false
            referencedRelation: "complex_problem_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "co_problem_attribute_mapping_course_outcome_id_fkey"
            columns: ["course_outcome_id"]
            isOneToOne: false
            referencedRelation: "course_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      complex_problem_attributes: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_offerings: {
        Row: {
          academic_year: number
          approved_at: string | null
          approved_by: string | null
          checked_at: string | null
          checked_by: string | null
          co_attainment_target_percent: number
          consultation_hours: string | null
          course_type: string
          created_at: string
          created_by: string
          credit_hours: number
          curriculum_course_id: string
          grading_weight_class_performance: number
          grading_weight_final: number
          grading_weight_quiz_assignment: number
          id: string
          instructor_id: string
          review_comment: string | null
          section: string
          semester_type_id: string
          status: string
          updated_at: string
        }
        Insert: {
          academic_year: number
          approved_at?: string | null
          approved_by?: string | null
          checked_at?: string | null
          checked_by?: string | null
          co_attainment_target_percent?: number
          consultation_hours?: string | null
          course_type: string
          created_at?: string
          created_by: string
          credit_hours: number
          curriculum_course_id: string
          grading_weight_class_performance?: number
          grading_weight_final?: number
          grading_weight_quiz_assignment?: number
          id?: string
          instructor_id: string
          review_comment?: string | null
          section: string
          semester_type_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          academic_year?: number
          approved_at?: string | null
          approved_by?: string | null
          checked_at?: string | null
          checked_by?: string | null
          co_attainment_target_percent?: number
          consultation_hours?: string | null
          course_type?: string
          created_at?: string
          created_by?: string
          credit_hours?: number
          curriculum_course_id?: string
          grading_weight_class_performance?: number
          grading_weight_final?: number
          grading_weight_quiz_assignment?: number
          id?: string
          instructor_id?: string
          review_comment?: string | null
          section?: string
          semester_type_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_offerings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_curriculum_course_id_fkey"
            columns: ["curriculum_course_id"]
            isOneToOne: false
            referencedRelation: "curriculum_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_semester_type_id_fkey"
            columns: ["semester_type_id"]
            isOneToOne: false
            referencedRelation: "semester_types"
            referencedColumns: ["id"]
          },
        ]
      }
      course_outcomes: {
        Row: {
          bloom_taxonomy_level_id: string
          co_number: string
          co_statement: string
          course_offering_id: string
          created_at: string
          display_order: number
          id: string
          updated_at: string
        }
        Insert: {
          bloom_taxonomy_level_id: string
          co_number: string
          co_statement: string
          course_offering_id: string
          created_at?: string
          display_order?: number
          id?: string
          updated_at?: string
        }
        Update: {
          bloom_taxonomy_level_id?: string
          co_number?: string
          co_statement?: string
          course_offering_id?: string
          created_at?: string
          display_order?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_outcomes_bloom_taxonomy_level_id_fkey"
            columns: ["bloom_taxonomy_level_id"]
            isOneToOne: false
            referencedRelation: "bloom_taxonomy_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_outcomes_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      course_weekly_schedule: {
        Row: {
          course_offering_id: string
          course_outcome_id: string | null
          created_at: string
          delivery_method: string | null
          id: string
          topic: string
          updated_at: string
          week_number: number
        }
        Insert: {
          course_offering_id: string
          course_outcome_id?: string | null
          created_at?: string
          delivery_method?: string | null
          id?: string
          topic: string
          updated_at?: string
          week_number: number
        }
        Update: {
          course_offering_id?: string
          course_outcome_id?: string | null
          created_at?: string
          delivery_method?: string | null
          id?: string
          topic?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_weekly_schedule_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_weekly_schedule_course_outcome_id_fkey"
            columns: ["course_outcome_id"]
            isOneToOne: false
            referencedRelation: "course_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_courses: {
        Row: {
          course_code: string
          course_title: string
          created_at: string
          department_id: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          course_code: string
          course_title: string
          created_at?: string
          department_id: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          course_code?: string
          course_title?: string
          created_at?: string
          department_id?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      knowledge_profiles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      po_knowledge_profile_mapping: {
        Row: {
          created_at: string
          id: string
          knowledge_profile_id: string
          program_outcome_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_profile_id: string
          program_outcome_id: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_profile_id?: string
          program_outcome_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_knowledge_profile_mapping_knowledge_profile_id_fkey"
            columns: ["knowledge_profile_id"]
            isOneToOne: false
            referencedRelation: "knowledge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_knowledge_profile_mapping_program_outcome_id_fkey"
            columns: ["program_outcome_id"]
            isOneToOne: false
            referencedRelation: "program_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_outcomes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      semester_types: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      can_author_course_setup: { Args: never; Returns: boolean }
      can_edit_course_offering: {
        Args: { _offering_id: string }
        Returns: boolean
      }
      can_edit_course_outcome: {
        Args: { _course_outcome_id: string }
        Returns: boolean
      }
      can_manage_master_data: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "obe_coordinator" | "faculty"
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
      app_role: ["super_admin", "obe_coordinator", "faculty"],
    },
  },
} as const
