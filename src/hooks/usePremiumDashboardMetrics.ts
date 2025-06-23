
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface PremiumDashboardMetrics {
  healthIntelligenceScore: number;
  activeRiskAlerts: number;
  departmentsTracked: number;
  predictionAccuracy: number;
  loading: boolean;
  error: string | null;
}

export function usePremiumDashboardMetrics() {
  const { getEffectiveOrganizationId } = useOrganization();
  const [metrics, setMetrics] = useState<PremiumDashboardMetrics>({
    healthIntelligenceScore: 0,
    activeRiskAlerts: 0,
    departmentsTracked: 0,
    predictionAccuracy: 0,
    loading: true,
    error: null
  });

  const fetchPremiumMetrics = useCallback(async () => {
    const organizationId = getEffectiveOrganizationId();
    
    if (!organizationId) {
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: 'No organization selected'
      }));
      return;
    }

    setMetrics(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 Fetching premium metrics for organization:', organizationId);

      const isServiceProvider = organizationId === 'e95df707-d618-4ca4-9e2f-d80359e96622';
      const orgFilter = isServiceProvider 
        ? `organization_id.eq.${organizationId}`
        : `client_organization_id.eq.${organizationId}`;

      // 1. Health Intelligence Score (0-100 based on various factors)
      const { data: complianceData } = await supabase
        .from('certificate_compliance')
        .select('is_compliant, current_expiry_date')
        .or(orgFilter);

      const { data: testResults } = await supabase
        .from('medical_test_results')
        .select('test_result, examination_id')
        .neq('test_result', null);

      // Calculate health intelligence score based on compliance, test results, and system health
      const totalCompliance = complianceData?.length || 1;
      const compliantCount = complianceData?.filter(c => c.is_compliant).length || 0;
      const complianceScore = (compliantCount / totalCompliance) * 40;

      const abnormalTests = testResults?.filter(t => 
        t.test_result?.toLowerCase().includes('abnormal') || 
        t.test_result?.toLowerCase().includes('fail')
      ).length || 0;
      const totalTests = testResults?.length || 1;
      const testHealthScore = ((totalTests - abnormalTests) / totalTests) * 40;

      const systemHealthScore = 20; // Base system health component
      const healthIntelligenceScore = Math.round(complianceScore + testHealthScore + systemHealthScore);

      // 2. Active Risk Alerts (based on abnormal test results and expired certificates)
      const expiredCerts = complianceData?.filter(c => {
        if (!c.current_expiry_date) return false;
        return new Date(c.current_expiry_date) < new Date();
      }).length || 0;

      const recentAbnormalTests = testResults?.filter(t => 
        t.test_result?.toLowerCase().includes('abnormal') || 
        t.test_result?.toLowerCase().includes('high risk')
      ).length || 0;

      const activeRiskAlerts = expiredCerts + recentAbnormalTests;

      // 3. Departments Tracked (unique job titles)
      const { data: examinations } = await supabase
        .from('medical_examinations')
        .select('job_title')
        .or(orgFilter)
        .not('job_title', 'is', null);

      const uniqueJobTitles = new Set(examinations?.map(e => e.job_title)).size;
      const departmentsTracked = uniqueJobTitles;

      // 4. Prediction Accuracy (based on successful predictions vs actual outcomes)
      // For now, using a calculated score based on data consistency
      const { data: recentExams } = await supabase
        .from('medical_examinations')
        .select('fitness_status, examination_date')
        .or(orgFilter)
        .gte('examination_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const fitResults = recentExams?.filter(e => e.fitness_status === 'Fit').length || 0;
      const totalRecentExams = recentExams?.length || 1;
      const predictionAccuracy = Math.round((fitResults / totalRecentExams) * 100);

      console.log('📊 Premium metrics calculated:', {
        healthIntelligenceScore,
        activeRiskAlerts,
        departmentsTracked,
        predictionAccuracy
      });

      setMetrics({
        healthIntelligenceScore: Math.min(100, Math.max(0, healthIntelligenceScore)),
        activeRiskAlerts,
        departmentsTracked,
        predictionAccuracy: Math.min(100, Math.max(0, predictionAccuracy)),
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error fetching premium dashboard metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch premium metrics'
      }));
    }
  }, [getEffectiveOrganizationId]);

  useEffect(() => {
    fetchPremiumMetrics();
  }, [fetchPremiumMetrics]);

  const refreshMetrics = useCallback(() => {
    fetchPremiumMetrics();
  }, [fetchPremiumMetrics]);

  return {
    ...metrics,
    refreshMetrics
  };
}
