
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface DashboardMetrics {
  totalActiveEmployees: number;
  complianceRate: number;
  certificatesExpiring: number;
  testsThisMonth: number;
  testsLastMonth: number;
  pendingReviews: number;
  systemHealth: number;
  missingRecords: number;
  clientName: string;
  loading: boolean;
  error: string | null;
  lastUpdated: Date;
}

export function useDashboardMetrics() {
  const { getEffectiveOrganizationId, currentOrganization } = useOrganization();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalActiveEmployees: 0,
    complianceRate: 0,
    certificatesExpiring: 0,
    testsThisMonth: 0,
    testsLastMonth: 0,
    pendingReviews: 0,
    systemHealth: 0,
    missingRecords: 0,
    clientName: 'Loading...',
    loading: true,
    error: null,
    lastUpdated: new Date()
  });

  const fetchMetrics = useCallback(async () => {
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
      console.log('🔍 Fetching dashboard metrics via RPC for organization:', organizationId);

      const { data, error } = await supabase
        .rpc('get_dashboard_metrics', { org_id: organizationId });

      if (error) {
        console.error('Dashboard metrics RPC error:', error);
        throw error;
      }

      console.log('📊 Dashboard metrics RPC response:', data);

      // The RPC function returns an array with one row
      const result = data[0];

      if (!result) {
        console.log('No dashboard metrics data returned for organization:', organizationId);
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: 'No data available for this organization'
        }));
        return;
      }

      setMetrics({
        totalActiveEmployees: Number(result.total_active_employees) || 0,
        complianceRate: Math.round((Number(result.compliance_rate) || 0) * 100) / 100,
        certificatesExpiring: Number(result.certificates_expiring) || 0,
        testsThisMonth: Number(result.tests_this_month) || 0,
        testsLastMonth: Number(result.tests_last_month) || 0,
        pendingReviews: Number(result.pending_reviews) || 0,
        systemHealth: Math.round((Number(result.system_health) || 0) * 100) / 100,
        missingRecords: Number(result.missing_records) || 0,
        clientName: currentOrganization?.name || 'Unknown Organization',
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      console.log('✅ Dashboard metrics updated successfully via RPC');

    } catch (error) {
      console.error('❌ Error fetching dashboard metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics'
      }));
    }
  }, [getEffectiveOrganizationId, currentOrganization]);

  useEffect(() => {
    console.log('🔄 Organization changed, fetching dashboard metrics via RPC...');
    fetchMetrics();
  }, [fetchMetrics]);

  const refreshMetrics = useCallback(() => {
    console.log('🔄 Manual refresh triggered for dashboard metrics');
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    ...metrics,
    refreshMetrics
  };
}
