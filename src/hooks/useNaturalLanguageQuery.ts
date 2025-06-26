
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  queryExplanation?: string;
  executedSQL?: string;
  searchType?: 'structured' | 'semantic';
  suggestedQueries?: string[];
  error?: string;
  hint?: string;
  dataQuality?: {
    validatedResults: number;
    unvalidatedResults: number;
    qualityScore: number;
    warning?: string;
  };
  dataProfile?: {
    validation_rate: number;
    total_documents: number;
    available_data?: {
      fitness_statuses: string[];
      test_types: string[];
      examination_types: string[];
    };
  };
  recommendation?: string;
}

interface UserContext {
  userId: string;
  organizationId: string;
  clientOrganizationIds: string[];
  role: string;
}

export function useNaturalLanguageQuery() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<QueryResult | null>(null);
  const { getEffectiveOrganizationId, currentOrganization, clientOrganizations } = useOrganization();

  const executeQuery = useCallback(async (query: string): Promise<QueryResult> => {
    setIsLoading(true);
    
    try {
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
        console.log('Service provider - client org IDs:', clientOrganizationIds);
      } else {
        clientOrganizationIds = [organizationId];
        console.log('Client organization - using own ID:', clientOrganizationIds);
      }

      const userContext: UserContext = {
        userId: user.id,
        organizationId: organizationId,
        clientOrganizationIds: clientOrganizationIds,
        role: 'user'
      };

      console.log('Executing enhanced ChatGPT-powered natural language query:', query);
      console.log('User context:', userContext);

      const { data, error } = await supabase.functions.invoke('natural-language-query', {
        body: {
          query: query.trim(),
          userContext,
          maxResults: 100
        }
      });

      if (error) {
        console.error('Enhanced ChatGPT edge function error:', error);
        throw error;
      }

      console.log('Enhanced ChatGPT query result:', data);
      
      setLastResult(data);
      return data;
      
    } catch (error) {
      console.error('Enhanced natural language query error:', error);
      const errorResult: QueryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestedQueries: [
          "Show me patients with expired certificates",
          "Find all medical examinations from last month",
          "List workers with vision test results",
          "Show documents pending validation",
          "Find workers with hearing test results",
          "Show compliance overview for this year",
          "List patients with expiring certificates next month",
          "Find workers needing follow-up actions",
          "Show validation statistics",
          "List recent examination trends"
        ]
      };
      
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [getEffectiveOrganizationId, currentOrganization, clientOrganizations]);

  const getSuggestedQueries = useCallback(() => {
    return [
      "Show me patients with expired certificates",
      "Find all medical examinations from last month", 
      "List workers with vision test results",
      "Show documents pending validation",
      "Find workers with hearing test results",
      "Show compliance overview for this year",
      "List patients with expiring certificates next month",
      "Find workers needing follow-up actions",
      "Show validation statistics by document type",
      "List recent examination trends",
      "What's our overall fitness rate?",
      "Show me unvalidated documents needing review"
    ];
  }, []);

  return {
    executeQuery,
    isLoading,
    lastResult,
    getSuggestedQueries
  };
}
