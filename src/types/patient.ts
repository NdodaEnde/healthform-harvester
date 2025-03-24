
import { Json } from "@/integrations/supabase/types";

export interface ContactInfo {
  email?: string;
  phone?: string;
  company?: string;
  occupation?: string;
  address?: string;
  [key: string]: any;
}

export interface MedicalCondition {
  name: string;
  diagnosed_date?: string;
  notes?: string;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
}

export interface Allergy {
  allergen: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
}

export interface MedicalHistoryData {
  conditions?: MedicalCondition[];
  medications?: Medication[];
  allergies?: Allergy[];
  has_hypertension?: boolean;
  has_diabetes?: boolean;
  has_heart_disease?: boolean;
  has_allergies?: boolean;
  notes?: string;
  documents?: Array<{
    document_id: string;
    document_type: string;
    processed_at: string;
  }>;
  [key: string]: any;
}

export interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  contact_info?: ContactInfo | Json | null;
  medical_history?: MedicalHistoryData | Json | null;
  organization_id?: string;
  client_organization_id?: string | null;
  created_at: string;
  updated_at: string;
}
