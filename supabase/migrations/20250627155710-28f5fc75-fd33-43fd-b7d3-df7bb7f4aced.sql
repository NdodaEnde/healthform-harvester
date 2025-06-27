
-- Phase 1: Foundation Setup - Compound Document Infrastructure
-- This adds new tables and functionality alongside existing systems

-- Create compound documents table for multi-section medical files
CREATE TABLE public.compound_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  organization_id UUID,
  client_organization_id UUID,
  owner_id UUID, -- Patient ID
  user_id UUID, -- Uploader
  public_url TEXT,
  total_pages INTEGER DEFAULT 0,
  detected_sections JSONB DEFAULT '[]'::jsonb,
  processing_metadata JSONB DEFAULT '{}'::jsonb,
  workflow_status TEXT DEFAULT 'receptionist_review',
  workflow_assignments JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create compound document sections table for individual sections within compound docs
CREATE TABLE public.compound_document_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compound_document_id UUID NOT NULL REFERENCES public.compound_documents(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- 'medical_questionnaire', 'vision_test', 'hearing_test', etc.
  section_name TEXT NOT NULL,
  page_range TEXT, -- e.g., "1-2" or "3"
  extracted_data JSONB,
  validation_status TEXT DEFAULT 'pending',
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  processing_confidence DECIMAL(3,2), -- 0.00 to 1.00
  requires_review BOOLEAN DEFAULT false,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow tracking table for compound document approval process
CREATE TABLE public.compound_document_workflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compound_document_id UUID NOT NULL REFERENCES public.compound_documents(id) ON DELETE CASCADE,
  workflow_step TEXT NOT NULL, -- 'receptionist_review', 'nurse_review', 'tech_review', 'doctor_approval'
  assigned_to UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected'
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature flags table for controlled rollout
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  organization_id UUID, -- NULL means global flag
  user_id UUID, -- NULL means applies to all users in org
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial feature flags for compound document system
INSERT INTO public.feature_flags (flag_name, is_enabled, description) VALUES 
('compound_documents_enabled', false, 'Enable compound document processing system'),
('compound_document_upload', false, 'Enable compound document upload interface'),
('workflow_management', false, 'Enable workflow management for compound documents'),
('ai_section_detection', false, 'Enable AI-powered section detection');

-- Create indexes for performance
CREATE INDEX idx_compound_documents_org ON public.compound_documents(organization_id, client_organization_id);
CREATE INDEX idx_compound_documents_status ON public.compound_documents(status, workflow_status);
CREATE INDEX idx_compound_document_sections_compound_id ON public.compound_document_sections(compound_document_id);
CREATE INDEX idx_compound_document_workflow_compound_id ON public.compound_document_workflow(compound_document_id);
CREATE INDEX idx_compound_document_workflow_assigned ON public.compound_document_workflow(assigned_to, status);
CREATE INDEX idx_feature_flags_name ON public.feature_flags(flag_name);

-- Enable RLS on all new tables
ALTER TABLE public.compound_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compound_document_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compound_document_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic organization-based access)
CREATE POLICY "compound_documents_org_access" ON public.compound_documents
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid()
    ) OR
    client_organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "compound_document_sections_org_access" ON public.compound_document_sections
  FOR ALL USING (
    compound_document_id IN (
      SELECT id FROM public.compound_documents cd
      WHERE cd.organization_id IN (
        SELECT organization_id FROM public.organization_users 
        WHERE user_id = auth.uid()
      ) OR cd.client_organization_id IN (
        SELECT organization_id FROM public.organization_users 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "compound_document_workflow_org_access" ON public.compound_document_workflow
  FOR ALL USING (
    compound_document_id IN (
      SELECT id FROM public.compound_documents cd
      WHERE cd.organization_id IN (
        SELECT organization_id FROM public.organization_users 
        WHERE user_id = auth.uid()
      ) OR cd.client_organization_id IN (
        SELECT organization_id FROM public.organization_users 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "feature_flags_org_access" ON public.feature_flags
  FOR SELECT USING (
    organization_id IS NULL OR 
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to check if feature flag is enabled
CREATE OR REPLACE FUNCTION public.is_feature_enabled(flag_name TEXT, org_id UUID DEFAULT NULL, user_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check user-specific flag first
  IF user_id_param IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.feature_flags 
      WHERE feature_flags.flag_name = is_feature_enabled.flag_name 
      AND feature_flags.user_id = user_id_param 
      AND is_enabled = true
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Check organization-specific flag
  IF org_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.feature_flags 
      WHERE feature_flags.flag_name = is_feature_enabled.flag_name 
      AND feature_flags.organization_id = org_id 
      AND is_enabled = true
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Check global flag
  RETURN COALESCE(
    (SELECT is_enabled FROM public.feature_flags 
     WHERE feature_flags.flag_name = is_feature_enabled.flag_name 
     AND organization_id IS NULL 
     AND user_id IS NULL),
    false
  );
END;
$$;
