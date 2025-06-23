
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface BasicAnalyticsData {
  totalPatients: number;
  totalCompanies: number;
  totalExaminations: number;
  totalFit: number;
  completionRate: number;
  certificatesExpiring: number;
  complianceRate: number;
  recentActivityCount: number;
  pendingDocuments: number;
}

export const useBasicAnalytics = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['basic-analytics-rpc', organizationId],
    queryFn: async (): Promise<BasicAnalyticsData> => {
      if (!organizationId) {
        return {
          totalPatients: 0,
          totalCompanies: 0,
          totalExaminations: 0,
          totalFit: 0,
          completionRate: 0,
          certificatesExpiring: 0,
          complianceRate: 0,
          recentActivityCount: 0,
          pendingDocuments: 0,
        };
      }

      console.log('Fetching basic analytics for organization:', organizationId);

      // Call the RPC function to get basic analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_basic_analytics', { org_id: organizationId });

      if (analyticsError) {
        console.error('Analytics RPC error:', analyticsError);
        throw analyticsError;
      }

      console.log('Analytics RPC response:', analyticsData);

      // Get the first row (should only be one for the organization)
      const analytics = analyticsData?.[0];

      if (!analytics) {
        console.log('No analytics data returned for organization:', organizationId);
        return {
          totalPatients: 0,
          totalCompanies: 0,
          totalExaminations: 0,
          totalFit: 0,
          completionRate: 0,
          certificatesExpiring: 0,
          complianceRate: 0,
          recentActivityCount: 0,
          pendingDocuments: 0,
        };
      }

      // Get pending documents count separately
      const { count: pendingDocsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .eq('status', 'uploaded');

      const totalPatients = Number(analytics.total_patients) || 0;
      const totalFit = Number(analytics.total_fit) || 0;
      const complianceRate = totalPatients > 0 ? Math.round((totalFit / totalPatients) * 100) : 100;

      return {
        totalPatients,
        totalCompanies: Number(analytics.total_companies) || 0,
        totalExaminations: Number(analytics.total_examinations) || 0,
        totalFit,
        completionRate: Math.round(Number(analytics.overall_completion_rate) || 0),
        certificatesExpiring: Number(analytics.expiring_certificates) || 0,
        complianceRate,
        recentActivityCount: Number(analytics.recent_activity_count) || 0,
        pendingDocuments: pendingDocsCount || 0,
      };
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 1000,
  });

  return {
    data: data || {
      totalPatients: 0,
      totalCompanies: 0,
      totalExaminations: 0,
      totalFit: 0,
      completionRate: 0,
      certificatesExpiring: 0,
      complianceRate: 0,
      recentActivityCount: 0,
      pendingDocuments: 0,
    },
    isLoading,
    error,
    refetch,
  };
};

// Hook to setup the analytics infrastructure
export const useSetupAnalytics = () => {
  return useQuery({
    queryKey: ['setup-analytics'],
    queryFn: async () => {
      console.log('Setting up basic analytics infrastructure...');
      
      const { data, error } = await supabase.rpc('setup_basic_analytics');
      
      if (error) {
        console.error('Setup analytics error:', error);
        throw error;
      }
      
      console.log('Analytics setup result:', data);
      return data;
    },
    enabled: false, // Only run when manually triggered
    retry: false,
  });
};

// Hook to check analytics health
export const useAnalyticsHealth = () => {
  return useQuery({
    queryKey: ['analytics-health'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_analytics_health');
      
      if (error) {
        console.error('Analytics health check error:', error);
        throw error;
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
