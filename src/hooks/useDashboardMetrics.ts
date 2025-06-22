// src/hooks/useDashboardMetrics.ts - COMPLETE VERSION WITH testsLastMonth
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface DashboardMetrics {
  totalActiveEmployees: number;
  complianceRate: number;
  certificatesExpiring: number;
  testsThisMonth: number;
  testsLastMonth: number;        // ✅ Added
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
    testsLastMonth: 0,             // ✅ Added
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
      console.log('🔍 Fetching corrected metrics for organization:', organizationId);

      // Determine organization filter
      const isServiceProvider = organizationId === 'e95df707-d618-4ca4-9e2f-d80359e96622';
      const orgFilter = isServiceProvider 
        ? `organization_id.eq.${organizationId}`
        : `client_organization_id.eq.${organizationId}`;

      // 1. TOTAL PATIENTS
      const { count: patientCount, error: patientError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .or(orgFilter);

      if (patientError) throw patientError;

      // 2. COMPLIANCE RATE - FIXED CALCULATION
      const { data: complianceData, error: complianceError } = await supabase
        .from('certificate_compliance')
        .select('is_compliant, current_expiry_date')
        .or(orgFilter);

      if (complianceError) throw complianceError;

      // Calculate REAL compliance rate
      const totalComplianceRecords = complianceData?.length || 0;
      const compliantRecords = complianceData?.filter(record => {
        if (record.is_compliant === true) return true;
        if (!record.current_expiry_date) return true;
        return new Date(record.current_expiry_date) >= new Date();
      }).length || 0;

      const realComplianceRate = totalComplianceRecords > 0 
        ? (compliantRecords / totalComplianceRecords) * 100 
        : 100;

      console.log('📊 Compliance calculation:', {
        totalRecords: totalComplianceRecords,
        compliantRecords,
        rate: realComplianceRate
      });

      // 3. CERTIFICATES EXPIRING
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const today = new Date();

      const expiringCount = complianceData?.filter(record => {
        if (!record.current_expiry_date) return false;
        const expiryDate = new Date(record.current_expiry_date);
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      }).length || 0;

      // 4. TESTS THIS MONTH - FIXED CALCULATION
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];

      console.log('📅 Searching for tests since:', firstDayOfMonthStr);

      const { count: testsThisMonth, error: testsError } = await supabase
        .from('medical_examinations')
        .select('*', { count: 'exact', head: true })
        .or(orgFilter)
        .gte('examination_date', firstDayOfMonthStr);

      if (testsError) throw testsError;

      console.log('🧪 Tests this month found:', testsThisMonth);

      // 5. TESTS LAST MONTH - NEW CALCULATION ✅
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];
      const thisMonthStr = thisMonth.toISOString().split('T')[0];

      console.log('📅 Searching for last month tests:', lastMonthStr, 'to', thisMonthStr);

      const { count: testsLastMonth, error: lastMonthTestsError } = await supabase
        .from('medical_examinations')
        .select('*', { count: 'exact', head: true })
        .or(orgFilter)
        .gte('examination_date', lastMonthStr)
        .lt('examination_date', thisMonthStr);

      if (lastMonthTestsError) throw lastMonthTestsError;

      console.log('🧪 Tests last month found:', testsLastMonth);

      // 6. PENDING REVIEWS
      const { data: orgPatients, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .or(orgFilter);

      if (patientsError) throw patientsError;

      const patientIds = orgPatients?.map(p => p.id) || [];

      const { count: pendingDocuments, error: docError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .in('owner_id', patientIds)
        .eq('status', 'uploaded');

      if (docError) throw docError;

      // 7. SYSTEM HEALTH - FIXED CALCULATION
      const { data: allDocuments, error: allDocsError } = await supabase
        .from('documents')
        .select('status')
        .in('owner_id', patientIds);

      if (allDocsError) throw allDocsError;

      const totalDocuments = allDocuments?.length || 1;
      const processedDocuments = allDocuments?.filter(doc => doc.status === 'processed').length || 0;
      const realSystemHealth = (processedDocuments / totalDocuments) * 100;

      console.log('🏥 System health calculation:', {
        totalDocs: totalDocuments,
        processedDocs: processedDocuments,
        health: realSystemHealth
      });

      // 8. MISSING RECORDS
      const missingRecords = Math.max(0, (patientCount || 0) - totalComplianceRecords);

      // ✅ FIXED: Update with ALL metrics including testsLastMonth
      setMetrics({
        totalActiveEmployees: patientCount || 0,
        complianceRate: Math.round(realComplianceRate * 100) / 100,
        certificatesExpiring: expiringCount,
        testsThisMonth: testsThisMonth || 0,
        testsLastMonth: testsLastMonth || 0,     // ✅ Added this line
        pendingReviews: pendingDocuments || 0,
        systemHealth: Math.round(realSystemHealth * 100) / 100,
        missingRecords,
        clientName: currentOrganization?.name || 'Unknown Organization',
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      console.log('✅ Updated metrics with corrected calculations including testsLastMonth');

    } catch (error) {
      console.error('❌ Error fetching dashboard metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics'
      }));
    }
  }, [getEffectiveOrganizationId, currentOrganization]);

  // Fetch metrics when organization changes
  useEffect(() => {
    console.log('🔄 Organization changed, fetching corrected metrics...');
    fetchMetrics();
  }, [fetchMetrics]);

  // Refresh function
  const refreshMetrics = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    ...metrics,
    refreshMetrics
  };
}