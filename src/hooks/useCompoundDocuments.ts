
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { CompoundDocument, CompoundDocumentSection, DetectedSection } from '@/types/compound-document';

export function useCompoundDocuments() {
  const { getEffectiveOrganizationId } = useOrganization();
  const [documents, setDocuments] = useState<CompoundDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    const organizationId = getEffectiveOrganizationId();
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compound_documents')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching compound documents:', error);
        setError(error.message);
        return;
      }

      // Transform the data to match our TypeScript interface
      const transformedDocuments: CompoundDocument[] = (data || []).map(doc => ({
        ...doc,
        status: doc.status as CompoundDocument['status'],
        workflow_status: doc.workflow_status as CompoundDocument['workflow_status'],
        detected_sections: Array.isArray(doc.detected_sections) 
          ? (doc.detected_sections as unknown as DetectedSection[])
          : [],
        processing_metadata: (doc.processing_metadata as Record<string, any>) || {},
        workflow_assignments: (doc.workflow_assignments as Record<string, any>) || {}
      }));

      setDocuments(transformedDocuments);
      setError(null);
    } catch (err) {
      console.error('Error in fetchDocuments:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [getEffectiveOrganizationId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createCompoundDocument = async (documentData: {
    file_name: string;
    file_path: string;
    file_size?: number | null;
    mime_type: string;
    status?: string;
    client_organization_id?: string | null;
    owner_id?: string | null;
    public_url?: string | null;
    total_pages?: number;
    detected_sections?: DetectedSection[];
    processing_metadata?: Record<string, any>;
    workflow_status?: string;
    workflow_assignments?: Record<string, any>;
  }) => {
    const organizationId = getEffectiveOrganizationId();
    const { data: { user } } = await supabase.auth.getUser();

    if (!organizationId || !user) {
      throw new Error('Organization ID or user not found');
    }

    const { data, error } = await supabase
      .from('compound_documents')
      .insert({
        file_name: documentData.file_name,
        file_path: documentData.file_path,
        file_size: documentData.file_size,
        mime_type: documentData.mime_type,
        status: documentData.status || 'pending',
        organization_id: organizationId,
        client_organization_id: documentData.client_organization_id,
        owner_id: documentData.owner_id,
        user_id: user.id,
        public_url: documentData.public_url,
        total_pages: documentData.total_pages || 0,
        detected_sections: (documentData.detected_sections || []) as any,
        processing_metadata: (documentData.processing_metadata || {}) as any,
        workflow_status: documentData.workflow_status || 'receptionist_review',
        workflow_assignments: (documentData.workflow_assignments || {}) as any
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating compound document:', error);
      throw error;
    }

    await fetchDocuments();
    return data;
  };

  const updateCompoundDocument = async (id: string, updates: Partial<CompoundDocument>) => {
    const { data, error } = await supabase
      .from('compound_documents')
      .update({
        ...updates,
        detected_sections: updates.detected_sections as any,
        processing_metadata: updates.processing_metadata as any,
        workflow_assignments: updates.workflow_assignments as any
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating compound document:', error);
      throw error;
    }

    await fetchDocuments();
    return data;
  };

  const deleteCompoundDocument = async (id: string) => {
    const { error } = await supabase
      .from('compound_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting compound document:', error);
      throw error;
    }

    await fetchDocuments();
  };

  return {
    documents,
    loading,
    error,
    createCompoundDocument,
    updateCompoundDocument,
    deleteCompoundDocument,
    refreshDocuments: fetchDocuments
  };
}

export function useCompoundDocumentSections(compoundDocumentId: string | null) {
  const [sections, setSections] = useState<CompoundDocumentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = useCallback(async () => {
    if (!compoundDocumentId) {
      setSections([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compound_document_sections')
        .select('*')
        .eq('compound_document_id', compoundDocumentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching compound document sections:', error);
        setError(error.message);
        return;
      }

      // Transform the data to match our TypeScript interface
      const transformedSections: CompoundDocumentSection[] = (data || []).map(section => ({
        ...section,
        section_type: section.section_type as CompoundDocumentSection['section_type'],
        validation_status: section.validation_status as CompoundDocumentSection['validation_status'],
        extracted_data: section.extracted_data as Record<string, any> | null
      }));

      setSections(transformedSections);
      setError(null);
    } catch (err) {
      console.error('Error in fetchSections:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [compoundDocumentId]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  return {
    sections,
    loading,
    error,
    refreshSections: fetchSections
  };
}
