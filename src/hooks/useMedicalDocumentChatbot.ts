
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

interface MedicalChatRequest {
  query: string;
  maxResults?: number;
}

interface SupportingDocument {
  document_key: string;
  filename: string;
  patient_name?: string;
  relevant_findings: string[];
  confidence: number;
  validation_status: string;
}

interface MedicalChatResponse {
  success: boolean;
  answer: string;
  reasoning: string;
  supporting_documents: SupportingDocument[];
  medical_summary?: string;
  recommendations?: string[];
  documentCount: number;
  searchType: string;
  suggestedQueries: string[];
  error?: string;
  hint?: string;
}

export const useMedicalDocumentChatbot = () => {
  const { getEffectiveOrganizationId, currentOrganization, clientOrganizations } = useOrganization();

  return useMutation({
    mutationFn: async ({ query, maxResults = 20 }: MedicalChatRequest): Promise<MedicalChatResponse> => {
      const organizationId = getEffectiveOrganizationId();
      
      if (!organizationId) {
        throw new Error('No organization selected');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      let clientOrganizationIds: string[] = [];
      
      if (currentOrganization?.organization_type === 'service_provider') {
        clientOrganizationIds = clientOrganizations.map(client => client.id);
      } else {
        clientOrganizationIds = [organizationId];
      }

      const userContext = {
        userId: user.id,
        organizationId: organizationId,
        clientOrganizationIds: clientOrganizationIds,
        role: 'user'
      };

      console.log('Sending medical chat request:', { query, userContext });

      const { data, error } = await supabase.functions.invoke('medical-document-chatbot', {
        body: {
          query,
          userContext,
          maxResults
        }
      });

      if (error) {
        console.error('Medical chatbot error:', error);
        throw error;
      }

      return data;
    },
    onError: (error) => {
      console.error('Medical document chatbot error:', error);
    }
  });
};

export const useMedicalDocumentStats = () => {
  const { getEffectiveOrganizationId, currentOrganization, clientOrganizations } = useOrganization();

  return useQuery({
    queryKey: ['medical-document-stats', getEffectiveOrganizationId()],
    queryFn: async () => {
      const organizationId = getEffectiveOrganizationId();
      
      if (!organizationId) {
        throw new Error('No organization selected');
      }

      let orgFilter;
      if (currentOrganization?.organization_type === 'service_provider') {
        const clientIds = clientOrganizations.map(client => client.id).join(',');
        orgFilter = `organization_id.eq.${organizationId},client_organization_id.in.(${clientIds})`;
      } else {
        orgFilter = `organization_id.eq.${organizationId}`;
      }

      // Get document counts by validation status
      const { data: documents } = await supabase
        .from('documents')
        .select('validation_status, document_type, created_at')
        .or(orgFilter)
        .not('extracted_data', 'is', null);

      // Get recent medical examinations count
      const { data: examinations } = await supabase
        .from('medical_examinations')
        .select('fitness_status, examination_date')
        .or(orgFilter)
        .gte('examination_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

      // Calculate statistics
      const stats = {
        totalDocuments: documents?.length || 0,
        validatedDocuments: documents?.filter(d => d.validation_status === 'validated').length || 0,
        pendingDocuments: documents?.filter(d => d.validation_status === 'pending').length || 0,
        recentExaminations: examinations?.length || 0,
        complianceRate: examinations?.length > 0 
          ? Math.round((examinations.filter(e => e.fitness_status === 'fit').length / examinations.length) * 100)
          : 0
      };

      return stats;
    },
    enabled: !!getEffectiveOrganizationId(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMedicalQuerySuggestions = () => {
  const { getEffectiveOrganizationId, currentOrganization, clientOrganizations } = useOrganization();

  return useQuery({
    queryKey: ['medical-query-suggestions', getEffectiveOrganizationId()],
    queryFn: async () => {
      const organizationId = getEffectiveOrganizationId();
      
      if (!organizationId) {
        return [];
      }

      let orgFilter;
      if (currentOrganization?.organization_type === 'service_provider') {
        const clientIds = clientOrganizations.map(client => client.id).join(',');
        orgFilter = `organization_id.eq.${organizationId},client_organization_id.in.(${clientIds})`;
      } else {
        orgFilter = `organization_id.eq.${organizationId}`;
      }

      // Get sample of document types and medical data to generate contextual suggestions
      const { data: documents } = await supabase
        .from('documents')
        .select('document_type, extracted_data')
        .or(orgFilter)
        .eq('validation_status', 'validated')
        .not('extracted_data', 'is', null)
        .limit(20);

      // Analyze available medical data to generate contextual suggestions
      const suggestions = [];
      const medicalTerms = new Set();

      documents?.forEach(doc => {
        // Extract medical terms from structured data
        if (doc.extracted_data?.structured_data) {
          const content = JSON.stringify(doc.extracted_data.structured_data).toLowerCase();
          
          // Look for common medical test types
          if (content.includes('vision')) medicalTerms.add('vision');
          if (content.includes('hearing')) medicalTerms.add('hearing');
          if (content.includes('drug') || content.includes('screen')) medicalTerms.add('drug screening');
          if (content.includes('blood')) medicalTerms.add('blood tests');
          if (content.includes('pressure')) medicalTerms.add('blood pressure');
        }
      });

      // Generate contextual suggestions
      if (medicalTerms.has('vision')) {
        suggestions.push("Show me all vision test results");
        suggestions.push("Which workers need vision correction?");
      }
      
      if (medicalTerms.has('hearing')) {
        suggestions.push("Find workers with hearing test results");
        suggestions.push("Show me hearing protection recommendations");
      }
      
      if (medicalTerms.has('drug screening')) {
        suggestions.push("What are the drug screening results?");
        suggestions.push("Show me workers with positive drug tests");
      }

      // Add general suggestions
      suggestions.push(
        "Show me workers who need follow-up care",
        "Find expired medical certificates",
        "Which workers have fitness restrictions?",
        "Show me recent medical examinations",
        "Find workers with medical conditions"
      );

      return suggestions.slice(0, 8); // Return top 8 suggestions
    },
    enabled: !!getEffectiveOrganizationId(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
