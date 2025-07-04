
// Shared database types for consistent typing across components
export interface DatabasePatient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  birthdate_from_id?: string; // Added this field
  gender?: string;
  gender_from_id?: string; // Added this field
  id_number?: string;
  id_number_valid?: boolean; // Added this field
  citizenship_status?: string; // Added this field
  created_at: string;
  updated_at: string;
  organization_id?: string;
  client_organization_id?: string;
  contact_info?: any;
  medical_history?: any;
}

export interface DatabaseDocument {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  document_type?: string;
  processed_at?: string;
  created_at: string;
  extracted_data?: any;
  owner_id?: string;
  organization_id?: string;
  client_organization_id?: string;
  mime_type: string;
  file_size?: number;
  public_url?: string;
  validation_status?: string;
  validated_by?: string; // UUID of the user who validated the document
}

export interface DatabaseOrganization {
  id: string;
  name: string;
  organization_type: string;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
  updated_at?: string;
  logo_url?: string;
  address?: any;
  settings?: any;
}
