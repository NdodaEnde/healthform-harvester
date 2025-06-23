
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface BasicAnalyticsData {
  totalPatients: number;
  totalCompanies: number;
  totalExaminations: number;
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
    queryKey: ['basic-analytics', organizationId],
    queryFn: async (): Promise<BasicAnalyticsData> => {
      if (!organizationId) {
        return {
          totalPatients: 0,
          totalCompanies: 0,
          totalExaminations: 0,
          completionRate: 0,
          certificatesExpiring: 0,
          complianceRate: 0,
          recentActivityCount: 0,
          pendingDocuments: 0,
        };
      }

      const isServiceProvider = organizationId === 'e95df707-d618-4ca4-9e2f-d80359e96622';
      const orgFilter = isServiceProvider 
        ? `organization_id.eq.${organizationId}`
        : `client_organization_id.eq.${organizationId}`;

      // Get basic metrics in parallel
      const [
        patientsResult,
        companiesResult,
        examinationsResult,
        complianceResult,
        documentsResult
      ] = await Promise.all([
        // Total patients
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .or(orgFilter),
        
        // Total companies (unique client organizations)
        supabase
          .from('patients')
          .select('client_organization_id')
          .or(orgFilter)
          .not('client_organization_id', 'is', null),
        
        // Total examinations
        supabase
          .from('medical_examinations')
          .select('id', { count: 'exact', head: true })
          .or(orgFilter),
        
        // Compliance data
        supabase
          .from('certificate_compliance')
          .select('is_compliant, current_expiry_date')
          .or(orgFilter),
        
        // Pending documents
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .or(orgFilter)
          .eq('status', 'uploaded')
      ]);

      // Process results
      const totalPatients = patientsResult.count || 0;
      const totalExaminations = examinationsResult.count || 0;
      const pendingDocuments = documentsResult.count || 0;

      // Calculate unique companies
      const uniqueCompanies = new Set(
        companiesResult.data?.map(p => p.client_organization_id).filter(Boolean)
      ).size;

      // Calculate compliance metrics
      const complianceData = complianceResult.data || [];
      const compliantPatients = complianceData.filter(c => c.is_compliant).length;
      const complianceRate = totalPatients > 0 ? Math.round((compliantPatients / totalPatients) * 100) : 100;

      // Calculate certificates expiring in next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const certificatesExpiring = complianceData.filter(c => {
        if (!c.current_expiry_date) return false;
        const expiryDate = new Date(c.current_expiry_date);
        const today = new Date();
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      }).length;

      // Calculate completion rate (examinations vs patients)
      const completionRate = totalPatients > 0 ? Math.round((totalExaminations / totalPatients) * 100) : 0;

      return {
        totalPatients,
        totalCompanies: uniqueCompanies,
        totalExaminations,
        completionRate,
        certificatesExpiring,
        complianceRate,
        recentActivityCount: Math.min(totalExaminations, 10), // Simple recent activity indicator
        pendingDocuments,
      };
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: data || {
      totalPatients: 0,
      totalCompanies: 0,
      totalExaminations: 0,
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
