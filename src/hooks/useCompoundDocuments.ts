
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface CompoundDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string;
  status: string;
  organization_id: string | null;
  client_organization_id: string | null;
  owner_id: string | null;
  user_id: string | null;
  public_url: string | null;
  total_pages: number;
  detected_sections: any[];
  processing_metadata: any;
  workflow_status: string;
  workflow_assignments: any;
  created_at: string;
  updated_at: string;
}

interface CompoundDocumentSection {
  id: string;
  compound_document_id: string;
  section_type: string;
  section_name: string;
  page_range: string | null;
  extracted_data: any;
  validation_status: string;
  validated_by: string | null;
  validated_at: string | null;
  processing_confidence: number | null;
  requires_review: boolean;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

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

      setDocuments(data || []);
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

  const createCompoundDocument = async (documentData: Partial<CompoundDocument>) => {
    const organizationId = getEffectiveOrganizationId();
    const { data: { user } } = await supabase.auth.getUser();

    if (!organizationId || !user) {
      throw new Error('Organization ID or user not found');
    }

    const { data, error } = await supabase
      .from('compound_documents')
      .insert({
        ...documentData,
        organization_id: organizationId,
        user_id: user.id,
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
      .update(updates)
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

      setSections(data || []);
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
