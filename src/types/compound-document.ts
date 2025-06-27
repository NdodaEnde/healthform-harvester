
// Type definitions for compound document system
export interface CompoundDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  organization_id: string | null;
  client_organization_id: string | null;
  owner_id: string | null; // Patient ID
  user_id: string | null; // Uploader
  public_url: string | null;
  total_pages: number;
  detected_sections: DetectedSection[];
  processing_metadata: Record<string, any>;
  workflow_status: WorkflowStatus;
  workflow_assignments: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CompoundDocumentSection {
  id: string;
  compound_document_id: string;
  section_type: SectionType;
  section_name: string;
  page_range: string | null; // e.g., "1-2" or "3"
  extracted_data: Record<string, any> | null;
  validation_status: 'pending' | 'validated' | 'requires_review';
  validated_by: string | null;
  validated_at: string | null;
  processing_confidence: number | null; // 0.00 to 1.00
  requires_review: boolean;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompoundDocumentWorkflow {
  id: string;
  compound_document_id: string;
  workflow_step: WorkflowStep;
  assigned_to: string | null;
  assigned_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DetectedSection {
  section_type: SectionType;
  section_name: string;
  page_range: string;
  confidence: number;
  extracted_content?: string;
}

export type SectionType = 
  | 'medical_questionnaire'
  | 'vision_test'
  | 'hearing_test'
  | 'lung_function'
  | 'physical_examination'
  | 'drug_screen'
  | 'x_ray_report'
  | 'fitness_declaration'
  | 'work_restrictions'
  | 'follow_up_recommendations';

export type WorkflowStatus = 
  | 'receptionist_review'
  | 'nurse_review'
  | 'tech_review'
  | 'doctor_approval'
  | 'completed'
  | 'rejected';

export type WorkflowStep = WorkflowStatus;

export interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  description: string;
  organization_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}
