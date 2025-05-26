
// TypeScript interfaces for the normalized database structure

export interface MyOrganizationType {
  id: number;
  type_name: string;
  description?: string;
  created_at: string;
}

export interface MyUserType {
  id: number;
  type_name: string;
  description?: string;
  created_at: string;
}

export interface MyDocumentType {
  id: number;
  type_name: string;
  description?: string;
  is_certificate: boolean;
  created_at: string;
}

export interface MyOrganization {
  id: string;
  name: string;
  organization_type_id: number;
  contact_email?: string;
  contact_phone?: string;
  address?: any;
  logo_url?: string;
  settings?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MyUser {
  id: string;
  email: string;
  full_name?: string;
  organization_id: string;
  user_type_id: number;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface MyPatient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  id_number?: string;
  client_organization_id: string;
  contact_info?: any;
  medical_history?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MyDocument {
  id: string;
  patient_id: string;
  document_type_id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: string;
  extracted_data?: any;
  processed_at?: string;
  processing_error?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MyOrganizationRelationship {
  id: string;
  service_provider_id: string;
  client_id: string;
  relationship_start_date?: string;
  relationship_end_date?: string;
  is_active: boolean;
  settings?: any;
  created_at: string;
  updated_at: string;
}

// Extended interfaces with joined data
export interface MyOrganizationWithType extends MyOrganization {
  organization_type?: MyOrganizationType;
}

export interface MyUserWithDetails extends MyUser {
  organization?: MyOrganization;
  user_type?: MyUserType;
}

export interface MyPatientWithOrganization extends MyPatient {
  client_organization?: MyOrganization;
}

export interface MyDocumentWithDetails extends MyDocument {
  patient?: MyPatient;
  document_type?: MyDocumentType;
  uploader?: MyUser;
}

export interface MyRelationshipWithOrganizations extends MyOrganizationRelationship {
  service_provider?: MyOrganization;
  client?: MyOrganization;
}
