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
      certificates: {
        Row: {
          company_info: Json | null
          created_at: string
          document_id: string | null
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
          created_at: string
          document_type: string | null
          extracted_data: Json | null
          file_name: string
          file_path: string
          id: string
          mime_type: string
          processed_at: string | null
          processing_error: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          id?: string
          mime_type: string
          processed_at?: string | null
          processing_error?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string
          processed_at?: string | null
          processing_error?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          contact_info: Json | null
          created_at: string
          date_of_birth: string
          first_name: string
          gender: string | null
          id: string
          last_name: string
          medical_history: Json | null
          updated_at: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string
          date_of_birth: string
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          medical_history?: Json | null
          updated_at?: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string
          date_of_birth?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          medical_history?: Json | null
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
