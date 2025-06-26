
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  queryExplanation?: string;
  executedSQL?: string;
  suggestedQueries?: string[];
  error?: string;
  hint?: string;
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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Build client organization IDs
      let clientOrganizationIds: string[] = [];
      
      if (currentOrganization?.organization_type === 'service_provider') {
        // For service providers, include all client organization IDs
        clientOrganizationIds = clientOrganizations.map(client => client.id);
        console.log('Service provider - client org IDs:', clientOrganizationIds);
      } else {
        // For client organizations, include their own ID
        clientOrganizationIds = [organizationId];
        console.log('Client organization - using own ID:', clientOrganizationIds);
      }

      // Build user context
      const userContext: UserContext = {
        userId: user.id,
        organizationId: organizationId,
        clientOrganizationIds: clientOrganizationIds,
        role: 'user'
      };

      console.log('Executing ChatGPT-powered natural language query:', query);
      console.log('User context:', userContext);

      // Call the upgraded edge function
      const { data, error } = await supabase.functions.invoke('natural-language-query', {
        body: {
          query: query.trim(),
          userContext,
          maxResults: 100
        }
      });

      if (error) {
        console.error('ChatGPT edge function error:', error);
        throw error;
      }

      console.log('ChatGPT query result:', data);
      
      setLastResult(data);
      return data;
      
    } catch (error) {
      console.error('ChatGPT natural language query error:', error);
      const errorResult: QueryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestedQueries: [
          "Show me patients with expired certificates",
          "Find all unfit medical examinations from last month",
          "List workers with vision test failures",
          "Show documents pending validation",
          "Find workers with hearing test failures",
          "Show analytics overview for this year",
          "List patients with expiring certificates next month",
          "Find workers with drug test failures",
          "Show compliance rate by company",
          "List workers needing follow-up actions"
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
      "Find all unfit medical examinations from last month",
      "List workers with vision test failures",
      "Show documents pending validation", 
      "Find workers with hearing test failures",
      "Show analytics overview for this year",
      "List patients with expiring certificates next month",
      "Find workers with drug test failures",
      "Show compliance rate by company",
      "List workers needing follow-up actions",
      "What's our overall fitness rate?",
      "Show me recent examination trends"
    ];
  }, []);

  return {
    executeQuery,
    isLoading,
    lastResult,
    getSuggestedQueries
  };
}
