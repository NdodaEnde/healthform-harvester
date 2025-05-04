export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          access_type: string | null
          content: string | null
          created_at: string
          id: string
          name: string | null
          organization_id: string | null
          owner_id: string | null
          patient_id: string | null
        }
        Insert: {
          access_type?: string | null
          content?: string | null
          created_at?: string
          id?: string
          name?: string | null
          organization_id?: string | null
          owner_id?: string | null
          patient_id?: string | null
        }
        Update: {
          access_type?: string | null
          content?: string | null
          created_at?: string
          id?: string
          name?: string | null
          organization_id?: string | null
          owner_id?: string | null
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_relationships: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          relationship_start_date: string | null
          service_provider_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          relationship_start_date?: string | null
          service_provider_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          relationship_start_date?: string | null
          service_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_relationships_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_relationships_service_provider_id_fkey"
            columns: ["service_provider_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          branding: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          organization_type: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          branding?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          organization_type?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          branding?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          organization_type?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: Json | null
          birthdate: string | null
          created_at: string
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          phone_number: string | null
        }
        Insert: {
          address?: Json | null
          birthdate?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          phone_number?: string | null
        }
        Update: {
          address?: Json | null
          birthdate?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_client_organization: {
        Args: {
          org_name: string
          org_email?: string
        }
        Returns: string
      }
      create_first_organization: {
        Args: {
          org_name: string
          org_type: string
          org_email?: string
        }
        Returns: string
      }
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      is_org_admin: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_belongs_to_organization: {
        Args: {
          org_id: string
        }
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
