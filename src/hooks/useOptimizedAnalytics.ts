
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useMemo } from "react";

export const useOptimizedAnalytics = (options?: {
  enableExecutiveSummary?: boolean;
  enableTestResults?: boolean;
  enableBenchmarks?: boolean;
  enableRiskAssessment?: boolean;
  enableTrends?: boolean;
  enablePatientHistory?: boolean;
}) => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const {
    enableExecutiveSummary = true,
    enableTestResults = true,
    enableBenchmarks = true,
    enableRiskAssessment = true,
    enableTrends = true,
    enablePatientHistory = true,
  } = options || {};

  // Executive Summary with longer cache time for summary data
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
    enabled: !!organizationId && enableExecutiveSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Test Results Summary with pagination support
  const testResultsSummary = useQuery({
    queryKey: ['test-results-summary', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_test_results_summary')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('total_tests', { ascending: false })
        .limit(50); // Limit initial load
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enableTestResults,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Company Benchmarks with selective loading
  const companyBenchmarks = useQuery({
    queryKey: ['company-health-benchmarks', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_company_health_benchmarks')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('fitness_rate', { ascending: false })
        .limit(20); // Top 20 companies
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enableBenchmarks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Risk Assessment with caching
  const riskAssessment = useQuery({
    queryKey: ['risk-assessment-matrix-refined', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_risk_assessment_matrix_refined')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('test_count', { ascending: false })
        .limit(100); // Limit for performance
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enableRiskAssessment,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 8 * 60 * 1000, // 8 minutes
  });

  // Monthly Trends with date range optimization
  const monthlyTrends = useQuery({
    queryKey: ['monthly-test-trends', organizationId],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data, error } = await supabase
        .from('v_monthly_test_trends')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('test_month', sixMonthsAgo.toISOString())
        .order('test_month', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enableTrends,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Patient Test History with pagination
  const patientTestHistory = useQuery({
    queryKey: ['patient-test-history-recent', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_patient_test_history')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('examination_date', { ascending: false })
        .limit(50); // Reduced from 100
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enablePatientHistory,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });

  // Memoized computed values
  const computedMetrics = useMemo(() => {
    if (!executiveSummary.data) return null;

    const data = executiveSummary.data;
    return {
      healthScorePercentage: Math.round((data.health_score || 0) * 10) / 10,
      completionRateFormatted: `${Math.round((data.overall_completion_rate || 0) * 100)}%`,
      riskDistribution: {
        low: data.low_risk_results || 0,
        medium: data.medium_risk_results || 0,
        high: data.high_risk_results || 0,
      },
      totalRiskTests: (data.low_risk_results || 0) + (data.medium_risk_results || 0) + (data.high_risk_results || 0),
    };
  }, [executiveSummary.data]);

  const isLoading = 
    (enableExecutiveSummary && executiveSummary.isLoading) ||
    (enableTestResults && testResultsSummary.isLoading) ||
    (enableBenchmarks && companyBenchmarks.isLoading) ||
    (enableRiskAssessment && riskAssessment.isLoading) ||
    (enableTrends && monthlyTrends.isLoading) ||
    (enablePatientHistory && patientTestHistory.isLoading);

  const error = 
    executiveSummary.error ||
    testResultsSummary.error ||
    companyBenchmarks.error ||
    riskAssessment.error ||
    monthlyTrends.error ||
    patientTestHistory.error;

  const refetchAll = () => {
    if (enableExecutiveSummary) executiveSummary.refetch();
    if (enableTestResults) testResultsSummary.refetch();
    if (enableBenchmarks) companyBenchmarks.refetch();
    if (enableRiskAssessment) riskAssessment.refetch();
    if (enableTrends) monthlyTrends.refetch();
    if (enablePatientHistory) patientTestHistory.refetch();
  };

  return {
    executiveSummary: executiveSummary.data,
    testResultsSummary: testResultsSummary.data,
    companyBenchmarks: companyBenchmarks.data,
    riskAssessment: riskAssessment.data,
    monthlyTrends: monthlyTrends.data,
    patientTestHistory: patientTestHistory.data,
    computedMetrics,
    isLoading,
    error,
    refetchAll,
    // Individual loading states for selective rendering
    loadingStates: {
      executiveSummary: executiveSummary.isLoading,
      testResultsSummary: testResultsSummary.isLoading,
      companyBenchmarks: companyBenchmarks.isLoading,
      riskAssessment: riskAssessment.isLoading,
      monthlyTrends: monthlyTrends.isLoading,
      patientTestHistory: patientTestHistory.isLoading,
    }
  };
};
