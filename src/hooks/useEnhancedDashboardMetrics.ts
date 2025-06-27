
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface EnhancedDashboardMetrics {
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
  organizationId: string | null;
  debugInfo: {
    queriedOrgId: string | null;
    isServiceProvider: boolean;
    clientOrganizations: string[];
  };
}

export function useEnhancedDashboardMetrics() {
  const { 
    getEffectiveOrganizationId, 
    currentOrganization, 
    clientOrganizations,
    isServiceProvider 
  } = useOrganization();

  const [metrics, setMetrics] = useState<EnhancedDashboardMetrics>({
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
    lastUpdated: new Date(),
    organizationId: null,
    debugInfo: {
      queriedOrgId: null,
      isServiceProvider: false,
      clientOrganizations: []
    }
  });

  const fetchMetrics = useCallback(async () => {
    const organizationId = getEffectiveOrganizationId();
    
    console.log('🔍 Enhanced Dashboard Metrics Debug Info:');
    console.log('Current Organization:', currentOrganization);
    console.log('Organization ID:', organizationId);
    console.log('Is Service Provider:', isServiceProvider());
    console.log('Client Organizations:', clientOrganizations);
    
    if (!organizationId) {
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: 'No organization selected',
        debugInfo: {
          queriedOrgId: null,
          isServiceProvider: isServiceProvider(),
          clientOrganizations: clientOrganizations.map(c => c.id)
        }
      }));
      return;
    }

    setMetrics(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      organizationId,
      debugInfo: {
        queriedOrgId: organizationId,
        isServiceProvider: isServiceProvider(),
        clientOrganizations: clientOrganizations.map(c => c.id)
      }
    }));

    try {
      console.log('🔍 Fetching dashboard metrics via RPC for organization:', organizationId);

      // For service providers, we need to get metrics for all client organizations
      if (isServiceProvider() && clientOrganizations.length > 0) {
        console.log('📊 Service provider mode - fetching metrics for all clients');
        
        // Get metrics for all client organizations and aggregate them
        const clientMetrics = await Promise.all(
          clientOrganizations.map(async (client) => {
            const { data, error } = await supabase
              .rpc('get_dashboard_metrics', { org_id: client.id });
            
            if (error) {
              console.error(`Error fetching metrics for client ${client.id}:`, error);
              return null;
            }
            
            return data[0];
          })
        );

        // Aggregate the metrics
        const validMetrics = clientMetrics.filter(m => m !== null);
        
        if (validMetrics.length > 0) {
          const aggregated = validMetrics.reduce((acc, curr) => ({
            total_active_employees: (acc.total_active_employees || 0) + (curr.total_active_employees || 0),
            compliance_rate: acc.compliance_rate || 0, // Will recalculate below
            certificates_expiring: (acc.certificates_expiring || 0) + (curr.certificates_expiring || 0),
            tests_this_month: (acc.tests_this_month || 0) + (curr.tests_this_month || 0),
            tests_last_month: (acc.tests_last_month || 0) + (curr.tests_last_month || 0),
            pending_reviews: (acc.pending_reviews || 0) + (curr.pending_reviews || 0),
            system_health: acc.system_health || 0, // Will recalculate below
            missing_records: (acc.missing_records || 0) + (curr.missing_records || 0)
          }), { 
            total_active_employees: 0, 
            compliance_rate: 0, 
            certificates_expiring: 0, 
            tests_this_month: 0, 
            tests_last_month: 0, 
            pending_reviews: 0, 
            system_health: 0, 
            missing_records: 0 
          });

          // Calculate average compliance and system health
          aggregated.compliance_rate = validMetrics.reduce((sum, m) => sum + (m.compliance_rate || 0), 0) / validMetrics.length;
          aggregated.system_health = validMetrics.reduce((sum, m) => sum + (m.system_health || 0), 0) / validMetrics.length;

          setMetrics({
            totalActiveEmployees: Number(aggregated.total_active_employees) || 0,
            complianceRate: Math.round((Number(aggregated.compliance_rate) || 0) * 100) / 100,
            certificatesExpiring: Number(aggregated.certificates_expiring) || 0,
            testsThisMonth: Number(aggregated.tests_this_month) || 0,
            testsLastMonth: Number(aggregated.tests_last_month) || 0,
            pendingReviews: Number(aggregated.pending_reviews) || 0,
            systemHealth: Math.round((Number(aggregated.system_health) || 0) * 100) / 100,
            missingRecords: Number(aggregated.missing_records) || 0,
            clientName: `${currentOrganization?.name || 'Service Provider'} (${validMetrics.length} clients)`,
            loading: false,
            error: null,
            lastUpdated: new Date(),
            organizationId,
            debugInfo: {
              queriedOrgId: organizationId,
              isServiceProvider: isServiceProvider(),
              clientOrganizations: clientOrganizations.map(c => c.id)
            }
          });
        } else {
          throw new Error('No valid metrics data from client organizations');
        }
      } else {
        // Regular organization or single client
        const { data, error } = await supabase
          .rpc('get_dashboard_metrics', { org_id: organizationId });

        if (error) {
          console.error('Dashboard metrics RPC error:', error);
          throw error;
        }

        console.log('📊 Dashboard metrics RPC response:', data);

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
          lastUpdated: new Date(),
          organizationId,
          debugInfo: {
            queriedOrgId: organizationId,
            isServiceProvider: isServiceProvider(),
            clientOrganizations: clientOrganizations.map(c => c.id)
          }
        });
      }

      console.log('✅ Dashboard metrics updated successfully');

    } catch (error) {
      console.error('❌ Error fetching dashboard metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics'
      }));
    }
  }, [getEffectiveOrganizationId, currentOrganization, clientOrganizations, isServiceProvider]);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions for dashboard metrics');
    
    const organizationId = getEffectiveOrganizationId();
    if (!organizationId) return;

    // Subscribe to document changes
    const documentsChannel = supabase
      .channel('dashboard-documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          console.log('📄 Document change detected:', payload);
          // Refresh metrics after a short delay to allow processing
          setTimeout(fetchMetrics, 2000);
        }
      )
      .subscribe();

    // Subscribe to medical examination changes
    const examinationsChannel = supabase
      .channel('dashboard-examinations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_examinations'
        },
        (payload) => {
          console.log('🏥 Medical examination change detected:', payload);
          setTimeout(fetchMetrics, 1000);
        }
      )
      .subscribe();

    // Subscribe to patient changes
    const patientsChannel = supabase
      .channel('dashboard-patients')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('👤 Patient change detected:', payload);
          setTimeout(fetchMetrics, 1000);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions');
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(examinationsChannel);
      supabase.removeChannel(patientsChannel);
    };
  }, [getEffectiveOrganizationId, fetchMetrics]);

  // Initial fetch and organization change handling
  useEffect(() => {
    console.log('🔄 Organization context changed, fetching dashboard metrics...');
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
