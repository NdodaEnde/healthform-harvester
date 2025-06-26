
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
  const { getEffectiveOrganizationId, currentOrganization } = useOrganization();

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

      // Build user context
      const userContext: UserContext = {
        userId: user.id,
        organizationId: organizationId,
        clientOrganizationIds: currentOrganization?.organization_type === 'service_provider' 
          ? [] // Will be populated by client relationships
          : [organizationId],
        role: 'user' // This could be enhanced to get actual user role
      };

      console.log('Executing natural language query:', query);
      console.log('User context:', userContext);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('natural-language-query', {
        body: {
          query: query.trim(),
          userContext,
          maxResults: 100
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Query result:', data);
      
      setLastResult(data);
      return data;
      
    } catch (error) {
      console.error('Natural language query error:', error);
      const errorResult: QueryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestedQueries: [
          "Show me patients with expired certificates",
          "Find all unfit medical examinations",
          "List documents pending validation"
        ]
      };
      
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [getEffectiveOrganizationId, currentOrganization]);

  const getSuggestedQueries = useCallback(() => {
    return [
      "Show me patients with expired certificates",
      "Find all unfit medical examinations from last month",
      "List vision test failures",
      "Show documents pending validation", 
      "Find workers with hearing test failures",
      "Show analytics overview",
      "List patients with expiring certificates next month"
    ];
  }, []);

  return {
    executeQuery,
    isLoading,
    lastResult,
    getSuggestedQueries
  };
}
