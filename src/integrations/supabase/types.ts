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
      certificate_compliance: {
        Row: {
          client_organization_id: string | null
          compliance_notes: string | null
          current_examination_id: string | null
          current_expiry_date: string | null
          current_fitness_status: string | null
          days_until_expiry: number | null
          id: string
          is_compliant: boolean | null
          next_exit_due: string | null
          next_periodic_due: string | null
          organization_id: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          client_organization_id?: string | null
          compliance_notes?: string | null
          current_examination_id?: string | null
          current_expiry_date?: string | null
          current_fitness_status?: string | null
          days_until_expiry?: number | null
          id?: string
          is_compliant?: boolean | null
          next_exit_due?: string | null
          next_periodic_due?: string | null
          organization_id?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          client_organization_id?: string | null
          compliance_notes?: string | null
          current_examination_id?: string | null
          current_expiry_date?: string | null
          current_fitness_status?: string | null
          days_until_expiry?: number | null
          id?: string
          is_compliant?: boolean | null
          next_exit_due?: string | null
          next_periodic_due?: string | null
          organization_id?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_compliance_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_current_examination_id_fkey"
            columns: ["current_examination_id"]
            isOneToOne: false
            referencedRelation: "medical_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "v_patient_test_history"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      certificate_compliance_backup: {
        Row: {
          client_organization_id: string | null
          compliance_notes: string | null
          current_examination_id: string | null
          current_expiry_date: string | null
          current_fitness_status: string | null
          days_until_expiry: number | null
          id: string | null
          is_compliant: boolean | null
          next_exit_due: string | null
          next_periodic_due: string | null
          organization_id: string | null
          patient_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_organization_id?: string | null
          compliance_notes?: string | null
          current_examination_id?: string | null
          current_expiry_date?: string | null
          current_fitness_status?: string | null
          days_until_expiry?: number | null
          id?: string | null
          is_compliant?: boolean | null
          next_exit_due?: string | null
          next_periodic_due?: string | null
          organization_id?: string | null
          patient_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_organization_id?: string | null
          compliance_notes?: string | null
          current_examination_id?: string | null
          current_expiry_date?: string | null
          current_fitness_status?: string | null
          days_until_expiry?: number | null
          id?: string | null
          is_compliant?: boolean | null
          next_exit_due?: string | null
          next_periodic_due?: string | null
          organization_id?: string | null
          patient_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "certificate_expirations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_test_history"
            referencedColumns: ["patient_id"]
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
          {
            foreignKeyName: "certificates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "potentially_mislinked_documents"
            referencedColumns: ["document_id"]
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
          file_size: number | null
          id: string
          mime_type: string
          organization_id: string | null
          owner_id: string | null
          processed_at: string | null
          processing_error: string | null
          public_url: string | null
          status: string
          updated_at: string
          user_id: string | null
          validated_by: string | null
          validation_status: string | null
        }
        Insert: {
          client_organization_id?: string | null
          created_at?: string
          document_type?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type: string
          organization_id?: string | null
          owner_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          public_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          validated_by?: string | null
          validation_status?: string | null
        }
        Update: {
          client_organization_id?: string | null
          created_at?: string
          document_type?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string
          organization_id?: string | null
          owner_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          public_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          validated_by?: string | null
          validation_status?: string | null
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
      documents_backup: {
        Row: {
          client_organization_id: string | null
          created_at: string | null
          document_type: string | null
          extracted_data: Json | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string | null
          mime_type: string | null
          organization_id: string | null
          owner_id: string | null
          processed_at: string | null
          processing_error: string | null
          public_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          validated_by: string | null
          validation_status: string | null
        }
        Insert: {
          client_organization_id?: string | null
          created_at?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string | null
          mime_type?: string | null
          organization_id?: string | null
          owner_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          public_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          validated_by?: string | null
          validation_status?: string | null
        }
        Update: {
          client_organization_id?: string | null
          created_at?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string | null
          mime_type?: string | null
          organization_id?: string | null
          owner_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          public_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          validated_by?: string | null
          validation_status?: string | null
        }
        Relationships: []
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
      medical_examinations: {
        Row: {
          client_organization_id: string | null
          comments: string | null
          company_name: string | null
          created_at: string
          document_id: string | null
          examination_date: string
          examination_type: string
          expiry_date: string | null
          fitness_status: string
          follow_up_actions: string | null
          id: string
          job_title: string | null
          organization_id: string | null
          patient_id: string
          restrictions: string[] | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          client_organization_id?: string | null
          comments?: string | null
          company_name?: string | null
          created_at?: string
          document_id?: string | null
          examination_date: string
          examination_type: string
          expiry_date?: string | null
          fitness_status: string
          follow_up_actions?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string | null
          patient_id: string
          restrictions?: string[] | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          client_organization_id?: string | null
          comments?: string | null
          company_name?: string | null
          created_at?: string
          document_id?: string | null
          examination_date?: string
          examination_type?: string
          expiry_date?: string | null
          fitness_status?: string
          follow_up_actions?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string | null
          patient_id?: string
          restrictions?: string[] | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "potentially_mislinked_documents"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_test_history"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      medical_test_results: {
        Row: {
          created_at: string
          examination_id: string
          id: string
          notes: string | null
          test_done: boolean
          test_result: string | null
          test_type: string
        }
        Insert: {
          created_at?: string
          examination_id: string
          id?: string
          notes?: string | null
          test_done?: boolean
          test_result?: string | null
          test_type: string
        }
        Update: {
          created_at?: string
          examination_id?: string
          id?: string
          notes?: string | null
          test_done?: boolean
          test_result?: string | null
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_test_results_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "medical_examinations"
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
          signature_url: string | null
          stamp_url: string | null
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
          signature_url?: string | null
          stamp_url?: string | null
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
          signature_url?: string | null
          stamp_url?: string | null
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
      task_templates: {
        Row: {
          auto_assign_rules: Json | null
          created_at: string | null
          description: string | null
          estimated_duration: unknown | null
          id: string
          name: string
          organization_id: string | null
          priority: string
          template_data: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_assign_rules?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: unknown | null
          id?: string
          name: string
          organization_id?: string | null
          priority: string
          template_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_assign_rules?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: unknown | null
          id?: string
          name?: string
          organization_id?: string | null
          priority?: string
          template_data?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_queue: {
        Row: {
          assigned_to: string | null
          compliance_deadline: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_duration: unknown | null
          generated_from_analytics: boolean | null
          id: string
          organization_id: string | null
          priority: string
          related_entity_id: string | null
          related_entity_type: string | null
          risk_score: string | null
          status: string
          task_template_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          compliance_deadline?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_duration?: unknown | null
          generated_from_analytics?: boolean | null
          id?: string
          organization_id?: string | null
          priority: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          risk_score?: string | null
          status?: string
          task_template_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          compliance_deadline?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_duration?: unknown | null
          generated_from_analytics?: boolean | null
          id?: string
          organization_id?: string | null
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          risk_score?: string | null
          status?: string
          task_template_id?: string | null
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
      potentially_mislinked_documents: {
        Row: {
          document_id: string | null
          file_name: string | null
          filename_id_number: string | null
          first_name: string | null
          last_linked: string | null
          last_name: string | null
          match_status: string | null
          owner_id: string | null
          patient_id_number: string | null
          surname_patient_count: number | null
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
      v_certificate_compliance_live: {
        Row: {
          client_organization_id: string | null
          compliance_notes: string | null
          current_examination_id: string | null
          current_expiry_date: string | null
          current_fitness_status: string | null
          days_until_expiry: number | null
          expiry_status: string | null
          id: string | null
          is_compliant: boolean | null
          live_days_until_expiry: number | null
          live_is_compliant: boolean | null
          next_exit_due: string | null
          next_periodic_due: string | null
          organization_id: string | null
          patient_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_organization_id?: string | null
          compliance_notes?: string | null
          current_examination_id?: string | null
          current_expiry_date?: string | null
          current_fitness_status?: string | null
          days_until_expiry?: number | null
          expiry_status?: never
          id?: string | null
          is_compliant?: boolean | null
          live_days_until_expiry?: never
          live_is_compliant?: never
          next_exit_due?: string | null
          next_periodic_due?: string | null
          organization_id?: string | null
          patient_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_organization_id?: string | null
          compliance_notes?: string | null
          current_examination_id?: string | null
          current_expiry_date?: string | null
          current_fitness_status?: string | null
          days_until_expiry?: number | null
          expiry_status?: never
          id?: string | null
          is_compliant?: boolean | null
          live_days_until_expiry?: never
          live_is_compliant?: never
          next_exit_due?: string | null
          next_periodic_due?: string | null
          organization_id?: string | null
          patient_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_compliance_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_current_examination_id_fkey"
            columns: ["current_examination_id"]
            isOneToOne: false
            referencedRelation: "medical_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_compliance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "v_patient_test_history"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      v_company_health_benchmarks: {
        Row: {
          avg_cert_duration_days: number | null
          client_organization_id: string | null
          company_name: string | null
          expired_count: number | null
          expiring_soon_count: number | null
          fit_count: number | null
          fit_with_restrictions_count: number | null
          fitness_rate: number | null
          organization_id: string | null
          total_completed_tests: number | null
          total_employees: number | null
          total_examinations: number | null
          total_tests_ordered: number | null
          unfit_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_current_org_dashboard: {
        Row: {
          client_name: string | null
          compliance_rate: number | null
          compliant_patients: number | null
          data_quality_status: string | null
          expired_patients: number | null
          expiring_30_days: number | null
          missing_compliance_records: number | null
          pending_documents: number | null
          system_health_percentage: number | null
          tests_this_month: number | null
          total_patients: number | null
        }
        Relationships: []
      }
      v_dashboard_all_clients: {
        Row: {
          client_name: string | null
          compliance_rate: number | null
          compliant_patients: number | null
          expired_patients: number | null
          expiring_30_days: number | null
          missing_compliance_records: number | null
          pending_documents: number | null
          system_health_percentage: number | null
          tests_this_month: number | null
          total_patients: number | null
        }
        Relationships: []
      }
      v_dashboard_rsc: {
        Row: {
          client_name: string | null
          compliance_rate: number | null
          compliant_patients: number | null
          expired_patients: number | null
          expiring_30_days: number | null
          missing_compliance_records: number | null
          pending_documents: number | null
          system_health_percentage: number | null
          tests_this_month: number | null
          total_patients: number | null
        }
        Relationships: []
      }
      v_dashboard_she_group: {
        Row: {
          client_name: string | null
          compliance_rate: number | null
          compliant_patients: number | null
          expired_patients: number | null
          expiring_30_days: number | null
          missing_compliance_records: number | null
          pending_documents: number | null
          system_health_percentage: number | null
          tests_this_month: number | null
          total_patients: number | null
        }
        Relationships: []
      }
      v_executive_summary: {
        Row: {
          abnormal_rate: number | null
          certificates_expired: number | null
          certificates_expiring_soon: number | null
          client_organization_id: string | null
          drug_screen_tests: number | null
          earliest_examination: string | null
          health_score: number | null
          hearing_tests: number | null
          heights_tests: number | null
          latest_examination: string | null
          lung_function_tests: number | null
          organization_id: string | null
          overall_completion_rate: number | null
          total_abnormal_results: number | null
          total_companies: number | null
          total_examinations: number | null
          total_fit: number | null
          total_patients: number | null
          total_tests_completed: number | null
          total_tests_conducted: number | null
          vision_tests: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_executive_summary_refined: {
        Row: {
          client_organization_id: string | null
          drug_screen_tests: number | null
          earliest_examination: string | null
          health_score: number | null
          hearing_tests: number | null
          heights_tests: number | null
          high_risk_results: number | null
          latest_examination: string | null
          low_risk_results: number | null
          lung_function_tests: number | null
          medium_risk_results: number | null
          organization_id: string | null
          overall_completion_rate: number | null
          policy_violations: number | null
          total_companies: number | null
          total_examinations: number | null
          total_fit: number | null
          total_patients: number | null
          total_tests_completed: number | null
          total_tests_conducted: number | null
          vision_tests: number | null
          workers_may_need_vision_correction: number | null
          workers_need_hearing_protection: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_monthly_test_trends: {
        Row: {
          abnormal_count: number | null
          abnormal_rate: number | null
          client_organization_id: string | null
          completed_count: number | null
          completion_rate: number | null
          organization_id: string | null
          test_count: number | null
          test_month: string | null
          test_type: string | null
          unique_companies: number | null
          unique_patients_tested: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_patient_test_history: {
        Row: {
          client_organization_id: string | null
          company_name: string | null
          examination_date: string | null
          expired: boolean | null
          expiring_soon: boolean | null
          expiry_date: string | null
          fitness_status: string | null
          id_number: string | null
          job_title: string | null
          notes: string | null
          organization_id: string | null
          patient_id: string | null
          patient_name: string | null
          test_done: boolean | null
          test_result: string | null
          test_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_risk_assessment_matrix: {
        Row: {
          avg_days_since_test: number | null
          client_organization_id: string | null
          company_name: string | null
          job_title: string | null
          organization_id: string | null
          risk_level: string | null
          test_count: number | null
          test_result: string | null
          test_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_risk_assessment_matrix_refined: {
        Row: {
          client_organization_id: string | null
          company_name: string | null
          job_title: string | null
          organization_id: string | null
          risk_explanation: string | null
          risk_level: string | null
          test_count: number | null
          test_result: string | null
          test_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_test_results_summary: {
        Row: {
          abnormal_count: number | null
          abnormal_rate: number | null
          client_organization_id: string | null
          completed_tests: number | null
          completion_rate: number | null
          earliest_test_date: string | null
          latest_test_date: string | null
          organization_id: string | null
          test_type: string | null
          total_tests: number | null
          unique_patients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_examinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      backfill_medical_test_results: {
        Args: Record<PropertyKey, never>
        Returns: {
          examination_id: string
          tests_extracted: number
        }[]
      }
      check_analytics_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          status: string
          details: string
        }[]
      }
      check_user_exists: {
        Args: { user_id: string }
        Returns: Json
      }
      create_analytics_indexes: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_auth_and_profile: {
        Args: { p_email: string; p_full_name?: string }
        Returns: string
      }
      create_basic_analytics_view: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_client_organization: {
        Args:
          | { org_name: string; org_email?: string }
          | {
              organization_name: string
              contact_email?: string
              service_provider_id?: string
            }
        Returns: string
      }
      create_first_organization: {
        Args: { org_name: string; org_type: string; org_email?: string }
        Returns: string
      }
      create_organization_relationship: {
        Args: { provider_id: string; client_id: string }
        Returns: Json
      }
      create_user_profile: {
        Args: { user_id: string; email: string; full_name?: string }
        Returns: boolean
      }
      direct_insert_profile: {
        Args: { p_id: string; p_email: string; p_full_name?: string }
        Returns: undefined
      }
      extract_medical_test_results: {
        Args: { p_examination_id: string; p_extracted_data: Json }
        Returns: number
      }
      force_insert_profile: {
        Args: { p_user_id: string; p_email: string; p_full_name?: string }
        Returns: boolean
      }
      generate_compliance_tasks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_risk_followup_tasks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_basic_analytics: {
        Args: { org_id: string }
        Returns: {
          total_patients: number
          total_companies: number
          total_examinations: number
          total_fit: number
          overall_completion_rate: number
          current_month_tests: number
          expiring_certificates: number
          total_restricted: number
          recent_activity_count: number
        }[]
      }
      get_basic_analytics_fallback: {
        Args: { org_id: string }
        Returns: {
          total_patients: number
          total_companies: number
          total_examinations: number
          total_fit: number
          overall_completion_rate: number
          current_month_tests: number
          expiring_certificates: number
          total_restricted: number
          recent_activity_count: number
        }[]
      }
      get_client_organizations: {
        Args: { provider_id: string }
        Returns: Json
      }
      get_dashboard_metrics_for_client: {
        Args: { service_provider_id?: string; target_client_id?: string }
        Returns: {
          total_patients: number
          compliant_patients: number
          expired_patients: number
          expiring_30_days: number
          compliance_rate: number
          pending_documents: number
          system_health_percentage: number
          tests_this_month: number
          client_name: string
          missing_compliance_records: number
        }[]
      }
      get_service_provider_organizations: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      setup_basic_analytics: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      upsert_medical_examination: {
        Args: {
          p_patient_id: string
          p_document_id: string
          p_organization_id: string
          p_examination_date: string
          p_examination_type: string
          p_fitness_status: string
          p_company_name: string
          p_job_title: string
          p_client_organization_id?: string
          p_expiry_date?: string
          p_restrictions?: string[]
          p_follow_up_actions?: string
          p_comments?: string
        }
        Returns: {
          id: string
        }[]
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
