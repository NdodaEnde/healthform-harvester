
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export const useEnhancedAnalytics = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Executive Summary
  const executiveSummary = useQuery({
    queryKey: ['executive-summary-refined', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_executive_summary_refined')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Test Results Summary
  const testResultsSummary = useQuery({
    queryKey: ['test-results-summary', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_test_results_summary')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('total_tests', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Company Health Benchmarks
  const companyBenchmarks = useQuery({
    queryKey: ['company-health-benchmarks', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_company_health_benchmarks')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('fitness_rate', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Risk Assessment Matrix
  const riskAssessment = useQuery({
    queryKey: ['risk-assessment-matrix', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_risk_assessment_matrix_refined')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('test_count', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Monthly Test Trends
  const monthlyTrends = useQuery({
    queryKey: ['monthly-test-trends', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_monthly_test_trends')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('test_month', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Patient Test History
  const patientTestHistory = useQuery({
    queryKey: ['patient-test-history', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_patient_test_history')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('examination_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const isLoading = 
    executiveSummary.isLoading ||
    testResultsSummary.isLoading ||
    companyBenchmarks.isLoading ||
    riskAssessment.isLoading ||
    monthlyTrends.isLoading ||
    patientTestHistory.isLoading;

  const error = 
    executiveSummary.error ||
    testResultsSummary.error ||
    companyBenchmarks.error ||
    riskAssessment.error ||
    monthlyTrends.error ||
    patientTestHistory.error;

  return {
    executiveSummary: executiveSummary.data,
    testResultsSummary: testResultsSummary.data,
    companyBenchmarks: companyBenchmarks.data,
    riskAssessment: riskAssessment.data,
    monthlyTrends: monthlyTrends.data,
    patientTestHistory: patientTestHistory.data,
    isLoading,
    error,
    refetchAll: () => {
      executiveSummary.refetch();
      testResultsSummary.refetch();
      companyBenchmarks.refetch();
      riskAssessment.refetch();
      monthlyTrends.refetch();
      patientTestHistory.refetch();
    }
  };
};
