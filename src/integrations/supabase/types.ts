export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_state: Json | null
          organization_id: string | null
          previous_state: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_state?: Json | null
          organization_id?: string | null
          previous_state?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_state?: Json | null
          organization_id?: string | null
          previous_state?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_expirations: {
        Row: {
          certificate_id: string | null
          created_at: string
          expires_at: string
          id: string
          notification_sent: boolean | null
          organization_id: string | null
          patient_id: string | null
        }
        Insert: {
          certificate_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          notification_sent?: boolean | null
          organization_id?: string | null
          patient_id?: string | null
        }
        Update: {
          certificate_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          notification_sent?: boolean | null
          organization_id?: string | null
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_expirations_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_expirations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_expirations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_expirations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          template_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          company_info: Json | null
          created_at: string
          document_id: string | null
          expiration_date: string | null
          fitness_declaration: Json | null
          followup_actions: Json | null
          id: string
          medical_tests: Json | null
          patient_info: Json | null
          restrictions: string[] | null
          updated_at: string
          validated: boolean | null
          vision_tests: Json | null
        }
        Insert: {
          company_info?: Json | null
          created_at?: string
          document_id?: string | null
          expiration_date?: string | null
          fitness_declaration?: Json | null
          followup_actions?: Json | null
          id?: string
          medical_tests?: Json | null
          patient_info?: Json | null
          restrictions?: string[] | null
          updated_at?: string
          validated?: boolean | null
          vision_tests?: Json | null
        }
        Update: {
          company_info?: Json | null
          created_at?: string
          document_id?: string | null
          expiration_date?: string | null
          fitness_declaration?: Json | null
          followup_actions?: Json | null
          id?: string
          medical_tests?: Json | null
          patient_info?: Json | null
          restrictions?: string[] | null
          updated_at?: string
          validated?: boolean | null
          vision_tests?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_organization_id: string | null
          created_at: string
          document_type: string | null
          extracted_data: Json | null
          file_name: string
          file_path: string
          id: string
          mime_type: string
          organization_id: string | null
          processed_at: string | null
          processing_error: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_organization_id?: string | null
          created_at?: string
          document_type?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          id?: string
          mime_type: string
          organization_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_organization_id?: string | null
          created_at?: string
          document_type?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string
          organization_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          category: string | null
          createdat: string
          description: string | null
          fields: Json
          id: string
          ispublished: boolean
          name: string
          organizationid: string
          updatedat: string
        }
        Insert: {
          category?: string | null
          createdat?: string
          description?: string | null
          fields: Json
          id?: string
          ispublished?: boolean
          name: string
          organizationid: string
          updatedat?: string
        }
        Update: {
          category?: string | null
          createdat?: string
          description?: string | null
          fields?: Json
          id?: string
          ispublished?: boolean
          name?: string
          organizationid?: string
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_organizationid_fkey"
            columns: ["organizationid"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_templates_organizationid_fkey"
            columns: ["organizationid"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          organization_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          organization_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          organization_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_relationships: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          relationship_start_date: string | null
          service_provider_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          relationship_start_date?: string | null
          service_provider_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          relationship_start_date?: string | null
          service_provider_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_relationships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_relationships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_relationships_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_relationships_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          organization_type: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          organization_type: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          organization_type?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          age_at_registration: number | null
          birthdate_from_id: string | null
          citizenship: string | null
          citizenship_status: string | null
          client_organization_id: string | null
          contact_info: Json | null
          created_at: string
          date_of_birth: string
          first_name: string
          gender: string | null
          gender_from_id: string | null
          id: string
          id_number: string | null
          id_number_valid: boolean | null
          id_number_validated: boolean | null
          last_name: string
          medical_history: Json | null
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          age_at_registration?: number | null
          birthdate_from_id?: string | null
          citizenship?: string | null
          citizenship_status?: string | null
          client_organization_id?: string | null
          contact_info?: Json | null
          created_at?: string
          date_of_birth: string
          first_name: string
          gender?: string | null
          gender_from_id?: string | null
          id?: string
          id_number?: string | null
          id_number_valid?: boolean | null
          id_number_validated?: boolean | null
          last_name: string
          medical_history?: Json | null
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          age_at_registration?: number | null
          birthdate_from_id?: string | null
          citizenship?: string | null
          citizenship_status?: string | null
          client_organization_id?: string | null
          contact_info?: Json | null
          created_at?: string
          date_of_birth?: string
          first_name?: string
          gender?: string | null
          gender_from_id?: string | null
          id?: string
          id_number?: string | null
          id_number_valid?: boolean | null
          id_number_validated?: boolean | null
          last_name?: string
          medical_history?: Json | null
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_documents: {
        Row: {
          created_at: string
          fileName: string | null
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          fileName?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string
          fileName?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      work_queue: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          priority: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      organization_details: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_audit_log: {
        Args: {
          p_action_type: string
          p_entity_type: string
          p_entity_id: string
          p_previous_state?: Json
          p_new_state?: Json
          p_organization_id?: string
        }
        Returns: string
      }
      add_user_to_organization: {
        Args: { user_id: string; org_id: string; user_role?: string }
        Returns: string
      }
      add_user_to_organization_via_profile: {
        Args: { user_id: string; org_id: string; user_role?: string }
        Returns: string
      }
      check_user_exists: {
        Args: { user_id: string }
        Returns: Json
      }
      create_auth_and_profile: {
        Args: { p_email: string; p_full_name?: string }
        Returns: string
      }
      create_client_organization: {
        Args: { org_name: string; org_email?: string }
        Returns: string
      }
      create_first_organization: {
        Args: { org_name: string; org_type: string; org_email?: string }
        Returns: string
      }
      create_user_profile: {
        Args: { user_id: string; email: string; full_name?: string }
        Returns: boolean
      }
      direct_insert_profile: {
        Args: { p_id: string; p_email: string; p_full_name?: string }
        Returns: undefined
      }
      force_insert_profile: {
        Args: { p_user_id: string; p_email: string; p_full_name?: string }
        Returns: boolean
      }
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      is_org_admin: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_belongs_to_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { org_id: string; required_role: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
