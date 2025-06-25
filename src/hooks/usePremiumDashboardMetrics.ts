
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
      console.log('🔍 Fetching premium dashboard metrics via RPC for organization:', organizationId);

      const { data, error } = await supabase
        .rpc('get_premium_dashboard_metrics', { org_id: organizationId });

      if (error) {
        console.error('Premium dashboard metrics RPC error:', error);
        throw error;
      }

      console.log('📊 Premium dashboard metrics RPC response:', data);

      // The RPC function returns an array with one row
      const result = data[0];

      if (!result) {
        console.log('No premium metrics data returned for organization:', organizationId);
        setMetrics({
          healthIntelligenceScore: 0,
          activeRiskAlerts: 0,
          departmentsTracked: 0,
          predictionAccuracy: 0,
          loading: false,
          error: null
        });
        return;
      }

      setMetrics({
        healthIntelligenceScore: Number(result.health_intelligence_score) || 0,
        activeRiskAlerts: Number(result.active_risk_alerts) || 0,
        departmentsTracked: Number(result.departments_tracked) || 0,
        predictionAccuracy: Number(result.prediction_accuracy) || 0,
        loading: false,
        error: null
      });

      console.log('✅ Premium dashboard metrics updated successfully via RPC');

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
    console.log('🔄 Organization changed, fetching premium metrics via RPC...');
    fetchPremiumMetrics();
  }, [fetchPremiumMetrics]);

  const refreshMetrics = useCallback(() => {
    console.log('🔄 Manual refresh triggered for premium metrics');
    fetchPremiumMetrics();
  }, [fetchPremiumMetrics]);

  return {
    ...metrics,
    refreshMetrics
  };
}
