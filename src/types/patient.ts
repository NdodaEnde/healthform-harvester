import { Json } from "@/integrations/supabase/types";

export interface ContactInfo {
  email?: string;
  phone?: string;
  company?: string;
  occupation?: string;
  address?: string;
  employee_id?: string;
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

export interface Vitals {
  height?: string;
  weight?: string;
  bmi?: string;
  blood_pressure?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  temperature?: string;
  oxygen_saturation?: string;
}

export interface ExamResults {
  vision?: string;
  hearing?: string;
  lung_function?: string;
  chest_xray?: string;
  laboratory?: string;
}

export interface Assessment {
  diagnosis?: string;
  recommendations?: string;
  restrictions?: string;
  fitness_conclusion?: string;
  expired?: boolean;
  next_assessment?: string;
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
  surgeries?: string;
  family_history?: string;
  smoker?: boolean;
  alcohol_consumption?: string;
  exercise_frequency?: string;
  vitals?: Vitals;
  exam_results?: ExamResults;
  assessment?: Assessment;
  [key: string]: any;
}

export interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_info?: ContactInfo;
  medical_history?: MedicalHistoryData;
  organization_id?: string;
  client_organization_id?: string;
  created_at: string;
  updated_at: string;
  birthdate_from_id?: string | null;
  gender_from_id?: string | null;
  citizenship_status?: string | null;
  citizenship?: string | null;
  id_number?: string;
  id_number_valid?: boolean;
  age_at_registration?: number | null;
}

export interface CertificateData {
  structured_data?: {
    validation?: {
      date?: string;
    };
    certification?: {
      valid_until?: string;
      issue_date?: string;
      examination_date?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}
