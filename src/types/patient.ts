
import { Json } from "@/integrations/supabase/types";

export interface ContactInfo {
  email?: string;
  phone?: string;
  company?: string;
  occupation?: string;
  address?: string;
  employee_id?: string;
  citizenship?: string;  // Still keep this for backward compatibility
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
  gender: string | null;
  contact_info?: ContactInfo | null;
  medical_history?: MedicalHistoryData | null;
  organization_id?: string;
  client_organization_id?: string | null;
  created_at: string;
  updated_at: string;
  citizenship?: string | null;
  age_at_registration?: number | null;
  id_number_validated?: boolean | null;
}

// Define more specific types for certificate data
export interface CertificateStructuredData {
  validation?: {
    date?: string;
  };
  certification?: {
    valid_until?: string;
    issue_date?: string;
    examination_date?: string;
    fit?: boolean;
    fit_with_restrictions?: boolean;
    temporarily_unfit?: boolean;
    unfit?: boolean;
    comments?: string;
    [key: string]: any;
  };
  patient?: {
    name?: string;
    gender?: string;
    employee_id?: string;
    citizenship?: string;
    company?: string;
    occupation?: string;
    [key: string]: any;
  };
  examination_results?: {
    fitness_status?: string;
    date?: string;
    test_results?: {
      [key: string]: any;
    };
    [key: string]: any;
  };
  restrictions?: {
    [key: string]: boolean;
  };
  [key: string]: any;
}

export interface CertificateData {
  structured_data?: CertificateStructuredData;
  patient_info?: {
    id?: string;
    name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Helper function to safely parse Json data
 * @param jsonData - Raw Json data from Supabase
 * @returns Properly typed CertificateData
 */
export function parseCertificateData(jsonData: Json | null): CertificateData {
  if (!jsonData) return {};
  
  if (typeof jsonData === 'string') {
    try {
      return JSON.parse(jsonData) as CertificateData;
    } catch (e) {
      console.error('Failed to parse JSON string:', e);
      return {};
    }
  }
  
  return jsonData as unknown as CertificateData;
}
