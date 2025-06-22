
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export const useDashboardMetrics = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Certificates expiring in next 30 days
  const certificatesExpiring = useQuery({
    queryKey: ['certificates-expiring', organizationId],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await supabase
        .from('medical_examinations')
        .select('id')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .not('expiry_date', 'is', null)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Pending document reviews
  const pendingReviews = useQuery({
    queryKey: ['pending-reviews', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .in('status', ['pending', 'processing'])
        .eq('validation_status', 'pending');
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Tests conducted this month
  const testsThisMonth = useQuery({
    queryKey: ['tests-this-month', organizationId],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('medical_examinations')
        .select('id')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('examination_date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('examination_date', lastDayOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Tests conducted last month for comparison
  const testsLastMonth = useQuery({
    queryKey: ['tests-last-month', organizationId],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const { data, error } = await supabase
        .from('medical_examinations')
        .select('id')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('examination_date', firstDayOfLastMonth.toISOString().split('T')[0])
        .lte('examination_date', lastDayOfLastMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!organizationId,
    staleTime: 30 * 60 * 1000, // 30 minutes (less frequent updates for historical data)
  });

  // System health based on document processing success rate
  const systemHealth = useQuery({
    queryKey: ['system-health', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('status')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
      
      if (error) throw error;
      if (!data || data.length === 0) return 100;
      
      const processed = data.filter(doc => doc.status === 'processed').length;
      const total = data.length;
      return Math.round((processed / total) * 100);
    },
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Fixed compliance rate calculation
  const complianceRate = useQuery({
    queryKey: ['compliance-rate-fixed', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_examinations')
        .select('fitness_status')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .not('fitness_status', 'is', null);
      
      if (error) throw error;
      if (!data || data.length === 0) return 0;
      
      const compliant = data.filter(exam => 
        exam.fitness_status?.toLowerCase().includes('fit') || 
        exam.fitness_status?.toLowerCase().includes('pass')
      ).length;
      
      return Math.round((compliant / data.length) * 100);
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const isLoading = 
    certificatesExpiring.isLoading ||
    pendingReviews.isLoading ||
    testsThisMonth.isLoading ||
    testsLastMonth.isLoading ||
    systemHealth.isLoading ||
    complianceRate.isLoading;

  const error = 
    certificatesExpiring.error ||
    pendingReviews.error ||
    testsThisMonth.error ||
    testsLastMonth.error ||
    systemHealth.error ||
    complianceRate.error;

  return {
    certificatesExpiring: certificatesExpiring.data || 0,
    pendingReviews: pendingReviews.data || 0,
    testsThisMonth: testsThisMonth.data || 0,
    testsLastMonth: testsLastMonth.data || 0,
    systemHealth: systemHealth.data || 100,
    complianceRate: complianceRate.data || 0,
    isLoading,
    error,
    refetchAll: () => {
      certificatesExpiring.refetch();
      pendingReviews.refetch();
      testsThisMonth.refetch();
      testsLastMonth.refetch();
      systemHealth.refetch();
      complianceRate.refetch();
    }
  };
};
