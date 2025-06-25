
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useMemo } from "react";

interface OptimizedAnalyticsData {
  total_patients: number;
  total_companies: number;
  total_examinations: number;
  total_fit: number;
  overall_completion_rate: number;
  health_score: number;
  low_risk_results: number;
  medium_risk_results: number;
  high_risk_results: number;
  latest_examination: string | null;
  earliest_examination: string | null;
}

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

  // Main analytics data using RPC
  const optimizedAnalytics = useQuery({
    queryKey: ['optimized-analytics-rpc', organizationId],
    queryFn: async (): Promise<OptimizedAnalyticsData> => {
      if (!organizationId) {
        throw new Error('No organization ID available');
      }

      console.log('Fetching optimized analytics via RPC for organization:', organizationId);

      const { data, error } = await supabase
        .rpc('get_optimized_analytics', { org_id: organizationId });

      if (error) {
        console.error('Optimized analytics RPC error:', error);
        throw error;
      }

      console.log('Optimized analytics RPC response:', data);

      // The RPC function returns an array with one row
      const result = data[0];

      if (!result) {
        return {
          total_patients: 0,
          total_companies: 0,
          total_examinations: 0,
          total_fit: 0,
          overall_completion_rate: 0,
          health_score: 0,
          low_risk_results: 0,
          medium_risk_results: 0,
          high_risk_results: 0,
          latest_examination: null,
          earliest_examination: null,
        };
      }

      return {
        total_patients: Number(result.total_patients) || 0,
        total_companies: Number(result.total_companies) || 0,
        total_examinations: Number(result.total_examinations) || 0,
        total_fit: Number(result.total_fit) || 0,
        overall_completion_rate: Number(result.overall_completion_rate) || 0,
        health_score: Number(result.health_score) || 0,
        low_risk_results: Number(result.low_risk_results) || 0,
        medium_risk_results: Number(result.medium_risk_results) || 0,
        high_risk_results: Number(result.high_risk_results) || 0,
        latest_examination: result.latest_examination,
        earliest_examination: result.earliest_examination,
      };
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
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enableTestResults,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const companyBenchmarks = useQuery({
    queryKey: ['company-health-benchmarks', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_company_health_benchmarks')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('fitness_rate', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enableBenchmarks,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const riskAssessment = useQuery({
    queryKey: ['risk-assessment-matrix-refined', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_risk_assessment_matrix_refined')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('test_count', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enableRiskAssessment,
    staleTime: 3 * 60 * 1000,
    gcTime: 8 * 60 * 1000,
  });

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
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const patientTestHistory = useQuery({
    queryKey: ['patient-test-history-recent', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_patient_test_history')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('examination_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && enablePatientHistory,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  // Memoized computed values based on RPC data
  const computedMetrics = useMemo(() => {
    if (!optimizedAnalytics.data) return null;

    const data = optimizedAnalytics.data;
    return {
      healthScorePercentage: Math.round((data.health_score || 0) * 10) / 10,
      completionRateFormatted: `${Math.round((data.overall_completion_rate || 0))}%`,
      riskDistribution: {
        low: data.low_risk_results || 0,
        medium: data.medium_risk_results || 0,
        high: data.high_risk_results || 0,
      },
      totalRiskTests: (data.low_risk_results || 0) + (data.medium_risk_results || 0) + (data.high_risk_results || 0),
    };
  }, [optimizedAnalytics.data]);

  const isLoading = 
    (enableExecutiveSummary && optimizedAnalytics.isLoading) ||
    (enableTestResults && testResultsSummary.isLoading) ||
    (enableBenchmarks && companyBenchmarks.isLoading) ||
    (enableRiskAssessment && riskAssessment.isLoading) ||
    (enableTrends && monthlyTrends.isLoading) ||
    (enablePatientHistory && patientTestHistory.isLoading);

  const error = 
    optimizedAnalytics.error ||
    testResultsSummary.error ||
    companyBenchmarks.error ||
    riskAssessment.error ||
    monthlyTrends.error ||
    patientTestHistory.error;

  const refetchAll = () => {
    if (enableExecutiveSummary) optimizedAnalytics.refetch();
    if (enableTestResults) testResultsSummary.refetch();
    if (enableBenchmarks) companyBenchmarks.refetch();
    if (enableRiskAssessment) riskAssessment.refetch();
    if (enableTrends) monthlyTrends.refetch();
    if (enablePatientHistory) patientTestHistory.refetch();
  };

  return {
    executiveSummary: optimizedAnalytics.data,
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
      executiveSummary: optimizedAnalytics.isLoading,
      testResultsSummary: testResultsSummary.isLoading,
      companyBenchmarks: companyBenchmarks.isLoading,
      riskAssessment: riskAssessment.isLoading,
      monthlyTrends: monthlyTrends.isLoading,
      patientTestHistory: patientTestHistory.isLoading,
    }
  };
};
